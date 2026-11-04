import { describe, expect, it } from 'vitest'
import { campaigns, getExpenseCategories } from '@/lib/fixtures/campaigns'
import {
  formatDateId,
  formatEthTestnet,
  isTransactionHash,
  sepoliaExplorerTxUrl,
  sharePercent,
  shortenHash
} from '@/app/(public)/_components/format'

describe('formatEthTestnet', () => {
  it('memakai koma desimal dan pemisah ribuan id-ID', () => {
    expect(formatEthTestnet('2400000000000000000')).toBe('2,4 ETH testnet')
    expect(formatEthTestnet('5000000000000000000')).toBe('5 ETH testnet')
    expect(formatEthTestnet('1234000000000000000000')).toBe('1.234 ETH testnet')
  })

  it('memotong desimal panjang tanpa pembulatan', () => {
    expect(formatEthTestnet('123456789012345678')).toBe('0,1234 ETH testnet')
    expect(formatEthTestnet('1', 4)).toBe('0 ETH testnet')
  })

  it('menangani sisa dana negatif tanpa kehilangan tanda', () => {
    expect(formatEthTestnet('-1500000000000000000')).toBe('-1,5 ETH testnet')
  })
})

describe('sharePercent', () => {
  it('membulatkan ke bawah dan membatasi 0–100', () => {
    expect(sharePercent('2400000000000000000', '5000000000000000000')).toBe(48)
    expect(sharePercent('9000000000000000000', '5000000000000000000')).toBe(100)
    expect(sharePercent('1000', '0')).toBe(0)
  })
})

describe('formatDateId', () => {
  it('memakai bulan Bahasa Indonesia', () => {
    expect(formatDateId('2026-11-05T00:00:00.000Z')).toBe('5 November 2026')
  })
})

describe('shortenHash', () => {
  it('menampilkan 6 karakter awal dan 4 akhir', () => {
    expect(shortenHash('0x5436fcde8f8f82eeca5b7e301150e5c450d80ab23272821a305e731a7c9a0ee3')).toBe(
      '0x5436fc…0ee3'
    )
  })
})

describe('verifikasi transaction hash', () => {
  it('menerima 0x + 64 karakter heksadesimal saja', () => {
    expect(isTransactionHash(`0x${'a'.repeat(64)}`)).toBe(true)
    expect(isTransactionHash(`  0x${'F'.repeat(64)}  `)).toBe(true)
    expect(isTransactionHash('bukan-hash')).toBe(false)
    expect(isTransactionHash(`0x${'a'.repeat(63)}`)).toBe(false)
    expect(isTransactionHash(`0x${'z'.repeat(64)}`)).toBe(false)
  })

  it('membangun tautan explorer untuk chainId 11155111 (K-46)', () => {
    expect(sepoliaExplorerTxUrl(`0x${'a'.repeat(64)}`)).toBe(
      `https://sepolia.etherscan.io/tx/0x${'a'.repeat(64)}`
    )
  })
})

describe('getExpenseCategories', () => {
  it('menjumlahkan APPROVED + PAID dan cocok dengan usedWei (K-45)', () => {
    for (const campaign of campaigns) {
      const total = getExpenseCategories(campaign).reduce(
        (sum, item) => sum + BigInt(item.amountWei),
        BigInt(0)
      )
      expect(total.toString()).toBe(campaign.usedWei)
      expect(BigInt(campaign.raisedWei) - BigInt(campaign.usedWei)).toBeGreaterThanOrEqual(BigInt(0))
    }
  })

  it('mengabaikan pengeluaran yang masih diajukan', () => {
    const base = campaigns[0]
    const totals = getExpenseCategories({
      ...base,
      expenses: [
        {
          category: 'Transportasi',
          description: 'Belum disetujui.',
          amountWei: '100000000000000000',
          status: 'PROPOSED',
          recordedAt: '2026-11-12T01:00:00.000Z'
        }
      ]
    })

    expect(totals).toEqual([])
  })
})

describe('fixture kampanye', () => {
  it('hanya berisi data demo dengan hash transaksi 32 byte dan status katalog', () => {
    for (const campaign of campaigns) {
      expect(campaign.targetWei).toMatch(/^\d+$/)
      expect(['ACTIVE', 'CLOSED', 'COMPLETED', 'PAUSED']).toContain(campaign.status)

      for (const entry of campaign.activity) {
        if (entry.txHash) expect(entry.txHash).toMatch(/^0x[0-9a-f]{64}$/)
      }
    }
  })
})
