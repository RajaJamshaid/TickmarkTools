import type { Finding, LineItem, Severity } from '../../lib/medical/types'

const CHIP: Record<Severity, string> = {
  high: 'bg-rose-100 text-rose-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-sky-100 text-sky-800',
  info: 'bg-slate-100 text-slate-700',
}

interface Props {
  findings: Finding[]
  lineItems: LineItem[]
  /** Scrolls to and highlights a line in the charge table. */
  onJump: (lineItemId: string) => void
}

function FindingCard({ f, lineItems, onJump }: { f: Finding; lineItems: LineItem[]; onJump: Props['onJump'] }) {
  const passed = f.label === 'Arithmetic check passed'
  const refs = f.references.filter((r) => lineItems.some((i) => i.id === r.lineItemId)).slice(0, 8)
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${passed ? 'bg-emerald-100 text-emerald-800' : CHIP[f.severity]}`}>{f.label}</span>
        {!passed && <span className="text-xs uppercase tracking-wide text-slate-500">Severity: {f.severity}</span>}
      </div>
      <h4 className="mt-2 font-heading text-base font-semibold text-navy">{f.title}</h4>

      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence from your entries</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 font-mono text-xs text-slate-700">
        {f.evidence.map((e, i) => (
          <li key={i} className="break-words">
            {e}
          </li>
        ))}
      </ul>

      {refs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {refs.map((r) => {
            const item = lineItems.find((i) => i.id === r.lineItemId)
            const name = item?.description.trim() || 'Unlabeled line'
            return (
              <button
                key={r.lineItemId}
                type="button"
                onClick={() => onJump(r.lineItemId)}
                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-navy hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
              >
                Show line: {name}
                {r.page !== null ? ` (page ${r.page})` : ''}
              </button>
            )
          })}
        </div>
      )}

      <p className="mt-3 text-sm text-slate-600">{f.whyItMatters}</p>
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

export default function FindingsList({ findings, lineItems, onJump }: Props) {
  return (
    <ul className="space-y-3">
      {findings.map((f) => (
        <FindingCard key={f.id} f={f} lineItems={lineItems} onJump={onJump} />
      ))}
    </ul>
  )
}
