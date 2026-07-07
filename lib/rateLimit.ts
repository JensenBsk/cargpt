// Sliding-window rate limiter, in-memory per serverless instance.
// On Vercel this limits per-instance, not globally — still enough to stop a
// single client from draining the Anthropic budget, since one IP hitting the
// same region tends to land on warm instances. For a global guarantee, swap
// `check` for an Upstash Redis implementation (@upstash/ratelimit) — the
// call sites won't need to change.

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number, windowMs: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.timestamps.every((t) => now - t > windowMs)) buckets.delete(key);
  }
}

export function getClientIp(request: Request): string {
  // Vercel sets x-forwarded-for; the leftmost entry is the client.
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key       unique key, e.g. `diagnose:${ip}`
 * @param limit     max requests per window
 * @param windowMs  window length in ms (default 60s)
 */
export function check(key: string, limit: number, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  prune(now, windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  return { ok: true, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}

/** Standard 429 response with Retry-After header. */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}

/**
 * One-liner guard for route handlers. Returns a 429 Response when limited,
 * or null when the request may proceed.
 */
export function rateLimit(request: Request, route: string, limit: number, windowMs = 60_000): Response | null {
  const result = check(`${route}:${getClientIp(request)}`, limit, windowMs);
  return result.ok ? null : tooManyRequests(result);
}
