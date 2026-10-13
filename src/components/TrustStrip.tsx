import { BadgeDollarSign, Lock, Repeat2, Wrench } from 'lucide-react'

const ITEMS = [
  { icon: <Repeat2 className="h-6 w-6" />, title: 'No Subscriptions', text: 'Pay once per tool' },
  { icon: <BadgeDollarSign className="h-6 w-6" />, title: 'Transparent Pricing', text: 'Price shown up front' },
  { icon: <Lock className="h-6 w-6" />, title: 'Privacy First', text: 'Data minimization by design' },
  { icon: <Wrench className="h-6 w-6" />, title: '20 Tools Planned', text: 'Launching one at a time' },
]

export default function TrustStrip() {
  return (
    <section aria-label="Our principles" className="bg-white pb-14">
      <ul className="mx-auto grid max-w-7xl gap-4 rounded-2xl bg-slate-50 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map((i) => (
          <li key={i.title} className="flex items-center gap-3">
            <span className="text-accent">{i.icon}</span>
            <span>
              <span className="block font-heading font-bold text-navy">{i.title}</span>
              <span className="block text-xs text-slate-500">{i.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
