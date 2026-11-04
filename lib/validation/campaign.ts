import { z } from 'zod'

// Nominal kampanye adalah string wei (docs/API.md §1). Decimal(78,0) membatasi 78 digit.
const weiString = z
  .string()
  .trim()
  .regex(/^\d{1,78}$/, 'Nominal harus berupa angka wei tanpa desimal.')
  .refine(
    (value) => /^\d{1,78}$/.test(value) && BigInt(value) > BigInt(0),
    'Nominal harus lebih dari 0.'
  )

const isoDateTime = z.iso.datetime({
  offset: true,
  message: 'Waktu harus ISO-8601 dengan zona waktu, mis. 2026-11-05T00:00:00.000Z.'
})

export const budgetItemSchema = z.object({
  category: z
    .string()
    .trim()
    .min(2, 'Kategori anggaran minimal 2 karakter.')
    .max(60, 'Kategori anggaran maksimal 60 karakter.'),
  description: z.string().trim().max(300, 'Keterangan maksimal 300 karakter.').optional().default(''),
  plannedWei: weiString
})

const campaignFields = {
  title: z
    .string()
    .trim()
    .min(5, 'Judul kampanye minimal 5 karakter.')
    .max(120, 'Judul kampanye maksimal 120 karakter.'),
  story: z
    .string()
    .trim()
    .min(40, 'Cerita kebutuhan minimal 40 karakter.')
    .max(5000, 'Cerita kebutuhan maksimal 5.000 karakter.'),
  categorySlug: z
    .string()
    .trim()
    .min(2, 'Kategori wajib dipilih.')
    .max(60, 'Kategori tidak valid.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Kategori tidak valid.'),
  periodStartsAt: isoDateTime,
  periodEndsAt: isoDateTime,
  targetAmountWei: weiString,
  generalLocation: z
    .string()
    .trim()
    .min(3, 'Lokasi umum minimal 3 karakter.')
    .max(120, 'Lokasi umum maksimal 120 karakter.')
}

export const createCampaignSchema = z
  .object({
    ...campaignFields,
    budgetItems: z
      .array(budgetItemSchema)
      .min(1, 'Minimal satu kategori anggaran.')
      .max(20, 'Maksimal 20 kategori anggaran.')
  })
  .refine((data) => new Date(data.periodEndsAt) > new Date(data.periodStartsAt), {
    message: 'Periode selesai harus setelah periode mulai.',
    path: ['periodEndsAt']
  })

export const updateCampaignSchema = z
  .object(campaignFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Minimal satu field harus diisi.')

export const updateBudgetSchema = z.object({
  items: z
    .array(budgetItemSchema)
    .min(1, 'Minimal satu kategori anggaran.')
    .max(20, 'Maksimal 20 kategori anggaran.')
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
