import { describe, expect, it } from 'vitest'
import { searchTools } from './search'

const top = (q: string) => searchTools(q)[0]?.tool.id

describe('smart search', () => {
  it('finds the medical bill checker for hospital bill queries', () => {
    expect(top('hospital bill too high')).toBe('medical-bill-checker')
  })

  it('finds the invoice kit for unpaid invoices', () => {
    expect(top('unpaid invoice')).toBe('overdue-invoice-recovery-kit')
  })

  it('separates car quotes from contractor quotes', () => {
    expect(top('mechanic quote')).toBe('car-repair-quote-checker')
    expect(top('contractor estimate')).toBe('home-contractor-quote-checker')
  })

  it('finds the resizer for product photo queries', () => {
    expect(top('resize product photos')).toBe('ecommerce-asset-auto-resizer')
  })

  it('tolerates a small typo', () => {
    expect(top('hospitl bill')).toBe('medical-bill-checker')
  })

  it('returns nothing for empty or unrelated input', () => {
    expect(searchTools('')).toEqual([])
    expect(searchTools('   ')).toEqual([])
    expect(searchTools('zzzzzz')).toEqual([])
  })
})
