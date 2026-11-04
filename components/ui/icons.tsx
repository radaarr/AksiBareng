import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3 2.5 16.5h15L10 3Z" />
      <path d="M10 8v4" />
      <path d="M10 14.6v.1" />
    </svg>
  )
}

export function CrossIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="m7.5 7.5 5 5" />
      <path d="m12.5 7.5-5 5" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5" />
      <path d="M10 6.4v.1" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.5 10h7" />
    </svg>
  )
}

/** Spinner dengan `animate-spin`; pemanggil menonaktifkannya lewat kelas jika perlu. */
export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 2.5a7.5 7.5 0 1 1-7.5 7.5" />
    </svg>
  )
}
