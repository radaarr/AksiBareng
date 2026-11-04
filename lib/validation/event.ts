import { z } from 'zod'

// Bounds follow docs/API.md §4 and the CHECK constraints in docs/DATABASE.md §4.
const isoDateTime = z.iso
  .datetime({ offset: true, message: 'Waktu harus format ISO-8601, mis. 2026-11-20T09:00:00Z.' })
  .transform((value) => new Date(value))

const eventFields = {
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(120, 'Judul maksimal 120 karakter.'),
  description: z.string().trim().max(5000, 'Deskripsi maksimal 5000 karakter.').optional(),
  categoryId: z.uuid({ message: 'Kategori tidak valid.' }),
  locationName: z.string().trim().min(2, 'Nama lokasi minimal 2 karakter.').max(120, 'Nama lokasi maksimal 120 karakter.'),
  publicAddress: z.string().trim().max(200, 'Alamat umum maksimal 200 karakter.').optional(),
  city: z.string().trim().min(2, 'Kota minimal 2 karakter.').max(80, 'Kota maksimal 80 karakter.'),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  quota: z
    .number({ message: 'Kuota harus berupa angka.' })
    .int({ message: 'Kuota harus bilangan bulat.' })
    .min(1, 'Kuota minimal 1 peserta.')
    .max(5000, 'Kuota maksimal 5000 peserta.'),
  registrationOpensAt: isoDateTime,
  registrationClosesAt: isoDateTime,
  cancellationDeadline: isoDateTime.optional()
}

export const eventCreateSchema = z
  .object(eventFields)
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'Waktu selesai harus setelah waktu mulai.',
    path: ['endsAt']
  })
  .refine((data) => data.registrationClosesAt >= data.registrationOpensAt, {
    message: 'Penutupan pendaftaran tidak boleh sebelum pembukaannya.',
    path: ['registrationClosesAt']
  })

// Partial by design: cross-field checks on PATCH need the stored row merged with
// the patch, so they live in lib/events/guards.ts instead of here.
export const eventUpdateSchema = z
  .object(eventFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Tidak ada perubahan yang dikirim.',
    path: ['body']
  })

export const eventCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan pembatalan wajib diisi, minimal 5 karakter.')
    .max(500, 'Alasan maksimal 500 karakter.')
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
export type EventCancelInput = z.infer<typeof eventCancelSchema>
