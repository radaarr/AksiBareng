import { ButtonLink } from '@/components/ui/button'
import { PagePlaceholder } from '../_components/page-placeholder'

export default function VolunteerOverviewPage() {
  return (
    <PagePlaceholder
      title="Ringkasan"
      description="Setelah pendaftaran kegiatan tersedia, ringkasan kegiatan dan kontribusi Anda tampil di sini."
      planned={[
        'Kegiatan mendatang yang Anda ikuti beserta statusnya',
        'Kontribusi terverifikasi dan status pencatatannya di blockchain',
        'Donasi testnet Anda, dengan label simulasi'
      ]}
      action={
        <>
          <ButtonLink href="/dashboard/me/events" variant="secondary">
            Kegiatan saya
          </ButtonLink>
          <ButtonLink href="/dashboard/me/contributions" variant="secondary">
            Kontribusi saya
          </ButtonLink>
        </>
      }
    />
  )
}
