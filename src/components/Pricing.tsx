import Aurora from './Aurora'
import Reveal from './Reveal'
import { formatPrice, PRICE_USD } from '../data/tools'

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative overflow-hidden bg-navy py-16 sm:py-24">
      <Aurora variant="dark" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 id="pricing-heading" className="text-4xl font-bold text-white sm:text-5xl">
            One Payment. <span className="text-aqua">Practical Solutions.</span>
          </h2>
        </Reveal>
        <Reveal delay={80} className="mt-10">
          <div className="animated-border rounded-[2rem] bg-gradient-to-r from-cyan-brand via-accent to-aqua p-[1.5px]">
            <div className="rounded-[calc(2rem-1.5px)] bg-navy-800 px-6 py-10">
              <p className="font-heading text-6xl font-bold text-white">{formatPrice(PRICE_USD)}</p>
              <p className="mt-1 text-slate-300">One-time. No subscription.</p>
              <p className="mx-auto mt-6 max-w-md rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                Planned price. Checkout is not live yet, and each tool is sold separately.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
