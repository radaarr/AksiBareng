'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { postDecision } from '../_lib/client'

type Panel = 'approve' | 'reject' | 'pause' | null

const textareaClass =
  'min-h-24 w-full rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2'
const secondaryButton =
  'inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2'
const primaryButton =
  'inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const dangerButton =
  'inline-flex min-h-11 items-center rounded-md bg-red-800 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function CampaignReviewActions({
  campaignId,
  status
}: {
  campaignId: string
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED'
}) {
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

    if ((panel === 'reject' || panel === 'pause') && note.trim().length < 10) {
      setError('Alasan minimal 10 karakter.')
      return
    }

    setBusy(true)
    setError(null)

    const result =
      panel === 'pause'
        ? await postDecision(`/api/v1/admin/campaigns/${campaignId}/pause`, {
            note: note.trim()
          })
        : await postDecision(`/api/v1/admin/campaigns/${campaignId}/review`, {
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
        ? 'Kampanye disetujui.'
        : panel === 'reject'
          ? 'Kampanye ditolak.'
          : 'Kampanye dijeda.'
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
          {status === 'PENDING_REVIEW' ? (
            <>
              <button type="button" onClick={() => open('approve')} className={primaryButton}>
                Setujui kampanye
              </button>
              <button type="button" onClick={() => open('reject')} className={dangerButton}>
                Tolak kampanye
              </button>
            </>
          ) : null}
          {status === 'ACTIVE' ? (
            <button type="button" onClick={() => open('pause')} className={dangerButton}>
              Jeda kampanye
            </button>
          ) : null}
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4"
        >
          <p className="text-sm font-semibold text-zinc-900">
            {panel === 'approve'
              ? 'Setujui kampanye ini dan tampilkan ke publik?'
              : panel === 'reject'
                ? 'Tolak kampanye ini? Organizer dapat memperbaiki lalu mengajukan ulang.'
                : 'Jeda kampanye ini? Data dan riwayat tidak dihapus.'}
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor={`review-note-${campaignId}`} className="text-sm font-medium text-zinc-900">
              {panel === 'approve' ? 'Catatan (opsional)' : 'Alasan (wajib, minimal 10 karakter)'}
            </label>
            <textarea
              id={`review-note-${campaignId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              required={panel !== 'approve'}
              aria-invalid={error !== null}
              className={textareaClass}
              placeholder={
                panel === 'reject'
                  ? 'Contoh: Rencana anggaran belum memuat rincian biaya.'
                  : panel === 'pause'
                    ? 'Contoh: Menunggu klarifikasi laporan penggunaan dana.'
                    : 'Catatan untuk organizer (boleh dikosongkan).'
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
              {busy
                ? 'Menyimpan…'
                : panel === 'approve'
                  ? 'Ya, setujui'
                  : panel === 'reject'
                    ? 'Ya, tolak'
                    : 'Ya, jeda'}
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
