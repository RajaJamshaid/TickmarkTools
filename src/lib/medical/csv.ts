import type { BillData, Finding } from './types'
import { centsToInput } from './moneyInput'

/**
 * CSV export with spreadsheet-formula protection: any cell that starts like a formula
 * (= + - @, after optional whitespace) is prefixed with an apostrophe so it is read as text.
 * Plain numbers are left untouched so negative amounts stay numeric.
 */

const NUMERIC = /^-?\d+(\.\d+)?$/

export function csvCell(value: string): string {
  let v = value.replace(/\r?\n|\r/g, ' ')
  if (!NUMERIC.test(v) && /^\s*[=+\-@]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

export const toCsv = (rows: readonly (readonly string[])[]): string => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'

const money = (c: number | null): string => (c === null ? '' : centsToInput(c))

export function lineItemsCsv(bill: BillData): string {
  return toCsv([
    ['Page', 'Service date', 'Code', 'Description', 'Quantity', 'Unit price', 'Amount', 'Needs review'],
    ...bill.lineItems.map((i) => [
      i.page === null ? '' : String(i.page),
      i.serviceDate ?? '',
      i.code ?? '',
      i.description,
      i.quantity === null ? '' : String(i.quantity),
      money(i.unitCents),
      money(i.amountCents),
      i.needsReview ? 'yes' : 'no',
    ]),
  ])
}

export function findingsCsv(findings: readonly Finding[]): string {
  return toCsv([
    ['Severity', 'Label', 'Title', 'Evidence', 'Question to ask', 'Confidence', 'Limitations'],
    ...findings.map((f) => [f.severity, f.label, f.title, f.evidence.join(' | '), f.question, f.confidence, f.limitations]),
  ])
}
