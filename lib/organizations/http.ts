import type { NextResponse } from 'next/server'
import { accessProblem } from '@/lib/api/access'
import { problem } from '@/lib/api/problem'
import {
  InvalidOrganizationError,
  OrganizationConflictError,
  OrganizationNotFoundError
} from './service'

/** Peta error domain organisasi ke RFC 7807; null bila bukan error yang dikenal. */
export function organizationProblem(error: unknown, instance: string): NextResponse | null {
  const denied = accessProblem(error, instance)
  if (denied) return denied

  if (error instanceof InvalidOrganizationError) {
    return problem({
      status: 422,
      code: 'VALIDATION_ERROR',
      detail: 'Periksa kembali data yang Anda isi.',
      instance,
      errors: error.issues
    })
  }
  if (error instanceof OrganizationConflictError) {
    return problem({
      status: 409,
      code: 'INVALID_STATE_TRANSITION',
      detail: error.message,
      instance
    })
  }
  if (error instanceof OrganizationNotFoundError) {
    return problem({ status: 404, code: 'NOT_FOUND', detail: 'Data tidak ditemukan.', instance })
  }
  return null
}
