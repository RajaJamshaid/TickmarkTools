import Logo from './Logo'

const LINKS = [
  { label: 'Home', href: '#main' },
  { label: 'Tools', href: '#tools' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
]

// Legal and contact pages are not written yet; shown as plain text, not links.
const PENDING = ['Privacy Policy', 'Terms of Service', 'Contact']

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div>
          <Logo light />
          <p className="mt-3 text-sm">Small Tools. Big Solutions.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-white">{l.label}</a>
          ))}
          {PENDING.map((l) => (
            <span key={l} className="text-slate-500">{l} (coming soon)</span>
          ))}
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TickmarkTools
      </p>
    </footer>
  )
}
