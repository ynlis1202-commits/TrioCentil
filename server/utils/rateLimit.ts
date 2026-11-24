import type { H3Event } from 'h3'
import { createError, getRequestIP } from 'h3'

interface RateLimitBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

// Cleanup expired entries periodically
function pruneExpired(now: number) {
  if (buckets.size < 500) return
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function checkRateLimit(
  event: H3Event,
  options: { keyPrefix: string; maxRequests: number; windowMs: number }
): void {
  const now = Date.now()
  pruneExpired(now)

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const bucketKey = `${options.keyPrefix}:${ip}`
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    })
    return
  }

  existing.count += 1
  if (existing.count > options.maxRequests) {
    const retrySeconds = Math.ceil((existing.resetAt - now) / 1000)
    throw createError({
      statusCode: 429,
      statusMessage: `Terlalu banyak permintaan. Silakan coba lagi dalam ${retrySeconds} detik.`
    })
  }
}
