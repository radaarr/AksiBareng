import type { Metadata } from 'next'
import Link from 'next/link'
import { CampaignStatusBadge } from '@/app/(public)/_components/badges'
import { formatDateId, formatEthTestnet } from '@/app/(public)/_components/format'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { CampaignReviewActions } from '../_components/CampaignReviewActions'
import type { CampaignStatus } from '@/lib/fixtures/campaigns'

export const metadata: Metadata = {
  title: 'Tinjau kampanye — AksiBareng'
}

const statusOrder: Record<CampaignStatus, number> = {
  PENDING_REVIEW: 0,
  ACTIVE: 1,
  PAUSED: 2,
  REJECTED: 3,
  DRAFT: 4,
  CLOSED: 5,
  COMPLETED: 6,
  CANCELLED: 7
}

const auditLabels: Record<string, string> = {
  'campaign.submitted': 'Diajukan ke admin',
  'campaign.reviewed': 'Keputusan tinjauan',
  'campaign.paused': 'Kampanye dijeda',
  'campaign.updated': 'Detail diperbarui',
  'campaign.budget.versioned': 'Anggaran direvisi'
}

export default async function AdminCampaignQueuePage() {
  const actor = await requireSession()

  if (actor.role !== 'ADMIN') {
    return (
      <AccessNotice
        title="Halaman ini untuk admin"
        description="Akun Anda tidak memiliki peran admin. Kembali ke dashboard untuk melanjutkan."
      />
    )
  }

  const campaigns = await prisma.campaign.findMany({
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      targetAmountWei: true,
      generalLocation: true,
      periodStartsAt: true,
      periodEndsAt: true,
      createdAt: true,
      updatedAt: true,
      reviewNote: true,
      reviewedAt: true,
      organization: { select: { name: true } },
      category: { select: { name: true } },
      budgets: {
        where: { supersededAt: null },
        select: { version: true, plannedAmountWei: true }
      }
    }
  })

  const audits = await prisma.auditLog.findMany({
    where: {
      entityType: 'campaign',
      entityId: { in: campaigns.map((campaign) => campaign.id) },
      action: {
        in: [
          'campaign.submitted',
          'campaign.reviewed',
          'campaign.paused',
          'campaign.updated',
          'campaign.budget.versioned'
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      entityId: true,
      action: true,
      before: true,
      after: true,
      createdAt: true,
      actorRole: true
    }
  })

  const auditsByCampaign = new Map<string, typeof audits>()
  for (const audit of audits) {
    const current = auditsByCampaign.get(audit.entityId) ?? []
    current.push(audit)
    auditsByCampaign.set(audit.entityId, current)
  }

  const sorted = [...campaigns].sort((a, b) => {
    const order = statusOrder[a.status] - statusOrder[b.status]
    return order !== 0 ? order : b.updatedAt.getTime() - a.updatedAt.getTime()
  })
  const pending = sorted.filter((campaign) => campaign.status === 'PENDING_REVIEW')
  const others = sorted.filter((campaign) => campaign.status !== 'PENDING_REVIEW')

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Admin platform
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Tinjau kampanye
        </h1>
        <p className="max-w-2xl text-zinc-700">
          Setujui kampanye agar tampil publik, tolak dengan alasan yang jelas, atau jeda kampanye
          aktif. Semua keputusan tercatat di audit log.
        </p>
      </header>

      <section aria-labelledby="antrean" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="antrean" className="text-2xl font-semibold tracking-tight text-zinc-900">
            Menunggu tinjauan ({pending.length})
          </h2>
          <Link
            href="/campaigns"
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Lihat katalog publik
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-zinc-900">Antrean kosong</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Tidak ada kampanye yang menunggu tinjauan saat ini.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {pending.map((campaign) => (
              <CampaignReviewCard
                key={campaign.id}
                campaign={campaign}
                audits={auditsByCampaign.get(campaign.id) ?? []}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="semua" className="flex flex-col gap-4">
        <h2 id="semua" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Semua kampanye ({others.length})
        </h2>
        {others.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-700">Belum ada kampanye lain.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {others.map((campaign) => (
              <CampaignReviewCard
                key={campaign.id}
                campaign={campaign}
                audits={auditsByCampaign.get(campaign.id) ?? []}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CampaignReviewCard({
  campaign,
  audits
}: {
  campaign: {
    id: string
    title: string
    slug: string
    status: CampaignStatus
    targetAmountWei: { toString(): string }
    generalLocation: string | null
    periodStartsAt: Date
    periodEndsAt: Date
    updatedAt: Date
    reviewNote: string | null
    reviewedAt: Date | null
    organization: { name: string }
    category: { name: string }
    budgets: { version: number; plannedAmountWei: { toString(): string } }[]
  }
  audits: {
    action: string
    before: unknown
    after: unknown
    createdAt: Date
    actorRole: string
  }[]
}) {
  const latestVersion = campaign.budgets.reduce(
    (max, budget) => Math.max(max, budget.version),
    0
  )
  const plannedWei = campaign.budgets
    .reduce((total, budget) => total + BigInt(budget.plannedAmountWei.toString()), BigInt(0))
    .toString()

  return (
    <li>
      <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <span className="text-sm text-zinc-700">
            {campaign.organization.name} · {campaign.category.name}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-zinc-900">{campaign.title}</h3>
          <p className="text-sm text-zinc-700">
            {campaign.generalLocation ?? 'Lokasi umum belum diisi'} ·{' '}
            {formatDateId(campaign.periodStartsAt.toISOString())} –{' '}
            {formatDateId(campaign.periodEndsAt.toISOString())}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Target</dt>
            <dd className="font-semibold text-zinc-900">
              {formatEthTestnet(campaign.targetAmountWei.toString())}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Rencana anggaran</dt>
            <dd className="font-semibold text-zinc-900">
              {latestVersion > 0
                ? `Versi ${latestVersion} · ${formatEthTestnet(plannedWei)}`
                : 'Belum ada anggaran'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Update terakhir</dt>
            <dd className="font-semibold text-zinc-900">
              {formatDateTime(campaign.updatedAt)}
            </dd>
          </div>
        </dl>

        {campaign.reviewNote ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <strong>Catatan admin terakhir:</strong> {campaign.reviewNote}
          </p>
        ) : null}

        {campaign.status === 'PENDING_REVIEW' ||
        campaign.status === 'ACTIVE' ||
        campaign.status === 'PAUSED' ? (
          <CampaignReviewActions campaignId={campaign.id} status={campaign.status} />
        ) : null}

        {audits.length > 0 ? (
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <summary className="min-h-11 cursor-pointer text-sm font-semibold text-zinc-900">
              Riwayat status ({audits.length})
            </summary>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-zinc-700">
              {audits.map((audit) => {
                const beforeStatus = statusFromJson(audit.before)
                const afterStatus = statusFromJson(audit.after)
                return (
                  <li key={`${audit.action}-${audit.createdAt.toISOString()}`}>
                    <span className="font-medium text-zinc-900">
                      {auditLabels[audit.action] ?? audit.action}
                    </span>
                    {beforeStatus || afterStatus ? (
                      <span>
                        {' '}
                        {beforeStatus ?? '—'} → {afterStatus ?? '—'}
                      </span>
                    ) : null}
                    <span className="block text-xs text-zinc-600">
                      {formatDateTime(audit.createdAt)} · {audit.actorRole}
                    </span>
                  </li>
                )
              })}
            </ol>
          </details>
        ) : null}
      </article>
    </li>
  )
}

function statusFromJson(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('status' in value)) return null
  const status = (value as { status?: unknown }).status
  return typeof status === 'string' ? status : null
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(date)
}

function AccessNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-amber-950">{title}</h1>
      <p className="max-w-xl text-sm text-amber-950">{description}</p>
      <div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  )
}
