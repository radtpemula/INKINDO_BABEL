import type {
  RollbackPendingUploadInput,
  RollbackPendingUploadResult,
  RollbackStatus,
} from "@/lib/admin/upload-rollback-action";
import type { UploadReceiptModule } from "@/lib/security/upload-receipt";

export type PendingUploadSaveOutcome = "in_flight" | "definite_failure" | "unknown";

export interface PendingUploadRecord {
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly uploadToken: string | null;
  readonly rollbackToken: string | null;
  readonly saveOutcome: PendingUploadSaveOutcome;
}

export interface OrphanCandidateReport {
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly reason: string;
  readonly timestamp: string;
}

export type AbandonedCleanupOutcome =
  | { readonly action: "none" }
  | { readonly action: "deleted"; readonly publicPath: string }
  | { readonly action: "retained_unknown_outcome"; readonly publicPath: string }
  | { readonly action: "retained_in_flight"; readonly publicPath: string }
  | { readonly action: "retained_missing_token"; readonly publicPath: string }
  | {
      readonly action: "retained_server_declined";
      readonly publicPath: string;
      readonly status: RollbackStatus;
    }
  | { readonly action: "retained_rollback_error"; readonly publicPath: string };

export type RollbackActionFn = (
  input: RollbackPendingUploadInput
) => Promise<RollbackPendingUploadResult>;

export type ReportOrphanFn = (report: OrphanCandidateReport) => void;

export function defaultClientOrphanReporter(report: OrphanCandidateReport): void {
  console.warn(
    "[orphan-candidate]",
    JSON.stringify({
      module: report.module,
      publicPath: report.publicPath,
      reason: report.reason,
      timestamp: report.timestamp,
    })
  );
}

export function createPendingUploadRecord(
  module: UploadReceiptModule,
  publicPath: string,
  uploadToken?: string
): PendingUploadRecord {
  return {
    module,
    publicPath,
    uploadToken: uploadToken && uploadToken.trim() ? uploadToken : null,
    rollbackToken: null,
    saveOutcome: "in_flight",
  };
}

export function transitionPendingUploadOutcome(
  current: PendingUploadRecord | null,
  nextOutcome: "definite_failure" | "unknown",
  rollbackToken?: string
): PendingUploadRecord | null {
  if (!current) {
    return null;
  }
  if (current.saveOutcome === "unknown") {
    return current;
  }
  if (nextOutcome === "definite_failure") {
    const trimmedRollback = rollbackToken?.trim();
    if (!trimmedRollback) {
      return {
        ...current,
        rollbackToken: null,
        saveOutcome: "unknown",
      };
    }
    return {
      ...current,
      rollbackToken: trimmedRollback,
      saveOutcome: "definite_failure",
    };
  }
  return {
    ...current,
    rollbackToken: null,
    saveOutcome: "unknown",
  };
}

export function resetPendingUploadForRetry(
  current: PendingUploadRecord | null
): PendingUploadRecord | null {
  if (!current) {
    return null;
  }
  if (current.saveOutcome === "unknown") {
    return current;
  }
  return {
    ...current,
    rollbackToken: null,
    saveOutcome: "in_flight",
  };
}

export async function cleanupAbandonedPendingUpload(
  pending: PendingUploadRecord | null,
  rollbackFn: RollbackActionFn,
  reportFn: ReportOrphanFn = defaultClientOrphanReporter
): Promise<AbandonedCleanupOutcome> {
  if (!pending) {
    return { action: "none" };
  }

  const timestamp = new Date().toISOString();

  if (pending.saveOutcome === "unknown") {
    reportFn({
      module: pending.module,
      publicPath: pending.publicPath,
      reason: "unknown_save_outcome",
      timestamp,
    });
    return { action: "retained_unknown_outcome", publicPath: pending.publicPath };
  }

  if (pending.saveOutcome !== "definite_failure") {
    reportFn({
      module: pending.module,
      publicPath: pending.publicPath,
      reason: "abandoned_while_in_flight",
      timestamp,
    });
    return { action: "retained_in_flight", publicPath: pending.publicPath };
  }

  if (!pending.uploadToken || !pending.rollbackToken) {
    reportFn({
      module: pending.module,
      publicPath: pending.publicPath,
      reason: !pending.uploadToken ? "missing_upload_token" : "missing_failure_proof",
      timestamp,
    });
    return { action: "retained_missing_token", publicPath: pending.publicPath };
  }

  try {
    const result = await rollbackFn({
      module: pending.module,
      publicPath: pending.publicPath,
      uploadToken: pending.uploadToken,
      rollbackToken: pending.rollbackToken,
      saveOutcome: "definite_failure",
    });

    if (result.deleted) {
      return { action: "deleted", publicPath: pending.publicPath };
    }

    if (result.retainedAsOrphanCandidate) {
      reportFn({
        module: pending.module,
        publicPath: pending.publicPath,
        reason: result.status,
        timestamp,
      });
    }

    return {
      action: "retained_server_declined",
      publicPath: pending.publicPath,
      status: result.status,
    };
  } catch {
    reportFn({
      module: pending.module,
      publicPath: pending.publicPath,
      reason: "rollback_call_error",
      timestamp,
    });
    return { action: "retained_rollback_error", publicPath: pending.publicPath };
  }
}
