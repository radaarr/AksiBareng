import { NextResponse } from 'next/server'
import type { FieldIssue } from '@/lib/validation/auth'

// Amplop error RFC 7807 sesuai docs/API.md §8.
export type ProblemCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_TAKEN'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

const TITLES: Record<ProblemCode, string> = {
  VALIDATION_ERROR: 'Data tidak valid',
  EMAIL_TAKEN: 'Email sudah terdaftar',
  UNAUTHENTICATED: 'Anda belum masuk',
  FORBIDDEN: 'Akses ditolak',
  NOT_FOUND: 'Data tidak ditemukan',
  RATE_LIMITED: 'Terlalu banyak percobaan',
  INTERNAL_ERROR: 'Terjadi kesalahan'
}

export type ProblemOptions = {
  status: number
  code: ProblemCode
  detail: string
  instance: string
  errors?: FieldIssue[]
  headers?: Record<string, string>
}

export function problemBody(options: Omit<ProblemOptions, 'headers'>) {
  return {
    type: `https://aksibareng.app/errors/${options.code.toLowerCase().replaceAll('_', '-')}`,
    title: TITLES[options.code],
    status: options.status,
    detail: options.detail,
    instance: options.instance,
    code: options.code,
    ...(options.errors && options.errors.length > 0 ? { errors: options.errors } : {})
  }
}

export function problem({ headers, ...options }: ProblemOptions) {
  return NextResponse.json(problemBody(options), {
    status: options.status,
    headers: { 'content-type': 'application/problem+json', ...headers }
  })
}
