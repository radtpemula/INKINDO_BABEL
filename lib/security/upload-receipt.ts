import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getSessionSecretKey } from "@/lib/auth/session";
import {
  isValidHeroImagePath,
  isValidMemberWorkImagePath,
  isValidNewsCoverImagePath,
  isValidNewsInlineImagePath,
  isValidPartnerLogoPath,
  normalizeLeadingSlash,
} from "./image-path";

export type UploadReceiptModule =
  | "partners"
  | "member-works"
  | "hero"
  | "news-cover"
  | "news-inline";

export type ReceiptTokenKind = "upload_receipt" | "save_failure_receipt";

const DEFAULT_UPLOAD_RECEIPT_TTL_SECONDS = 900;
const RECEIPT_KEY_DOMAIN = "inkindo:upload-receipt-signing-key:v1";

function getUploadReceiptSigningKey(): Uint8Array {
  const sessionKey = getSessionSecretKey();
  return new Uint8Array(
    crypto.createHmac("sha256", sessionKey).update(RECEIPT_KEY_DOMAIN).digest()
  );
}

export interface CreateUploadReceiptInput {
  readonly adminId: string;
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly ttlSeconds?: number;
}

export interface UploadReceiptPayload {
  readonly adminId: string;
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly jti: string;
}

export type VerifyUploadReceiptReason =
  | "MISSING_TOKEN"
  | "INVALID_PATH"
  | "INVALID_OR_EXPIRED_TOKEN"
  | "CLAIM_MISMATCH";

export type VerifyUploadReceiptResult =
  | { readonly valid: true; readonly payload: UploadReceiptPayload }
  | { readonly valid: false; readonly reason: VerifyUploadReceiptReason };

export function isValidReceiptModulePath(
  module: UploadReceiptModule,
  publicPath: string
): boolean {
  switch (module) {
    case "partners":
      return isValidPartnerLogoPath(publicPath, { optional: false });
    case "member-works":
      return isValidMemberWorkImagePath(publicPath, { optional: false });
    case "hero":
      return isValidHeroImagePath(publicPath, { allowDefaultImages: false });
    case "news-cover":
      return isValidNewsCoverImagePath(publicPath);
    case "news-inline":
      return isValidNewsInlineImagePath(publicPath);
    default: {
      const exhaustive: never = module;
      return exhaustive;
    }
  }
}

async function signReceiptToken(
  kind: ReceiptTokenKind,
  input: CreateUploadReceiptInput
): Promise<string> {
  const adminId = input.adminId.trim();
  if (!adminId) {
    throw new Error("Admin ID wajib diisi untuk token kepemilikan unggahan.");
  }
  if (!isValidReceiptModulePath(input.module, input.publicPath)) {
    throw new Error("Jalur berkas tidak valid untuk modul unggahan.");
  }

  const normalizedPath = normalizeLeadingSlash(input.publicPath);
  const ttlSeconds =
    input.ttlSeconds && input.ttlSeconds > 0
      ? Math.floor(input.ttlSeconds)
      : DEFAULT_UPLOAD_RECEIPT_TTL_SECONDS;

  return new SignJWT({
    kind,
    adminId,
    module: input.module,
    publicPath: normalizedPath,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getUploadReceiptSigningKey());
}

async function verifyReceiptToken(
  expectedKind: ReceiptTokenKind,
  token: string,
  expected: {
    readonly adminId: string;
    readonly module: UploadReceiptModule;
    readonly publicPath: string;
  }
): Promise<VerifyUploadReceiptResult> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { valid: false, reason: "MISSING_TOKEN" };
  }

  if (!isValidReceiptModulePath(expected.module, expected.publicPath)) {
    return { valid: false, reason: "INVALID_PATH" };
  }

  const expectedPath = normalizeLeadingSlash(expected.publicPath);

  try {
    const { payload } = await jwtVerify(
      token.trim(),
      getUploadReceiptSigningKey(),
      { algorithms: ["HS256"] }
    );

    if (
      payload.kind !== expectedKind ||
      typeof payload.adminId !== "string" ||
      payload.adminId !== expected.adminId ||
      payload.module !== expected.module ||
      typeof payload.publicPath !== "string" ||
      normalizeLeadingSlash(payload.publicPath) !== expectedPath ||
      typeof payload.jti !== "string" ||
      payload.jti.trim() === ""
    ) {
      return { valid: false, reason: "CLAIM_MISMATCH" };
    }

    return {
      valid: true,
      payload: {
        adminId: payload.adminId,
        module: expected.module,
        publicPath: expectedPath,
        jti: payload.jti,
      },
    };
  } catch {
    return { valid: false, reason: "INVALID_OR_EXPIRED_TOKEN" };
  }
}

export function createUploadReceiptToken(
  input: CreateUploadReceiptInput
): Promise<string> {
  return signReceiptToken("upload_receipt", input);
}

export function verifyUploadReceiptToken(
  token: string,
  expected: {
    readonly adminId: string;
    readonly module: UploadReceiptModule;
    readonly publicPath: string;
  }
): Promise<VerifyUploadReceiptResult> {
  return verifyReceiptToken("upload_receipt", token, expected);
}

export function createSaveFailureReceiptToken(
  input: CreateUploadReceiptInput
): Promise<string> {
  return signReceiptToken("save_failure_receipt", input);
}

export function verifySaveFailureReceiptToken(
  token: string,
  expected: {
    readonly adminId: string;
    readonly module: UploadReceiptModule;
    readonly publicPath: string;
  }
): Promise<VerifyUploadReceiptResult> {
  return verifyReceiptToken("save_failure_receipt", token, expected);
}
