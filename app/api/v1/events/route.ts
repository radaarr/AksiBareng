import { NextResponse, type NextRequest } from 'next/server'
import { problem } from '@/lib/api/problem'
import { InvalidEventQueryError, listPublicEvents } from '@/lib/events/service'
import { toFieldIssues } from '@/lib/validation/common'
import { eventListQuerySchema } from '@/lib/validation/event'

/** Katalog publik (EVT-04, EVT-12). Tanpa sesi; hanya status publik yang tampil. */
export async function GET(request: NextRequest) {
  const instance = request.nextUrl.pathname

  const parsed = eventListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return problem({
      status: 422,
      code: 'VALIDATION_ERROR',
      detail: 'Periksa kembali filter yang Anda kirim.',
      instance,
      errors: toFieldIssues(parsed.error)
    })
  }

  try {
    const result = await listPublicEvents(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof InvalidEventQueryError) {
      return problem({
        status: 422,
        code: 'VALIDATION_ERROR',
        detail: 'Periksa kembali filter yang Anda kirim.',
        instance,
        errors: error.issues
      })
    }
    throw error
  }
}
