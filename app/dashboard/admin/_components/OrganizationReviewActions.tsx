'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { postDecision } from '../_lib/client'

type Panel = 'approve' | 'reject' | null

const textareaClass =
  'min-h-24 w-full rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2'
const secondaryButton =
  'inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2'
const primaryButton =
  'inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const dangerButton =
  'inline-flex min-h-11 items-center rounded-md bg-red-800 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function OrganizationReviewActions({ organizationId }: { organizationId: string }) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function open(next: Panel) {
    setPanel(next)
    setNote('')
    setError(null)
    setNotice(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!panel) return

    if (panel === 'reject' && note.trim().length < 10) {
      setError('Alasan penolakan minimal 10 karakter.')
      return
    }

    setBusy(true)
    setError(null)

    const result = await postDecision(`/api/v1/admin/organizations/${organizationId}/review`, {
      decision: panel === 'approve' ? 'APPROVED' : 'REJECTED',
      note: note.trim()
    })

    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setPanel(null)
    setNotice(
      panel === 'approve'
        ? 'Verifikasi organisasi disetujui.'
        : 'Pengajuan verifikasi organisasi ditolak.'
    )
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-900">
          {notice}
        </p>
      ) : null}

      {panel === null ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => open('approve')} className={primaryButton}>
            Setujui verifikasi
          </button>
          <button type="button" onClick={() => open('reject')} className={dangerButton}>
            Tolak verifikasi
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4"
        >
          <p className="text-sm font-semibold text-zinc-900">
            {panel === 'approve'
              ? 'Setujui verifikasi organisasi ini? Owner akan menjadi organizer.'
              : 'Tolak pengajuan verifikasi? Organizer dapat mengajukan ulang.'}
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor={`org-note-${organizationId}`} className="text-sm font-medium text-zinc-900">
              {panel === 'approve' ? 'Catatan (opsional)' : 'Alasan (wajib, minimal 10 karakter)'}
            </label>
            <textarea
              id={`org-note-${organizationId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              required={panel === 'reject'}
              aria-invalid={error !== null}
              className={textareaClass}
              placeholder={
                panel === 'approve'
                  ? 'Catatan untuk organizer (boleh dikosongkan).'
                  : 'Contoh: Dokumen legalitas belum terbaca jelas.'
              }
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={panel === 'approve' ? primaryButton : dangerButton}>
              {busy ? 'Menyimpan…' : panel === 'approve' ? 'Ya, setujui' : 'Ya, tolak'}
            </button>
            <button type="button" onClick={() => setPanel(null)} disabled={busy} className={secondaryButton}>
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
