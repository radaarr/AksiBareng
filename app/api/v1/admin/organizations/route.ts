import { NextResponse, type NextRequest } from 'next/server'
import { requireActor } from '@/lib/auth/session'
import { listAdminVerifications } from '@/lib/organizations/service'
import { organizationProblem } from '@/lib/organizations/http'

export async function GET(request: NextRequest) {
  const instance = request.nextUrl.pathname

  try {
    const actor = await requireActor()
    const { data, pagination } = await listAdminVerifications(actor, {
      status: request.nextUrl.searchParams.get('status') ?? undefined,
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
      cursor: request.nextUrl.searchParams.get('cursor') ?? undefined
    })
    return NextResponse.json({ data, pagination })
  } catch (error) {
    const handled = organizationProblem(error, instance)
    if (handled) return handled
    throw error
  }
}
