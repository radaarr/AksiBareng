import type { ReactNode } from 'react'
import { cx } from './cn'
import { AlertIcon, CheckIcon, CrossIcon, InfoIcon } from './icons'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const TONE_STYLE: Record<AlertTone, string> = {
  info: 'border-zinc-300 bg-zinc-50 text-zinc-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  danger: 'border-red-300 bg-red-50 text-red-900'
}

const TONE_ICON_STYLE: Record<AlertTone, string> = {
  info: 'text-zinc-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700'
}

function ToneIcon({ tone, className }: { tone: AlertTone; className: string }) {
  if (tone === 'success') return <CheckIcon className={className} />
  if (tone === 'warning') return <AlertIcon className={className} />
  if (tone === 'danger') return <CrossIcon className={className} />
  return <InfoIcon className={className} />
}

export type AlertProps = {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      className={cx('flex items-start gap-3 rounded-lg border p-3 text-sm', TONE_STYLE[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <ToneIcon tone={tone} className={cx('mt-0.5 size-4 shrink-0', TONE_ICON_STYLE[tone])} />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}
