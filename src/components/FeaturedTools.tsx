import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import Aurora from './Aurora'
import Reveal from './Reveal'
import { CarIcon, ContractorIcon, InvoiceIcon, MedicalIcon, ResizerIcon } from './ToolIcons'
import { FEATURED_TOOLS, formatPrice, PRICE_USD } from '../data/tools'
import type { Accent, ToolId } from '../data/tools'

const ICONS: Record<ToolId, ReactNode> = {
  'medical-bill-checker': <MedicalIcon />,
  'overdue-invoice-recovery-kit': <InvoiceIcon />,
  'car-repair-quote-checker': <CarIcon />,
  'home-contractor-quote-checker': <ContractorIcon />,
  'ecommerce-asset-auto-resizer': <ResizerIcon />,
}

const LOOK: Record<Accent, { tile: string; accent: string; glow: string; strong: string }> = {
  cyan: { tile: 'from-cyan-brand to-sky-600', accent: '#17B9F5', glow: 'rgba(23,185,245,0.28)', strong: 'rgba(23,185,245,0.55)' },
  teal: { tile: 'from-aqua to-teal-deep', accent: '#00D6C9', glow: 'rgba(0,214,201,0.26)', strong: 'rgba(0,214,201,0.5)' },
  blue: { tile: 'from-blue-400 to-blue-700', accent: '#60A5FA', glow: 'rgba(96,165,250,0.28)', strong: 'rgba(96,165,250,0.5)' },
  amber: { tile: 'from-amber-400 to-amber-600', accent: '#FBBF24', glow: 'rgba(251,191,36,0.24)', strong: 'rgba(251,191,36,0.45)' },
  indigo: { tile: 'from-indigo-400 to-accent', accent: '#818CF8', glow: 'rgba(129,140,248,0.3)', strong: 'rgba(129,140,248,0.55)' },
}

function track(e: ReactPointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export default function FeaturedTools() {
  return (
    <section id="tools" aria-labelledby="tools-heading" className="relative overflow-hidden bg-navy py-16 sm:py-24">
      <Aurora variant="dark" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="inline-block rounded-full border border-cyan-brand/30 bg-cyan-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-brand">
            Featured
          </p>
          <h2 id="tools-heading" className="mt-3 text-4xl font-bold text-white sm:text-5xl">
            5 Tools. <span className="text-aqua">Launching First.</span>
          </h2>
          <p className="mt-2 text-slate-300">Planned at {formatPrice(PRICE_USD)} each, one-time.</p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURED_TOOLS.map((tool, i) => {
            const look = LOOK[tool.accent]
            return (
              <li key={tool.id}>
                <Reveal delay={i * 110} className="h-full">
                  <article
                    className="spot flex h-full flex-col p-5"
                    onPointerMove={track}
                    style={{ '--accent': look.accent, '--glow': look.glow, '--glow-strong': look.strong } as CSSProperties}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`icon-tile bg-gradient-to-br ${look.tile}`}>{ICONS[tool.id]}</span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                        Soon
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold leading-snug text-white">{tool.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">{tool.description}</p>
                    <p className="mt-5 font-heading text-2xl font-bold text-white">{formatPrice(tool.price)}</p>
                    <p className="text-[11px] text-slate-400">planned, one-time</p>
                    <button
                      type="button"
                      disabled
                      aria-label={`${tool.intendedCta}: coming soon`}
                      className="mt-4 w-full cursor-not-allowed rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300"
                    >
                      Coming soon
                    </button>
                  </article>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
