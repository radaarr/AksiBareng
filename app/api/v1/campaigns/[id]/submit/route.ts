import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { requestContext, writeCampaignAudit } from '../../_lib/campaigns'

type RouteContext = { params: Promise<{ id: string }> }

// CAM-04: kirim kampanye ke antrean tinjauan admin. Tanpa anggaran → 422.
export async function POST(request: NextRequest, { params }: RouteContext) {
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
      select: {
        id: true,
        organizationId: true,
        status: true,
        budgets: {
          where: { supersededAt: null },
          select: { version: true },
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })
    if (!campaign) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }

    assertCan(actor, 'campaign:submit', campaign)

    if (campaign.status !== 'DRAFT' && campaign.status !== 'REJECTED') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Hanya kampanye draf atau yang ditolak yang dapat diajukan.',
        instance
      })
    }

    if (campaign.budgets.length === 0) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Lengkapi rencana penggunaan dana sebelum mengajukan kampanye.',
        instance,
        errors: [
          { field: 'budgetItems', message: 'Minimal satu kategori anggaran harus tersimpan.' }
        ]
      })
    }

    const context = requestContext(request)
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: {
          status: 'PENDING_REVIEW',
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null
        },
        select: { id: true, status: true, updatedAt: true }
      })

      await writeCampaignAudit(tx, {
        actor,
        action: 'campaign.submitted',
        entityId: id,
        context,
        before: { status: campaign.status },
        after: { status: result.status }
      })

      return result
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString()
      }
    })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
