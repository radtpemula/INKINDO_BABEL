import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setupTestEnvironment } from "./test-db-helper";

const testDbUrl = setupTestEnvironment();
assert.ok(
  testDbUrl.includes("inkindo_test_db") &&
    !testDbUrl.includes("inkindo_babel_db") &&
    !testDbUrl.includes("dev.db"),
  "Pengujian wajib mengarah ke inkindo_test_db terisolasi."
);

import { prisma } from "../lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { resetUploadRateLimits } from "../lib/security/rate-limit";
import { resetUploadCoordinatorForTests } from "../lib/security/upload-coordinator";
import { POST as newsInlineUploadPost } from "../app/api/admin/news-inline-upload/route";
import { runCheck, type CheckCounter } from "./test-upload-on-submit-harness";
import { runTiptapInlineChecks } from "./test-tiptap-inline-cases";

interface FileSnapshot {
  readonly relPath: string;
  readonly size: number;
  readonly sha256: string;
}

function snapshotDirectory(baseDir: string): readonly FileSnapshot[] {
  const entries: FileSnapshot[] = [];
  function walk(dir: string): void {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (item.isFile()) {
        const buf = fs.readFileSync(full);
        entries.push({
          relPath: path.relative(baseDir, full),
          size: buf.length,
          sha256: crypto.createHash("sha256").update(buf).digest("hex"),
        });
      }
    }
  }
  walk(baseDir);
  return entries;
}

async function main(): Promise<void> {
  console.log("\n=== TIPTAP INLINE IMAGE LIFECYCLE: PENGUJIAN TERISOLASI ===");
  const originalCwd = process.cwd();
  const realUploadsDir = path.join(originalCwd, "public", "uploads");
  const beforeUploads = snapshotDirectory(realUploadsDir);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "inkindo-tiptap-"));
  const createdArticleIds: string[] = [];
  const counter: CheckCounter = { passed: 0, failed: 0 };

  fs.mkdirSync(path.join(tempRoot, "public", "uploads", "news", "inline"), { recursive: true });

  const admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  assert.ok(admin, "Harus tersedia admin aktif di inkindo_test_db.");
  const token = await createSessionToken({
    userId: admin.id,
    username: admin.username,
    role: admin.role,
  });
  process.env.TEST_ADMIN_TOKEN = token;
  const cookieHeader = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;

  resetUploadRateLimits();
  resetUploadCoordinatorForTests();
  process.chdir(tempRoot);

  try {
    await runTiptapInlineChecks({
      counter,
      tempRoot,
      cookieHeader,
      adminId: admin.id,
      inlineUploadPost: newsInlineUploadPost,
      createdArticleIds,
    });
  } finally {
    resetUploadRateLimits();
    resetUploadCoordinatorForTests();
    process.chdir(originalCwd);
    if (createdArticleIds.length > 0) {
      await prisma.newsArticle.deleteMany({ where: { id: { in: createdArticleIds } } });
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  }

  await runCheck(counter, "11. Seluruh berkas public/uploads pengguna tetap 100% utuh", () => {
    const afterUploads = snapshotDirectory(realUploadsDir);
    assert.strictEqual(afterUploads.length, beforeUploads.length);
    for (let i = 0; i < beforeUploads.length; i += 1) {
      assert.deepStrictEqual(afterUploads[i], beforeUploads[i]);
    }
  });

  console.log(`\nRingkasan Tiptap Inline: ${counter.passed} lulus, ${counter.failed} gagal.`);
  if (counter.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
