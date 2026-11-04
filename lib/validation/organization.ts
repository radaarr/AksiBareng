import { z } from 'zod'

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .pipe(z.url({ message: 'URL tidak valid.' }))

// contacts & identifier hanya field non-sensitif; status verifikasi TIDAK bisa diubah
// lewat sini (docs/RBAC.md §2 poin 4). publicArea adalah kota/kabupaten — bukan
// alamat rumah (docs/DATABASE.md §3).
export const createOrganizationSchema = z
  .object({
    name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(80, 'Nama maksimal 80 karakter.'),
    categoryId: z.uuid({ message: 'Kategori tidak valid.' }),
    description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter.').optional(),
    contactEmail: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email({ message: 'Email kontak tidak valid.' })),
    publicArea: z.string().trim().min(3, 'Wilayah minimal 3 karakter.').max(120, 'Wilayah maksimal 120 karakter.'),
    website: optionalUrl.optional(),
    logoUrl: optionalUrl.optional()
  })
  .strict()

export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Minimal satu isian yang perlu diubah.'
  })

export const submitVerificationSchema = z
  .object({
    documentStorageKey: z.string().trim().min(1, 'Kunci dokumen wajib diisi.').max(500),
    documentSha256: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-f0-9]{64}$/, 'Hash dokumen harus sha256 hex (64 karakter).'),
    documentSalt: z.string().trim().min(16, 'Salt minimal 16 karakter.').max(200),
    note: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional()
  })
  .strict()

export const reviewVerificationSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED'], { message: 'Keputusan harus APPROVED atau REJECTED.' }),
    note: z.string().trim().min(3, 'Alasan minimal 3 karakter.').max(500, 'Alasan maksimal 500 karakter.')
  })
  .strict()

export const adminListQuerySchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
  limit: z.coerce.number().int().default(20).transform((n) => Math.min(Math.max(n, 1), 50)),
  cursor: z.string().trim().min(1).max(64).optional()
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>
export type AdminListQuery = z.infer<typeof adminListQuerySchema>
