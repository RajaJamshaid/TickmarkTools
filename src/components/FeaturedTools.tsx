import { Car, FilePlus2, HardHat, ReceiptText, Shirt } from 'lucide-react'
import type { ReactNode } from 'react'
import { FEATURED_TOOLS, formatPrice } from '../data/tools'
import type { Accent, ToolId } from '../data/tools'

const ICONS: Record<ToolId, ReactNode> = {
  'medical-bill-checker': <FilePlus2 className="h-7 w-7" />,
  'overdue-invoice-recovery-kit': <ReceiptText className="h-7 w-7" />,
  'car-repair-quote-checker': <Car className="h-7 w-7" />,
  'home-contractor-quote-checker': <HardHat className="h-7 w-7" />,
  'ecommerce-asset-auto-resizer': <Shirt className="h-7 w-7" />,
}

const STYLES: Record<Accent, { card: string; icon: string; price: string; button: string }> = {
  cyan: {
    card: 'border-cyan-brand/30 from-cyan-brand/10',
    icon: 'from-cyan-brand to-sky-600',
    price: 'text-sky-700',
    button: 'border-sky-600/40 text-sky-800',
  },
  teal: {
    card: 'border-teal-deep/30 from-teal-deep/10',
    icon: 'from-aqua to-teal-deep',
    price: 'text-teal-deep',
    button: 'border-teal-deep/40 text-teal-deep',
  },
  blue: {
    card: 'border-blue-500/30 from-blue-500/10',
    icon: 'from-blue-500 to-blue-700',
    price: 'text-blue-700',
    button: 'border-blue-600/40 text-blue-800',
  },
  amber: {
    card: 'border-amber-500/30 from-amber-400/10',
    icon: 'from-amber-400 to-amber-600',
    price: 'text-amber-700',
    button: 'border-amber-600/40 text-amber-800',
  },
  indigo: {
    card: 'border-accent/30 from-accent/10',
    icon: 'from-indigo-500 to-accent',
    price: 'text-accent',
    button: 'border-accent/40 text-accent',
  },
}

export default function FeaturedTools() {
  return (
    <section id="tools" aria-labelledby="tools-heading" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Featured Tools
        </p>
        <h2 id="tools-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
          5 Tools Launching First
        </h2>
        <p className="mt-2 text-slate-600">
          Real problems. Practical solutions. Intended price: {formatPrice(1.99)} each.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          All five are in development. Buttons stay disabled until each tool actually works.
        </p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURED_TOOLS.map((tool) => {
            const s = STYLES[tool.accent]
            return (
              <li
                key={tool.id}
                className={`flex flex-col rounded-3xl border bg-gradient-to-b to-white p-5 shadow-card ${s.card}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-card ${s.icon}`}>
                    {ICONS[tool.id]}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    In development
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug">{tool.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
                <p className={`mt-5 font-heading text-xl font-bold ${s.price}`}>{formatPrice(tool.price)}</p>
                <p className="text-xs text-slate-500">Planned one-time payment</p>
                <button
                  type="button"
                  disabled
                  aria-label={`${tool.intendedCta}: coming soon`}
                  className={`mt-4 w-full cursor-not-allowed rounded-xl border bg-white/70 px-4 py-2.5 text-sm font-semibold ${s.button}`}
                >
                  Coming soon
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
