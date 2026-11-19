// allow: SIZE_OK — comprehensive reference-aware deletion test suite
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  extractImageSourcesFromHtml,
  normalizePathVariants,
  isHeroImageReferenced,
  isNewsCoverImageReferenced,
  isPartnerLogoReferenced,
  isMemberWorkImageReferenced,
  type PrismaReferenceClient,
} from "../lib/security/image-reference";

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(err);
  }
}

interface MockData {
  readonly heroSlides?: ReadonlyArray<{ readonly id: string; readonly imagePath: string }>;
  readonly siteSettings?: ReadonlyArray<{ readonly key: string; readonly value: string }>;
  readonly newsArticles?: ReadonlyArray<{ readonly id: string; readonly coverImagePath?: string | null; readonly content?: string }>;
  readonly partners?: ReadonlyArray<{ readonly id: string; readonly logoPath?: string | null }>;
  readonly memberWorks?: ReadonlyArray<{ readonly id: string; readonly imagePath?: string | null }>;
}

function createMockPrisma(data: MockData): PrismaReferenceClient {
  return {
    heroSlide: {
      findFirst: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where || {};
        const imagePathCond = where.imagePath as { in?: string[] } | string | undefined;
        const paths = typeof imagePathCond === "object" && imagePathCond !== null && "in" in imagePathCond
          ? (imagePathCond.in || [])
          : typeof imagePathCond === "string"
            ? [imagePathCond]
            : [];
        const idCond = where.id as { not?: string } | string | undefined;
        const excludeId = typeof idCond === "object" && idCond !== null && "not" in idCond ? idCond.not : undefined;
        const found = (data.heroSlides || []).find(
          (s) => paths.includes(s.imagePath) && (!excludeId || s.id !== excludeId)
        );
        return found ? { id: found.id } : null;
      },
    },
    siteSetting: {
      findFirst: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where || {};
        const valCond = where.value as { in?: string[] } | string | undefined;
        const values = typeof valCond === "object" && valCond !== null && "in" in valCond
          ? (valCond.in || [])
          : typeof valCond === "string"
            ? [valCond]
            : [];
        const key = where.key as string | undefined;
        const found = (data.siteSettings || []).find(
          (s) => values.includes(s.value) && (!key || s.key === key)
        );
        return found ? { key: found.key } : null;
      },
    },
    newsArticle: {
      findFirst: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where || {};
        const coverCond = where.coverImagePath as { in?: string[] } | string | undefined;
        const paths = typeof coverCond === "object" && coverCond !== null && "in" in coverCond
          ? (coverCond.in || [])
          : typeof coverCond === "string"
            ? [coverCond]
            : [];
        const idCond = where.id as { not?: string } | string | undefined;
        const excludeId = typeof idCond === "object" && idCond !== null && "not" in idCond ? idCond.not : undefined;
        const found = (data.newsArticles || []).find(
          (a) => a.coverImagePath && paths.includes(a.coverImagePath) && (!excludeId || a.id !== excludeId)
        );
        return found ? { id: found.id } : null;
      },
      findMany: async (args?: { where?: { OR?: Array<{ content?: { contains?: string } }> } }) => {
        const terms = (args?.where?.OR || [])
          .map((cond) => cond.content?.contains)
          .filter((t): t is string => typeof t === "string" && t.length > 0);
        return (data.newsArticles || [])
          .filter((a) => a.content && terms.some((t) => a.content!.includes(t)))
          .map((a) => ({ id: a.id, content: a.content! }));
      },
    },
    partner: {
      findFirst: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where || {};
        const logoCond = where.logoPath as { in?: string[] } | string | undefined;
        const paths = typeof logoCond === "object" && logoCond !== null && "in" in logoCond
          ? (logoCond.in || [])
          : typeof logoCond === "string"
            ? [logoCond]
            : [];
        const idCond = where.id as { not?: string } | string | undefined;
        const excludeId = typeof idCond === "object" && idCond !== null && "not" in idCond ? idCond.not : undefined;
        const found = (data.partners || []).find(
          (p) => p.logoPath && paths.includes(p.logoPath) && (!excludeId || p.id !== excludeId)
        );
        return found ? { id: found.id } : null;
      },
    },
    memberWork: {
      findFirst: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where || {};
        const imageCond = where.imagePath as { in?: string[] } | string | undefined;
        const paths = typeof imageCond === "object" && imageCond !== null && "in" in imageCond
          ? (imageCond.in || [])
          : typeof imageCond === "string"
            ? [imageCond]
            : [];
        const idCond = where.id as { not?: string } | string | undefined;
        const excludeId = typeof idCond === "object" && idCond !== null && "not" in idCond ? idCond.not : undefined;
        const found = (data.memberWorks || []).find(
          (w) => w.imagePath && paths.includes(w.imagePath) && (!excludeId || w.id !== excludeId)
        );
        return found ? { id: found.id } : null;
      },
    },
  };
}

