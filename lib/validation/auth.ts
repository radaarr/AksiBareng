import { z } from 'zod'

// Batas mengikuti docs/API.md §2 (kata sandi min 10 karakter)
// dan docs/DATABASE.md §3 (nama tampilan 2–60 karakter).
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, 'Email terlalu panjang.')
    .pipe(z.email({ message: 'Format email tidak valid.' })),
  password: z
    .string()
    .min(10, 'Kata sandi minimal 10 karakter.')
    .max(128, 'Kata sandi maksimal 128 karakter.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Nama tampilan minimal 2 karakter.')
    .max(60, 'Nama tampilan maksimal 60 karakter.')
})

export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type FieldIssue = { field: string; message: string }

export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message
  }))
}
