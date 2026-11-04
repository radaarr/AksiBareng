import type { NextResponse } from 'next/server'
import { AccessDeniedError } from '@/lib/authz'
import { UnauthenticatedError } from '@/lib/auth/errors'
import { problem } from './problem'

/**
 * Menerjemahkan error sesi/otorisasi menjadi respons RFC 7807.
 * Mengembalikan `null` untuk error lain supaya route handler dapat melemparnya kembali.
 *
 * Pola pemakaian (docs/RBAC.md §3.5):
 *   try { ... } catch (error) {
 *     const denied = accessProblem(error, instance)
 *     if (denied) return denied
 *     throw error
 *   }
 */
export function accessProblem(error: unknown, instance: string): NextResponse | null {
  if (error instanceof UnauthenticatedError) {
    return problem({
      status: 401,
      code: 'UNAUTHENTICATED',
      detail: 'Sesi Anda berakhir. Silakan masuk kembali.',
      instance
    })
  }

  if (error instanceof AccessDeniedError) {
    return problem({
      status: error.status,
      code: error.code,
      detail: error.message,
      instance
    })
  }

  return null
}
