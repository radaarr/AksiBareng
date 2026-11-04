import { describe, expect, test } from 'vitest'
import { toFieldIssues } from '@/lib/validation/common'
import { eventListQuerySchema } from '@/lib/validation/event'

describe('eventListQuerySchema', () => {
  test('tanpa filter memakai batas 20 dan tidak membatasi status', () => {
    const parsed = eventListQuerySchema.safeParse({})

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.limit).toBe(20)
      expect(parsed.data.status).toBeUndefined()
    }
  })

  test('limit dari query string diubah menjadi angka', () => {
    const parsed = eventListQuerySchema.safeParse({ limit: '5' })

    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.limit).toBe(5)
  })

  test('menolak status non-publik supaya draf tidak bisa diminta lewat katalog', () => {
    const parsed = eventListQuerySchema.safeParse({ status: 'DRAFT' })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error)).toEqual([
        { field: 'status', message: 'Status filter hanya boleh PUBLISHED atau ONGOING.' }
      ])
    }
  })

  test('menolak rentang tanggal terbalik dan batas jumlah di luar 1–50', () => {
    const reversed = eventListQuerySchema.safeParse({
      from: '2026-11-21T00:00:00Z',
      to: '2026-11-20T00:00:00Z'
    })
    expect(reversed.success).toBe(false)

    expect(eventListQuerySchema.safeParse({ limit: '0' }).success).toBe(false)
    expect(eventListQuerySchema.safeParse({ limit: '51' }).success).toBe(false)
  })

  test('mengubah from/to menjadi Date', () => {
    const parsed = eventListQuerySchema.safeParse({
      from: '2026-11-01T00:00:00Z',
      to: '2026-11-30T00:00:00Z'
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.from).toBeInstanceOf(Date)
      expect(parsed.data.to).toBeInstanceOf(Date)
    }
  })
})
