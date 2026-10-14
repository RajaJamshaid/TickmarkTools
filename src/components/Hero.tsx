import { ArrowRight } from 'lucide-react'
import Aurora from './Aurora'
import Reveal from './Reveal'
import ToolsPreview from './ToolsPreview'
import TrustStrip from './TrustStrip'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-indigo-50/50">
      <Aurora variant="light" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-20 lg:pt-20">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/80 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua" />
              20 tools. Launching one by one.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              Solve Real Problems.
              <span className="text-shimmer block">Get More Done.</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 max-w-md text-lg text-slate-600">
              Simple one-time tools for everyday problems. No subscriptions.
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-6">
            <TrustStrip />
          </Reveal>
          <Reveal delay={400}>
            <a
              href="#tools"
              className="btn-shine mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-sky-700 px-8 py-4 font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Explore Tools <ArrowRight className="h-5 w-5" />
            </a>
          </Reveal>
        </div>

        <Reveal delay={250}>
          <ToolsPreview />
        </Reveal>
      </div>
    </section>
  )
}
