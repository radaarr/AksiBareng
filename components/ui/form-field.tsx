import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cx } from './cn'
import { AlertIcon } from './icons'

export type FormFieldProps = {
  /** Id kontrol; harus sama dengan `id` elemen input di dalam `children`. */
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ id, label, hint, error, required, children, className }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Satu kontrol: teruskan aria-* agar pembaca layar tahu petunjuk dan error-nya.
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined
      })
    : children

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-900">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-red-700">
              *
            </span>
            <span className="sr-only"> (wajib diisi)</span>
          </>
        ) : null}
      </label>

      {control}

      {hint ? (
        <p id={hintId ?? undefined} className="text-xs text-zinc-700">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId ?? undefined} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-800">
          <AlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
