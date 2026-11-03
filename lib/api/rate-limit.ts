// Batas mengikuti docs/API.md §1.2.
// MVP memakai memori proses: cukup untuk satu instance dev/demo. Bila deploy
// multi-instance, ganti penyimpanan ini dengan yang dibagi antar-instance.
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 5000

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > MAX_KEYS) prune(now)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  bucket.count += 1

  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

/** Hanya untuk pengujian — mengosongkan hitungan. */
export function resetRateLimits() {
  buckets.clear()
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}
