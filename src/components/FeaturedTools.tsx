import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import Reveal from './Reveal'
import SmartSearch from './SmartSearch'
import { CarIcon, ContractorIcon, InvoiceIcon, MedicalIcon, ResizerIcon } from './ToolIcons'
import { LOOK } from './toolLook'
import { FEATURED_TOOLS, formatPrice, PRICE_USD } from '../data/tools'
import type { ToolId } from '../data/tools'

const ICONS: Record<ToolId, ReactNode> = {
  'medical-bill-checker': <MedicalIcon />,
  'overdue-invoice-recovery-kit': <InvoiceIcon />,
  'car-repair-quote-checker': <CarIcon />,
  'home-contractor-quote-checker': <ContractorIcon />,
  'ecommerce-asset-auto-resizer': <ResizerIcon />,
}

let raf = 0
function track(e: ReactPointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const x = e.clientX
  const y = e.clientY
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${x - r.left}px`)
    el.style.setProperty('--my', `${y - r.top}px`)
  })
}

export default function FeaturedTools() {
  return (
    <section id="tools" aria-labelledby="tools-heading" className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="inline-block rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              Featured
            </p>
            <h2 id="tools-heading" className="mt-3 text-4xl font-bold sm:text-5xl">
              5 Tools. <span className="text-gradient">Launching First.</span>
            </h2>
            <p className="mt-2 text-slate-600">Planned at {formatPrice(PRICE_USD)} each, one-time.</p>
          </div>
        </Reveal>

        <SmartSearch />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURED_TOOLS.map((tool, i) => {
            const look = LOOK[tool.accent]
            return (
              <li key={tool.id}>
                <Reveal delay={i * 60} className="h-full">
                  <article
                    id={`tool-${tool.id}`}
                    className="spot flex h-full flex-col p-5"
                    onPointerMove={track}
                    style={
                      {
                        '--accent': look.accent,
                        '--tint': look.tint,
                        '--edge': look.edge,
                        '--glow': look.glow,
                        '--glow-strong': look.strong,
                      } as CSSProperties
                    }
                  >
                    <div className="flex items-start justify-between">
                      <span className={`icon-tile bg-gradient-to-br ${look.tile}`}>{ICONS[tool.id]}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${look.badge}`}>Soon</span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold leading-snug">{tool.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
                    <p className={`mt-5 font-heading text-2xl font-bold ${look.price}`}>{formatPrice(tool.price)}</p>
                    <p className="text-[11px] text-slate-500">planned, one-time</p>
                    <button
                      type="button"
                      disabled
                      aria-label={`${tool.intendedCta}: coming soon`}
                      className={`mt-4 w-full cursor-not-allowed rounded-xl border px-4 py-2.5 text-sm font-semibold ${look.button}`}
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
