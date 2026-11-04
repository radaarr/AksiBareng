import { PagePlaceholder } from '../_components/page-placeholder'

export default function AdminOverviewPage() {
  return (
    <PagePlaceholder
      title="Ringkasan admin"
      description="Antrean review dan pengawasan platform diisi oleh modul AksiPeduli dan admin. Halaman ini masih kerangka."
      planned={[
        'Antrean verifikasi organisasi (AUTH-06)',
        'Antrean review kampanye sebelum tayang (CAM-04)',
        'Transaksi blockchain yang perlu diulang beserta audit log'
      ]}
    />
  )
}
