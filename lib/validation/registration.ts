import { z } from 'zod'

export const registrationCreateSchema = z.object({
  note: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional()
})

export const registrationCancelSchema = z.object({
  reason: z.string().trim().max(300, 'Alasan maksimal 300 karakter.').optional()
})

export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>
export type RegistrationCancelInput = z.infer<typeof registrationCancelSchema>
