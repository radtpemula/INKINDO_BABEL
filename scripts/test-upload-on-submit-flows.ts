import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_DEFERRED_IMAGE_SELECTION,
  MAX_DEFERRED_IMAGE_SIZE_BYTES,
  clearDeferredImage,
  defaultObjectUrlApi,
  executeDeferredSubmit,
  selectDeferredImage,
  validateClientImageFile,
} from "../components/admin/deferred-image-upload";
import { revokePreviewRef } from "../components/admin/use-deferred-image-upload";
import {
  CLIENT_IMAGE_MESSAGES,
  VALID_1X1_PNG,
  VALID_1X1_WEBP,
  createTrackedFetcher,
  createUrlSpy,
  makeImageFile,
  runCheck,
  type CheckCounter,
  type RouteHandler,
} from "./test-upload-on-submit-harness";

export async function runDeferredFlowChecks(
  counter: CheckCounter,
  tempRoot: string,
  partnerUploadPost: RouteHandler,
  cookieHeader: string
): Promise<void> {
  await runCheck(
    counter,
    "1. Memilih gambar tidak mengirim request upload (Mitra & Karya Anggota)",
    () => {
      const spy = createUrlSpy();
      const file = makeImageFile(VALID_1X1_PNG, "logo.png", "image/png");
      assert.strictEqual(validateClientImageFile(file, CLIENT_IMAGE_MESSAGES), null);
      const sel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, file, spy.api);
      assert.strictEqual(sel.file, file);
      assert.strictEqual(sel.previewUrl, "blob:mock-1");
      assert.strictEqual(spy.created.length, 1);
      assert.strictEqual(fs.readdirSync(path.join(tempRoot, "public", "uploads", "partners")).length, 0);
      assert.strictEqual(fs.readdirSync(path.join(tempRoot, "public", "uploads", "member-works")).length, 0);
    }
  );

  await runCheck(
    counter,
    "2. Mengganti gambar A ke B sebelum Simpan tidak mengirim upload A & merevoke URL A",
    () => {
      const spy = createUrlSpy();
      const fileA = makeImageFile(VALID_1X1_PNG, "a.png", "image/png");
      const fileB = makeImageFile(VALID_1X1_WEBP, "b.webp", "image/webp");
      const selA = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, fileA, spy.api);
      const selB = selectDeferredImage(selA, fileB, spy.api);
      assert.strictEqual(selB.file, fileB);
      assert.strictEqual(selB.previewUrl, "blob:mock-2");
      assert.deepStrictEqual(spy.revoked, ["blob:mock-1"]);
      assert.strictEqual(fs.readdirSync(path.join(tempRoot, "public", "uploads", "partners")).length, 0);
    }
  );

  await runCheck(
    counter,
    "3. Cancel atau close modal tidak menghasilkan upload & membersihkan preview URL",
    () => {
      const spy = createUrlSpy();
      const fileA = makeImageFile(VALID_1X1_PNG, "cancel.png", "image/png");
      const sel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, fileA, spy.api);
      const cleared = clearDeferredImage(sel, spy.api);
      assert.deepStrictEqual(cleared, EMPTY_DEFERRED_IMAGE_SELECTION);
      assert.deepStrictEqual(spy.revoked, ["blob:mock-1"]);
      assert.strictEqual(fs.readdirSync(path.join(tempRoot, "public", "uploads", "member-works")).length, 0);
    }
  );

  await runCheck(
    counter,
    "6. Upload gagal menghentikan proses sebelum Server Action dijalankan",
    async () => {
      let uploadCalls = 0;
      let saveCalls = 0;
      const corruptFile = makeImageFile(Buffer.from("bukan-gambar-valid"), "bad.png", "image/png");
      const outcome = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, corruptFile, createUrlSpy().api),
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/partner-upload",
          defaultError: "Gagal",
          networkError: "Net",
          fetchFn: createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
            uploadCalls += 1;
          }),
        },
        onImageUploaded: () => assert.fail("Tidak boleh dipanggil saat upload gagal"),
        saveRecord: async () => {
          saveCalls += 1;
          return { success: true, data: "never" };
        },
      });
      assert.strictEqual(outcome.status, "upload_failed");
      assert.strictEqual(uploadCalls, 1);
      assert.strictEqual(saveCalls, 0);
    }
  );

  await runCheck(
    counter,
    "8. Double-submit & validasi gagal tidak menghasilkan dua upload",
    async () => {
      const lockRef = { current: false };
      let uploadCalls = 0;
      let saveCalls = 0;

      const invalidGate = await executeDeferredSubmit({
        lockRef,
        selection: selectDeferredImage(
          EMPTY_DEFERRED_IMAGE_SELECTION,
          makeImageFile(VALID_1X1_PNG, "v.png", "image/png"),
          createUrlSpy().api
        ),
        persistedImagePath: null,
        validateForm: () => false,
        uploadConfig: { endpoint: "/api/admin/partner-upload", defaultError: "err", networkError: "net" },
        onImageUploaded: () => {},
        saveRecord: async () => {
          saveCalls += 1;
          return { success: true, data: "x" };
        },
      });
      assert.strictEqual(invalidGate.status, "validation_failed");
      assert.strictEqual(lockRef.current, false);

      const slowFetcher: typeof fetch = async (input, init) => {
        await new Promise((resolve) => setTimeout(resolve, 25));
        return createTrackedFetcher(partnerUploadPost, cookieHeader, () => {
          uploadCalls += 1;
        })(input, init);
      };
      const deps = {
        lockRef,
        selection: selectDeferredImage(
          EMPTY_DEFERRED_IMAGE_SELECTION,
          makeImageFile(VALID_1X1_PNG, "dbl.png", "image/png"),
          createUrlSpy().api
        ),
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/partner-upload",
          defaultError: "err",
          networkError: "net",
          fetchFn: slowFetcher,
        },
        onImageUploaded: () => {},
        saveRecord: async (p: string | null) => {
          saveCalls += 1;
          return { success: true, data: p };
        },
      };
      const [r1, r2] = await Promise.all([executeDeferredSubmit(deps), executeDeferredSubmit(deps)]);
      assert.strictEqual(r1.status, "succeeded");
      assert.strictEqual(r2.status, "locked");
      assert.strictEqual(uploadCalls, 1);
      assert.strictEqual(saveCalls, 1);
      assert.strictEqual(lockRef.current, false);
    }
  );

  await runCheck(
    counter,
    "9. Siklus pembersihan Object URL pada replace, cancel, dan Node fallback aman",
    () => {
      const spy = createUrlSpy();
      const f1 = makeImageFile(VALID_1X1_PNG, "1.png", "image/png");
      const f2 = makeImageFile(VALID_1X1_PNG, "2.png", "image/png");
      const f3 = makeImageFile(VALID_1X1_PNG, "3.png", "image/png");
      let sel = selectDeferredImage(EMPTY_DEFERRED_IMAGE_SELECTION, f1, spy.api);
      sel = selectDeferredImage(sel, f2, spy.api);
      sel = selectDeferredImage(sel, f3, spy.api);
      assert.deepStrictEqual(clearDeferredImage(sel, spy.api), EMPTY_DEFERRED_IMAGE_SELECTION);
      assert.deepStrictEqual(spy.created, ["blob:mock-1", "blob:mock-2", "blob:mock-3"]);
      assert.deepStrictEqual(spy.revoked, ["blob:mock-1", "blob:mock-2", "blob:mock-3"]);
      const unmountRef: { current: string | null } = { current: "blob:unmount-preview" };
      revokePreviewRef(unmountRef, spy.api);
      revokePreviewRef(unmountRef, spy.api);
      assert.strictEqual(unmountRef.current, null);
      assert.deepStrictEqual(spy.revoked, [
        "blob:mock-1",
        "blob:mock-2",
        "blob:mock-3",
        "blob:unmount-preview",
      ]);
      assert.doesNotThrow(() => defaultObjectUrlApi.revokeObjectURL("blob:nonexistent"));

      assert.ok(validateClientImageFile(new File([], "empty.png", { type: "image/png" }), CLIENT_IMAGE_MESSAGES));
      assert.ok(
        validateClientImageFile(
          makeImageFile(Buffer.from("<svg/>"), "x.svg", "image/svg+xml"),
          CLIENT_IMAGE_MESSAGES
        )
      );
      const overFile = new File(
        [new Uint8Array(MAX_DEFERRED_IMAGE_SIZE_BYTES + 1)],
        "over.png",
        { type: "image/png" }
      );
      assert.strictEqual(
        validateClientImageFile(overFile, CLIENT_IMAGE_MESSAGES),
        CLIENT_IMAGE_MESSAGES.oversizeFile
      );
    }
  );
}
