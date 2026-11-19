import fs from "node:fs/promises";
import path from "node:path";
import { normalizeLeadingSlash } from "./image-path";
import {
  createSaveFailureReceiptToken,
  isValidReceiptModulePath,
  verifyUploadReceiptToken,
  type UploadReceiptModule,
} from "./upload-receipt";

const MAX_STORE_SIZE = 10_000;
const DEFAULT_TTL_MS = 900_000;

const pathMutexes = new Map<string, Promise<void>>();
const consumedJtis = new Map<string, number>();
const committedPaths = new Map<string, number>();
const rolledBackPaths = new Map<string, number>();

function pruneMap(store: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of store) {
    if (expiresAt <= now) {
      store.delete(key);
    }
  }
  while (store.size >= MAX_STORE_SIZE) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export async function withImagePathLock<T>(
  publicPath: string,
  operation: () => Promise<T>
): Promise<T> {
  const key = normalizeLeadingSlash(publicPath);
  const previous = pathMutexes.get(key) ?? Promise.resolve();

  let releaseCurrent: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  const nextTail = previous.then(() => current, () => current);
  pathMutexes.set(key, nextTail);

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    releaseCurrent();
    if (pathMutexes.get(key) === nextTail) {
      pathMutexes.delete(key);
    }
  }
}

export function consumeReceiptJti(
  jti: string,
  ttlMs = DEFAULT_TTL_MS
): boolean {
  const trimmed = jti.trim();
  if (!trimmed) return false;

  const now = Date.now();
  pruneMap(consumedJtis, now);

  const existing = consumedJtis.get(trimmed);
  if (existing !== undefined && existing > now) {
    return false;
  }

  consumedJtis.set(trimmed, now + ttlMs);
  return true;
}

export function markPathCommitted(
  publicPath: string,
  ttlMs = DEFAULT_TTL_MS
): void {
  const key = normalizeLeadingSlash(publicPath);
  const now = Date.now();
  pruneMap(committedPaths, now);
  committedPaths.set(key, now + ttlMs);
  rolledBackPaths.delete(key);
}

export function isPathRecentlyCommitted(publicPath: string): boolean {
  const key = normalizeLeadingSlash(publicPath);
  const now = Date.now();
  const expiresAt = committedPaths.get(key);
  if (expiresAt === undefined) return false;
  if (expiresAt <= now) {
    committedPaths.delete(key);
    return false;
  }
  return true;
}

export function markPathRolledBack(
  publicPath: string,
  ttlMs = DEFAULT_TTL_MS
): void {
  const key = normalizeLeadingSlash(publicPath);
  const now = Date.now();
  pruneMap(rolledBackPaths, now);
  rolledBackPaths.set(key, now + ttlMs);
}

export function isPathRecentlyRolledBack(publicPath: string): boolean {
  const key = normalizeLeadingSlash(publicPath);
  const now = Date.now();
  const expiresAt = rolledBackPaths.get(key);
  if (expiresAt === undefined) return false;
  if (expiresAt <= now) {
    rolledBackPaths.delete(key);
    return false;
  }
  return true;
}

export async function verifyPersistedUploadFileExists(
  publicPath: string
): Promise<boolean> {
  const normalized = normalizeLeadingSlash(publicPath);
  if (!normalized.startsWith("/uploads/")) return false;

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const relativeSuffix = normalized.slice("/uploads/".length);
  if (!relativeSuffix || relativeSuffix.includes("..") || relativeSuffix.includes("\\")) {
    return false;
  }

  const targetPath = path.join(uploadsRoot, relativeSuffix);
  const relCheck = path.relative(uploadsRoot, targetPath);
  if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) {
    return false;
  }

  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function mintSaveFailureReceiptIfAuthorized(input: {
  readonly adminId: string;
  readonly module: UploadReceiptModule;
  readonly publicPath: string | null | undefined;
  readonly uploadToken: string | null | undefined;
}): Promise<string | undefined> {
  if (!input.publicPath || !input.uploadToken) {
    return undefined;
  }

  if (!isValidReceiptModulePath(input.module, input.publicPath)) {
    return undefined;
  }

  const normalizedPath = normalizeLeadingSlash(input.publicPath);
  if (isPathRecentlyCommitted(normalizedPath)) {
    return undefined;
  }

  const uploadVerified = await verifyUploadReceiptToken(input.uploadToken, {
    adminId: input.adminId,
    module: input.module,
    publicPath: normalizedPath,
  });
  if (!uploadVerified.valid) {
    return undefined;
  }

  return createSaveFailureReceiptToken({
    adminId: input.adminId,
    module: input.module,
    publicPath: normalizedPath,
  });
}

export function resetUploadCoordinatorForTests(): void {
  pathMutexes.clear();
  consumedJtis.clear();
  committedPaths.clear();
  rolledBackPaths.clear();
}
