import { Check } from 'lucide-react'
import { formatPrice, PRICE_USD } from '../data/tools'

const POINTS = [
  'One-time payment. No subscription.',
  'Each tool has its own offer. A payment for one tool does not unlock others.',
  'Medical Bill Checker: the planned price covers its full advertised report package.',
]

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 id="pricing-heading" className="text-3xl font-bold sm:text-4xl">One Payment. Practical Solutions.</h2>
        <p className="mt-2 text-slate-600">No subscriptions. Clear pricing. Pay only for the service you need.</p>
        <div className="mt-8 rounded-3xl bg-navy p-8 text-left text-white shadow-card">
          <p className="font-heading text-4xl font-bold">{formatPrice(PRICE_USD)}</p>
          <p className="text-sm text-slate-300">Planned one-time price per tool</p>
          <ul className="mt-5 space-y-2">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-slate-200">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-aqua" /> {p}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
            Checkout is not live yet. Prices are final only once each tool launches.
          </p>
        </div>
      </div>
    </section>
  )
}
