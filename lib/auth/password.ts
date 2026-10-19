// lib/auth/password.ts
// Secure password hashing and verification using bcryptjs
// Never logs passwords, never returns raw hashes to untrusted contexts

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 * @throws {Error} if password is empty or invalid
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string" || password.trim().length === 0) {
    throw new Error("Password must be a non-empty string");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * Constant-time comparison handled internally by bcrypt.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof password !== "string" || typeof hash !== "string") {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // If the hash is malformed or invalid bcrypt format
    return false;
  }
}
