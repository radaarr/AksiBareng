import { createHash, randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { Prisma, type CategoryScope, type CampaignStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { Actor } from '@/lib/auth/session'

export const CAMPAIGN_PUBLIC_STATUSES: CampaignStatus[] = ['ACTIVE', 'CLOSED', 'COMPLETED']

export type RequestContext = {
  requestId: string
  ipHash: string
}

/** Request id + hash IP untuk audit log; IP mentah tidak pernah disimpan. */
export function requestContext(request: NextRequest): RequestContext {
  const suppliedRequestId = request.headers.get('x-request-id')?.trim()
  const requestId = suppliedRequestId ? suppliedRequestId.slice(0, 100) : randomUUID()
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'lokal'
  const ipHash = createHash('sha256')
    .update(`${clientIp}:${process.env.AUTH_SECRET ?? 'dev'}`)
    .digest('hex')

  return { requestId, ipHash }
}

/** Slug publik tanpa data pribadi; sufiks mencegah tabrakan judul. */
export function campaignSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '')

  return `${base || 'kampanye'}-${randomUUID().slice(0, 6)}`
}

export function normalizeWei(value: string): string {
  return BigInt(value).toString()
}

export async function resolveCampaignCategory(slug: string) {
  return prisma.category.findFirst({
    where: { scope: 'CAMPAIGN' as CategoryScope, slug, isActive: true },
    select: { id: true }
  })
}

export type CampaignWithBudgets = Prisma.CampaignGetPayload<{
  include: { budgets: true }
}>

export function serializeCampaign(campaign: CampaignWithBudgets) {
  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    story: campaign.story,
    status: campaign.status,
    categoryId: campaign.categoryId,
    targetAmountWei: campaign.targetAmountWei.toString(),
    generalLocation: campaign.generalLocation,
    periodStartsAt: campaign.periodStartsAt.toISOString(),
    periodEndsAt: campaign.periodEndsAt.toISOString(),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    budgets: campaign.budgets.map((budget) => ({
      version: budget.version,
      category: budget.category,
      description: budget.description,
      plannedWei: budget.plannedAmountWei.toString(),
      createdAt: budget.createdAt.toISOString(),
      supersededAt: budget.supersededAt?.toISOString() ?? null
    }))
  }
}

type AuditInput = {
  actor: Actor
  action: string
  entityId: string
  context: RequestContext
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
}

export async function writeCampaignAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actor.id,
      actorRole: input.actor.role,
      action: input.action,
      entityType: 'campaign',
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      requestId: input.context.requestId,
      ipHash: input.context.ipHash
    }
  })
}
