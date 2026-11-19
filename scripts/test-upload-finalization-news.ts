import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_DEFERRED_IMAGE_SELECTION,
  executeDeferredSubmit,
  selectDeferredImage,
} from "../components/admin/deferred-image-upload";
import {
  createNewsArticleAction,
  updateNewsArticleAction,
} from "../lib/admin/news-actions";
import {
  CONTENT_MARKER_V1_HTML,
  encodeArticleContent,
} from "../lib/security/content-format";
import { deleteHeroImageFile } from "../lib/storage/hero";
import { deleteNewsImageFile } from "../lib/storage/news";
import { deleteImageFromDirectory } from "../lib/storage/upload-image";
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

export interface NewsFinalizationContext {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly cookieHeader: string;
  readonly newsUploadPost: RouteHandler;
  readonly newsInlineUploadPost: RouteHandler;
  readonly createdNewsIds: string[];
}

export async function runNewsFinalizationChecks(
  ctx: NewsFinalizationContext
): Promise<void> {
  const {
    counter,
    tempRoot,
    cookieHeader,
    newsUploadPost,
    newsInlineUploadPost,
    createdNewsIds,
  } = ctx;

  await runCheck(
    counter,
    "3. Sampul Berita retry tanpa upload ulang, Tiptap inline aman saat node dihapus, dan proteksi subdirektori delete",
    async () => {
      let coverUploads = 0;
      const coverFetcher = createTrackedFetcher(newsUploadPost, cookieHeader, () => {
        coverUploads += 1;
      });
      const inlineFetcher = createTrackedFetcher(
        newsInlineUploadPost,
        cookieHeader
      );
      const inlineFd = new FormData();
      inlineFd.append(
        "file",
        makeImageFile(VALID_1X1_PNG, "in1.png", "image/png")
      );
      const inlineRes = await inlineFetcher("/api/admin/news-inline-upload", {
        method: "POST",
        body: inlineFd,
      });
      const inlineJson = (await inlineRes.json()) as {
        data?: { publicPath?: string };
      };
      const inlinePath = requireString(
        inlineJson.data?.publicPath,
        "inlinePath wajib ada"
      );

      let coverPath: string | null = null;
      let sel = selectDeferredImage(
        EMPTY_DEFERRED_IMAGE_SELECTION,
        makeImageFile(VALID_1X1_WEBP, "cov1.webp", "image/webp"),
        createUrlSpy().api
      );
      const slug = `test-fin-news-${Date.now()}`;
      const firstNews = await createNewsArticleAction({
        title: "__test_fin_BeritaAwal",
        slug,
        category: "Berita",
        excerpt: "Ringkasan berita pengujian finalisasi.",
        content: encodeArticleContent(
          `<p>Isi awal artikel pengujian lebih dari sepuluh karakter.</p><figure><img src="${inlinePath}" alt="Uji"></figure>`,
          CONTENT_MARKER_V1_HTML
        ),
        isPublished: false,
      });
      assert.strictEqual(firstNews.success, true);
      if (firstNews.success && firstNews.data) {
        createdNewsIds.push(firstNews.data.id);
      }

      const dupFail = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: sel,
        persistedImagePath: null,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/news-upload",
          defaultError: "err",
          networkError: "net",
          fetchFn: coverFetcher,
        },
        onImageUploaded: (p) => {
          coverPath = p;
          sel = EMPTY_DEFERRED_IMAGE_SELECTION;
        },
        saveRecord: (resolved, uploadToken) =>
          createNewsArticleAction({
            title: "__test_fin_BeritaKedua",
            slug,
            category: "Berita",
            excerpt: "Ringkasan berita kedua finalisasi.",
            content: encodeArticleContent(
              "<p>Konten berita kedua valid lebih dari sepuluh karakter.</p>",
              CONTENT_MARKER_V1_HTML
            ),
            coverImagePath: resolved,
            uploadToken,
            isPublished: false,
          }),
      });
      assert.strictEqual(dupFail.status, "save_failed");
      assert.ok(dupFail.status === "save_failed" && dupFail.rollbackToken);

      const retryNews = await executeDeferredSubmit({
        lockRef: { current: false },
        selection: sel,
        persistedImagePath: coverPath,
        validateForm: () => true,
        uploadConfig: {
          endpoint: "/api/admin/news-upload",
          defaultError: "err",
          networkError: "net",
          fetchFn: coverFetcher,
        },
        onImageUploaded: () =>
          assert.fail("Retry sampul berita tidak boleh upload ulang"),
        saveRecord: (resolved, uploadToken) =>
          createNewsArticleAction({
            title: "__test_fin_BeritaKedua",
            slug: `${slug}-retry`,
            category: "Berita",
            excerpt: "Ringkasan berita kedua finalisasi.",
            content: encodeArticleContent(
              "<p>Konten berita kedua valid lebih dari sepuluh karakter.</p>",
              CONTENT_MARKER_V1_HTML
            ),
            coverImagePath: resolved,
            uploadToken,
            isPublished: false,
          }),
      });
      assert.strictEqual(retryNews.status, "succeeded");
      assert.strictEqual(coverUploads, 1);
      if (retryNews.status === "succeeded" && retryNews.data) {
        createdNewsIds.push(retryNews.data.id);
      }

      if (firstNews.success && firstNews.data) {
        const updated = await updateNewsArticleAction({
          id: firstNews.data.id,
          content: encodeArticleContent(
            "<p>Node gambar dihapus dari editor setelah beberapa kata.</p>",
            CONTENT_MARKER_V1_HTML
          ),
        });
        assert.strictEqual(updated.success, true);
        assert.strictEqual(
          fs.existsSync(path.join(tempRoot, "public", inlinePath)),
          false
        );
      }

      assert.strictEqual(await deleteNewsImageFile(inlinePath), false);
      assert.strictEqual(
        await deleteHeroImageFile("/uploads/hero/nested/x.png"),
        false
      );
      assert.strictEqual(
        await deleteImageFromDirectory("partners", "/uploads/partners/nested/x.png"),
        false
      );
    }
  );
}
