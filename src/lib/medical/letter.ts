import { formatCents } from './money'
import type { AnalysisResult, BillData } from './types'

/**
 * Builds a neutral billing-inquiry letter from the analysis. It asks for clarification only: it does not
 * allege errors, fraud, or entitlement to a refund, and it never invents account details (those are
 * left as bracketed placeholders for the user to fill in).
 */
export function buildInquiryLetter(bill: BillData, analysis: AnalysisResult): string {
  const byId = new Map(bill.lineItems.map((i) => [i.id, i]))
  const describe = (id: string): string | null => {
    const i = byId.get(id)
    if (!i) return null
    const parts = [i.description.trim() || 'unlabeled line']
    if (i.serviceDate) parts.push(`date of service ${i.serviceDate}`)
    if (i.amountCents !== null) parts.push(formatCents(i.amountCents))
    return parts.join(', ')
  }
  const questions = analysis.findings.filter((f) => f.severity !== 'info' && f.question !== '')

  const out: string[] = []
  out.push('Subject: Request for an itemized statement and billing review', '')
  out.push(bill.provider ? `To the Billing Department at ${bill.provider},` : 'To the Billing Department,', '')
  out.push(`I am writing about my statement${bill.statementDate ? ` dated ${bill.statementDate}` : ''}. I would like to understand the charges and confirm that they are accurate.`, '')
  out.push('Account number: [your account number]', 'Patient name: [patient name]', 'Date(s) of service: [dates of service]', '')
  out.push('Please provide:')
  out.push('1. An itemized statement listing each charge with its date of service, billing code, quantity, and amount.')
  out.push('2. A breakdown showing how the current balance was calculated from charges, adjustments, insurance payments, patient payments, and credits.')
  if (analysis.findings.some((f) => f.kind === 'eob-compare')) {
    out.push('3. Confirmation that the insurance payments and adjustments on this statement match what my insurer reports on my Explanation of Benefits.')
  }
  if (questions.length > 0) {
    out.push('', 'I also have these specific questions:')
    questions.forEach((f, i) => {
      out.push(`${i + 1}. ${f.question}`)
      const refs = f.references
        .map((r) => describe(r.lineItemId))
        .filter((d): d is string => d !== null)
        .slice(0, 5)
      if (refs.length > 0) out.push(`   (Related line${refs.length > 1 ? 's' : ''}: ${refs.join('; ')})`)
    })
  }
  out.push('', 'These are requests for clarification based on the figures on my statement. I am not asserting that any charge is incorrect.')
  out.push('Please reply in writing. Thank you for your help.', '', 'Sincerely,', '[your name]', '[your contact information]')
  return out.join('\n')
}
