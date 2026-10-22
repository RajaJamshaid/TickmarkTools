import { ChevronDown } from 'lucide-react'
import { focus } from './ui'

export interface FaqItem {
  q: string
  a: string
}

/** Accessible accordion built on native details/summary (keyboard and screen-reader friendly). */
export default function Faq({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-[#E4DED0] rounded-2xl border border-[#E4DED0] bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-5">
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold text-[#172033] [&::-webkit-details-marker]:hidden ${focus}`}
          >
            {item.q}
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#146356] transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-[#46506A]">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
