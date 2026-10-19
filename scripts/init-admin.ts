// scripts/init-admin.ts
// Interactive CLI script for initializing an AdminUser in INKINDO BABEL
// Manual execution only. Never executed automatically by build or server startup.

import readline from "node:readline";
import path from "node:path";
import fs from "node:fs";

// Load environment variables if .env exists, or resolve default SQLite database path
function ensureEnvironment(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // Ignore if loadEnvFile encounters parse quirks
    }
  }

  if (!process.env.DATABASE_URL) {
    const defaultDbPath = path.resolve(process.cwd(), "prisma/dev.db");
    process.env.DATABASE_URL = `file:${defaultDbPath}`;
  }
}

ensureEnvironment();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

// Asynchronous line consumer using async iterator over process.stdin
class LineReader {
  private lineIterator: AsyncIterator<string>;
  private isTTY: boolean;

  constructor() {
    this.isTTY = Boolean(process.stdin.isTTY);
    const rl = readline.createInterface({
      input: process.stdin,
      crlfDelay: Infinity,
    });
    this.lineIterator = rl[Symbol.asyncIterator]();
  }

  async askText(promptMessage: string): Promise<string> {
    process.stdout.write(promptMessage);
    const next = await this.lineIterator.next();
    if (next.done) {
      throw new Error("Input stream ended unexpectedly.");
    }
    return (next.value ?? "").trim();
  }

  async askPassword(promptMessage: string): Promise<string> {
    process.stdout.write(promptMessage);

    if (this.isTTY) {
      return new Promise<string>((resolve) => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf-8");

        let password = "";

        const onData = (chunk: string) => {
          for (const char of chunk) {
            if (char === "\r" || char === "\n" || char === "\u0004") {
              process.stdin.setRawMode(false);
              process.stdin.pause();
              process.stdin.removeListener("data", onData);
              process.stdout.write("\n");
              resolve(password);
              return;
            } else if (char === "\u0003") {
              // Ctrl+C
              process.stdin.setRawMode(false);
              process.stdout.write("\nProcess cancelled.\n");
              process.exit(130);
            } else if (char === "\u0008" || char === "\x7f") {
              // Backspace
              if (password.length > 0) {
                password = password.slice(0, -1);
                process.stdout.write("\b \b");
              }
            } else {
              password += char;
              process.stdout.write("*");
            }
          }
        };

        process.stdin.on("data", onData);
      });
    } else {
      // Non-interactive/piped/scripted input
      const next = await this.lineIterator.next();
      if (next.done) {
        throw new Error("Input stream ended unexpectedly.");
      }
      return (next.value ?? "").trim();
    }
  }
}

