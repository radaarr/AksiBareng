import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { cx } from './cn'
import { SpinnerIcon } from './icons'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-emerald-700 text-white hover:bg-emerald-800',
  secondary: 'border-zinc-400 bg-white text-zinc-900 hover:bg-zinc-100',
  danger: 'border-transparent bg-red-700 text-white hover:bg-red-800',
  ghost: 'border-transparent bg-transparent text-zinc-900 hover:bg-zinc-100'
}

// 44 px minimum hit area (docs/UI_UX.md §6); there is no smaller size on purpose.
const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base'
}

const SHARED =
  'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold whitespace-nowrap transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(SHARED, VARIANT[variant], SIZE[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <SpinnerIcon className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : null}
      {children}
    </button>
  )
}

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={cx(SHARED, VARIANT[variant], SIZE[size], className)} {...rest}>
      {children}
    </a>
  )
}
