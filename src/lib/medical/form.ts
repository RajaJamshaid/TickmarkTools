import { parseMoneyToCents, parseQuantity } from './money'
import { MAX_PAGES } from './pages'
import type { BillData, BillTotals, LineItem, TotalsKey } from './types'

/** Where a value came from when it was read from a scan. Scanned values start unchecked. */
export interface FieldOrigin {
  page: number | null
  /** The exact text the reader produced for this line. */
  raw: string
  /** Lowest word confidence on the line (0-100), or null if unavailable. */
  confidence: number | null
  /** True once the user has confirmed or edited the value. Unchecked values are never treated as verified. */
  checked: boolean
}

/** Below this reader confidence a value is called out as low. Advisory only. */
export const LOW_CONFIDENCE = 80

export interface LineItemForm {
  id: string
  description: string
  code: string
  serviceDate: string
  quantity: string
  unit: string
  amount: string
  origin?: FieldOrigin
}

export type MoneyFieldKey = 'gross' | 'adjustments' | 'insurance' | 'patient' | 'credits' | 'previous' | 'balance'

export interface BillForm {
  provider: string
  statementDate: string
  gross: string
  adjustments: string
  insurance: string
  patient: string
  credits: string
  previous: string
  balance: string
  lineItemsComplete: boolean
  pagesExpected: string
  items: LineItemForm[]
  /** Origins for scanned totals, keyed by field name (money keys and 'statementDate'). */
  fieldOrigins: Partial<Record<string, FieldOrigin>>
}

export const MONEY_FIELDS: ReadonlyArray<{ key: MoneyFieldKey; totals: TotalsKey; label: string }> = [
  { key: 'gross', totals: 'grossChargesCents', label: 'Total charges' },
  { key: 'adjustments', totals: 'adjustmentsCents', label: 'Adjustments / discounts' },
  { key: 'insurance', totals: 'insurancePaymentsCents', label: 'Insurance payments' },
  { key: 'patient', totals: 'patientPaymentsCents', label: 'Patient payments' },
  { key: 'credits', totals: 'creditsCents', label: 'Credits' },
  { key: 'previous', totals: 'previousBalanceCents', label: 'Previous balance' },
  { key: 'balance', totals: 'balanceCents', label: 'Current balance' },
]

export const MAX_ITEMS = 200
export const MAX_TEXT = 120

export interface FormErrors {
  fields: Partial<Record<string, string>>
  items: Record<string, Partial<Record<'quantity' | 'unit' | 'amount' | 'serviceDate' | 'description', string>>>
}

let seq = 0
export const newItemForm = (): LineItemForm => ({ id: `row-${++seq}`, description: '', code: '', serviceDate: '', quantity: '', unit: '', amount: '' })

export const emptyForm = (): BillForm => ({
  provider: '',
  statementDate: '',
  gross: '',
  adjustments: '',
  insurance: '',
  patient: '',
  credits: '',
  previous: '',
  balance: '',
  lineItemsComplete: false,
  pagesExpected: '',
  items: [newItemForm()],
  fieldOrigins: {},
})

export function isValidIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return y >= 1990 && y <= 2100 && dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

export const isBlankRow = (r: LineItemForm): boolean =>
  !r.description.trim() && !r.code.trim() && !r.serviceDate.trim() && !r.quantity.trim() && !r.unit.trim() && !r.amount.trim()

const MONEY_ERROR = "Couldn't read this amount. Use a format like 125.40 (up to 2 decimals)."

export type BuildResult = { ok: true; bill: BillData } | { ok: false; errors: FormErrors }

/**
 * Converts what the user typed (or what OCR drafted) into BillData. Blank = not provided (null).
 * Anything that cannot be read exactly is an error, never a guess. A line with no amount, or a
 * scanned line the user has not checked, is kept but marked "needs review" so it is excluded from
 * confirmed checks. Scanned totals the user has not checked are reported as unreadable.
 */
export function buildBill(form: BillForm, pagesScanned: number): BuildResult {
  const errors: FormErrors = { fields: {}, items: {} }
  const unreadable: TotalsKey[] = []
  const totals: BillTotals = {
    grossChargesCents: null,
    adjustmentsCents: null,
    insurancePaymentsCents: null,
    patientPaymentsCents: null,
    creditsCents: null,
    previousBalanceCents: null,
    balanceCents: null,
  }

  for (const f of MONEY_FIELDS) {
    const raw = form[f.key]
    if (raw.trim() === '') continue
    const v = parseMoneyToCents(raw)
    if (v === null) {
      errors.fields[f.key] = MONEY_ERROR
      continue
    }
    totals[f.totals] = v
    const origin = form.fieldOrigins[f.key]
    if (origin && !origin.checked) unreadable.push(f.totals)
  }

  const statementDate = form.statementDate.trim()
  if (statementDate !== '' && !isValidIsoDate(statementDate)) errors.fields.statementDate = 'Enter a valid date.'
  if (form.provider.trim().length > MAX_TEXT) errors.fields.provider = `Keep this under ${MAX_TEXT} characters.`

  let pagesExpected: number | null = null
  if (form.pagesExpected.trim() !== '') {
    const p = form.pagesExpected.trim()
    if (/^\d+$/.test(p) && Number(p) >= 1 && Number(p) <= MAX_PAGES) pagesExpected = Number(p)
    else errors.fields.pagesExpected = `Enter a whole number from 1 to ${MAX_PAGES}.`
  }

  const rows = form.items.filter((r) => !isBlankRow(r))
  if (rows.length > MAX_ITEMS) errors.fields.items = `Up to ${MAX_ITEMS} line items are supported.`

  const lineItems: LineItem[] = []
  for (const row of rows) {
    const rowErrors: FormErrors['items'][string] = {}
    if (row.description.trim().length > MAX_TEXT) rowErrors.description = `Keep this under ${MAX_TEXT} characters.`
    const date = row.serviceDate.trim()
    if (date !== '' && !isValidIsoDate(date)) rowErrors.serviceDate = 'Enter a valid date.'

    let quantity: number | null = null
    if (row.quantity.trim() !== '') {
      quantity = parseQuantity(row.quantity)
      if (quantity === null) rowErrors.quantity = 'Use a number such as 1 or 2.5.'
    }
    let unitCents: number | null = null
    if (row.unit.trim() !== '') {
      unitCents = parseMoneyToCents(row.unit)
      if (unitCents === null) rowErrors.unit = MONEY_ERROR
    }
    let amountCents: number | null = null
    if (row.amount.trim() !== '') {
      amountCents = parseMoneyToCents(row.amount)
      if (amountCents === null) rowErrors.amount = MONEY_ERROR
    }
    if (Object.keys(rowErrors).length > 0) {
      errors.items[row.id] = rowErrors
      continue
    }
    const unchecked = !!row.origin && !row.origin.checked
    lineItems.push({
      id: row.id,
      page: row.origin?.page ?? null,
      description: row.description.trim(),
      code: row.code.trim() === '' ? null : row.code.trim(),
      serviceDate: date === '' ? null : date,
      quantity,
      unitCents,
      amountCents,
      needsReview: amountCents === null || unchecked,
    })
  }

  if (Object.keys(errors.fields).length > 0 || Object.keys(errors.items).length > 0) return { ok: false, errors }
  return {
    ok: true,
    bill: {
      provider: form.provider.trim() === '' ? null : form.provider.trim(),
      statementDate: statementDate === '' ? null : statementDate,
      pagesScanned,
      pagesExpected,
      lineItemsComplete: form.lineItemsComplete,
      unreadableFields: unreadable,
      lineItems,
      totals,
    },
  }
}
