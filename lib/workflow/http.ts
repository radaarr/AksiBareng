import type { NextResponse } from 'next/server'
import { accessProblem } from '@/lib/api/access'
import { problem } from '@/lib/api/problem'
import { TransitionNotAllowedError, TransitionReasonRequiredError } from './assert-transition'

/** Peta error mesin transisi ke RFC 7807; null bila bukan error yang dikenal. */
export function workflowProblem(error: unknown, instance: string): NextResponse | null {
  const denied = accessProblem(error, instance)
  if (denied) return denied

  if (error instanceof TransitionNotAllowedError) {
    return problem({
      status: 409,
      code: 'INVALID_STATE_TRANSITION',
      detail: 'Status data tidak memungkinkan aksi ini.',
      instance
    })
  }
  if (error instanceof TransitionReasonRequiredError) {
    return problem({
      status: 422,
      code: 'VALIDATION_ERROR',
      detail: 'Alasan wajib diisi untuk aksi ini.',
      instance,
      errors: [{ field: 'reason', message: 'Alasan wajib diisi.' }]
    })
  }
  return null
}
