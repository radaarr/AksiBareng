import { describe, expect, test } from 'vitest'
import { amountWeiDisplay, donationStatusValue } from '@/lib/api/donations'
import { SIMULATION_LABEL } from '@/lib/validation/donation'

describe('donationStatusValue', () => {
  test('memakai status donasi saat belum ada catatan chain', () => {
    expect(donationStatusValue('INTENT', null)).toBe('INTENT')
    expect(donationStatusValue('FAILED', null)).toBe('FAILED')
  })

  test('status chain menggantikan PENDING yang masih berjalan', () => {
    expect(donationStatusValue('PENDING', 'PENDING')).toBe('PENDING')
    expect(donationStatusValue('PENDING', 'CONFIRMED')).toBe('CONFIRMED')
    expect(donationStatusValue('PENDING', 'RETRY_REQUIRED')).toBe('RETRY_REQUIRED')
  })

  test('status final donasi tidak ditimpa status chain yang lebih lama', () => {
    expect(donationStatusValue('CONFIRMED', 'FAILED')).toBe('CONFIRMED')
    expect(donationStatusValue('FAILED', 'PENDING')).toBe('FAILED')
  })
})

describe('amountWeiDisplay', () => {
  test('selalu memuat nominal testnet dan label simulasi', () => {
    const label = amountWeiDisplay('150000000000000000')

    expect(label).toContain('0,15')
    expect(label).toContain('ETH testnet')
    expect(label).toContain(SIMULATION_LABEL)
  })
})
