import { describe, expect, it } from 'vitest'
import { FEATURED_TOOLS, PRICE_USD, formatPrice } from './tools'

describe('featured tools', () => {
  it('lists exactly the five approved launch tools in order', () => {
    expect(FEATURED_TOOLS.map((t) => t.name)).toEqual([
      'Medical Bill Checker',
      'Overdue Invoice Recovery Kit',
      'Car Repair Quote Checker',
      'Home Contractor Quote Checker',
      'E-Commerce Product Asset Auto-Resizer',
    ])
  })

  it('has unique ids', () => {
    expect(new Set(FEATURED_TOOLS.map((t) => t.id)).size).toBe(FEATURED_TOOLS.length)
  })

  it('marks every tool as not yet available', () => {
    expect(FEATURED_TOOLS.every((t) => t.status === 'coming-soon')).toBe(true)
  })

  it('uses the intended $1.99 price', () => {
    expect(PRICE_USD).toBe(1.99)
    expect(formatPrice(PRICE_USD)).toBe('$1.99')
    expect(FEATURED_TOOLS.every((t) => t.price === PRICE_USD)).toBe(true)
  })
})
