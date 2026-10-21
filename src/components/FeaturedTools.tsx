import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import Reveal from './Reveal'
import SmartSearch from './SmartSearch'
import ToolSticker from './ToolSticker'
import { LOOK } from './toolLook'
import { PREVIEW_LINKS } from '../data/preview'
import { FEATURED_TOOLS, formatPrice } from '../data/tools'

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
    <section id="tools" aria-labelledby="tools-heading" className="relative pb-8 pt-2 sm:pb-12 sm:pt-4">
      <h2 id="tools-heading" className="sr-only">Featured tools</h2>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SmartSearch />

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURED_TOOLS.map((tool, i) => {
            const look = LOOK[tool.accent]
            const preview = PREVIEW_LINKS[tool.id]
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
                      <ToolSticker id={tool.id} size={96} className="h-[4.75rem] w-[4.75rem]" delay={i * 0.45} />
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${look.badge}`}>
                        {preview ? 'Preview' : 'Soon'}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold leading-snug">{tool.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
                    <p className={`mt-5 font-heading text-2xl font-bold ${look.price}`}>{formatPrice(tool.price)}</p>
                    <p className="text-[11px] text-slate-500">planned, one-time</p>
                    {preview ? (
                      <a href={preview} aria-label={`${tool.name}: try the free preview`} className="btn-primary mt-4 w-full">
                        Try the free preview
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label={`${tool.intendedCta}: coming soon`}
                        className="btn-primary mt-4 w-full"
                      >
                        Coming soon
                      </button>
                    )}
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
