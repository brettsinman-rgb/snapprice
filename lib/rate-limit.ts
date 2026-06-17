const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  options: { windowMs?: number; maxRequests?: number } = {}
) {
  const now = Date.now();
  const windowMs = options.windowMs ?? WINDOW_MS;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxRequests - bucket.count };
}
