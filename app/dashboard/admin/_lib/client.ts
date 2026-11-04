export type ApiProblem = {
  detail?: string
  code?: string
  errors?: { field: string; message: string }[]
}

export type ApiResult = { ok: true } | { ok: false; message: string }

export async function postDecision(url: string, body: unknown): Promise<ApiResult> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch {
    return { ok: false, message: 'Tidak dapat menghubungi server. Coba lagi.' }
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const problem = payload as ApiProblem | null
    const issues = problem?.errors?.map((issue) => issue.message).join(' ') ?? ''
    return {
      ok: false,
      message:
        [problem?.detail, issues].filter(Boolean).join(' ') || 'Keputusan gagal disimpan.'
    }
  }

  return { ok: true }
}
