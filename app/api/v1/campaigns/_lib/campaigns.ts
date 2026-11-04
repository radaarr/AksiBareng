import { randomUUID } from 'node:crypto'
import { Prisma, type CategoryScope, type CampaignStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { Actor } from '@/lib/auth/session'
import { writeAudit, type RequestContext } from '../../_lib/audit'

export { requestContext, type RequestContext } from '../../_lib/audit'

export const CAMPAIGN_PUBLIC_STATUSES: CampaignStatus[] = ['ACTIVE', 'CLOSED', 'COMPLETED']

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
  await writeAudit(tx, { ...input, entityType: 'campaign' })
}
