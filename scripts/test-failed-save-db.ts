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
  type PendingUploadRecord,
} from "../components/admin/pending-upload-cleanup";
import { createPartnerAction, updatePartnerAction } from "../lib/admin/partner-actions";
import { createMemberWorkAction } from "../lib/admin/member-work-actions";
import { rollbackPendingUploadAction } from "../lib/admin/upload-rollback-action";
import { createSaveFailureReceiptToken } from "../lib/security/upload-receipt";
import {
  VALID_1X1_PNG,
  VALID_1X1_WEBP,
  createTrackedFetcher,
  createUrlSpy,
  makeImageFile,
  requireString,
  runCheck,
  type CheckCounter,
  type RouteHandler,
} from "./test-upload-on-submit-harness";

export interface FailedSaveDbContext {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly adminId: string;
  readonly cookieHeader: string;
  readonly partnerUploadPost: RouteHandler;
  readonly memberWorkUploadPost: RouteHandler;
  readonly createdPartnerIds: string[];
  readonly createdWorkIds: string[];
}

export async function runFailedSaveDbChecks(ctx: FailedSaveDbContext): Promise<void> {
  const { counter, tempRoot, cookieHeader, partnerUploadPost, memberWorkUploadPost, createdPartnerIds, createdWorkIds } = ctx;
  let activePartnerId = "";
  let activePartnerLogo = "";
  let activeWorkImage = "";

  await runCheck(counter, "2 & 10. Upload + Server Action sukses menyimpan file aktif dengan utuh", async () => {
    const pOutcome = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "act-p.png", "image/png"), createUrlSpy().api),
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: (_p, tok) => { requireString(tok, "uploadToken wajib diterbitkan server"); },
      saveRecord: (logoPath) => createPartnerAction({ name: "__test_fs_Active_Partner", shortName: "FSA1", category: "Pemerintah", logoPath }),
    });
    assert.strictEqual(pOutcome.status, "succeeded");
    activePartnerId = pOutcome.data.id;
    activePartnerLogo = requireString(pOutcome.resolvedImagePath, "Logo aktif wajib ada");
    createdPartnerIds.push(activePartnerId);

    const wOutcome = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_WEBP, "act-w.webp", "image/webp"), createUrlSpy().api),
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/member-work-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(memberWorkUploadPost, cookieHeader) },
      onImageUploaded: (_p, tok) => { requireString(tok, "uploadToken wajib diterbitkan server"); },
      saveRecord: (imagePath) => createMemberWorkAction({ title: "__test_fs_Active_Work", category: "Studi & Kajian", company: "PT Uji Aktif", year: "2026", imagePath }),
    });
    assert.strictEqual(wOutcome.status, "succeeded");
    activeWorkImage = requireString(wOutcome.resolvedImagePath, "Gambar karya aktif wajib ada");
    createdWorkIds.push(wOutcome.data.id);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", activePartnerLogo)), true);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", activeWorkImage)), true);
  });

  await runCheck(counter, "3. Upload sukses + Server Action gagal pasti -> cancel/abandon membersihkan file baru saja", async () => {
    let pPending: PendingUploadRecord | null = null;
    const pFail = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "fail-p.png", "image/png"), createUrlSpy().api),
      persistedImagePath: activePartnerLogo,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: (publicPath, uploadToken) => {
        pPending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: (logoPath, uploadToken) =>
        updatePartnerAction({ id: activePartnerId, name: "", logoPath, uploadToken }),
    });
    assert.strictEqual(pFail.status, "save_failed");
    const pFailToken = pFail.status === "save_failed" ? pFail.rollbackToken : undefined;
    requireString(pFailToken, "Server wajib menerbitkan rollbackToken pada gagal simpan pasti");
    pPending = transitionPendingUploadOutcome(pPending, "definite_failure", pFailToken);
    const newLogoPath = requireString(pFail.resolvedImagePath, "Path baru harus terunggah");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", newLogoPath)), true);

    const pCleanup = await cleanupAbandonedPendingUpload(pPending, rollbackPendingUploadAction);
    assert.strictEqual(pCleanup.action, "deleted");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", newLogoPath)), false);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", activePartnerLogo)), true);

    let wPending: PendingUploadRecord | null = null;
    const wFail = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_WEBP, "fail-w.webp", "image/webp"), createUrlSpy().api),
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/member-work-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(memberWorkUploadPost, cookieHeader) },
      onImageUploaded: (publicPath, uploadToken) => {
        wPending = createPendingUploadRecord("member-works", publicPath, uploadToken);
      },
      saveRecord: (imagePath, uploadToken) =>
        createMemberWorkAction({ title: "", category: "Studi & Kajian", company: "PT", year: "2026", imagePath, uploadToken }),
    });
    assert.strictEqual(wFail.status, "save_failed");
    const wFailToken = wFail.status === "save_failed" ? wFail.rollbackToken : undefined;
    requireString(wFailToken, "Server wajib menerbitkan rollbackToken untuk karya");
    wPending = transitionPendingUploadOutcome(wPending, "definite_failure", wFailToken);
    const newWorkPath = requireString(wFail.resolvedImagePath, "Path karya gagal harus ada");
    const wCleanup = await cleanupAbandonedPendingUpload(wPending, rollbackPendingUploadAction);
    assert.strictEqual(wCleanup.action, "deleted");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", newWorkPath)), false);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", activeWorkImage)), true);
  });

  await runCheck(counter, "4b. Timeout setelah DB sebenarnya commit tetap mempertahankan file aktif", async () => {
    let pending: PendingUploadRecord | null = null;
    const outcome = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "late-commit.png", "image/png"), createUrlSpy().api),
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: (publicPath, uploadToken) => {
        pending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: async (logoPath) => {
        const res = await createPartnerAction({ name: "__test_fs_LateCommit", shortName: "LC1", logoPath });
        if (res.success && res.data) {
          createdPartnerIds.push(res.data.id);
        }
        throw new Error("Socket hang up after commit");
      },
    });
    assert.strictEqual(outcome.status, "unexpected_error");
    assert.strictEqual(outcome.saveAttempted, true);
    pending = transitionPendingUploadOutcome(pending, "unknown");
    const cleanup = await cleanupAbandonedPendingUpload(pending, rollbackPendingUploadAction, () => {});
    assert.strictEqual(cleanup.action, "retained_unknown_outcome");
    const committedPath = requireString(outcome.resolvedImagePath, "Path commit harus tetap utuh");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", committedPath)), true);
  });

  await runCheck(counter, "5. Retry sukses tanpa upload ulang & retry timeout mengunci status unknown", async () => {
    let uploadCalls = 0;
    let persistedPath: string | null = null;
    let pending: PendingUploadRecord | null = null;
    let sel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "retry.png", "image/png"), createUrlSpy().api);
    const fetcher = createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
      uploadCalls += 1;
    });

    const first = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: sel,
      persistedImagePath: persistedPath,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
      onImageUploaded: (publicPath, uploadToken) => {
        persistedPath = publicPath;
        sel = EMPTY_DEFERRED_IMAGE_SELECTION;
        pending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: (_logoPath, uploadToken) =>
        createPartnerAction({ name: "", shortName: "RT1", logoPath: persistedPath, uploadToken }),
    });
    assert.strictEqual(first.status, "save_failed");
    const firstFailTok = first.status === "save_failed" ? first.rollbackToken : undefined;
    pending = transitionPendingUploadOutcome(pending, "definite_failure", firstFailTok);
    pending = resetPendingUploadForRetry(pending);
    assert.strictEqual(pending?.saveOutcome, "in_flight");

    const second = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: sel,
      persistedImagePath: persistedPath,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
      onImageUploaded: () => assert.fail("Retry tidak boleh upload ulang"),
      saveRecord: (logoPath) => createPartnerAction({ name: "__test_fs_Retry_Success", shortName: "RT2", logoPath }),
    });
    assert.strictEqual(second.status, "succeeded");
    assert.strictEqual(uploadCalls, 1);
    createdPartnerIds.push(second.data.id);
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", requireString(persistedPath, "Path retry"))), true);

    let timeoutPending: PendingUploadRecord | null = null;
    let timeoutPath = "";
    let timeoutSel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "retry-to.png", "image/png"), createUrlSpy().api);
    const firstFail = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: timeoutSel,
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: (publicPath, uploadToken) => {
        timeoutPath = publicPath;
        timeoutSel = EMPTY_DEFERRED_IMAGE_SELECTION;
        timeoutPending = createPendingUploadRecord("partners", publicPath, uploadToken);
      },
      saveRecord: (_logoPath, uploadToken) =>
        createPartnerAction({ name: "", shortName: "RT3", logoPath: timeoutPath, uploadToken }),
    });
    assert.strictEqual(firstFail.status, "save_failed");
    const retryFailTok = firstFail.status === "save_failed" ? firstFail.rollbackToken : undefined;
    timeoutPending = transitionPendingUploadOutcome(timeoutPending, "definite_failure", retryFailTok);
    timeoutPending = resetPendingUploadForRetry(timeoutPending);

    const retryTimeout = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: timeoutSel,
      persistedImagePath: timeoutPath,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: () => assert.fail("Retry tidak boleh upload ulang"),
      saveRecord: async () => { throw new Error("Timeout saat retry"); },
    });
    assert.strictEqual(retryTimeout.status, "unexpected_error");
    assert.strictEqual(retryTimeout.saveAttempted, true);
    timeoutPending = transitionPendingUploadOutcome(timeoutPending, "unknown");
    const afterTimeout = await cleanupAbandonedPendingUpload(timeoutPending, rollbackPendingUploadAction, () => {});
    assert.strictEqual(afterTimeout.action, "retained_unknown_outcome");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", timeoutPath)), true);
  });

  await runCheck(counter, "7. Gambar yang masih direferensikan record lain tidak dihapus oleh rollback", async () => {
    let pending: PendingUploadRecord | null = null;
    let uploadedPath = "";
    const first = await executeDeferredSubmit({
      lockRef: { current: false },
      selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "shared.png", "image/png"), createUrlSpy().api),
      persistedImagePath: null,
      validateForm: () => true,
      uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader) },
      onImageUploaded: (publicPath, uploadToken) => { uploadedPath = publicPath; pending = createPendingUploadRecord("partners", publicPath, uploadToken); },
      saveRecord: async (logoPath) => {
        const created = await createPartnerAction({ name: "__test_fs_Shared_Owner", shortName: "SH1", logoPath });
        if (created.success && created.data) createdPartnerIds.push(created.data.id);
        return {
          success: false,
          error: "Simulasi gagal setelah referensi tercipta",
          rollbackToken: await createSaveFailureReceiptToken({ adminId: ctx.adminId, module: "partners", publicPath: requireString(logoPath, "logoPath wajib ada") }),
        };
      },
    });
    assert.strictEqual(first.status, "save_failed");
    const sharedTok = first.status === "save_failed" ? first.rollbackToken : undefined;
    pending = transitionPendingUploadOutcome(pending, "definite_failure", sharedTok);
    const cleanup = await cleanupAbandonedPendingUpload(pending, rollbackPendingUploadAction, () => {});
    assert.strictEqual(cleanup.action, "retained_server_declined");
    if (cleanup.action === "retained_server_declined") assert.strictEqual(cleanup.status, "still_referenced_or_unverified");
    assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", uploadedPath)), true);
  });
}
