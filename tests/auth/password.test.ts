import { describe, expect, test } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('password hashing', () => {
  test('memakai Argon2id dan tidak menyimpan kata sandi asli', async () => {
    const passwordHash = await hashPassword('Rahasia#2026')

    expect(passwordHash.startsWith('$argon2id$')).toBe(true)
    expect(passwordHash).not.toContain('Rahasia#2026')
    expect(await verifyPassword(passwordHash, 'Rahasia#2026')).toBe(true)
    expect(await verifyPassword(passwordHash, 'Rahasia#2027')).toBe(false)
  })

  test('hash rusak ditolak tanpa melempar error', async () => {
    expect(await verifyPassword('bukan-hash', 'apa saja')).toBe(false)
  })
})
