import type { AttendanceSessionStatus, EventStatus, RegistrationStatus } from '@prisma/client'

// Preconditions for the AksiKegiatan workflow. Pure on purpose: docs/RBAC.md §3.5
// keeps can()/assertCan() to role and ownership, and docs/FLOWS.md §3 wants the
// business rules in one place instead of scattered across route handlers.
// Callers run these inside the same transaction that reads the counts.

export type GuardCode =
  | 'INVALID_STATE_TRANSITION'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_NOT_OPEN'
  | 'QUOTA_FULL'
  | 'CANCELLATION_DEADLINE_PASSED'

export type GuardResult = { ok: true } | { ok: false; code: GuardCode; detail: string }

const allowed: GuardResult = { ok: true }

function deny(code: GuardCode, detail: string): GuardResult {
  return { ok: false, code, detail }
}

export type EventState = {
  status: EventStatus
  categoryId: string | null
  quota: number
  startsAt: Date
  endsAt: Date
  registrationOpensAt: Date
  registrationClosesAt: Date
  cancellationDeadline: Date | null
}

/** Only these registrations occupy quota (docs/DATABASE.md §4). */
export const ACTIVE_REGISTRATION_STATUSES: readonly RegistrationStatus[] = [
  'REGISTERED',
  'CHECKED_IN',
  'VERIFIED'
]

export function isActiveRegistration(status: RegistrationStatus): boolean {
  return ACTIVE_REGISTRATION_STATUSES.includes(status)
}

/** docs/FLOWS.md §3.1: DRAFT → PUBLISHED needs a category, a usable quota and a future start. */
export function checkEventPublishable(event: EventState, now: Date): GuardResult {
  if (event.status !== 'DRAFT') {
    return deny('INVALID_STATE_TRANSITION', 'Hanya kegiatan berstatus draf yang dapat dipublikasikan.')
  }
  if (!event.categoryId) {
    return deny('INVALID_STATE_TRANSITION', 'Kegiatan butuh satu kategori sebelum dipublikasikan.')
  }
  if (event.quota < 1 || event.quota > 5000) {
    return deny('INVALID_STATE_TRANSITION', 'Kuota harus antara 1 dan 5000 peserta.')
  }
  if (event.endsAt <= event.startsAt) {
    return deny('INVALID_STATE_TRANSITION', 'Waktu selesai harus setelah waktu mulai.')
  }
  if (event.registrationClosesAt < event.registrationOpensAt) {
    return deny('INVALID_STATE_TRANSITION', 'Penutupan pendaftaran tidak boleh sebelum pembukaannya.')
  }
  if (event.startsAt <= now) {
    return deny('INVALID_STATE_TRANSITION', 'Kegiatan hanya dapat dipublikasikan sebelum waktu mulai.')
  }
  return allowed
}

/** EVT-02 / K-08: editing is closed once the event starts. */
export function checkEventUpdatable(event: EventState, now: Date): GuardResult {
  if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
    return deny('INVALID_STATE_TRANSITION', 'Kegiatan yang dibatalkan atau selesai tidak dapat diubah.')
  }
  if (event.startsAt <= now) {
    return deny('INVALID_STATE_TRANSITION', 'Kegiatan hanya dapat diubah sebelum waktu mulai.')
  }
  return allowed
}

export function checkRegistrationCloseable(event: EventState, now: Date): GuardResult {
  if (event.status !== 'PUBLISHED') {
    return deny('INVALID_STATE_TRANSITION', 'Pendaftaran hanya dapat ditutup pada kegiatan aktif.')
  }
  if (event.registrationClosesAt <= now) {
    return deny('INVALID_STATE_TRANSITION', 'Pendaftaran kegiatan ini sudah ditutup.')
  }
  return allowed
}

export function checkEventCancellable(event: EventState): GuardResult {
  if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
    return deny('INVALID_STATE_TRANSITION', 'Hanya kegiatan aktif atau berlangsung yang dapat dibatalkan.')
  }
  return allowed
}

export function checkEventCompletable(event: EventState, now: Date): GuardResult {
  if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
    return deny('INVALID_STATE_TRANSITION', 'Hanya kegiatan aktif atau berlangsung yang dapat diselesaikan.')
  }
  if (event.endsAt > now) {
    return deny('INVALID_STATE_TRANSITION', 'Kegiatan hanya dapat diselesaikan setelah waktu selesai.')
  }
  return allowed
}

/** EVT-06…EVT-08. `activeCount` must be read inside the quota transaction. */
export function checkRegistrationOpen(event: EventState, activeCount: number, now: Date): GuardResult {
  if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
    return deny('EVENT_NOT_OPEN', 'Kegiatan ini tidak menerima pendaftaran.')
  }
  if (now < event.registrationOpensAt) {
    return deny('REGISTRATION_CLOSED', 'Pendaftaran belum dibuka.')
  }
  if (now >= event.registrationClosesAt) {
    return deny('REGISTRATION_CLOSED', 'Pendaftaran sudah ditutup.')
  }
  if (activeCount >= event.quota) {
    return deny('QUOTA_FULL', `Kuota sudah penuh (${activeCount}/${event.quota}). Coba kegiatan lain.`)
  }
  return allowed
}

export function checkRegistrationCancellable(
  registration: { status: RegistrationStatus },
  event: Pick<EventState, 'cancellationDeadline'>,
  now: Date
): GuardResult {
  if (registration.status !== 'REGISTERED') {
    return deny('INVALID_STATE_TRANSITION', 'Pendaftaran ini tidak dapat dibatalkan lagi.')
  }
  if (event.cancellationDeadline && now > event.cancellationDeadline) {
    return deny('CANCELLATION_DEADLINE_PASSED', 'Batas waktu pembatalan sudah lewat.')
  }
  return allowed
}

/** SCH-02 / SCH-03 / K-14: a position never holds more volunteers than its quota. */
export function checkTaskPlacement(input: { assignedCount: number; taskQuota: number }): GuardResult {
  if (input.assignedCount >= input.taskQuota) {
    return deny('QUOTA_FULL', 'Kuota posisi ini sudah penuh.')
  }
  return allowed
}

/** ATT-03…ATT-05: only a REGISTERED volunteer checks in, and only while the session is open. */
export function checkCheckIn(input: {
  registrationStatus: RegistrationStatus
  sessionStatus: AttendanceSessionStatus
}): GuardResult {
  if (input.sessionStatus !== 'OPEN') {
    return deny('INVALID_STATE_TRANSITION', 'Sesi check-in sudah ditutup.')
  }
  if (input.registrationStatus !== 'REGISTERED') {
    return deny('INVALID_STATE_TRANSITION', 'Relawan ini tidak berstatus terdaftar.')
  }
  return allowed
}

/** ATT-06 / K-19: check-in alone never yields a verified contribution. */
export function checkContributionVerifiable(input: { registrationStatus: RegistrationStatus }): GuardResult {
  if (input.registrationStatus !== 'CHECKED_IN') {
    return deny(
      'INVALID_STATE_TRANSITION',
      'Kontribusi hanya dapat divalidasi setelah relawan melakukan check-in.'
    )
  }
  return allowed
}
