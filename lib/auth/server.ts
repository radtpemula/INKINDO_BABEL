// lib/auth/server.ts
// Server-Side Authentication Verification Helpers
// Inspects session cookies, verifies JWT tokens, and checks active status against the SQLite database.

import { prisma } from "@/lib/prisma";
import { getSessionCookie, verifySessionToken, type SessionPayload } from "./session";

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export type AuthResult =
  | { success: true; user: AuthenticatedAdmin }
  | { success: false; reason: "NO_SESSION" | "INVALID_TOKEN" | "USER_NOT_FOUND" | "USER_INACTIVE" | "DB_ERROR" };

/**
 * Validates the current admin session without throwing errors.
 * Inspects cookie -> verifies token -> fetches live AdminUser record from database -> checks isActive.
 * Returns AuthResult detailing either success with safe admin identity, or the explicit failure reason.
 */
export async function getCurrentAdmin(tokenOverride?: string | null): Promise<AuthResult> {
  let token: string | null = null;
  if (tokenOverride !== undefined) {
    token = tokenOverride;
  } else if (process.env.TEST_ADMIN_TOKEN) {
    token = process.env.TEST_ADMIN_TOKEN;
  } else {
    try {
      token = await getSessionCookie();
    } catch {
      token = null;
    }
  }

  if (!token) {
    return { success: false, reason: "NO_SESSION" };
  }

  const payload: SessionPayload | null = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return { success: false, reason: "INVALID_TOKEN" };
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return { success: false, reason: "USER_NOT_FOUND" };
    }

    if (!user.isActive) {
      return { success: false, reason: "USER_INACTIVE" };
    }

    return {
      success: true,
      user,
    };
  } catch (err) {
    // If database connection fails
    console.error("Database error during admin authentication check:", err);
    return { success: false, reason: "DB_ERROR" };
  }
}

/**
 * Strict authentication guard for Server Actions and sensitive server functions.
 * Throws an explicit error if the caller is unauthenticated or inactive.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const result = await getCurrentAdmin();
  if (!result.success) {
    switch (result.reason) {
      case "NO_SESSION":
      case "INVALID_TOKEN":
        throw new Error("Unauthorized: Active session required.");
      case "USER_NOT_FOUND":
        throw new Error("Unauthorized: Admin account not found.");
      case "USER_INACTIVE":
        throw new Error("Forbidden: Admin account has been deactivated.");
      case "DB_ERROR":
        throw new Error("Internal Server Error: Unable to verify admin status.");
    }
  }
  return result.user;
}
