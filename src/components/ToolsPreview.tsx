import type { CSSProperties } from 'react'
import { Zap, Tag, Check, Ellipsis, FilePlus2, FileSearch, FileText, Landmark, Pencil, PenTool, ReceiptText, Car, Shirt } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatPrice, PRICE_USD } from '../data/tools'
import Logo from './Logo'

const TILES: { label: string; icon: ReactNode; tone: string }[] = [
  { label: 'Medical Bill', icon: <FilePlus2 />, tone: 'bg-cyan-brand/15 text-sky-700' },
  { label: 'Invoice Kit', icon: <ReceiptText />, tone: 'bg-teal-deep/15 text-teal-deep' },
  { label: 'Car Quote', icon: <Car />, tone: 'bg-blue-100 text-blue-700' },
  { label: 'Contracts', icon: <FileSearch />, tone: 'bg-cyan-brand/15 text-sky-700' },
  { label: 'Resizer', icon: <Shirt />, tone: 'bg-indigo-100 text-accent' },
  { label: 'Worksheets', icon: <Pencil />, tone: 'bg-amber-100 text-amber-700' },
  { label: 'Vectorizer', icon: <PenTool />, tone: 'bg-teal-deep/15 text-teal-deep' },
  { label: 'PDF Data', icon: <FileText />, tone: 'bg-blue-100 text-blue-700' },
  { label: 'Tax Notice', icon: <Landmark />, tone: 'bg-indigo-100 text-accent' },
  { label: 'More', icon: <Ellipsis />, tone: 'bg-slate-100 text-slate-600' },
]

const style = (vars: Record<string, string | number>) => vars as CSSProperties

/** Decorative illustration only. Nothing here is interactive or functional. */
export default function ToolsPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-xl px-3 pb-12 pt-14 sm:px-6 sm:pt-10">
      <div className="float" style={style({ '--dur': '9s' })}>
        <div
          aria-hidden="true"
          className="relative overflow-hidden rounded-3xl border border-white bg-white/80 p-4 shadow-card backdrop-blur sm:p-5"
        >
          <div className="scan-beam" />
          <div className="relative mb-3 flex items-center justify-between">
            <span className="flex gap-1.5">
              <i className="h-2 w-2 rounded-full bg-rose-300" />
              <i className="h-2 w-2 rounded-full bg-amber-300" />
              <i className="h-2 w-2 rounded-full bg-aqua" />
            </span>
            <span className="inline-block origin-right scale-75"><Logo /></span>
          </div>
          <p className="relative font-heading text-lg font-bold text-navy">Hey there!</p>
          <div className="relative mb-4 mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400">Search tools...</div>
          <div className="relative grid grid-cols-5 gap-1.5 sm:gap-2">
            {TILES.map((t, i) => (
              <div
                key={t.label}
                className="tile flex flex-col items-center rounded-xl border border-slate-100 bg-white p-1 text-center sm:p-1.5"
                style={style({ '--i': i })}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 [&>svg]:h-4 [&>svg]:w-4 ${t.tone}`}>{t.icon}</span>
                <span className="mt-1 break-words text-[8px] leading-tight text-slate-500 sm:text-[9px]">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="float absolute right-1 top-1 flex items-center gap-2 rounded-2xl bg-teal-deep px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2" style={style({ '--r': '6deg', '--dur': '6s' })}>
        <Check className="h-4 w-4" strokeWidth={3} /> Smart Tools
      </div>
      <div aria-hidden="true" className="float absolute left-1 top-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-sky-700 px-3 py-2 text-xs font-semibold text-white shadow-card sm:left-2" style={style({ '--r': '-6deg', '--dur': '7s' })}>
        <Zap className="h-4 w-4" /> {formatPrice(PRICE_USD)} planned
      </div>
      <div aria-hidden="true" className="float absolute bottom-2 right-1 flex items-center gap-2 rounded-2xl bg-navy px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2" style={style({ '--r': '3deg', '--dur': '8s' })}>
        <Tag className="h-4 w-4 text-aqua" /> No subscriptions
      </div>
      <figcaption className="sr-only">Decorative preview of the planned TickmarkTools catalog. Tools shown are not yet available.</figcaption>
    </figure>
  )
}
