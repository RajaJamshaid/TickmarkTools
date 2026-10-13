import { ArrowRight, BadgeDollarSign, Lock, ShieldCheck, UserX } from 'lucide-react'

const ITEMS = [
  { icon: <UserX className="h-6 w-6" />, label: 'No Account Required' },
  { icon: <BadgeDollarSign className="h-6 w-6" />, label: 'One-Time Payment' },
  { icon: <Lock className="h-6 w-6" />, label: 'Privacy First' },
  { icon: <ShieldCheck className="h-6 w-6" />, label: 'Transparent Pricing' },
]

export default function WhyBand() {
  return (
    <section id="about" aria-labelledby="about-heading" className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-[60rem] rounded-[100%] bg-accent/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-brand">
            Why TickmarkTools?
          </p>
          <h2 id="about-heading" className="mt-3 text-3xl font-bold !text-white sm:text-4xl">Simple Tools. Big Impact.</h2>
          <p className="mt-3 max-w-lg text-slate-300">
            Designed for people who want practical solutions without the complexity, subscriptions or hidden costs.
            Small Tools. Big Solutions.
          </p>
          <a
            href="#tools"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-cyan-brand px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            See the Tools <ArrowRight className="h-5 w-5" />
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-6 self-center sm:grid-cols-4">
          {ITEMS.map((i) => (
            <li key={i.label} className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-aqua">{i.icon}</span>
              <span className="mt-3 text-sm font-medium">{i.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
