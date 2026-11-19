import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorState } from "@tiptap/pm/state";
import { ArticleImage } from "../components/admin/article-image-extension";
import {
  CONTENT_MARKER_V1_HTML,
  encodeArticleContent,
  parseArticleContent,
} from "../lib/security/content-format";
import {
  sanitizeNewsHtml,
  isValidNewsUploadImagePath,
} from "../lib/security/content-sanitizer";

import { setupTestEnvironment } from "./test-db-helper";

setupTestEnvironment();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "inkindo-rte-inline-"));

const MAX_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const VALID_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWP4z8AAAAMBAQCc479ZAAAAAElFTkSuQmCC",
  "base64"
);
const VALID_1X1_JPEG = Buffer.from(
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z",
  "base64"
);
const VALID_1X1_WEBP = Buffer.from(
  "UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=",
  "base64"
);

const uploadedInlinePaths: string[] = [];
const uploadedCoverPaths: string[] = [];
const createdArticleIds: string[] = [];

function makePng(): Buffer {
  return Buffer.from(VALID_1X1_PNG);
}

function makeJpeg(): Buffer {
  return Buffer.from(VALID_1X1_JPEG);
}

function makeWebp(): Buffer {
  return Buffer.from(VALID_1X1_WEBP);
}

function buildUploadRequest(
  endpoint: string,
  options: {
    buffer?: Buffer;
    filename?: string;
    mimeType?: string;
    token?: string;
    fieldName?: string;
  } = {}
): Request {
  const formData = new FormData();
  if (options.fieldName !== "skip") {
    const buffer = options.buffer ?? makePng();
    formData.append(
      options.fieldName ?? "file",
      new File([new Uint8Array(buffer)], options.filename ?? "inline.png", {
        type: options.mimeType ?? "image/png",
      })
    );
  }

  const headers: Record<string, string> = {};
  if (options.token) {
    headers.cookie = `inkindo_admin_session=${encodeURIComponent(options.token)}`;
  }

  return new Request(`http://localhost${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });
}

function renderArticleImage(attrs: Record<string, unknown>): unknown {
  const renderHTML = ArticleImage.config.renderHTML;
  assert.ok(renderHTML, "ArticleImage harus menyediakan renderHTML");
  type RenderProps = Parameters<NonNullable<typeof renderHTML>>[0];
  const callable = renderHTML as unknown as (props: RenderProps) => unknown;
  const props = {
    node: { attrs },
    HTMLAttributes: {},
  } as unknown as RenderProps;
  return callable(props);
}

let passedCount = 0;
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passedCount++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(error);
    throw error;
  }
}

async function runSuite(): Promise<void> {
  console.log("=== CMS BERITA RTE TAHAP 3: SUITE PENGUJIAN INLINE IMAGE ===");
  const { prisma } = await import("../lib/prisma");
  const { createSessionToken } = await import("../lib/auth/session");
  const { POST: inlineUpload } = await import("../app/api/admin/news-inline-upload/route");
  const { POST: coverUpload } = await import("../app/api/admin/news-upload/route");
  const { createNewsArticleAction } = await import("../lib/admin/news-actions");
  const { deleteNewsInlineImageFile, deleteNewsImageFile } = await import(
    "../lib/storage/news"
  );

  const baselineNewsCount = await prisma.newsArticle.count();
  const admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  assert.ok(admin, "Harus terdapat akun administrator aktif untuk pengujian");

  const token = await createSessionToken({
    userId: admin.id,
    username: admin.username,
    role: admin.role,
  });
  process.env.TEST_ADMIN_TOKEN = token;

  try {
    console.log("\n[Bagian 1: Autentikasi & Otorisasi Endpoint Inline]");
    await test("1.1. Tanpa sesi admin ditolak 401", async () => {
      const response = await inlineUpload(buildUploadRequest("/api/admin/news-inline-upload"));
      assert.strictEqual(response.status, 401);
      const body = await response.json();
      assert.strictEqual(
        body.error,
        "Sesi tidak valid atau telah berakhir. Silakan login kembali."
      );
    });

    await test("1.2. Admin nonaktif ditolak 403", async () => {
      await prisma.adminUser.update({ where: { id: admin.id }, data: { isActive: false } });
      try {
        const response = await inlineUpload(
          buildUploadRequest("/api/admin/news-inline-upload", { token })
        );
        assert.strictEqual(response.status, 403);
        const body = await response.json();
        assert.strictEqual(
          body.error,
          "Akses ditolak: Akun administrator telah dinonaktifkan."
        );
      } finally {
        await prisma.adminUser.update({ where: { id: admin.id }, data: { isActive: true } });
      }
    });

    await test("1.3. Admin aktif dapat mengunggah PNG valid (201)", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", { token, buffer: makePng() })
      );
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, "Gambar inline berhasil diunggah.");
      assert.match(
        body.data.publicPath,
        /^\/uploads\/news\/inline\/inline-\d+-[a-f0-9]+\.png$/
      );
      uploadedInlinePaths.push(body.data.publicPath);
      const physicalPath = path.join(process.cwd(), "public", body.data.publicPath);
      assert.strictEqual(fs.existsSync(physicalPath), true);
      assert.strictEqual(typeof body.data.sizeBytes, "number");
      assert.strictEqual(body.data.sizeBytes > 0, true);
      assert.strictEqual(body.data.mimeType, "image/png");
    });

    console.log("\n[Bagian 2: Validasi Format & Ukuran Berkas]");
    await test("2.1. JPEG valid diterima (201)", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", { token, buffer: makeJpeg() })
      );
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.match(body.data.publicPath, /\.jpg$/);
      uploadedInlinePaths.push(body.data.publicPath);
    });

    await test("2.2. WebP valid diterima (201)", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", { token, buffer: makeWebp() })
      );
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.match(body.data.publicPath, /\.webp$/);
      uploadedInlinePaths.push(body.data.publicPath);
    });

    await test("2.3. SVG ditolak karena magic bytes tidak sesuai", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", {
          token,
          buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
          filename: "evil.svg",
          mimeType: "image/svg+xml",
        })
      );
      assert.strictEqual(response.status, 400);
      const body = await response.json();
      assert.match(body.error, /Format berkas tidak diizinkan/);
    });

    await test("2.4. Berkas palsu berekstensi .png ditolak", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", {
          token,
          buffer: Buffer.from("<html><script>alert(1)</script></html>"),
          filename: "fake.png",
          mimeType: "image/png",
        })
      );
      assert.strictEqual(response.status, 400);
    });

    await test("2.5. Berkas kosong ditolak 400", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", {
          token,
          buffer: Buffer.alloc(0),
        })
      );
      assert.strictEqual(response.status, 400);
      const body = await response.json();
      assert.strictEqual(body.error, "Ukuran berkas gambar kosong.");
    });

    await test("2.6. Berkas melebihi 5 MB ditolak 400", async () => {
      const oversized = Buffer.alloc(MAX_BYTES + 1, 0);
      PNG_SIGNATURE.copy(oversized, 0);
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", { token, buffer: oversized })
      );
      assert.strictEqual(response.status, 400);
      const body = await response.json();
      assert.strictEqual(body.error, "Ukuran berkas melebihi batas maksimum 5 MB.");
    });

    await test("2.7. Field file yang hilang ditolak 400", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", { token, fieldName: "skip" })
      );
      assert.strictEqual(response.status, 400);
      const body = await response.json();
      assert.strictEqual(body.error, "Berkas gambar wajib diunggah.");
    });

    await test("2.8. Nama berkas traversal tidak dapat keluar dari direktori inline", async () => {
      const response = await inlineUpload(
        buildUploadRequest("/api/admin/news-inline-upload", {
          token,
          buffer: makePng(),
          filename: "../../../evil.png",
        })
      );
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.ok(!body.data.publicPath.includes(".."));
      assert.match(
        body.data.publicPath,
        /^\/uploads\/news\/inline\/inline-\d+-[a-f0-9]+\.png$/
      );
      uploadedInlinePaths.push(body.data.publicPath);
    });

    const validInlinePath = uploadedInlinePaths[0];
    assert.ok(validInlinePath, "Path inline valid harus tersedia untuk pengujian berikutnya");

    console.log("\n[Bagian 3: Kontrak Sanitizer Gambar Inline]");
    await test("3.1. Figure lokal dengan alt, caption, ukuran, dan alignment dipertahankan", () => {
      const html = `<figure class="my-6"><img src="${validInlinePath}" alt="Foto rapat" class="block rounded-lg w-1/2 mx-auto"><figcaption class="text-xs text-slate-500 italic mt-2 text-center">Rapat koordinasi</figcaption></figure>`;
      const sanitized = sanitizeNewsHtml(html);
      assert.ok(sanitized.includes(validInlinePath));
      assert.ok(sanitized.includes('alt="Foto rapat"'));
      assert.ok(sanitized.includes("w-1/2"));
      assert.ok(sanitized.includes("mx-auto"));
      assert.ok(sanitized.includes("Rapat koordinasi"));
      assert.ok(sanitized.includes("<figcaption"));
    });

    await test("3.2. Gambar eksternal dibuang oleh sanitizer", () => {
      const sanitized = sanitizeNewsHtml(
        '<figure class="my-6"><img src="https://evil.example/x.jpg" alt="x"></figure>'
      );
      assert.ok(!sanitized.includes("evil.example"));
      assert.ok(!sanitized.includes("<img"));
    });

    await test("3.3. Base64 data URI dibuang oleh sanitizer", () => {
      const sanitized = sanitizeNewsHtml(
        '<figure class="my-6"><img src="data:image/png;base64,AAAA" alt="x"></figure>'
      );
      assert.ok(!sanitized.includes("data:image"));
      assert.ok(!sanitized.includes("<img"));
    });

    await test("3.4. Path traversal pada src dibuang oleh sanitizer", () => {
      const sanitized = sanitizeNewsHtml(
        '<figure class="my-6"><img src="/uploads/news/inline/../secret.png" alt="x"></figure>'
      );
      assert.ok(!sanitized.includes("secret.png"));
      assert.ok(!sanitized.includes("<img"));
    });

    await test("3.5. Atribut event handler dan script dibersihkan", () => {
      const sanitized = sanitizeNewsHtml(
        `<figure class="my-6"><img src="${validInlinePath}" alt="x" onerror="alert(1)"></figure><script>alert(1)</script><p>Konten aman</p>`
      );
      assert.ok(!sanitized.includes("onerror"));
      assert.ok(!sanitized.includes("<script"));
      assert.ok(sanitized.includes("Konten aman"));
    });

    await test("3.6. Artikel dengan beberapa gambar mempertahankan semua gambar lokal", () => {
      const html = `<p>Pembuka</p><figure class="my-6"><img src="${validInlinePath}" alt="Satu" class="block rounded-lg w-full mx-auto"></figure><p>Antara</p><figure class="my-6"><img src="${validInlinePath}" alt="Dua" class="block rounded-lg w-3/4 mx-auto"></figure>`;
      const sanitized = sanitizeNewsHtml(html);
      const imageCount = (sanitized.match(/<img /g) ?? []).length;
      assert.strictEqual(imageCount, 2);
      assert.ok(sanitized.includes('alt="Satu"'));
      assert.ok(sanitized.includes('alt="Dua"'));
    });

    await test("3.7. isValidNewsUploadImagePath menerima lokal dan menolak eksternal/traversal", () => {
      assert.strictEqual(isValidNewsUploadImagePath(validInlinePath), true);
      assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/news-123-abc.jpg"), true);
      assert.strictEqual(isValidNewsUploadImagePath("https://evil.example/x.jpg"), false);
      assert.strictEqual(isValidNewsUploadImagePath("data:image/png;base64,AAAA"), false);
      assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/inline/../x.png"), false);
      assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/inline/x.svg"), false);
    });

    console.log("\n[Bagian 4: Serialisasi Node Gambar Tiptap]");
    await test("4.1. renderHTML menghasilkan class ukuran 50% dan alignment tengah", () => {
      const output = renderArticleImage({
        src: validInlinePath,
        alt: "Foto",
        caption: "",
        size: "50",
        align: "center",
      });
      assert.deepStrictEqual(output, [
        "figure",
        { class: "my-6" },
        [
          "img",
          {
            src: validInlinePath,
            alt: "Foto",
            class: "block rounded-lg w-1/2 mx-auto",
          },
        ],
      ]);
    });

    await test("4.2. renderHTML menghasilkan class ukuran 75% dan alignment kanan", () => {
      const output = renderArticleImage({
        src: validInlinePath,
        alt: "Foto",
        caption: "",
        size: "75",
        align: "right",
      });
      assert.deepStrictEqual(output, [
        "figure",
        { class: "my-6" },
        [
          "img",
          {
            src: validInlinePath,
            alt: "Foto",
            class: "block rounded-lg w-3/4 ml-auto",
          },
        ],
      ]);
    });

    await test("4.3. renderHTML ukuran 100% tanpa alignment dan dengan caption", () => {
      const output = renderArticleImage({
        src: validInlinePath,
        alt: "Foto",
        caption: "Keterangan foto",
        size: "100",
        align: "left",
      });
      assert.deepStrictEqual(output, [
        "figure",
        { class: "my-6" },
        ["img", { src: validInlinePath, alt: "Foto", class: "block rounded-lg w-full" }],
        [
          "figcaption",
          { class: "text-xs text-slate-500 italic mt-2 text-center" },
          "Keterangan foto",
        ],
      ]);
    });

    await test("4.4. Node gambar dapat disisipkan pada posisi dokumen yang diminta", () => {
      const schema = getSchema([StarterKit, ArticleImage]);
      const doc = schema.nodeFromJSON({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Paragraf pertama" }] },
          { type: "paragraph", content: [{ type: "text", text: "Paragraf kedua" }] },
        ],
      });
      const state = EditorState.create({ schema, doc });
      const insertPosition = doc.child(0).nodeSize;
      const imageNode = schema.nodes.articleImage.create({
        src: validInlinePath,
        alt: "Sisipan",
        caption: "Caption",
        size: "75",
        align: "right",
      });
      const transaction = state.tr.insert(insertPosition, imageNode);
      const result = transaction.doc;
      assert.strictEqual(result.childCount, 3);
      assert.strictEqual(result.child(1).type.name, "articleImage");
      assert.strictEqual(result.child(1).attrs.src, validInlinePath);
      assert.strictEqual(result.child(1).attrs.size, "75");
      assert.strictEqual(result.child(1).attrs.align, "right");
      assert.strictEqual(result.child(1).attrs.caption, "Caption");
    });

    console.log("\n[Bagian 5: Persistensi Round-Trip Artikel]");
    await test("5.1. Artikel dengan gambar inline tersimpan lengkap dan dapat dibaca kembali", async () => {
      const figure = `<figure class="my-6"><img src="${validInlinePath}" alt="Dokumentasi rapat" class="block rounded-lg w-1/2 mx-auto"><figcaption class="text-xs text-slate-500 italic mt-2 text-center">Dokumentasi rapat</figcaption></figure>`;
      const content = encodeArticleContent(
        `<p>Paragraf pembuka artikel.</p>${figure}`,
        CONTENT_MARKER_V1_HTML
      );
      const result = await createNewsArticleAction({
        title: "Uji Inline Gambar Persistensi",
        category: "Pengumuman",
        excerpt: "Pengujian penyimpanan gambar inline pada artikel berita.",
        content,
        authorName: "Penguji Otomatis",
      });
      if (!result.success) assert.fail(result.error);
      const created = result.data;
      assert.ok(created);
      createdArticleIds.push(created.id);

      const stored = await prisma.newsArticle.findUnique({
        where: { id: created.id },
      });
      assert.ok(stored);
      assert.ok(stored.content.startsWith(CONTENT_MARKER_V1_HTML));
      assert.ok(stored.content.includes(validInlinePath));
      assert.ok(stored.content.includes("Dokumentasi rapat"));
      assert.ok(!stored.content.includes("data:image"));

      const parsed = parseArticleContent(stored.content);
      assert.strictEqual(parsed.isRichText, true);
      assert.strictEqual(parsed.isSupported, true);
      const sanitized = sanitizeNewsHtml(parsed.body);
      assert.ok(sanitized.includes(validInlinePath));
      assert.ok(sanitized.includes('alt="Dokumentasi rapat"'));
      assert.ok(sanitized.includes("w-1/2"));
      assert.ok(sanitized.includes("mx-auto"));
      assert.ok(sanitized.includes("<figcaption"));
    });

    await test("5.2. Artikel dengan dua gambar mempertahankan keduanya setelah reload", async () => {
      const first = `<figure class="my-6"><img src="${validInlinePath}" alt="Gambar satu" class="block rounded-lg w-full mx-auto"></figure>`;
      const second = `<figure class="my-6"><img src="${validInlinePath}" alt="Gambar dua" class="block rounded-lg w-3/4 ml-auto"><figcaption class="text-xs text-slate-500 italic mt-2 text-center">Gambar kedua</figcaption></figure>`;
      const content = encodeArticleContent(
        `<p>Artikel dua gambar.</p>${first}${second}`,
        CONTENT_MARKER_V1_HTML
      );
      const result = await createNewsArticleAction({
        title: "Uji Inline Dua Gambar",
        category: "Pengumuman",
        excerpt: "Pengujian artikel dengan dua gambar inline.",
        content,
        authorName: "Penguji Otomatis",
      });
      if (!result.success) assert.fail(result.error);
      const created = result.data;
      assert.ok(created);
      createdArticleIds.push(created.id);

      const stored = await prisma.newsArticle.findUnique({
        where: { id: created.id },
      });
      assert.ok(stored);
      const parsed = parseArticleContent(stored.content);
      const sanitized = sanitizeNewsHtml(parsed.body);
      assert.strictEqual((sanitized.match(/<img /g) ?? []).length, 2);
      assert.ok(sanitized.includes('alt="Gambar satu"'));
      assert.ok(sanitized.includes('alt="Gambar dua"'));
      assert.ok(sanitized.includes("Gambar kedua"));
    });

    await test("5.3. Artikel legacy tanpa gambar tetap tersimpan sebagai teks biasa", async () => {
      const result = await createNewsArticleAction({
        title: "Uji Legacy Tanpa Gambar",
        category: "Pengumuman",
        excerpt: "Artikel lama tanpa gambar inline.",
        content: "Paragraf lama tanpa gambar inline sama sekali.",
        authorName: "Penguji Otomatis",
      });
      if (!result.success) assert.fail(result.error);
      const created = result.data;
      assert.ok(created);
      createdArticleIds.push(created.id);

      const stored = await prisma.newsArticle.findUnique({
        where: { id: created.id },
      });
      assert.ok(stored);
      assert.strictEqual(stored.content, "Paragraf lama tanpa gambar inline sama sekali.");
      assert.ok(!stored.content.includes("<img"));
      assert.ok(!stored.content.includes(CONTENT_MARKER_V1_HTML));
    });

    console.log("\n[Bagian 6: Regresi Gambar Sampul]");
    await test("6.1. Endpoint gambar sampul tetap menerima PNG valid (201)", async () => {
      const response = await coverUpload(
        buildUploadRequest("/api/admin/news-upload", { token, buffer: makePng() })
      );
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.strictEqual(body.message, "Gambar berita berhasil diunggah.");
      assert.match(body.data.publicPath, /^\/uploads\/news\/news-\d+-[a-f0-9]+\.png$/);
      uploadedCoverPaths.push(body.data.publicPath);
      const physicalPath = path.join(process.cwd(), "public", body.data.publicPath);
      assert.strictEqual(fs.existsSync(physicalPath), true);
    });

    await test("6.2. Endpoint gambar sampul tetap menolak tanpa sesi (401)", async () => {
      const response = await coverUpload(buildUploadRequest("/api/admin/news-upload"));
      assert.strictEqual(response.status, 401);
    });

    console.log("\n[Bagian 7: Integritas Basis Data Uji Terisolasi]");
    await test("7.1. Basis data sementara terpisah dari basis data pengguna", () => {
      const activeUrl = process.env.DATABASE_URL || "";
      assert.ok(activeUrl.includes("inkindo_test_db"));
      assert.strictEqual(activeUrl.includes("inkindo_babel_db"), false);
    });
  } finally {
    console.log("\n[Pembersihan Artefak Pengujian]");
    if (createdArticleIds.length > 0) {
      await prisma.newsArticle.deleteMany({ where: { id: { in: createdArticleIds } } });
    }
    for (const publicPath of uploadedInlinePaths) {
      await deleteNewsInlineImageFile(publicPath);
    }
    for (const publicPath of uploadedCoverPaths) {
      await deleteNewsImageFile(publicPath);
    }

    const remainingNews = await prisma.newsArticle.count();
    assert.strictEqual(remainingNews, baselineNewsCount);
    await prisma.$disconnect();
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`  ✓ ${uploadedInlinePaths.length} berkas inline dan ${uploadedCoverPaths.length} berkas sampul dihapus`);
    console.log(`  ✓ Basis data pengguna tidak tersentuh (inkindo_babel_db)`);
  }

  console.log("\n========================================");
  console.log(`HASIL: ${passedCount} pengujian inline image lulus 100%!`);
  console.log("========================================\n");
}

runSuite().catch((error) => {
  console.error("Gagal menjalankan suite pengujian inline image:", error);
  process.exit(1);
});
