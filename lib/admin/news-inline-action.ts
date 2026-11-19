"use server";

import {
  rollbackDraftInlineUploadsCore,
  type RollbackDraftInlineItem,
  type RollbackDraftInlineUploadsResult,
} from "./news-inline-cleanup";

export async function rollbackDraftInlineUploadsAction(input: {
  readonly uploads: readonly RollbackDraftInlineItem[];
  readonly saveOutcome?: "definite_failure" | "unknown" | "in_flight";
}): Promise<RollbackDraftInlineUploadsResult> {
  return rollbackDraftInlineUploadsCore(input);
}
