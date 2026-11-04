import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCampaignBySlug, getLatestBudget, getPublicCampaigns } from '@/lib/fixtures/campaigns'
import { CampaignStatusBadge, SourceBadge } from '../../_components/badges'
import { FundsSummary } from '../../_components/FundsSummary'
import { formatDateId, formatEthTestnet } from '../../_components/format'

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getPublicCampaigns().map((campaign) => ({ slug: campaign.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) return { title: 'Kampanye tidak ditemukan — AksiBareng' }

  return {
    title: `${campaign.title} — AksiBareng`,
    description: campaign.summary
  }
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) notFound()

  const latestBudget = getLatestBudget(campaign)
  const previousBudgets = campaign.budgets.filter((budget) => budget.supersededAt !== null)
  const plannedWei = latestBudget
    ? latestBudget.items
        .reduce((total, item) => total + BigInt(item.plannedWei), BigInt(0))
        .toString()
    : '0'

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Remah roti" className="text-sm">
        <Link
          href="/campaigns"
          className="inline-flex min-h-11 items-center rounded-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          ← Katalog kampanye
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <span className="text-sm text-zinc-700">{campaign.category}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{campaign.title}</h1>
        <p className="max-w-2xl text-lg text-zinc-700">{campaign.summary}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Penyelenggara</dt>
            <dd className="font-semibold text-zinc-900">{campaign.organization.name}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Lokasi umum</dt>
            <dd className="font-semibold text-zinc-900">{campaign.generalLocation}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Periode</dt>
            <dd className="font-semibold text-zinc-900">
              {formatDateId(campaign.periodStartsAt)} – {formatDateId(campaign.periodEndsAt)}
            </dd>
          </div>
        </dl>
      </header>

      <FundsSummary campaign={campaign} />

      <div>
        <Link
          href={`/campaigns/${campaign.slug}/transparency`}
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Lihat laporan transparansi lengkap →
        </Link>
      </div>

      <section aria-labelledby="cerita" className="flex flex-col gap-4">
        <h2 id="cerita" className="text-xl font-semibold text-zinc-900">
          Kebutuhan dan cerita
        </h2>
        <div className="flex flex-col gap-3 text-zinc-700">
          {campaign.story.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </section>

      {latestBudget ? (
        <section aria-labelledby="anggaran" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="anggaran" className="text-xl font-semibold text-zinc-900">
              Rencana penggunaan dana
            </h2>
            <p className="text-sm text-zinc-700">
              Versi {latestBudget.version}, dibuat {formatDateId(latestBudget.createdAt)}. Total rencana{' '}
              {formatEthTestnet(plannedWei)}. Revisi tidak menimpa versi sebelumnya.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Rencana penggunaan dana {campaign.title} versi {latestBudget.version}
              </caption>
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th scope="col" className="px-4 py-3 font-semibold text-zinc-900">Kategori</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-zinc-900">Keterangan</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-zinc-900">Rencana</th>
                </tr>
              </thead>
              <tbody>
                {latestBudget.items.map((item) => (
                  <tr key={item.category} className="border-b border-zinc-100 last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-medium text-zinc-900">{item.category}</th>
                    <td className="px-4 py-3 text-zinc-700">{item.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-900">
                      {formatEthTestnet(item.plannedWei)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
            Rencana ini adalah catatan organizer. <SourceBadge source="ORGANIZER_STATEMENT" />
          </p>

          {previousBudgets.length > 0 ? (
            <details className="rounded-xl border border-zinc-200 bg-white p-4">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold text-zinc-900">
                Riwayat versi anggaran ({previousBudgets.length})
              </summary>
              <ul className="mt-3 flex flex-col gap-4">
                {previousBudgets.map((budget) => (
                  <li key={budget.version} className="flex flex-col gap-1 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">
                      Versi {budget.version} · diganti {formatDateId(budget.supersededAt ?? budget.createdAt)}
                    </p>
                    <ul className="list-inside list-disc">
                      {budget.items.map((item) => (
                        <li key={item.category}>
                          {item.category}: {formatEthTestnet(item.plannedWei)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="distribusi" className="flex flex-col gap-4">
        <h2 id="distribusi" className="text-xl font-semibold text-zinc-900">
          Distribusi bantuan
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Batch distribusi</dt>
            <dd className="text-xl font-semibold text-zinc-900">{campaign.distributions.batches}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Sudah terverifikasi</dt>
            <dd className="text-xl font-semibold text-zinc-900">{campaign.distributions.verified}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Disiapkan</dt>
            <dd className="text-xl font-semibold text-zinc-900">
              {campaign.distributions.itemsPrepared} {campaign.distributions.unitLabel}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Diterima</dt>
            <dd className="text-xl font-semibold text-zinc-900">
              {campaign.distributions.itemsDelivered} {campaign.distributions.unitLabel}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-zinc-700">
          Data penerima bantuan ditampilkan sebagai ringkasan untuk melindungi privasi.
        </p>
      </section>

      {campaign.updates.length > 0 ? (
        <section aria-labelledby="perkembangan" className="flex flex-col gap-4">
          <h2 id="perkembangan" className="text-xl font-semibold text-zinc-900">
            Perkembangan kampanye
          </h2>
          <ol className="flex flex-col gap-4">
            {campaign.updates.map((update) => (
              <li key={update.at} className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-700">{formatDateId(update.at)}</p>
                <h3 className="mt-1 font-semibold text-zinc-900">{update.title}</h3>
                <p className="mt-2 text-sm text-zinc-700">{update.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Donasi testnet belum dibuka</h2>
        <p className="text-sm text-zinc-700">
          Alur donasi dengan dompet digital (wallet) masih dikerjakan. Kami tidak menampilkan tombol
          donasi sebelum transaksi testnet benar-benar bisa dicatat.
        </p>
        <p className="text-sm text-zinc-700">
          <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Tidak ada donasi nyata
          yang diterima lewat halaman ini.
        </p>
      </section>
    </div>
  )
}
