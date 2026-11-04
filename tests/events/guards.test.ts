import { describe, expect, test } from 'vitest'
import {
  checkCheckIn,
  checkContributionVerifiable,
  checkEventCancellable,
  checkEventCompletable,
  checkEventPublishable,
  checkEventUpdatable,
  checkRegistrationCancellable,
  checkRegistrationCloseable,
  checkRegistrationOpen,
  checkTaskPlacement,
  isActiveRegistration,
  type EventState,
  type GuardResult
} from '@/lib/events/guards'

const HOUR = 60 * 60 * 1000
const now = new Date('2026-11-10T00:00:00Z')
const at = (hours: number) => new Date(now.getTime() + hours * HOUR)

function event(overrides: Partial<EventState> = {}): EventState {
  return {
    status: 'DRAFT',
    categoryId: 'a1000000-0000-4000-8000-000000000001',
    quota: 20,
    startsAt: at(48),
    endsAt: at(52),
    registrationOpensAt: at(-24),
    registrationClosesAt: at(36),
    cancellationDeadline: at(40),
    ...overrides
  }
}

function expectDenied(result: GuardResult, code: string) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe(code)
}

describe('checkEventPublishable', () => {
  test('draf lengkap sebelum waktu mulai boleh dipublikasikan', () => {
    expect(checkEventPublishable(event(), now)).toEqual({ ok: true })
  })

  test.each([
    ['status bukan draf', event({ status: 'PUBLISHED' })],
    ['kategori kosong', event({ categoryId: null })],
    ['kuota 0', event({ quota: 0 })],
    ['kuota melebihi 5000', event({ quota: 5001 })],
    ['waktu selesai sebelum mulai', event({ endsAt: at(40) })],
    ['pendaftaran ditutup sebelum dibuka', event({ registrationClosesAt: at(-48) })],
    ['waktu mulai sudah lewat', event({ startsAt: at(-1), endsAt: at(4) })]
  ])('menolak %s', (_label, input) => {
    expectDenied(checkEventPublishable(input, now), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkEventUpdatable', () => {
  test('boleh diubah sebelum waktu mulai', () => {
    expect(checkEventUpdatable(event(), now)).toEqual({ ok: true })
  })

  test('ditolak tepat saat kegiatan dimulai (EVT-02)', () => {
    expectDenied(checkEventUpdatable(event({ status: 'PUBLISHED', startsAt: now }), now), 'INVALID_STATE_TRANSITION')
  })

  test('kegiatan yang dibatalkan tidak dapat diubah', () => {
    expectDenied(checkEventUpdatable(event({ status: 'CANCELLED' }), now), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkRegistrationCloseable', () => {
  test('kegiatan aktif yang masih membuka pendaftaran boleh ditutup', () => {
    expect(checkRegistrationCloseable(event({ status: 'PUBLISHED' }), now)).toEqual({ ok: true })
  })

  test('draf tidak punya pendaftaran untuk ditutup', () => {
    expectDenied(checkRegistrationCloseable(event(), now), 'INVALID_STATE_TRANSITION')
  })

  test('pendaftaran yang sudah lewat tenggat tidak dapat ditutup lagi', () => {
    expectDenied(
      checkRegistrationCloseable(event({ status: 'PUBLISHED', registrationClosesAt: now }), now),
      'INVALID_STATE_TRANSITION'
    )
  })
})

describe('checkEventCancellable', () => {
  test.each(['PUBLISHED', 'ONGOING'] as const)('%s boleh dibatalkan', (status) => {
    expect(checkEventCancellable(event({ status }))).toEqual({ ok: true })
  })

  test('kegiatan selesai tidak dapat dibatalkan', () => {
    expectDenied(checkEventCancellable(event({ status: 'COMPLETED' })), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkEventCompletable', () => {
  test('boleh diselesaikan setelah waktu selesai', () => {
    expect(checkEventCompletable(event({ status: 'ONGOING' }), at(53))).toEqual({ ok: true })
  })

  test('ditolak sebelum waktu selesai', () => {
    expectDenied(checkEventCompletable(event({ status: 'ONGOING' }), at(50)), 'INVALID_STATE_TRANSITION')
  })

  test('draf tidak dapat langsung diselesaikan', () => {
    expectDenied(checkEventCompletable(event(), at(53)), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkRegistrationOpen', () => {
  const open = event({ status: 'PUBLISHED' })

  test('periode terbuka dan kuota tersisa', () => {
    expect(checkRegistrationOpen(open, 19, now)).toEqual({ ok: true })
  })

  test('kuota penuh menolak dengan pesan yang menyebut angkanya (EVT-08)', () => {
    const result = checkRegistrationOpen(open, 20, now)
    expectDenied(result, 'QUOTA_FULL')
    if (!result.ok) expect(result.detail).toContain('20/20')
  })

  test('sebelum periode dibuka', () => {
    expectDenied(checkRegistrationOpen(open, 0, at(-25)), 'REGISTRATION_CLOSED')
  })

  test('setelah periode ditutup, termasuk tepat pada tenggat (EVT-06)', () => {
    expectDenied(checkRegistrationOpen(open, 0, at(36)), 'REGISTRATION_CLOSED')
  })

  test('kegiatan dibatalkan tidak menerima pendaftaran', () => {
    expectDenied(checkRegistrationOpen(event({ status: 'CANCELLED' }), 0, now), 'EVENT_NOT_OPEN')
  })
})

describe('isActiveRegistration', () => {
  test.each(['REGISTERED', 'CHECKED_IN', 'VERIFIED'] as const)('%s menempati kuota', (status) => {
    expect(isActiveRegistration(status)).toBe(true)
  })

  test.each(['CANCELLED', 'NO_SHOW', 'REJECTED'] as const)('%s tidak menempati kuota', (status) => {
    expect(isActiveRegistration(status)).toBe(false)
  })
})

describe('checkRegistrationCancellable', () => {
  test('boleh dibatalkan sebelum tenggat', () => {
    expect(checkRegistrationCancellable({ status: 'REGISTERED' }, event(), now)).toEqual({ ok: true })
  })

  test('ditolak setelah tenggat pembatalan', () => {
    expectDenied(
      checkRegistrationCancellable({ status: 'REGISTERED' }, event(), at(41)),
      'CANCELLATION_DEADLINE_PASSED'
    )
  })

  test('tanpa tenggat pembatalan tetap boleh dibatalkan', () => {
    expect(checkRegistrationCancellable({ status: 'REGISTERED' }, { cancellationDeadline: null }, at(1000))).toEqual({
      ok: true
    })
  })

  test('relawan yang sudah check-in tidak dapat membatalkan', () => {
    expectDenied(checkRegistrationCancellable({ status: 'CHECKED_IN' }, event(), now), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkTaskPlacement', () => {
  test('masih di bawah kuota posisi', () => {
    expect(checkTaskPlacement({ assignedCount: 5, taskQuota: 6 })).toEqual({ ok: true })
  })

  test('menolak saat kuota posisi terpakai penuh (K-14)', () => {
    expectDenied(checkTaskPlacement({ assignedCount: 6, taskQuota: 6 }), 'QUOTA_FULL')
  })
})

describe('checkCheckIn', () => {
  test('pendaftar terdaftar pada sesi terbuka', () => {
    expect(checkCheckIn({ registrationStatus: 'REGISTERED', sessionStatus: 'OPEN' })).toEqual({ ok: true })
  })

  test('sesi tertutup menolak check-in', () => {
    expectDenied(checkCheckIn({ registrationStatus: 'REGISTERED', sessionStatus: 'CLOSED' }), 'INVALID_STATE_TRANSITION')
  })

  test('relawan yang sudah check-in tidak dapat memindai lagi', () => {
    expectDenied(checkCheckIn({ registrationStatus: 'CHECKED_IN', sessionStatus: 'OPEN' }), 'INVALID_STATE_TRANSITION')
  })
})

describe('checkContributionVerifiable', () => {
  test('hanya setelah check-in (ATT-06)', () => {
    expect(checkContributionVerifiable({ registrationStatus: 'CHECKED_IN' })).toEqual({ ok: true })
  })

  test('check-in saja tidak cukup bagi yang belum check-in (K-19)', () => {
    expectDenied(checkContributionVerifiable({ registrationStatus: 'REGISTERED' }), 'INVALID_STATE_TRANSITION')
  })
})
