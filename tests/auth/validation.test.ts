import { describe, expect, test } from 'vitest'
import { registerSchema } from '@/lib/validation/auth'
import { toFieldIssues } from '@/lib/validation/common'

const valid = {
  email: 'relawan@aksibareng.test',
  password: 'Demo#2026ku',
  displayName: 'Rani'
}

describe('registerSchema', () => {
  test('menerima data valid dan memangkas spasi nama', () => {
    const parsed = registerSchema.parse({ ...valid, displayName: '  Rani  ' })
    expect(parsed.displayName).toBe('Rani')
    expect(parsed.email).toBe(valid.email)
  })

  test('menolak kata sandi kurang dari 10 karakter', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'pendek' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(toFieldIssues(result.error)).toContainEqual({
        field: 'password',
        message: 'Kata sandi minimal 10 karakter.'
      })
    }
  })

  test('menolak email tidak valid dan nama terlalu pendek', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bukan-email', displayName: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = toFieldIssues(result.error).map((issue) => issue.field)
      expect(fields).toEqual(expect.arrayContaining(['email', 'displayName']))
    }
  })
})
