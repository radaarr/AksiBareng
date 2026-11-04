import { describe, expect, test } from 'vitest'
import {
  adminListQuerySchema,
  createOrganizationSchema,
  reviewVerificationSchema,
  submitVerificationSchema,
  updateOrganizationSchema
} from '@/lib/validation/organization'
import { slugify } from '@/lib/organizations/slug'

describe('slugify', () => {
  test('lowercase, dash, dan membuang diakritik', () => {
    expect(slugify('Komunitas Bersih Pantai!')).toBe('komunitas-bersih-pantai')
    expect(slugify('Yayasan Peduli à la Carte')).toBe('yayasan-peduli-a-la-carte')
  })

  test('kosong setelah pembersihan jatuh ke placeholder', () => {
    expect(slugify('!!!')).toBe('org')
  })
})

describe('createOrganizationSchema', () => {
  const valid = {
    name: 'Komunitas Bersih Pantai',
    categoryId: 'a1000000-0000-4000-8000-000000000099',
    contactEmail: 'komunitas@aksibareng.test',
    publicArea: 'Cilacap, Jawa Tengah'
  }

  test('menerima input valid tanpa field opsional', () => {
    const parsed = createOrganizationSchema.parse(valid)
    expect(parsed.name).toBe('Komunitas Bersih Pantai')
    expect(parsed.website).toBeUndefined()
  })

  test('menolak field status/role di body (tidak bisa eskalasi)', () => {
    expect(createOrganizationSchema.safeParse({ ...valid, verificationStatus: 'VERIFIED' }).success).toBe(false)
    expect(createOrganizationSchema.safeParse({ ...valid, ownerId: 'x' }).success).toBe(false)
  })

  test('menolak kategori bukan uuid dan email salah', () => {
    expect(createOrganizationSchema.safeParse({ ...valid, categoryId: 'bukan-uuid' }).success).toBe(false)
    expect(createOrganizationSchema.safeParse({ ...valid, contactEmail: 'bukan-email' }).success).toBe(false)
  })

  test('update menolak object kosong dan menerima parsial', () => {
    expect(updateOrganizationSchema.safeParse({}).success).toBe(false)
    expect(updateOrganizationSchema.safeParse({ publicArea: 'Surabaya' }).success).toBe(true)
  })
})

describe('submitVerificationSchema', () => {
  const valid = {
    documentStorageKey: 'verifications/abc-123.pdf',
    documentSha256: 'a'.repeat(64),
    documentSalt: 'salt-1234567890abcdef'
  }

  test('menerima input valid', () => {
    expect(submitVerificationSchema.parse(valid).documentSha256).toBe('a'.repeat(64))
  })

  test('sha256 harus 64 hex; huruf besar dinormalkan ke kecil', () => {
    expect(submitVerificationSchema.safeParse({ ...valid, documentSha256: 'Z'.repeat(64) }).success).toBe(false)
    expect(submitVerificationSchema.parse({ ...valid, documentSha256: 'A'.repeat(64) }).documentSha256).toBe('a'.repeat(64))
  })

  test('salt terlalu pendek ditolak', () => {
    expect(submitVerificationSchema.safeParse({ ...valid, documentSalt: 'pendek' }).success).toBe(false)
  })
})

describe('reviewVerificationSchema', () => {
  test('keputusan hanya APPROVED/REJECTED dan note wajib', () => {
    expect(reviewVerificationSchema.safeParse({ decision: 'APPROVED', note: 'Dokumen lengkap.' }).success).toBe(true)
    expect(reviewVerificationSchema.safeParse({ decision: 'MAYBE', note: 'catatan' }).success).toBe(false)
    expect(reviewVerificationSchema.safeParse({ decision: 'REJECTED', note: 'x' }).success).toBe(false)
    expect(reviewVerificationSchema.safeParse({ decision: 'REJECTED', note: 'Dokumen tidak terbaca.' }).success).toBe(true)
  })
})

describe('adminListQuerySchema', () => {
  test('default PENDING, limit dibatasi', () => {
    expect(adminListQuerySchema.parse({}).status).toBe('PENDING')
    expect(adminListQuerySchema.parse({ limit: '80' }).limit).toBe(50)
    expect(adminListQuerySchema.safeParse({ status: 'SUSPENDED' }).success).toBe(false)
  })
})
