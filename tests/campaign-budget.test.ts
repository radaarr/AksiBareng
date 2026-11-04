import { describe, expect, it } from 'vitest'
import {
  createBudgetVersion,
  parseEthToWei,
  sumWei,
  validateBudgetItems,
  weiToEthInput,
  type BudgetVersion
} from '@/app/dashboard/organizer/campaigns/_lib/budget'

describe('parseEthToWei', () => {
  it('menerima koma dan titik desimal tanpa float', () => {
    expect(parseEthToWei('0,5')).toBe('500000000000000000')
    expect(parseEthToWei('1.25')).toBe('1250000000000000000')
    expect(parseEthToWei('  2  ')).toBe('2000000000000000000')
    expect(parseEthToWei('0,000000000000000001')).toBe('1')
  })

  it('menolak format yang tidak valid', () => {
    expect(parseEthToWei('')).toBeNull()
    expect(parseEthToWei('-1')).toBeNull()
    expect(parseEthToWei('1,2,3')).toBeNull()
    expect(parseEthToWei('abc')).toBeNull()
    expect(parseEthToWei('0,0000000000000000001')).toBeNull()
  })
})

describe('weiToEthInput', () => {
  it('mengembalikan nilai editor tanpa nol di belakang', () => {
    expect(weiToEthInput('500000000000000000')).toBe('0,5')
    expect(weiToEthInput('2000000000000000000')).toBe('2')
    expect(weiToEthInput('1')).toBe('0,000000000000000001')
  })
})

describe('sumWei', () => {
  it('menjumlahkan string wei tanpa kehilangan presisi', () => {
    expect(sumWei(['500000000000000000', '250000000000000000'])).toBe('750000000000000000')
    expect(sumWei([])).toBe('0')
  })
})

describe('validateBudgetItems', () => {
  it('mewajibkan minimal satu baris dan nominal di atas nol', () => {
    expect(validateBudgetItems([])).toContain('minimal satu')
    expect(
      validateBudgetItems([{ category: 'Bahan makanan', description: '', amountEth: '0' }])
    ).toContain('lebih dari 0')
    expect(
      validateBudgetItems([{ category: '  ', description: '', amountEth: '1' }])
    ).toContain('punya kategori')
  })

  it('menerima baris yang lengkap', () => {
    expect(
      validateBudgetItems([{ category: 'Bahan makanan', description: '', amountEth: '0,5' }])
    ).toBeNull()
  })
})

describe('createBudgetVersion', () => {
  const first: BudgetVersion = {
    version: 1,
    createdAt: '2026-11-10T00:00:00.000Z',
    supersededAt: null,
    items: [{ category: 'Bahan makanan', description: '', plannedWei: '100' }]
  }

  it('membuat versi baru dan menandai versi lama tanpa mengubah isinya', () => {
    const versions = createBudgetVersion(
      [first],
      [{ category: 'Logistik', description: '', plannedWei: '200' }],
      '2026-11-12T00:00:00.000Z'
    )

    expect(versions).toHaveLength(2)
    expect(versions[0]).toEqual({ ...first, supersededAt: '2026-11-12T00:00:00.000Z' })
    expect(versions[0]?.items).toEqual(first.items)
    expect(versions[1]).toEqual({
      version: 2,
      createdAt: '2026-11-12T00:00:00.000Z',
      supersededAt: null,
      items: [{ category: 'Logistik', description: '', plannedWei: '200' }]
    })
  })

  it('mulai dari versi 1 dan tidak pernah menurunkan nomor versi', () => {
    expect(createBudgetVersion([], [], '2026-11-10T00:00:00.000Z')[0]?.version).toBe(1)

    const versionFive: BudgetVersion = { ...first, version: 5 }
    expect(createBudgetVersion([versionFive], [], '2026-11-12T00:00:00.000Z')[1]?.version).toBe(6)
  })
})
