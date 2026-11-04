import { NextResponse, type NextRequest } from 'next/server'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { rateLimit } from '@/lib/api/rate-limit'
import { clientIp, hashIp, requestIdFrom } from '@/lib/audit'
import { requireActor } from '@/lib/auth/session'
import { createOrganization } from '@/lib/organizations/service'
import { organizationProblem } from '@/lib/organizations/http'

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

  try {
    const actor = await requireActor()

    const limit = rateLimit(`org:create:${actor.id}`, 10, 60 * 60 * 1000)
    if (!limit.allowed) {
      return problem({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Terlalu banyak pengajuan dari akun ini. Coba lagi nanti.',
        instance,
        headers: { 'retry-after': String(limit.retryAfterSeconds) }
      })
    }

    const organization = await createOrganization(actor, body, {
      requestId: requestIdFrom(request.headers),
      ipHash: hashIp(clientIp(request.headers))
    })
    return NextResponse.json({ data: organization }, { status: 201 })
  } catch (error) {
    const handled = organizationProblem(error, instance)
    if (handled) return handled
    throw error
  }
}
