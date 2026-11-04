import Link from 'next/link'
import { getActor } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ForbiddenNotice } from '../../../../../dashboard/_components/forbidden-notice'
import { PagePlaceholder } from '../../../../../dashboard/_components/page-placeholder'
import { ButtonLink } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable } from '@/components/ui/table'
import { Alert } from '@/components/ui/alert'

export const dynamic = 'force-dynamic'

function distributionCaption() {
  return 'Daftar batch distribusi kampanye. Status verifikasi hanya ditentukan oleh petugas yang berwenang.'
}

type DistributionRow = {
  id: string
  title: string
  aidType: string
  status: string
  verifiedAt: string | null
  anchorPending: boolean
  evidenceCount: number
  evidencePendingPrivacy: number
  generalLocation: string | null
  plannedDate: string | null
}

function plannedDateLine(row: DistributionRow) {
  if (!row.plannedDate) return null
  return (
    <time className="text-xs text-zinc-700" dateTime={row.plannedDate}>
      {new Date(row.plannedDate).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </time>
  )
}

function anchorChip(row: DistributionRow) {
  if (!row.anchorPending) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
      <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 9v4.5" />
        <path d="M10 6.4v.1" />
      </svg>
      Menunggu konfirmasi
    </span>
  )
}

function privacyChip(row: DistributionRow) {
  if (row.evidencePendingPrivacy === 0) return null
  return (
    <span className="text-xs text-amber-800">
      {row.evidencePendingPrivacy > 0
        ? `${row.evidencePendingPrivacy} berkas menunggu tinjauan privasi`
        : null}
    </span>
  )
}

function distributionColumns() {
  return [
    {
      key: 'title',
      header: 'Batch',
      align: 'left' as const,
      render: (row: DistributionRow) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/dashboard/organizer/campaigns/${row.id}/distributions/${row.id}`}
            className="text-sm font-medium text-zinc-900 underline hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            {row.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-700">
            <span className="capitalize">{row.aidType.toLowerCase().replace('_', ' ')}</span>
            {plannedDateLine(row)}
          </div>
        </div>
      )
    },
    {
      key: 'generalLocation',
      header: 'Lokasi umum',
      align: 'left' as const,
      render: (row: DistributionRow) => (
        <span className="max-w-[180px] truncate text-sm text-zinc-900" title={row.generalLocation ?? ''}>
          {row.generalLocation ?? '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'left' as const,
      render: (row: DistributionRow) => (
        <div className="flex flex-col gap-1.5">
          <StatusBadge status={row.status} />
          {anchorChip(row)}
        </div>
      )
    },
    {
      key: 'evidence',
      header: 'Bukti distribusi',
      align: 'left' as const,
      render: (row: DistributionRow) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-900">{row.evidenceCount} berkas</span>
          {privacyChip(row)}
        </div>
      )
    }
  ]
}

export default async function DistributionPage({
  params
}: {
  params: Promise<{ id: string; campaignId: string }>
}) {
  const resolved = await params
  const actor = await getActor()

  if (!actor) {
    return <ForbiddenNotice reason="Anda harus masuk untuk melihat halaman ini." />
  }

  if (actor.role !== 'ORGANIZER' && actor.role !== 'ADMIN') {
    return <ForbiddenNotice reason="Halaman ini hanya untuk organizer." />
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: resolved.campaignId },
    select: {
      id: true,
      title: true,
      organizationId: true
    }
  })

  if (!campaign) {
    return <PagePlaceholder title="Kampanye tidak ditemukan" description="Kampanye yang Anda tuju tidak ada." planned={[]} />
  }

  if (actor.role === 'ORGANIZER' && campaign.organizationId !== actor.organizationId) {
    return <ForbiddenNotice reason="Anda tidak memiliki akses ke kampanye ini." />
  }

  const batches = await prisma.distributionBatch.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      aidType: true,
      status: true,
      verifiedAt: true,
      generalLocation: true,
      plannedDate: true,
      evidence: {
        select: {
          id: true,
          privacyReview: true,
          anchorStatus: true
        }
      }
    }
  })

  const rows: DistributionRow[] = batches.map((batch) => {
    const anchorPending = batch.evidence.some((e) => e.anchorStatus === 'PENDING' || e.anchorStatus === 'NOT_ANCHORED')
    const evidencePendingPrivacy = batch.evidence.filter((e) => e.privacyReview === 'PENDING' || e.privacyReview === 'REJECTED').length
    return {
      id: batch.id,
      title: batch.title,
      aidType: batch.aidType,
      status: batch.status,
      verifiedAt: batch.verifiedAt?.toISOString() ?? null,
      anchorPending,
      evidenceCount: batch.evidence.length,
      evidencePendingPrivacy,
      generalLocation: batch.generalLocation,
      plannedDate: batch.plannedDate?.toISOString() ?? null
    }
  })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/dashboard/organizer/campaigns/${campaign.id}`}
          className="text-sm text-zinc-700 underline hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
        >
          ← Kembali ke kampanye
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Distribusi bantuan</h1>
          <p className="text-sm text-zinc-700">{campaign.title}</p>
        </div>
      </header>

      <DataTable
        caption={distributionCaption()}
        columns={distributionColumns()}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={
          <EmptyState
            title="Belum ada distribusi"
            description="Batch distribusi pertama akan muncul setelah Anda membuatnya dari halaman kampanye."
            action={
              <ButtonLink href={`/dashboard/organizer/campaigns/${campaign.id}/distributions/new`}>
                Buat distribusi
              </ButtonLink>
            }
          />
        }
        loading={false}
      />

      <Alert tone="info" title="Status verifikasi">
        Satu batch yang berstatus <span className="font-medium">Diterima</span> atau{' '}
        <span className="font-medium">Diterima sebagian</span> tidak otomatis berarti terverifikasi.
        Status{" "}
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
          <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 9v4.5" />
            <path d="M10 6.4v.1" />
          </svg>
          Menunggu konfirmasi
        </span>{' '}
        berarti hash bukti masih dicatat sebagai PENDING dan belum ditandai Terverifikasi.
        Hanya petugas berwenang yang dapat memverifikasi batch.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Privasi bukti distribusi</CardTitle>
          <CardDescription>
            Bukti yang berisi wajah, alamat, atau identitas penerima tidak boleh dipublikasikan sebelum disetujui melalui tinjauan privasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-zinc-900">
          <p>
            Halaman ini hanya menampilkan jumlah berkas dan status tinjauan privasi.
            Data sensitif penerima tidak ditampilkan di sini maupun di halaman publik.
          </p>
          <p className="text-zinc-700">
            Jika ada berkas yang menunggu tinjauan privasi, minta koordinator/verifikator menyetujui akses publik sebelum berbagi tautan bukti.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
