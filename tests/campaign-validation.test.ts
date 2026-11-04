import { describe, expect, it } from 'vitest'
import {
  createCampaignSchema,
  updateBudgetSchema,
  updateCampaignSchema
} from '@/lib/validation/campaign'

const validCampaign = {
  title: 'Dapur Umum untuk Warga Cilacap',
  story:
    'Warga terdampak banjir membutuhkan makanan siap saji setiap hari selama dua minggu. Dana dipakai untuk bahan makanan dan logistik dapur.',
  categorySlug: 'pangan',
  periodStartsAt: '2026-11-05T00:00:00.000Z',
  periodEndsAt: '2026-11-26T00:00:00.000Z',
  targetAmountWei: '5000000000000000000',
  generalLocation: 'Cilacap, Jawa Tengah',
  budgetItems: [
    { category: 'Bahan makanan', description: 'Beras dan sayur', plannedWei: '2400000000000000000' }
  ]
}

describe('createCampaignSchema', () => {
  it('menerima payload kampanye yang lengkap', () => {
    const parsed = createCampaignSchema.safeParse(validCampaign)
    expect(parsed.success).toBe(true)
  })

  it('menolak cerita pendek, wei tidak valid, dan periode terbalik', () => {
    expect(createCampaignSchema.safeParse({ ...validCampaign, story: 'terlalu pendek' }).success).toBe(
      false
    )
    expect(
      createCampaignSchema.safeParse({ ...validCampaign, targetAmountWei: '0,5' }).success
    ).toBe(false)
    expect(
      createCampaignSchema.safeParse({
        ...validCampaign,
        periodStartsAt: '2026-11-26T00:00:00.000Z',
        periodEndsAt: '2026-11-05T00:00:00.000Z'
      }).success
    ).toBe(false)
  })

  it('mewajibkan minimal satu kategori anggaran', () => {
    expect(createCampaignSchema.safeParse({ ...validCampaign, budgetItems: [] }).success).toBe(false)
  })
})

describe('updateCampaignSchema', () => {
  it('menerima patch parsial dan menolak body kosong', () => {
    expect(updateCampaignSchema.safeParse({ title: 'Judul baru' }).success).toBe(true)
    expect(updateCampaignSchema.safeParse({}).success).toBe(false)
  })
})

describe('updateBudgetSchema', () => {
  it('menerima versi anggaran baru dan menolak nominal nol', () => {
    expect(
      updateBudgetSchema.safeParse({
        items: [{ category: 'Logistik', plannedWei: '100000000000000000' }]
      }).success
    ).toBe(true)

    expect(
      updateBudgetSchema.safeParse({
        items: [{ category: 'Logistik', plannedWei: '0' }]
      }).success
    ).toBe(false)
  })
})
