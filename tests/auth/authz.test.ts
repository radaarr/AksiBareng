import { describe, expect, test } from 'vitest'
import {
  AccessDeniedError,
  assertCan,
  can,
  type AccessActor,
  type EventResource
} from '@/lib/authz'

// Matriks acuan: docs/RBAC.md §3. Aktor fiktif — tidak ada database di sini.
const volunteer: AccessActor = { id: 'user-vol', role: 'VOLUNTEER', organizationId: null }
const organizerA: AccessActor = { id: 'user-a', role: 'ORGANIZER', organizationId: 'org-a' }
const organizerB: AccessActor = { id: 'user-b', role: 'ORGANIZER', organizationId: 'org-b' }
const admin: AccessActor = { id: 'user-admin', role: 'ADMIN', organizationId: null }

const draftA: EventResource = { organizationId: 'org-a', status: 'DRAFT' }
const publishedA: EventResource = { organizationId: 'org-a', status: 'PUBLISHED' }

function denial(run: () => void): AccessDeniedError {
  try {
    run()
  } catch (error) {
    if (error instanceof AccessDeniedError) return error
    throw error
  }
  throw new Error('Akses seharusnya ditolak')
}

describe('can — kegiatan', () => {
  test('hanya organizer yang punya organisasi dapat membuat kegiatan', () => {
    expect(can(organizerA, 'event:create', undefined)).toBe(true)
    expect(can(volunteer, 'event:create', undefined)).toBe(false)
    // RBAC §3.4: admin tidak bertindak sebagai organizer.
    expect(can(admin, 'event:create', undefined)).toBe(false)
    expect(can({ id: 'x', role: 'ORGANIZER', organizationId: null }, 'event:create', undefined)).toBe(false)
  })

  test('kegiatan DRAFT hanya terlihat pemilik dan admin', () => {
    expect(can(organizerA, 'event:read', draftA)).toBe(true)
    expect(can(admin, 'event:read', draftA)).toBe(true)
    expect(can(organizerB, 'event:read', draftA)).toBe(false)
    expect(can(volunteer, 'event:read', draftA)).toBe(false)
  })

  test('kegiatan PUBLISHED dapat dibaca semua peran yang login', () => {
    expect(can(volunteer, 'event:read', publishedA)).toBe(true)
    expect(can(organizerB, 'event:read', publishedA)).toBe(true)
  })

  test('organizer lain tidak dapat mengubah, menerbitkan, atau membatalkan kegiatan', () => {
    for (const action of ['event:update', 'event:publish', 'event:close_registration', 'event:cancel'] as const) {
      expect(can(organizerB, action, draftA)).toBe(false)
      expect(can(organizerA, action, draftA)).toBe(true)
      expect(can(volunteer, action, publishedA)).toBe(false)
      expect(can(admin, action, publishedA)).toBe(false)
    }
  })
})

describe('can — pendaftaran', () => {
  test('pendaftaran terbuka hanya untuk relawan pada kegiatan terbuka', () => {
    expect(can(volunteer, 'registration:create', publishedA)).toBe(true)
    expect(can(volunteer, 'registration:create', draftA)).toBe(false)
    expect(can(organizerA, 'registration:create', publishedA)).toBe(false)
    expect(can(admin, 'registration:create', publishedA)).toBe(false)
  })

  test('relawan hanya membaca dan membatalkan pendaftarannya sendiri', () => {
    expect(can(volunteer, 'registration:read_own', { userId: volunteer.id })).toBe(true)
    expect(can(volunteer, 'registration:read_own', { userId: organizerA.id })).toBe(false)
    expect(can(volunteer, 'registration:cancel_own', { userId: organizerA.id })).toBe(false)
  })

  test('daftar peserta hanya untuk pemilik kegiatan (EVT-10)', () => {
    expect(can(organizerA, 'registration:list', publishedA)).toBe(true)
    expect(can(organizerB, 'registration:list', publishedA)).toBe(false)
    expect(can(volunteer, 'registration:list', publishedA)).toBe(false)
  })
})

