import { describe, expect, it } from 'vitest'
import { HIGH_DIFFERENCE_CENTS, analyzeBill, severityForDifference } from './analysis'
import type { BillData, BillTotals, LineItem } from './types'

const emptyTotals: BillTotals = {
  grossChargesCents: null,
  adjustmentsCents: null,
  insurancePaymentsCents: null,
  patientPaymentsCents: null,
  creditsCents: null,
  previousBalanceCents: null,
  balanceCents: null,
}

let n = 0
const item = (o: Partial<LineItem> = {}): LineItem => ({
  id: `i${++n}`,
  page: 1,
  description: 'Item',
  code: null,
  serviceDate: '2026-03-01',
  quantity: null,
  unitCents: null,
  amountCents: 1000,
  needsReview: false,
  ...o,
})

const bill = (o: Partial<BillData> = {}): BillData => ({
  provider: null,
  statementDate: null,
  pagesScanned: 1,
  pagesExpected: null,
  lineItemsComplete: false,
  unreadableFields: [],
  lineItems: [],
  totals: emptyTotals,
  ...o,
})

const of = (r: ReturnType<typeof analyzeBill>, kind: string) => r.findings.filter((f) => f.kind === kind)

describe('severity rule', () => {
  it('maps differences to severities', () => {
    expect(severityForDifference(99)).toBe('low')
    expect(severityForDifference(-1000)).toBe('medium')
    expect(severityForDifference(HIGH_DIFFERENCE_CENTS)).toBe('high')
  })
})

describe('line arithmetic', () => {
  it('flags quantity x unit price mismatches with evidence', () => {
    const r = analyzeBill(bill({ lineItems: [item({ description: 'X-ray', quantity: 2, unitCents: 5000, amountCents: 9000 })] }))
    const f = of(r, 'arithmetic-line').find((x) => x.label === 'Potential inconsistency')
    expect(f?.severity).toBe('medium')
    expect(f?.evidence.join(' ')).toContain('$100.00')
    expect(f?.question).toContain('X-ray')
  })

  it('passes matching lines', () => {
    const r = analyzeBill(bill({ lineItems: [item({ quantity: 2, unitCents: 5000, amountCents: 10000 })] }))
    expect(of(r, 'arithmetic-line').map((f) => f.label)).toEqual(['Arithmetic check passed'])
  })

  it('tolerates 1 cent when rounding was required', () => {
    const r = analyzeBill(bill({ lineItems: [item({ quantity: 1.5, unitCents: 333, amountCents: 499 })] }))
    expect(of(r, 'arithmetic-line').map((f) => f.label)).toEqual(['Arithmetic check passed'])
  })

  it('skips lines marked Needs review instead of guessing', () => {
    const r = analyzeBill(bill({ lineItems: [item({ quantity: 2, unitCents: 5000, amountCents: 9000, needsReview: true })] }))
    expect(of(r, 'arithmetic-line')).toHaveLength(0)
    expect(of(r, 'undetermined').length).toBeGreaterThan(0)
  })
})

describe('line items vs total charges', () => {
  const lines = [item({ amountCents: 3000 }), item({ amountCents: 2000 })]

  it('passes when complete and equal', () => {
    const r = analyzeBill(bill({ lineItems: lines, lineItemsComplete: true, totals: { ...emptyTotals, grossChargesCents: 5000 } }))
    expect(of(r, 'arithmetic-total')[0]?.label).toBe('Arithmetic check passed')
  })

  it('flags a confirmed mismatch', () => {
    const r = analyzeBill(bill({ lineItems: lines, lineItemsComplete: true, totals: { ...emptyTotals, grossChargesCents: 6000 } }))
    const f = of(r, 'arithmetic-total')[0]
    expect(f.label).toBe('Potential inconsistency')
    expect(f.severity).toBe('medium')
  })

  it('does not assert a mismatch when completeness is unconfirmed', () => {
    const r = analyzeBill(bill({ lineItems: lines, totals: { ...emptyTotals, grossChargesCents: 6000 } }))
    expect(of(r, 'arithmetic-total')).toHaveLength(0)
    expect(of(r, 'undetermined').length).toBeGreaterThan(0)
    expect(r.coverage).toBe('partial')
  })

  it('treats fewer pages scanned than expected as incomplete', () => {
    const r = analyzeBill(
      bill({ lineItems: lines, lineItemsComplete: true, pagesScanned: 2, pagesExpected: 3, totals: { ...emptyTotals, grossChargesCents: 6000 } }),
    )
    expect(of(r, 'arithmetic-total')).toHaveLength(0)
    expect(of(r, 'undetermined')[0].evidence.join(' ')).toContain('2 of 3 pages')
  })
})

