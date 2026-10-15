import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import ToolsPreview from './ToolsPreview'
import TrustStrip from './TrustStrip'

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto grid max-w-7xl grid-cols-[1.12fr_1fr] items-end gap-2 px-3 pb-6 pt-8 sm:gap-4 sm:px-6 sm:pb-8 sm:pt-12 lg:px-8 lg:pb-10 lg:pt-14">
        <div className="text-center">
          <Reveal className="w-full text-center">
            <h1 className="mx-auto text-center text-[1.4rem] font-bold leading-[1.1] min-[400px]:text-[1.55rem] sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
              <span className="block">Real Problems.</span>
              <span className="block">Real Solutions.</span>
              <span className="text-shimmer block">Get More Done.</span>
            </h1>
          </Reveal>
          <Reveal delay={60} className="text-center">
            <p className="mx-auto mt-3 text-[13px] leading-snug text-slate-600 sm:mt-5 sm:max-w-md sm:text-lg">
              Simple one-time tools for everyday problems. No subscriptions.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-4 sm:mt-6">
            <TrustStrip centered />
          </Reveal>
          <Reveal delay={180} className="mt-5 flex justify-center sm:mt-8">
            <a
              href="#tools"
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base"
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
