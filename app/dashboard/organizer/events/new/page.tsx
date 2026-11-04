import { PagePlaceholder } from '../../../_components/page-placeholder'

export default function NewEventPage() {
  return (
    <PagePlaceholder
      title="Buat kegiatan"
      description="Form kegiatan beserta aturan validasinya dibangun di S2 (EVT-01)."
      planned={[
        'Judul, deskripsi, kategori, lokasi umum, dan kota',
        'Tanggal mulai dan selesai, serta periode pendaftaran',
        'Kuota peserta dan batas waktu pembatalan pendaftaran'
      ]}
    />
  )
}
