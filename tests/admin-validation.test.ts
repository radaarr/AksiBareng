import { describe, expect, it } from 'vitest'
import {
  campaignPauseSchema,
  campaignReviewSchema,
  organizationReviewSchema
} from '@/lib/validation/admin'

describe('campaignReviewSchema', () => {
  it('menyetujui tanpa catatan diperbolehkan', () => {
    expect(campaignReviewSchema.safeParse({ decision: 'APPROVED' }).success).toBe(true)
  })

  it('menolak tanpa alasan minimal 10 karakter', () => {
    expect(campaignReviewSchema.safeParse({ decision: 'REJECTED', note: 'kurang' }).success).toBe(
      false
    )
    expect(
      campaignReviewSchema.safeParse({
        decision: 'REJECTED',
        note: 'Anggaran belum memuat rincian biaya material.'
      }).success
    ).toBe(true)
  })
})

describe('organizationReviewSchema', () => {
  it('mewajibkan alasan saat menolak verifikasi', () => {
    expect(organizationReviewSchema.safeParse({ decision: 'REJECTED', note: '' }).success).toBe(
      false
    )
    expect(
      organizationReviewSchema.safeParse({
        decision: 'REJECTED',
        note: 'Dokumen legalitas belum terbaca jelas.'
      }).success
    ).toBe(true)
  })
})

describe('campaignPauseSchema', () => {
  it('mewajibkan alasan jeda', () => {
    expect(campaignPauseSchema.safeParse({ note: 'singkat' }).success).toBe(false)
    expect(
      campaignPauseSchema.safeParse({
        note: 'Menunggu klarifikasi laporan penggunaan dana.'
      }).success
    ).toBe(true)
  })
})
