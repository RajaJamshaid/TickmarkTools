import { BadgeDollarSign, Lock, Repeat2 } from 'lucide-react'

const PILLS = [
  { icon: <Lock className="h-4 w-4" />, label: 'Privacy First' },
  { icon: <BadgeDollarSign className="h-4 w-4" />, label: 'Transparent Pricing' },
  { icon: <Repeat2 className="h-4 w-4" />, label: 'No Subscriptions' },
]

/** Short trust pills shown under the hero text. */
export default function TrustStrip() {
  return (
    <ul aria-label="Our principles" className="flex flex-wrap gap-2.5">
      {PILLS.map((p) => (
        <li
          key={p.label}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
        >
          <span className="text-accent">{p.icon}</span>
          {p.label}
        </li>
      ))}
    </ul>
  )
}
