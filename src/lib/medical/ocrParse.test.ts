import { describe, expect, it } from 'vitest'
import { applyDraft, findDate, parseBillPages } from './ocrParse'
import { buildBill, emptyForm } from './form'
import type { OcrPageResult } from './ocr'

const page = (...texts: string[]): OcrPageResult => ({ text: texts.join('\n'), meanConfidence: null, lines: texts.map((text) => ({ text, confidence: null })) })

const SAMPLE = page(
  'Statement Date: 03/15/2026',
  '123 Main St Springfield 62704',
  '03/01/2026 99213 Office visit 1 150.00 150.00',
  '03/01/2026 80053 Lab panel 45.00',
  'Total Charges $195.00',
  'Insurance Payments (100.00)',
  'Adjustments 20.00',
  'Balance Due $75.00',
)

describe('findDate', () => {
  it('reads ISO, US numeric, and named dates', () => {
    expect(findDate('on 2026-03-01')?.iso).toBe('2026-03-01')
    expect(findDate('on 3/1/2026')?.iso).toBe('2026-03-01')
    expect(findDate('Mar 1, 2026')?.iso).toBe('2026-03-01')
  })
  it('rejects impossible dates instead of guessing', () => {
    expect(findDate('13/45/2026')).toBeNull()
    expect(findDate('25/12/2026')).toBeNull()
    expect(findDate('no date here')).toBeNull()
  })
})

describe('parseBillPages', () => {
  const draft = parseBillPages([SAMPLE])

  it('drafts totals from labelled lines', () => {
    expect(draft.totals.gross?.value).toBe('195.00')
    expect(draft.totals.insurance?.value).toBe('-100.00')
    expect(draft.totals.adjustments?.value).toBe('20.00')
    expect(draft.totals.balance?.value).toBe('75.00')
    expect(draft.totals.gross?.origin).toEqual({ page: 1, raw: 'Total Charges $195.00', confidence: null, checked: false })
  })

  it('reads the statement date', () => {
    expect(draft.statementDate?.value).toBe('2026-03-15')
  })

  it('drafts line items, with quantity and unit only when they add up', () => {
    expect(draft.items).toHaveLength(2)
    expect(draft.items[0]).toMatchObject({ serviceDate: '2026-03-01', code: '99213', description: 'Office visit', quantity: '1', unit: '150.00', amount: '150.00' })
    expect(draft.items[1]).toMatchObject({ code: '80053', description: 'Lab panel', quantity: '', unit: '', amount: '45.00' })
    expect(draft.items[0].origin.checked).toBe(false)
  })

  it('counts the lines it read', () => {
    expect(draft.linesRead).toBe(8)
  })

  it('does not treat undated, uncoded lines as charges', () => {
    expect(parseBillPages([page('Office visit 150.00')]).items).toHaveLength(0)
  })

  it('leaves the amount blank when several amounts do not reconcile', () => {
    const d = parseBillPages([page('03/01/2026 99213 Office visit 2 150.00 400.00')])
    expect(d.items[0].amount).toBe('')
    expect(d.items[0].unit).toBe('')
    expect(d.items[0].description).toContain('Office visit')
  })

  it('does not fill a total that appears with conflicting values', () => {
    const d = parseBillPages([page('Total Charges $100.00', 'Total Charges $200.00')])
    expect(d.totals.gross).toBeUndefined()
    expect(d.ambiguous).toEqual(['gross'])
  })

  it('fills a total repeated with the same value', () => {
    expect(parseBillPages([page('Total Charges $100.00'), page('Total Charges $100.00')]).totals.gross?.value).toBe('100.00')
  })

  it('records the page a value came from', () => {
    const d = parseBillPages([page('nothing here'), page('Balance Due $5.00')])
    expect(d.totals.balance?.origin.page).toBe(2)
  })

  it('invents nothing from prose', () => {
    const d = parseBillPages([page('Thank you for choosing our clinic.', 'Questions? Call us.')])
    expect(d.items).toHaveLength(0)
    expect(d.totals).toEqual({})
    expect(d.statementDate).toBeNull()
  })

  it('falls back to splitting raw text when lines are absent', () => {
    const d = parseBillPages([{ text: 'Balance Due $5.00\n', meanConfidence: null }])
    expect(d.totals.balance?.value).toBe('5.00')
  })

  it('carries line confidence to the draft', () => {
    const d = parseBillPages([{ text: '', meanConfidence: null, lines: [{ text: 'Balance Due $5.00', confidence: 55 }] }])
    expect(d.totals.balance?.origin.confidence).toBe(55)
  })
})

describe('applyDraft', () => {
  const draft = parseBillPages([SAMPLE])

  it('fills an empty form with unchecked drafts and replaces the blank starter row', () => {
    const f = applyDraft(emptyForm(), draft)
    expect(f.gross).toBe('195.00')
    expect(f.fieldOrigins.gross?.checked).toBe(false)
    expect(f.statementDate).toBe('2026-03-15')
    expect(f.items).toHaveLength(2)
  })

  it('never overwrites what the user already typed', () => {
    const f = applyDraft({ ...emptyForm(), gross: '300.00' }, draft)
    expect(f.gross).toBe('300.00')
    expect(f.fieldOrigins.gross).toBeUndefined()
  })

  it('does not duplicate rows when OCR is retried', () => {
    const once = applyDraft(emptyForm(), draft)
    expect(applyDraft(once, draft).items).toHaveLength(2)
  })

  it('keeps rows the user already checked, without duplicating them', () => {
    const once = applyDraft(emptyForm(), draft)
    const checked = { ...once, items: once.items.map((r, i) => (i === 0 && r.origin ? { ...r, origin: { ...r.origin, checked: true } } : r)) }
    const again = applyDraft(checked, draft)
    expect(again.items).toHaveLength(2)
    expect(again.items[0].origin?.checked).toBe(true)
  })

  it('feeds buildBill so unchecked scanned values are excluded from confirmed checks', () => {
    const r = buildBill(applyDraft(emptyForm(), draft), 1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.bill.lineItems.every((i) => i.needsReview)).toBe(true)
    expect(r.bill.lineItems[0].page).toBe(1)
    expect(r.bill.unreadableFields).toContain('grossChargesCents')
  })
})
