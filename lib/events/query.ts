import type { EventStatus } from '@prisma/client'

// Aturan visibilitas katalog (docs/API.md §4, EVT-04/EVT-05, K-07). Ditaruh di
// file murni supaya route handler dan test memakai definisi yang sama: draf
// tidak boleh bocor ke publik, bahkan lewat pesan 404 yang berbeda.

/** Status yang muncul di katalog publik. */
export const PUBLIC_LIST_STATUSES: readonly EventStatus[] = ['PUBLISHED', 'ONGOING']

/** Detail publik tetap dapat dibaca setelah kegiatan selesai; draf & batal 404. */
export const PUBLIC_DETAIL_STATUSES: readonly EventStatus[] = ['PUBLISHED', 'ONGOING', 'COMPLETED']

export function isPubliclyListed(status: EventStatus): boolean {
  return PUBLIC_LIST_STATUSES.includes(status)
}

export function isPubliclyVisible(status: EventStatus): boolean {
  return PUBLIC_DETAIL_STATUSES.includes(status)
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/** Kunci keyset katalog: urutan `startsAt` lalu `id`. */
export type EventCursor = { startsAt: Date; id: string }

export function encodeEventCursor(cursor: EventCursor): string {
  const payload = JSON.stringify({ t: cursor.startsAt.toISOString(), id: cursor.id })
  return Buffer.from(payload, 'utf8').toString('base64url')
}

/** `null` untuk cursor yang rusak — pemanggil memetakannya ke 422, bukan 500. */
export function decodeEventCursor(value: string): EventCursor | null {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const parsed: unknown = JSON.parse(decoded)
    if (typeof parsed !== 'object' || parsed === null) return null

    const { t, id } = parsed as { t?: unknown; id?: unknown }
    if (typeof t !== 'string' || typeof id !== 'string' || !isUuid(id)) return null

    const startsAt = new Date(t)
    if (Number.isNaN(startsAt.getTime())) return null

    return { startsAt, id }
  } catch {
    return null
  }
}
