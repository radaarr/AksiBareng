import { describe, expect, test } from 'vitest'
import { shortTxHash, weiToEtherLabel } from '@/lib/chain'

describe('weiToEtherLabel', () => {
  test('memformat nominal bulat sebagai ETH testnet', () => {
    expect(weiToEtherLabel('1000000000000000000')).toBe('1')
  })

  test('memakai koma desimal dan maksimal enam digit', () => {
    expect(weiToEtherLabel('150000000000000000')).toBe('0,15')
    expect(weiToEtherLabel('1234567890123456789')).toBe('1,234567')
  })

  test('tidak kehilangan presisi untuk nominal besar', () => {
    expect(weiToEtherLabel('100000000000000000000000000')).toBe('100.000.000')
  })
})

describe('shortTxHash', () => {
  test('menyingkat hash penuh menjadi 6+4 karakter', () => {
    const hash = `0x${'a'.repeat(64)}`
    expect(shortTxHash(hash)).toBe(`0x${'a'.repeat(6)}…${'a'.repeat(4)}`)
  })

  test('mengembalikan nilai yang bukan hash apa adanya', () => {
    expect(shortTxHash('bukan-hash')).toBe('bukan-hash')
  })
})
