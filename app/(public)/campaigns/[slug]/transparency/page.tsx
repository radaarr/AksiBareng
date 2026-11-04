import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCampaignBySlug,
  getExpenseCategories,
  getPublicCampaigns
} from '@/lib/fixtures/campaigns'
import {
  CampaignStatusBadge,
  ExpenseStatusBadge,
  SourceBadge
} from '../../../_components/badges'
import { FundsSummary } from '../../../_components/FundsSummary'
import { formatDateId, formatEthTestnet, shortenHash } from '../../../_components/format'

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getPublicCampaigns().map((campaign) => ({ slug: campaign.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) return { title: 'Laporan tidak ditemukan — AksiBareng' }

  return {
    title: `Transparansi ${campaign.title} — AksiBareng`,
    description: `Rekap dana, pengeluaran, distribusi, dan aktivitas kampanye ${campaign.title}. Setiap angka disertai sumbernya.`
  }
}

export default async function CampaignTransparencyPage({ params }: PageProps) {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) notFound()

  const expenseCategories = getExpenseCategories(campaign)
  const remainingWei = (BigInt(campaign.raisedWei) - BigInt(campaign.usedWei)).toString()

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Remah roti" className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/campaigns"
          className="inline-flex min-h-11 items-center rounded-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          ← Katalog kampanye
        </Link>
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="inline-flex min-h-11 items-center rounded-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          Detail kampanye
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <span className="text-sm text-zinc-700">{campaign.organization.name}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Transparansi {campaign.title}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Rekap dana, pengeluaran, distribusi, dan aktivitas penting. Setiap angka dan aktivitas
          mencantumkan sumbernya: blockchain, catatan organizer, atau pernyataan organizer.
        </p>
      </header>

      <FundsSummary campaign={campaign} />

      <section aria-labelledby="pengeluaran" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="pengeluaran" className="text-xl font-semibold text-zinc-900">
            Pengeluaran per kategori
          </h2>
          <p className="text-sm text-zinc-700">
            Total digunakan {formatEthTestnet(campaign.usedWei)} mencakup pengeluaran yang sudah
            disetujui dan yang sudah dibayar (dicatat).
          </p>
        </div>

        {expenseCategories.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-zinc-900">Belum ada pengeluaran</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Pengeluaran muncul di sini setelah diajukan dan disetujui organizer.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Pengeluaran per kategori untuk {campaign.title}
                </caption>
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th scope="col" className="px-4 py-3 font-semibold text-zinc-900">
                      Kategori
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-zinc-900">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenseCategories.map((item) => (
                    <tr key={item.category} className="border-b border-zinc-100 last:border-b-0">
                      <th scope="row" className="px-4 py-3 font-medium text-zinc-900">
                        {item.category}
                        <span className="block text-xs font-normal text-zinc-600">
                          {item.count} catatan pengeluaran
                        </span>
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-900">
                        {formatEthTestnet(item.amountWei)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
              Sumber angka pengeluaran: <SourceBadge source="DATABASE" />
            </p>

            <details className="rounded-xl border border-zinc-200 bg-white p-4">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold text-zinc-900">
                Rincian catatan pengeluaran ({campaign.expenses.length})
              </summary>
              <ul className="mt-3 flex flex-col gap-4">
                {campaign.expenses.map((expense) => (
                  <li
                    key={`${expense.category}-${expense.recordedAt}`}
                    className="flex flex-col gap-2 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-zinc-900">{expense.category}</h3>
                      <ExpenseStatusBadge status={expense.status} />
                    </div>
                    <p className="text-sm text-zinc-700">{expense.description}</p>
                    <p className="text-sm text-zinc-700">
                      {formatDateId(expense.recordedAt)} · {formatEthTestnet(expense.amountWei)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>

      <section aria-labelledby="distribusi" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="distribusi" className="text-xl font-semibold text-zinc-900">
            Status distribusi bantuan
          </h2>
          <p className="text-sm text-zinc-700">
            Angka ini berasal dari catatan organizer. Batch dihitung terverifikasi hanya setelah
            koordinator memeriksa bukti.
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Batch distribusi</dt>
            <dd className="text-xl font-semibold text-zinc-900">{campaign.distributions.batches}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-sm text-zinc-700">Batch terverifikasi</dt>
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

        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
          <SourceBadge source="DATABASE" />
          <span>
            Data penerima bantuan tidak ditampilkan. Hanya jumlah agregat yang tersedia untuk publik.
          </span>
        </div>
      </section>

      <section aria-labelledby="aktivitas" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="aktivitas" className="text-xl font-semibold text-zinc-900">
            Riwayat aktivitas penting
          </h2>
          <p className="text-sm text-zinc-700">
            Diurutkan dari yang terbaru. Aktivitas blockchain menyertakan tautan ke explorer Sepolia.
          </p>
        </div>

        {campaign.activity.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-zinc-900">Belum ada aktivitas</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Aktivitas tercatat setelah ada donasi terkonfirmasi atau pengeluaran yang dicatat.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {campaign.activity.map((entry) => (
              <li
                key={`${entry.at}-${entry.title}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-zinc-700">{formatDateId(entry.at)}</p>
                  <SourceBadge source={entry.source} />
                </div>
                <h3 className="font-semibold text-zinc-900">{entry.title}</h3>
                <p className="text-sm text-zinc-700">{entry.detail}</p>
                {entry.txHash && entry.explorerUrl ? (
                  <a
                    href={entry.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-fit items-center gap-1 rounded-sm text-sm font-medium text-teal-900 underline underline-offset-4 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    Lihat transaksi {shortenHash(entry.txHash)}
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only">(dibuka di tab baru)</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Tentang laporan ini</h2>
        <p className="text-sm text-zinc-700">
          Sisa dana dihitung dari dana terkumpul dikurangi dana digunakan, yaitu{' '}
          {formatEthTestnet(campaign.raisedWei)} − {formatEthTestnet(campaign.usedWei)} ={' '}
          {formatEthTestnet(remainingWei)}.
        </p>
        <p className="text-sm text-zinc-700">
          <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Semua nominal di
          halaman ini adalah data demo. Transaction hash membuktikan catatan tidak berubah, bukan
          kebenaran isi laporan.
        </p>
        <div>
          <Link
            href="/verify"
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Periksa transaction hash
          </Link>
        </div>
      </section>
    </div>
  )
}
