import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { SAMPLE_CHARGES, SAMPLE_FLAGS, money, sampleTotal } from './sample'
import { badgeReview, card, focus } from './ui'

const TABS = [
  { id: 'summary', label: 'Bill summary' },
  { id: 'flags', label: 'Review flags' },
  { id: 'question', label: 'Question to ask' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Lightweight demo on fictional data. It never reads, analyzes, or sends a real bill. */
export default function InteractiveDemo() {
  const [tab, setTab] = useState<TabId>('summary')
  const [flagIndex, setFlagIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const flag = SAMPLE_FLAGS[flagIndex]

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    setTab(TABS[next].id)
    refs.current[TABS[next].id]?.focus()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(flag.question)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] bg-[#FBFAF7] px-4 py-3">
        <div role="tablist" aria-label="Sample review sections" className="flex gap-1">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el
              }}
              role="tab"
              type="button"
              id={`demo-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`demo-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${focus} ${
                tab === t.id ? 'bg-[#146356] text-white' : 'text-[#46506A] hover:bg-[#F0ECE3]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="rounded-full border border-[#C9D8C8] bg-[#E6EDE4] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#2F5A4A]">
          Sample · fictional data
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {tab === 'summary' && (
          <div role="tabpanel" id="demo-panel-summary" aria-labelledby="demo-tab-summary">
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Total billed</dt>
                <dd className="mt-1 font-mono text-xl text-[#172033]">{money(sampleTotal())}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Charges</dt>
                <dd className="mt-1 font-mono text-xl text-[#172033]">{SAMPLE_CHARGES.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-[#5B647A]">Needs review</dt>
                <dd className="mt-1 font-mono text-xl text-amber-800">{SAMPLE_CHARGES.filter((c) => c.review).length}</dd>
              </div>
            </dl>
            <ul className="mt-4 divide-y divide-[#F0ECE3] border-t border-[#F0ECE3]">
              {SAMPLE_CHARGES.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex flex-wrap items-center gap-2 text-[#172033]">
                    {c.description}
                    {c.review && <span className={badgeReview}>Needs review</span>}
                  </span>
                  <span className="font-mono text-[#172033]">{money(c.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'flags' && (
          <div role="tabpanel" id="demo-panel-flags" aria-labelledby="demo-tab-flags" className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <ul className="space-y-2">
              {SAMPLE_FLAGS.map((f, i) => (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-pressed={flagIndex === i}
                    onClick={() => setFlagIndex(i)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${focus} ${
                      flagIndex === i ? 'border-[#146356] bg-[#EEF4F1] text-[#146356]' : 'border-[#E4DED0] bg-white text-[#172033] hover:border-[#CFC8B8]'
                    }`}
                  >
                    {f.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-[#E4DED0] bg-[#FBFAF7] p-4" aria-live="polite">
              <p className="font-heading text-base font-semibold text-[#172033]">{flag.title}</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#5B647A]">What we noticed</dt>
                  <dd className="mt-0.5 text-[#46506A]">{flag.noticed}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#5B647A]">Why it may need verification</dt>
                  <dd className="mt-0.5 text-[#46506A]">{flag.why}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#5B647A]">What to check</dt>
                  <dd className="mt-0.5 text-[#46506A]">{flag.verify}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {tab === 'question' && (
          <div role="tabpanel" id="demo-panel-question" aria-labelledby="demo-tab-question">
            <p className="text-sm text-[#5B647A]">Suggested question for: {flag.title}</p>
            <blockquote className="mt-3 rounded-xl border border-[#E4DED0] bg-[#FBFAF7] p-4 text-base leading-relaxed text-[#172033]">
              “{flag.question}”
            </blockquote>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copy}
                className={`inline-flex items-center gap-2 rounded-lg border border-[#CFC8B8] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition-colors hover:border-[#146356] hover:text-[#146356] ${focus}`}
              >
                {copied ? <Check className="h-4 w-4" /> : null}
                {copied ? 'Copied' : 'Copy question'}
              </button>
              <span className="text-xs text-[#5B647A]">Sample question. In the real checker, questions come from your own checked figures.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
