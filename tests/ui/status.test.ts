import { describe, expect, test } from 'vitest'
import { statusLabel, statusMeta, type StatusValue } from '@/components/ui/status'

// docs/UI_UX.md §3 — teks yang dilihat pengguna tidak boleh menyimpang dari tabel ini.
const DOCUMENTED: [StatusValue, string][] = [
  ['DRAFT', 'Draf'],
  ['PENDING_REVIEW', 'Menunggu tinjauan'],
  ['PUBLISHED', 'Aktif'],
  ['ACTIVE', 'Aktif'],
  ['PAUSED', 'Dijeda'],
  ['ONGOING', 'Sedang berlangsung'],
  ['CLOSED', 'Ditutup'],
  ['COMPLETED', 'Selesai'],
  ['CANCELLED', 'Dibatalkan'],
  ['REJECTED', 'Ditolak'],
  ['REGISTERED', 'Terdaftar'],
  ['CHECKED_IN', 'Sudah check-in'],
  ['VERIFIED', 'Terverifikasi'],
  ['NO_SHOW', 'Tidak hadir'],
  ['REVOKED', 'Dicabut'],
  ['PROPOSED', 'Diajukan'],
  ['APPROVED', 'Disetujui'],
  ['PAID', 'Sudah dibayar (dicatat)'],
  ['PLANNED', 'Direncanakan'],
  ['PREPARED', 'Disiapkan'],
  ['DISPATCHED', 'Dikirim'],
  ['DELIVERED', 'Diterima'],
  ['PARTIALLY_DELIVERED', 'Diterima sebagian'],
  ['NEEDS_REVIEW', 'Perlu ditinjau'],
  ['CONFIRMED', 'Terkonfirmasi'],
  ['FAILED', 'Gagal'],
  ['RETRY_REQUIRED', 'Perlu diulang'],
  ['SUBMITTED', 'Diajukan'],
  ['ACCEPTED', 'Diterima organizer'],
  ['RECEIVED', 'Barang diterima'],
  ['UNVERIFIED', 'Belum terverifikasi'],
  ['ORGANIZATION_NOT_VERIFIED', 'Organisasi belum terverifikasi']
]

describe('statusMeta', () => {
  test.each(DOCUMENTED)('%s memakai label UI_UX.md §3', (status, label) => {
    expect(statusLabel(status)).toBe(label)
  })

  test('PENDING dibedakan per konteks', () => {
    expect(statusLabel('PENDING')).toBe('Menunggu konfirmasi')
    expect(statusLabel('PENDING', 'chain')).toBe('Menunggu konfirmasi')
    expect(statusLabel('PENDING', 'contribution')).toBe('Diajukan')
    expect(statusLabel('PENDING', 'organization')).toBe('Menunggu tinjauan')
    expect(statusLabel('PENDING', 'privacy')).toBe('Menunggu tinjauan')
    expect(statusLabel('PENDING', 'anchor')).toBe('Menunggu dicatat')
  })

  test('nilai enum mentah tidak pernah tampil sebagai label', () => {
    for (const [status] of DOCUMENTED) {
      expect(statusLabel(status)).not.toBe(status)
    }
  })

  test('status tak dikenal tidak membocorkan nilai mentah', () => {
    expect(statusMeta('SOMETHING_NEW')).toEqual({ label: 'Status tidak dikenal', tone: 'neutral' })
  })

  test('setiap status punya tone yang sah', () => {
    const tones = new Set(['neutral', 'positive', 'warning', 'negative', 'positive-muted'])
    for (const [status] of DOCUMENTED) {
      expect(tones.has(statusMeta(status).tone)).toBe(true)
    }
  })
})
