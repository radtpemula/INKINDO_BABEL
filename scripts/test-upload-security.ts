// allow: SIZE_OK — comprehensive upload security test suite
import assert from "node:assert";
import { NextRequest } from "next/server";
import {
  validateImageBuffer,
  validateImageMagicBytes,
  MAX_IMAGE_SIZE_BYTES,
} from "../lib/storage/image-validation";
import {
  hasDangerousCharacters,
  isValidNewsUploadImagePath,
  isValidNewsCoverImagePath,
  isValidNewsInlineImagePath,
  isValidHeroImagePath,
  isValidPartnerLogoPath,
  isValidMemberWorkImagePath,
} from "../lib/security/image-path";
import {
  checkUploadRateLimit,
  getClientIdentifier,
  resetUploadRateLimits,
} from "../lib/security/rate-limit";
import { POST as heroUploadPost } from "../app/api/admin/hero-upload/route";
import { POST as newsUploadPost } from "../app/api/admin/news-upload/route";
import { POST as newsInlineUploadPost } from "../app/api/admin/news-inline-upload/route";
import { POST as partnerUploadPost } from "../app/api/admin/partner-upload/route";
import { POST as memberWorkUploadPost } from "../app/api/admin/member-work-upload/route";

const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_SIG = Buffer.from("RIFF1234WEBP");

function createMockJpeg(size = 32): Buffer {
  const buf = Buffer.alloc(size, 0);
  JPEG_SIG.copy(buf, 0);
  return buf;
}

function createMockPng(size = 32): Buffer {
  const buf = Buffer.alloc(size, 0);
  PNG_SIG.copy(buf, 0);
  return buf;
}

