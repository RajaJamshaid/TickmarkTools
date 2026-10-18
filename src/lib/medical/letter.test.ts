import { describe, expect, it } from 'vitest'
import { analyzeBill } from './analysis'
import { buildInquiryLetter } from './letter'
import type { BillData, BillTotals, LineItem } from './types'

const totals: BillTotals = { grossChargesCents: null, adjustmentsCents: null, insurancePaymentsCents: null, patientPaymentsCents: null, creditsCents: null, previousBalanceCents: null, balanceCents: null }
const lab = (id: string): LineItem => ({ id, page: 1, description: 'Lab panel', code: '80053', serviceDate: '2026-03-01', quantity: null, unitCents: null, amountCents: 4500, needsReview: false })
const bill = (o: Partial<BillData> = {}): BillData => ({ provider: null, statementDate: null, pagesScanned: 1, pagesExpected: null, lineItemsComplete: false, unreadableFields: [], lineItems: [], totals, ...o })

describe('buildInquiryLetter', () => {
  it('asks for an itemized statement and uses placeholders for personal details', () => {
    const b = bill({ lineItems: [lab('a')] })
    const letter = buildInquiryLetter(b, analyzeBill(b))
    expect(letter).toContain('itemized statement')
    expect(letter).toContain('[your account number]')
    expect(letter).toContain('[patient name]')
    expect(letter).toContain('To the Billing Department,')
  })

  it('includes the provider and statement date only when entered', () => {
    const b = bill({ provider: 'Springfield Clinic', statementDate: '2026-03-15', lineItems: [lab('a')] })
    const letter = buildInquiryLetter(b, analyzeBill(b))
    expect(letter).toContain('To the Billing Department at Springfield Clinic,')
    expect(letter).toContain('dated 2026-03-15')
  })

  it('turns findings into specific questions that reference the lines', () => {
    const b = bill({ lineItems: [lab('a'), lab('b')] })
    const letter = buildInquiryLetter(b, analyzeBill(b))
    expect(letter).toContain('I also have these specific questions:')
    expect(letter).toContain('Lab panel')
    expect(letter).toContain('Related lines: Lab panel, date of service 2026-03-01, $45.00; Lab panel')
  })

  it('adds the EOB request when insurer amounts are present', () => {
    const b = bill({ lineItems: [lab('a')], totals: { ...totals, insurancePaymentsCents: 5000 } })
    expect(buildInquiryLetter(b, analyzeBill(b))).toContain('Explanation of Benefits')
  })

  it('omits the specific-questions section when there is nothing to ask', () => {
    const b = bill({ lineItems: [lab('a')] })
    expect(buildInquiryLetter(b, analyzeBill(b))).not.toContain('specific questions')
  })

  it('stays neutral: no fraud, refund, or savings language', () => {
    const b = bill({ lineItems: [lab('a'), lab('b')] })
    const letter = buildInquiryLetter(b, analyzeBill(b)).toLowerCase()
    for (const word of ['fraud', 'refund', 'overcharg', 'illegal', 'lawsuit', 'save']) expect(letter).not.toContain(word)
    expect(letter).toContain('not asserting that any charge is incorrect')
  })
})
