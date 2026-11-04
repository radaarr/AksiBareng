import { describe, expect, it } from 'vitest'
import { AccessDeniedError, assertCan, can } from '@/lib/authz'
import type { CampaignResource, DistributionResource } from '@/lib/authz'
import type { EventStatus } from '@prisma/client'

const owner = { id: 'user-organizer', role: 'ORGANIZER' as const, organizationId: 'org-1' }
const otherOrganizer = {
  id: 'user-organizer-2',
  role: 'ORGANIZER' as const,
  organizationId: 'org-2'
}
const volunteer = { id: 'user-volunteer', role: 'VOLUNTEER' as const, organizationId: null }
const draft = { organizationId: 'org-1', status: 'DRAFT' as const }

function asEvent(resource: { organizationId: string; status: string }): { organizationId: string; status: EventStatus } {
  return { organizationId: resource.organizationId, status: resource.status as EventStatus }
}

function asCampaign(resource: { id: string; organizationId: string }): CampaignResource {
  return resource as unknown as CampaignResource
}

function asDistribution(_resource: { id: string }): DistributionResource {
  return { id: _resource.id } as DistributionResource
}

describe('campaign authz', () => {
  it('organizer pemilik dapat membuat dan mengubah draf', () => {
    expect(can(owner, 'event:create', undefined)).toBe(true)
    expect(can(owner, 'event:read', asEvent(draft))).toBe(true)
    expect(can(owner, 'event:update', asEvent(draft))).toBe(true)
    expect(can(owner, 'organization:review', undefined)).toBe(false)
    expect(can(owner, 'distribution:verify', asDistribution({ id: 'dist-draft' }))).toBe(false)
  })

  it('volunteer ditolak 403 for role-only actions', () => {
    expect(can(volunteer, 'event:create', undefined)).toBe(false)

    expect(() => assertCan(volunteer, 'event:create', undefined)).toThrow(AccessDeniedError)
    try {
      assertCan(volunteer, 'event:create', undefined)
    } catch (error) {
      expect(error).toBeInstanceOf(AccessDeniedError)
      expect((error as AccessDeniedError).status).toBe(403)
      expect((error as AccessDeniedError).code).toBe('FORBIDDEN')
    }
  })

  it('distribution resource untuk authz harus disediakan', () => {
    const dist = asDistribution({ id: 'dist-1' })
    expect(can(owner, 'distribution:verify', dist)).toBe(false)
    expect(can(owner, 'distribution:privacy_review', dist)).toBe(false)
  })

  it('organizer lain mendapat 404 untuk kampanye draf milik orang lain', () => {
    expect(can(otherOrganizer, 'event:update', asEvent(draft))).toBe(false)

    try {
      assertCan(otherOrganizer, 'event:update', asEvent(draft))
    } catch (error) {
      expect(error).toBeInstanceOf(AccessDeniedError)
      expect((error as AccessDeniedError).status).toBe(404)
      expect((error as AccessDeniedError).code).toBe('NOT_FOUND')
    }
  })

  it('status bukan precondition authz untuk event; non-pemilik kampanye publik ditolak 403', () => {
    // Transisi DRAFT/REJECTED → 409 diperiksa route handler, bukan matriks akses.
    const published = { organizationId: 'org-1', status: 'PUBLISHED' as const }
    expect(can(owner, 'event:update', asEvent(published))).toBe(true)
    expect(can(otherOrganizer, 'event:update', asEvent(published))).toBe(false)
    try {
      assertCan(otherOrganizer, 'event:update', asEvent(published))
    } catch (error) {
      expect(error).toBeInstanceOf(AccessDeniedError)
      expect((error as AccessDeniedError).status).toBe(403)
      expect((error as AccessDeniedError).code).toBe('FORBIDDEN')
    }
  })

  it('admin boleh meninjau organisasi, kampanye, dan memverifikasi distribusi', () => {
    const admin = { id: 'user-admin', role: 'ADMIN' as const, organizationId: null }
    expect(can(admin, 'organization:review', undefined)).toBe(true)
    expect(can(admin, 'campaign:review', undefined)).toBe(true)
    expect(can(admin, 'distribution:verify', asDistribution({ id: 'dist-1' }))).toBe(true)
    expect(can(admin, 'distribution:privacy_review', asDistribution({ id: 'dist-1' }))).toBe(true)

    expect(can(owner, 'organization:review', undefined)).toBe(false)
    expect(can(owner, 'campaign:review', undefined)).toBe(false)
    expect(can(owner, 'distribution:verify', asDistribution({ id: 'dist-1' }))).toBe(false)
    expect(can(owner, 'distribution:privacy_review', asDistribution({ id: 'dist-1' }))).toBe(false)
  })

  it('hanya admin yang boleh menjeda kampanye, bukan organizer', () => {
    const admin = { id: 'user-admin', role: 'ADMIN' as const, organizationId: null }
    const myCampaign = { id: 'camp-mine', organizationId: 'org-1' }
    const otherCampaign = { id: 'camp-other', organizationId: 'org-2' }

    expect(can(admin, 'campaign:pause', asCampaign(myCampaign))).toBe(true)
    expect(can(owner, 'campaign:pause', asCampaign(myCampaign))).toBe(false)
    expect(can(owner, 'campaign:pause', asCampaign(otherCampaign))).toBe(false)
    expect(can(otherOrganizer, 'campaign:pause', asCampaign(myCampaign))).toBe(false)
  })

  it('verifikasi distribusi hanya admin, bukan organizer yang mengajukan', () => {
    const myDistribution = { id: 'dist-mine' }
    const otherDistribution = { id: 'dist-other' }

    expect(can(owner, 'distribution:verify', asDistribution(myDistribution))).toBe(false)
    expect(can(owner, 'distribution:privacy_review', asDistribution(myDistribution))).toBe(false)
    expect(can(otherOrganizer, 'distribution:verify', asDistribution(otherDistribution))).toBe(false)
  })
})
