// Satu sumber label & warna status (docs/UI_UX.md §3). Komponen tidak boleh
// menulis label sendiri, dan nilai enum mentah tidak pernah tampil ke pengguna.
export type StatusTone = 'neutral' | 'positive' | 'warning' | 'negative' | 'positive-muted'

export type StatusMeta = {
  label: string
  tone: StatusTone
}

export type StatusValue =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ONGOING'
  | 'CLOSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'VERIFIED'
  | 'NO_SHOW'
  | 'REVOKED'
  | 'PROPOSED'
  | 'APPROVED'
  | 'PAID'
  | 'PLANNED'
  | 'PREPARED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'NEEDS_REVIEW'
  | 'CONFIRMED'
  | 'FAILED'
  | 'RETRY_REQUIRED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'RECEIVED'
  | 'UNVERIFIED'
  | 'ORGANIZATION_NOT_VERIFIED'
  | 'INTENT'
  | 'NOT_ANCHORED'
  | 'REDACTED'
  | 'SUSPENDED'
  | 'DELETED'
  | 'OPEN'
  | 'REVIEWING'
  | 'RESOLVED'
  | 'DISMISSED'

/** `PENDING` dipakai beberapa entitas dengan arti berbeda, jadi butuh konteks. */
export type StatusContext = 'default' | 'chain' | 'contribution' | 'organization' | 'privacy' | 'anchor'

const BASE: Record<StatusValue, StatusMeta> = {
  DRAFT: { label: 'Draf', tone: 'neutral' },
  PENDING_REVIEW: { label: 'Menunggu tinjauan', tone: 'warning' },
  PUBLISHED: { label: 'Aktif', tone: 'positive' },
  ACTIVE: { label: 'Aktif', tone: 'positive' },
  PAUSED: { label: 'Dijeda', tone: 'warning' },
  ONGOING: { label: 'Sedang berlangsung', tone: 'positive' },
  CLOSED: { label: 'Ditutup', tone: 'neutral' },
  COMPLETED: { label: 'Selesai', tone: 'positive-muted' },
  CANCELLED: { label: 'Dibatalkan', tone: 'negative' },
  REJECTED: { label: 'Ditolak', tone: 'negative' },
  REGISTERED: { label: 'Terdaftar', tone: 'neutral' },
  CHECKED_IN: { label: 'Sudah check-in', tone: 'positive' },
  VERIFIED: { label: 'Terverifikasi', tone: 'positive' },
  NO_SHOW: { label: 'Tidak hadir', tone: 'negative' },
  REVOKED: { label: 'Dicabut', tone: 'negative' },
  PROPOSED: { label: 'Diajukan', tone: 'neutral' },
  APPROVED: { label: 'Disetujui', tone: 'positive' },
  PAID: { label: 'Sudah dibayar (dicatat)', tone: 'positive-muted' },
  PLANNED: { label: 'Direncanakan', tone: 'neutral' },
  PREPARED: { label: 'Disiapkan', tone: 'neutral' },
  DISPATCHED: { label: 'Dikirim', tone: 'neutral' },
  DELIVERED: { label: 'Diterima', tone: 'positive' },
  PARTIALLY_DELIVERED: { label: 'Diterima sebagian', tone: 'warning' },
  NEEDS_REVIEW: { label: 'Perlu ditinjau', tone: 'warning' },
  CONFIRMED: { label: 'Terkonfirmasi', tone: 'positive' },
  FAILED: { label: 'Gagal', tone: 'negative' },
  RETRY_REQUIRED: { label: 'Perlu diulang', tone: 'warning' },
  SUBMITTED: { label: 'Diajukan', tone: 'neutral' },
  ACCEPTED: { label: 'Diterima organizer', tone: 'positive' },
  RECEIVED: { label: 'Barang diterima', tone: 'positive' },
  UNVERIFIED: { label: 'Belum terverifikasi', tone: 'neutral' },
  ORGANIZATION_NOT_VERIFIED: { label: 'Organisasi belum terverifikasi', tone: 'warning' },
  INTENT: { label: 'Belum dikirim', tone: 'neutral' },
  NOT_ANCHORED: { label: 'Belum dicatat ke blockchain', tone: 'neutral' },
  REDACTED: { label: 'Disamarkan', tone: 'warning' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'warning' },
  DELETED: { label: 'Dihapus', tone: 'neutral' },
  OPEN: { label: 'Terbuka', tone: 'positive' },
  REVIEWING: { label: 'Sedang ditinjau', tone: 'warning' },
  RESOLVED: { label: 'Selesai', tone: 'positive-muted' },
  DISMISSED: { label: 'Diabaikan', tone: 'neutral' }
}

const PENDING: Record<StatusContext, StatusMeta> = {
  default: { label: 'Menunggu konfirmasi', tone: 'neutral' },
  chain: { label: 'Menunggu konfirmasi', tone: 'neutral' },
  contribution: { label: 'Diajukan', tone: 'neutral' },
  organization: { label: 'Menunggu tinjauan', tone: 'warning' },
  privacy: { label: 'Menunggu tinjauan', tone: 'warning' },
  anchor: { label: 'Menunggu dicatat', tone: 'neutral' }
}

const UNKNOWN: StatusMeta = { label: 'Status tidak dikenal', tone: 'neutral' }

export function statusMeta(status: string, context: StatusContext = 'default'): StatusMeta {
  if (status === 'PENDING') return PENDING[context]
  return BASE[status as StatusValue] ?? UNKNOWN
}

export function statusLabel(status: string, context: StatusContext = 'default'): string {
  return statusMeta(status, context).label
}
