import { z } from 'zod'

const isoDateTime = z.iso
  .datetime({ offset: true, message: 'Waktu harus format ISO-8601, mis. 2026-11-20T09:00:00Z.' })
  .transform((value) => new Date(value))

export const attendanceSessionCreateSchema = z
  .object({
    opensAt: isoDateTime.optional(),
    closesAt: isoDateTime.optional()
  })
  .refine((data) => !data.opensAt || !data.closesAt || data.closesAt > data.opensAt, {
    message: 'Penutupan sesi harus setelah pembukaannya.',
    path: ['closesAt']
  })

// Token is base64url(payload) + "." + HMAC; a manual fallback code travels in the same field.
export const attendanceScanSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20, 'Kode check-in tidak valid.')
    .max(2048, 'Kode check-in terlalu panjang.')
})

export type AttendanceSessionCreateInput = z.infer<typeof attendanceSessionCreateSchema>
export type AttendanceScanInput = z.infer<typeof attendanceScanSchema>
