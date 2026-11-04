import type { ReactNode } from 'react'
import { cx } from './cn'
import { AlertIcon, CheckIcon, CrossIcon, MinusIcon } from './icons'
import { statusMeta, type StatusContext, type StatusTone } from './status'

const TONE_STYLE: Record<StatusTone, string> = {
  neutral: 'border-zinc-300 bg-zinc-100 text-zinc-800',
  positive: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  negative: 'border-red-300 bg-red-50 text-red-800',
  'positive-muted': 'border-emerald-200 bg-emerald-50 text-emerald-900'
}

function ToneIcon({ tone, className }: { tone: StatusTone; className: string }) {
  if (tone === 'positive' || tone === 'positive-muted') return <CheckIcon className={className} />
  if (tone === 'warning') return <AlertIcon className={className} />
  if (tone === 'negative') return <CrossIcon className={className} />
  return <MinusIcon className={className} />
}

export type StatusBadgeProps = {
  status: string
  /** Hanya perlu untuk `PENDING`, yang artinya beda per entitas. */
  context?: StatusContext
  className?: string
  children?: ReactNode
}

export function StatusBadge({ status, context = 'default', className, children }: StatusBadgeProps) {
  const meta = statusMeta(status, context)

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_STYLE[meta.tone],
        className
      )}
    >
      <ToneIcon tone={meta.tone} className="size-3.5 shrink-0" />
      {children ?? meta.label}
    </span>
  )
}
