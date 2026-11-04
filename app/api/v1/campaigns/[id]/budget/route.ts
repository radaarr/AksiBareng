import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { updateBudgetSchema } from '@/lib/validation/campaign'
import { toFieldIssues } from '@/lib/validation/common'
import { normalizeWei, requestContext, writeCampaignAudit } from '../../_lib/campaigns'

type RouteContext = { params: Promise<{ id: string }> }

// CAM-03: revisi anggaran membuat versi baru; versi lama diberi supersededAt.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const instance = request.nextUrl.pathname
  const { id } = await params

  if (isCrossSiteRequest(request)) {
    return problem({
      status: 403,
      code: 'FORBIDDEN',
      detail: 'Permintaan lintas situs ditolak.',
      instance
    })
  }

  try {
    const actor = await requireActor()

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, organizationId: true, status: true }
    })
    if (!campaign) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }

    assertCan(actor, 'campaign:budget', campaign)

    if (campaign.status !== 'DRAFT' && campaign.status !== 'REJECTED') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Rencana anggaran hanya dapat direvisi saat kampanye berstatus draf atau ditolak.',
        instance
      })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Body permintaan harus JSON yang valid.',
        instance
      })
    }

    const parsed = updateBudgetSchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali rencana anggaran Anda.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    const context = requestContext(request)
    const result = await prisma.$transaction(async (tx) => {
      const latest = await tx.campaignBudget.aggregate({
        where: { campaignId: id },
        _max: { version: true }
      })
      const version = (latest._max.version ?? 0) + 1
      const now = new Date()

      await tx.campaignBudget.updateMany({
        where: { campaignId: id, supersededAt: null },
        data: { supersededAt: now }
      })

      const items = []
      for (const item of parsed.data.items) {
        items.push(
          await tx.campaignBudget.create({
            data: {
              campaignId: id,
              version,
              category: item.category,
              description: item.description || null,
              plannedAmountWei: new Prisma.Decimal(normalizeWei(item.plannedWei)),
              createdBy: actor.id
            }
          })
        )
      }

      const totalWei = items
        .reduce((total, item) => total.plus(item.plannedAmountWei), new Prisma.Decimal(0))
        .toString()

      await writeCampaignAudit(tx, {
        actor,
        action: 'campaign.budget.versioned',
        entityId: id,
        context,
        after: { version, itemCount: items.length, totalWei }
      })

      return { version, items, totalWei }
    })

    return NextResponse.json({
      data: {
        campaignId: id,
        version: result.version,
        totalWei: result.totalWei,
        items: result.items.map((item) => ({
          category: item.category,
          description: item.description,
          plannedWei: item.plannedAmountWei.toString()
        }))
      }
    })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
