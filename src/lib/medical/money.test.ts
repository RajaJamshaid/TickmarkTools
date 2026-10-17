import { describe, expect, it } from 'vitest'
import { formatCents, multiplyCents, parseMoneyToCents, parseQuantity, sumCents } from './money'

describe('parseMoneyToCents', () => {
  it('parses common formats into integer cents', () => {
    expect(parseMoneyToCents('$1,234.56')).toBe(123456)
    expect(parseMoneyToCents('12')).toBe(1200)
    expect(parseMoneyToCents('12.5')).toBe(1250)
    expect(parseMoneyToCents('.99')).toBe(99)
    expect(parseMoneyToCents('$ 10')).toBe(1000)
    expect(parseMoneyToCents('1,234,567.89')).toBe(123456789)
    expect(parseMoneyToCents('0')).toBe(0)
  })

  it('parses negatives and credits', () => {
    expect(parseMoneyToCents('(45.00)')).toBe(-4500)
    expect(parseMoneyToCents('-$5.25')).toBe(-525)
    expect(parseMoneyToCents('25.00 CR')).toBe(-2500)
    expect(parseMoneyToCents('-0.00')).toBe(0)
  })

  it('returns null instead of guessing', () => {
    expect(parseMoneyToCents('')).toBeNull()
    expect(parseMoneyToCents('abc')).toBeNull()
    expect(parseMoneyToCents('12.345')).toBeNull()
    expect(parseMoneyToCents('1,23')).toBeNull()
    expect(parseMoneyToCents('1e3')).toBeNull()
    expect(parseMoneyToCents('100000000.01')).toBeNull()
  })

  it('allows the maximum amount', () => {
    expect(parseMoneyToCents('100000000.00')).toBe(1e10)
  })
})

describe('parseQuantity', () => {
  it('accepts up to 3 decimals and rejects the rest', () => {
    expect(parseQuantity('2')).toBe(2)
    expect(parseQuantity('1.5')).toBe(1.5)
    expect(parseQuantity('0')).toBe(0)
    expect(parseQuantity('1.2345')).toBeNull()
    expect(parseQuantity('-1')).toBeNull()
    expect(parseQuantity('')).toBeNull()
  })
})

describe('formatCents', () => {
  it('formats with grouping and sign', () => {
    expect(formatCents(123456)).toBe('$1,234.56')
    expect(formatCents(-5)).toBe('-$0.05')
    expect(formatCents(0)).toBe('$0.00')
    expect(formatCents(100000000)).toBe('$1,000,000.00')
  })
})

describe('sumCents / multiplyCents', () => {
  it('sums without floating-point drift', () => {
    expect(sumCents([10, 20])).toBe(30)
    expect(sumCents([])).toBe(0)
  })

  it('multiplies exactly when possible and flags rounding otherwise', () => {
    expect(multiplyCents(1999, 3)).toEqual({ cents: 5997, exact: true })
    expect(multiplyCents(1999, 1.5)).toEqual({ cents: 2999, exact: false })
    expect(multiplyCents(333, 0.5)).toEqual({ cents: 167, exact: false })
  })

  it('returns null for unsafe sizes', () => {
    expect(multiplyCents(1e10, 100000)).toBeNull()
  })
})
