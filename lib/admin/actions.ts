// lib/admin/actions.ts
// Server Actions for Administrator User Management (Tahap 3)
// Strictly enforced: Only verified SUPER_ADMIN with active status may invoke these actions.
// Never exposes password hashes, secrets, or internal errors.
// Guarantees zero lock-out: prevents deactivating or demoting the last active SUPER_ADMIN, and prevents self-deactivation.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import { hashPassword } from "@/lib/auth/password";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Strict server-side verification:
 * 1. Checks current admin session and database status
 * 2. Enforces isActive === true
 * 3. Enforces role === "SUPER_ADMIN"
 * Returns AuthenticatedAdmin or throws an explicit security error.
 */
async function verifySuperAdmin(): Promise<AuthenticatedAdmin> {
  const auth = await getCurrentAdmin();
  if (!auth.success) {
    throw new Error("Akses ditolak: Sesi administrator tidak valid atau telah berakhir.");
  }

  if (!auth.user.isActive) {
    throw new Error("Akses ditolak: Akun administrator Anda telah dinonaktifkan.");
  }

  if (auth.user.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya SUPER_ADMIN yang memiliki izin untuk operasi ini.");
  }

  return auth.user;
}

/**
 * Fetch all administrators with optional keyword filtering.
 * Never returns passwordHash.
 */
