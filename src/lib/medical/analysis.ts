import { formatCents, multiplyCents } from './money'
import type { AnalysisResult, BillData, Finding, LineItem, Severity } from './types'

/**
 * Transparent severity rule for numeric discrepancies:
 *   difference >= $100 -> high, >= $10 -> medium, otherwise low.
 * Duplicates and clarification items use fixed severities documented where they are created.
 */
export const MEDIUM_DIFFERENCE_CENTS = 1000
export const HIGH_DIFFERENCE_CENTS = 10000

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1, info: 0 }

export function severityForDifference(diffCents: number): Severity {
  const a = Math.abs(diffCents)
  if (a >= HIGH_DIFFERENCE_CENTS) return 'high'
  if (a >= MEDIUM_DIFFERENCE_CENTS) return 'medium'
  return 'low'
}

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const nameOf = (i: LineItem): string => i.description.trim() || 'Unlabeled line item'
const refOf = (i: LineItem) => ({ page: i.page, lineItemId: i.id })
const pageNote = (i: LineItem): string => (i.page === null ? '' : ` (page ${i.page})`)

type Draft = Omit<Finding, 'id' | 'references' | 'missing'> & Partial<Pick<Finding, 'references' | 'missing'>>

/**
 * Deterministic, rules-based analysis. Works only from the values provided; it never infers prices,
 * coverage rules, or code meanings, and it does not call any AI or network service.
 */
