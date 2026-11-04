import type { ReactNode } from 'react'
import { cx } from './cn'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-xl border border-zinc-200 bg-white', className)}>{children}</section>
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('flex flex-col gap-1 border-b border-zinc-200 px-5 py-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cx('text-base font-semibold text-zinc-900', className)}>{children}</h2>
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cx('text-sm text-zinc-700', className)}>{children}</p>
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-3 border-t border-zinc-200 px-5 py-4', className)}>
      {children}
    </div>
  )
}
