import { PagePlaceholder } from '../../_components/page-placeholder'

export default function VolunteerEventsPage() {
  return (
    <PagePlaceholder
      title="Kegiatan saya"
      description="Daftar kegiatan yang Anda ikuti akan tampil di sini setelah pendaftaran (S3) tersedia."
      planned={[
        'Kegiatan yang Anda daftar beserta status: Terdaftar, Sudah check-in, Terverifikasi',
        'Posisi tugas dan jadwal yang diberikan organizer',
        'Tombol membatalkan pendaftaran selama batas waktu masih berlaku'
      ]}
    />
  )
}
