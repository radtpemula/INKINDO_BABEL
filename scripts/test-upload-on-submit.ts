import assert from "node:assert";
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
import { POST as partnerUploadPost } from "../app/api/admin/partner-upload/route";
import { POST as memberWorkUploadPost } from "../app/api/admin/member-work-upload/route";
import type { CheckCounter } from "./test-upload-on-submit-harness";
import { runDeferredFlowChecks } from "./test-upload-on-submit-flows";
import { runDeferredDbChecks } from "./test-upload-on-submit-db";

async function main(): Promise<void> {
  console.log("\n=== FASE 5C-1: PENGUJIAN UPLOAD-ON-SUBMIT (MITRA & KARYA ANGGOTA) ===");
  const originalCwd = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "inkindo-uos-"));
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
  process.chdir(tempRoot);

  try {
    await runDeferredFlowChecks(counter, tempRoot, partnerUploadPost, cookieHeader);
    await runDeferredDbChecks({
      counter,
      tempRoot,
      cookieHeader,
      partnerUploadPost,
      memberWorkUploadPost,
      createdPartnerIds,
      createdWorkIds,
    });
  } finally {
    resetUploadRateLimits();
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

  console.log(`\nRingkasan Fase 5C-1: ${counter.passed} lulus, ${counter.failed} gagal.`);
  if (counter.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
