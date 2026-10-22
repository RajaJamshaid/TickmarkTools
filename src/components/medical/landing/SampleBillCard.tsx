import { SAMPLE_CHARGES, SAMPLE_DATE, SAMPLE_FLAGS, SAMPLE_PROVIDER, money, sampleTotal } from './sample'
import { badgeReview, card } from './ui'

/** Product-style preview of a bill review. Fictional data, labelled as an illustrative example. */
export default function SampleBillCard() {
  const flagged = SAMPLE_CHARGES.filter((c) => c.review).length
  const first = SAMPLE_FLAGS[0]

  return (
    <figure className="mx-auto w-full max-w-lg" aria-label="Illustrative example of a bill review">
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#EFEAE0] bg-[#FBFAF7] px-4 py-3">
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-[#E4DED0]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#E4DED0]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#E4DED0]" />
          </span>
          <span className="rounded-full border border-[#C9D8C8] bg-[#E6EDE4] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#2F5A4A]">
            Illustrative example
          </span>
        </div>

        <div className="p-5">
          <p className="text-xs text-[#5B647A]">
            {SAMPLE_PROVIDER} · {SAMPLE_DATE}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-b border-[#EFEAE0] pb-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Total billed</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-[#172033]">{money(sampleTotal())}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Charges reviewed</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-[#172033]">{SAMPLE_CHARGES.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Needs review</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-amber-800">{flagged}</dd>
            </div>
          </dl>

          <ul className="mt-3 divide-y divide-[#F0ECE3]">
            {SAMPLE_CHARGES.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-3 py-2.5 text-sm ${c.review ? 'border-l-2 border-amber-400 bg-amber-50/50 pl-3' : ''}`}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2 text-[#172033]">
                  {c.description}
                  {c.review && <span className={badgeReview}>Needs review</span>}
                </span>
                <span className="shrink-0 font-mono text-[#172033]">{money(c.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-xs font-semibold text-amber-900">Why this may need verification</p>
            <p className="mt-1 text-xs leading-relaxed text-[#46506A]">{first.why}</p>
          </div>

          <div className="mt-3 rounded-xl border border-[#E4DED0] bg-[#FBFAF7] p-3">
            <p className="text-xs font-semibold text-[#172033]">Question to ask the billing department</p>
            <p className="mt-1 text-xs leading-relaxed text-[#46506A]">“{first.question}”</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-[#5B647A]">
        Fictional sample data. Not from a real patient, insurer, or claim.
      </figcaption>
    </figure>
  )
}
