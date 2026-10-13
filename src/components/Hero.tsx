import { ArrowRight, BadgeDollarSign, Lock, Repeat2 } from 'lucide-react'
import { formatPrice, PRICE_USD } from '../data/tools'
import ToolsPreview from './ToolsPreview'

const POINTS = [
  { icon: <Lock className="h-5 w-5" />, label: 'Privacy First' },
  { icon: <BadgeDollarSign className="h-5 w-5" />, label: 'Transparent Pricing' },
  { icon: <Repeat2 className="h-5 w-5" />, label: 'No Subscriptions' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-indigo-50/40">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-brand/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="inline-flex items-center rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-medium text-accent">
            20 Practical Tools Planned. Launching One at a Time.
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Solve Real Problems.
            <span className="block bg-gradient-to-r from-cyan-brand via-accent to-accent bg-clip-text text-transparent">
              Get More Done.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            TickmarkTools is building focused online tools to simplify everyday tasks and decisions, all in one place. No subscriptions.
            The planned price is a one-time payment of {formatPrice(PRICE_USD)} per tool.
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {POINTS.map((p) => (
              <li key={p.label} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-brand/15 text-sky-700">{p.icon}</span>
                {p.label}
              </li>
            ))}
          </ul>

          <a
            href="#tools"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-cyan-brand px-7 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            Explore the Tools <ArrowRight className="h-5 w-5" />
          </a>
        </div>

        <ToolsPreview />
      </div>
    </section>
  )
}
