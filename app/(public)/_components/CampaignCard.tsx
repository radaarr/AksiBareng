import Link from 'next/link'
import type { CampaignFixture } from '@/lib/fixtures/campaigns'
import { CampaignStatusBadge } from './badges'
import { formatEthTestnet, sharePercent } from './format'

export function CampaignCard({ campaign }: { campaign: CampaignFixture }) {
  const percent = sharePercent(campaign.raisedWei, campaign.targetWei)

  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CampaignStatusBadge status={campaign.status} />
        <span className="text-sm text-zinc-700">{campaign.category}</span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">
          <Link
            href={`/campaigns/${campaign.slug}`}
            className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            {campaign.title}
          </Link>
        </h2>
        <p className="text-sm text-zinc-700">{campaign.summary}</p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-zinc-900">{formatEthTestnet(campaign.raisedWei)}</span>
          <span className="text-zinc-700">dari target {formatEthTestnet(campaign.targetWei)}</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Dana terkumpul ${campaign.title}`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${percent}% dari target`}
          className="h-2 w-full overflow-hidden rounded-full bg-zinc-200"
        >
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-zinc-600">
          {campaign.organization.name} · {campaign.generalLocation}
        </p>
      </div>
    </article>
  )
}
