import { ButtonLink } from '@/components/ui/button'
import { PagePlaceholder } from '../../_components/page-placeholder'

export default function OrganizerEventsPage() {
  return (
    <PagePlaceholder
      title="Kegiatan"
      description="Daftar kegiatan organisasi Anda beserta status dan kuotanya akan tampil di sini (S2)."
      planned={[
        'Daftar kegiatan dengan label status: Draf, Aktif, Sedang berlangsung, Ditutup, Dibatalkan',
        'Kuota terpakai dan sisa untuk setiap kegiatan',
        'Aksi publikasikan, tutup pendaftaran, dan batalkan dengan alasan'
      ]}
      action={<ButtonLink href="/dashboard/organizer/events/new">Buat kegiatan</ButtonLink>}
    />
  )
}
