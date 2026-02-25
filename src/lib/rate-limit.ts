import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSec: number;
}

/**
 * Simple in-memory rate limiter keyed by user ID.
 * Returns null if allowed, or a NextResponse 429 if rate-limited.
 */
export function rateLimit(
  userId: string,
  route: string,
  { maxRequests, windowSec }: RateLimitOptions
): NextResponse | null {
  const key = `${userId}:${route}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return null;
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count++;
  return null;
}
