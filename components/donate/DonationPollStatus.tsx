'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { SpinnerIcon } from '@/components/ui/icons'
import { donationStatusValue, type DonationRecord } from '@/lib/api/donations'
import { cx } from '@/components/ui/cn'
import { DonationTxCard } from './DonationTxCard'

type DonationPollStatusProps = {
  donationId: string
  /** Endpoint polling (GET /users/me/donations). Tanpa ini, hanya status awal yang tampil. */
  pollUrl?: string
  /** Status awal dari server supaya layar tidak kosong saat polling pertama. */
  initial?: DonationRecord
  className?: string
}

const POLL_INTERVAL_MS = 5000
const MAX_BACKOFF_MS = 20000

export function DonationPollStatus({
  donationId,
  pollUrl,
  initial,
  className
}: DonationPollStatusProps) {
  const [donation, setDonation] = useState<DonationRecord | null>(initial ?? null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef(POLL_INTERVAL_MS)

  const refresh = useCallback(async () => {
    if (!pollUrl) return

    setRefreshing(true)
    try {
      const response = await fetch(pollUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('gagal memuat status donasi')
      }

      const body = (await response.json()) as { data?: DonationRecord | DonationRecord[] }
      const list = Array.isArray(body.data) ? body.data : body.data ? [body.data] : []
      const found = list.find((item) => item.id === donationId)

      if (!found) {
        throw new Error('donasi tidak ditemukan')
      }

      if (!mountedRef.current) return
      setDonation(found)
      setError(null)
      setUpdatedAt(new Date().toISOString())
      backoffRef.current = POLL_INTERVAL_MS
    } catch {
      if (!mountedRef.current) return
      setError('Gagal menyegarkan status. Coba lagi.')
      backoffRef.current = Math.min(backoffRef.current + 5000, MAX_BACKOFF_MS)
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [donationId, pollUrl])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Polling berjalan di latar dan berhenti saat status sudah final.
  const isFinal = donation?.status === 'CONFIRMED' || donation?.status === 'FAILED'

  useEffect(() => {
    if (!pollUrl || isFinal) return

    let cancelled = false
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (cancelled) return
        void refresh().then(() => {
          if (!cancelled) schedule()
        })
      }, backoffRef.current)
    }

    schedule()

    return () => {
      cancelled = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pollUrl, refresh, isFinal])

  if (!donation) {
    if (error) {
      return (
        <div className={cx('flex flex-col gap-3 text-sm text-zinc-700', className)}>
          <p role="alert" className="text-red-800">
            {error}
          </p>
          <Button type="button" variant="secondary" onClick={() => void refresh()}>
            Muat ulang status
          </Button>
        </div>
      )
    }

    return (
      <div className={cx('flex items-center gap-2 text-sm text-zinc-700', className)}>
        <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
        <span>Memuat status donasi…</span>
      </div>
    )
  }

  const statusContext = donation.status === 'PENDING' && donation.txStatus ? 'chain' : 'default'

  return (
    <div className={cx('flex flex-col gap-3 text-sm text-zinc-700', className)}>
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <StatusBadge
          status={donationStatusValue(donation.status, donation.txStatus)}
          context={statusContext}
        />
        {isFinal ? (
          <span className="text-xs text-zinc-600">Pemantauan otomatis dihentikan.</span>
        ) : (
          <span className="text-xs text-zinc-600">Memantau perubahan di latar belakang.</span>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-red-800">
          {error}
        </p>
      ) : null}

      {updatedAt ? (
        <p className="text-xs text-zinc-600">
          Diperbarui {new Date(updatedAt).toLocaleTimeString('id-ID')}
        </p>
      ) : null}

      {/* Satu sumber status: kartu memakai catatan hasil polling, bukan snapshot awal. */}
      <DonationTxCard record={donation} />

      <Button
        type="button"
        variant="secondary"
        loading={refreshing}
        onClick={() => void refresh()}
      >
        Periksa status sekarang
      </Button>
    </div>
  )
}
