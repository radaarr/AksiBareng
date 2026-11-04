import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCampaigns } from '@/lib/fixtures/campaigns'
import { isTransactionHash, sepoliaExplorerTxUrl, shortenHash } from '../_components/format'

export const metadata: Metadata = {
  title: 'Periksa catatan — AksiBareng',
  description:
    'Periksa transaction hash dari laporan transparansi kampanye dan buka catatannya di explorer Sepolia.'
}

type PageProps = { searchParams: Promise<{ tx?: string | string[] }> }

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return value?.trim() ?? ''
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { tx } = await searchParams
  const hash = firstValue(tx)
  const hasInput = hash.length > 0
  const isValid = hasInput && isTransactionHash(hash)
  const campaigns = getPublicCampaigns()

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">AksiPeduli</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Periksa catatan
        </h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Tempel transaction hash dari laporan transparansi untuk membuka catatannya di explorer
          Sepolia. Halaman ini tidak meminta dompet digital (wallet) dan tidak memerlukan login.
        </p>
      </header>

      <section aria-labelledby="form-verifikasi" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="form-verifikasi" className="text-xl font-semibold text-zinc-900">
            Transaction hash
          </h2>
          <p id="tx-help" className="text-sm text-zinc-700">
            Hash diawali <code className="font-mono">0x</code> dan berisi 64 karakter heksadesimal.
            Salin dari tautan &ldquo;Lihat transaksi&rdquo; di halaman transparansi kampanye.
          </p>
        </div>

        <form action="/verify" method="get" className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="tx" className="text-sm font-semibold text-zinc-900">
              Transaction hash
            </label>
            <input
              id="tx"
              name="tx"
              type="text"
              defaultValue={hash}
              autoComplete="off"
              spellCheck={false}
              placeholder="0x…"
              aria-invalid={hasInput && !isValid}
              aria-describedby={hasInput && !isValid ? 'tx-help tx-error' : 'tx-help'}
              className="min-h-11 w-full rounded-md border border-zinc-400 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 aria-[invalid=true]:border-red-700"
            />
          </div>

          {hasInput && !isValid ? (
            <p id="tx-error" role="alert" className="text-sm font-medium text-red-800">
              Format transaction hash tidak valid. Pastikan hash diawali 0x dan berisi 64 karakter
              heksadesimal.
            </p>
          ) : null}

          <div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Periksa hash
            </button>
          </div>
        </form>

        {isValid ? (
          <section
            aria-labelledby="hasil"
            aria-live="polite"
            className="flex flex-col gap-3 rounded-xl border border-teal-300 bg-teal-50 p-6"
          >
            <h2 id="hasil" className="text-lg font-semibold text-teal-950">
              Hash yang Anda masukkan
            </h2>
            <code className="break-all rounded-md bg-white p-3 font-mono text-sm text-zinc-900">
              {hash}
            </code>
            <p className="text-sm text-teal-950">
              Hash ini memiliki format yang benar. Status transaksi hanya dapat dipastikan dari
              catatan di blockchain, bukan dari halaman ini.
            </p>
            <a
              href={sepoliaExplorerTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md bg-teal-900 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Buka di Etherscan Sepolia {shortenHash(hash)}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(dibuka di tab baru)</span>
            </a>
          </section>
        ) : null}
      </section>

      <section aria-labelledby="cara-periksa" className="flex flex-col gap-4">
        <h2 id="cara-periksa" className="text-xl font-semibold text-zinc-900">
          Cara memeriksa catatan
        </h2>
        <ol className="flex flex-col gap-3 text-sm text-zinc-700">
          <li className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="font-semibold text-zinc-900">1. Buka laporan transparansi.</span> Setiap
            aktivitas menampilkan sumber angkanya dan transaction hash bila ada.
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="font-semibold text-zinc-900">2. Salin transaction hash.</span> Gunakan
            tombol atau tautan &ldquo;Lihat transaksi&rdquo; pada baris aktivitas.
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="font-semibold text-zinc-900">3. Cocokkan di explorer.</span> Explorer
            publik menunjukkan penerima, nominal, dan status transaksi tanpa perantara AksiBareng.
          </li>
        </ol>
      </section>

      <section aria-labelledby="laporan" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="laporan" className="text-xl font-semibold text-zinc-900">
            Laporan transparansi kampanye
          </h2>
          <p className="text-sm text-zinc-700">
            Mulai dari laporan kampanye untuk mendapatkan hash yang bisa diperiksa.
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {campaigns.map((campaign) => (
            <li key={campaign.slug}>
              <Link
                href={`/campaigns/${campaign.slug}/transparency`}
                className="inline-flex min-h-11 items-center rounded-sm text-zinc-900 underline underline-offset-4 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                Transparansi {campaign.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-950">Batasan yang perlu diketahui</h2>
        <p className="text-sm text-amber-950">
          Hash membuktikan file atau catatan tidak berubah, bukan bahwa bantuan benar-benar diterima.
          Penerima bantuan tetap diverifikasi manusia, dan datanya tidak ditampilkan ke publik.
        </p>
        <p className="text-sm text-amber-950">
          Halaman ini belum membaca status transaksi langsung dari jaringan. Status transaksi di
          AksiBareng baru menjadi &ldquo;Terkonfirmasi&rdquo; setelah receipt sukses dan jumlah
          konfirmasi terpenuhi.
        </p>
        <p className="text-sm text-amber-950">
          <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong>
        </p>
      </section>
    </div>
  )
}
