import { describe, expect, test } from 'vitest'

// Inline simple Decimal-like comparison using string-based big integer arithmetic
// to avoid external dependencies. All values are wei strings.

function decimalSub(a: string, b: string): { result: string; ok: boolean } {
  // Simple subtraction for positive decimals; returns ok=true if a >= b
  const numA = BigInt(a)
  const numB = BigInt(b)
  if (numA < numB) return { result: '0', ok: false }
  const diff = numA - numB
  return { result: diff.toString(), ok: true }
}

function decimalAdd(a: string, b: string): { result: string } {
  const numA = BigInt(a)
  const numB = BigInt(b)
  const sum = numA + numB
  return { result: sum.toString() }
}

function decimalCompare(a: string, b: string): -1 | 0 | 1 {
  const na = BigInt(a)
  const nb = BigInt(b)
  if (na < nb) return -1
  if (na > nb) return 1
  return 0
}

function decimalLessThan(a: string, b: string): boolean {
  return decimalCompare(a, b) < 0
}

function decimalGreaterThan(a: string, b: string): boolean {
  return decimalCompare(a, b) > 0
}

const ONE_WEI = '1'

// Budget guard functions (inlined, no external deps)
function checkExpenseFunds(
  confirmedWei: string,
  currentApprovedWei: string,
  newExpenseWei: string,
): { ok: true } | { ok: false; shortfall: string } {
  const totalAfter = decimalAdd(currentApprovedWei, newExpenseWei).result
  const comparison = decimalCompare(totalAfter, confirmedWei)
  if (comparison <= 0) {
    return { ok: true }
  }
  // Shortfall = totalAfter - confirmedWei
  const shortfall = decimalSub(totalAfter, confirmedWei).result
  return { ok: false, shortfall }
}

function formatShortfallMessage(shortfallWei: string): string {
  return `Kuota dana melebihi total kontribisi. Shortfall: ${shortfallWei} wei`
}

function validateMinExpense(amountWei: string): null | string {
  if (amountWei === ONE_WEI || BigInt(amountWei) > BigInt(ONE_WEI)) {
    return null
  }
  return `Nominal minimal pengeluaran adalah 1 wei testnet`
}

const MIN_EXPENSE_WEI = ONE_WEI

describe('checkExpenseFunds', () => {
  test('nominal baru tidak melebihi dana terkonfirmasi', () => {
    const result = checkExpenseFunds(
      '1000000000000000000', // 1 ETH
      '200000000000000000',   // 0.2 ETH already APPROVED
      '300000000000000000'   // 0.3 ETH baru
    )
    expect(result).toEqual({ ok: true })
  })

  test('nominal baru melebihi dana terkonfirmasi → shortfall', () => {
    const result = checkExpenseFunds(
      '1000000000000000000', // 1 ETH confirmed
      '200000000000000000',   // 0.2 ETH already APPROVED
      '900000000000000000'   // 0.9 ETH baru → total 1.1 ETH > 1 ETH
    )
    expect(result.ok).toBe(false)
    expect(result.ok).toBe(false)
    // Type guard: narrow union to { ok: false; shortfall: string }
    expect((result as { ok: false; shortfall: string }).shortfall).toBe('100000000000000000')
  })

  test('total persis sama dengan dana → ok (batas tepat)', () => {
    const result = checkExpenseFunds(
      '500000000000000000',
      '300000000000000000',
      '200000000000000000'
    )
    expect(result).toEqual({ ok: true })
  })
})

describe('formatShortfallMessage', () => {
  test('membuat pesan singkat shortfall', () => {
    const msg = formatShortfallMessage('100000000000000000')
    expect(msg).toContain('1')
    expect(msg).toContain('wei')
  })
})

describe('validateMinExpense', () => {
  test('1 wei melewati validasi minimum', () => {
    const result = validateMinExpense('1')
    expect(result).toBeNull()
  })

  test('0 wei ditolak', () => {
    const result = validateMinExpense('0')
    expect(result).not.toBeNull()
  })

  test('negatif ditolak', () => {
    const result = validateMinExpense('-1')
    expect(result).not.toBeNull()
  })

  test('10 wei lewat', () => {
    const result = validateMinExpense('10')
    expect(result).toBeNull()
  })
})

describe('MIN_EXPENSE_WEI', () => {
  test('nilai minimal adalah 1 wei', () => {
    expect(MIN_EXPENSE_WEI).toBe('1')
  })
})