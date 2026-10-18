import { multiplyCents, parseMoneyToCents } from './money'
import { centsToInput } from './moneyInput'
import { isBlankRow, isValidIsoDate, newItemForm } from './form'
import type { BillForm, FieldOrigin, LineItemForm, MoneyFieldKey } from './form'
import type { OcrLine, OcrPageResult } from './ocr'

/**
 * Conservative, deterministic parser that turns OCR lines into DRAFT form values.
 * Rules: only values that match a clear pattern are filled; anything ambiguous is left blank for the
 * user. No values are corrected, inferred, or looked up. Every drafted value carries its source line
 * and starts unchecked.
 */

export interface DraftValue {
  value: string
  origin: FieldOrigin
}

export interface ParsedItem {
  description: string
  code: string
  serviceDate: string
  quantity: string
  unit: string
  amount: string
  origin: FieldOrigin
}

export interface ParsedDraft {
  totals: Partial<Record<MoneyFieldKey, DraftValue>>
  statementDate: DraftValue | null
  items: ParsedItem[]
  /** Totals that appeared more than once with different values, so none was filled. */
  ambiguous: MoneyFieldKey[]
  linesRead: number
}

const MAX_DRAFT_ITEMS = 200
// Money needs two decimals, so dates, codes, and account numbers are not mistaken for amounts.
const MONEY = /\(?-?\$?\s?\d{1,3}(?:,\d{3})+\.\d{2}\)?|\(?-?\$?\s?\d+\.\d{2}\)?/g
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// Checked in order: the first match wins, so specific labels come before generic ones.
const LABELS: ReadonlyArray<{ key: MoneyFieldKey; test: RegExp }> = [
  { key: 'previous', test: /\b(previous|prior) balance\b|\bbalance forward\b/ },
  { key: 'gross', test: /\btotal (charges?|billed)\b|\bgross charges?\b|\bamount billed\b|\btotal amount billed\b/ },
  { key: 'insurance', test: /\binsurance (payments?|paid)\b|\bins\.? (payments?|paid)\b|\bplan paid\b|\bpayments? from insurance\b/ },
  { key: 'patient', test: /\bpatient (payments?|paid)\b|\bpayments? received\b|\byou paid\b/ },
  { key: 'adjustments', test: /\b(adjustments?|write-?offs?|discounts?)\b/ },
  { key: 'credits', test: /\bcredits?\b/ },
  { key: 'balance', test: /\b(balance due|amount due|current balance|total balance|patient balance|you owe|patient responsibility)\b/ },
]
const SUMMARY_WORDS = /\b(total|subtotal|balance|payments?|adjustments?|credits?)\b/i
const STATEMENT_DATE_LABEL = /statement date|billing date|invoice date|date of statement/

export function findDate(text: string): { iso: string; token: string } | null {
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text)
  if (iso && isValidIsoDate(iso[0])) return { iso: iso[0], token: iso[0] }

  // Numeric dates are read as month/day/year (US). The first number must be a valid month.
  const us = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/.exec(text)
  if (us) {
    const candidate = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
    if (isValidIsoDate(candidate)) return { iso: candidate, token: us[0] }
  }

  const named = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i.exec(text)
  if (named) {
    const month = MONTHS.indexOf(named[1].toLowerCase()) + 1
    const candidate = `${named[3]}-${String(month).padStart(2, '0')}-${named[2].padStart(2, '0')}`
    if (isValidIsoDate(candidate)) return { iso: candidate, token: named[0] }
  }
  return null
}

const linesFromText = (text: string): OcrLine[] =>
  text
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map((t) => ({ text: t, confidence: null }))

