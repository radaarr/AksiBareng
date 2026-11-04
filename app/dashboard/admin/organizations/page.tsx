import type { Metadata } from 'next'
import Link from 'next/link'
import type { VerificationStatus } from '@prisma/client'
import { formatDateId } from '@/app/(public)/_components/format'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { OrganizationReviewActions } from '../_components/OrganizationReviewActions'

export const metadata: Metadata = {
  title: 'Verifikasi organisasi — AksiBareng'
}

const statusTones: Record<
  VerificationStatus,
  { label: string; className: string; icon: string }
> = {
  VERIFIED: {
    label: 'Terverifikasi',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    icon: '✓'
  },
  PENDING: {
    label: 'Menunggu tinjauan',
    className: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: '!'
  },
  UNVERIFIED: {
    label: 'Belum terverifikasi',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-800',
    icon: '○'
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'border-red-300 bg-red-50 text-red-900',
    icon: '×'
  },
  SUSPENDED: {
    label: 'Ditangguhkan',
    className: 'border-red-300 bg-red-50 text-red-900',
    icon: '×'
  }
}

const statusOrder: Record<VerificationStatus, number> = {
  PENDING: 0,
  UNVERIFIED: 1,
  REJECTED: 2,
  VERIFIED: 3,
  SUSPENDED: 4
}

export default async function AdminOrganizationQueuePage() {
  const actor = await requireSession()

  if (actor.role !== 'ADMIN') {
    return (
      <AccessNotice
        title="Halaman ini untuk admin"
        description="Akun Anda tidak memiliki peran admin. Kembali ke dashboard untuk melanjutkan."
      />
    )
  }

  const organizations = await prisma.organization.findMany({
    take: 100,
    select: {
      id: true,
      name: true,
      publicArea: true,
      contactEmail: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { displayName: true, role: true } },
      verifications: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          reviewNote: true
        }
      }
    }
  })

  const sorted = [...organizations].sort((a, b) => {
    const order = statusOrder[a.verificationStatus] - statusOrder[b.verificationStatus]
    return order !== 0 ? order : b.updatedAt.getTime() - a.updatedAt.getTime()
  })
  const pending = sorted.filter(
    (organization) =>
      organization.verificationStatus === 'PENDING' &&
      organization.verifications[0]?.status === 'PENDING'
  )
  const others = sorted.filter((organization) => !pending.includes(organization))

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Admin platform
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Verifikasi organisasi
        </h1>
        <p className="max-w-2xl text-zinc-700">
          Tinjau pengajuan organisasi sebelum mereka dapat menerbitkan kampanye. Menyetujui
          menaikkan role owner menjadi organizer.
        </p>
      </header>

      <section aria-labelledby="antrean-organisasi" className="flex flex-col gap-4">
        <h2 id="antrean-organisasi" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Menunggu tinjauan ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-zinc-900">Antrean kosong</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Tidak ada pengajuan verifikasi organisasi saat ini.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {pending.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} canReview />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="semua-organisasi" className="flex flex-col gap-4">
        <h2 id="semua-organisasi" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Semua organisasi ({others.length})
        </h2>
        {others.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-700">Belum ada organisasi lain.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {others.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} canReview={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type OrganizationRow = {
  id: string
  name: string
  publicArea: string
  contactEmail: string
  verificationStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
  owner: { displayName: string; role: string }
  verifications: {
    id: string
    status: VerificationStatus
    submittedAt: Date
    reviewedAt: Date | null
    reviewNote: string | null
  }[]
}

function OrganizationCard({
  organization,
  canReview
}: {
  organization: OrganizationRow
  canReview: boolean
}) {
  const tone = statusTones[organization.verificationStatus]
  const latest = organization.verifications[0]

  return (
    <li>
      <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${tone.className}`}
          >
            <span aria-hidden="true">{tone.icon}</span>
            {tone.label}
          </span>
          <span className="text-sm text-zinc-700">Owner: {organization.owner.displayName}</span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-zinc-900">{organization.name}</h3>
          <p className="text-sm text-zinc-700">
            {organization.publicArea} · {organization.contactEmail}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Pengajuan terakhir</dt>
            <dd className="font-semibold text-zinc-900">
              {latest ? formatDateId(latest.submittedAt.toISOString()) : 'Belum ada'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Status pengajuan</dt>
            <dd className="font-semibold text-zinc-900">
              {latest ? statusTones[latest.status].label : '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-700">Ditinjau</dt>
            <dd className="font-semibold text-zinc-900">
              {latest?.reviewedAt ? formatDateId(latest.reviewedAt.toISOString()) : 'Belum ditinjau'}
            </dd>
          </div>
        </dl>

        {latest?.reviewNote ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <strong>Catatan admin:</strong> {latest.reviewNote}
          </p>
        ) : null}

        <p className="text-sm text-zinc-700">
          Dokumen verifikasi bersifat privat dan hanya dapat diakses admin melalui alur terkontrol.
        </p>

        {canReview ? <OrganizationReviewActions organizationId={organization.id} /> : null}
      </article>
    </li>
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
