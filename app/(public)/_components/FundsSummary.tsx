import type { CampaignFixture } from '@/lib/fixtures/campaigns'
import { SourceBadge } from './badges'
import { formatEthTestnet } from './format'

/**
 * Tiga angka dana wajib terpisah dan berlabel sumber (PRD §7.5, TRN-01/02):
 * terkumpul dari blockchain, digunakan dari catatan organizer, sisa = selisih.
 */
export function FundsSummary({ campaign }: { campaign: CampaignFixture }) {
  const remainingWei = (BigInt(campaign.raisedWei) - BigInt(campaign.usedWei)).toString()

  return (
    <section aria-labelledby="ringkasan-dana" className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 id="ringkasan-dana" className="text-xl font-semibold text-zinc-900">
          Ringkasan dana
        </h2>
        <p className="text-sm text-zinc-700">
          Setiap angka punya sumber berbeda. Angka blockchain dan catatan organizer bisa berbeda dan
          ditampilkan apa adanya.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-4">
          <dt className="text-sm text-zinc-700">Terkumpul</dt>
          <dd className="text-xl font-semibold text-zinc-900">{formatEthTestnet(campaign.raisedWei)}</dd>
          <div>
            <SourceBadge source="BLOCKCHAIN" />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-4">
          <dt className="text-sm text-zinc-700">Digunakan</dt>
          <dd className="text-xl font-semibold text-zinc-900">{formatEthTestnet(campaign.usedWei)}</dd>
          <div>
            <SourceBadge source="DATABASE" />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-4">
          <dt className="text-sm text-zinc-700">Sisa</dt>
          <dd className="text-xl font-semibold text-zinc-900">{formatEthTestnet(remainingWei)}</dd>
          <div>
            <SourceBadge source="DATABASE" />
          </div>
        </div>
      </dl>

      <p className="text-sm text-zinc-700">
        <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Target{' '}
        {formatEthTestnet(campaign.targetWei)}. Angka diperbarui dari data demo.
      </p>
    </section>
  )
}
