// src/lib/rate-limit.ts
// Simple in-memory rate limiter for API routes.
// Uses a sliding-window counter keyed by IP address.
// Works perfectly for a single-server deployment (Render, VPS, local).

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check and increment rate limit for a given key.
 * @param key      Unique key (e.g. IP address + route)
 * @param max      Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns { ok: true } if allowed, { ok: false, retryAfterSec } if blocked
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { ok: true };
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  entry.count += 1;
  return { ok: true };
}

/**
 * Extract a best-effort client IP from a Next.js request.
 */
export function getClientIp(req: Request): string {
  const fwd = (req as any).headers?.get?.("x-forwarded-for") as string | null;
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
