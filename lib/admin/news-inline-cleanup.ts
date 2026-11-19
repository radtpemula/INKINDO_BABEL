import { getCurrentAdmin } from "@/lib/auth/server";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  extractImageSourcesFromHtml,
  isNewsInlineImageReferenced,
  isValidNewsInlineImagePath,
  normalizeLeadingSlash,
  type PrismaReferenceClient,
} from "@/lib/security";
import { checkUploadRateLimit } from "@/lib/security/rate-limit";
import {
  consumeReceiptJti,
  isPathRecentlyCommitted,
  markPathRolledBack,
  withImagePathLock,
} from "@/lib/security/upload-coordinator";
import { verifyUploadReceiptToken } from "@/lib/security/upload-receipt";
import { deleteNewsInlineImageFile } from "@/lib/storage/news";
import { safeDeleteUnreferencedImage } from "./action-upload-guard";
import { defaultReportOrphanCandidate } from "./upload-rollback-modules";

export interface SessionInlineUploadItem {
  readonly publicPath: string;
  readonly uploadToken?: string;
}

export interface CleanupPostSaveInput {
  readonly oldHtml?: string | null;
  readonly newHtml: string;
  readonly sessionUploads?: readonly SessionInlineUploadItem[];
  readonly prisma?: PrismaReferenceClient;
}

export async function cleanupUnusedInlineImagesPostSave(
  input: CleanupPostSaveInput
): Promise<void> {
  const prismaClient = input.prisma ?? defaultPrisma;
  const newSources = new Set(
    extractImageSourcesFromHtml(input.newHtml).map(normalizeLeadingSlash)
  );

  const candidatePaths = new Set<string>();

  if (input.oldHtml) {
    for (const src of extractImageSourcesFromHtml(input.oldHtml)) {
      const norm = normalizeLeadingSlash(src);
      if (isValidNewsInlineImagePath(norm) && !newSources.has(norm)) {
        candidatePaths.add(norm);
      }
    }
  }

  if (input.sessionUploads) {
    for (const upload of input.sessionUploads) {
      const norm = normalizeLeadingSlash(upload.publicPath);
      if (isValidNewsInlineImagePath(norm) && !newSources.has(norm)) {
        candidatePaths.add(norm);
      }
    }
  }

  for (const publicPath of candidatePaths) {
    await safeDeleteUnreferencedImage({
      publicPath,
      isReferenced: (p) => isNewsInlineImageReferenced(p, { prisma: prismaClient }),
      deleteFile: deleteNewsInlineImageFile,
      logLabel: "Gagal membersihkan berkas inline berita pasca-simpan:",
    });
  }
}

export async function cleanupArticleInlineImagesOnDelete(
  articleContent: string,
  prismaClient?: PrismaReferenceClient
): Promise<void> {
  const client = prismaClient ?? defaultPrisma;
  const inlineSources = extractImageSourcesFromHtml(articleContent)
    .map(normalizeLeadingSlash)
    .filter(isValidNewsInlineImagePath);

  for (const publicPath of inlineSources) {
    await safeDeleteUnreferencedImage({
      publicPath,
      isReferenced: (p) => isNewsInlineImageReferenced(p, { prisma: client }),
      deleteFile: deleteNewsInlineImageFile,
      logLabel: "Gagal membersihkan berkas inline berita setelah artikel dihapus:",
    });
  }
}

export interface RollbackDraftInlineItem {
  readonly publicPath: string;
  readonly uploadToken: string;
}

export interface RollbackDraftInlineUploadsResult {
  readonly success: boolean;
  readonly processedCount: number;
  readonly deletedCount: number;
  readonly retainedCount: number;
  readonly error?: string;
}

