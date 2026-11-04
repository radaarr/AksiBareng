import { createHash, randomUUID } from 'node:crypto'
import { Prisma, type UserRole } from '@prisma/client'

// Jejak audit wajib transaksional: perubahan penting menulis audit_logs dalam
// transaksi yang sama dengan mutasinya (docs/DATABASE.md §1 & §8). Helper ini
// sengaja hanya menyediakan jalur transaksional supaya pemanggil tidak bisa
// lupa — kegagalan tulis audit menggagalkan transaksi, data tidak menggantung.

// Katalog action AksiKegiatan (docs/FLOWS.md §3.1) — event & registration.
export const AUDIT_ACTIONS = [
  'user.profile_updated',
  'organization.created',
  'organization.updated',
  'organization.verification_submitted',
  'organization.verification_reviewed',
  'event.created',
  'event.updated',
  'event.published',
  'event.close_registration',
  'event.cancelled',
  'registration.created',
  'registration.cancelled',
  'attendance.session_opened',
  'attendance.session_closed',
  'attendance.checked_in',
  'contribution.verified',
  'contribution.revoked',
  'task.assignment_created',
  'task.assignment_removed',
  'distribution.preparation_started',
  'distribution.dispatched',
  'distribution.delivered',
  'distribution.partially_delivered',
  'distribution.verified',
  'distribution.needs_review',
  'distribution.cancelled'
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type AuditEntryInput = {
  action: AuditAction
  entityType: string
  entityId: string
  actorUserId?: string | null
  actorRole?: UserRole | 'SYSTEM'
  before?: unknown
  after?: unknown
  reason?: string | null
  requestId: string
  ipHash: string
}

export type AuditEntry = {
  action: AuditAction
  entityType: string
  entityId: string
  actorUserId: string | null
  actorRole: string
  before: Prisma.InputJsonValue | null
  after: Prisma.InputJsonValue | null
  reason: string | null
  requestId: string
  ipHash: string
}

const ACTION_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

function assertText(value: string, field: string, max: number): void {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new Error(`audit: ${field} wajib diisi (maks ${max} karakter)`)
  }
}

// before/after hanya boleh JSON murni: undefined dibuang, fungsi/simbol hilang,
// siklus mandek sebagai error (bukan silent corruption).
function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) return null
  const serialized = JSON.stringify(value)
  if (serialized === undefined) return null
  return JSON.parse(serialized) as Prisma.InputJsonValue
}

export function buildAuditEntry(input: AuditEntryInput): AuditEntry {
  // Deny by default: action wajib terdaftar di AUDIT_ACTIONS (format + katalog).
  if (!ACTION_PATTERN.test(input.action) || !AUDIT_ACTIONS.includes(input.action)) {
    throw new Error(`audit: action tidak terdaftar: ${input.action}`)
  }
  assertText(input.entityType, 'entityType', 100)
  assertText(input.entityId, 'entityId', 100)
  assertText(input.requestId, 'requestId', 128)
  if (!/^[a-f0-9]{64}$/.test(input.ipHash)) {
    throw new Error('audit: ipHash harus sha256 hex (64 karakter)')
  }
  if (input.reason !== undefined && input.reason !== null && input.reason.length > 500) {
    throw new Error('audit: reason maksimal 500 karakter')
  }

  return {
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? 'SYSTEM',
    before: toJsonValue(input.before),
    after: toJsonValue(input.after),
    reason: input.reason ?? null,
    requestId: input.requestId,
    ipHash: input.ipHash
  }
}

/** Tulis audit log DI DALAM transaksi pemanggil. Melempar error menggugurkan transaksi. */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: AuditEntryInput
): Promise<void> {
  const entry = buildAuditEntry(input)
  await tx.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorUserId: entry.actorUserId,
      actorRole: entry.actorRole,
      before: entry.before ?? Prisma.DbNull,
      after: entry.after ?? Prisma.DbNull,
      reason: entry.reason,
      requestId: entry.requestId,
      ipHash: entry.ipHash
    }
  })
}

/** Hash IP kasar (bukan raw) untuk audit_logs.ip_hash — bukan alat identifikasi. */
export function hashIp(ip: string | null | undefined, salt = process.env.AUDIT_IP_SALT ?? ''): string {
  const value = ip && ip.trim().length > 0 ? ip.trim() : 'unknown'
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}

/** IP klien dari proxy headers; dipakai untuk hash, tidak pernah di-log mentah. */
export function clientIp(headers: Pick<Headers, 'get'>): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return headers.get('x-real-ip')?.trim() || null
}

/** Pakai x-request-id bila wajar, selain itu buat UUID baru (korelasi log). */
export function requestIdFrom(headers: Pick<Headers, 'get'>): string {
  const incoming = headers.get('x-request-id')?.trim()
  if (incoming && REQUEST_ID_PATTERN.test(incoming)) return incoming
  return randomUUID()
}
