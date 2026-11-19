import { Prisma } from "@prisma/client";
import { normalizeLeadingSlash } from "@/lib/security";
import {
  isPathRecentlyRolledBack,
  markPathCommitted,
  mintSaveFailureReceiptIfAuthorized,
  verifyPersistedUploadFileExists,
  withImagePathLock,
} from "@/lib/security/upload-coordinator";
import {
  isValidReceiptModulePath,
  type UploadReceiptModule,
} from "@/lib/security/upload-receipt";

export interface LockedCommitOutcome<T> {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly data?: T;
  readonly rollbackToken?: string;
  readonly definiteFailure?: boolean;
}

export async function runLockedUploadCommit<T>(options: {
  readonly adminId: string;
  readonly module: UploadReceiptModule;
  readonly publicPath: string | null | undefined;
  readonly uploadToken: string | null | undefined;
  readonly fallbackError: string;
  readonly uniqueConstraintError?: string;
  readonly operation: () => Promise<LockedCommitOutcome<T>>;
}): Promise<{
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly data?: T;
  readonly rollbackToken?: string;
}> {
  const rawPath = options.publicPath?.trim() || null;
  const shouldLockPath =
    rawPath !== null && isValidReceiptModulePath(options.module, rawPath);
  const normalizedPath = shouldLockPath ? normalizeLeadingSlash(rawPath) : null;

  const execute = async (): Promise<{
    readonly success: boolean;
    readonly message?: string;
    readonly error?: string;
    readonly data?: T;
    readonly rollbackToken?: string;
  }> => {
    if (normalizedPath && isPathRecentlyRolledBack(normalizedPath)) {
      return {
        success: false,
        error: "Berkas gambar baru saja dibatalkan. Silakan unggah ulang gambar.",
      };
    }

    if (normalizedPath && options.uploadToken) {
      const exists = await verifyPersistedUploadFileExists(normalizedPath);
      if (!exists) {
        return {
          success: false,
          error:
            "Berkas gambar unggahan tidak ditemukan di penyimpanan. Silakan unggah ulang.",
        };
      }
    }

    try {
      const outcome = await options.operation();
      if (outcome.success) {
        if (normalizedPath) {
          markPathCommitted(normalizedPath);
        }
        return {
          success: true,
          message: outcome.message,
          data: outcome.data,
        };
      }

      const rollbackToken = outcome.definiteFailure
        ? await mintSaveFailureReceiptIfAuthorized({
            adminId: options.adminId,
            module: options.module,
            publicPath: normalizedPath,
            uploadToken: options.uploadToken,
          })
        : undefined;

      return {
        success: false,
        error: outcome.error || options.fallbackError,
        rollbackToken,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2002" || err.code === "P2003")
      ) {
        const rollbackToken = await mintSaveFailureReceiptIfAuthorized({
          adminId: options.adminId,
          module: options.module,
          publicPath: normalizedPath,
          uploadToken: options.uploadToken,
        });
        return {
          success: false,
          error: options.uniqueConstraintError || err.message,
          rollbackToken,
        };
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : options.fallbackError,
      };
    }
  };

  if (!normalizedPath) {
    return execute();
  }

  return withImagePathLock(normalizedPath, execute);
}

export async function safeDeleteUnreferencedImage(options: {
  readonly publicPath: string | null | undefined;
  readonly isReferenced: (normalizedPath: string) => Promise<boolean>;
  readonly deleteFile: (normalizedPath: string) => Promise<boolean>;
  readonly logLabel: string;
}): Promise<void> {
  const rawPath = options.publicPath?.trim();
  if (!rawPath) return;

  const normalizedPath = normalizeLeadingSlash(rawPath);
  try {
    await withImagePathLock(normalizedPath, async () => {
      const referenced = await options.isReferenced(normalizedPath);
      if (!referenced) {
        await options.deleteFile(normalizedPath);
      }
    });
  } catch (cleanupErr) {
    console.error(options.logLabel, cleanupErr);
  }
}
