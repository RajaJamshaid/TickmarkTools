import { ArrowRight, BadgeDollarSign, Lock, ShieldCheck, UserX } from 'lucide-react'
import Reveal from './Reveal'

const ITEMS = [
  { icon: <UserX className="h-6 w-6" />, label: 'No Account Needed' },
  { icon: <BadgeDollarSign className="h-6 w-6" />, label: 'One-Time Payment' },
  { icon: <Lock className="h-6 w-6" />, label: 'Privacy First' },
  { icon: <ShieldCheck className="h-6 w-6" />, label: 'Clear Pricing' },
]

export default function WhyBand() {
  return (
    <section id="about" aria-labelledby="about-heading" className="relative">
      <div className="relative mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-8">
        <Reveal>
          <h2 id="about-heading" className="text-4xl font-bold sm:text-5xl">
            Simple Tools. <span className="text-gradient">Big Impact.</span>
          </h2>
          <p className="mt-3 font-heading text-slate-600">Small Tools. Big Solutions.</p>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {ITEMS.map((item, i) => (
            <li key={item.label}>
              <Reveal delay={i * 60}>
                <div className="group flex flex-col items-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-accent shadow-card transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/40">
                    {item.icon}
                  </span>
                  <span className="mt-3 text-sm font-medium text-navy">{item.label}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delay={180} className="mt-8 flex justify-center">
          <a href="#tools" className="btn-primary">
            See the Tools <ArrowRight className="h-5 w-5" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