export function analyzeBill(bill: BillData): AnalysisResult {
  const findings: Finding[] = []
  const checksRun: string[] = []
  let seq = 0
  const add = (d: Draft): void => {
    findings.push({ ...d, references: d.references ?? [], missing: d.missing ?? [], id: `${d.kind}-${++seq}` })
  }

  const items = bill.lineItems
  const t = bill.totals
  const unreadable = new Set(bill.unreadableFields)
  const partialCapture = bill.pagesExpected !== null && bill.pagesScanned < bill.pagesExpected
  const itemsComplete = bill.lineItemsComplete && !partialCapture
  const itemsHaveGaps = items.some((i) => i.needsReview || i.amountCents === null)

  // 0. Nothing to check
  if (items.length === 0) {
    add({
      kind: 'undetermined',
      label: 'Unable to determine from this bill',
      title: 'No line items were provided',
      severity: 'info',
      evidence: ['No line items were entered, so line-level checks were not run.'],
      whyItMatters: 'Charges cannot be reviewed without line items.',
      missing: ['Itemized line items from the bill'],
      question: 'Can you send me an itemized statement listing each charge, date of service, and billing code?',
      confidence: 'low',
      limitations: 'A summary bill without line items limits what can be checked.',
    })
  }

  // 1. Line arithmetic: quantity x unit price vs amount
  let linePassed = 0
  let lineChecked = 0
  for (const item of items) {
    if (item.needsReview || item.quantity === null || item.unitCents === null || item.amountCents === null) continue
    const product = multiplyCents(item.unitCents, item.quantity)
    if (!product) continue
    lineChecked++
    const diff = item.amountCents - product.cents
    if (Math.abs(diff) <= (product.exact ? 0 : 1)) {
      linePassed++
      continue
    }
    add({
      kind: 'arithmetic-line',
      label: 'Potential inconsistency',
      title: `Amount does not match quantity × unit price: ${nameOf(item)}`,
      severity: severityForDifference(diff),
      evidence: [
        `${item.quantity} × ${formatCents(item.unitCents)} = ${formatCents(product.cents)}`,
        `Amount shown: ${formatCents(item.amountCents)}${pageNote(item)}`,
        `Difference: ${formatCents(diff)}`,
      ],
      references: [refOf(item)],
      whyItMatters:
        'The amount differs from quantity × unit price as entered. This can happen when a fee, discount, or modifier is applied that is not shown on the line, or when a number was misread.',
      missing: ['Any fee, discount, or modifier applied to this line that is not shown'],
      question: `Can you explain how the amount for "${nameOf(item)}" was calculated from its quantity and unit price?`,
      confidence: 'medium',
      limitations: 'Based only on the values entered. A mistyped or misread number can cause this.',
    })
  }
  if (lineChecked > 0) checksRun.push('line-quantity-times-price')
  if (linePassed > 0) {
    add({
      kind: 'arithmetic-line',
      label: 'Arithmetic check passed',
      title: 'Quantity × unit price matched the amount on checked lines',
      severity: 'info',
      evidence: [`${linePassed} of ${lineChecked} lines with a quantity and unit price matched the amount shown (within 1 cent when rounding was needed).`],
      whyItMatters: 'No inconsistency was found by this check.',
      question: '',
      confidence: 'medium',
      limitations: 'Only lines that had a quantity, unit price, and amount could be checked.',
    })
  }

  // 2. Sum of line items vs total charges
  const gross = t.grossChargesCents
  if (gross !== null && items.length > 0) {
    const reasons: string[] = []
    if (!itemsComplete) {
      reasons.push(
        partialCapture
          ? `Only ${bill.pagesScanned} of ${bill.pagesExpected ?? '?'} pages were scanned, so some line items may be missing.`
          : 'It was not confirmed that every line item on the bill was entered.',
      )
    }
    if (itemsHaveGaps) reasons.push('Some line items have no amount or are marked "Needs review".')
    if (unreadable.has('grossChargesCents')) reasons.push('The total charges value is marked "Needs review".')
    if (reasons.length > 0) {
      add({
        kind: 'undetermined',
        label: 'Unable to determine from this bill',
        title: 'Line items could not be compared with total charges',
        severity: 'info',
        evidence: [`Total charges shown: ${formatCents(gross)}`, ...reasons],
        whyItMatters: 'A mismatch cannot be confirmed when line items may be incomplete or uncertain.',
        missing: ['A complete, confirmed list of line items'],
        question: '',
        confidence: 'low',
        limitations: 'Confirm that all line items are entered and readable to enable this check.',
      })
    } else {
      checksRun.push('line-items-vs-total-charges')
      const sum = items.reduce((acc, i) => acc + (i.amountCents ?? 0), 0)
      const diff = sum - gross
      const evidence = [`Sum of ${items.length} line items: ${formatCents(sum)}`, `Total charges shown: ${formatCents(gross)}`]
      if (diff === 0) {
        add({
          kind: 'arithmetic-total',
          label: 'Arithmetic check passed',
          title: 'Line items add up to the total charges',
          severity: 'info',
          evidence,
          whyItMatters: 'No inconsistency was found by this check.',
          question: '',
          confidence: 'medium',
          limitations: 'Assumes every line item on the bill was entered correctly.',
        })
      } else {
        add({
          kind: 'arithmetic-total',
          label: 'Potential inconsistency',
          title: 'Line items do not add up to the total charges',
          severity: severityForDifference(diff),
          evidence: [...evidence, `Difference: ${formatCents(diff)}`],
          references: items.map(refOf),
          whyItMatters: 'The visible line items and the stated total differ. A line may be missing, misread, or included in the total under another name.',
          missing: ['Any line item or fee included in the total but not entered'],
          question: 'Can you provide an itemized statement that adds up to the total charges shown?',
          confidence: 'medium',
          limitations: 'Depends on every line item having been entered exactly as shown on the bill.',
        })
      }
    }
  }

  // 3. Balance reconciliation
  const balance = t.balanceCents
  if (gross !== null && balance !== null) {
    const prev = t.previousBalanceCents ?? 0
    const parts: { name: string; value: number | null; key: 'adjustmentsCents' | 'insurancePaymentsCents' | 'patientPaymentsCents' | 'creditsCents' }[] = [
      { name: 'adjustments', value: t.adjustmentsCents, key: 'adjustmentsCents' },
      { name: 'insurance payments', value: t.insurancePaymentsCents, key: 'insurancePaymentsCents' },
      { name: 'patient payments', value: t.patientPaymentsCents, key: 'patientPaymentsCents' },
      { name: 'credits', value: t.creditsCents, key: 'creditsCents' },
    ]
    const known = parts.filter((p) => p.value !== null)
    const missingNames = parts.filter((p) => p.value === null).map((p) => p.name)
    const unreadableInvolved =
      unreadable.has('grossChargesCents') || unreadable.has('balanceCents') || unreadable.has('previousBalanceCents') || known.some((p) => unreadable.has(p.key))
    const reductions = known.reduce((acc, p) => acc + Math.abs(p.value ?? 0), 0)
    const expected = gross + prev - reductions
    const diff = balance - expected
    const evidence = [`Total charges: ${formatCents(gross)}`]
    if (t.previousBalanceCents !== null) evidence.push(`Previous balance: ${formatCents(prev)}`)
    for (const p of known) evidence.push(`Less ${p.name}: ${formatCents(Math.abs(p.value ?? 0))}`)
    evidence.push(`Expected balance: ${formatCents(expected)}`, `Balance shown: ${formatCents(balance)}`)
    checksRun.push('balance-reconciliation')

    if (diff === 0 && !unreadableInvolved) {
      add({
        kind: 'balance-reconciliation',
        label: 'Arithmetic check passed',
        title: 'Balance matches charges, adjustments, payments, and credits',
        severity: 'info',
        evidence,
        whyItMatters: 'No inconsistency was found by this check.',
        missing: missingNames.map((n) => `${n} not provided`),
        question: '',
        confidence: missingNames.length === 0 ? 'medium' : 'low',
        limitations: 'Adjustments, payments, and credits are treated as amounts that reduce the balance.',
      })
    } else if (diff !== 0 && (missingNames.length > 0 || unreadableInvolved)) {
      add({
        kind: 'undetermined',
        label: 'Unable to determine from this bill',
        title: 'Balance could not be reconciled',
        severity: 'info',
        evidence: [...evidence, `Difference: ${formatCents(diff)}`],
        whyItMatters: 'The balance differs from the calculation, but values are missing or uncertain, so a discrepancy cannot be confirmed.',
        missing: [...missingNames.map((n) => `${n} not provided`), ...(unreadableInvolved ? ['Some totals are marked "Needs review"'] : [])],
        question: '',
        confidence: 'low',
        limitations: 'Provide every adjustment, payment, and credit shown on the bill to enable this check.',
      })
    } else if (diff !== 0) {
      add({
        kind: 'balance-reconciliation',
        label: 'Potential inconsistency',
        title: 'Balance does not match charges, adjustments, payments, and credits',
        severity: severityForDifference(diff),
        evidence: [...evidence, `Difference: ${formatCents(diff)}`],
        whyItMatters: 'The balance shown differs from what the entered amounts add up to. Late fees, interest, or other items not entered here could explain it.',
        missing: ['Any fee, interest, or prior balance not entered'],
        question: 'Can you provide a breakdown showing how the current balance was calculated from charges, adjustments, payments, and credits?',
        confidence: 'medium',
        limitations: 'Adjustments, payments, and credits are treated as amounts that reduce the balance. Bills may include items not entered here.',
      })
    }
  }

  // 4. Possible duplicates (cautious)
  const eligible = items.filter((i) => !i.needsReview && i.amountCents !== null && i.amountCents !== 0 && normalize(i.description) !== '')
  if (eligible.length >= 2) checksRun.push('possible-duplicates')
  const groups = new Map<string, LineItem[]>()
  for (const i of eligible) {
    const key = [normalize(i.description), i.amountCents, (i.code ?? '').trim().toUpperCase(), i.quantity ?? ''].join('|')
    const list = groups.get(key)
    if (list) list.push(i)
    else groups.set(key, [i])
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const byDate = new Map<string, LineItem[]>()
    const undated: LineItem[] = []
    for (const i of group) {
      if (!i.serviceDate) {
        undated.push(i)
        continue
      }
      const list = byDate.get(i.serviceDate)
      if (list) list.push(i)
      else byDate.set(i.serviceDate, [i])
    }
    // Different dates are NOT flagged: the same service can legitimately recur on different days.
    for (const [date, list] of byDate) {
      if (list.length < 2) continue
      const first = list[0]
      add({
        kind: 'possible-duplicate',
        label: 'Possible duplicate — verify',
        title: `Similar charge appears ${list.length} times on ${date}: ${nameOf(first)}`,
        severity: 'medium',
        evidence: list.map((i) => `${nameOf(i)}${i.code ? ` [${i.code}]` : ''} — ${formatCents(i.amountCents ?? 0)} on ${date}${pageNote(i)}`),
        references: list.map(refOf),
        whyItMatters: 'Same description, amount, code, and service date appear more than once. This may be a duplicate, or two separate services.',
        missing: ['Whether these were two distinct services or procedures'],
        question: `Were the ${list.length} charges for "${nameOf(first)}" on ${date} separate services? Please confirm each is correct.`,
        confidence: 'medium',
        limitations: 'Some services are legitimately billed more than once in a day (for example separate procedures or doses). Only the provider can confirm.',
      })
    }
    if (undated.length >= 2) {
      const first = undated[0]
      add({
        kind: 'possible-duplicate',
        label: 'Possible duplicate — verify',
        title: `Similar charge appears ${undated.length} times without a service date: ${nameOf(first)}`,
        severity: 'low',
        evidence: undated.map((i) => `${nameOf(i)}${i.code ? ` [${i.code}]` : ''} — ${formatCents(i.amountCents ?? 0)}, no service date${pageNote(i)}`),
        references: undated.map(refOf),
        whyItMatters: 'Matching charges without service dates cannot be told apart from legitimately repeated services.',
        missing: ['Dates of service for these lines'],
        question: `Can you provide the dates of service for each "${nameOf(first)}" charge so I can confirm they are separate?`,
        confidence: 'low',
        limitations: 'Low confidence: without dates this may simply be a repeated service.',
      })
    }
  }

  // 5. Unusual quantity
  for (const i of items) {
    if (i.needsReview || i.quantity === null || i.amountCents === null) continue
    if (i.quantity <= 0 && i.amountCents > 0) {
      add({
        kind: 'unusual-quantity',
        label: 'Needs clarification',
        title: `Charge with a quantity of ${i.quantity}: ${nameOf(i)}`,
        severity: 'low',
        evidence: [`Quantity ${i.quantity}, amount ${formatCents(i.amountCents)}${pageNote(i)}`],
        references: [refOf(i)],
        whyItMatters: 'A positive charge with a zero quantity is unusual and may be a misread or a flat fee.',
        missing: ['What the quantity represents for this line'],
        question: `What does the quantity of ${i.quantity} mean for "${nameOf(i)}", and why is it charged ${formatCents(i.amountCents)}?`,
        confidence: 'low',
        limitations: 'May be a flat fee or a misread value.',
      })
    }
  }

  // 6. Missing service dates
  const undatedItems = items.filter((i) => !i.needsReview && !i.serviceDate)
  if (undatedItems.length > 0) {
    add({
      kind: 'missing-dates',
      label: 'Needs clarification',
      title: `${undatedItems.length} line item${undatedItems.length === 1 ? ' has' : 's have'} no service date`,
      severity: 'low',
      evidence: undatedItems.map((i) => `${nameOf(i)}${pageNote(i)}`),
      references: undatedItems.map(refOf),
      whyItMatters: 'Dates of service are needed to tell repeated services apart and to compare with an insurer statement.',
      missing: ['Dates of service'],
      question: 'Can you provide an itemized statement showing the date of service for every charge?',
      confidence: 'medium',
      limitations: 'The date may exist on the bill but not have been entered.',
    })
  }

  // 7. Unreadable or incomplete lines
  const gapItems = items.filter((i) => i.needsReview || i.amountCents === null)
  if (gapItems.length > 0) {
    add({
      kind: 'undetermined',
      label: 'Unable to determine from this bill',
      title: `${gapItems.length} line item${gapItems.length === 1 ? ' is' : 's are'} unreadable or missing an amount`,
      severity: 'info',
      evidence: gapItems.map((i) => `${nameOf(i)}${pageNote(i)}`),
      references: gapItems.map(refOf),
      whyItMatters: 'These lines were left out of confirmed checks.',
      missing: ['A readable amount for each of these lines'],
      question: '',
      confidence: 'low',
      limitations: 'Correct or complete these lines to include them in the checks.',
    })
  }

  // 8. Insurer comparison reminder
  if ((t.insurancePaymentsCents ?? 0) !== 0 || (t.adjustmentsCents ?? 0) !== 0) {
    add({
      kind: 'eob-compare',
      label: 'Needs clarification',
      title: 'Compare insurer-related amounts with your Explanation of Benefits (EOB)',
      severity: 'info',
      evidence: [
        ...(t.insurancePaymentsCents !== null ? [`Insurance payments shown: ${formatCents(Math.abs(t.insurancePaymentsCents))}`] : []),
        ...(t.adjustmentsCents !== null ? [`Adjustments shown: ${formatCents(Math.abs(t.adjustmentsCents))}`] : []),
      ],
      whyItMatters: 'Insurer payments and adjustments on a provider bill should match what your insurer reports on the EOB.',
      missing: ['Your insurer’s EOB for this service'],
      question: 'Can you confirm the insurance payment and adjustment amounts match what my insurer reports on the EOB?',
      confidence: 'low',
      limitations: 'This tool does not read or compare EOBs yet. The comparison must be done by you.',
    })
  }

  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  const attentionCount = findings.filter((f) => f.severity !== 'info').length
  const coverage: AnalysisResult['coverage'] = itemsComplete && !itemsHaveGaps && unreadable.size === 0 ? 'full' : 'partial'
  return { findings, attentionCount, checksRun, coverage }
}
