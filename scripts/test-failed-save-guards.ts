import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";
import { rollbackPendingUploadCore, type OrphanCandidateEntry } from "../lib/admin/upload-rollback-core";
import { createSessionToken, getSessionSecretKey } from "../lib/auth/session";
import { type PrismaReferenceClient } from "../lib/security";
import {
  createSaveFailureReceiptToken,
  createUploadReceiptToken,
  verifyUploadReceiptToken,
} from "../lib/security/upload-receipt";
import { VALID_1X1_PNG, runCheck, type CheckCounter } from "./test-upload-on-submit-harness";

function createFailingPrismaClient(): PrismaReferenceClient {
  const boom = async (): Promise<never> => {
    throw new Error("Simulated database connection failure");
  };
  return {
    heroSlide: { findFirst: boom },
    siteSetting: { findFirst: boom },
    newsArticle: { findFirst: boom, findMany: boom },
    partner: { findFirst: boom },
    memberWork: { findFirst: boom },
  };
}

export async function runFailedSaveGuardChecks(
  counter: CheckCounter,
  tempRoot: string,
  adminId: string
): Promise<void> {
  await runCheck(
    counter,
    "8 & 9. DB check error (fail-safe), path ilegal, cross-module, dan token salah menolak penghapusan",
    async () => {
      const filePath = "/uploads/partners/partner-1799000000000-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png";
      const absFile = path.join(tempRoot, "public", filePath);
      fs.writeFileSync(absFile, VALID_1X1_PNG);

      const validToken = await createUploadReceiptToken({
        adminId,
        module: "partners",
        publicPath: filePath,
      });
      const validRollbackToken = await createSaveFailureReceiptToken({
        adminId,
        module: "partners",
        publicPath: filePath,
      });
      const verified = await verifyUploadReceiptToken(validToken, {
        adminId,
        module: "partners",
        publicPath: filePath,
      });
      assert.strictEqual(verified.valid, true);

      const okAdmin = async () => ({
        success: true as const,
        user: {
          id: adminId,
          username: "test",
          email: "t@e.com",
          name: "Test",
          role: "ADMIN" as const,
          isActive: true,
        },
      });

      const dbErrLogs: OrphanCandidateEntry[] = [];
      const dbErrRes = await rollbackPendingUploadCore(
        {
          module: "partners",
          publicPath: filePath,
          uploadToken: validToken,
          rollbackToken: validRollbackToken,
          saveOutcome: "definite_failure",
        },
        { getAdmin: okAdmin, prismaClient: createFailingPrismaClient(), reportOrphan: (e) => dbErrLogs.push(e) }
      );
      assert.strictEqual(dbErrRes.deleted, false);
      assert.strictEqual(dbErrRes.status, "still_referenced_or_unverified");
      assert.strictEqual(dbErrRes.retainedAsOrphanCandidate, true);
      assert.strictEqual(fs.existsSync(absFile), true);
      assert.strictEqual(dbErrLogs.length, 1);

      const badPaths = [
        "/uploads/hero/hero-1791867727366-44038ebe924d456799b96dd7636db4ed.jpg",
        "/uploads/news/inline/inline-1793760431155-7c0de608fc63408e885409355620197d.png",
        "/uploads/partners/../hero/test.png",
        "https://evil.example/a.png",
      ];
      for (const badPath of badPaths) {
        const badRes = await rollbackPendingUploadCore(
          {
            module: "partners",
            publicPath: badPath,
            uploadToken: validToken,
            rollbackToken: validRollbackToken,
            saveOutcome: "definite_failure",
          },
          {
            getAdmin: okAdmin,
            deleteFile: async () => {
              assert.fail(`Tidak boleh menghapus path ilegal: ${badPath}`);
            },
          }
        );
        assert.strictEqual(badRes.deleted, false);
        assert.strictEqual(badRes.status, "invalid_path");
      }

      const crossModuleRes = await rollbackPendingUploadCore(
        {
          module: "member-works",
          publicPath: "/uploads/member-works/work-1799000000000-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
          uploadToken: validToken,
          rollbackToken: validRollbackToken,
          saveOutcome: "definite_failure",
        },
        { getAdmin: okAdmin, reportOrphan: () => {} }
      );
      assert.strictEqual(crossModuleRes.deleted, false);
      assert.strictEqual(crossModuleRes.status, "invalid_token");

      const otherAdminRes = await rollbackPendingUploadCore(
        {
          module: "partners",
          publicPath: filePath,
          uploadToken: validToken,
          rollbackToken: validRollbackToken,
          saveOutcome: "definite_failure",
        },
        {
          getAdmin: async () => ({
            success: true as const,
            user: {
              id: "other-admin-id",
              username: "other",
              email: "o@e.com",
              name: "Other",
              role: "ADMIN" as const,
              isActive: true,
            },
          }),
          reportOrphan: () => {},
        }
      );
      assert.strictEqual(otherAdminRes.deleted, false);
      assert.strictEqual(otherAdminRes.status, "invalid_token");

      const unauthRes = await rollbackPendingUploadCore(
        {
          module: "partners",
          publicPath: filePath,
          uploadToken: validToken,
          rollbackToken: validRollbackToken,
          saveOutcome: "definite_failure",
        },
        { getAdmin: async () => ({ success: false, reason: "NO_SESSION" }), reportOrphan: () => {} }
      );
      assert.strictEqual(unauthRes.deleted, false);
      assert.strictEqual(unauthRes.status, "unauthorized");

      const inactiveRes = await rollbackPendingUploadCore(
        {
          module: "partners",
          publicPath: filePath,
          uploadToken: validToken,
          rollbackToken: validRollbackToken,
          saveOutcome: "definite_failure",
        },
        { getAdmin: async () => ({ success: false, reason: "USER_INACTIVE" }), reportOrphan: () => {} }
      );
      assert.strictEqual(inactiveRes.deleted, false);
      assert.strictEqual(inactiveRes.status, "unauthorized");

      const expectGuardReject = async (
        overrides: Partial<{
          readonly publicPath: string;
          readonly uploadToken: string;
          readonly rollbackToken: string | undefined;
        }>,
        expectedStatus: string
      ) => {
        const res = await rollbackPendingUploadCore(
          {
            module: "partners",
            publicPath: overrides.publicPath ?? filePath,
            uploadToken: overrides.uploadToken ?? validToken,
            rollbackToken:
              "rollbackToken" in overrides
                ? overrides.rollbackToken
                : validRollbackToken,
            saveOutcome: "definite_failure",
          },
          { getAdmin: okAdmin, reportOrphan: () => {} }
        );
        assert.strictEqual(res.deleted, false);
        assert.strictEqual(res.status, expectedStatus);
      };

      const otherPartnerPath = "/uploads/partners/partner-1799000000001-cccccccccccccccccccccccccccccccc.png";
      const absOtherPartner = path.join(tempRoot, "public", otherPartnerPath);
      fs.writeFileSync(absOtherPartner, VALID_1X1_PNG);
      await expectGuardReject({ publicPath: otherPartnerPath }, "invalid_token");
      assert.strictEqual(fs.existsSync(absOtherPartner), true);

      const forgedToken = await new SignJWT({ kind: "upload_receipt", adminId, module: "partners", publicPath: filePath })
        .setProtectedHeader({ alg: "HS256" })
        .setJti("forged-jti")
        .setIssuedAt()
        .setExpirationTime("900s")
        .sign(new TextEncoder().encode("wrong-secret-key-at-least-32-characters-long"));
      await expectGuardReject({ uploadToken: forgedToken }, "invalid_token");

      const expiredToken = await new SignJWT({ kind: "upload_receipt", adminId, module: "partners", publicPath: filePath })
        .setProtectedHeader({ alg: "HS256" })
        .setJti("expired-jti")
        .setIssuedAt(Math.floor(Date.now() / 1000) - 1200)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
        .sign(getSessionSecretKey());
      await expectGuardReject({ uploadToken: expiredToken }, "invalid_token");

      const sessionAsReceipt = await createSessionToken({ userId: adminId, username: "test", role: "ADMIN" });
      await expectGuardReject({ uploadToken: sessionAsReceipt }, "invalid_token");
      await expectGuardReject({ uploadToken: "" }, "invalid_token");
      await expectGuardReject({ rollbackToken: undefined }, "missing_failure_proof");
      await expectGuardReject({ rollbackToken: validToken }, "invalid_token");

      assert.strictEqual(fs.existsSync(absFile), true);
      fs.unlinkSync(absOtherPartner);
      fs.unlinkSync(absFile);
    }
  );
}
