import { NextResponse, type NextRequest } from 'next/server'
import { accessProblem } from '@/lib/api/access'
import { requireActor } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import type { DonationRecord } from '@/lib/api/donations'

export const dynamic = 'force-dynamic'

/** GET /api/v1/users/me/donations — riwayat donasi milik sesi (docs/API.md §6, DON-06).
 * Halaman donasi memakai endpoint ini untuk memantau status tanpa memblokir layar;
 * parameter opsional `donationId` mempersempit respons ke satu donasi. */
export async function GET(request: NextRequest) {
  const instance = '/api/v1/users/me/donations'

  try {
    const actor = await requireActor()
    const donationId = request.nextUrl.searchParams.get('donationId')

    const donations = await prisma.donation.findMany({
      where: {
        donorUserId: actor.id,
        ...(donationId ? { id: donationId } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        amountWei: true,
        txHash: true,
        confirmedAt: true,
        createdAt: true
      }
    })

    const transactions = donations.length
      ? await prisma.blockchainTransaction.findMany({
          where: {
            referenceType: 'DONATION',
            referenceId: { in: donations.map((donation) => donation.id) }
          },
          orderBy: { createdAt: 'desc' },
          select: { referenceId: true, status: true, txHash: true }
        })
      : []

    // Ambil catatan blockchain terbaru per donasi.
    const latestTx = new Map<string, { status: DonationRecord['txStatus']; txHash: string | null }>()
    for (const transaction of transactions) {
      if (!latestTx.has(transaction.referenceId)) {
        latestTx.set(transaction.referenceId, {
          status: transaction.status,
          txHash: transaction.txHash
        })
      }
    }

    const data: DonationRecord[] = donations.map((donation) => {
      const transaction = latestTx.get(donation.id)
      return {
        id: donation.id,
        status: donation.status,
        txStatus: transaction?.status ?? null,
        txHash: donation.txHash ?? transaction?.txHash ?? null,
        amountWei: String(donation.amountWei),
        confirmedAt: donation.confirmedAt?.toISOString() ?? null,
        createdAt: donation.createdAt.toISOString()
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    const denied = accessProblem(error, instance)
    if (denied) return denied
    throw error
  }
}
