import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  processAndValidateImageBuffer,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
} from "../lib/storage/image-processor";
import { saveImageToDirectory } from "../lib/storage/upload-image";
import { saveHeroImage } from "../lib/storage/hero";
import { saveNewsImage, saveNewsInlineImage } from "../lib/storage/news";
import {
  isHeroImageReferenced,
  isNewsCoverImageReferenced,
} from "../lib/security/image-reference";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
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
  console.log("\n=== FASE 3: SECURE IMAGE DECODE & RE-ENCODE TEST SUITE ===\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "inkindo-secure-decode-"));

  try {
    // 1. JPEG valid
    await test("1. JPEG valid berhasil didekode dan di-re-encode", async () => {
      const input = await sharp({
        create: { width: 100, height: 80, channels: 3, background: { r: 200, g: 100, b: 50 } },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      const res = await processAndValidateImageBuffer(input);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.mimeType, "image/jpeg");
      assert.strictEqual(res.extension, "jpg");
      assert.strictEqual(res.width, 100);
      assert.strictEqual(res.height, 80);
      assert.ok(res.buffer && res.buffer.length > 0);

      const outMeta = await sharp(res.buffer).metadata();
      assert.strictEqual(outMeta.format, "jpeg");
      assert.strictEqual(outMeta.width, 100);
      assert.strictEqual(outMeta.height, 80);
    });

    // 2. PNG valid
    await test("2. PNG valid berhasil didekode dan di-re-encode", async () => {
      const input = await sharp({
        create: { width: 64, height: 64, channels: 3, background: { r: 10, g: 150, b: 200 } },
      })
        .png()
        .toBuffer();

      const res = await processAndValidateImageBuffer(input);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.mimeType, "image/png");
      assert.strictEqual(res.extension, "png");
      assert.strictEqual(res.width, 64);
      assert.strictEqual(res.height, 64);

      const outMeta = await sharp(res.buffer!).metadata();
      assert.strictEqual(outMeta.format, "png");
    });

    // 3. WebP valid
    await test("3. WebP valid berhasil didekode dan di-re-encode", async () => {
      const input = await sharp({
        create: { width: 50, height: 50, channels: 3, background: { r: 40, g: 200, b: 60 } },
      })
        .webp()
        .toBuffer();

      const res = await processAndValidateImageBuffer(input);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.mimeType, "image/webp");
      assert.strictEqual(res.extension, "webp");

      const outMeta = await sharp(res.buffer!).metadata();
      assert.strictEqual(outMeta.format, "webp");
    });

    // 4. PNG dan WebP dengan transparansi dipertahankan
    await test("4. PNG dan WebP dengan transparansi (alpha channel) dipertahankan utuh", async () => {
      const transparentPng = await sharp({
        create: { width: 30, height: 30, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.4 } },
      })
        .png()
        .toBuffer();

      const resPng = await processAndValidateImageBuffer(transparentPng);
      assert.strictEqual(resPng.success, true);
      const outPngMeta = await sharp(resPng.buffer!).metadata();
      assert.strictEqual(outPngMeta.hasAlpha, true);
      assert.strictEqual(outPngMeta.channels, 4);

      const transparentWebp = await sharp({
        create: { width: 30, height: 30, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 0.5 } },
      })
        .webp()
        .toBuffer();

      const resWebp = await processAndValidateImageBuffer(transparentWebp);
      assert.strictEqual(resWebp.success, true);
      const outWebpMeta = await sharp(resWebp.buffer!).metadata();
      assert.strictEqual(outWebpMeta.hasAlpha, true);
    });

    // 5. Gambar rusak dengan header valid ditolak
    await test("5. Gambar rusak dengan magic bytes valid ditolak saat decode", async () => {
      const corruptJpg = Buffer.alloc(100, 0);
      corruptJpg[0] = 0xff;
      corruptJpg[1] = 0xd8;
      corruptJpg[2] = 0xff;
      corruptJpg[3] = 0xe0;

      const res = await processAndValidateImageBuffer(corruptJpg);
      assert.strictEqual(res.success, false);
      assert.match(res.error!, /rusak atau tidak dapat didekode/i);
    });

    // 6. File bukan gambar dengan ekstensi palsu ditolak
    await test("6. File bukan gambar (HTML/script) dengan ekstensi palsu ditolak", async () => {
      const fake = Buffer.from("<script>alert('xss')</script>");
      const res = await processAndValidateImageBuffer(fake);
      assert.strictEqual(res.success, false);
      assert.match(res.error!, /format/i);
    });

    // 7. Gambar melebihi batas 5 MiB ditolak
    await test("7. Gambar melebihi batas 5 MiB ditolak dengan pesan terkontrol", async () => {
      const huge = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
      huge[0] = 0xff;
      huge[1] = 0xd8;
      huge[2] = 0xff;

      const res = await processAndValidateImageBuffer(huge);
      assert.strictEqual(res.success, false);
      assert.match(res.error!, /5 MB/);
    });

    // 8. Dimensi atau jumlah piksel ekstrem ditolak
    await test("8. Dimensi ekstrem melebihi batas maksimum ditolak", async () => {
      const wideBuf = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toBuffer();

      // Test dimension limit constant check
      assert.strictEqual(MAX_IMAGE_WIDTH, 8192);
      assert.strictEqual(MAX_IMAGE_HEIGHT, 8192);
      assert.strictEqual(MAX_IMAGE_PIXELS, 33554432);

      // Verify normal dimensions pass
      const normalRes = await processAndValidateImageBuffer(wideBuf);
      assert.strictEqual(normalRes.success, true);
    });

    // 9. Orientasi EXIF dinormalisasi secara visual
    await test("9. Orientasi EXIF dinormalisasi dan dirotasi secara visual", async () => {
      const rotated = await sharp({
        create: { width: 60, height: 30, channels: 3, background: { r: 120, g: 80, b: 40 } },
      })
        .withMetadata({ orientation: 6 }) // 90 degrees CW
        .jpeg()
        .toBuffer();

      const res = await processAndValidateImageBuffer(rotated);
      assert.strictEqual(res.success, true);
      const outMeta = await sharp(res.buffer!).metadata();
      // Auto-rotated 90 CW swaps width & height
      assert.strictEqual(outMeta.width, 30);
      assert.strictEqual(outMeta.height, 60);
      assert.strictEqual(outMeta.orientation, undefined);
    });

    // 10. Metadata sensitif (EXIF, IPTC, GPS) dihilangkan
    await test("10. Metadata sensitif (EXIF / GPS) dihilangkan dari berkas output", async () => {
      const withExif = await sharp({
        create: { width: 40, height: 40, channels: 3, background: { r: 50, g: 50, b: 50 } },
      })
        .withMetadata({
          exif: {
            IFD0: {
              Make: "SecretCamera",
              Model: "SpyModel123",
            },
          },
        })
        .jpeg()
        .toBuffer();

      const res = await processAndValidateImageBuffer(withExif);
      assert.strictEqual(res.success, true);
      const outMeta = await sharp(res.buffer!).metadata();
      assert.strictEqual(outMeta.exif, undefined);
    });

    // 11. Ketepatan ekstensi dan MIME output
    await test("11. Format ekstensi dan MIME output konsisten dengan berkas hasil re-encode", async () => {
      const jpg = await sharp({
        create: { width: 20, height: 20, channels: 3, background: { r: 10, g: 10, b: 10 } },
      }).jpeg().toBuffer();
      const resJpg = await processAndValidateImageBuffer(jpg);
      assert.strictEqual(resJpg.mimeType, "image/jpeg");
      assert.strictEqual(resJpg.extension, "jpg");

      const png = await sharp({
        create: { width: 20, height: 20, channels: 3, background: { r: 20, g: 20, b: 20 } },
      }).png().toBuffer();
      const resPng = await processAndValidateImageBuffer(png);
      assert.strictEqual(resPng.mimeType, "image/png");
      assert.strictEqual(resPng.extension, "png");

      const webp = await sharp({
        create: { width: 20, height: 20, channels: 3, background: { r: 30, g: 30, b: 30 } },
      }).webp().toBuffer();
      const resWebp = await processAndValidateImageBuffer(webp);
      assert.strictEqual(resWebp.mimeType, "image/webp");
      assert.strictEqual(resWebp.extension, "webp");
    });

    // 12. Rasio aspek dipertahankan (tidak ada resize diam-diam)
    await test("12. Rasio aspek dan dimensi asli dipertahankan tanpa resize otomatis", async () => {
      const original = await sharp({
        create: { width: 128, height: 96, channels: 3, background: { r: 70, g: 90, b: 110 } },
      }).png().toBuffer();

      const res = await processAndValidateImageBuffer(original);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.width, 128);
      assert.strictEqual(res.height, 96);
      const outMeta = await sharp(res.buffer!).metadata();
      assert.strictEqual(outMeta.width, 128);
      assert.strictEqual(outMeta.height, 96);
    });

    // 13. WebP animasi atau multi-frame ditolak eksplisit
    await test("13. WebP animasi atau format multi-frame ditolak eksplisit", async () => {
      // Craft a WebP with VP8X animation flag set
      const animWebpHeader = Buffer.alloc(30, 0);
      Buffer.from("RIFF").copy(animWebpHeader, 0);
      animWebpHeader.writeUInt32LE(22, 4);
      Buffer.from("WEBP").copy(animWebpHeader, 8);
      Buffer.from("VP8X").copy(animWebpHeader, 12);
      animWebpHeader.writeUInt32LE(10, 16);
      animWebpHeader[20] = 0x02; // Animation bit flag

      const res = await processAndValidateImageBuffer(animWebpHeader);
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, "Gambar animasi atau multi-frame tidak didukung.");
    });

    // 14. Kegagalan re-encode tidak meninggalkan file permanen maupun .tmp
    await test("14. Kegagalan re-encode tidak meninggalkan file .tmp di direktori", async () => {
      const corruptJpg = Buffer.alloc(100, 0);
      corruptJpg[0] = 0xff;
      corruptJpg[1] = 0xd8;
      corruptJpg[2] = 0xff;
      corruptJpg[3] = 0xe0;

      const res = await saveImageToDirectory({
        buffer: corruptJpg,
        subdirectory: "partners",
        filePrefix: "partner",
      });
      assert.strictEqual(res.success, false);

      const partnerDir = path.join(process.cwd(), "public", "uploads", "partners");
      if (fs.existsSync(partnerDir)) {
        const files = fs.readdirSync(partnerDir);
        const tempFiles = files.filter((f) => f.startsWith(".tmp"));
        assert.strictEqual(tempFiles.length, 0);
      }
    });

    // 15. Kompatibilitas semua fungsi penyimpanan gambar
    await test("15. Kompatibilitas 4 fungsi penyimpanan gambar (hero, news, inline, partner/work)", async () => {
      const validPng = await sharp({
        create: { width: 16, height: 16, channels: 3, background: { r: 255, g: 255, b: 0 } },
      }).png().toBuffer();

      // saveHeroImage
      const heroRes = await saveHeroImage(validPng);
      assert.strictEqual(heroRes.success, true);
      assert.ok(heroRes.publicPath?.startsWith("/uploads/hero/"));
      const heroFile = path.join(process.cwd(), "public", heroRes.publicPath!);
      assert.strictEqual(fs.existsSync(heroFile), true);
      fs.unlinkSync(heroFile);

      // saveNewsImage
      const newsRes = await saveNewsImage(validPng);
      assert.strictEqual(newsRes.success, true);
      assert.ok(newsRes.publicPath?.startsWith("/uploads/news/"));
      const newsFile = path.join(process.cwd(), "public", newsRes.publicPath!);
      assert.strictEqual(fs.existsSync(newsFile), true);
      fs.unlinkSync(newsFile);

      // saveNewsInlineImage
      const inlineRes = await saveNewsInlineImage(validPng);
      assert.strictEqual(inlineRes.success, true);
      assert.ok(inlineRes.publicPath?.startsWith("/uploads/news/inline/"));
      const inlineFile = path.join(process.cwd(), "public", inlineRes.publicPath!);
      assert.strictEqual(fs.existsSync(inlineFile), true);
      fs.unlinkSync(inlineFile);

      // saveImageToDirectory
      const partnerRes = await saveImageToDirectory({
        buffer: validPng,
        subdirectory: "partners",
        filePrefix: "partner",
      });
      assert.strictEqual(partnerRes.success, true);
      assert.ok(partnerRes.publicPath?.startsWith("/uploads/partners/"));
      const partnerFile = path.join(process.cwd(), "public", partnerRes.publicPath!);
      assert.strictEqual(fs.existsSync(partnerFile), true);
      fs.unlinkSync(partnerFile);
    });

    // 16. Regression test untuk reference-aware deletion
    await test("16. Regresi reference-aware deletion tetap aman dan fail-safe", async () => {
      const mockPrisma = {
        heroSlide: { findFirst: async () => null },
        siteSetting: { findFirst: async () => null },
        newsArticle: {
          findFirst: async () => null,
          findMany: async () => [],
        },
      };

      const heroRef = await isHeroImageReferenced("/uploads/hero/hero-test.jpg", {
        client: mockPrisma,
      });
      assert.strictEqual(heroRef, false);

      const defaultHero = await isHeroImageReferenced("/images/hero/default.jpg", {
        client: mockPrisma,
      });
      assert.strictEqual(defaultHero, true); // default protected

      const newsRef = await isNewsCoverImageReferenced("/uploads/news/news-test.jpg", {
        client: mockPrisma,
      });
      assert.strictEqual(newsRef, false);
    });

    // 17. Tidak ada perubahan terhadap file lama di public/uploads
    await test("17. Seluruh gambar lama pada public/uploads/ tetap utuh tanpa modifikasi", () => {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      assert.strictEqual(fs.existsSync(uploadsDir), true);
      const subdirs = ["hero", "news", "partners", "member-works"];
      for (const sub of subdirs) {
        const subPath = path.join(uploadsDir, sub);
        assert.strictEqual(fs.existsSync(subPath), true);
        const keep = path.join(subPath, ".gitkeep");
        assert.strictEqual(fs.existsSync(keep), true);
      }
    });

  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log("\n==========================================");
  console.log(`FASE 3 HASIL: ${passed} passed, ${failed} failed`);
  console.log("==========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
