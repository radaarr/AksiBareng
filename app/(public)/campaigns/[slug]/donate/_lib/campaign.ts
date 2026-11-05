import { prisma } from '@/lib/db'
import type { CampaignStatus } from '@prisma/client'

type PublicCampaignSummary = {
  id: string
  slug: string
  title: string
  status: CampaignStatus
  targetAmountWei: string
  fundingAsset: string
  onChainCampaignId: number | null
}

/** Kampanye yang boleh tampil di halaman donasi publik. */
const PUBLIC_STATUSES: CampaignStatus[] = ['ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED']

export async function resolvePublicCampaign(slug: string): Promise<PublicCampaignSummary | null> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      slug,
      status: { in: PUBLIC_STATUSES }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      targetAmountWei: true,
      fundingAsset: true,
      onChainCampaignId: true
    }
  })

  if (!campaign) return null

  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    status: campaign.status,
    targetAmountWei: String(campaign.targetAmountWei),
    fundingAsset: campaign.fundingAsset,
    onChainCampaignId: campaign.onChainCampaignId
  }
}

/** Hanya kampanye ACTIVE yang menerima donasi baru (docs/PRD.md EVT/DON). */
export function canDonate(status: CampaignStatus): boolean {
  return status === 'ACTIVE'
}
