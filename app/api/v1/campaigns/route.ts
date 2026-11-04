import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { requireActor } from '@/lib/auth/session'
import { assertCan } from '@/lib/authz'
import { createCampaignSchema } from '@/lib/validation/campaign'
import { toFieldIssues } from '@/lib/validation/common'
import {
  campaignSlug,
  normalizeWei,
  requestContext,
  resolveCampaignCategory,
  serializeCampaign,
  writeCampaignAudit
} from './_lib/campaigns'

// CAM-01, CAM-02, CAM-03: organizer terverifikasi membuat kampanye + anggaran versi 1.
export async function POST(request: NextRequest) {
  const instance = request.nextUrl.pathname

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
    assertCan(actor, 'campaign:create', undefined)

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

    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali data kampanye Anda.',
        instance,
        errors: toFieldIssues(parsed.error)
      })
    }

    if (!actor.organizationId) {
      return problem({
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Akun ini belum memiliki organisasi.',
        instance
      })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: { id: true, verificationStatus: true }
    })
    if (!organization || organization.verificationStatus !== 'VERIFIED') {
      return problem({
        status: 403,
        code: 'ORGANIZATION_NOT_VERIFIED',
        detail: 'Hanya organisasi terverifikasi yang dapat membuat kampanye.',
        instance
      })
    }

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

    const context = requestContext(request)
    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          organizationId: organization.id,
          title: parsed.data.title,
          slug: campaignSlug(parsed.data.title),
          story: parsed.data.story,
          categoryId: category.id,
          periodStartsAt: new Date(parsed.data.periodStartsAt),
          periodEndsAt: new Date(parsed.data.periodEndsAt),
          targetAmountWei: new Prisma.Decimal(normalizeWei(parsed.data.targetAmountWei)),
          generalLocation: parsed.data.generalLocation,
          status: 'DRAFT',
          budgets: {
            create: parsed.data.budgetItems.map((item) => ({
              version: 1,
              category: item.category,
              description: item.description || null,
              plannedAmountWei: new Prisma.Decimal(normalizeWei(item.plannedWei)),
              createdBy: actor.id
            }))
          }
        },
        include: { budgets: { orderBy: { version: 'asc' } } }
      })

      await writeCampaignAudit(tx, {
        actor,
        action: 'campaign.created',
        entityId: created.id,
        context,
        after: {
          status: created.status,
          title: created.title,
          targetAmountWei: created.targetAmountWei.toString()
        }
      })

      return created
    })

    return NextResponse.json({ data: serializeCampaign(campaign) }, { status: 201 })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return problem({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        detail: 'Kampanye dengan slug yang sama sudah ada. Coba lagi.',
        instance
      })
    }

    throw error
  }
}
