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

  it('uses the approved CTA copy in order', () => {
    expect(FEATURED_TOOLS.map((t) => t.intendedCta)).toEqual([
      'Check My Medical Bill',
      'Recover My Payment',
      'Check Repair Quote',
      'Review My Quote',
      'Resize Product Images',
    ])
  })

  it('has unique ids and unique planned landing paths', () => {
    expect(new Set(FEATURED_TOOLS.map((t) => t.id)).size).toBe(FEATURED_TOOLS.length)
    const paths = FEATURED_TOOLS.map((t) => t.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((p) => /^\/tools\/[a-z0-9-]+$/.test(p))).toBe(true)
    expect(FEATURED_TOOLS.every((t) => t.path === `/tools/${t.id}`)).toBe(true)
  })

  it('marks every tool as not yet available', () => {
    expect(FEATURED_TOOLS.every((t) => t.status === 'coming-soon')).toBe(true)
  })

  it('uses the single shared planned price', () => {
    expect(PRICE_USD).toBe(1.99)
    expect(formatPrice(PRICE_USD)).toBe('$1.99')
    expect(FEATURED_TOOLS.every((t) => t.price === PRICE_USD)).toBe(true)
  })
})
