import { randomBytes } from 'node:crypto'
import { Prisma, type UserRole, type VerificationStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { assertCan } from '@/lib/authz'
import { writeAuditLog } from '@/lib/audit'
import {
  adminListQuerySchema,
  createOrganizationSchema,
  reviewVerificationSchema,
  submitVerificationSchema,
  updateOrganizationSchema
} from '@/lib/validation/organization'
import { toFieldIssues, type FieldIssue } from '@/lib/validation/common'
import { slugify } from './slug'

export class InvalidOrganizationError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('VALIDATION_ERROR')
  }
}

/** 409 — konflik state (sudah punya organisasi / pengajuan masih menunggu / tidak ada yang ditinjau). */
export class OrganizationConflictError extends Error {}
export class OrganizationNotFoundError extends Error {}

export type AuditContext = { requestId: string; ipHash: string }

const PUBLIC_ORG_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  publicArea: true,
  website: true,
  logoUrl: true,
  verificationStatus: true,
  createdAt: true
} as const

const ADMIN_ORG_SELECT = {
  id: true,
  name: true,
  slug: true,
  publicArea: true,
  contactEmail: true,
  verificationStatus: true,
  owner: { select: { id: true, displayName: true, email: true } }
} as const

async function uniqueSlug(tx: Prisma.TransactionClient, name: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${slugify(name)}-${randomBytes(3).toString('hex')}`
    const existing = await tx.organization.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
  }
  throw new Error('SLUG_UNAVAILABLE')
}

async function findEditableOrganization(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      name: true,
      description: true,
      contactEmail: true,
      publicArea: true,
      website: true,
      logoUrl: true,
      verificationStatus: true
    }
  })
}

export async function createOrganization(
  actor: { id: string; role: UserRole; organizationId: string | null },
  input: unknown,
  context: AuditContext
) {
  const parsed = createOrganizationSchema.safeParse(input)
  if (!parsed.success) throw new InvalidOrganizationError(toFieldIssues(parsed.error))

  assertCan(actor, 'organization:create', undefined)
  if (actor.organizationId) {
    throw new OrganizationConflictError('Akun ini sudah memiliki organisasi.')
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, isActive: true, scope: { in: ['EVENT', 'CAMPAIGN'] } },
    select: { id: true }
  })
  if (!category) {
    throw new InvalidOrganizationError([{ field: 'categoryId', message: 'Kategori tidak valid.' }])
  }

  return prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(tx, parsed.data.name)
    const created = await tx.organization.create({
      data: { ...parsed.data, slug, ownerId: actor.id },
      select: PUBLIC_ORG_SELECT
    })
    await writeAuditLog(tx, {
      action: 'organization.created',
      entityType: 'organization',
      entityId: created.id,
      actorUserId: actor.id,
      actorRole: actor.role,
      after: { name: created.name, slug: created.slug },
      requestId: context.requestId,
      ipHash: context.ipHash
    })
    return created
  })
}

export async function getPublicOrganization(id: string) {
  return prisma.organization.findUnique({ where: { id }, select: PUBLIC_ORG_SELECT })
}

export async function updateOrganization(
  actor: { id: string; role: UserRole; organizationId: string | null },
  id: string,
  input: unknown,
  context: AuditContext
) {
  const parsed = updateOrganizationSchema.safeParse(input)
  if (!parsed.success) throw new InvalidOrganizationError(toFieldIssues(parsed.error))

  const existing = await findEditableOrganization(id)
  if (!existing) throw new OrganizationNotFoundError()
  assertCan(actor, 'organization:update', existing)

  const before = {
    name: existing.name,
    description: existing.description,
    contactEmail: existing.contactEmail,
    publicArea: existing.publicArea,
    website: existing.website,
    logoUrl: existing.logoUrl
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id },
      data: parsed.data,
      select: PUBLIC_ORG_SELECT
    })
    await writeAuditLog(tx, {
      action: 'organization.updated',
      entityType: 'organization',
      entityId: id,
      actorUserId: actor.id,
      actorRole: actor.role,
      before,
      after: parsed.data,
      requestId: context.requestId,
      ipHash: context.ipHash
    })
    return updated
  })
}

export async function submitVerification(
  actor: { id: string; role: UserRole; organizationId: string | null },
  id: string,
  input: unknown,
  context: AuditContext
) {
  const parsed = submitVerificationSchema.safeParse(input)
  if (!parsed.success) throw new InvalidOrganizationError(toFieldIssues(parsed.error))

  const organization = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, ownerId: true, verificationStatus: true }
  })
  if (!organization) throw new OrganizationNotFoundError()
  assertCan(actor, 'organization:submit_verification', organization)

  return prisma.$transaction(async (tx) => {
    const pending = await tx.organizationVerification.findFirst({
      where: { organizationId: id, status: 'PENDING' },
      select: { id: true }
    })
    if (pending) {
      throw new OrganizationConflictError('Masih ada pengajuan yang menunggu tinjauan.')
    }

    const verification = await tx.organizationVerification.create({
      data: {
        organizationId: id,
        submittedBy: actor.id,
        documentStorageKey: parsed.data.documentStorageKey,
        documentSha256: parsed.data.documentSha256,
        documentSalt: parsed.data.documentSalt,
        status: 'PENDING'
      },
      select: { id: true, status: true, submittedAt: true }
    })
    await tx.organization.update({ where: { id }, data: { verificationStatus: 'PENDING' } })
    await writeAuditLog(tx, {
      action: 'organization.verification_submitted',
      entityType: 'organization_verification',
      entityId: verification.id,
      actorUserId: actor.id,
      actorRole: actor.role,
      after: { verificationId: verification.id, status: verification.status },
      requestId: context.requestId,
      ipHash: context.ipHash
    })
    return verification
  })
}

export async function listAdminVerifications(
  actor: { id: string; role: UserRole; organizationId: string | null },
  query: unknown
) {
  assertCan(actor, 'organization:list_admin', undefined)

  const parsed = adminListQuerySchema.safeParse(query)
  if (!parsed.success) throw new InvalidOrganizationError(toFieldIssues(parsed.error))
  const { status, limit, cursor } = parsed.data

  const rows = await prisma.organizationVerification.findMany({
    where: { status },
    orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      reviewNote: true,
      documentStorageKey: true,
      documentSha256: true,
      organization: { select: ADMIN_ORG_SELECT }
    }
  })

  const hasMore = rows.length > limit
  const page = rows.slice(0, limit)
  return {
    data: page.map((row) => ({
      verificationId: row.id,
      status: row.status,
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      documentStorageKey: row.documentStorageKey,
      documentSha256: row.documentSha256,
      organization: row.organization
    })),
    pagination: { nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null, hasMore }
  }
}

export async function reviewVerification(
  actor: { id: string; role: UserRole; organizationId: string | null },
  id: string,
  input: unknown,
  context: AuditContext
) {
  assertCan(actor, 'organization:review', undefined)

  const parsed = reviewVerificationSchema.safeParse(input)
  if (!parsed.success) throw new InvalidOrganizationError(toFieldIssues(parsed.error))
  const { decision, note } = parsed.data
  const newStatus: VerificationStatus = decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED'

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({
      where: { id },
      select: { id: true, ownerId: true, verificationStatus: true }
    })
    if (!organization) throw new OrganizationNotFoundError()

    const verification = await tx.organizationVerification.findFirst({
      where: { organizationId: id, status: 'PENDING' },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, status: true }
    })
    if (!verification) {
      throw new OrganizationConflictError('Tidak ada pengajuan yang menunggu tinjauan.')
    }

    await tx.organizationVerification.update({
      where: { id: verification.id },
      data: { status: newStatus, reviewerId: actor.id, reviewNote: note, reviewedAt: new Date() }
    })
    await tx.organization.update({ where: { id }, data: { verificationStatus: newStatus } })

    // Kenaikan role hanya vol → organizer dan hanya sekali (AUTH-05/06); admin tidak tersentuh.
    let ownerRoleRaised = false
    if (decision === 'APPROVED') {
      const raised = await tx.user.updateMany({
        where: { id: organization.ownerId, role: 'VOLUNTEER' },
        data: { role: 'ORGANIZER' }
      })
      ownerRoleRaised = raised.count > 0
    }

    await writeAuditLog(tx, {
      action: 'organization.verification_reviewed',
      entityType: 'organization_verification',
      entityId: verification.id,
      actorUserId: actor.id,
      actorRole: actor.role,
      before: { verificationStatus: organization.verificationStatus },
      after: { verificationStatus: newStatus, ownerRoleRaised },
      reason: note,
      requestId: context.requestId,
      ipHash: context.ipHash
    })

    return {
      verificationId: verification.id,
      organizationId: id,
      verificationStatus: newStatus,
      ownerRoleRaised
    }
  })
}
