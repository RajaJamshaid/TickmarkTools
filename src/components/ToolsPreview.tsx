import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Check, Tag, Zap } from 'lucide-react'
import { FEATURED_TOOLS, formatPrice, PRICE_USD } from '../data/tools'
import type { ToolId } from '../data/tools'
import Logo from './Logo'
import { CarIcon, ContractorIcon, InvoiceIcon, MedicalIcon, ResizerIcon, SmartSearchIcon } from './ToolIcons'
import { LOOK } from './toolLook'

const TEXT = 'TickmarkTools.com'

const SHORT: Record<ToolId, string> = {
  'medical-bill-checker': 'Medical Bill',
  'overdue-invoice-recovery-kit': 'Invoice Kit',
  'car-repair-quote-checker': 'Car Quote',
  'home-contractor-quote-checker': 'Contractor',
  'ecommerce-asset-auto-resizer': 'Resizer',
}

const ICON: Record<ToolId, ReactNode> = {
  'medical-bill-checker': <MedicalIcon className="h-5 w-5" />,
  'overdue-invoice-recovery-kit': <InvoiceIcon className="h-5 w-5" />,
  'car-repair-quote-checker': <CarIcon className="h-5 w-5" />,
  'home-contractor-quote-checker': <ContractorIcon className="h-5 w-5" />,
  'ecommerce-asset-auto-resizer': <ResizerIcon className="h-5 w-5" />,
}

const style = (vars: Record<string, string | number>) => vars as CSSProperties

/** Loop: type the site name, reveal the tools one by one, hold, reset. */
function useDemo() {
  const [typed, setTyped] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(TEXT.length)
      setShow(true)
      return
    }
    let timer = 0
    let i = 0
    const type = () => {
      if (i <= TEXT.length) {
        setTyped(i)
        i += 1
        timer = window.setTimeout(type, 85)
        return
      }
      setShow(true)
      timer = window.setTimeout(() => {
        setShow(false)
        timer = window.setTimeout(() => {
          i = 0
          setTyped(0)
          timer = window.setTimeout(type, 500)
        }, 600)
      }, 4200)
    }
    timer = window.setTimeout(type, 600)
    return () => window.clearTimeout(timer)
  }, [])

  return { typed, show }
}

/** Decorative illustration only. Nothing here is interactive or functional. */
export default function ToolsPreview() {
  const { typed, show } = useDemo()

  return (
    <figure className="relative mx-auto w-full max-w-xl px-3 pb-12 pt-14 sm:px-6 sm:pt-12">
      <div className="float" style={style({ '--dur': '9s' })}>
        <div
          aria-hidden="true"
          className="relative overflow-hidden rounded-3xl border border-white bg-white/90 p-4 shadow-card sm:p-5"
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

          <div className="relative mb-4 mt-2 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
            <SmartSearchIcon className="h-4 w-4 shrink-0 text-accent" />
            <span className="font-medium text-navy">{TEXT.slice(0, typed)}</span>
            <span className="caret" />
            {typed === 0 && <span className="text-slate-400">Smart search...</span>}
          </div>

          <div className={`relative grid grid-cols-5 gap-1.5 sm:gap-2 ${show ? 'demo-on' : ''}`}>
            {FEATURED_TOOLS.map((t, i) => {
              const look = LOOK[t.accent]
              return (
                <div
                  key={t.id}
                  className="demo-tile flex flex-col items-center rounded-xl border bg-white p-1.5 text-center"
                  style={{ '--i': i, borderColor: look.edge } as CSSProperties}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white ${look.tile}`}>
                    {ICON[t.id]}
                  </span>
                  <span className="mt-1 break-words text-[9px] font-medium leading-tight text-slate-600">{SHORT[t.id]}</span>
                </div>
              )
            })}
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