function createMockWebp(size = 32): Buffer {
  const buf = Buffer.alloc(size, 0);
  WEBP_SIG.copy(buf, 0);
  return buf;
}

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}:`, err);
  }
}

async function main() {
  console.log("\n=== 1. Pengujian Validasi Buffer & Magic Bytes ===");

  await runTest("JPEG valid terdeteksi dengan ekstensi jpg dan mime image/jpeg", () => {
    const res = validateImageBuffer(createMockJpeg());
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.mimeType, "image/jpeg");
    assert.strictEqual(res.extension, "jpg");
  });

  await runTest("PNG valid terdeteksi dengan ekstensi png dan mime image/png", () => {
    const res = validateImageBuffer(createMockPng());
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.mimeType, "image/png");
    assert.strictEqual(res.extension, "png");
  });

  await runTest("WebP valid terdeteksi dengan ekstensi webp dan mime image/webp", () => {
    const res = validateImageBuffer(createMockWebp());
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.mimeType, "image/webp");
    assert.strictEqual(res.extension, "webp");
  });

  await runTest("Menolak buffer kosong (0 bytes)", () => {
    const res = validateImageBuffer(Buffer.alloc(0));
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /kosong/i);
  });

  await runTest("Menolak buffer berukuran kurang dari 12 bytes", () => {
    const res = validateImageBuffer(Buffer.from([0xff, 0xd8, 0xff]));
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /terlalu kecil/i);
  });

  await runTest("Menolak buffer melebihi batas 5 MB", () => {
    const bigBuf = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1, 0);
    JPEG_SIG.copy(bigBuf, 0);
    const res = validateImageBuffer(bigBuf);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /5 MB/i);
  });

  await runTest("Menolak payload SVG (vektor / XML) dengan ekstensi palsu", () => {
    const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = validateImageBuffer(svgBuf);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /tidak diizinkan/i);
  });

  await runTest("Menolak payload HTML / script executable", () => {
    const htmlBuf = Buffer.from("<!DOCTYPE html><html><body><h1>Injeksi</h1></body></html>");
    const res = validateImageBuffer(htmlBuf);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /tidak diizinkan/i);
  });

  await runTest("Menolak payload ELF / Binary executable", () => {
    const elfBuf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const res = validateImageBuffer(elfBuf);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || "", /tidak diizinkan/i);
  });

  await runTest("Fungsi legacy validateImageMagicBytes tetap kompatibel", () => {
    const res = validateImageMagicBytes(createMockPng());
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.extension, "png");
  });

  console.log("\n=== 2. Pengujian Validasi Path & Sanitasi Traversal ===");

  await runTest("hasDangerousCharacters mendeteksi path traversal (..)", () => {
    assert.strictEqual(hasDangerousCharacters("../uploads/evil.jpg"), true);
    assert.strictEqual(hasDangerousCharacters("/uploads/hero/../../evil.jpg"), true);
    assert.strictEqual(hasDangerousCharacters("..\\uploads\\evil.jpg"), true);
  });

  await runTest("hasDangerousCharacters mendeteksi backslash (\\)", () => {
    assert.strictEqual(hasDangerousCharacters("/uploads/hero\\evil.jpg"), true);
  });

  await runTest("hasDangerousCharacters mendeteksi double slashes (//)", () => {
    assert.strictEqual(hasDangerousCharacters("/uploads//hero/evil.jpg"), true);
    assert.strictEqual(hasDangerousCharacters("//evil.com/pic.jpg"), true);
  });

  await runTest("hasDangerousCharacters mendeteksi percent-encoding (%)", () => {
    assert.strictEqual(hasDangerousCharacters("/uploads/hero/%2e%2e/pic.jpg"), true);
    assert.strictEqual(hasDangerousCharacters("/uploads/hero/%2fpic.jpg"), true);
  });

  await runTest("hasDangerousCharacters mendeteksi query parameters dan fragments (? dan #)", () => {
    assert.strictEqual(hasDangerousCharacters("/uploads/hero/pic.jpg?version=1"), true);
    assert.strictEqual(hasDangerousCharacters("/uploads/hero/pic.jpg#fragment"), true);
  });

  await runTest("isValidHeroImagePath menerima path hero valid", () => {
    assert.strictEqual(isValidHeroImagePath("/uploads/hero/hero-123456789-abcdef.webp"), true);
    assert.strictEqual(isValidHeroImagePath("uploads/hero/hero-123456789-abcdef.jpg"), true);
  });

  await runTest("isValidHeroImagePath menolak subdirektori ilegal atau format non-gambar", () => {
    assert.strictEqual(isValidHeroImagePath("/uploads/hero/nested/pic.webp"), false);
    assert.strictEqual(isValidHeroImagePath("/uploads/hero/script.php"), false);
    assert.strictEqual(isValidHeroImagePath("/uploads/hero/pic.svg"), false);
  });

  await runTest("isValidHeroImagePath mendukung allowDefaultImages untuk /images/", () => {
    assert.strictEqual(isValidHeroImagePath("/images/hero-default.webp", { allowDefaultImages: true }), true);
    assert.strictEqual(isValidHeroImagePath("/images/hero-default.webp", { allowDefaultImages: false }), false);
  });

  await runTest("isValidNewsCoverImagePath menerima path sampul berita valid", () => {
    assert.strictEqual(isValidNewsCoverImagePath("/uploads/news/news-123-abc.webp"), true);
  });

  await runTest("isValidNewsCoverImagePath menolak path inline di direktori sampul", () => {
    assert.strictEqual(isValidNewsCoverImagePath("/uploads/news/inline/inline-123-abc.webp"), false);
  });

  await runTest("isValidNewsInlineImagePath menerima path inline berita valid", () => {
    assert.strictEqual(isValidNewsInlineImagePath("/uploads/news/inline/inline-123-abc.webp"), true);
  });

  await runTest("isValidNewsInlineImagePath menolak path non-inline", () => {
    assert.strictEqual(isValidNewsInlineImagePath("/uploads/news/news-123-abc.webp"), false);
  });

  await runTest("isValidNewsUploadImagePath menerima baik sampul maupun inline berita", () => {
    assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/news-123-abc.webp"), true);
    assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/inline/inline-123-abc.webp"), true);
    assert.strictEqual(isValidNewsUploadImagePath("/uploads/hero/hero-123-abc.webp"), false);
  });

  await runTest("isValidPartnerLogoPath memvalidasi logo mitra", () => {
    assert.strictEqual(isValidPartnerLogoPath("/uploads/partners/partner-123-abc.png"), true);
    assert.strictEqual(isValidPartnerLogoPath("/uploads/news/partner-123-abc.png"), false);
  });

  await runTest("isValidMemberWorkImagePath memvalidasi karya anggota", () => {
    assert.strictEqual(isValidMemberWorkImagePath("/uploads/member-works/work-123-abc.jpg"), true);
    assert.strictEqual(isValidMemberWorkImagePath("/uploads/member-works/work-123-abc.exe"), false);
  });

  console.log("\n=== 3. Pengujian In-Memory Rate Limiter ===");

  await runTest("Rate limiter mengizinkan permintaan dalam batas ambang", () => {
    resetUploadRateLimits();
    const id = "test-client-1";
    const res1 = checkUploadRateLimit(id, { maxRequests: 3, windowMs: 1000 });
    assert.strictEqual(res1.isAllowed, true);
    assert.strictEqual(res1.remaining, 2);

    const res2 = checkUploadRateLimit(id, { maxRequests: 3, windowMs: 1000 });
    assert.strictEqual(res2.isAllowed, true);
    assert.strictEqual(res2.remaining, 1);

    const res3 = checkUploadRateLimit(id, { maxRequests: 3, windowMs: 1000 });
    assert.strictEqual(res3.isAllowed, true);
    assert.strictEqual(res3.remaining, 0);

    const res4 = checkUploadRateLimit(id, { maxRequests: 3, windowMs: 1000 });
    assert.strictEqual(res4.isAllowed, false);
    assert.strictEqual(res4.remaining, 0);
    assert.strictEqual(res4.retryAfterSeconds > 0, true);
  });

  await runTest("getClientIdentifier mengutamakan adminId di atas alamat IP", () => {
    const req = new NextRequest("http://localhost/api/admin/hero-upload", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });
    assert.strictEqual(getClientIdentifier(req, "admin-42"), "admin:admin-42");
    assert.strictEqual(getClientIdentifier(req), "ip:203.0.113.195");
  });

  console.log("\n=== 4. Pengujian Endpoint Upload (Auth & Proteksi Error) ===");

  const routes = [
    { name: "hero-upload", post: heroUploadPost },
    { name: "news-upload", post: newsUploadPost },
    { name: "news-inline-upload", post: newsInlineUploadPost },
    { name: "partner-upload", post: partnerUploadPost },
    { name: "member-work-upload", post: memberWorkUploadPost },
  ];

  for (const { name, post } of routes) {
    await runTest(`${name}: Menolak request tanpa otentikasi dengan status 401`, async () => {
      resetUploadRateLimits();
      const reqNoAuth = new NextRequest(`http://localhost/api/admin/${name}`, {
        method: "POST",
      });
      const res = await post(reqNoAuth);
      assert.strictEqual(res.status, 401, `${name} harus mengembalikan 401 tanpa sesi`);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.error, /login kembali/i);
    });
  }

  console.log("\n==========================================");
  console.log(`Total Berhasil: ${passed}`);
  console.log(`Total Gagal: ${failed}`);
  console.log("==========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
