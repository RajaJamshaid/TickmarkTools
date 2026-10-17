import { describe, expect, it } from 'vitest'
import { buildBill, emptyForm, isValidIsoDate, newItemForm } from './form'

describe('isValidIsoDate', () => {
  it('accepts real dates only', () => {
    expect(isValidIsoDate('2026-03-01')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('03/01/2026')).toBe(false)
    expect(isValidIsoDate('1900-01-01')).toBe(false)
  })
})

describe('buildBill', () => {
  it('converts typed values to integer cents and keeps blanks as null', () => {
    const form = { ...emptyForm(), gross: '$1,250.00', balance: '300.5', provider: ' Clinic ' }
    const r = buildBill(form, 2)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.bill.totals.grossChargesCents).toBe(125000)
    expect(r.bill.totals.balanceCents).toBe(30050)
    expect(r.bill.totals.creditsCents).toBeNull()
    expect(r.bill.provider).toBe('Clinic')
    expect(r.bill.pagesScanned).toBe(2)
  })

  it('ignores fully blank line rows and keeps real ones', () => {
    const row = { ...newItemForm(), description: 'Lab', quantity: '2', unit: '10', amount: '20', serviceDate: '2026-03-01', code: ' 80053 ' }
    const r = buildBill({ ...emptyForm(), items: [newItemForm(), row] }, 1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.bill.lineItems).toHaveLength(1)
    expect(r.bill.lineItems[0]).toMatchObject({ amountCents: 2000, unitCents: 1000, quantity: 2, code: '80053', needsReview: false })
  })

  it('marks a line with no amount as Needs review', () => {
    const row = { ...newItemForm(), description: 'Unclear charge' }
    const r = buildBill({ ...emptyForm(), items: [row] }, 1)
    expect(r.ok && r.bill.lineItems[0].needsReview).toBe(true)
  })

  it('reports unreadable amounts instead of guessing', () => {
    const row = { ...newItemForm(), description: 'Lab', amount: '12.345' }
    const r = buildBill({ ...emptyForm(), gross: 'abc', items: [row] }, 1)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.fields.gross).toBeDefined()
    expect(r.errors.items[row.id].amount).toBeDefined()
  })

  it('validates dates and expected pages', () => {
    const r = buildBill({ ...emptyForm(), statementDate: '2026-13-01', pagesExpected: '99' }, 1)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.fields.statementDate).toBeDefined()
    expect(r.errors.fields.pagesExpected).toBeDefined()
  })

  it('carries the user-confirmed completeness flag', () => {
    const r = buildBill({ ...emptyForm(), lineItemsComplete: true, pagesExpected: '3' }, 2)
    expect(r.ok && r.bill.lineItemsComplete).toBe(true)
    expect(r.ok && r.bill.pagesExpected).toBe(3)
  })
})