export function parseBillPages(pages: readonly OcrPageResult[]): ParsedDraft {
  const found = new Map<MoneyFieldKey, { cents: number; line: OcrLine; page: number }[]>()
  const items: ParsedItem[] = []
  let statementDate: DraftValue | null = null
  let linesRead = 0

  pages.forEach((pg, pageIndex) => {
    const page = pageIndex + 1
    for (const line of pg.lines ?? linesFromText(pg.text)) {
      const text = line.text.trim()
      if (text === '') continue
      linesRead++
      const lower = text.toLowerCase()
      const origin: FieldOrigin = { page, raw: text, confidence: line.confidence, checked: false }
      const tokens = (text.match(MONEY) ?? []).map((t) => t.trim())

      if (!statementDate && STATEMENT_DATE_LABEL.test(lower)) {
        const d = findDate(text)
        if (d) {
          statementDate = { value: d.iso, origin }
          continue
        }
      }

      const label = LABELS.find((l) => l.test.test(lower))
      if (label) {
        if (tokens.length > 0) {
          const cents = parseMoneyToCents(tokens[tokens.length - 1])
          if (cents !== null) {
            const list = found.get(label.key) ?? []
            list.push({ cents, line, page })
            found.set(label.key, list)
          }
        }
        continue
      }
      if (SUMMARY_WORDS.test(text) || tokens.length === 0 || items.length >= MAX_DRAFT_ITEMS) continue

      const date = findDate(text)
      const withoutMoney = tokens.reduce((acc, t) => acc.replace(t, ' '), text)
      const codeMatch = /\b(\d{5}|[A-V]\d{4})\b/.exec(withoutMoney.replace(date?.token ?? '', ' '))
      // A line is only treated as a charge if it has a date or a billing-code-like token plus an amount.
      if (!date && !codeMatch) continue

      const firstIdx = text.indexOf(tokens[0])
      const lastTok = tokens[tokens.length - 1]
      const before = text.slice(0, firstIdx)
      const after = text.slice(text.lastIndexOf(lastTok) + lastTok.length)

      let quantity = ''
      let unit = ''
      let amount = ''
      let beforeForDescription = before
      if (tokens.length === 1) {
        const cents = parseMoneyToCents(tokens[0])
        amount = cents === null ? '' : centsToInput(cents)
      } else {
        // Several amounts on one line: only accept quantity x unit = amount when it adds up exactly.
        const qm = /(?:^|\s)(\d{1,3}(?:\.\d{1,3})?)\s*$/.exec(before)
        const unitCents = parseMoneyToCents(tokens[0])
        const amountCents = parseMoneyToCents(lastTok)
        if (qm && unitCents !== null && amountCents !== null) {
          const product = multiplyCents(unitCents, Number(qm[1]))
          if (product && Math.abs(product.cents - amountCents) <= (product.exact ? 0 : 1)) {
            quantity = qm[1]
            unit = centsToInput(unitCents)
            amount = centsToInput(amountCents)
            beforeForDescription = before.replace(/(?:^|\s)\d{1,3}(?:\.\d{1,3})?\s*$/, ' ')
          }
        }
      }

      let description = `${beforeForDescription} ${after}`
      if (date) description = description.replace(date.token, ' ')
      if (codeMatch) description = description.replace(codeMatch[0], ' ')
      description = description
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s\-\u2013\u2014:.,]+|[\s\-\u2013\u2014:.,]+$/g, '')

      items.push({ description, code: codeMatch ? codeMatch[0] : '', serviceDate: date ? date.iso : '', quantity, unit, amount, origin })
    }
  })

  const totals: Partial<Record<MoneyFieldKey, DraftValue>> = {}
  const ambiguous: MoneyFieldKey[] = []
  for (const [key, list] of found) {
    if (new Set(list.map((x) => x.cents)).size > 1) {
      ambiguous.push(key)
      continue
    }
    const first = list[0]
    totals[key] = { value: centsToInput(first.cents), origin: { page: first.page, raw: first.line.text.trim(), confidence: first.line.confidence, checked: false } }
  }
  return { totals, statementDate, items, ambiguous, linesRead }
}

const MONEY_KEYS: readonly MoneyFieldKey[] = ['gross', 'adjustments', 'insurance', 'patient', 'credits', 'previous', 'balance']

/**
 * Merges a draft into the form without overwriting anything the user typed or checked. Earlier
 * unchecked drafts are replaced, so retrying OCR does not create duplicate rows.
 */
export function applyDraft(form: BillForm, draft: ParsedDraft): BillForm {
  const next: BillForm = { ...form, fieldOrigins: { ...form.fieldOrigins } }

  for (const key of MONEY_KEYS) {
    const d = draft.totals[key]
    if (!d) continue
    const origin = next.fieldOrigins[key]
    if (next[key].trim() === '' || (origin && !origin.checked)) {
      next[key] = d.value
      next.fieldOrigins[key] = d.origin
    }
  }
  if (draft.statementDate) {
    const origin = next.fieldOrigins.statementDate
    if (next.statementDate.trim() === '' || (origin && !origin.checked)) {
      next.statementDate = draft.statementDate.value
      next.fieldOrigins.statementDate = draft.statementDate.origin
    }
  }

  const kept = form.items.filter((r) => !isBlankRow(r) && !(r.origin && !r.origin.checked))
  const seen = new Set(kept.filter((r) => r.origin).map((r) => `${r.origin?.page}|${r.origin?.raw}`))
  const added: LineItemForm[] = []
  for (const it of draft.items) {
    const key = `${it.origin.page}|${it.origin.raw}`
    if (seen.has(key)) continue
    seen.add(key)
    added.push({ ...newItemForm(), description: it.description, code: it.code, serviceDate: it.serviceDate, quantity: it.quantity, unit: it.unit, amount: it.amount, origin: it.origin })
  }
  const items = [...kept, ...added]
  next.items = items.length > 0 ? items : [newItemForm()]
  return next
}
