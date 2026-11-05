'use client'

import { useCallback, useRef, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon, CopyIcon } from '@/components/ui/icons'
import {
  SIMULATION_LABEL,
  donationExplorerUrl,
  txHashDisplay,
  type DonationRecord
} from '@/lib/api/donations'
import { cx } from '@/components/ui/cn'

type DonationTxCardProps = {
  record: Pick<
    DonationRecord,
    'id' | 'status' | 'txStatus' | 'txHash' | 'amountWei' | 'confirmedAt' | 'createdAt'
  >
  className?: string
}

type Toast = { text: string; icon: 'check' | 'copy' } | null

export function DonationTxCard({ record, className }: DonationTxCardProps) {
  const [toast, setToast] = useState<Toast>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const txHash = record.txHash ?? null

  const showToast = useCallback((next: NonNullable<Toast>) => {
    setToast(next)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1600)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!txHash) {
      showToast({ text: 'Belum ada hash transaksi untuk disalin.', icon: 'copy' })
      return
    }
    try {
      await navigator.clipboard.writeText(txHash)
      showToast({ text: 'Hash transaksi disalin.', icon: 'check' })
    } catch {
      showToast({ text: 'Gagal menyalin hash transaksi.', icon: 'copy' })
    }
  }, [showToast, txHash])

  return (
    <Card className={cx('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">Catatan transaksi</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-zinc-700">
        {txHash ? (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={donationExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded border border-zinc-300 bg-zinc-50 px-2 font-mono text-xs text-zinc-900 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
            >
              {txHashDisplay(txHash)}
              <span className="sr-only">Buka transaksi di explorer Sepolia</span>
            </a>
            <Button type="button" variant="secondary" onClick={() => void handleCopy()}>
              <CopyIcon className="size-4" />
              Salin
            </Button>
          </div>
        ) : (
          <p>Belum ada transaksi yang dikirim ke jaringan.</p>
        )}

        {record.createdAt ? (
          <p className="text-xs text-zinc-600">
            Dicatat {new Date(record.createdAt).toLocaleString('id-ID')}
          </p>
        ) : null}

        {record.status === 'FAILED' ? (
          <Alert tone="danger" title="Transaksi gagal">
            Catatan donasi tetap tersimpan. Donasi tidak menambah total terkumpul; silakan coba
            lagi dari wallet Anda.
          </Alert>
        ) : null}

        {record.txStatus === 'RETRY_REQUIRED' ? (
          <Alert tone="warning" title="Perlu dicatat ulang">
            Pencatatan ke blockchain gagal sementara. Admin dapat memulai ulang pencatatan tanpa
            membuat donasi ganda.
          </Alert>
        ) : null}

        {record.status === 'CONFIRMED' ? (
          <Alert tone="success" title="Terkonfirmasi">
            Transaksi sudah terkonfirmasi di Sepolia. Ini tetap simulasi dan bukan uang sungguhan.
          </Alert>
        ) : null}

        <p className="text-xs text-zinc-600">{SIMULATION_LABEL}</p>

        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={cx(
              'flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium',
              toast.icon === 'check'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900'
            )}
          >
            {toast.icon === 'check' ? (
              <CheckIcon className="size-4 shrink-0" />
            ) : (
              <CopyIcon className="size-4 shrink-0" />
            )}
            {toast.text}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
