import { describe, expect, test } from 'vitest'
import {
  MIN_AMOUNT_WEI_DECIMAL,
  donationIntentSchema,
  donationIntentErrorMessage
} from '@/lib/validation/donation'

describe('donationIntentSchema', () => {
  test('menerima nominal minimal dan menormalkannya ke string desimal', () => {
    const result = donationIntentSchema.safeParse({
      amountWei: ' 1000000000000000 '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amountWei).toBe(MIN_AMOUNT_WEI_DECIMAL)
    }
  })

  test('menolak nominal di bawah 0,001 ETH testnet', () => {
    const result = donationIntentSchema.safeParse({ amountWei: '999999999999999' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(donationIntentErrorMessage(result.error)).toBe(
        'Nominal minimal 0.001 ETH testnet.'
      )
    }
  })

  test('menolak nominal yang bukan angka bulat wei', () => {
    const result = donationIntentSchema.safeParse({ amountWei: '0,1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(donationIntentErrorMessage(result.error)).toBe(
        'Nominal harus berupa angka bulat dalam wei.'
      )
    }
  })

  test('menolak nama tampilan lebih dari 40 karakter', () => {
    const result = donationIntentSchema.safeParse({
      amountWei: MIN_AMOUNT_WEI_DECIMAL,
      displayName: 'a'.repeat(41)
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(donationIntentErrorMessage(result.error)).toBe(
        'Nama tampilan maksimal 40 karakter.'
      )
    }
  })

  test('menolak field yang tidak dikenal', () => {
    const result = donationIntentSchema.safeParse({
      amountWei: MIN_AMOUNT_WEI_DECIMAL,
      txHash: '0xabc'
    })

    expect(result.success).toBe(false)
  })
})
