import { useMemo, useState } from 'react'
import { Copy, Download } from 'lucide-react'
import FindingsList from './FindingsList'
import { findingsCsv, lineItemsCsv } from '../../lib/medical/csv'
import { downloadText } from '../../lib/medical/download'
import { buildInquiryLetter } from '../../lib/medical/letter'
import { formatCents } from '../../lib/medical/money'
import type { AnalysisResult, BillData } from '../../lib/medical/types'

const btn =
  'inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand'

const CHECK_NAMES: Record<string, string> = {
  'line-quantity-times-price': 'Quantity × unit price on each line',
  'line-items-vs-total-charges': 'Line items added up vs. total charges',
  'balance-reconciliation': 'Balance vs. charges, adjustments, payments, and credits',
  'possible-duplicates': 'Possible duplicate charges',
}

interface Props {
  bill: BillData
  analysis: AnalysisResult
  onEdit: () => void
  onStartOver: () => void
}

type ExportKind = 'items' | 'findings'

export default function ResultsDashboard({ bill, analysis, onEdit, onStartOver }: Props) {
  const [highlight, setHighlight] = useState<string | null>(null)
  const [letter, setLetter] = useState(() => buildInquiryLetter(bill, analysis))
  const [letterStatus, setLetterStatus] = useState('')
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null)

  const flags = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const f of analysis.findings) {
      if (f.severity === 'info') continue
      for (const r of f.references) {
        const set = map.get(r.lineItemId) ?? new Set<string>()
        set.add(f.label)
        map.set(r.lineItemId, set)
      }
    }
    return map
  }, [analysis])

  const excluded = bill.lineItems.filter((i) => i.needsReview).length
  const questions = analysis.findings.filter((f) => f.severity !== 'info' && f.question !== '')

  const jumpTo = (id: string) => {
    setHighlight(id)
    const el = document.getElementById(`line-${id}`)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      setLetterStatus('Letter copied to your clipboard.')
    } catch {
      setLetterStatus('Copy failed. Select the text and copy it manually.')
    }
  }

  const runExport = () => {
    if (pendingExport === 'items') downloadText('tickmarktools-line-items.csv', lineItemsCsv(bill), 'text/csv;charset=utf-8')
    if (pendingExport === 'findings') downloadText('tickmarktools-findings.csv', findingsCsv(analysis.findings), 'text/csv;charset=utf-8')
    setPendingExport(null)
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="sum-title">
        <h3 id="sum-title" className="font-heading text-xl font-bold text-navy">
          Summary
        </h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['Provider / facility', bill.provider ?? 'Not entered'],
            ['Statement date', bill.statementDate ?? 'Not entered'],
            ['Current balance entered', bill.totals.balanceCents === null ? 'Not entered' : formatCents(bill.totals.balanceCents)],
            ['Pages scanned', String(bill.pagesScanned)],
            ['Items worth verifying', String(analysis.attentionCount)],
            ['Checks', analysis.coverage === 'full' ? 'All entered values were checkable' : 'Partial — some checks could not run'],
            ['Lines left out of confirmed checks', String(excluded)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-slate-200 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className="mt-0.5 font-semibold text-navy">{v}</dd>
            </div>
          ))}
        </dl>
        {bill.unreadableFields.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {bill.unreadableFields.length} total{bill.unreadableFields.length === 1 ? ' is' : 's are'} read from a scan and not yet checked, so comparisons using {bill.unreadableFields.length === 1 ? 'it' : 'them'} were not confirmed.
          </p>
        )}
        {analysis.attentionCount === 0 && (
          <p className="mt-3 text-sm text-slate-600">
            No inconsistencies were found by the checks that could run. This does not mean the bill is correct. It means these checks found nothing to question.
          </p>
        )}
      </section>

      <section aria-labelledby="charges-title">
        <h3 id="charges-title" className="font-heading text-xl font-bold text-navy">
          Charge review
        </h3>
        {bill.lineItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No line items were entered.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Line items with review flags</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {['Page', 'Date', 'Code', 'Description', 'Qty', 'Unit', 'Amount', 'Review'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bill.lineItems.map((i) => {
                  const labels = [...(flags.get(i.id) ?? [])]
                  return (
                    <tr key={i.id} id={`line-${i.id}`} tabIndex={-1} className={`border-t border-slate-100 align-top focus:outline-none ${highlight === i.id ? 'bg-cyan-50 ring-2 ring-inset ring-cyan-brand' : ''}`}>
                      <td className="px-3 py-2">{i.page ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{i.serviceDate ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{i.code ?? '—'}</td>
                      <td className="px-3 py-2">{i.description || 'Unlabeled line'}</td>
                      <td className="px-3 py-2">{i.quantity ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{i.unitCents === null ? '—' : formatCents(i.unitCents)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{i.amountCents === null ? '—' : formatCents(i.amountCents)}</td>
                      <td className="px-3 py-2 text-xs">
                        {i.needsReview && <span className="mr-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Needs review</span>}
                        {labels.map((l) => (
                          <span key={l} className="mr-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                            {l}
                          </span>
                        ))}
                        {!i.needsReview && labels.length === 0 && <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          "Needs review" lines are unchecked scanned values or lines with no amount. They are left out of confirmed checks. Checks that ran: {analysis.checksRun.length === 0 ? 'none' : analysis.checksRun.map((c) => CHECK_NAMES[c] ?? c).join('; ')}.
        </p>
      </section>

      <section aria-labelledby="findings-title">
        <h3 id="findings-title" className="font-heading text-xl font-bold text-navy">
          Findings
        </h3>
        <p className="mb-3 mt-1 text-sm text-slate-600">Ordered by severity. Each finding shows the evidence from your entries and what is not known.</p>
        <FindingsList findings={analysis.findings} lineItems={bill.lineItems} onJump={jumpTo} />
      </section>

      <section aria-labelledby="next-title">
        <h3 id="next-title" className="font-heading text-xl font-bold text-navy">
          Next steps
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Ask the billing department for an itemized statement showing the date, billing code, quantity, and amount of every charge.</li>
          <li>If your insurer sent an Explanation of Benefits (EOB), compare its payments and adjustments with this bill. This tool does not read EOBs.</li>
          <li>{questions.length > 0 ? 'Send the questions below, or the letter, to the billing department.' : 'There were no specific questions from the checks. You can still send the letter to request an itemized statement.'}</li>
        </ol>
        {questions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {questions.map((f) => (
              <li key={f.id} className="rounded-xl bg-slate-50 p-3 text-sm text-navy">
                {f.question}
              </li>
            ))}
          </ul>
        )}

        <h4 className="mt-6 font-heading text-base font-semibold text-navy">Billing inquiry letter</h4>
        <p className="mt-1 text-sm text-slate-600">A neutral draft you can edit. It asks for clarification and does not claim any charge is wrong. Fill in the bracketed details yourself.</p>
        <label htmlFor="letter" className="sr-only">
          Billing inquiry letter
        </label>
        <textarea id="letter" value={letter} onChange={(e) => setLetter(e.target.value)} rows={16} className="mt-3 w-full rounded-2xl border border-slate-300 bg-white p-3 font-mono text-xs text-navy focus:border-cyan-brand focus:outline-none focus:ring-2 focus:ring-cyan-brand/40" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" className={btn} onClick={copyLetter}>
            <Copy className="h-4 w-4" /> Copy letter
          </button>
          <button type="button" className={btn} onClick={() => downloadText('billing-inquiry-letter.txt', letter, 'text/plain;charset=utf-8')}>
            <Download className="h-4 w-4" /> Download as text
          </button>
          <span role="status" className="text-sm text-slate-600">
            {letterStatus}
          </span>
        </div>
      </section>

      <section aria-labelledby="export-title">
        <h3 id="export-title" className="font-heading text-xl font-bold text-navy">
          Export
        </h3>
        <p className="mt-1 text-sm text-slate-600">CSV files are created on your device. PDF export is not available yet.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className={btn} onClick={() => setPendingExport('items')} disabled={bill.lineItems.length === 0}>
            <Download className="h-4 w-4" /> Line items (CSV)
          </button>
          <button type="button" className={btn} onClick={() => setPendingExport('findings')}>
            <Download className="h-4 w-4" /> Findings (CSV)
          </button>
        </div>
        {pendingExport && (
          <div role="alertdialog" aria-labelledby="export-warn" className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <p id="export-warn">This file contains figures and descriptions from your medical bill, which is sensitive information. It is saved to your device, and anything you do with it afterwards is up to you.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className={btn} onClick={runExport}>
                Download anyway
              </button>
              <button type="button" className={btn} onClick={() => setPendingExport(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">These checks identify items to verify. They cannot prove an error, and nothing here guarantees a reduction or refund. Medical billing rules and coverage vary by provider, insurer, state, and plan.</p>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={btn} onClick={onEdit}>
          Edit entries
        </button>
        <button type="button" className={btn} onClick={onStartOver}>
          Start over and clear everything
        </button>
      </div>
    </div>
  )
}
