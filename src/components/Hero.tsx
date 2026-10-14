import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import ToolsPreview from './ToolsPreview'
import TrustStrip from './TrustStrip'

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto grid max-w-7xl grid-cols-[1.12fr_1fr] items-center gap-2 px-3 pb-8 pt-8 sm:gap-4 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <div>
          <Reveal>
            <h1 className="text-[1.65rem] font-bold leading-[1.08] min-[400px]:text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">
              Solve Real Problems.
              <span className="text-shimmer block">Get More Done.</span>
            </h1>
          </Reveal>
          <Reveal delay={60}>
            <p className="mt-3 text-[13px] leading-snug text-slate-600 sm:mt-5 sm:max-w-md sm:text-lg">
              Simple one-time tools for everyday problems. No subscriptions.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-4 sm:mt-6">
            <TrustStrip />
          </Reveal>
          <Reveal delay={180}>
            <a
              href="#tools"
              className="btn-shine mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 sm:mt-8 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base"
            >
              Explore Tools <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <ToolsPreview />
        </Reveal>
      </div>
    </section>
  )
}
