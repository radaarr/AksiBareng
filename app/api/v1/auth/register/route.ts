import { NextResponse, type NextRequest } from 'next/server'
import { isCrossSiteRequest } from '@/lib/api/csrf'
import { problem } from '@/lib/api/problem'
import { rateLimit } from '@/lib/api/rate-limit'
import { EmailTakenError, InvalidRegistrationError, registerUser } from '@/lib/auth/register'

// docs/API.md §1.2: registrasi 5 / jam / IP.
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_MS = 60 * 60 * 1000

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

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'lokal'
  const limit = rateLimit(`register:${clientIp}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)
  if (!limit.allowed) {
    return problem({
      status: 429,
      code: 'RATE_LIMITED',
      detail: 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.',
      instance,
      headers: { 'retry-after': String(limit.retryAfterSeconds) }
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
    const user = await registerUser(body)
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof InvalidRegistrationError) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali data pendaftaran Anda.',
        instance,
        errors: error.issues
      })
    }
    if (error instanceof EmailTakenError) {
      return problem({
        status: 409,
        code: 'EMAIL_TAKEN',
        detail: 'Email ini sudah terdaftar. Silakan masuk.',
        instance
      })
    }
    throw error
  }
}
