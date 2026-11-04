import { NextResponse } from 'next/server'
import type { FieldIssue } from '@/lib/validation/common'

// Amplop error RFC 7807 sesuai docs/API.md §8. Daftar `ProblemCode` wajib sama
// dengan tabel katalog di dokumen itu; kode baru hanya ditambahkan bila masuk
// ke katalog, bukan dibuat ad hoc di route handler.
export type ProblemCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ORGANIZATION_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'ALREADY_REGISTERED'
  | 'EMAIL_TAKEN'
  | 'QUOTA_FULL'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_NOT_OPEN'
  | 'CANCELLATION_DEADLINE_PASSED'
  | 'TOKEN_ALREADY_USED'
  | 'INVALID_STATE_TRANSITION'
  | 'INSUFFICIENT_STOCK'
  | 'EXPENSE_EXCEEDS_FUNDS'
  | 'IDEMPOTENCY_CONFLICT'
  | 'TOKEN_EXPIRED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'CHAIN_UNAVAILABLE'
  | 'INTERNAL_ERROR'

// Judul tampil ke pengguna: Bahasa Indonesia, tanpa jargon (docs/UI_UX.md §5).
const TITLES: Record<ProblemCode, string> = {
  VALIDATION_ERROR: 'Data tidak valid',
  UNAUTHENTICATED: 'Anda belum masuk',
  FORBIDDEN: 'Akses ditolak',
  ORGANIZATION_NOT_VERIFIED: 'Organisasi belum terverifikasi',
  NOT_FOUND: 'Data tidak ditemukan',
  ALREADY_REGISTERED: 'Anda sudah terdaftar',
  EMAIL_TAKEN: 'Email sudah terdaftar',
  QUOTA_FULL: 'Kuota penuh',
  REGISTRATION_CLOSED: 'Pendaftaran ditutup',
  EVENT_NOT_OPEN: 'Kegiatan tidak menerima pendaftaran',
  CANCELLATION_DEADLINE_PASSED: 'Batas pembatalan sudah lewat',
  TOKEN_ALREADY_USED: 'Kode sudah dipakai',
  INVALID_STATE_TRANSITION: 'Status tidak memungkinkan aksi ini',
  INSUFFICIENT_STOCK: 'Stok tidak mencukupi',
  EXPENSE_EXCEEDS_FUNDS: 'Pengeluaran melebihi dana',
  IDEMPOTENCY_CONFLICT: 'Permintaan ganda dengan isi berbeda',
  TOKEN_EXPIRED: 'Kode sudah kedaluwarsa',
  PAYLOAD_TOO_LARGE: 'Berkas terlalu besar',
  UNSUPPORTED_MEDIA_TYPE: 'Jenis berkas tidak didukung',
  RATE_LIMITED: 'Terlalu banyak percobaan',
  CHAIN_UNAVAILABLE: 'Jaringan blockchain tidak tersedia',
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
