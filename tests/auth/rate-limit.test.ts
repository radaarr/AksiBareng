import { beforeEach, describe, expect, test } from 'vitest'
import { rateLimit, resetRateLimits } from '@/lib/api/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits()
  })

  test('mengizinkan sampai batas lalu memblokir dengan Retry-After', () => {
    const start = 1_000_000

    expect(rateLimit('kunci-a', 2, 60_000, start).allowed).toBe(true)
    expect(rateLimit('kunci-a', 2, 60_000, start + 1_000).allowed).toBe(true)

    const blocked = rateLimit('kunci-a', 2, 60_000, start + 2_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  test('hitungan direset setelah jendela waktu lewat', () => {
    const start = 1_000_000

    rateLimit('kunci-b', 1, 60_000, start)
    expect(rateLimit('kunci-b', 1, 60_000, start + 30_000).allowed).toBe(false)
    expect(rateLimit('kunci-b', 1, 60_000, start + 60_001).allowed).toBe(true)
  })

  test('kunci berbeda tidak saling memengaruhi', () => {
    const start = 1_000_000

    rateLimit('kunci-c', 1, 60_000, start)
    expect(rateLimit('kunci-c', 1, 60_000, start + 1).allowed).toBe(false)
    expect(rateLimit('kunci-d', 1, 60_000, start + 1).allowed).toBe(true)
  })
})
