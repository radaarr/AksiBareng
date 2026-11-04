import { NextResponse, type NextRequest } from 'next/server'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { clientIp, hashIp, requestIdFrom } from '@/lib/audit'
import { requireActor } from '@/lib/auth/session'
import { getPublicOrganization, updateOrganization } from '@/lib/organizations/service'
import { organizationProblem } from '@/lib/organizations/http'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const instance = request.nextUrl.pathname

  const organization = await getPublicOrganization(id)
  if (!organization) {
    return problem({ status: 404, code: 'NOT_FOUND', detail: 'Data tidak ditemukan.', instance })
  }
  return NextResponse.json({ data: organization })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const organization = await updateOrganization(actor, id, body, {
      requestId: requestIdFrom(request.headers),
      ipHash: hashIp(clientIp(request.headers))
    })
    return NextResponse.json({ data: organization })
  } catch (error) {
    const handled = organizationProblem(error, instance)
    if (handled) return handled
    throw error
  }
}
