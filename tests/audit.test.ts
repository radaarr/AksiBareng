import { describe, expect, test } from 'vitest'
import {
  buildAuditEntry,
  clientIp,
  hashIp,
  requestIdFrom,
  AUDIT_ACTIONS
} from '@/lib/audit'

const base = {
  action: 'organization.created' as const,
  entityType: 'organization',
  entityId: 'org-1',
  actorUserId: 'user-1',
  actorRole: 'VOLUNTEER' as const,
  requestId: 'req-1234567890',
  ipHash: 'a'.repeat(64)
}

describe('buildAuditEntry', () => {
  test('mengisi default dan mempertahankan before/after JSON', () => {
    const entry = buildAuditEntry({ ...base, before: { name: 'Lama' }, after: { name: 'Baru' } })
    expect(entry.before).toEqual({ name: 'Lama' })
    expect(entry.after).toEqual({ name: 'Baru' })
    expect(entry.actorRole).toBe('VOLUNTEER')
  })

  test('before/after undefined menjadi null', () => {
    const entry = buildAuditEntry(base)
    expect(entry.before).toBeNull()
    expect(entry.after).toBeNull()
    expect(entry.reason).toBeNull()
  })

  test('field non-JSON (fungsi) hilang, bukan melempar', () => {
    const entry = buildAuditEntry({ ...base, after: { name: 'X', toJSON: undefined, fn: () => 1 } as object })
    expect(entry.after).toEqual({ name: 'X' })
  })

  test('action di luar katalog ditolak', () => {
    expect(() => buildAuditEntry({ ...base, action: 'hacked.action' as never })).toThrow()
    expect(() => buildAuditEntry({ ...base, action: 'NOPE' as never })).toThrow()
  })

  test('action katalog memakai format titik yang diharapkan', () => {
    for (const action of AUDIT_ACTIONS) expect(action).toMatch(/^[a-z]+(\.[a-z_]+)+$/)
  })

  test('ipHash wajib sha256 hex', () => {
    expect(() => buildAuditEntry({ ...base, ipHash: '127.0.0.1' })).toThrow()
  })

  test('entityType/entityId/requestId kosong ditolak', () => {
    expect(() => buildAuditEntry({ ...base, entityType: '' })).toThrow()
    expect(() => buildAuditEntry({ ...base, entityId: ' ' })).toThrow()
    expect(() => buildAuditEntry({ ...base, requestId: '' })).toThrow()
  })
})

describe('hashIp', () => {
  test('deterministik untuk ip dan salt yang sama', () => {
    expect(hashIp('1.2.3.4', 's')).toBe(hashIp('1.2.3.4', 's'))
  })

  test('berbeda untuk salt berbeda dan tidak memuat IP mentah', () => {
    const a = hashIp('1.2.3.4', 'salt-a')
    const b = hashIp('1.2.3.4', 'salt-b')
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
    expect(a).not.toContain('1.2.3.4')
  })

  test('ip kosong/null diganti placeholder, tetap 64 hex', () => {
    expect(hashIp(null, 's')).toMatch(/^[a-f0-9]{64}$/)
    expect(hashIp('', 's')).toBe(hashIp('   ', 's'))
  })
})

describe('requestIdFrom', () => {
  const headersOf = (value: string | null) => ({ get: () => value })

  test('menerima x-request-id yang wajar', () => {
    expect(requestIdFrom(headersOf('trace-abc-123'))).toBe('trace-abc-123')
  })

  test('menolak format aneh dan membuat UUID', () => {
    expect(requestIdFrom(headersOf('spasi di sini'))).toMatch(/^[0-9a-f-]{36}$/)
    expect(requestIdFrom(headersOf(null))).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('clientIp', () => {
  const headersOf = (entries: Record<string, string | null>) => ({ get: (k: string) => entries[k] ?? null })

  test('mengambil IP pertama dari x-forwarded-for', () => {
    expect(clientIp(headersOf({ 'x-forwarded-for': ' 9.9.9.9 , 10.0.0.1' }))).toBe('9.9.9.9')
  })

  test('fallback ke x-real-ip lalu null', () => {
    expect(clientIp(headersOf({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(clientIp(headersOf({}))).toBeNull()
  })
})
