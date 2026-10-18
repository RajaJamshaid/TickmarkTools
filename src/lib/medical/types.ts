import type { Cents } from './money'

export interface LineItem {
  id: string
  /** 1-based page the line was read from, or null if unknown. */
  page: number | null
  description: string
  /** Billing code exactly as entered/read (CPT/HCPCS/etc). Never interpreted or looked up. */
  code: string | null
  /** ISO date (yyyy-mm-dd) or null if not shown/unreadable. */
  serviceDate: string | null
  quantity: number | null
  unitCents: Cents | null
  amountCents: Cents | null
  /** True when the value was unreadable or uncertain. Such lines are excluded from confirmed checks. */
  needsReview: boolean
}

export type TotalsKey =
  | 'grossChargesCents'
  | 'adjustmentsCents'
  | 'insurancePaymentsCents'
  | 'patientPaymentsCents'
  | 'creditsCents'
  | 'previousBalanceCents'
  | 'balanceCents'

/** null = not shown on the bill / not provided. Reductions are amounts that reduce the balance. */
export type BillTotals = Record<TotalsKey, Cents | null>

export interface BillData {
  provider: string | null
  statementDate: string | null
  pagesScanned: number
  /** How many pages the bill has, if the user said so. */
  pagesExpected: number | null
  /** User confirmed that every line item on the bill was entered. */
  lineItemsComplete: boolean
  /** Totals fields marked unreadable/uncertain. */
  unreadableFields: readonly TotalsKey[]
  lineItems: LineItem[]
  totals: BillTotals
}

export type Severity = 'high' | 'medium' | 'low' | 'info'

export type FindingKind =
  | 'arithmetic-line'
  | 'arithmetic-total'
  | 'balance-reconciliation'
  | 'possible-duplicate'
  | 'unusual-quantity'
  | 'missing-dates'
  | 'eob-compare'
  | 'undetermined'

export type FindingLabel =
  | 'Potential inconsistency'
  | 'Possible duplicate — verify'
  | 'Needs clarification'
  | 'Arithmetic check passed'
  | 'Unable to determine from this bill'

export interface Finding {
  id: string
  kind: FindingKind
  label: FindingLabel
  title: string
  severity: Severity
  /** Facts taken from the bill as entered, including the calculations used. */
  evidence: string[]
  references: { page: number | null; lineItemId: string }[]
  whyItMatters: string
  missing: string[]
  /** Suggested question for the billing department. Empty for passed checks. */
  question: string
  confidence: 'high' | 'medium' | 'low'
  limitations: string
}

export interface AnalysisResult {
  findings: Finding[]
  /** Findings above 'info' severity: items worth verifying. */
  attentionCount: number
  /** Names of the checks that actually ran. */
  checksRun: string[]
  /** 'partial' when pages, line items, or values were missing or uncertain. */
  coverage: 'full' | 'partial'
}
