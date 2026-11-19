import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_DEFERRED_IMAGE_SELECTION,
  executeDeferredSubmit,
  selectDeferredImage,
} from "../components/admin/deferred-image-upload";
import {
  cleanupAbandonedPendingUpload,
  createPendingUploadRecord,
  resetPendingUploadForRetry,
  transitionPendingUploadOutcome,
  type OrphanCandidateReport,
  type PendingUploadRecord,
} from "../components/admin/pending-upload-cleanup";
import { rollbackPendingUploadCore, type OrphanCandidateEntry } from "../lib/admin/upload-rollback-core";
import { createSaveFailureReceiptToken } from "../lib/security/upload-receipt";
import {
  VALID_1X1_PNG,
  createTrackedFetcher,
  createUrlSpy,
  makeImageFile,
  requireString,
  runCheck,
  type CheckCounter,
  type RouteHandler,
} from "./test-upload-on-submit-harness";

export interface UnitCheckContext {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly cookieHeader: string;
  readonly partnerUploadPost: RouteHandler;
}

export async function runFailedSaveUnitChecks(ctx: UnitCheckContext): Promise<void> {
  const { counter, tempRoot, cookieHeader, partnerUploadPost } = ctx;

  await runCheck(counter, "1. Upload gagal: tidak ada file tersimpan dan tidak memanggil rollback", async () => {
    const sel = selectDeferredImage(
      EMPTY_DEFERRED_IMAGE_SELECTION,
      makeImageFile(VALID_1X1_PNG, "fail-up.png", "image/png"),
      createUrlSpy().api
    );
    let pending: PendingUploadRecord | null = null;
    let saveCalled = false;

    const failFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ success: false, error: "Simulasi upload gagal" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });

    const outcome = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: sel,
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: failFetch },
      onImageUploaded: (publicPath, uploadToken) => {
        pending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: async () => {
        saveCalled = true;
        return { success: true, data: { id: "never" } };
      },
    });

    assert.strictEqual(outcome.status, "upload_failed");
    assert.strictEqual(saveCalled, false);
    assert.strictEqual(pending, null);
    const cleanup = await cleanupAbandonedPendingUpload(pending, async () => {
      assert.fail("Rollback tidak boleh dipanggil saat upload gagal");
    });
    assert.strictEqual(cleanup.action, "none");
  });

  await runCheck(counter, "4a. Hasil tidak diketahui (timeout) bersifat sticky dan tidak boleh menghapus file", async () => {
    const sel = selectDeferredImage(
      EMPTY_DEFERRED_IMAGE_SELECTION,
      makeImageFile(VALID_1X1_PNG, "timeout.png", "image/png"),
      createUrlSpy().api
    );
    let pending: PendingUploadRecord | null = null;
    const reports: OrphanCandidateReport[] = [];

    const outcome = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: sel,
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: {
        endpoint: "/api/admin/partner-upload",
        defaultError: "err",
        networkError: "net",
        fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader),
      },
      onImageUploaded: (publicPath, uploadToken) => {
        pending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: async () => {
        throw new Error("Gateway Timeout 504");
      },
    });

    assert.strictEqual(outcome.status, "unexpected_error");
    assert.strictEqual(outcome.saveAttempted, true);
    const uploadedPath = requireString(outcome.resolvedImagePath, "Path harus tersedia setelah upload sukses");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", uploadedPath)), true);

    pending = transitionPendingUploadOutcome(pending, "unknown");
    assert.strictEqual(pending?.saveOutcome, "unknown");
    assert.strictEqual(resetPendingUploadForRetry(pending)?.saveOutcome, "unknown");
    assert.strictEqual(
      transitionPendingUploadOutcome(pending, "definite_failure", "srv-tok")?.saveOutcome,
      "unknown"
    );

    const noFailProof = transitionPendingUploadOutcome(
      createPendingUploadRecord(
        "partners",
        uploadedPath,
        pending?.uploadToken ?? undefined
      ),
      "definite_failure"
    );
    assert.strictEqual(noFailProof?.saveOutcome, "unknown");

    let rollbackInvoked = false;
    const clientCleanup = await cleanupAbandonedPendingUpload(
      pending,
      async () => {
        rollbackInvoked = true;
        throw new Error("Should not run");
      },
      (entry) => reports.push(entry)
    );
    assert.strictEqual(rollbackInvoked, false);
    assert.strictEqual(clientCleanup.action, "retained_unknown_outcome");
    assert.strictEqual(reports.length, 1);

    const serverEntries: OrphanCandidateEntry[] = [];
    const srvFailTok = await createSaveFailureReceiptToken({
      adminId: "admin-test",
      module: "partners",
      publicPath: uploadedPath,
    });
    const serverRes = await rollbackPendingUploadCore(
      {
        module: "partners",
        publicPath: uploadedPath,
        uploadToken: pending?.uploadToken ?? "",
        rollbackToken: srvFailTok,
        saveOutcome: "unknown",
      },
      { reportOrphan: (e) => serverEntries.push(e) }
    );
    assert.strictEqual(serverRes.deleted, false);
    assert.strictEqual(serverRes.status, "unknown_outcome_retained");
    assert.strictEqual(serverRes.retainedAsOrphanCandidate, true);
    assert.strictEqual(serverEntries.length, 1);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", uploadedPath)), true);
  });

  await runCheck(counter, "6. Double-submit saat proses berlangsung tidak menduplikasi upload atau rollback", async () => {
    const lockRef = { current: false };
    const sel = selectDeferredImage(
      EMPTY_DEFERRED_IMAGE_SELECTION,
      makeImageFile(VALID_1X1_PNG, "double.png", "image/png"),
      createUrlSpy().api
    );
    let uploadCount = 0;
    let saveCount = 0;
    let releaseSave: () => void = () => {};
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });

    const uploadConfig = {
      endpoint: "/api/admin/partner-upload",
      defaultError: "err",
      networkError: "net",
      fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
        uploadCount += 1;
      }),
    };

    const firstPromise = executeDeferredSubmit({
      lockRef,
      selection: sel,
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig,
      onImageUploaded: () => {},
      saveRecord: async () => {
        saveCount += 1;
        await saveGate;
        return { success: false, error: "Validasi gagal" };
      },
    });

    const secondPromise = executeDeferredSubmit({
      lockRef,
      selection: sel,
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig,
      onImageUploaded: () => {},
      saveRecord: async () => {
        saveCount += 1;
        return { success: false, error: "Should not run" };
      },
    });

    const second = await secondPromise;
    assert.strictEqual(second.status, "locked");
    releaseSave();
    const first = await firstPromise;
    assert.strictEqual(first.status, "save_failed");
    assert.strictEqual(uploadCount, 1);
    assert.strictEqual(saveCount, 1);
  });
}
