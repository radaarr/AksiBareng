import { PagePlaceholder } from '../../../../_components/page-placeholder'

export default function OrganizerEventAttendancePage() {
  return (
    <PagePlaceholder
      title="Check-in dan QR"
      description="Sesi check-in, tampilan QR, dan pemindai kode dibangun di S5 (ATT-01…ATT-05)."
      planned={[
        'Membuka dan menutup sesi check-in kegiatan',
        'Pemindai QR dengan umpan balik jelas dan input kode manual sebagai cadangan',
        'Daftar kehadiran beserta waktu check-in'
      ]}
    />
  )
}
