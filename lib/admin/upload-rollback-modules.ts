import { deleteHeroImageFile } from "@/lib/storage/hero";
import { deleteMemberWorkImageFile } from "@/lib/storage/member-work";
import { deleteNewsImageFile, deleteNewsInlineImageFile } from "@/lib/storage/news";
import { deletePartnerLogoFile } from "@/lib/storage/partner";
import {
  isHeroImageReferenced,
  isMemberWorkImageReferenced,
  isNewsCoverImageReferenced,
  isNewsInlineImageReferenced,
  isPartnerLogoReferenced,
  type PrismaReferenceClient,
} from "@/lib/security";
import type { UploadReceiptModule } from "@/lib/security/upload-receipt";

export type FailedSaveOutcome = "definite_failure" | "unknown";

export type RollbackStatus =
  | "deleted"
  | "unknown_outcome_retained"
  | "unauthorized"
  | "rate_limited"
  | "invalid_path"
  | "invalid_token"
  | "missing_failure_proof"
  | "replayed_token"
  | "still_referenced_or_unverified"
  | "file_not_found"
  | "unlink_failed";

export interface OrphanCandidateEntry {
  readonly module: UploadReceiptModule;
  readonly publicPath: string;
  readonly reason: string;
  readonly timestamp: string;
}

export function defaultReportOrphanCandidate(entry: OrphanCandidateEntry): void {
  console.warn("[orphan-candidate]", JSON.stringify(entry));
}

export async function isModuleImageReferenced(
  module: UploadReceiptModule,
  normalizedPath: string,
  prismaClient?: PrismaReferenceClient
): Promise<boolean> {
  switch (module) {
    case "partners":
      return isPartnerLogoReferenced(normalizedPath, { client: prismaClient });
    case "member-works":
      return isMemberWorkImageReferenced(normalizedPath, { client: prismaClient });
    case "hero":
      return isHeroImageReferenced(normalizedPath, { client: prismaClient });
    case "news-cover":
      return isNewsCoverImageReferenced(normalizedPath, { client: prismaClient });
    case "news-inline":
      return isNewsInlineImageReferenced(normalizedPath, { client: prismaClient });
    default: {
      const exhaustive: never = module;
      return exhaustive;
    }
  }
}

export async function defaultDeleteModuleFile(
  module: UploadReceiptModule,
  normalizedPath: string
): Promise<boolean> {
  switch (module) {
    case "partners":
      return deletePartnerLogoFile(normalizedPath);
    case "member-works":
      return deleteMemberWorkImageFile(normalizedPath);
    case "hero":
      return deleteHeroImageFile(normalizedPath);
    case "news-cover":
      return deleteNewsImageFile(normalizedPath);
    case "news-inline":
      return deleteNewsInlineImageFile(normalizedPath);
    default: {
      const exhaustive: never = module;
      return exhaustive;
    }
  }
}
