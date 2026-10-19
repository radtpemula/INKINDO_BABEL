// lib/auth/session.ts
// JWT Session and Cookie Management using `jose`
// Modular and URL-agnostic. Uses Web Crypto API compatible with Node.js runtime.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "inkindo_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionPayload extends JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
}

/**
 * Retrieves the SESSION_SECRET from process.env and converts it to a Uint8Array key.
 * Throws a clear, explicit error if the secret is missing or insecure (< 32 characters).
 */
export function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is missing. Set a random string with at least 32 characters."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is too short. It must be at least 32 characters long for secure HS256 encryption."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates and signs a JWT session token with explicit HS256 algorithm and expiration.
 * Never includes passwords or sensitive secrets in the payload.
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  expiresInSeconds: number = SESSION_DURATION_SECONDS
): Promise<string> {
  const secretKey = getSessionSecretKey();

  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretKey);
}

/**
 * Verifies a JWT session token's signature, algorithm, and expiration.
 * Returns the decoded SessionPayload if valid, or null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }
  try {
    const secretKey = getSessionSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    // Signature mismatch, expired token, malformed format, etc.
    return null;
  }
}

/**
 * Default safe cookie options.
 * Path defaults to "/" and can be customized upon cookie setting.
 */
export function getDefaultCookieOptions(customPath: string = "/"): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: customPath,
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Sets the session cookie using Next.js `cookies()` helper.
 * Designed for Server Actions and Route Handlers.
 */
export async function setSessionCookie(
  token: string,
  options?: Partial<CookieOptions>
): Promise<void> {
  const cookieStore = await cookies();
  const baseOptions = getDefaultCookieOptions();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...baseOptions,
    ...options,
  });
}

/**
 * Reads the session token from cookies using Next.js `cookies()` helper.
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Deletes the session cookie by setting maxAge to 0.
 */
export async function deleteSessionCookie(customPath: string = "/"): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: customPath,
    maxAge: 0,
  });
}
