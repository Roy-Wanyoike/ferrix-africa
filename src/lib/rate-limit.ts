import { NextResponse } from "next/server";

// SEC-03: tiny in-memory fixed-window rate limiter, per server instance.
// Demo-scale by design (generous limits never trip during a demo) but it stops
// obvious runaway loops against the LLM-backed routes.

const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  // Lazy pruning: when the map grows, drop expired windows so it stays bounded.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfter: 0 };
}

// Best-effort client identity: first hop of x-forwarded-for, else "local".
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}

// Shared 429 response for tripped limits (with Retry-After in seconds).
export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests, try again shortly" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
