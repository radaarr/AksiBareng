/**
 * Helper murni untuk editor anggaran kampanye (CAM-03, PRD §9.1).
 *
 * Revisi tidak menimpa versi lama: versi sebelumnya diberi `supersededAt`
 * dan tetap disimpan (audit trail). Nominal selalu string wei — jangan
 * dikonversi ke number/float (AGENTS.md).
 */

const WEI_DECIMALS = 18
const WEI_PER_ETH = BigInt('1000000000000000000')

export type BudgetItemDraft = {
  category: string
  description: string
  /** Input pengguna dalam ETH testnet, boleh memakai koma atau titik. */
  amountEth: string
}

export type BudgetVersionItem = {
  category: string
  description: string
  plannedWei: string
}

export type BudgetVersion = {
  version: number
  createdAt: string
  supersededAt: string | null
  items: BudgetVersionItem[]
}

/** `"0,5"` → `"500000000000000000"`; `null` bila format tidak valid. */
export function parseEthToWei(input: string): string | null {
  const normalized = input.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) return null

  const [whole, fraction = ''] = normalized.split('.')
  const wei = `${whole}${fraction.padEnd(WEI_DECIMALS, '0')}`.replace(/^0+(?=\d)/, '')

  return wei
}

/** `"500000000000000000"` → `"0,5"` untuk mengisi ulang editor. */
export function weiToEthInput(wei: string): string {
  const value = BigInt(wei)
  const whole = value / WEI_PER_ETH
  const fraction = (value % WEI_PER_ETH)
    .toString()
    .padStart(WEI_DECIMALS, '0')
    .replace(/0+$/, '')

  return fraction ? `${whole},${fraction}` : whole.toString()
}

export function sumWei(values: string[]): string {
  return values.reduce((total, value) => total + BigInt(value), BigInt(0)).toString()
}

/** Pesan kesalahan pertama, atau `null` bila seluruh baris valid. */
export function validateBudgetItems(items: BudgetItemDraft[]): string | null {
  if (items.length === 0) return 'Tambahkan minimal satu kategori anggaran.'

  for (const item of items) {
    if (!item.category.trim()) return 'Setiap baris anggaran harus punya kategori.'

    const amountWei = parseEthToWei(item.amountEth)
    if (amountWei === null || BigInt(amountWei) <= BigInt(0)) {
      return `Nominal anggaran ${item.category.trim() || 'baris ini'} harus lebih dari 0 ETH testnet.`
    }
  }

  return null
}

/**
 * Menyimpan revisi sebagai versi baru. Versi aktif sebelumnya ditandai
 * `supersededAt`; isi versi lama tidak diubah.
 */
export function createBudgetVersion(
  versions: BudgetVersion[],
  items: BudgetVersionItem[],
  now: string = new Date().toISOString()
): BudgetVersion[] {
  const nextVersion = versions.reduce((max, version) => Math.max(max, version.version), 0) + 1

  const superseded = versions.map((version) =>
    version.supersededAt === null ? { ...version, supersededAt: now } : version
  )

  return [
    ...superseded,
    {
      version: nextVersion,
      createdAt: now,
      supersededAt: null,
      items
    }
  ]
}
