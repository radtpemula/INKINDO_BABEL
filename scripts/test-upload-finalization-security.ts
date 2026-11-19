import assert from "node:assert";
import { createPartnerAction } from "../lib/admin/partner-actions";
import { rollbackPendingUploadAction } from "../lib/admin/upload-rollback-action";
import { rollbackPendingUploadCore } from "../lib/admin/upload-rollback-core";
import {
  createSaveFailureReceiptToken,
  createUploadReceiptToken,
} from "../lib/security/upload-receipt";
import {
  VALID_1X1_PNG,
  createTrackedFetcher,
  makeImageFile,
  runCheck,
  type CheckCounter,
  type RouteHandler,
} from "./test-upload-on-submit-harness";

export async function runSecurityFinalizationChecks(ctx: {
  readonly counter: CheckCounter;
  readonly adminId: string;
  readonly cookieHeader: string;
  readonly partnerUploadPost: RouteHandler;
  readonly createdPartnerIds: string[];
}): Promise<void> {
  const { counter, adminId, cookieHeader, partnerUploadPost, createdPartnerIds } =
    ctx;

  await runCheck(
    counter,
    "4. Anti-replay JTI, lock TOCTOU tombstone, dan rate limit rollback bekerja sesuai kontrak",
    async () => {
      const fetcher = createTrackedFetcher(partnerUploadPost, cookieHeader);
      const fd = new FormData();
      fd.append(
        "file",
        makeImageFile(VALID_1X1_PNG, "replay.png", "image/png")
      );
      const res = await fetcher("/api/admin/partner-upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        data: { publicPath: string; uploadToken: string };
      };
      const failTok = await createSaveFailureReceiptToken({
        adminId,
        module: "partners",
        publicPath: json.data.publicPath,
      });

      const firstDel = await rollbackPendingUploadAction({
        module: "partners",
        publicPath: json.data.publicPath,
        uploadToken: json.data.uploadToken,
        rollbackToken: failTok,
        saveOutcome: "definite_failure",
      });
      assert.strictEqual(firstDel.deleted, true);

      const replayDel = await rollbackPendingUploadAction({
        module: "partners",
        publicPath: json.data.publicPath,
        uploadToken: json.data.uploadToken,
        rollbackToken: failTok,
        saveOutcome: "definite_failure",
      });
      assert.strictEqual(replayDel.deleted, false);
      assert.strictEqual(replayDel.status, "replayed_token");

      const staleCommit = await createPartnerAction({
        name: "__test_fin_StaleCommit",
        shortName: "SC1",
        logoPath: json.data.publicPath,
        uploadToken: json.data.uploadToken,
      });
      assert.strictEqual(staleCommit.success, false);
      if (staleCommit.success && staleCommit.data) {
        createdPartnerIds.push(staleCommit.data.id);
      }

      const rlPath =
        "/uploads/partners/partner-1799000000009-dddddddddddddddddddddddddddddddd.png";
      const rlUp = await createUploadReceiptToken({
        adminId,
        module: "partners",
        publicPath: rlPath,
      });
      const rlFail = await createSaveFailureReceiptToken({
        adminId,
        module: "partners",
        publicPath: rlPath,
      });
      let rateLimitedSeen = false;
      for (let i = 0; i < 65; i += 1) {
        const attempt = await rollbackPendingUploadCore(
          {
            module: "partners",
            publicPath: rlPath,
            uploadToken: rlUp,
            rollbackToken: rlFail,
            saveOutcome: "definite_failure",
          },
          { reportOrphan: () => {} }
        );
        if (attempt.status === "rate_limited") {
          rateLimitedSeen = true;
          break;
        }
      }
      assert.strictEqual(rateLimitedSeen, true);
    }
  );
}
