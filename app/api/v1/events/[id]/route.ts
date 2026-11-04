import { NextResponse, type NextRequest } from 'next/server'
import { problem } from '@/lib/api/problem'
import { getPublicEvent } from '@/lib/events/service'

/**
 * Detail kegiatan publik (EVT-05). Menerima id atau slug karena halaman katalog
 * C memakai slug. Draf dan kegiatan yang dibatalkan dijawab 404 yang sama,
 * supaya keberadaan draf tidak bocor (K-07).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const instance = request.nextUrl.pathname

  const event = await getPublicEvent(id)
  if (!event) {
    return problem({ status: 404, code: 'NOT_FOUND', detail: 'Data tidak ditemukan.', instance })
  }

  return NextResponse.json({ data: event })
}