export async function rollbackDraftInlineUploadsCore(input: {
  readonly uploads: readonly RollbackDraftInlineItem[];
  readonly saveOutcome?: "definite_failure" | "unknown" | "in_flight";
  readonly deps?: {
    readonly getCurrentAdmin?: typeof getCurrentAdmin;
    readonly prisma?: PrismaReferenceClient;
    readonly deleteFile?: (path: string) => Promise<boolean>;
  };
}): Promise<RollbackDraftInlineUploadsResult> {
  try {
    if (input.saveOutcome && input.saveOutcome !== "definite_failure") {
      for (const item of input.uploads) {
        defaultReportOrphanCandidate({
          module: "news-inline",
          publicPath: normalizeLeadingSlash(item.publicPath),
          reason: `Draft rollback rejected due to uncertain saveOutcome: ${input.saveOutcome}`,
          timestamp: new Date().toISOString(),
        });
      }
      return {
        success: true,
        processedCount: input.uploads.length,
        deletedCount: 0,
        retainedCount: input.uploads.length,
      };
    }

    const authFn = input.deps?.getCurrentAdmin ?? getCurrentAdmin;
    const auth = await authFn();
    if (!auth.success) {
      return {
        success: false,
        processedCount: 0,
        deletedCount: 0,
        retainedCount: input.uploads.length,
        error: "Sesi administrator tidak valid atau tidak aktif.",
      };
    }

    const rateLimit = checkUploadRateLimit(`rollback:${auth.user.id}`, {
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.isAllowed) {
      return {
        success: false,
        processedCount: 0,
        deletedCount: 0,
        retainedCount: input.uploads.length,
        error: "Terlalu banyak permintaan pembatalan unggahan.",
      };
    }

    let deletedCount = 0;
    let retainedCount = 0;
    const prismaClient = input.deps?.prisma ?? defaultPrisma;
    const deleteFn = input.deps?.deleteFile ?? deleteNewsInlineImageFile;

    for (const item of input.uploads) {
      if (!isValidNewsInlineImagePath(item.publicPath)) {
        retainedCount++;
        continue;
      }

      const normalized = normalizeLeadingSlash(item.publicPath);

      const verifyResult = await verifyUploadReceiptToken(item.uploadToken, {
        adminId: auth.user.id,
        module: "news-inline",
        publicPath: normalized,
      });

      if (!verifyResult.valid) {
        defaultReportOrphanCandidate({
          module: "news-inline",
          publicPath: normalized,
          reason: `Invalid uploadToken on draft cancel: ${verifyResult.reason}`,
          timestamp: new Date().toISOString(),
        });
        retainedCount++;
        continue;
      }

      const deleted = await withImagePathLock(normalized, async () => {
        if (isPathRecentlyCommitted(normalized)) {
          defaultReportOrphanCandidate({
            module: "news-inline",
            publicPath: normalized,
            reason: "Path was recently committed in another operation",
            timestamp: new Date().toISOString(),
          });
          return false;
        }

        const jtiConsumed = consumeReceiptJti(verifyResult.payload.jti);
        if (!jtiConsumed) {
          defaultReportOrphanCandidate({
            module: "news-inline",
            publicPath: normalized,
            reason: "Upload receipt token jti has already been consumed (replay)",
            timestamp: new Date().toISOString(),
          });
          return false;
        }

        const isReferenced = await isNewsInlineImageReferenced(normalized, {
          prisma: prismaClient,
        });
        if (isReferenced) {
          defaultReportOrphanCandidate({
            module: "news-inline",
            publicPath: normalized,
            reason: "Inline image is referenced by one or more articles",
            timestamp: new Date().toISOString(),
          });
          return false;
        }

        const unlinked = await deleteFn(normalized);
        if (unlinked) {
          markPathRolledBack(normalized);
        }
        return unlinked;
      });

      if (deleted) {
        deletedCount++;
      } else {
        retainedCount++;
      }
    }

    return {
      success: true,
      processedCount: input.uploads.length,
      deletedCount,
      retainedCount,
    };
  } catch (err) {
    return {
      success: false,
      processedCount: 0,
      deletedCount: 0,
      retainedCount: input.uploads.length,
      error: err instanceof Error ? err.message : "Gagal membatalkan unggahan inline.",
    };
  }
}

export const rollbackDraftInlineUploadsAction = rollbackDraftInlineUploadsCore;
export type RollbackDraftInlineUploadsInput = Parameters<typeof rollbackDraftInlineUploadsCore>[0];
