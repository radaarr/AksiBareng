import type { ReactNode } from 'react'
import { cx } from './cn'

export type EmptyStateProps = {
  title: string
  description?: string
  /** Satu aksi utama, mis. `<ButtonLink href="/dashboard/organizer/events/new">Buat kegiatan</ButtonLink>`. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-8',
        className
      )}
    >
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description ? <p className="max-w-prose text-sm text-zinc-700">{description}</p> : null}
      {action}
    </div>
  )
}
