import type { NextRequest } from "next/server";

export interface RateLimitOptions {
  readonly windowMs?: number;
  readonly maxRequests?: number;
}

export interface RateLimitResult {
  readonly isAllowed: boolean;
  readonly remaining: number;
  readonly resetMs: number;
  readonly retryAfterSeconds: number;
}

interface RateRecord {
  count: number;
  resetTime: number;
}

const DEFAULT_UPLOAD_WINDOW_MS = 60 * 1000;
const DEFAULT_UPLOAD_MAX_REQUESTS = 30;
const MAX_STORE_SIZE = 10_000;

const rateLimitStore = new Map<string, RateRecord>();

function cleanupExpired(now: number): void {
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkUploadRateLimit(
  identifier: string,
  options?: RateLimitOptions
): RateLimitResult {
  const windowMs = options?.windowMs ?? DEFAULT_UPLOAD_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_UPLOAD_MAX_REQUESTS;
  const now = Date.now();

  if (rateLimitStore.size > MAX_STORE_SIZE) {
    cleanupExpired(now);
  }

  const existing = rateLimitStore.get(identifier);

  if (!existing || existing.resetTime <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      isAllowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetMs: windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
      isAllowed: false,
      remaining: 0,
      resetMs: existing.resetTime - now,
      retryAfterSeconds: retryAfter,
    };
  }

  existing.count += 1;
  return {
    isAllowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetMs: existing.resetTime - now,
    retryAfterSeconds: 0,
  };
}

export function getClientIdentifier(
  request: Request | NextRequest,
  adminId?: string
): string {
  if (adminId && adminId.trim().length > 0) {
    return `admin:${adminId.trim()}`;
  }

  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return `ip:${firstIp}`;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return `ip:${realIp.trim()}`;
  }

  return "ip:anonymous";
}

export function resetUploadRateLimits(): void {
  rateLimitStore.clear();
}
