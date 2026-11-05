import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { DonationPollStatus } from '@/components/donate/DonationPollStatus'
import { rateLimit } from '@/lib/api/rate-limit'
import {
  amountWeiDisplay,
  donationContractExplorerUrl,
  SIMULATION_LABEL,
  type DonationRecord
} from '@/lib/api/donations'
import { getActor } from '@/lib/auth/session'
import { SEPOLIA_CHAIN_ID, shortTxHash } from '@/lib/chain'
import { prisma } from '@/lib/db'
import {
  donationIntentErrorMessage,
  donationIntentSchema
} from '@/lib/validation/donation'
import { canDonate, resolvePublicCampaign } from './_lib/campaign'

/**
 * Halaman donasi publik (C10) + alur intent & pemantauan status (C11).
 *
 * Pencatatan donasi mengikuti docs/API.md §6:
 *   POST /campaigns/{id}/donations/intent  → donasi `INTENT` (login wajib)
 *   GET  /users/me/donations               → status dipantau tanpa memblokir layar
 *
 * Status on-chain (`PENDING`, `CONFIRMED`, `FAILED`, `RETRY_REQUIRED`) hanya
 * berasal dari catatan blockchain di server; halaman ini tidak pernah mengarang
 * status terkonfirmasi. Semua nominal adalah simulasi testnet Sepolia.
 */
