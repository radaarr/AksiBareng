import { z } from 'zod'

export const contributionVerifySchema = z.object({
  note: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional()
})

export type ContributionVerifyInput = z.infer<typeof contributionVerifySchema>
