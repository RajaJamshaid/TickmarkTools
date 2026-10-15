import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Tag, Zap } from 'lucide-react'
import { FEATURED_TOOLS, formatPrice, PRICE_USD } from '../data/tools'
import type { ToolId } from '../data/tools'
import Logo from './Logo'
import ToolSticker from './ToolSticker'
import { SmartSearchIcon } from './ToolIcons'
import { LOOK } from './toolLook'

const TEXT = 'TickmarkTools.com'

const SHORT: Record<ToolId, string> = {
  'medical-bill-checker': 'Medical Bill',
  'overdue-invoice-recovery-kit': 'Invoice Kit',
  'car-repair-quote-checker': 'Car Quote',
  'home-contractor-quote-checker': 'Contractor',
  'ecommerce-asset-auto-resizer': 'Resizer',
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
    <figure className="relative mx-auto w-full max-w-xl pb-0 pt-9 sm:px-6 sm:pt-12">
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-2xl border border-white bg-white p-2.5 shadow-card sm:rounded-3xl sm:p-5"
      >
        <div className="scan-beam" />
        <div className="relative mb-2 flex items-center justify-between sm:mb-3">
          <span className="flex gap-1 sm:gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-rose-300 sm:h-2 sm:w-2" />
            <i className="h-1.5 w-1.5 rounded-full bg-amber-300 sm:h-2 sm:w-2" />
            <i className="h-1.5 w-1.5 rounded-full bg-aqua sm:h-2 sm:w-2" />
          </span>
          <span className="hidden origin-right scale-75 sm:inline-block"><Logo /></span>
        </div>
        <p className="relative font-heading text-sm font-bold text-navy sm:text-lg">Hey there!</p>

        <div className="relative mb-2.5 mt-1.5 flex h-8 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] sm:mb-4 sm:mt-2 sm:h-10 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm">
          <SmartSearchIcon className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
          <span className="font-medium text-navy">{TEXT.slice(0, typed)}</span>
          <span className="caret" />
          {typed === 0 && <span className="text-slate-400">Smart search...</span>}
        </div>

        <div className={`relative grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2 ${show ? 'demo-on' : ''}`}>
          {FEATURED_TOOLS.map((t, i) => {
            const look = LOOK[t.accent]
            return (
              <div
                key={t.id}
                className="demo-tile flex flex-col items-center rounded-lg border bg-white p-1 text-center sm:rounded-xl sm:p-1.5"
                style={{ '--i': i, borderColor: look.edge } as CSSProperties}
              >
                <ToolSticker id={t.id} size={40} className="h-8 w-8 sm:h-10 sm:w-10" still eager />
                <span className="mt-0.5 break-words text-[8px] font-medium leading-tight text-slate-600 sm:mt-1 sm:text-[9px]">{SHORT[t.id]}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div aria-hidden="true" className="float absolute right-1 top-1 hidden items-center gap-2 rounded-2xl bg-teal-deep px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2 sm:flex" style={style({ '--r': '6deg', '--dur': '6s' })}>
        <Check className="h-4 w-4" strokeWidth={3} /> Smart Tools
      </div>
      <div aria-hidden="true" className="float absolute left-1 top-3 hidden items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-sky-700 px-3 py-2 text-xs font-semibold text-white shadow-card sm:left-2 sm:flex" style={style({ '--r': '-6deg', '--dur': '7s' })}>
        <Zap className="h-4 w-4" /> {formatPrice(PRICE_USD)} planned
      </div>
      <div aria-hidden="true" className="float absolute -bottom-3 right-1 hidden items-center gap-2 rounded-2xl bg-navy px-3 py-2 text-xs font-semibold text-white shadow-card sm:right-2 sm:flex" style={style({ '--r': '3deg', '--dur': '8s' })}>
        <Tag className="h-4 w-4 text-aqua" /> No subscriptions
      </div>
      <figcaption className="sr-only">Decorative preview of the planned TickmarkTools catalog. Tools shown are not yet available.</figcaption>
    </figure>
  )
}
