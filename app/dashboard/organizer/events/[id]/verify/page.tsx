import { PagePlaceholder } from '../../../../_components/page-placeholder'

export default function OrganizerEventVerifyPage() {
  return (
    <PagePlaceholder
      title="Validasi kontribusi"
      description="Validasi kontribusi relawan dan status pencatatannya di blockchain dibangun di S6 (ATT-06…ATT-08)."
      planned={[
        'Daftar relawan berstatus Sudah check-in yang menunggu validasi',
        'Aksi memvalidasi kontribusi beserta catatan audit',
        'Status on-chain terpisah: Menunggu konfirmasi, Terkonfirmasi, atau Perlu diulang'
      ]}
    />
  )
}
