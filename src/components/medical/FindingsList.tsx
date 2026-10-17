import type { AnalysisResult, BillData, Finding, Severity } from '../../lib/medical/types'
import { formatCents } from '../../lib/medical/money'

const CHIP: Record<Severity, string> = {
  high: 'bg-rose-100 text-rose-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-sky-100 text-sky-800',
  info: 'bg-slate-100 text-slate-700',
}

function FindingCard({ f }: { f: Finding }) {
  const passed = f.label === 'Arithmetic check passed'
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${passed ? 'bg-emerald-100 text-emerald-800' : CHIP[f.severity]}`}>{f.label}</span>
        {!passed && <span className="text-xs uppercase tracking-wide text-slate-500">Severity: {f.severity}</span>}
      </div>
      <h4 className="mt-2 font-heading text-base font-semibold text-navy">{f.title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs text-slate-700">
        {f.evidence.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-slate-600">{f.whyItMatters}</p>
      {f.missing.length > 0 && <p className="mt-2 text-sm text-slate-600">Missing or unknown: {f.missing.join('; ')}</p>}
      {f.question && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-navy">
          <span className="font-semibold">Question to ask: </span>
          {f.question}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Confidence: {f.confidence}. {f.limitations}
      </p>
    </li>
  )
}

export default function FindingsList({ bill, analysis }: { bill: BillData; analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-navy">{analysis.attentionCount}</span> item{analysis.attentionCount === 1 ? '' : 's'} worth verifying · {bill.pagesScanned} page{bill.pagesScanned === 1 ? '' : 's'} scanned ·{' '}
          {bill.lineItems.length} line item{bill.lineItems.length === 1 ? '' : 's'} entered
          {bill.totals.balanceCents !== null && <> · balance entered {formatCents(bill.totals.balanceCents)}</>}
        </p>
        <p className="mt-1">
          Coverage: <span className="font-semibold">{analysis.coverage === 'full' ? 'all entered values were checkable' : 'partial — some checks could not run'}</span>
        </p>
      </div>
      {analysis.attentionCount === 0 && (
        <p className="text-sm text-slate-600">No inconsistencies were found by the checks that could run. This does not mean the bill is correct. It means these checks found nothing to question.</p>
      )}
      <ul className="space-y-3">
        {analysis.findings.map((f) => (
          <FindingCard key={f.id} f={f} />
        ))}
      </ul>
      <p className="text-xs text-slate-500">Basic results preview. The full report, billing-inquiry letter, and export are coming in the next phase. These checks identify items to verify. They cannot prove an error, and nothing here guarantees a reduction.</p>
    </div>
  )
}
