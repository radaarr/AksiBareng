import { describe, expect, test } from 'vitest'
import { toFieldIssues } from '@/lib/validation/common'
import { eventCreateSchema, eventUpdateSchema } from '@/lib/validation/event'

const valid = {
  title: 'Bersih Pantai Teluk Penyu',
  description: 'Aksi bersih-bersih pantai bersama warga sekitar.',
  categoryId: 'a1000000-0000-4000-8000-000000000001',
  locationName: 'Pantai Teluk Penyu',
  publicAddress: 'Area pantai, Cilacap',
  city: 'Cilacap',
  startsAt: '2026-11-20T01:00:00Z',
  endsAt: '2026-11-20T05:00:00Z',
  quota: 20,
  registrationOpensAt: '2026-11-10T00:00:00Z',
  registrationClosesAt: '2026-11-18T23:59:00Z',
  cancellationDeadline: '2026-11-19T00:00:00Z'
}

describe('eventCreateSchema', () => {
  test('menerima payload lengkap dan mengubah waktu menjadi Date', () => {
    const parsed = eventCreateSchema.safeParse(valid)

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.startsAt).toBeInstanceOf(Date)
      expect(parsed.data.startsAt.toISOString()).toBe('2026-11-20T01:00:00.000Z')
    }
  })

  test('menolak waktu selesai sebelum waktu mulai pada field endsAt', () => {
    const parsed = eventCreateSchema.safeParse({ ...valid, endsAt: '2026-11-20T00:00:00Z' })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error)).toContainEqual({
        field: 'endsAt',
        message: 'Waktu selesai harus setelah waktu mulai.'
      })
    }
  })

  test('menolak penutupan pendaftaran sebelum pembukaannya', () => {
    const parsed = eventCreateSchema.safeParse({ ...valid, registrationClosesAt: '2026-11-09T00:00:00Z' })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error).map((issue) => issue.field)).toContain('registrationClosesAt')
    }
  })

  test.each([0, 5001, 12.5])('menolak kuota %s', (quota) => {
    const parsed = eventCreateSchema.safeParse({ ...valid, quota })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error).map((issue) => issue.field)).toContain('quota')
    }
  })

  test('menolak tanggal tanpa jam', () => {
    const parsed = eventCreateSchema.safeParse({ ...valid, startsAt: '2026-11-20' })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error).map((issue) => issue.field)).toContain('startsAt')
    }
  })
})

describe('eventUpdateSchema', () => {
  test('hanya memvalidasi field yang dikirim', () => {
    const parsed = eventUpdateSchema.safeParse({ quota: 30 })

    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data).toEqual({ quota: 30 })
  })

  test('menolak body kosong', () => {
    const parsed = eventUpdateSchema.safeParse({})

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(toFieldIssues(parsed.error)).toContainEqual({
        field: 'body',
        message: 'Tidak ada perubahan yang dikirim.'
      })
    }
  })
})
