import type { NextRequest } from 'next/server'

// docs/API.md §1: mutasi wajib punya Origin/Sec-Fetch-Site yang valid.
// Permisif bila header tidak dikirim (klien non-browser, mis. curl/CI), ketat bila ada.
export function isCrossSiteRequest(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true

  const origin = request.headers.get('origin')
  if (!origin) return false

  const host = request.headers.get('host')
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}
