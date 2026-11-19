import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  createPartnerAction,
  updatePartnerAction,
  deletePartnerAction,
} from "../lib/admin/partner-actions";
import {
  createMemberWorkAction,
  updateMemberWorkAction,
  deleteMemberWorkAction,
} from "../lib/admin/member-work-actions";
import {
  EMPTY_DEFERRED_IMAGE_SELECTION,
  executeDeferredSubmit,
  selectDeferredImage,
} from "../components/admin/deferred-image-upload";
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

export interface DbCheckContext {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly cookieHeader: string;
  readonly partnerUploadPost: RouteHandler;
  readonly memberWorkUploadPost: RouteHandler;
  readonly createdPartnerIds: string[];
  readonly createdWorkIds: string[];
}

export async function runDeferredDbChecks(ctx: DbCheckContext): Promise<void> {
  const {
    counter,
    tempRoot,
    cookieHeader,
    partnerUploadPost,
    memberWorkUploadPost,
    createdPartnerIds,
    createdWorkIds,
  } = ctx;

  let savedPartnerId = "";
  let savedPartnerLogo = "";
  let savedWorkId = "";
  let savedWorkImage = "";

  await runCheck(
    counter,
    "4. Simpan dengan gambar baru menghasilkan tepat satu upload (Mitra & Karya Anggota)",
    async () => {
      let partnerUploads = 0;
      let partnerSel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_PNG, "partner.png", "image/png"), createUrlSpy().api);
      const partnerOutcome = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: partnerSel,
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader, () => { partnerUploads += 1; }) },
        onImageUploaded: () => { partnerSel = EMPTY_DEFERRED_IMAGE_SELECTION; },
        saveRecord: (logoPath) => createPartnerAction({ name: "__test_uos_Partner_Satu", shortName: "UOS1", category: "Pemerintah", logoPath, isActive: true }),
      });
      assert.strictEqual(partnerOutcome.status, "succeeded");
      assert.strictEqual(partnerUploads, 1);
      const partnerPath = requireString(partnerOutcome.resolvedImagePath, "Path logo mitra wajib terisi.");
      assert.ok(partnerPath.startsWith("/uploads/partners/"));
      savedPartnerId = partnerOutcome.data.id;
      savedPartnerLogo = partnerPath;
      createdPartnerIds.push(savedPartnerId);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", savedPartnerLogo)), true);

      let workUploads = 0;
      const workOutcome = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_WEBP, "work.webp", "image/webp"), createUrlSpy().api),
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/member-work-upload", defaultError: "err", networkError: "net", fetchFn: createTrackedFetcher(memberWorkUploadPost, cookieHeader, () => { workUploads += 1; }) },
        onImageUploaded: () => {},
        saveRecord: (imagePath) => createMemberWorkAction({ title: "__test_uos_Karya_Satu", category: "Studi & Kajian", company: "PT Uji Coba", year: "2026", imagePath, isActive: true }),
      });
      assert.strictEqual(workOutcome.status, "succeeded");
      assert.strictEqual(workUploads, 1);
      const workPath = requireString(workOutcome.resolvedImagePath, "Path karya wajib terisi.");
      assert.ok(workPath.startsWith("/uploads/member-works/"));
      savedWorkId = workOutcome.data.id;
      savedWorkImage = workPath;
      createdWorkIds.push(savedWorkId);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", savedWorkImage)), true);
    }
  );

  await runCheck(
    counter,
    "5. Edit tanpa gambar baru mempertahankan gambar lama tanpa request upload",
    async () => {
      requireString(savedPartnerId, "Partner harus berhasil dibuat terlebih dahulu.");
      requireString(savedWorkId, "MemberWork harus berhasil dibuat terlebih dahulu.");
      let uploads = 0;
      const fetcher = createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
        uploads += 1;
      });
      const partnerEdit = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: EMPTY_DEFERRED_IMAGE_SELECTION,
        persistedImagePath: savedPartnerLogo,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: () => assert.fail("Tidak boleh upload"),
        saveRecord: (logoPath) => updatePartnerAction({ id: savedPartnerId, name: "__test_uos_Partner_Edit", logoPath }),
      });
      assert.strictEqual(partnerEdit.status, "succeeded");
      assert.strictEqual(partnerEdit.data.logoPath, savedPartnerLogo);

      const workEdit = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: EMPTY_DEFERRED_IMAGE_SELECTION,
        persistedImagePath: savedWorkImage,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/member-work-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: () => assert.fail("Tidak boleh upload"),
        saveRecord: (imagePath) => updateMemberWorkAction({ id: savedWorkId, title: "__test_uos_Karya_Edit", imagePath }),
      });
      assert.strictEqual(workEdit.status, "succeeded");
      assert.strictEqual(workEdit.data.imagePath, savedWorkImage);
      assert.strictEqual(uploads, 0);
    }
  );

  await runCheck(
    counter,
    "7. Server Action gagal tidak menghapus gambar & retry tidak upload ulang",
    async () => {
      let uploadCalls = 0;
      let persistedPath: string | null = null;
      let selection = selectDeferredImage(
        EMPTY_DEFERRED_IMAGE_SELECTION,
        makeImageFile(VALID_1X1_PNG, "retry.png", "image/png"),
        createUrlSpy().api
      );
      const fetcher = createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
        uploadCalls += 1;
      });
      const firstTry = await executeDeferredSubmit({
        lockRef: { current: false },
        selection,
        persistedImagePath: persistedPath,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: (publicPath) => {
          persistedPath = publicPath;
          selection = EMPTY_DEFERRED_IMAGE_SELECTION;
        },
        saveRecord: () => createPartnerAction({ name: "", shortName: "FAIL", logoPath: persistedPath }),
      });
      assert.strictEqual(firstTry.status, "save_failed");
      assert.strictEqual(uploadCalls, 1);
      const uploadedPath = requireString(persistedPath, "Path terunggah harus tersimpan untuk retry.");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", uploadedPath)), true);

      const retryTry = await executeDeferredSubmit({
        lockRef: { current: false },
        selection,
        persistedImagePath: uploadedPath,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: () => assert.fail("Retry tidak boleh upload ulang"),
        saveRecord: (logoPath) => createPartnerAction({ name: "__test_uos_Partner_Retry", shortName: "RETRY", logoPath }),
      });
      assert.strictEqual(retryTry.status, "succeeded");
      assert.strictEqual(uploadCalls, 1);
      assert.strictEqual(retryTry.data.logoPath, uploadedPath);
      createdPartnerIds.push(retryTry.data.id);
    }
  );

  await runCheck(
    counter,
    "10. Tidak ada regresi reference-aware deletion Fase 2 (Mitra & Karya Anggota)",
    async () => {
      requireString(savedPartnerId, "Partner harus ada.");
      requireString(savedWorkId, "MemberWork harus ada.");
      const sharedPartner = await createPartnerAction({
        name: "__test_uos_Partner_Shared",
        shortName: "SHD",
        logoPath: savedPartnerLogo,
      });
      assert.ok(sharedPartner.success && sharedPartner.data);
      createdPartnerIds.push(sharedPartner.data.id);

      await deletePartnerAction(savedPartnerId);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", savedPartnerLogo)), true);
      await deletePartnerAction(sharedPartner.data.id);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", savedPartnerLogo)), false);

      const workReplace = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(
          EMPTY_DEFERRED_IMAGE_SELECTION,
          makeImageFile(VALID_1X1_PNG, "new-work.png", "image/png"),
          createUrlSpy().api
        ),
        persistedImagePath: savedWorkImage,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/member-work-upload",
          defaultError: "err",
          networkError: "net",
          fetchFn: createTrackedFetcher(memberWorkUploadPost, cookieHeader),
        },
        onImageUploaded: () => {},
        saveRecord: (imagePath) => updateMemberWorkAction({ id: savedWorkId, imagePath }),
      });
      assert.strictEqual(workReplace.status, "succeeded");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", savedWorkImage)), false);
      const replacedPath = requireString(workReplace.resolvedImagePath, "Path pengganti wajib ada.");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", replacedPath)), true);
      await deleteMemberWorkAction(savedWorkId);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", replacedPath)), false);
    }
  );
}
