import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requestContext, writeAudit } from '@/app/api/v1/_lib/audit'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { campaignReviewSchema } from '@/lib/validation/admin'
import { toFieldIssues } from '@/lib/validation/common'

type RouteContext = { params: Promise<{ id: string }> }

// CAM-04: admin menyetujui/menolak kampanye PENDING_REVIEW.
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
    assertCan(actor, 'campaign:review', undefined)

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

    const parsed = campaignReviewSchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa keputusan tinjauan Anda.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, status: true, title: true }
    })
    if (!campaign) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }
    if (campaign.status !== 'PENDING_REVIEW') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Hanya kampanye yang menunggu tinjauan yang dapat diputuskan.',
        instance
      })
    }

    const nextStatus = parsed.data.decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED'
    const context = requestContext(request)
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewNote: parsed.data.note || null
        },
        select: { id: true, status: true, reviewedAt: true }
      })

      await writeAudit(tx, {
        actor,
        action: 'campaign.reviewed',
        entityType: 'campaign',
        entityId: id,
        context,
        before: { status: campaign.status },
        after: {
          status: result.status,
          decision: parsed.data.decision,
          note: parsed.data.note || null
        }
      })

      return result
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        reviewedAt: updated.reviewedAt?.toISOString() ?? null
      }
    })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