describe('balance reconciliation', () => {
  const full: BillTotals = {
    ...emptyTotals,
    grossChargesCents: 10000,
    adjustmentsCents: 2000,
    insurancePaymentsCents: 5000,
    patientPaymentsCents: 1000,
    creditsCents: 0,
    balanceCents: 2000,
  }

  it('passes when the balance reconciles', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: full }))
    expect(of(r, 'balance-reconciliation')[0]?.label).toBe('Arithmetic check passed')
  })

  it('flags a mismatch when every component was provided', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: { ...full, balanceCents: 2500 } }))
    const f = of(r, 'balance-reconciliation')[0]
    expect(f.label).toBe('Potential inconsistency')
    expect(f.severity).toBe('low')
    expect(f.evidence.join(' ')).toContain('Expected balance: $20.00')
  })

  it('does not flag when a component is missing', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: { ...full, creditsCents: null, balanceCents: 2500 } }))
    expect(of(r, 'balance-reconciliation')).toHaveLength(0)
    expect(of(r, 'undetermined').some((f) => f.title.includes('reconciled'))).toBe(true)
  })

  it('includes a previous balance', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: { ...full, previousBalanceCents: 1000, balanceCents: 3000 } }))
    expect(of(r, 'balance-reconciliation')[0]?.label).toBe('Arithmetic check passed')
  })

  it('does not confirm results from totals marked Needs review', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: { ...full, balanceCents: 2500 }, unreadableFields: ['balanceCents'] }))
    expect(of(r, 'balance-reconciliation')).toHaveLength(0)
  })
})

describe('possible duplicates', () => {
  const lab = (o: Partial<LineItem> = {}) => item({ description: 'Lab panel', amountCents: 4500, code: '80053', ...o })

  it('flags same description, amount, code and date', () => {
    const r = analyzeBill(bill({ lineItems: [lab(), lab()] }))
    const f = of(r, 'possible-duplicate')
    expect(f).toHaveLength(1)
    expect(f[0].label).toBe('Possible duplicate — verify')
    expect(f[0].severity).toBe('medium')
    expect(f[0].references).toHaveLength(2)
  })

  it('groups three matches into one finding', () => {
    const r = analyzeBill(bill({ lineItems: [lab(), lab(), lab()] }))
    expect(of(r, 'possible-duplicate')[0].references).toHaveLength(3)
  })

  it('does not flag the same charge on different dates', () => {
    const r = analyzeBill(bill({ lineItems: [lab({ serviceDate: '2026-03-01' }), lab({ serviceDate: '2026-03-02' })] }))
    expect(of(r, 'possible-duplicate')).toHaveLength(0)
  })

  it('does not flag different billing codes', () => {
    const r = analyzeBill(bill({ lineItems: [lab({ code: '80053' }), lab({ code: '80048' })] }))
    expect(of(r, 'possible-duplicate')).toHaveLength(0)
  })

  it('flags undated matches only at low confidence', () => {
    const r = analyzeBill(bill({ lineItems: [lab({ serviceDate: null }), lab({ serviceDate: null })] }))
    const f = of(r, 'possible-duplicate')[0]
    expect(f.severity).toBe('low')
    expect(f.confidence).toBe('low')
  })

  it('ignores zero amounts and lines needing review', () => {
    const r = analyzeBill(bill({ lineItems: [lab({ amountCents: 0 }), lab({ amountCents: 0 }), lab({ needsReview: true }), lab({ needsReview: true })] }))
    expect(of(r, 'possible-duplicate')).toHaveLength(0)
  })
})

describe('other checks', () => {
  it('reports missing line items honestly', () => {
    const r = analyzeBill(bill())
    expect(r.findings[0].label).toBe('Unable to determine from this bill')
    expect(r.attentionCount).toBe(0)
  })

  it('asks about missing service dates', () => {
    const r = analyzeBill(bill({ lineItems: [item({ serviceDate: null })] }))
    expect(of(r, 'missing-dates')[0]?.severity).toBe('low')
  })

  it('flags a positive charge with zero quantity as needing clarification', () => {
    const r = analyzeBill(bill({ lineItems: [item({ quantity: 0, amountCents: 2500 })] }))
    expect(of(r, 'unusual-quantity')[0]?.label).toBe('Needs clarification')
  })

  it('adds an EOB reminder without claiming a comparison was made', () => {
    const r = analyzeBill(bill({ lineItems: [item()], totals: { ...emptyTotals, insurancePaymentsCents: 5000 } }))
    const f = of(r, 'eob-compare')[0]
    expect(f.severity).toBe('info')
    expect(f.limitations).toContain('does not read or compare EOBs')
  })

  it('does not invent findings for a clean bill', () => {
    const r = analyzeBill(
      bill({
        lineItemsComplete: true,
        lineItems: [
          item({ description: 'Visit', quantity: 1, unitCents: 12000, amountCents: 12000 }),
          item({ description: 'Lab', quantity: 2, unitCents: 1500, amountCents: 3000 }),
        ],
        totals: { ...emptyTotals, grossChargesCents: 15000, balanceCents: 15000 },
      }),
    )
    expect(r.attentionCount).toBe(0)
    expect(r.coverage).toBe('full')
    expect(r.findings.every((f) => f.severity === 'info')).toBe(true)
  })

  it('orders findings by severity', () => {
    const r = analyzeBill(
      bill({
        lineItems: [item({ serviceDate: null }), item({ description: 'Big', quantity: 1, unitCents: 50000, amountCents: 1000 })],
      }),
    )
    const order = r.findings.map((f) => f.severity)
    expect(order[0]).toBe('high')
    expect(order).toEqual([...order].sort((a, b) => ['info', 'low', 'medium', 'high'].indexOf(b) - ['info', 'low', 'medium', 'high'].indexOf(a)))
  })
})
