/**
 * Simple in-memory rate limiter.
 * NOTE: This resets on each cold start and does not share state across
 * serverless instances. Replace with @upstash/ratelimit for production
 * multi-instance deployments.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Check and increment the rate limit counter for a given key.
 * @param key        Unique identifier (e.g. "mint:uid123")
 * @param maxRequests Maximum allowed requests in the window
 * @param windowMs   Window duration in milliseconds
 * @returns { allowed, remaining }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
