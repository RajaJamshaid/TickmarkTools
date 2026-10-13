import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

const NAV = [
  { label: 'Home', href: '#main' },
  { label: 'Tools', href: '#tools' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
] as const

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#main" aria-label="TickmarkTools home">
          <Logo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-accent ${
                i === 0 ? 'text-accent' : 'text-slate-600'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#tools"
            className="hidden rounded-xl bg-gradient-to-r from-accent to-cyan-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 sm:inline-block"
          >
            Get Started
          </a>
          <button
            type="button"
            className="rounded-lg p-2 text-navy md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-slate-100 bg-white md:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-3">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#tools"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-gradient-to-r from-accent to-cyan-brand px-4 py-3 text-center font-semibold text-white"
              >
                Get Started
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
