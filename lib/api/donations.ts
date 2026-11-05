import type { DonationStatus, TxStatus } from '@prisma/client'
import { explorerContractUrl, explorerTxUrl, shortTxHash, weiToEtherLabel } from '@/lib/chain'
import { SIMULATION_LABEL } from '@/lib/validation/donation'

// Label simulasi hanya didefinisikan sekali di lib/validation/donation.ts.
export { SIMULATION_LABEL }
export type { DonationStatus, TxStatus }

export type DonationRecord = {
  id: string
  status: DonationStatus
  /** Status catatan blockchain terkait, bila sudah ada upaya submit. */
  txStatus?: TxStatus | null
  txHash?: string | null
  amountWei?: string | null
  confirmedAt?: string | null
  createdAt?: string | null
}

/** Nominal wei selalu tampil bersama label simulasi (docs/UI_UX.md §5). */
export function amountWeiDisplay(wei: string): string {
  return `${weiToEtherLabel(wei)} ETH testnet — ${SIMULATION_LABEL}`
}

/** Status donasi efektif: status transaksi chain lebih spesifik saat donasi PENDING. */
export function donationStatusValue(
  status: DonationStatus,
  txStatus?: TxStatus | null
): string {
  if (status === 'PENDING' && txStatus) return txStatus
  return status
}

export function txHashDisplay(txHash: string): string {
  return shortTxHash(txHash)
}

export function donationExplorerUrl(txHash: string): string {
  return explorerTxUrl(txHash)
}

export function donationContractExplorerUrl(address: string): string {
  return explorerContractUrl(address)
}
