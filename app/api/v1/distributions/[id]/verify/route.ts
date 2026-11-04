import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requestContext, writeAudit } from '@/app/api/v1/_lib/audit'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { distributionVerifySchema } from '@/lib/validation/admin'
import { toFieldIssues } from '@/lib/validation/common'

type RouteContext = { params: Promise<{ id: string }> }

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
    assertCan(actor, 'distribution:verify', { id })

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

    const parsed = distributionVerifySchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Status verifikasi tidak valid.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    const batch = await prisma.distributionBatch.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            organizationId: true
          }
        },
        evidence: {
          select: {
            id: true,
            mimeType: true,
            privacyReview: true
          }
        }
      }
    })

    if (!batch) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Batch tidak ditemukan.',
        instance
      })
    }

    if (batch.campaign.organizationId !== actor.organizationId && actor.role !== 'ADMIN') {
      throw new Error('FORBIDDEN')
    }

    if (batch.status !== 'DELIVERED' && batch.status !== 'PARTIALLY_DELIVERED') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Verifikasi hanya dapat dilakukan pada batch yang sudah diterima atau diterima sebagian.',
        instance
      })
    }

    if (batch.status === 'DELIVERED' || batch.status === 'PARTIALLY_DELIVERED') {
      const blockedEvidence = batch.evidence.some((e) => e.privacyReview === 'PENDING')
      if (blockedEvidence) {
        return problem({
          status: 409,
          code: 'INVALID_STATE_TRANSITION',
          detail: 'Bukti distribusi belum disetujui untuk publikasi.',
          instance
        })
      }
    }

    const context = requestContext(request)

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.distributionBatch.update({
        where: { id },
        data: {
          status: parsed.data.status === 'PARTIALLY_DELIVERED' ? 'PARTIALLY_DELIVERED' : 'DELIVERED',
          verifiedBy: actor.id,
          verifiedAt: new Date(),
          blockchainTxId: undefined
        },
        select: {
          id: true,
          status: true,
          verifiedAt: true,
          aidType: true,
          generalLocation: true,
          title: true
        }
      })

      await writeAudit(tx, {
        actor,
        action: 'distribution.verified',
        entityType: 'campaign',
        entityId: batch.campaignId,
        context,
        before: { status: batch.status },
        after: {
          status: result.status,
          aidType: result.aidType,
          generalLocation: result.generalLocation
        }
      })

      return result
    })

    return NextResponse.json(
      {
        data: {
          id: updated.id,
          status: updated.status,
          verifiedAt: updated.verifiedAt?.toISOString() ?? null,
          anchor: {
            kind: 'RECORD_DISTRIBUTION',
            status: 'PENDING'
          }
        }
      },
      {
        status: 202,
        headers: { 'content-type': 'application/json' }
      }
    )
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
