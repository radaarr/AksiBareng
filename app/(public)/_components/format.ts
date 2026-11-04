/**
 * Format tampilan untuk halaman publik. Angka wei tetap `bigint`/string —
 * tidak pernah dikonversi ke float untuk perhitungan (AGENTS.md).
 */

const WEI_PER_ETH = BigInt('1000000000000000000')

/** `2400000000000000000` → `2,4 ETH testnet` (format id-ID, maksimal 4 desimal). */
export function formatEthTestnet(wei: string, maxFractionDigits = 4): string {
  const value = BigInt(wei)
  const negative = value < BigInt(0)
  const abs = negative ? -value : value
  const whole = abs / WEI_PER_ETH
  const fraction = (abs % WEI_PER_ETH)
    .toString()
    .padStart(18, '0')
    .slice(0, maxFractionDigits)
    .replace(/0+$/, '')

  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sign = negative ? '-' : ''

  return `${sign}${wholeText}${fraction ? `,${fraction}` : ''} ETH testnet`
}

/** Persentase bulat 0–100 untuk bilah progres. Bukan nilai uang. */
export function sharePercent(partWei: string, wholeWei: string): number {
  const part = BigInt(partWei)
  const whole = BigInt(wholeWei)
  if (whole <= BigInt(0)) return 0
  const percent = Number((part * BigInt(100)) / whole)
  return Math.max(0, Math.min(100, percent))
}

/** Tanggal panjang lokal: `5 November 2026`. */
export function formatDateId(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso))
}

/** Hash transaksi EVM: `0x` + 64 karakter heksadesimal. */
export function isTransactionHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim())
}

/** Tautan explorer untuk chainId 11155111 (Sepolia) — TRN-06 / K-46. */
export function sepoliaExplorerTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash.trim()}`
}

/** `0x5436fcde…0ee3` — 6 + 4 karakter sesuai docs/UI_UX.md §8. */
export function shortenHash(hash: string): string {
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}