export async function getAdminUsersAction(query?: string): Promise<ActionResult<AdminUserListItem[]>> {
  try {
    await verifySuperAdmin();

    const search = query?.trim().toLowerCase();

    const users = await prisma.adminUser.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { username: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    });

    const formattedList: AdminUserListItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: (u.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN") as "SUPER_ADMIN" | "ADMIN",
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: formattedList,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengambil daftar administrator.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Create a new administrator account.
 * Validates inputs, hashes password with bcrypt 12, ensures unique username and email.
 */
export async function createAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    await verifySuperAdmin();

    const name = formData.get("name")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();
    const roleInput = formData.get("role")?.toString().trim();

    // 1. Validation: Required fields
    if (!name || !username || !email || !password || !roleInput) {
      return {
        success: false,
        error: "Semua kolom wajib diisi.",
      };
    }

    // 2. Validation: Name
    if (name.length < 3 || name.length > 80) {
      return {
        success: false,
        error: "Nama lengkap harus terdiri dari 3 hingga 80 karakter.",
      };
    }

    // 3. Validation: Username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return {
        success: false,
        error: "Username hanya boleh huruf, angka, underscore, atau minus (3-30 karakter).",
      };
    }

    // 4. Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 100) {
      return {
        success: false,
        error: "Format alamat email tidak valid.",
      };
    }

    // 5. Validation: Password strength
    if (password.length < 8) {
      return {
        success: false,
        error: "Kata sandi minimal 8 karakter.",
      };
    }
    if (password.length > 128) {
      return {
        success: false,
        error: "Kata sandi maksimal 128 karakter.",
      };
    }

    // 6. Validation: Role
    if (roleInput !== "SUPER_ADMIN" && roleInput !== "ADMIN") {
      return {
        success: false,
        error: "Peran (role) hanya boleh SUPER_ADMIN atau ADMIN.",
      };
    }

    // 7. Check username conflict
    const existingUsername = await prisma.adminUser.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existingUsername) {
      return {
        success: false,
        error: `Username "${username}" sudah digunakan oleh pengelola lain.`,
      };
    }

    // 8. Check email conflict
    const existingEmail = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return {
        success: false,
        error: `Email "${email}" sudah terdaftar pada sistem.`,
      };
    }

    // 9. Hash password securely
    const passwordHash = await hashPassword(password);

    // 10. Persist to database
    const createdUser = await prisma.adminUser.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role: roleInput,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/babel-and-adt/admin");
    return {
      success: true,
      message: `Akun administrator "${username}" berhasil ditambahkan.`,
      data: {
        id: createdUser.id,
        name: createdUser.name,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role as "SUPER_ADMIN" | "ADMIN",
        isActive: createdUser.isActive,
        lastLoginAt: createdUser.lastLoginAt ? createdUser.lastLoginAt.toISOString() : null,
        createdAt: createdUser.createdAt.toISOString(),
        updatedAt: createdUser.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat menambahkan admin.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Edit existing administrator account details (name, username, email, role).
 * Prevents demoting the last active SUPER_ADMIN.
 */
export async function updateAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    await verifySuperAdmin();

    const id = formData.get("id")?.toString().trim();
    const name = formData.get("name")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const roleInput = formData.get("role")?.toString().trim();

    if (!id || !name || !username || !email || !roleInput) {
      return {
        success: false,
        error: "Semua data identitas wajib diisi.",
      };
    }

    // Name validation
    if (name.length < 3 || name.length > 80) {
      return {
        success: false,
        error: "Nama lengkap harus terdiri dari 3 hingga 80 karakter.",
      };
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return {
        success: false,
        error: "Username hanya boleh huruf, angka, underscore, atau minus (3-30 karakter).",
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 100) {
      return {
        success: false,
        error: "Format alamat email tidak valid.",
      };
    }

    // Role validation
    if (roleInput !== "SUPER_ADMIN" && roleInput !== "ADMIN") {
      return {
        success: false,
        error: "Peran (role) hanya boleh SUPER_ADMIN atau ADMIN.",
      };
    }

    // Fetch target user
    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "Akun administrator tidak ditemukan.",
      };
    }

    if (targetUser.role === "SUPER_ADMIN" && roleInput === "ADMIN") {
      const otherActiveSuperAdminCount = await prisma.adminUser.count({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
          id: { not: targetUser.id },
        },
      });

      if (otherActiveSuperAdminCount === 0) {
        return {
          success: false,
          error: "Peran tidak dapat diubah: Sistem harus memiliki setidaknya satu SUPER_ADMIN aktif.",
        };
      }
    }

    // Unique username check (excluding self)
    if (username !== targetUser.username) {
      const conflictUsername = await prisma.adminUser.findUnique({
        where: { username },
        select: { id: true },
      });
      if (conflictUsername && conflictUsername.id !== id) {
        return {
          success: false,
          error: `Username "${username}" sudah digunakan oleh pengelola lain.`,
        };
      }
    }

    // Unique email check (excluding self)
    if (email !== targetUser.email) {
      const conflictEmail = await prisma.adminUser.findUnique({
        where: { email },
        select: { id: true },
      });
      if (conflictEmail && conflictEmail.id !== id) {
        return {
          success: false,
          error: `Email "${email}" sudah terdaftar pada sistem.`,
        };
      }
    }

    // Update record
    await prisma.adminUser.update({
      where: { id },
      data: {
        name,
        username,
        email,
        role: roleInput,
      },
    });

    revalidatePath("/babel-and-adt/admin");
    return {
      success: true,
      message: `Data administrator "${username}" berhasil diperbarui.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui akun.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Toggle Active/Inactive status of an administrator.
 * Critical guards:
 * 1. User cannot deactivate their own active session.
 * 2. Cannot deactivate the last active SUPER_ADMIN.
 */
export async function toggleAdminActiveAction(userId: string): Promise<ActionResult> {
  try {
    const currentAdmin = await verifySuperAdmin();

    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "ID administrator tidak valid.",
      };
    }

    // 1. Guard against self-deactivation
    if (currentAdmin.id === userId) {
      return {
        success: false,
        error: "Aksi ditolak: Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.",
      };
    }

    // Fetch target user
    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "Akun administrator tidak ditemukan.",
      };
    }

    const nextActiveState = !targetUser.isActive;

    // 2. Guard against deactivating the last active SUPER_ADMIN
    if (!nextActiveState && targetUser.role === "SUPER_ADMIN") {
      const activeSuperAdminCount = await prisma.adminUser.count({
        where: { role: "SUPER_ADMIN", isActive: true },
      });

      if (activeSuperAdminCount <= 1) {
        return {
          success: false,
          error: "Aksi ditolak: Tidak dapat menonaktifkan akun SUPER_ADMIN terakhir yang masih aktif pada sistem.",
        };
      }
    }

    // Update active status
    await prisma.adminUser.update({
      where: { id: userId },
      data: { isActive: nextActiveState },
    });

    revalidatePath("/babel-and-adt/admin");
    return {
      success: true,
      message: `Akun "${targetUser.username}" berhasil ${nextActiveState ? "diaktifkan kembali" : "dinonaktifkan"}.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengubah status akun.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Reset password for a specific administrator account.
 * Hashes new password with bcrypt 12 rounds.
 * Never logs plaintext passwords or hashes.
 */
export async function resetAdminPasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    await verifySuperAdmin();

    const userId = formData.get("userId")?.toString().trim();
    const newPassword = formData.get("newPassword")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!userId || !newPassword || !confirmPassword) {
      return {
        success: false,
        error: "ID pengelola dan kata sandi baru wajib diisi.",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: "Kata sandi baru minimal 8 karakter.",
      };
    }

    if (newPassword.length > 128) {
      return {
        success: false,
        error: "Kata sandi maksimal 128 karakter.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: "Konfirmasi kata sandi tidak cocok.",
      };
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "Akun administrator tidak ditemukan.",
      };
    }

    // Hash securely without logging
    const passwordHash = await hashPassword(newPassword);

    await prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/babel-and-adt/admin");
    return {
      success: true,
      message: `Kata sandi akun "${targetUser.username}" berhasil direset.`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat mereset kata sandi.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}
