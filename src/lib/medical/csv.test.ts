import { describe, expect, it } from 'vitest'
import { csvCell, findingsCsv, lineItemsCsv, toCsv } from './csv'
import type { BillData, Finding } from './types'

describe('csvCell', () => {
  it('quotes and escapes quotes', () => {
    expect(csvCell('He said "hi", ok')).toBe('"He said ""hi"", ok"')
  })
  it('flattens newlines', () => {
    expect(csvCell('a\nb\r\nc')).toBe('"a b c"')
  })
  it('neutralizes spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"')
    expect(csvCell('+1+1')).toBe('"\'+1+1"')
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"')
    expect(csvCell('  =1+1')).toBe('"\'  =1+1"')
    expect(csvCell('-cmd')).toBe('"\'-cmd"')
  })
  it('leaves plain numbers, including negatives, untouched', () => {
    expect(csvCell('-12.50')).toBe('"-12.50"')
    expect(csvCell('45.00')).toBe('"45.00"')
  })
})

describe('exports', () => {
  const bill: BillData = {
    provider: null,
    statementDate: null,
    pagesScanned: 1,
    pagesExpected: null,
    lineItemsComplete: false,
    unreadableFields: [],
    totals: { grossChargesCents: null, adjustmentsCents: null, insurancePaymentsCents: null, patientPaymentsCents: null, creditsCents: null, previousBalanceCents: null, balanceCents: null },
    lineItems: [{ id: 'a', page: 2, description: '=cmd|calc', code: '99213', serviceDate: '2026-03-01', quantity: 2, unitCents: 1000, amountCents: -2000, needsReview: true }],
  }

  it('writes line items with a header and protected cells', () => {
    const csv = lineItemsCsv(bill)
    const [header, row] = csv.trim().split('\r\n')
    expect(header).toBe('"Page","Service date","Code","Description","Quantity","Unit price","Amount","Needs review"')
    expect(row).toBe('"2","2026-03-01","99213","\'=cmd|calc","2","10.00","-20.00","yes"')
  })

  it('writes findings', () => {
    const f: Finding = {
      id: 'x',
      kind: 'undetermined',
      label: 'Unable to determine from this bill',
      title: 'T',
      severity: 'info',
      evidence: ['one', 'two'],
      references: [],
      whyItMatters: '',
      missing: [],
      question: '',
      confidence: 'low',
      limitations: 'L',
    }
    expect(findingsCsv([f]).trim().split('\r\n')[1]).toBe('"info","Unable to determine from this bill","T","one | two","","low","L"')
  })

  it('ends rows with CRLF', () => {
    expect(toCsv([['a']])).toBe('"a"\r\n')
  })
})
