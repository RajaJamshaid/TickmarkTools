import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import ToolsPreview from './ToolsPreview'
import TrustStrip from './TrustStrip'

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-7xl px-3 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12 lg:px-8 lg:pb-10 lg:pt-14">
        <Reveal className="w-full">
          <h1 className="text-center text-[2rem] font-bold leading-[1.1] sm:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block">Real Problems.</span>
            <span className="block">Real Solutions.</span>
            <span className="text-shimmer block">Get More Done.</span>
          </h1>
        </Reveal>

        <div className="mt-5 grid grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] items-end gap-2 sm:mt-8 sm:gap-4">
          <div className="min-w-0 text-center">
            <Reveal delay={60}>
              <p className="mx-auto text-[13px] leading-snug text-slate-600 sm:max-w-md sm:text-lg">
                Simple one-time tools for everyday problems. No subscriptions.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-4 sm:mt-6">
              <TrustStrip centered />
            </Reveal>
            <Reveal delay={180} className="mt-5 flex justify-center sm:mt-8">
              <a href="#tools" className="btn-primary">
                Explore Tools <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </Reveal>
          </div>

          <Reveal delay={100} className="min-w-0">
            <ToolsPreview />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