describe('can — tugas dan kehadiran', () => {
  test('hanya pemilik kegiatan yang mengelola posisi tugas', () => {
    for (const action of ['task:create', 'task:update', 'task:assign', 'task:unassign'] as const) {
      expect(can(organizerA, action, draftA)).toBe(true)
      expect(can(organizerB, action, draftA)).toBe(false)
      expect(can(volunteer, action, publishedA)).toBe(false)
    }
  })

  test('tugas terbaca oleh pemilik dan relawan yang ditempatkan saja', () => {
    const task = { eventOrganizationId: 'org-a', assignedUserId: volunteer.id }
    expect(can(organizerA, 'task:read', task)).toBe(true)
    expect(can(volunteer, 'task:read', task)).toBe(true)
    expect(can(organizerB, 'task:read', task)).toBe(false)
    expect(can({ id: 'user-lain', role: 'VOLUNTEER', organizationId: null }, 'task:read', task)).toBe(false)
    expect(can(volunteer, 'task:read', { eventOrganizationId: 'org-a', assignedUserId: null })).toBe(false)
  })

  test('token check-in hanya untuk pemilik registrasi; scan hanya untuk pemilik event', () => {
    expect(can(volunteer, 'attendance:issue_token', { userId: volunteer.id })).toBe(true)
    expect(can(volunteer, 'attendance:issue_token', { userId: organizerA.id })).toBe(false)
    expect(can(organizerA, 'attendance:scan', publishedA)).toBe(true)
    expect(can(organizerB, 'attendance:scan', publishedA)).toBe(false)
    expect(can(volunteer, 'attendance:create_session', publishedA)).toBe(false)
  })
})

describe('can — kontribusi', () => {
  test('relawan tidak dapat menerbitkan kontribusi sendiri (PRD §10.3)', () => {
    expect(can(volunteer, 'contribution:verify', publishedA)).toBe(false)
    expect(can(organizerA, 'contribution:verify', publishedA)).toBe(true)
    expect(can(organizerB, 'contribution:verify', publishedA)).toBe(false)
    expect(can(admin, 'contribution:verify', publishedA)).toBe(false)
  })

  test('revoke kontribusi hanya admin (PRD §9.3)', () => {
    expect(can(admin, 'contribution:revoke', undefined)).toBe(true)
    expect(can(organizerA, 'contribution:revoke', undefined)).toBe(false)
    expect(can(volunteer, 'contribution:revoke', undefined)).toBe(false)
  })

  test('relawan membaca kontribusinya sendiri saja', () => {
    expect(can(volunteer, 'contribution:read_own', { userId: volunteer.id })).toBe(true)
    expect(can(volunteer, 'contribution:read_own', { userId: 'user-lain' })).toBe(false)
  })
})

describe('assertCan — pemisahan 403 dan 404', () => {
  test('kegiatan publik milik organisasi lain ditolak 403', () => {
    const error = denial(() => assertCan(organizerB, 'event:cancel', publishedA))
    expect(error.status).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })

  test('kegiatan draf organisasi lain ditolak 404 agar keberadaannya tidak bocor', () => {
    const error = denial(() => assertCan(organizerB, 'event:update', draftA))
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  test('penolakan murni peran memakai 403', () => {
    expect(denial(() => assertCan(volunteer, 'event:create', undefined)).status).toBe(403)
    expect(denial(() => assertCan(volunteer, 'contribution:revoke', undefined)).status).toBe(403)
  })

  test('resource privat lain memakai 404', () => {
    expect(denial(() => assertCan(volunteer, 'registration:list', publishedA)).status).toBe(404)
    expect(denial(() => assertCan(organizerB, 'attendance:scan', publishedA)).status).toBe(404)
  })

  test('pesan penolakan tidak memuat id resource', () => {
    const error = denial(() => assertCan(organizerB, 'event:cancel', publishedA))
    expect(error.message).not.toContain('org-a')
    expect(error.message).not.toContain('user')
  })

  test('aksi yang diizinkan tidak melempar', () => {
    expect(() => assertCan(organizerA, 'event:publish', draftA)).not.toThrow()
  })
})
