/**
 * Budget guard for expense approvals.
 * Validates that total APPROVED + PAID expenses do not exceed confirmed funds.
 * Uses simple string-based BigInt arithmetic to avoid float precision loss.
 * All nominal values are strings representing wei (testnet) or IDR decimal strings.
 * No external dependencies (decimal.js-light) — fully self-contained.
 */

// Minimum threshold: 1 wei in string form for comparison guards
const ONE_WEI = '1'

// Simple Decimal-like comparison using BigInt for safe arbitrary-precision arithmetic.

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

/**
 * Check whether adding a new expense (or the current total) would exceed
 * confirmed funds. Returns the shortfall amount if it would, or null if ok.
 *
 * @param confirmedWei Total confirmed funds in wei as Decimal string
 * @param currentApprovedWei Total already APPROVED expenses in wei as Decimal string
 * @param newExpenseWei The new expense amount to add in wei as Decimal string
 * @returns null if ok, or shortfall Decimal string if would exceed
 */
export function checkExpenseFunds(
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

/**
 * Human-readable shortfall message for the EXPENSE_EXCEEDS_FUNDS error.
 *
 * @param shortfallWei The shortfall amount in wei as Decimal string
 * @returns formatted message
 */
export function formatShortfallMessage(shortfallWei: string): string {
  // Format with IDR locale, no fractional wei beyond 2 decimals for display
  const display = shortfallWei.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  return `Kuota dana melebihi total kontribusi. Shortfall: ${display} wei`
}

/**
 * Minimum permissible expense amount (1 wei) as a Decimal string.
 * Used as a guard against zero-amount submissions.
 */
export const MIN_EXPENSE_WEI = ONE_WEI

/**
 * Validate that an expense amount meets the minimum threshold.
 * Returns null if valid, or a message if invalid.
 */
export function validateMinExpense(amountWei: string): null | string {
  const amount = BigInt(amountWei)
  if (amount < BigInt(ONE_WEI) || amount < 0n) {
    return `Nominal minimal pengeluaran adalah 1 wei testnet`
  }
  return null
}

/**
 * Primitives for potential external use (Decimal type alias for compatibility)
 * All functions use string-based BigInt arithmetic; no external runtime deps.
 */
export { decimalAdd, decimalSub, decimalCompare, decimalLessThan, decimalGreaterThan }