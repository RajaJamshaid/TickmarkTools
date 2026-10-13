import {
  Check,
  Ellipsis,
  FilePlus2,
  FileSearch,
  FileText,
  Infinity as InfinityIcon,
  Landmark,
  Pencil,
  PenTool,
  ReceiptText,
  Car,
  Shirt,
  Tag,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { formatPrice, PRICE_USD } from '../data/tools'
import Logo from './Logo'

const TILES: { label: string; icon: ReactNode; tone: string }[] = [
  { label: 'Medical Bill Checker', icon: <FilePlus2 />, tone: 'bg-cyan-brand/15 text-sky-700' },
  { label: 'Invoice Recovery Kit', icon: <ReceiptText />, tone: 'bg-teal-deep/15 text-teal-deep' },
  { label: 'Car Repair Quote Checker', icon: <Car />, tone: 'bg-blue-100 text-blue-700' },
  { label: 'Contract Red-Flag Checker', icon: <FileSearch />, tone: 'bg-cyan-brand/15 text-sky-700' },
  { label: 'Product Resizer', icon: <Shirt />, tone: 'bg-indigo-100 text-accent' },
  { label: 'Kids Worksheet Generator', icon: <Pencil />, tone: 'bg-amber-100 text-amber-700' },
  { label: 'SVG Vectorizer', icon: <PenTool />, tone: 'bg-teal-deep/15 text-teal-deep' },
  { label: 'PDF Data Extractor', icon: <FileText />, tone: 'bg-blue-100 text-blue-700' },
  { label: 'Tax Notice Explainer', icon: <Landmark />, tone: 'bg-indigo-100 text-accent' },
  { label: 'And more planned', icon: <Ellipsis />, tone: 'bg-slate-100 text-slate-600' },
]

/** Decorative illustration only. Nothing here is interactive or functional. */
export default function ToolsPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-xl px-3 pb-10 pt-8 sm:px-6" aria-label="Illustration of the planned TickmarkTools catalog">
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 top-10 h-64 w-64 rounded-full bg-aqua/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-6 bottom-6 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

      <div aria-hidden="true" className="relative rounded-3xl border border-white bg-white/80 p-4 shadow-card backdrop-blur sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex gap-1.5">
            <i className="h-2 w-2 rounded-full bg-rose-300" />
            <i className="h-2 w-2 rounded-full bg-amber-300" />
            <i className="h-2 w-2 rounded-full bg-aqua" />
          </span>
          <span className="scale-75 origin-right"><Logo /></span>
        </div>
        <p className="font-heading text-lg font-bold text-navy">Hey there!</p>
        <p className="mb-3 text-xs text-slate-500">Choose a tool, solve your problem, get it done.</p>
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400">Search tools...</div>
        <div className="grid grid-cols-5 gap-2">
          {TILES.map((t) => (
            <div key={t.label} className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-1.5 text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 [&>svg]:h-4 [&>svg]:w-4 ${t.tone}`}>{t.icon}</span>
              <span className="mt-1 text-[8px] leading-tight text-slate-500 sm:text-[9px]">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="absolute left-0 top-2 flex -rotate-6 items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-cyan-brand px-3 py-2 text-xs font-semibold text-white shadow-glow sm:left-2">
        <Zap className="h-4 w-4" /> Practical Tools
      </div>
      <div aria-hidden="true" className="absolute right-0 top-0 flex rotate-6 items-center gap-2 rounded-2xl bg-teal-deep px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2">
        <Check className="h-4 w-4" strokeWidth={3} /> Smart Tools. Real Solutions.
      </div>
      <div aria-hidden="true" className="absolute -left-1 top-1/2 hidden -rotate-6 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs font-semibold text-navy shadow-card sm:flex">
        <Tag className="h-4 w-4 text-accent" />
        <span>One-time payment<br /><span className="text-slate-500">{formatPrice(PRICE_USD)} planned per tool</span></span>
      </div>
      <div aria-hidden="true" className="absolute bottom-2 right-0 flex items-center gap-2 rounded-2xl bg-navy px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2">
        <InfinityIcon className="h-4 w-4 text-aqua" /> No subscriptions
      </div>
      <figcaption className="sr-only">Decorative preview. Tools shown are planned and not yet available.</figcaption>
    </figure>
  )
}