export default async function PublicCampaignDonatePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ donation?: string; error?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const campaign = await resolvePublicCampaign(slug)

  if (!campaign) {
    notFound()
  }

  const actor = await getActor()
  const campaignCanDonate = canDonate(campaign.status)
  const contractAddress = (process.env.NEXT_PUBLIC_DONATION_CONTRACT ?? '').trim()
  const tracked = actor && query.donation ? await loadDonation(query.donation, actor.id) : null

  async function createIntent(formData: FormData) {
    'use server'

    const current = await resolvePublicCampaign(slug)
    if (!current || !canDonate(current.status)) {
      redirect(
        `/campaigns/${slug}/donate?error=${encodeURIComponent('Kampanye ini tidak menerima donasi lagi.')}`
      )
    }

    const currentActor = await getActor()
    if (!currentActor) {
      redirect('/login')
    }

    const parsed = donationIntentSchema.safeParse({
      amountWei: String(formData.get('amountWei') ?? ''),
      displayName: String(formData.get('displayName') ?? '').trim() || undefined,
      isAnonymous: formData.get('isAnonymous') === 'on'
    })

    if (!parsed.success) {
      redirect(
        `/campaigns/${slug}/donate?error=${encodeURIComponent(donationIntentErrorMessage(parsed.error))}`
      )
    }

    const limit = rateLimit(`donation:intent:${currentActor.id}`, 20, 60 * 60 * 1000)
    if (!limit.allowed) {
      redirect(
        `/campaigns/${slug}/donate?error=${encodeURIComponent('Terlalu banyak percobaan donasi. Coba lagi nanti.')}`
      )
    }

    const isAnonymous = parsed.data.isAnonymous ?? false
    const intent = await prisma.donation.create({
      data: {
        campaignId: current.id,
        donorUserId: currentActor.id,
        donorDisplayName: isAnonymous ? null : (parsed.data.displayName ?? null),
        isAnonymous,
        amountWei: parsed.data.amountWei,
        chainId: SEPOLIA_CHAIN_ID,
        status: 'INTENT',
        donationIntentNonce: crypto.randomUUID()
      },
      select: { id: true }
    })

    redirect(`/campaigns/${slug}/donate?donation=${intent.id}`)
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Donasi untuk {campaign.title}
        </h1>
        <p className="text-sm text-zinc-700">
          Halaman ini adalah simulasi. Tidak ada uang sungguhan yang diterima atau dibayarkan.
        </p>
      </header>

      <Alert tone="warning" title="Simulasi" className="mb-6">
        <p>{SIMULATION_LABEL}</p>
      </Alert>

      {query.error ? (
        <Alert tone="danger" title="Donasi belum tercatat" className="mb-6">
          <p>{query.error}</p>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-6">
        <Card className="w-full">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-zinc-700">
              Target: {amountWeiDisplay(campaign.targetAmountWei)}
            </span>
            {campaign.fundingAsset === 'NATIVE_ETH_TESTNET' ? (
              <span className="text-sm text-zinc-600">Aset: ETH testnet (Sepolia)</span>
            ) : null}
          </CardContent>
        </Card>

        {contractAddress ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
            <span>Kontrak:</span>
            <a
              href={donationContractExplorerUrl(contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded border border-zinc-300 bg-zinc-50 px-2 font-mono text-xs text-zinc-900 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
            >
              {shortTxHash(contractAddress)}
              <span className="sr-only">Buka kontrak di explorer Sepolia</span>
            </a>
          </p>
        ) : null}

        {campaignCanDonate ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Catat donasi</CardTitle>
              <p className="text-sm text-zinc-700">
                Masukkan nominal dalam wei. Donasi dicatat dulu sebagai niat; pengiriman
                transaksi ke Sepolia dilakukan dari wallet terhubung.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {actor ? (
                <form action={createIntent} className="flex flex-col gap-5">
                  <FormField
                    id="amountWei"
                    label="Nominal (wei)"
                    hint="Contoh: 100000000000000000 untuk 0,1 ETH testnet."
                    required
                  >
                    <Input
                      id="amountWei"
                      name="amountWei"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      required
                      placeholder="100000000000000000"
                    />
                  </FormField>

                  <FormField id="displayName" label="Nama tampilan (opsional)">
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      autoComplete="off"
                      maxLength={40}
                      placeholder="Nama yang tampil di riwayat"
                    />
                  </FormField>

                  <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-900">
                    <input
                      type="checkbox"
                      name="isAnonymous"
                      className="size-4 rounded border-zinc-400 text-emerald-700 focus-visible:ring-2 focus-visible:ring-zinc-900"
                    />
                    <span>Sembunyikan nama saya (anonim)</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">Catat donasi testnet</Button>
                    <span className="text-xs text-zinc-600">
                      Minimal 0,001 ETH testnet. {SIMULATION_LABEL}
                    </span>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-700">
                    Masuk dulu untuk mencatat donasi dan memantau statusnya.
                  </p>
                  <ButtonLink href="/login">Masuk untuk berdonasi</ButtonLink>
                </div>
              )}

              <p className="text-xs text-zinc-600">{SIMULATION_LABEL}</p>
            </CardContent>
          </Card>
        ) : (
          <Alert tone="info" title="Donasi ditutup">
            Kampanye ini tidak menerima donasi lagi.
          </Alert>
        )}

        {tracked ? (
          <section className="flex flex-col gap-4" aria-label="Status donasi">
            <h2 className="text-lg font-semibold text-zinc-900">Status donasi Anda</h2>
            <p className="text-sm text-zinc-700">
              Nominal: {amountWeiDisplay(tracked.amountWei ?? '0')}
            </p>
            <DonationPollStatus
              donationId={tracked.id}
              pollUrl={`/api/v1/users/me/donations?donationId=${tracked.id}`}
              initial={tracked}
              className="w-full"
            />
          </section>
        ) : null}
      </div>
    </main>
  )
}

/** Satu donasi milik aktor + catatan blockchain terakhirnya. */
async function loadDonation(
  donationId: string,
  donorUserId: string
): Promise<DonationRecord | null> {
  const donation = await prisma.donation.findFirst({
    where: { id: donationId, donorUserId },
    select: {
      id: true,
      status: true,
      amountWei: true,
      txHash: true,
      confirmedAt: true,
      createdAt: true
    }
  })

  if (!donation) return null

  const transaction = await prisma.blockchainTransaction.findFirst({
    where: { referenceType: 'DONATION', referenceId: donation.id },
    orderBy: { createdAt: 'desc' },
    select: { status: true, txHash: true }
  })

  return {
    id: donation.id,
    status: donation.status,
    txStatus: transaction?.status ?? null,
    txHash: donation.txHash ?? transaction?.txHash ?? null,
    amountWei: String(donation.amountWei),
    confirmedAt: donation.confirmedAt?.toISOString() ?? null,
    createdAt: donation.createdAt.toISOString()
  }
}
