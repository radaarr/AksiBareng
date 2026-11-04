import { z } from 'zod'

export const CAMPAIGN_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
] as const

const note = z.string().trim().max(1000, 'Catatan maksimal 1.000 karakter.')

const decision = z.enum(['APPROVED', 'REJECTED'], {
  message: 'Keputusan harus APPROVED atau REJECTED.'
})

export const campaignReviewSchema = z
  .object({
    decision,
    note: note.optional().default('')
  })
  .superRefine((value, context) => {
    if (value.decision === 'REJECTED' && value.note.length < 10) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Alasan penolakan minimal 10 karakter.'
      })
    }
  })

export const organizationReviewSchema = z
  .object({
    decision,
    note: note.optional().default('')
  })
  .superRefine((value, context) => {
    if (value.decision === 'REJECTED' && value.note.length < 10) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Alasan penolakan minimal 10 karakter.'
      })
    }
  })

export const campaignPauseSchema = z.object({
  note: z
    .string()
    .trim()
    .min(10, 'Alasan jeda minimal 10 karakter.')
    .max(1000, 'Catatan maksimal 1.000 karakter.')
})

export type CampaignReviewInput = z.infer<typeof campaignReviewSchema>
export type OrganizationReviewInput = z.infer<typeof organizationReviewSchema>
export type CampaignPauseInput = z.infer<typeof campaignPauseSchema>

export const distributionVerifySchema = z.object({
  status: z
    .enum(['DELIVERED', 'PARTIALLY_DELIVERED'])
    .refine(
      (value) => value === 'PARTIALLY_DELIVERED' ? true : true,
      'Hanya DELIVERED atau PARTIALLY_DELIVERED yang diizinkan.'
    )
})

export type DistributionVerifyInput = z.infer<typeof distributionVerifySchema>
