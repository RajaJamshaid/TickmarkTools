import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import Logo from './Logo'
import SignupModal from './SignupModal'
import { SmartSearchIcon } from './ToolIcons'
import { focusSmartSearch } from '../lib/searchFocus'

const NAV = [
  { label: 'Home', href: '#main', id: 'main' },
  { label: 'Tools', href: '#tools', id: 'tools' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'Pricing', href: '#pricing', id: 'pricing' },
  { label: 'About', href: '#about', id: 'about' },
]
const SPY = ['tools', 'how-it-works', 'pricing', 'about']

/** Which section is currently in the middle band of the screen. */
function useActive() {
  const [active, setActive] = useState('main')
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const els = SPY.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        setActive(SPY.find((id) => seen.get(id)) ?? 'main')
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [signup, setSignup] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const active = useActive()
  const target = hover ?? active
  const closeSignup = useCallback(() => setSignup(false), [])

  // Slide the highlight pill to the hovered (or current) item.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const measure = () => {
      const el = nav.querySelector<HTMLElement>(`[data-nav="${target}"]`)
      setBar(el && el.offsetWidth > 0 ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [target])

  // Thin page-scroll progress line along the bottom edge of the bar.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = progress.current
      if (!el) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="sticky top-2 z-40 px-2 sm:px-4">
        <div className="header-ring mx-auto max-w-6xl rounded-full p-[1.5px] shadow-[0_18px_40px_-18px_rgba(7,27,53,0.45)]">
          <div className="relative flex h-14 items-center justify-between overflow-hidden rounded-full bg-white px-3 sm:px-5">
            <a href="#main" aria-label="TickmarkTools home">
              <Logo />
            </a>

            <nav aria-label="Primary" className="hidden lg:block">
              <div ref={navRef} className="relative flex items-center gap-1" onMouseLeave={() => setHover(null)}>
                {bar && <span aria-hidden="true" className="nav-pill" style={{ transform: `translateX(${bar.x}px)`, width: bar.w }} />}
                {NAV.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    data-nav={item.id}
                    onMouseEnter={() => setHover(item.id)}
                    onFocus={() => setHover(item.id)}
                    onBlur={() => setHover(null)}
                    className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      target === item.id ? 'text-accent' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                aria-label="Smart search"
                onClick={() => {
                  setOpen(false)
                  focusSmartSearch()
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-accent transition hover:shadow-card"
              >
                <SmartSearchIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSignup(true)
                }}
                className="btn-shine rounded-full bg-gradient-to-r from-navy via-navy-700 to-accent px-4 py-2 text-sm font-semibold text-white shadow-glow ring-1 ring-[#E9C46A]/80 transition hover:brightness-110 sm:px-5"
              >
                Sign up
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-navy lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            <span ref={progress} aria-hidden="true" className="scroll-progress" />
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="mx-auto mt-2 max-w-6xl rounded-3xl border border-slate-200 bg-white p-3 shadow-xl lg:hidden">
            <ul>
              {[...NAV, { label: 'Share a Problem', href: '#share', id: 'share' }].map((item, i) => (
                <li key={item.id} className="menu-item" style={{ '--i': i } as CSSProperties}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <SignupModal open={signup} onClose={closeSignup} />
    </>
  )
}
