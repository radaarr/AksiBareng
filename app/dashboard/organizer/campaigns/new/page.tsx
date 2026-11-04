import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { CampaignForm } from '../_components/CampaignForm'
import { VerificationGate } from '../_components/VerificationGate'

export const metadata: Metadata = {
  title: 'Buat kampanye — AksiBareng'
}

// Kontak admin demo dari prisma/seed.ts; ganti dengan pengaturan platform saat tersedia.
const PLATFORM_ADMIN_EMAIL = 'admin@aksibareng.test'

export default async function NewCampaignPage() {
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

  const [organization, categories] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: {
        name: true,
        publicArea: true,
        contactEmail: true,
        verificationStatus: true
      }
    }),
    prisma.category.findMany({
      where: { scope: 'CAMPAIGN', isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true }
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

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Remah roti" className="text-sm">
        <Link
          href="/dashboard/organizer/campaigns"
          className="inline-flex min-h-11 items-center rounded-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          ← Kampanye saya
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          {organization.name}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Buat kampanye
        </h1>
        <p className="max-w-2xl text-zinc-700">
          Jelaskan kebutuhan, target, periode, dan rencana penggunaan dana. Setelah dikirim, kampanye
          menunggu tinjauan admin sebelum tampil publik.
        </p>
      </header>

      {organization.verificationStatus === 'VERIFIED' ? (
        <CampaignForm organizerName={organization.name} categories={categories} />
      ) : (
        <VerificationGate
          organizationName={organization.name}
          publicArea={organization.publicArea}
          contactEmail={organization.contactEmail}
          platformAdminEmail={PLATFORM_ADMIN_EMAIL}
          verificationStatus={organization.verificationStatus}
        />
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
