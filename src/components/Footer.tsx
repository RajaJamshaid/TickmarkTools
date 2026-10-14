import Logo from './Logo'

const PRODUCT = [
  { label: 'Tools', href: '#tools' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Share a Problem', href: '#share' },
]
const COMPANY = [{ label: 'About', href: '#about' }]

// These pages are not written yet. They are shown as plain text, never as broken links.
const COMPANY_PENDING = ['Contact']
const LEGAL_PENDING = ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Disclaimer', 'Cookie Policy']

function Soon({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-slate-400">
      {label}
      <span className="rounded-full border border-white/15 px-1.5 text-[10px] uppercase tracking-wide">Soon</span>
    </li>
  )
}

function Links({ items }: { items: { label: string; href: string }[] }) {
  return (
    <>
      {items.map((l) => (
        <li key={l.label}>
          <a href={l.href} className="transition hover:text-white">{l.label}</a>
        </li>
      ))}
    </>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo light />
          <p className="mt-3 text-sm">Small Tools. Big Solutions.</p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">One-time tools for everyday problems.</p>
        </div>
        <nav aria-label="Product">
          <h2 className="font-heading text-sm font-bold text-white">Product</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Links items={PRODUCT} />
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className="font-heading text-sm font-bold text-white">Company</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Links items={COMPANY} />
            {COMPANY_PENDING.map((l) => (
              <Soon key={l} label={l} />
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="font-heading text-sm font-bold text-white">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {LEGAL_PENDING.map((l) => (
              <Soon key={l} label={l} />
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        <p>Informational tools only. Not legal, medical, or financial advice. Prices are in US dollars (USD).</p>
        <p className="mt-1">© {new Date().getFullYear()} TickmarkTools. All rights reserved.</p>
      </div>
    </footer>
  )
}