async function main() {
  console.log("=== Testing Reference-Aware Image Deletion ===");

  // 1. HTML Image Extraction Tests
  await runTest("extractImageSourcesFromHtml: extracts single standard img tag", () => {
    const html = `<p>Test</p><img src="/uploads/news/inline/inline-1.jpg" alt="test" />`;
    const srcs = extractImageSourcesFromHtml(html);
    assert.deepStrictEqual(srcs, ["/uploads/news/inline/inline-1.jpg"]);
  });

  await runTest("extractImageSourcesFromHtml: extracts multiple img tags with mixed casing and attributes", () => {
    const html = `
      <div>
        <IMG SRC="/uploads/news/cover-1.webp" class="cover" />
        <figure>
          <img src='/uploads/news/inline/inline-2.png' alt='two' />
          <figcaption>caption</figcaption>
        </figure>
      </div>
    `;
    const srcs = extractImageSourcesFromHtml(html);
    assert.deepStrictEqual(srcs, ["/uploads/news/cover-1.webp", "/uploads/news/inline/inline-2.png"]);
  });

  await runTest("extractImageSourcesFromHtml: handles content without images or empty string", () => {
    assert.deepStrictEqual(extractImageSourcesFromHtml(""), []);
    assert.deepStrictEqual(extractImageSourcesFromHtml("<p>No images here</p>"), []);
    assert.deepStrictEqual(extractImageSourcesFromHtml("<img />"), []);
  });

  // 2. Path Normalization Tests
  await runTest("normalizePathVariants: normalizes with and without leading slash", () => {
    const p1 = normalizePathVariants("/uploads/hero/hero-1.webp");
    assert.strictEqual(p1.withSlash, "/uploads/hero/hero-1.webp");
    assert.strictEqual(p1.withoutSlash, "uploads/hero/hero-1.webp");

    const p2 = normalizePathVariants("uploads/partners/partner-1.png");
    assert.strictEqual(p2.withSlash, "/uploads/partners/partner-1.png");
    assert.strictEqual(p2.withoutSlash, "uploads/partners/partner-1.png");
  });

  // 3. Hero Reference Checker Tests
  await runTest("isHeroImageReferenced: protects default /images/ assets from deletion", async () => {
    const client = createMockPrisma({});
    const referenced = await isHeroImageReferenced("/images/hero-card.webp", { client });
    assert.strictEqual(referenced, true);
  });

  await runTest("isHeroImageReferenced: returns true for invalid hero path (fail-safe)", async () => {
    const client = createMockPrisma({});
    const referenced = await isHeroImageReferenced("../etc/passwd", { client });
    assert.strictEqual(referenced, true);
  });

  await runTest("isHeroImageReferenced: returns true when image is referenced by a HeroSlide", async () => {
    const client = createMockPrisma({
      heroSlides: [{ id: "slide-1", imagePath: "/uploads/hero/hero-1.webp" }],
    });
    const referenced = await isHeroImageReferenced("/uploads/hero/hero-1.webp", { client });
    assert.strictEqual(referenced, true);
  });

  await runTest("isHeroImageReferenced: returns true when image is referenced by SiteSetting", async () => {
    const client = createMockPrisma({
      siteSettings: [{ key: "hero_bg_image", value: "/uploads/hero/hero-bg.jpg" }],
    });
    const referenced = await isHeroImageReferenced("/uploads/hero/hero-bg.jpg", { client });
    assert.strictEqual(referenced, true);
  });

  await runTest("isHeroImageReferenced: returns false when only reference matches excludeSlideId", async () => {
    const client = createMockPrisma({
      heroSlides: [{ id: "slide-to-delete", imagePath: "/uploads/hero/hero-orphan.webp" }],
      siteSettings: [],
    });
    const referenced = await isHeroImageReferenced("/uploads/hero/hero-orphan.webp", {
      client,
      excludeSlideId: "slide-to-delete",
    });
    assert.strictEqual(referenced, false);
  });

  await runTest("isHeroImageReferenced: returns true when referenced by another slide even with excludeSlideId", async () => {
    const client = createMockPrisma({
      heroSlides: [
        { id: "slide-to-delete", imagePath: "/uploads/hero/hero-shared.webp" },
        { id: "slide-keeper", imagePath: "/uploads/hero/hero-shared.webp" },
      ],
    });
    const referenced = await isHeroImageReferenced("/uploads/hero/hero-shared.webp", {
      client,
      excludeSlideId: "slide-to-delete",
    });
    assert.strictEqual(referenced, true);
  });

  await runTest("isHeroImageReferenced: fail-safe returns true on database error", async () => {
    const brokenClient: PrismaReferenceClient = {
      heroSlide: {
        findFirst: async () => {
          throw new Error("DB connection lost");
        },
      },
    };
    const referenced = await isHeroImageReferenced("/uploads/hero/hero-1.webp", { client: brokenClient });
    assert.strictEqual(referenced, true);
  });

  // 4. News Cover Reference Checker Tests
  await runTest("isNewsCoverImageReferenced: returns true when referenced in another article coverImagePath", async () => {
    const client = createMockPrisma({
      newsArticles: [
        { id: "art-1", coverImagePath: "/uploads/news/news-shared.webp" },
        { id: "art-2", coverImagePath: "/uploads/news/news-shared.webp" },
      ],
    });
    const referenced = await isNewsCoverImageReferenced("/uploads/news/news-shared.webp", {
      client,
      excludeArticleId: "art-1",
    });
    assert.strictEqual(referenced, true);
  });

  await runTest("isNewsCoverImageReferenced: returns true when cover image is also used inline in article content", async () => {
    const client = createMockPrisma({
      newsArticles: [
        {
          id: "art-1",
          coverImagePath: "/uploads/news/news-single.webp",
          content: `<p>Intro</p><figure><img src="/uploads/news/news-single.webp" alt="chart" /></figure>`,
        },
      ],
    });
    // art-1 has it as cover, and is being deleted. But the content also references it!
    const referenced = await isNewsCoverImageReferenced("/uploads/news/news-single.webp", {
      client,
      excludeArticleId: "art-1",
    });
    assert.strictEqual(referenced, true);
  });

  await runTest("isNewsCoverImageReferenced: returns true when image is used inline in another article", async () => {
    const client = createMockPrisma({
      newsArticles: [
        { id: "art-1", coverImagePath: "/uploads/news/news-to-delete.webp", content: "<p>Hello</p>" },
        {
          id: "art-2",
          coverImagePath: "/uploads/news/news-other.webp",
          content: `<p>Reference</p><img src="/uploads/news/news-to-delete.webp" />`,
        },
      ],
    });
    const referenced = await isNewsCoverImageReferenced("/uploads/news/news-to-delete.webp", {
      client,
      excludeArticleId: "art-1",
    });
    assert.strictEqual(referenced, true);
  });

  await runTest("isNewsCoverImageReferenced: returns false when cover image is not referenced anywhere else", async () => {
    const client = createMockPrisma({
      newsArticles: [
        { id: "art-1", coverImagePath: "/uploads/news/news-to-delete.webp", content: "<p>Plain text</p>" },
        { id: "art-2", coverImagePath: "/uploads/news/news-other.webp", content: "<p>Other text</p>" },
      ],
    });
    const referenced = await isNewsCoverImageReferenced("/uploads/news/news-to-delete.webp", {
      client,
      excludeArticleId: "art-1",
    });
    assert.strictEqual(referenced, false);
  });

  await runTest("isNewsCoverImageReferenced: fail-safe returns true for invalid path or DB error", async () => {
    const client = createMockPrisma({});
    assert.strictEqual(await isNewsCoverImageReferenced("/uploads/news/../secret.webp", { client }), true);

    const brokenClient: PrismaReferenceClient = {
      newsArticle: {
        findFirst: async () => {
          throw new Error("Crash");
        },
        findMany: async () => {
          throw new Error("Crash");
        },
      },
    };
    assert.strictEqual(await isNewsCoverImageReferenced("/uploads/news/news-1.webp", { client: brokenClient }), true);
  });

  // 5. Partner Logo Reference Checker Tests
  await runTest("isPartnerLogoReferenced: returns true when referenced by partner", async () => {
    const client = createMockPrisma({
      partners: [{ id: "p-1", logoPath: "/uploads/partners/partner-1.png" }],
    });
    assert.strictEqual(await isPartnerLogoReferenced("/uploads/partners/partner-1.png", { client }), true);
  });

  await runTest("isPartnerLogoReferenced: returns false when excludePartnerId matches only record", async () => {
    const client = createMockPrisma({
      partners: [{ id: "p-1", logoPath: "/uploads/partners/partner-1.png" }],
    });
    assert.strictEqual(
      await isPartnerLogoReferenced("/uploads/partners/partner-1.png", { client, excludePartnerId: "p-1" }),
      false
    );
  });

  await runTest("isPartnerLogoReferenced: fail-safe returns true for invalid path or DB error", async () => {
    const client = createMockPrisma({});
    assert.strictEqual(await isPartnerLogoReferenced("/uploads/partners/invalid%.png", { client }), true);

    const brokenClient: PrismaReferenceClient = {
      partner: {
        findFirst: async () => {
          throw new Error("DB Error");
        },
      },
    };
    assert.strictEqual(await isPartnerLogoReferenced("/uploads/partners/partner-1.png", { client: brokenClient }), true);
  });

  // 6. Member Work Image Reference Checker Tests
  await runTest("isMemberWorkImageReferenced: returns true when referenced by member work", async () => {
    const client = createMockPrisma({
      memberWorks: [{ id: "w-1", imagePath: "/uploads/member-works/work-1.jpg" }],
    });
    assert.strictEqual(await isMemberWorkImageReferenced("/uploads/member-works/work-1.jpg", { client }), true);
  });

  await runTest("isMemberWorkImageReferenced: returns false when excludeWorkId matches only record", async () => {
    const client = createMockPrisma({
      memberWorks: [{ id: "w-1", imagePath: "/uploads/member-works/work-1.jpg" }],
    });
    assert.strictEqual(
      await isMemberWorkImageReferenced("/uploads/member-works/work-1.jpg", { client, excludeWorkId: "w-1" }),
      false
    );
  });

  await runTest("isMemberWorkImageReferenced: fail-safe returns true for invalid path or DB error", async () => {
    const client = createMockPrisma({});
    assert.strictEqual(await isMemberWorkImageReferenced("/uploads/member-works/sub/hack.jpg", { client }), true);

    const brokenClient: PrismaReferenceClient = {
      memberWork: {
        findFirst: async () => {
          throw new Error("DB Error");
        },
      },
    };
    assert.strictEqual(await isMemberWorkImageReferenced("/uploads/member-works/work-1.jpg", { client: brokenClient }), true);
  });

  // 7. Isolated File System Protection Test (Zero modification to public/uploads/)
  await runTest("file deletion guard: deletes only unreferenced file and preserves referenced file in isolated temp dir", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ref-del-guard-test-"));
    try {
      const referencedFilePath = path.join(tmpDir, "referenced.webp");
      const unreferencedFilePath = path.join(tmpDir, "unreferenced.webp");
      fs.writeFileSync(referencedFilePath, "data-1");
      fs.writeFileSync(unreferencedFilePath, "data-2");

      const client = createMockPrisma({
        heroSlides: [{ id: "s-1", imagePath: "/uploads/hero/referenced.webp" }],
      });

      // Simulation of deletion logic with reference check
      const check1 = await isHeroImageReferenced("/uploads/hero/referenced.webp", { client });
      if (!check1) {
        fs.unlinkSync(referencedFilePath);
      }

      const check2 = await isHeroImageReferenced("/uploads/hero/unreferenced.webp", { client });
      if (!check2) {
        fs.unlinkSync(unreferencedFilePath);
      }

      // Assertions
      assert.strictEqual(fs.existsSync(referencedFilePath), true, "Referenced file must NOT be deleted");
      assert.strictEqual(fs.existsSync(unreferencedFilePath), false, "Unreferenced file should be safely deleted");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
