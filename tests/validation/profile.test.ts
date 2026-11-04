import { describe, expect, test } from 'vitest'
import { updateProfileSchema } from '@/lib/validation/profile'

describe('updateProfileSchema', () => {
  test('menerima parsial displayName', () => {
    expect(updateProfileSchema.parse({ displayName: 'Rani' })).toEqual({ displayName: 'Rani' })
  })

  test('menerima isPublicName saja', () => {
    expect(updateProfileSchema.parse({ isPublicName: false })).toEqual({ isPublicName: false })
  })

  test('nama di-trim dan batas 2–60 karakter', () => {
    expect(updateProfileSchema.parse({ displayName: '  Sari  ' }).displayName).toBe('Sari')
    expect(updateProfileSchema.safeParse({ displayName: 'a' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ displayName: 'x'.repeat(61) }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ displayName: 'x'.repeat(60) }).success).toBe(true)
  })

  test('object kosong ditolak', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false)
  })

  test('field eskalasi role/status/email ditolak', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'R', role: 'ADMIN' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ email: 'a@b.c' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(false)
  })

  test('isPublicName harus boolean', () => {
    expect(updateProfileSchema.safeParse({ isPublicName: 'ya' }).success).toBe(false)
  })
})
