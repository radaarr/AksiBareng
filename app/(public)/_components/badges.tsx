import type { CampaignStatus, DataSource, ExpenseStatus } from '@/lib/fixtures/campaigns'

type Tone = {
  label: string
  className: string
  icon: string
}

const statusTones: Record<CampaignStatus, Tone> = {
  DRAFT: { label: 'Draf', className: 'border-zinc-300 bg-zinc-100 text-zinc-800', icon: '✎' },
  PENDING_REVIEW: {
    label: 'Menunggu tinjauan',
    className: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: '!'
  },
  ACTIVE: { label: 'Aktif', className: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: '●' },
  PAUSED: { label: 'Dijeda', className: 'border-amber-300 bg-amber-50 text-amber-950', icon: '!' },
  CLOSED: { label: 'Ditutup', className: 'border-zinc-300 bg-zinc-100 text-zinc-800', icon: '■' },
  COMPLETED: { label: 'Selesai', className: 'border-teal-300 bg-teal-50 text-teal-900', icon: '✓' },
  REJECTED: { label: 'Ditolak', className: 'border-red-300 bg-red-50 text-red-900', icon: '×' },
  CANCELLED: { label: 'Dibatalkan', className: 'border-red-300 bg-red-50 text-red-900', icon: '×' }
}

/** Status selalu ikon + teks, tidak pernah warna saja (docs/UI_UX.md §6). */
export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const tone = statusTones[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${tone.className}`}
    >
      <span aria-hidden="true">{tone.icon}</span>
      {tone.label}
    </span>
  )
}

const sourceLabels: Record<DataSource, string> = {
  BLOCKCHAIN: 'Dari blockchain',
  DATABASE: 'Dari catatan organizer',
  ORGANIZER_STATEMENT: 'Pernyataan organizer'
}

const sourceClassNames: Record<DataSource, string> = {
  BLOCKCHAIN: 'border-teal-300 bg-teal-50 text-teal-900',
  DATABASE: 'border-zinc-300 bg-white text-zinc-800',
  ORGANIZER_STATEMENT: 'border-amber-300 bg-amber-50 text-amber-950'
}

const expenseTones: Record<ExpenseStatus, Tone> = {
  PROPOSED: { label: 'Diajukan', className: 'border-zinc-300 bg-zinc-100 text-zinc-800', icon: '○' },
  APPROVED: { label: 'Disetujui', className: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: '✓' },
  PAID: { label: 'Sudah dibayar (dicatat)', className: 'border-teal-300 bg-teal-50 text-teal-900', icon: '■' }
}

/** Status pengeluaran tidak pernah hanya warna (docs/UI_UX.md §3, §6). */
export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const tone = expenseTones[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${tone.className}`}
    >
      <span aria-hidden="true">{tone.icon}</span>
      {tone.label}
    </span>
  )
}

/** Badge sumber angka: wajib di samping setiap nominal (PRD §7.10, TRN). */
export function SourceBadge({ source }: { source: DataSource }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${sourceClassNames[source]}`}
    >
      <span aria-hidden="true">{source === 'BLOCKCHAIN' ? '⛓' : source === 'DATABASE' ? '▤' : '✎'}</span>
      {sourceLabels[source]}
    </span>
  )
}
