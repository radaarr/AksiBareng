import type { Metadata } from 'next'
import Link from 'next/link'
import { CampaignStatusBadge } from '@/app/(public)/_components/badges'
import { formatDateId, formatEthTestnet } from '@/app/(public)/_components/format'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import type { CampaignStatus } from '@/lib/fixtures/campaigns'
import type { VerificationStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Kampanye saya — AksiBareng'
}

const verificationTones: Record<
  VerificationStatus,
  { label: string; className: string; icon: string }
> = {
  VERIFIED: {
    label: 'Organisasi terverifikasi',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    icon: '✓'
  },
  PENDING: {
    label: 'Verifikasi menunggu tinjauan',
    className: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: '!'
  },
  UNVERIFIED: {
    label: 'Organisasi belum terverifikasi',
    className: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: '!'
  },
  REJECTED: {
    label: 'Verifikasi ditolak',
    className: 'border-red-300 bg-red-50 text-red-900',
    icon: '×'
  },
  SUSPENDED: {
    label: 'Organisasi ditangguhkan',
    className: 'border-red-300 bg-red-50 text-red-900',
    icon: '×'
  }
}

const publicStatuses: CampaignStatus[] = ['ACTIVE', 'CLOSED', 'COMPLETED']

export default async function OrganizerCampaignListPage() {
  const actor = await requireSession()

  if (actor.role !== 'ORGANIZER') {
    return (
      <AccessNotice
        title="Halaman ini untuk organizer"
        description="Akun Anda tidak memiliki peran organizer. Kembali ke dashboard untuk melanjutkan."
      />
    )
  }

  if (!actor.organizationId) {
    return (
      <AccessNotice
        title="Akun belum memiliki organisasi"
        description="Kampanye harus dimiliki organisasi. Hubungi admin platform untuk melengkapi profil organisasi."
      />
    )
  }

  const [organization, campaigns] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: { name: true, publicArea: true, verificationStatus: true }
    }),
    prisma.campaign.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        targetAmountWei: true,
        updatedAt: true,
        reviewNote: true,
        budgets: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true }
        }
      }
    })
  ])

  if (!organization) {
    return (
      <AccessNotice
        title="Organisasi tidak ditemukan"
        description="Profil organisasi tidak tersedia. Hubungi admin platform sebelum membuat kampanye."
      />
    )
  }

  const verification = verificationTones[organization.verificationStatus]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
            {organization.name}
            {organization.publicArea ? ` · ${organization.publicArea}` : ''}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Kampanye saya
          </h1>
          <p className="max-w-2xl text-zinc-700">
            Kelola draf, pantau tinjauan admin, dan lihat versi anggaran yang sudah tersimpan. Kampanye
            baru tampil publik setelah disetujui admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${verification.className}`}
          >
            <span aria-hidden="true">{verification.icon}</span>
            {verification.label}
          </span>
          <Link
            href="/dashboard/organizer/campaigns/new"
            className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Buat kampanye
          </Link>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Belum ada kampanye</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Mulai dengan menyiapkan kebutuhan, target, dan rencana penggunaan dana.
          </p>
          <Link
            href="/dashboard/organizer/campaigns/new"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Buat kampanye pertama
          </Link>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((campaign) => {
            const isPublic = publicStatuses.includes(campaign.status)

            return (
              <li
                key={campaign.id}
                className="flex h-full flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CampaignStatusBadge status={campaign.status} />
                  <span className="text-sm text-zinc-700">
                    Diperbarui {formatDateId(campaign.updatedAt.toISOString())}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-zinc-900">
                  {isPublic ? (
                    <Link
                      href={`/campaigns/${campaign.slug}`}
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                    >
                      {campaign.title}
                    </Link>
                  ) : (
                    campaign.title
                  )}
                </h2>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-zinc-700">Target</dt>
                    <dd className="font-semibold text-zinc-900">
                      {formatEthTestnet(campaign.targetAmountWei.toString())}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-zinc-700">Anggaran</dt>
                    <dd className="font-semibold text-zinc-900">
                      {campaign.budgets[0]
                        ? `Versi ${campaign.budgets[0].version}`
                        : 'Belum ada anggaran'}
                    </dd>
                  </div>
                </dl>

                {campaign.reviewNote ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <strong>Catatan admin:</strong> {campaign.reviewNote}
                  </p>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-2">
                  {isPublic ? (
                    <Link
                      href={`/campaigns/${campaign.slug}`}
                      className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                    >
                      Lihat halaman publik
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-md border border-zinc-200 px-4 text-sm text-zinc-600">
                      Belum tampil publik
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
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
