import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Home, Info, ListChecks, LogIn, Menu, MessageSquarePlus, Tag, UserPlus, Wrench, X } from 'lucide-react'
import Logo from './Logo'
import SignupModal from './SignupModal'
import type { AccountMode } from './SignupModal'
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

const MENU = [
  { label: 'Home', href: '#main', Icon: Home },
  { label: 'Tools', href: '#tools', Icon: Wrench },
  { label: 'How It Works', href: '#how-it-works', Icon: ListChecks },
  { label: 'Pricing', href: '#pricing', Icon: Tag },
  { label: 'About', href: '#about', Icon: Info },
  { label: 'Share a Problem', href: '#share', Icon: MessageSquarePlus },
]

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
  const [modal, setModal] = useState<AccountMode | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const active = useActive()
  const target = hover ?? active
  const closeModal = useCallback(() => setModal(null), [])

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

  // While the menu is open the page behind it stays completely still.
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const stop = (e: Event) => {
      if (!(e.target as HTMLElement | null)?.closest('#site-menu')) e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('touchmove', stop, { passive: false })
    document.addEventListener('wheel', stop, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      document.removeEventListener('touchmove', stop)
      document.removeEventListener('wheel', stop)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openModal = (mode: AccountMode) => {
    setOpen(false)
    setModal(mode)
  }

  return (
    <>
      <header className="sticky top-2 z-40 px-2 sm:px-4">
        {open && <div aria-hidden="true" className="fixed inset-0 z-30 bg-navy/25 backdrop-blur-md" />}

        <div className="header-ring relative z-40 mx-auto max-w-6xl rounded-full p-[1.5px] shadow-[0_18px_40px_-18px_rgba(7,27,53,0.45)]">
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
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="site-menu"
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E9C46A]/70 bg-white text-navy transition hover:shadow-card"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            <span ref={progress} aria-hidden="true" className="scroll-progress" />
          </div>
        </div>

        {open && (
          <div className="mx-auto max-w-6xl">
            <nav
              id="site-menu"
              aria-label="Menu"
              className="relative z-40 ml-auto mt-2 max-h-[calc(100dvh-6rem)] w-full overflow-y-auto rounded-3xl border border-[#E9C46A]/50 bg-white p-4 shadow-2xl sm:max-w-lg"
            >
              <ul className="grid grid-cols-2 gap-3">
                {MENU.map(({ label, href, Icon }, i) => (
                  <li key={label} className="menu-item" style={{ '--i': i } as CSSProperties}>
                    <a href={href} onClick={() => setOpen(false)} className="lux-box">
                      <span className="lux-icon">
                        <Icon className="h-[1.15rem] w-[1.15rem]" />
                      </span>
                      <span className="text-sm">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => openModal('login')} className="btn-secondary">
                  <LogIn className="h-4 w-4" /> Log in
                </button>
                <button type="button" onClick={() => openModal('signup')} className="btn-primary">
                  <UserPlus className="h-4 w-4" /> Sign up
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
      <SignupModal open={modal !== null} mode={modal ?? 'signup'} onClose={closeModal} />
    </>
  )
}
