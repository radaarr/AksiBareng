import { PagePlaceholder } from '../../../../_components/page-placeholder'

export default function OrganizerEventTasksPage() {
  return (
    <PagePlaceholder
      title="Posisi tugas"
      description="Pembuatan posisi tugas dan penempatan relawan dibangun di S4 (SCH-01…SCH-04)."
      planned={[
        'Daftar posisi dengan kuota dan sisa kuota per posisi',
        'Penempatan relawan tanpa melebihi kuota posisi',
        'Daftar peserta yang belum mendapat penempatan'
      ]}
    />
  )
}
