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
import { POST as partnerUploadPost } from "../app/api/admin/partner-upload/route";
import { POST as memberWorkUploadPost } from "../app/api/admin/member-work-upload/route";
import { runCheck, type CheckCounter } from "./test-upload-on-submit-harness";
import { runFailedSaveUnitChecks } from "./test-failed-save-unit";
import { runFailedSaveGuardChecks } from "./test-failed-save-guards";
import { runFailedSaveDbChecks } from "./test-failed-save-db";

const PHASE_4_ORPHAN_CANDIDATES = [
  "hero/hero-1791785991548-58b57df7eaa0440b8d147b858247f0ed.webp",
  "hero/hero-1791786151632-7d4c259b62ac464bb89647a3e51c21d4.webp",
  "hero/hero-1791799116438-18da0c0828aa47a58e75fc8ce58cf246.jpg",
  "hero/hero-1791860759084-0408044d33564a80ac3bd6ca15dbec58.jpg",
  "news/inline/inline-1793760431155-7c0de608fc63408e885409355620197d.png",
] as const;

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
  console.log("\n=== FASE 5C-2: PENGUJIAN SAFE FAILED-SAVE UPLOAD HANDLING ===");
  const originalCwd = process.cwd();
  const realUploadsDir = path.join(originalCwd, "public", "uploads");
  const beforeUploads = snapshotDirectory(realUploadsDir);

  for (const candidate of PHASE_4_ORPHAN_CANDIDATES) {
    assert.ok(
      beforeUploads.some((entry) => entry.relPath === candidate),
      `Baseline kandidat orphan wajib ada sebelum tes: ${candidate}`
    );
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "inkindo-fs-"));
  const createdPartnerIds: string[] = [];
  const createdWorkIds: string[] = [];
  const counter: CheckCounter = { passed: 0, failed: 0 };

  fs.mkdirSync(path.join(tempRoot, "public", "uploads", "partners"), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, "public", "uploads", "member-works"), { recursive: true });

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
    await runFailedSaveUnitChecks({
      counter,
      tempRoot,
      cookieHeader,
      partnerUploadPost,
    });
    await runFailedSaveGuardChecks(counter, tempRoot, admin.id);
    await runFailedSaveDbChecks({
      counter,
      tempRoot,
      adminId: admin.id,
      cookieHeader,
      partnerUploadPost,
      memberWorkUploadPost,
      createdPartnerIds,
      createdWorkIds,
    });
  } finally {
    resetUploadRateLimits();
    resetUploadCoordinatorForTests();
    process.chdir(originalCwd);
    if (createdPartnerIds.length > 0) {
      await prisma.partner.deleteMany({ where: { id: { in: createdPartnerIds } } });
    }
    if (createdWorkIds.length > 0) {
      await prisma.memberWork.deleteMany({ where: { id: { in: createdWorkIds } } });
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  }

  await runCheck(
    counter,
    "11 & 12. Lima kandidat orphan lama dan seluruh public/uploads pengguna tetap 100% utuh",
    () => {
      const afterUploads = snapshotDirectory(realUploadsDir);
      assert.strictEqual(afterUploads.length, beforeUploads.length);
      for (let i = 0; i < beforeUploads.length; i += 1) {
        assert.deepStrictEqual(afterUploads[i], beforeUploads[i]);
      }
      for (const candidate of PHASE_4_ORPHAN_CANDIDATES) {
        assert.ok(afterUploads.some((entry) => entry.relPath === candidate));
      }
    }
  );

  console.log(`\nRingkasan Fase 5C-2: ${counter.passed} lulus, ${counter.failed} gagal.`);
  if (counter.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
