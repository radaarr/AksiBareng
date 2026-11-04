import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requestContext, writeAudit } from '@/app/api/v1/_lib/audit'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { campaignPauseSchema } from '@/lib/validation/admin'
import { toFieldIssues } from '@/lib/validation/common'

type RouteContext = { params: Promise<{ id: string }> }

// PRD §9.1: admin dapat menjeda kampanye aktif. Baris tidak dihapus; alasan
// disimpan di review_note dan audit_logs.
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
      select: { id: true, organizationId: true }
    })
    if (!campaign) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }

    assertCan(actor, 'campaign:pause', { id: campaign.id, organizationId: campaign.organizationId })

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

    const parsed = campaignPauseSchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Alasan jeda wajib diisi.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    const fullCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, status: true }
    })
    if (!fullCampaign) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }
    if (fullCampaign.status !== 'ACTIVE') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Hanya kampanye aktif yang dapat dijeda.',
        instance
      })
    }

    const context = requestContext(request)
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({
        where: { id },
        data: {
          status: 'PAUSED',
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewNote: parsed.data.note
        },
        select: { id: true, status: true, reviewedAt: true }
      })

      await writeAudit(tx, {
        actor,
        action: 'campaign.paused',
        entityType: 'campaign',
        entityId: id,
        context,
        before: { status: fullCampaign.status },
        after: { status: result.status, note: parsed.data.note }
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
