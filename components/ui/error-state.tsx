import type { ReactNode } from 'react'
import { cx } from './cn'
import { CrossIcon } from './icons'

export type ErrorStateProps = {
  title?: string
  description: string
  /** Kode mesin untuk dukungan, mis. `QUOTA_FULL`; ditampilkan kecil. */
  errorCode?: string
  /** Tombol "Coba lagi" atau tautan pemulihan. */
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Gagal memuat data',
  description,
  errorCode,
  action,
  className
}: ErrorStateProps) {
  return (
    <div
      className={cx('flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-6', className)}
      role="alert"
    >
      <div className="flex items-center gap-2 text-red-800">
        <CrossIcon className="size-4 shrink-0" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="max-w-prose text-sm text-red-900">{description}</p>
      {action}
      {errorCode ? <p className="font-mono text-xs text-red-800">Kode: {errorCode}</p> : null}
    </div>
  )
}
