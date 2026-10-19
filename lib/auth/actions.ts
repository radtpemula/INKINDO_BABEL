// lib/auth/actions.ts
// Server Actions for INKINDO BABEL Admin Authentication
// Handles login verification, session cookie creation, and secure logout.
// Never exposes password hashes, secrets, or internal stack traces to the client.

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { createSessionToken, setSessionCookie, deleteSessionCookie } from "./session";

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action for Administrator Login
 * Accepts identifier (username or email) and password.
 * Validates credentials against live AdminUser table.
 * Returns generic error message on failure to prevent user enumeration.
 */
export async function loginAdminAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const identifier = formData.get("identifier")?.toString().trim();
  const password = formData.get("password")?.toString();

  // Basic format validation
  if (!identifier || !password) {
    return {
      success: false,
      error: "Username/email dan password wajib diisi.",
    };
  }

  if (identifier.length > 100 || password.length > 128) {
    return {
      success: false,
      error: "Kombinasi akun atau kata sandi tidak valid.",
    };
  }

  try {
    // Search account by username or email (case-insensitive for email/username)
    const normalizedIdentifier = identifier.toLowerCase();
    const user = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: normalizedIdentifier },
        ],
      },
    });

    // If account not found or deactivated, return generic error
    if (!user || !user.isActive) {
      return {
        success: false,
        error: "Kombinasi akun atau kata sandi tidak valid.",
      };
    }

    // Constant-time bcrypt password check
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Kombinasi akun atau kata sandi tidak valid.",
      };
    }

    // Update last login timestamp asynchronously
    try {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (updateErr) {
      // Non-critical, continue login flow even if timestamp update fails
      console.error("Warning: Gagal memperbarui lastLoginAt admin:", updateErr);
    }

    // Create signed JWT session token (8 hours)
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Set secure HttpOnly session cookie
    await setSessionCookie(token);
  } catch (err) {
    // Do not leak database or system error internals
    console.error("Admin login processing error:", err instanceof Error ? err.message : "Unknown");
    return {
      success: false,
      error: "Terjadi gangguan sistem saat memproses login. Silakan coba kembali.",
    };
  }

  // Redirect to admin dashboard on success
  redirect("/babel-and-adt");
}

/**
 * Server Action for Administrator Logout
 * Invalidates and deletes the session cookie, then redirects to admin login.
 */
export async function logoutAdminAction(): Promise<void> {
  await deleteSessionCookie();
  redirect("/babel-and-adt/login");
}
