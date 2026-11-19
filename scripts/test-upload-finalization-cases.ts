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
import {
  createHeroSlideAction,
  deleteHeroSlideAction,
  updateHeroSlideAction,
} from "../lib/admin/hero-actions";
import {
  restoreHeroBackgroundDefaultAction,
  updateHeroBackgroundAction,
} from "../lib/admin/hero-settings-actions";
import { rollbackPendingUploadAction } from "../lib/admin/upload-rollback-action";
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

export interface HeroFinalizationContext {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly cookieHeader: string;
  readonly heroUploadPost: RouteHandler;
  readonly createdSlideIds: string[];
}

export async function runHeroFinalizationChecks(
  ctx: HeroFinalizationContext
): Promise<void> {
  const { counter, tempRoot, cookieHeader, heroUploadPost, createdSlideIds } = ctx;

  const fetcher = createTrackedFetcher(heroUploadPost, cookieHeader);
  const uploadConfig = {
    endpoint: "/api/admin/hero-upload",
    defaultError: "err",
    networkError: "net",
    fetchFn: fetcher,
  };
  await runCheck(
    counter,
    "1. Hero Background replace & restore menghapus file lama jika tak direferensikan dan mempertahankan file bersama",
    async () => {
      let bg1 = "";
      const up1 = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(
          EMPTY_DEFERRED_IMAGE_SELECTION,
          makeImageFile(VALID_1X1_PNG, "bg1.png", "image/png"),
          createUrlSpy().api
        ),
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig,
        onImageUploaded: (p, t) => {
          bg1 = p;
          requireString(t, "hero uploadToken wajib diterbitkan");
        },
        saveRecord: (imagePath, uploadToken) =>
          updateHeroBackgroundAction({
            backgroundImagePath: requireString(imagePath, "bg1 path"),
            uploadToken,
          }),
      });
      assert.strictEqual(up1.status, "succeeded");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", bg1)), true);

      let bg2 = "";
      const up2 = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(
          EMPTY_DEFERRED_IMAGE_SELECTION,
          makeImageFile(VALID_1X1_WEBP, "bg2.webp", "image/webp"),
          createUrlSpy().api
        ),
        persistedImagePath: bg1,
        validateForm: () => true,
        uploadConfig,
        onImageUploaded: (p) => {
          bg2 = p;
        },
        saveRecord: (imagePath, uploadToken) =>
          updateHeroBackgroundAction({
            backgroundImagePath: requireString(imagePath, "bg2 path"),
            uploadToken,
          }),
      });
      assert.strictEqual(up2.status, "succeeded");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", bg1)), false);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", bg2)), true);

      const sharedSlide = await createHeroSlideAction({
        title: "__test_fin_SharedSlide",
        description: "Desc",
        imagePath: bg2,
        isActive: false,
      });
      assert.strictEqual(sharedSlide.success, true);
      if (sharedSlide.success && sharedSlide.data) {
        createdSlideIds.push(sharedSlide.data.id);
      }

      const restoreWhileShared = await restoreHeroBackgroundDefaultAction();
      assert.strictEqual(restoreWhileShared.success, true);
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", bg2)), true);

      if (sharedSlide.success && sharedSlide.data) {
        await deleteHeroSlideAction(sharedSlide.data.id);
        assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", bg2)), false);
      }
    }
  );

  await runCheck(
    counter,
    "2. Hero Slide retry tanpa upload ulang & gagal simpan pasti ter-rollback dengan aman",
    async () => {
      let uploads = 0;
      const fetcher = createTrackedFetcher(heroUploadPost, cookieHeader, () => {
        uploads += 1;
      });
      let slidePath: string | null = null;
      let sel = selectDeferredImage(
        EMPTY_DEFERRED_IMAGE_SELECTION,
        makeImageFile(VALID_1X1_PNG, "sl1.png", "image/png"),
        createUrlSpy().api
      );
      let pending: PendingUploadRecord | null = null;

      const failSlide = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: sel,
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/hero-upload",
          defaultError: "err",
          networkError: "net",
          fetchFn: fetcher,
        },
        onImageUploaded: (p, t) => {
          slidePath = p;
          sel = EMPTY_DEFERRED_IMAGE_SELECTION;
          pending = createPendingUploadRecord("hero", p, t);
        },
        saveRecord: (imagePath, uploadToken) =>
          updateHeroSlideAction({
            id: "__missing_slide_id__",
            title: "__test_fin_Missing",
            imagePath: imagePath ?? undefined,
            uploadToken,
          }),
      });
      assert.strictEqual(failSlide.status, "save_failed");
      const failTok =
        failSlide.status === "save_failed" ? failSlide.rollbackToken : undefined;
      requireString(
        failTok,
        "Hero slide gagal simpan pasti wajib menerima rollbackToken"
      );
      assert.strictEqual(
        fs.existsSync(
          path.join(tempRoot, "public", requireString(slidePath, "slidePath"))
        ),
        true
      );

      pending = transitionPendingUploadOutcome(pending, "definite_failure", failTok);
      pending = resetPendingUploadForRetry(pending);
      assert.strictEqual(pending?.saveOutcome, "in_flight");

      const retrySlide = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: sel,
        persistedImagePath: slidePath,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/hero-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: () => assert.fail("Retry Hero Slide tidak boleh upload ulang"),
        saveRecord: (imagePath, uploadToken) =>
          createHeroSlideAction({
            title: "__test_fin_HeroRetry",
            imagePath: requireString(imagePath, "retry slide path"),
            uploadToken,
            isActive: false,
          }),
      });
      assert.strictEqual(retrySlide.status, "succeeded");
      assert.strictEqual(uploads, 1);
      if (retrySlide.status === "succeeded" && retrySlide.data) createdSlideIds.push(retrySlide.data.id);

      let abandonPending: PendingUploadRecord | null = null;
      const fail2 = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, makeImageFile(VALID_1X1_WEBP, "sl2.webp", "image/webp"), createUrlSpy().api),
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: { endpoint: "/api/admin/hero-upload", defaultError: "err", networkError: "net", fetchFn: fetcher },
        onImageUploaded: (p, t) => { abandonPending = createPendingUploadRecord("hero", p, t); },
        saveRecord: (imagePath, uploadToken) =>
          updateHeroSlideAction({ id: "__missing_slide_id_2__", title: "__test_fin_Missing2", imagePath: imagePath ?? undefined, uploadToken }),
      });
      assert.strictEqual(fail2.status, "save_failed");
      const abandonTok = fail2.status === "save_failed" ? fail2.rollbackToken : undefined;
      abandonPending = transitionPendingUploadOutcome(abandonPending, "definite_failure", abandonTok);
      const cleanup = await cleanupAbandonedPendingUpload(abandonPending, rollbackPendingUploadAction);
      assert.strictEqual(cleanup.action, "deleted");
      assert.strictEqual(fs.existsSync(path.join(tempRoot, "public", requireString(slidePath, "slidePath aktif"))), true);
    }
  );
}
