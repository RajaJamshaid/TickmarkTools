/** All money is stored as integer cents. Never use floating-point dollars for calculations. */
export type Cents = number

/** Anything above $100,000,000 is treated as a likely misread, not a real amount. */
export const MAX_ABS_CENTS = 1e10
export const MAX_QUANTITY = 100000

const PLAIN = /^\d+(\.\d{1,2})?$/
const GROUPED = /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/
const FRACTION_ONLY = /^\.\d{1,2}$/

/**
 * Parses text such as "$1,234.56", "(45.00)", "-12.5" or "25.00 CR" into integer cents.
 * Returns null for anything ambiguous (never guesses): more than 2 decimals, bad grouping, letters, etc.
 */
export function parseMoneyToCents(input: string): Cents | null {
  let s = input.trim()
  if (s === '') return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  s = s.replace(/^\$\s*/, '')
  if (/^[-\u2212]/.test(s)) {
    negative = !negative
    s = s.slice(1).trim().replace(/^\$\s*/, '')
  }
  if (/cr$/i.test(s)) {
    negative = !negative
    s = s.slice(0, -2).trim()
  }
  if (!(PLAIN.test(s) || GROUPED.test(s) || FRACTION_ONLY.test(s))) return null
  const [whole = '', frac = ''] = s.replace(/,/g, '').split('.')
  const cents = Number(whole === '' ? '0' : whole) * 100 + Number(frac.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents > MAX_ABS_CENTS) return null
  return negative && cents > 0 ? -cents : cents
}

/** Parses a quantity with up to 3 decimals. Returns null if unreadable. */
export function parseQuantity(input: string): number | null {
  const s = input.trim()
  if (!/^\d+(\.\d{1,3})?$/.test(s)) return null
  const q = Number(s)
  return Number.isFinite(q) && q <= MAX_QUANTITY ? q : null
}

export function formatCents(cents: Cents): string {
  const abs = Math.abs(cents)
  const dollars = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const rest = String(abs % 100).padStart(2, '0')
  return `${cents < 0 ? '-' : ''}$${dollars}.${rest}`
}

export function sumCents(values: readonly Cents[]): Cents {
  let total = 0
  for (const v of values) total += v
  return total
}

/**
 * unit price x quantity in integer arithmetic (quantity kept to 3 decimals).
 * `exact` is false when the product needed rounding to a whole cent.
 * Returns null if the numbers are too large to compute safely.
 */
export function multiplyCents(unitCents: Cents, quantity: number): { cents: Cents; exact: boolean } | null {
  const milli = Math.round(quantity * 1000)
  const product = unitCents * milli
  if (!Number.isSafeInteger(product)) return null
  return { cents: Math.round(product / 1000), exact: product % 1000 === 0 }
}
