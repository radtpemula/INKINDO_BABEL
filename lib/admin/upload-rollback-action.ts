"use server";

import {
  rollbackPendingUploadCore,
  type RollbackPendingUploadInput,
  type RollbackPendingUploadResult,
} from "./upload-rollback-core";

export type {
  FailedSaveOutcome,
  OrphanCandidateEntry,
  RollbackPendingUploadInput,
  RollbackPendingUploadResult,
  RollbackStatus,
} from "./upload-rollback-core";

export async function rollbackPendingUploadAction(
  input: RollbackPendingUploadInput
): Promise<RollbackPendingUploadResult> {
  return rollbackPendingUploadCore(input);
}
