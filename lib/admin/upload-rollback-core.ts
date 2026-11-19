import { getCurrentAdmin, type AuthResult } from "@/lib/auth/server";
import {
  checkUploadRateLimit,
  normalizeLeadingSlash,
  type PrismaReferenceClient,
} from "@/lib/security";
import {
  consumeReceiptJti,
  isPathRecentlyCommitted,
  markPathRolledBack,
  withImagePathLock,
} from "@/lib/security/upload-coordinator";
import {
  isValidReceiptModulePath,
  verifySaveFailureReceiptToken,
  verifyUploadReceiptToken,
  type UploadReceiptModule,
} from "@/lib/security/upload-receipt";
import {
  defaultDeleteModuleFile,
  defaultReportOrphanCandidate,
  isModuleImageReferenced,
  type FailedSaveOutcome,
  type OrphanCandidateEntry,
  type RollbackStatus,
} from "./upload-rollback-modules";

export type { FailedSaveOutcome, OrphanCandidateEntry, RollbackStatus };
export { defaultReportOrphanCandidate };

export interface RollbackPendingUploadInput {
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly uploadToken: string;
  readonly rollbackToken?: string;
  readonly saveOutcome: FailedSaveOutcome;
}

export interface RollbackPendingUploadResult {
  readonly success: boolean;
  readonly deleted: boolean;
  readonly status: RollbackStatus;
  readonly retainedAsOrphanCandidate: boolean;
  readonly message: string;
}

export interface RollbackDeps {
  readonly getAdmin?: () => Promise<AuthResult>;
  readonly prismaClient?: PrismaReferenceClient;
  readonly deleteFile?: (module: UploadReceiptModule, publicPath: string) => Promise<boolean>;
  readonly reportOrphan?: (entry: OrphanCandidateEntry) => void;
  readonly skipRateLimit?: boolean;
}

function retainOrphanResult(
  reportOrphan: (entry: OrphanCandidateEntry) => void,
  module: UploadReceiptModule,
  publicPath: string,
  reason: string,
  status: RollbackStatus,
  message: string
): RollbackPendingUploadResult {
  reportOrphan({ module, publicPath, reason, timestamp: new Date().toISOString() });
  return { success: false, deleted: false, status, retainedAsOrphanCandidate: true, message };
}

export async function rollbackPendingUploadCore(
  input: RollbackPendingUploadInput,
  deps?: RollbackDeps
): Promise<RollbackPendingUploadResult> {
  const reportOrphan = deps?.reportOrphan ?? defaultReportOrphanCandidate;

  if (input.saveOutcome !== "definite_failure") {
    return retainOrphanResult(
      reportOrphan,
      input.module,
      input.publicPath,
      "unknown_save_outcome",
      "unknown_outcome_retained",
      "Status penyimpanan tidak diketahui; berkas dipertahankan untuk mencegah kehilangan data."
    );
  }

  const auth = await (deps?.getAdmin ?? getCurrentAdmin)();
  if (!auth.success) {
    return retainOrphanResult(
      reportOrphan,
      input.module,
      input.publicPath,
      `auth_${auth.reason.toLowerCase()}`,
      "unauthorized",
      "Sesi admin tidak valid untuk membersihkan unggahan."
    );
  }

  if (!deps?.skipRateLimit) {
    const rate = checkUploadRateLimit(`rollback:${auth.user.id}`, {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rate.isAllowed) {
      return retainOrphanResult(
        reportOrphan,
        input.module,
        input.publicPath,
        "rate_limited",
        "rate_limited",
        "Terlalu banyak permintaan pembersihan unggahan. Berkas dipertahankan sementara."
      );
    }
  }

  if (!isValidReceiptModulePath(input.module, input.publicPath)) {
    return {
      success: false,
      deleted: false,
      status: "invalid_path",
      retainedAsOrphanCandidate: false,
      message: "Jalur gambar tidak valid untuk modul ini.",
    };
  }

  const normalizedPath = normalizeLeadingSlash(input.publicPath);
  const receipt = await verifyUploadReceiptToken(input.uploadToken, {
    adminId: auth.user.id,
    module: input.module,
    publicPath: normalizedPath,
  });
  if (!receipt.valid) {
    return retainOrphanResult(
      reportOrphan,
      input.module,
      normalizedPath,
      `token_${receipt.reason.toLowerCase()}`,
      "invalid_token",
      "Token kepemilikan unggahan tidak valid atau kedaluwarsa; berkas dipertahankan."
    );
  }

  if (!input.rollbackToken || input.rollbackToken.trim() === "") {
    return retainOrphanResult(
      reportOrphan,
      input.module,
      normalizedPath,
      "missing_failure_proof",
      "missing_failure_proof",
      "Bukti kegagalan simpan dari server tidak tersedia; berkas dipertahankan."
    );
  }

  const failureReceipt = await verifySaveFailureReceiptToken(input.rollbackToken, {
    adminId: auth.user.id,
    module: input.module,
    publicPath: normalizedPath,
  });
  if (!failureReceipt.valid) {
    return retainOrphanResult(
      reportOrphan,
      input.module,
      normalizedPath,
      `rollback_token_${failureReceipt.reason.toLowerCase()}`,
      "invalid_token",
      "Token kegagalan simpan tidak valid atau kedaluwarsa; berkas dipertahankan."
    );
  }

  return withImagePathLock(normalizedPath, async () => {
    if (isPathRecentlyCommitted(normalizedPath)) {
      return retainOrphanResult(
        reportOrphan,
        input.module,
        normalizedPath,
        "recently_committed",
        "still_referenced_or_unverified",
        "Berkas baru saja disimpan ke database; berkas dipertahankan."
      );
    }

    if (!consumeReceiptJti(failureReceipt.payload.jti)) {
      return retainOrphanResult(
        reportOrphan,
        input.module,
        normalizedPath,
        "replayed_rollback_token",
        "replayed_token",
        "Token pembersihan sudah pernah digunakan; permintaan ulang ditolak."
      );
    }

    const isReferenced = await isModuleImageReferenced(
      input.module,
      normalizedPath,
      deps?.prismaClient
    );
    if (isReferenced) {
      return retainOrphanResult(
        reportOrphan,
        input.module,
        normalizedPath,
        "still_referenced_or_unverified",
        "still_referenced_or_unverified",
        "Berkas masih direferensikan atau pemeriksaan referensi gagal; berkas dipertahankan."
      );
    }

    const deleteFn = deps?.deleteFile ?? defaultDeleteModuleFile;
    try {
      const deleted = await deleteFn(input.module, normalizedPath);
      if (!deleted) {
        return {
          success: false,
          deleted: false,
          status: "file_not_found",
          retainedAsOrphanCandidate: false,
          message: "Berkas tidak ditemukan atau sudah terhapus.",
        };
      }

      markPathRolledBack(normalizedPath);
      return {
        success: true,
        deleted: true,
        status: "deleted",
        retainedAsOrphanCandidate: false,
        message: "Berkas unggahan yang gagal disimpan berhasil dibersihkan.",
      };
    } catch {
      return retainOrphanResult(
        reportOrphan,
        input.module,
        normalizedPath,
        "unlink_error",
        "unlink_failed",
        "Gagal menghapus berkas sementara; berkas dicatat sebagai kandidat orphan."
      );
    }
  });
}