// Input validation helpers
function validateUsername(username: string): string | null {
  if (!username || username.length < 3 || username.length > 32) {
    return "Username harus memiliki panjang antara 3 dan 32 karakter.";
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return "Username hanya boleh memuat huruf, angka, titik, garis bawah (_), atau strip (-).";
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (!email || email.length > 100) {
    return "Email harus diisi dan maksimal 100 karakter.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format alamat email tidak valid.";
  }
  return null;
}

function validateName(name: string): string | null {
  if (!name || name.length < 2 || name.length > 100) {
    return "Nama lengkap harus memiliki panjang antara 2 dan 100 karakter.";
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password minimal harus memiliki panjang 8 karakter.";
  }
  return null;
}

export async function main(): Promise<void> {
  console.log("\n=======================================================");
  console.log("  INKINDO BABEL - Inisialisasi Akun Admin Pertama CLI");
  console.log("=======================================================\n");

  const reader = new LineReader();

  try {
    // 1. Check existing accounts in database
    const existingAdminCount = await prisma.adminUser.count();
    if (existingAdminCount > 0) {
      console.log(`[INFO] Database saat ini telah memiliki ${existingAdminCount} akun admin.`);
      console.log("[INFO] Script ini dirancang aman dan tidak akan menimpa akun yang sudah ada.\n");
    } else {
      console.log("[INFO] Belum ada akun admin terdaftar. Memulai pembuatan akun admin pertama...\n");
    }

    // 2. Prompt Full Name
    const name = await reader.askText("Nama Lengkap Admin : ");
    const nameError = validateName(name);
    if (nameError) {
      console.error(`\n[ERROR] ${nameError}`);
      process.exit(1);
    }

    // 3. Prompt Username
    const username = await reader.askText("Username           : ");
    const usernameError = validateUsername(username);
    if (usernameError) {
      console.error(`\n[ERROR] ${usernameError}`);
      process.exit(1);
    }

    // Pre-check duplicate username
    const existingUsername = await prisma.adminUser.findUnique({
      where: { username },
    });
    if (existingUsername) {
      console.error(`\n[DUPLICATE] Akun dengan username '${username}' sudah terdaftar.`);
      console.error("[ABORT] Proses dihentikan untuk melindungi data yang ada tanpa menimpa.");
      process.exit(1);
    }

    // 4. Prompt Email
    const email = (await reader.askText("Email Address      : ")).toLowerCase();
    const emailError = validateEmail(email);
    if (emailError) {
      console.error(`\n[ERROR] ${emailError}`);
      process.exit(1);
    }

    // Pre-check duplicate email
    const existingEmail = await prisma.adminUser.findUnique({
      where: { email },
    });
    if (existingEmail) {
      console.error(`\n[DUPLICATE] Akun dengan email '${email}' sudah terdaftar.`);
      console.error("[ABORT] Proses dihentikan untuk melindungi data yang ada tanpa menimpa.");
      process.exit(1);
    }

    // 5. Prompt Role
    const roleInput = await reader.askText("Role [SUPER_ADMIN/ADMIN] (default: SUPER_ADMIN): ");
    const role = roleInput.toUpperCase() === "ADMIN" ? "ADMIN" : "SUPER_ADMIN";

    // 6. Prompt Password securely (masked on TTY, silent line on pipe)
    const password = await reader.askPassword("Password Admin     : ");
    const passwordError = validatePassword(password);
    if (passwordError) {
      console.error(`\n[ERROR] ${passwordError}`);
      process.exit(1);
    }

    // 7. Prompt Password Confirmation
    const passwordConfirm = await reader.askPassword("Konfirmasi Password: ");
    if (password !== passwordConfirm) {
      console.error("\n[ERROR] Konfirmasi password tidak cocok dengan password yang dimasukkan.");
      process.exit(1);
    }

    // 8. Hash password safely
    console.log("\n[PROCESSING] Menghasilkan secure hash (bcrypt 12 salt rounds)...");
    const passwordHash = await hashPassword(password);

    // 9. Save to database with atomic concurrency / duplicate protection
    console.log("[PROCESSING] Menyimpan data akun admin ke database...");
    const createdAdmin = await prisma.adminUser.create({
      data: {
        username,
        email,
        name,
        role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("\n=======================================================");
    console.log("  BERHASIL: Akun Admin Berhasil Dibuat!");
    console.log("=======================================================");
    console.log(`ID         : ${createdAdmin.id}`);
    console.log(`Username   : ${createdAdmin.username}`);
    console.log(`Nama       : ${createdAdmin.name}`);
    console.log(`Email      : ${createdAdmin.email}`);
    console.log(`Role       : ${createdAdmin.role}`);
    console.log(`Status     : ${createdAdmin.isActive ? "AKTIF" : "NONAKTIF"}`);
    console.log(`Dibuat     : ${createdAdmin.createdAt.toISOString()}`);
    console.log("=======================================================\n");
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      console.error("\n[DUPLICATE ERROR] Terjadi konflik unique constraint pada database (username atau email sudah terdaftar).");
      console.error("[ABORT] Akun tidak dibuat.");
    } else {
      console.error("\n[FATAL ERROR] Gagal membuat akun admin:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly from CLI
if (require.main === module) {
  main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
}
