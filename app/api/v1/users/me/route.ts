import { NextResponse, type NextRequest } from 'next/server'
import { accessProblem } from '@/lib/api/access'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { clientIp, hashIp, requestIdFrom } from '@/lib/audit'
import { requireActor } from '@/lib/auth/session'
import { getProfile, updateProfile, InvalidProfileError } from '@/lib/users/profile'

export async function GET() {
  const instance = '/api/v1/users/me'
  try {
    const actor = await requireActor()
    const profile = await getProfile(actor.id)
    if (!profile) {
      return problem({ status: 404, code: 'NOT_FOUND', detail: 'Data tidak ditemukan.', instance })
    }
    return NextResponse.json({ data: profile })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}

export async function PATCH(request: NextRequest) {
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
    const profile = await updateProfile(actor, body, {
      requestId: requestIdFrom(request.headers),
      ipHash: hashIp(clientIp(request.headers))
    })
    return NextResponse.json({ data: profile })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    if (error instanceof InvalidProfileError) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali data profil Anda.',
        instance,
        errors: error.issues
      })
    }
    throw error
  }
}
