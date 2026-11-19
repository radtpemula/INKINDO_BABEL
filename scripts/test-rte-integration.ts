import assert from "node:assert";
import { setupTestEnvironment } from "./test-db-helper";

setupTestEnvironment();

import { prisma } from "../lib/prisma";
import { createSessionToken } from "../lib/auth/session";
import {
  createNewsArticleAction,
  updateNewsArticleAction,
  deleteNewsArticleAction,
  toggleNewsPublishAction,
} from "../lib/admin/news-actions";
import {
  CONTENT_MARKER_V1_HTML,
  parseArticleContent,
  encodeArticleContent,
  convertPlainTextToEditorHtml,
  escapeHtml,
} from "../lib/security/content-format";
import { sanitizeNewsHtml } from "../lib/security/content-sanitizer";
import { getPublicNewsBySlug } from "../lib/public/news";

let passedCount = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passedCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runSuite() {
  console.log("=== CMS BERITA RTE TAHAP 2B: SUITE PENGUJIAN INTEGRASI ===");

  // 1. Setup Auth
  const admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  assert.ok(admin, "Harus terdapat akun admin aktif di basis data untuk pengujian");

  const token = await createSessionToken({
    userId: admin.id,
    username: admin.username,
    role: admin.role,
  });
  process.env.TEST_ADMIN_TOKEN = token;

  const createdSlugs: string[] = [];
  const baselineNewsCount = await prisma.newsArticle.count();

  await prisma.newsArticle.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "uji-" } },
        { slug: { startsWith: "berita-legacy" } },
        { slug: { startsWith: "artikel-format" } },
      ],
    },
  });

  try {

  console.log("\n[Bagian 1: Konversi Legacy Plain Text & Escaping]");
  await test("1.1. escapeHtml mengubah karakter khusus HTML menjadi entitas aman", () => {
    assert.strictEqual(
      escapeHtml("<script>alert('xss') & \"test\"</script>"),
      "&lt;script&gt;alert(&#39;xss&#39;) &amp; &quot;test&quot;&lt;/script&gt;"
    );
  });

  await test("1.2. convertPlainTextToEditorHtml mengonversi paragraf ganda dan single newline", () => {
    const plain = "Paragraf satu.\n\nParagraf dua baris satu.\nParagraf dua baris dua.";
    const html = convertPlainTextToEditorHtml(plain);
    assert.strictEqual(
      html,
      "<p>Paragraf satu.</p><p>Paragraf dua baris satu.<br>Paragraf dua baris dua.</p>"
    );
  });

  await test("1.3. convertPlainTextToEditorHtml meng-escape tag HTML literal dalam teks biasa", () => {
    const plain = "Gunakan tag <p> dan <div> dalam HTML.";
    const html = convertPlainTextToEditorHtml(plain);
    assert.strictEqual(html, "<p>Gunakan tag &lt;p&gt; dan &lt;div&gt; dalam HTML.</p>");
  });

  console.log("\n[Bagian 2: Server Actions Create dengan Format HTML v1]");
  await test("2.1. createNewsArticleAction menyimpan artikel Rich HTML dengan marker v1", async () => {
    const rawEditorHtml =
      "<h2>Judul Sub-Bab</h2><p>Paragraf pertama dengan <strong>tebal</strong> dan <em>miring</em>.</p><ul><li>Poin satu</li><li>Poin dua</li></ul>";
    const encoded = encodeArticleContent(rawEditorHtml, CONTENT_MARKER_V1_HTML);

    const res = await createNewsArticleAction({
      title: "Uji RTE Artikel Format v1",
      category: "UMUM",
      excerpt: "Ringkasan uji artikel berita berformat Rich Text v1.",
      content: encoded,
      authorName: "Redaksi Uji RTE",
      isPublished: true,
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    createdSlugs.push(res.data.slug);

    // Verifikasi langsung di database
    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: res.data.id },
    });
    assert.ok(dbRecord);
    assert.ok(dbRecord.content.startsWith(CONTENT_MARKER_V1_HTML));
    assert.ok(dbRecord.content.includes("<h2>Judul Sub-Bab</h2>"));
    assert.ok(dbRecord.content.includes("<strong>tebal</strong>"));
  });

  await test("2.2. createNewsArticleAction membersihkan konten XSS berbahaya sebelum disimpan", async () => {
    const maliciousHtml =
      "<p>Teks aman pendahuluan yang cukup panjang.<script>alert('xss')</script><a href=\"javascript:alert('hack')\">Klik Di Sini</a><img src=\"https://external.com/evil.jpg\" onerror=\"alert('xss')\" /></p>";
    const encoded = encodeArticleContent(maliciousHtml, CONTENT_MARKER_V1_HTML);

    const res = await createNewsArticleAction({
      title: "Uji RTE Sanitasi XSS",
      category: "UMUM",
      excerpt: "Ringkasan uji sanitasi naskah berita.",
      content: encoded,
      isPublished: false,
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    createdSlugs.push(res.data.slug);

    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: res.data.id },
    });
    assert.ok(dbRecord);
    assert.ok(!dbRecord.content.includes("<script>"));
    assert.ok(!dbRecord.content.includes("javascript:"));
    assert.ok(!dbRecord.content.includes("onerror"));
    assert.ok(!dbRecord.content.includes("https://external.com/evil.jpg"));
    assert.ok(dbRecord.content.includes("Teks aman pendahuluan"));
  });

  await test("2.3. createNewsArticleAction menolak konten kosong visual (<p></p>, <p><br></p>)", async () => {
    const emptyHtml = "<p></p><p><br></p>";
    const encoded = encodeArticleContent(emptyHtml, CONTENT_MARKER_V1_HTML);

    const res = await createNewsArticleAction({
      title: "Uji Konten Kosong",
      category: "UMUM",
      excerpt: "Ringkasan uji.",
      content: encoded,
      isPublished: false,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Isi artikel berita wajib diisi.");
  });

  await test("2.4. createNewsArticleAction menolak konten dengan teks bermakna kurang dari 10 karakter", async () => {
    const shortHtml = "<p>Pendek</p>";
    const encoded = encodeArticleContent(shortHtml, CONTENT_MARKER_V1_HTML);

    const res = await createNewsArticleAction({
      title: "Uji Konten Pendek",
      category: "UMUM",
      excerpt: "Ringkasan uji.",
      content: encoded,
      isPublished: false,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Isi artikel berita minimal 10 karakter teks.");
  });

  await test("2.5. createNewsArticleAction menolak konten melebihi batas 500.000 karakter", async () => {
    const hugeHtml = "<p>" + "a".repeat(500001) + "</p>";
    const encoded = encodeArticleContent(hugeHtml, CONTENT_MARKER_V1_HTML);

    const res = await createNewsArticleAction({
      title: "Uji Konten Terlalu Besar",
      category: "UMUM",
      excerpt: "Ringkasan uji.",
      content: encoded,
      isPublished: false,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "Isi artikel melebihi batas maksimum 500.000 karakter.");
  });

  await test("2.6. createNewsArticleAction menolak format konten yang tidak didukung", async () => {
    const unsupportedContent = "<!--inkindo-content:v99:future-->\n<future>data</future>";

    const res = await createNewsArticleAction({
      title: "Uji Format Tak Didukung",
      category: "UMUM",
      excerpt: "Ringkasan uji.",
      content: unsupportedContent,
      isPublished: false,
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes("Format konten tidak didukung"));
  });

  console.log("\n[Bagian 3: Siklus Round-Trip Editor (Edit Modal & Re-Save)]");
  await test("3.1. Parsing konten HTML v1 untuk form editor mengembalikan naskah bersih tanpa marker", async () => {
    const article = await prisma.newsArticle.findFirst({
      where: { slug: createdSlugs[0] },
    });
    assert.ok(article);

    const parsed = parseArticleContent(article.content);
    assert.strictEqual(parsed.isSupported, true);
    assert.strictEqual(parsed.isRichText, true);
    assert.strictEqual(parsed.version, 1);
    assert.ok(!parsed.body.includes("<!--inkindo-content:"));
    assert.ok(parsed.body.includes("<h2>Judul Sub-Bab</h2>"));

    // Simulasikan pengiriman ulang dari form admin
    const reEncoded = encodeArticleContent(parsed.body, CONTENT_MARKER_V1_HTML);
    const updateRes = await updateNewsArticleAction({
      id: article.id,
      title: article.title + " (Updated)",
      category: article.category,
      excerpt: article.excerpt,
      content: reEncoded,
    });

    assert.strictEqual(updateRes.success, true);

    const updatedDb = await prisma.newsArticle.findUnique({
      where: { id: article.id },
    });
    assert.ok(updatedDb);
    // Verifikasi tidak ada duplikasi marker (<!--inkindo... tidak muncul dua kali)
    const markerCount = (updatedDb.content.match(/<!--inkindo-content:/g) || []).length;
    assert.strictEqual(markerCount, 1);
  });

  console.log("\n[Bagian 4: Kompatibilitas Mundur Legacy Plain Text]");
  await test("4.1. Artikel legacy plain text lama di DB diparse sebagai format plain (version 0)", async () => {
    const legacyPlain =
      "Paragraf pertama berita lama.\n\nParagraf kedua berita lama dengan info teknis.";
    const legacyArticle = await prisma.newsArticle.create({
      data: {
        title: "Berita Legacy Plain Text",
        slug: "berita-legacy-plain-text",
        category: "REGULASI & KEBIJAKAN",
        excerpt: "Ringkasan berita lama.",
        content: legacyPlain,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    createdSlugs.push(legacyArticle.slug);

    const parsed = parseArticleContent(legacyArticle.content);
    assert.strictEqual(parsed.isSupported, true);
    assert.strictEqual(parsed.isRichText, false);
    assert.strictEqual(parsed.version, 0);
    assert.strictEqual(parsed.body, legacyPlain);

    // Konversi untuk form admin saat diedit
    const editorHtml = convertPlainTextToEditorHtml(parsed.body);
    assert.ok(editorHtml.startsWith("<p>Paragraf pertama berita lama.</p>"));

    // Simpan hasil pembaruan ke v1:html
    const updateRes = await updateNewsArticleAction({
      id: legacyArticle.id,
      title: legacyArticle.title,
      category: legacyArticle.category,
      excerpt: legacyArticle.excerpt,
      content: encodeArticleContent(editorHtml, CONTENT_MARKER_V1_HTML),
    });

    assert.strictEqual(updateRes.success, true);
    const updatedDb = await prisma.newsArticle.findUnique({
      where: { id: legacyArticle.id },
    });
    assert.ok(updatedDb);
    assert.ok(updatedDb.content.startsWith(CONTENT_MARKER_V1_HTML));
  });

  console.log("\n[Bagian 5: Perlindungan Format Tak Didukung (Lockout)]");
  await test("5.1. Artikel berformat unsupported di DB ditolak saat hendak di-update", async () => {
    const unsupportedRaw = "<!--inkindo-content:v99:future-->\n<future-block>data</future-block>";
    const unsupportedArticle = await prisma.newsArticle.create({
      data: {
        title: "Artikel Format Masa Depan",
        slug: "artikel-format-masa-depan",
        category: "UMUM",
        excerpt: "Ringkasan artikel.",
        content: unsupportedRaw,
        isPublished: false,
      },
    });
    createdSlugs.push(unsupportedArticle.slug);

    // Coba update artikel ini melalui update action
    const updateRes = await updateNewsArticleAction({
      id: unsupportedArticle.id,
      title: "Ganti Judul Masa Depan",
      category: "UMUM",
      excerpt: "Ringkasan baru.",
      content: "<p>Naskah baru yang dicoba masukkan.</p>",
    });

    assert.strictEqual(updateRes.success, false);
    assert.ok(
      updateRes.error?.includes(
        "format konten yang tidak didukung dan terkunci"
      )
    );

    // Coba publikasikan artikel ini
    const publishRes = await toggleNewsPublishAction(unsupportedArticle.id);
    assert.strictEqual(publishRes.success, false);
    assert.ok(
      publishRes.error?.includes(
        "Artikel dengan format konten yang tidak didukung tidak dapat dipublikasikan"
      )
    );
  });

  console.log("\n[Bagian 6: Integrasi Rendering Halaman Publik]");
  await test("6.1. getPublicNewsBySlug menyajikan artikel HTML v1 yang siap disanitasi", async () => {
    const article = await getPublicNewsBySlug(createdSlugs[0], { incrementViews: false });
    assert.ok(article);

    const parsed = parseArticleContent(article.content);
    assert.strictEqual(parsed.isSupported, true);
    assert.strictEqual(parsed.isRichText, true);

    const sanitized = sanitizeNewsHtml(parsed.body);
    assert.ok(sanitized.includes("<h2>Judul Sub-Bab</h2>"));
    assert.ok(sanitized.includes("<strong>tebal</strong>"));
  });

  } finally {
    console.log("\n[Bagian 7: Pembersihan Artefak Pengujian]");
    for (const slug of createdSlugs) {
      const item = await prisma.newsArticle.findUnique({ where: { slug } });
      if (item) {
        await deleteNewsArticleAction(item.id);
      }
    }

    await prisma.newsArticle.deleteMany({
      where: {
        OR: [
          { slug: { startsWith: "uji-" } },
          { slug: { startsWith: "berita-legacy" } },
          { slug: { startsWith: "artikel-format" } },
        ],
      },
    });

    const remainingNews = await prisma.newsArticle.count();
    assert.strictEqual(
      remainingNews,
      baselineNewsCount,
      "Basis data harus kembali ke jumlah artikel awal setelah pengujian"
    );
    console.log(
      `  ✓ Seluruh data uji dibersihkan tuntas (news count: ${remainingNews}, baseline: ${baselineNewsCount})`
    );

    console.log(`\n========================================`);
    console.log(`HASIL: ${passedCount} pengujian integrasi lulus 100%!`);
    console.log(`========================================\n`);
  }
}

runSuite().catch((err) => {
  console.error("Gagal menjalankan suite pengujian integrasi:", err);
  process.exit(1);
});
