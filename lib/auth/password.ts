import { hash, verify } from '@node-rs/argon2'

// Argon2id, parameter sesuai docs/PRIVACY_SECURITY.md §4 (T1): memory 64 MB, 3 iterasi.
// Parameter tersimpan di dalam hash, jadi menaikkannya tidak membatalkan hash lama.
const HASH_OPTIONS = {
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1
} as const

export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS)
}

/** Mengembalikan false untuk hash rusak/format asing, bukan melempar error ke route handler. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}
