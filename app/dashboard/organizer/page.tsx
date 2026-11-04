import { ButtonLink } from '@/components/ui/button'
import { PagePlaceholder } from '../_components/page-placeholder'

export default function OrganizerOverviewPage() {
  return (
    <PagePlaceholder
      title="Ringkasan"
      description="Kegiatan aktif, pendaftar, dan kontribusi yang menunggu validasi akan tampil di sini."
      planned={[
        'Kegiatan yang sedang berjalan beserta sisa kuota',
        'Pendaftar terbaru dan relawan yang belum ditempatkan',
        'Kontribusi yang sudah check-in dan menunggu validasi'
      ]}
      action={
        <>
          <ButtonLink href="/dashboard/organizer/events/new">Buat kegiatan</ButtonLink>
          <ButtonLink href="/dashboard/organizer/events" variant="secondary">
            Daftar kegiatan
          </ButtonLink>
        </>
      }
    />
  )
}
