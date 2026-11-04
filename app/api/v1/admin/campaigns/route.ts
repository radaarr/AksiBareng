import { NextResponse, type NextRequest } from 'next/server'
import type { CampaignStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { problem } from '@/lib/api/problem'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { CAMPAIGN_STATUSES } from '@/lib/validation/admin'

// C6 / CAM-04: antrean tinjauan admin. Hanya admin; data draf tetap privat.
export async function GET(request: NextRequest) {
  const instance = request.nextUrl.pathname

  try {
    const actor = await requireActor()
    assertCan(actor, 'campaign:review', undefined)

    const statusParam = request.nextUrl.searchParams.get('status')
    if (statusParam && !(CAMPAIGN_STATUSES as readonly string[]).includes(statusParam)) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Filter status tidak dikenal.',
        instance,
        errors: [{ field: 'status', message: 'Gunakan status kampanye yang valid.' }]
      })
    }

    const campaigns = await prisma.campaign.findMany({
      where: statusParam ? { status: statusParam as CampaignStatus } : undefined,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        targetAmountWei: true,
        generalLocation: true,
        reviewNote: true,
        reviewedAt: true,
        updatedAt: true,
        organization: { select: { name: true } },
        category: { select: { name: true } },
        budgets: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, plannedAmountWei: true }
        }
      }
    })

    return NextResponse.json({
      data: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        status: campaign.status,
        targetAmountWei: campaign.targetAmountWei.toString(),
        generalLocation: campaign.generalLocation,
        reviewNote: campaign.reviewNote,
        reviewedAt: campaign.reviewedAt?.toISOString() ?? null,
        updatedAt: campaign.updatedAt.toISOString(),
        organizationName: campaign.organization.name,
        categoryName: campaign.category.name,
        latestBudget: campaign.budgets[0]
          ? {
              version: campaign.budgets[0].version,
              plannedWei: campaign.budgets[0].plannedAmountWei.toString()
            }
          : null
      })),
      pagination: { nextCursor: null, hasMore: false }
    })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
