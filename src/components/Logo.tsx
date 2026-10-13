import { Check } from 'lucide-react'

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-brand to-accent text-white shadow-glow"
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
      <span className={`font-heading text-xl font-bold ${light ? 'text-white' : 'text-navy'}`}>
        TickmarkTools
      </span>
    </span>
  )
}
