import { describe, expect, test } from 'vitest'
import { formatDateTime, formatEventWindow } from '@/lib/events/format'
import {
  decodeEventCursor,
  encodeEventCursor,
  isPubliclyListed,
  isPubliclyVisible,
  isUuid
} from '@/lib/events/query'

const ID = 'a1000000-0000-4000-8000-000000000001'

describe('visibilitas katalog (K-07)', () => {
  test('katalog publik hanya memuat kegiatan terbit dan berlangsung', () => {
    expect(isPubliclyListed('PUBLISHED')).toBe(true)
    expect(isPubliclyListed('ONGOING')).toBe(true)
    expect(isPubliclyListed('DRAFT')).toBe(false)
    expect(isPubliclyListed('CANCELLED')).toBe(false)
    expect(isPubliclyListed('COMPLETED')).toBe(false)
  })

  test('detail publik menyembunyikan draf dan kegiatan yang dibatalkan', () => {
    expect(isPubliclyVisible('PUBLISHED')).toBe(true)
    expect(isPubliclyVisible('ONGOING')).toBe(true)
    expect(isPubliclyVisible('COMPLETED')).toBe(true)
    expect(isPubliclyVisible('DRAFT')).toBe(false)
    expect(isPubliclyVisible('CANCELLED')).toBe(false)
  })
})

describe('cursor keyset katalog', () => {
  test('bolak-balik encode/decode menghasilkan urutan yang sama', () => {
    const startsAt = new Date('2026-11-20T01:00:00.000Z')
    const decoded = decodeEventCursor(encodeEventCursor({ startsAt, id: ID }))

    expect(decoded).not.toBeNull()
    expect(decoded?.id).toBe(ID)
    expect(decoded?.startsAt.toISOString()).toBe(startsAt.toISOString())
  })

  test('cursor rusak menghasilkan null, bukan exception', () => {
    expect(decodeEventCursor('bukan-base64-json')).toBeNull()
    expect(decodeEventCursor(Buffer.from('{"t":"2026-11-20T01:00:00Z"}').toString('base64url'))).toBeNull()
    expect(
      decodeEventCursor(Buffer.from(`{"t":"2026-11-20T01:00:00Z","id":"bukan-uuid"}`).toString('base64url'))
    ).toBeNull()
    expect(
      decodeEventCursor(Buffer.from(`{"t":"bukan-tanggal","id":"${ID}"}`).toString('base64url'))
    ).toBeNull()
  })

  test('membedakan uuid dari slug', () => {
    expect(isUuid(ID)).toBe(true)
    expect(isUuid('bersih-pantai-teluk-penyu')).toBe(false)
  })
})

describe('format tampilan waktu', () => {
  test('jadwal satu hari ditampilkan sebagai rentang jam WIB', () => {
    expect(formatEventWindow('2026-11-20T01:00:00Z', '2026-11-20T05:00:00Z')).toBe(
      '20 Nov 2026, 08.00–12.00 WIB'
    )
  })

  test('jadwal lintas hari memakai rentang tanggal', () => {
    expect(formatEventWindow('2026-11-20T01:00:00Z', '2026-11-21T05:00:00Z')).toBe(
      '20 Nov 2026 – 21 Nov 2026 WIB'
    )
  })

  test('formatDateTime memakai zona Asia/Jakarta', () => {
    expect(formatDateTime('2026-11-20T01:00:00Z')).toBe('20 Nov 2026, 08.00 WIB')
  })
})
