import { PagePlaceholder } from '../../_components/page-placeholder'

export default function VolunteerContributionsPage() {
  return (
    <PagePlaceholder
      title="Kontribusi saya"
      description="Riwayat kontribusi dan status pencatatannya di blockchain akan tampil di sini."
      planned={[
        'Status kontribusi: Diajukan, Terverifikasi, atau Dicabut',
        'Status on-chain terpisah dari status validasi: Menunggu konfirmasi, Terkonfirmasi, atau Perlu diulang',
        'Tautan transaksi ke blockchain explorer bila sudah terbit'
      ]}
    />
  )
}
