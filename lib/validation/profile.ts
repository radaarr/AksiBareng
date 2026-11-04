import { z } from 'zod'

// Satu akun satu role utama; role/status/email TIDAK bisa diubah lewat sini
// (docs/RBAC.md §2 poin 4). Email berubah = alur verifikasi ulang, terpisah.
// Batas nama mengikuti docs/DATABASE.md §3 (2–60 karakter).
export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Nama tampilan minimal 2 karakter.')
      .max(60, 'Nama tampilan maksimal 60 karakter.')
      .optional(),
    isPublicName: z.boolean().optional()
  })
  .strict()
  .refine((data) => data.displayName !== undefined || data.isPublicName !== undefined, {
    message: 'Minimal satu isian yang perlu diubah.'
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
