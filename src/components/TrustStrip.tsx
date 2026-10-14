import { BadgeDollarSign, Lock, Repeat2 } from 'lucide-react'

const PILLS = [
  { icon: <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, label: 'Privacy First' },
  { icon: <BadgeDollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, label: 'Transparent Pricing' },
  { icon: <Repeat2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, label: 'No Subscriptions' },
]

/** Short trust pills shown under the hero text. */
export default function TrustStrip() {
  return (
    <ul aria-label="Our principles" className="flex flex-wrap gap-1.5 sm:gap-2.5">
      {PILLS.map((p) => (
        <li
          key={p.label}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-sm"
        >
          <span className="text-accent">{p.icon}</span>
          {p.label}
        </li>
      ))}
    </ul>
  )
}
