import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCampaigns } from '@/lib/fixtures/campaigns'
import { CampaignCard } from '../_components/CampaignCard'

export const metadata: Metadata = {
  title: 'Katalog kampanye — AksiBareng',
  description:
    'Kampanye donasi aktif, ditutup, dan selesai. Setiap kampanye menampilkan dana terkumpul, dana digunakan, dan sisa dana beserta sumber angkanya.'
}

export default function CampaignCatalogPage() {
  const campaigns = getPublicCampaigns()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">AksiPeduli</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Katalog kampanye
        </h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Pilih kampanye untuk melihat kebutuhan, rencana penggunaan dana, dan catatan pengeluarannya.
        </p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Data di halaman ini
          adalah data demo, bukan kampanye nyata.
        </p>
      </header>

      {campaigns.length === 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Belum ada kampanye</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Kampanye tampil di sini setelah lolos tinjauan admin. Coba periksa lagi nanti.
          </p>
          <Link
            href="/how-it-works"
            className="mt-4 inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Lihat cara kerja
          </Link>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((campaign) => (
            <li key={campaign.slug}>
              <CampaignCard campaign={campaign} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
