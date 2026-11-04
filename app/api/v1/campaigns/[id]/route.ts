import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { updateCampaignSchema } from '@/lib/validation/campaign'
import { toFieldIssues } from '@/lib/validation/common'
import {
  normalizeWei,
  requestContext,
  resolveCampaignCategory,
  serializeCampaign,
  writeCampaignAudit
} from '../_lib/campaigns'

type RouteContext = { params: Promise<{ id: string }> }

// CAM-02: organizer pemilik mengubah kampanye selama masih DRAFT/REJECTED.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        status: true,
        periodStartsAt: true,
        periodEndsAt: true
      }
    })
    if (!existing) {
      return problem({
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Kampanye tidak ditemukan.',
        instance
      })
    }

    assertCan(actor, 'campaign:update', existing)

    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      return problem({
        status: 409,
        code: 'INVALID_STATE_TRANSITION',
        detail: 'Kampanye hanya dapat diubah saat berstatus draf atau ditolak.',
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

    const parsed = updateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali data kampanye Anda.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    const startsAt = parsed.data.periodStartsAt
      ? new Date(parsed.data.periodStartsAt)
      : existing.periodStartsAt
    const endsAt = parsed.data.periodEndsAt
      ? new Date(parsed.data.periodEndsAt)
      : existing.periodEndsAt
    if (endsAt <= startsAt) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali data kampanye Anda.',
        instance,
        errors: [
          { field: 'periodEndsAt', message: 'Periode selesai harus setelah periode mulai.' }
        ]
      })
    }

    let categoryId: string | undefined
    if (parsed.data.categorySlug) {
      const category = await resolveCampaignCategory(parsed.data.categorySlug)
      if (!category) {
        return problem({
          status: 422,
          code: 'VALIDATION_ERROR',
          detail: 'Kategori kampanye tidak ditemukan atau tidak aktif.',
          instance,
          errors: [{ field: 'categorySlug', message: 'Pilih kategori yang tersedia.' }]
        })
      }
      categoryId = category.id
    }

    const context = requestContext(request)
    const updated = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data: {
          ...(parsed.data.title ? { title: parsed.data.title } : {}),
          ...(parsed.data.story ? { story: parsed.data.story } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(parsed.data.periodStartsAt
            ? { periodStartsAt: new Date(parsed.data.periodStartsAt) }
            : {}),
          ...(parsed.data.periodEndsAt ? { periodEndsAt: new Date(parsed.data.periodEndsAt) } : {}),
          ...(parsed.data.targetAmountWei
            ? { targetAmountWei: new Prisma.Decimal(normalizeWei(parsed.data.targetAmountWei)) }
            : {}),
          ...(parsed.data.generalLocation
            ? { generalLocation: parsed.data.generalLocation }
            : {})
        },
        include: { budgets: { orderBy: { version: 'asc' } } }
      })

      await writeCampaignAudit(tx, {
        actor,
        action: 'campaign.updated',
        entityId: campaign.id,
        context,
        after: {
          status: campaign.status,
          title: campaign.title,
          targetAmountWei: campaign.targetAmountWei.toString()
        }
      })

      return campaign
    })

    return NextResponse.json({ data: serializeCampaign(updated) })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
