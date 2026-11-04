import { z } from 'zod'

const taskFields = {
  name: z.string().trim().min(2, 'Nama posisi minimal 2 karakter.').max(80, 'Nama posisi maksimal 80 karakter.'),
  description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter.').optional(),
  quota: z
    .number({ message: 'Kuota posisi harus berupa angka.' })
    .int({ message: 'Kuota posisi harus bilangan bulat.' })
    .min(1, 'Kuota posisi minimal 1 relawan.')
    .max(500, 'Kuota posisi maksimal 500 relawan.'),
  sortOrder: z
    .number({ message: 'Urutan harus berupa angka.' })
    .int({ message: 'Urutan harus bilangan bulat.' })
    .min(0, 'Urutan tidak boleh negatif.')
    .max(999, 'Urutan maksimal 999.')
    .optional()
}

export const taskCreateSchema = z.object(taskFields)

export const taskUpdateSchema = z
  .object(taskFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Tidak ada perubahan yang dikirim.',
    path: ['body']
  })

export const taskAssignmentCreateSchema = z.object({
  registrationId: z.uuid({ message: 'Pendaftaran tidak valid.' }),
  notes: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional()
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type TaskAssignmentCreateInput = z.infer<typeof taskAssignmentCreateSchema>
