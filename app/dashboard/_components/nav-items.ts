import type { UserRole } from '@prisma/client'

export type NavItem = {
  href: string
  label: string
  /** false: halaman belum dibangun. Ditampilkan sebagai "Segera", bukan tautan mati. */
  ready: boolean
}

export const ROLE_LABEL: Record<UserRole, string> = {
  VOLUNTEER: 'Relawan / Donatur',
  ORGANIZER: 'Organizer',
  ADMIN: 'Admin platform'
}

// Halaman milik C (kampanye, donasi, review admin) sengaja ditandai belum siap
// sampai rutenya ada, supaya tidak ada tautan yang berujung 404.
const VOLUNTEER_NAV: NavItem[] = [
  { href: '/dashboard/me', label: 'Ringkasan', ready: true },
  { href: '/dashboard/me/events', label: 'Kegiatan saya', ready: true },
  { href: '/dashboard/me/contributions', label: 'Kontribusi saya', ready: true },
  { href: '/dashboard/me/donations', label: 'Donasi saya', ready: false },
  { href: '/dashboard/me/goods', label: 'Donasi barang', ready: false },
  { href: '/dashboard/me/wallet', label: 'Dompet digital', ready: false },
  { href: '/dashboard/me/settings', label: 'Pengaturan', ready: false }
]

const ORGANIZER_NAV: NavItem[] = [
  { href: '/dashboard/organizer', label: 'Ringkasan', ready: true },
  { href: '/dashboard/organizer/events', label: 'Kegiatan', ready: true },
  { href: '/dashboard/organizer/campaigns', label: 'Kampanye', ready: false },
  { href: '/dashboard/organizer/organization', label: 'Organisasi', ready: false }
]

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', label: 'Ringkasan', ready: true },
  { href: '/dashboard/admin/organizations', label: 'Verifikasi organisasi', ready: false },
  { href: '/dashboard/admin/campaigns', label: 'Review kampanye', ready: false },
  { href: '/dashboard/admin/transactions', label: 'Transaksi', ready: false },
  { href: '/dashboard/admin/audit', label: 'Audit log', ready: false }
]

export function navItemsFor(role: UserRole): NavItem[] {
  if (role === 'ORGANIZER') return ORGANIZER_NAV
  if (role === 'ADMIN') return ADMIN_NAV
  return VOLUNTEER_NAV
}
