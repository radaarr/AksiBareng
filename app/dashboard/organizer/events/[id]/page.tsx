import { PagePlaceholder } from '../../../_components/page-placeholder'

export default function OrganizerEventDetailPage() {
  return (
    <PagePlaceholder
      title="Detail kegiatan"
      description="Detail kegiatan, kuota, dan daftar peserta akan tampil di sini (S2–S3)."
      planned={[
        'Ringkasan kegiatan dan label statusnya',
        'Kuota terpakai, sisa kuota, dan periode pendaftaran',
        'Daftar peserta dengan nama tampilan saja, tanpa kontak pribadi'
      ]}
    />
  )
}
