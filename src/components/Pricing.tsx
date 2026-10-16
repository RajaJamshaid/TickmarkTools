import Aurora from './Aurora'
import Reveal from './Reveal'
import { formatPrice, PRICE_USD } from '../data/tools'

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative py-8 sm:py-12">
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 id="pricing-heading" className="text-4xl font-bold sm:text-5xl">
            One Payment. <span className="text-gradient">Practical Solutions.</span>
          </h2>
        </Reveal>
        <Reveal delay={80} className="mt-8">
          <div className="animated-border rounded-[2rem] bg-gradient-to-r from-[#E9C46A] via-cyan-brand to-accent p-[1.5px] shadow-[0_30px_60px_-28px_rgba(7,27,53,0.55)]">
            <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-navy-800 px-6 py-10">
              <Aurora variant="dark" />
              <div className="relative">
                <p className="font-heading text-6xl font-bold text-white">{formatPrice(PRICE_USD)}</p>
                <p className="mt-1 text-slate-300">One-time. No subscription. Built for customers worldwide.</p>
                <p className="mx-auto mt-6 max-w-md rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                  Planned price. Checkout is not live yet, and each tool is sold separately.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
