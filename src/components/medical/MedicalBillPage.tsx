import { useEffect, useState } from 'react'
import { ArrowLeft, Camera, ShieldCheck } from 'lucide-react'
import Logo from '../Logo'
import BillWorkflow from './BillWorkflow'
import { PRICE_USD, formatPrice } from '../../data/tools'

const btn = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua'

const VALUE = [
  'Understand billing codes and line items as they appear on your bill.',
  'Find duplicate-looking charges and arithmetic inconsistencies.',
  'Compare totals, adjustments, payments, and balances.',
  'Identify charges that may need clarification.',
  'Prepare specific questions for the provider or insurer.',
]

const STEPS = [
  { t: 'Scan your bill', d: 'Use your camera, one page at a time. Retake any page that is blurry.' },
  { t: 'Review and enter the figures', d: 'Automatic text reading is not available yet, so you type the figures from your scan. Nothing is guessed.' },
  { t: 'Analyze charges', d: 'Rules-based checks look for arithmetic inconsistencies and possible duplicates.' },
  { t: 'Get questions to ask', d: 'Each finding shows its evidence and a question you can send to the billing department.' },
]

const FEATURES: { name: string; status: 'Available in this preview' | 'Coming next' | 'Not planned yet' }[] = [
  { name: 'Live camera scanning', status: 'Available in this preview' },
  { name: 'Multi-page capture, retake, and delete', status: 'Available in this preview' },
  { name: 'Manual entry and corrections', status: 'Available in this preview' },
  { name: 'Duplicate and arithmetic checks', status: 'Available in this preview' },
  { name: 'Suggested questions for the provider', status: 'Available in this preview' },
  { name: 'OCR text extraction and field confidence', status: 'Coming next' },
  { name: 'Downloadable report and billing-inquiry letter', status: 'Coming next' },
  { name: 'Billing-code explanations', status: 'Not planned yet' },
]

const FAQ = [
  { q: 'Why does it need my camera?', a: 'Only to photograph your bill. The camera opens after you tap “Open camera”, and it needs a secure (HTTPS) connection. If you deny permission, you can choose an image file or enter the details manually.' },
  { q: 'Is my bill uploaded or stored?', a: 'Not in this version. Scans stay in your browser’s memory and are discarded when you close or reload the page. If this ever changes, it will be explained before you scan.' },
  { q: 'Which bills are supported?', a: 'Itemized medical bills and statements you can photograph clearly. PDFs and HEIC photos are not supported yet. This version does not read Explanation of Benefits (EOB) documents. It only reminds you to compare them.' },
  { q: 'How does multi-page scanning work?', a: 'A camera only sees what is inside the frame, so scan each page separately. The checks only treat the line items as complete when you confirm you entered all of them.' },
  { q: 'How accurate is it?', a: 'The checks are exact arithmetic on the values you enter, so a mistyped number can cause a wrong flag. Flags are things to verify, not proof of an error.' },
  { q: 'Does it guarantee a refund or a lower bill?', a: 'No. It can help you ask better questions. Whether a charge is changed is up to your provider and insurer.' },
]

export default function MedicalBillPage() {
  const [startSignal, setStartSignal] = useState(0)

  useEffect(() => {
    const previous = document.title
    document.title = 'Medical Bill Checker — TickmarkTools'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="bg-slate-50 font-sans text-slate-800">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="bg-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" aria-label="TickmarkTools home" className={btn}>
            <Logo light />
          </a>
          <a href="/" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-200 hover:text-white ${btn}`}>
            <ArrowLeft className="h-4 w-4" /> All tools
          </a>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-800 px-4 pb-16 pt-12 text-white sm:px-6 lg:px-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-cyan-brand/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-aqua">Medical Bill Checker · Preview</p>
              <h1 className="mt-3 font-heading text-4xl font-bold leading-tight sm:text-5xl">Understand Your Medical Bill Before You Pay.</h1>
              <p className="mt-4 max-w-xl text-lg text-slate-200">Scan a bill, organize the charges, and highlight items worth verifying, with specific questions for your provider or insurer.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => setStartSignal((n) => n + 1)} className={`inline-flex items-center gap-2 rounded-full bg-aqua px-6 py-3 font-semibold text-navy shadow-glow hover:brightness-105 ${btn}`}>
                  <Camera className="h-5 w-5" /> Scan My Medical Bill
                </button>
                <a href="#how-it-works" className={`inline-flex items-center rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10 ${btn}`}>
                  See How It Works
                </a>
              </div>
              <p className="mt-5 flex max-w-xl items-start gap-2 text-sm text-slate-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                Your medical bill contains sensitive information. Review how your data is processed before scanning.
              </p>
            </div>
            <ScannerIllustration />
          </div>
        </section>

        <BillWorkflow startSignal={startSignal} />

        <section className="px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="value-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="value-title" className="font-heading text-2xl font-bold text-navy">How this can help</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {VALUE.map((v) => (
                <li key={v} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-card">
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-6 bg-white px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="how-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="how-title" className="font-heading text-2xl font-bold text-navy">How it works</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="font-mono text-xs text-teal-deep">Step {i + 1}</span>
                  <h3 className="mt-1 font-heading text-base font-semibold text-navy">{s.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="features-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="features-title" className="font-heading text-2xl font-bold text-navy">What works today, and what doesn’t yet</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-card">
                  <span>{f.name}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.status === 'Available in this preview' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{f.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="price-title">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-card">
            <h2 id="price-title" className="font-heading text-2xl font-bold text-navy">Planned pricing</h2>
            <p className="mt-3 font-heading text-4xl font-bold text-teal-deep">{formatPrice(PRICE_USD)}</p>
            <p className="text-sm text-slate-600">one-time per analysis (planned). No subscription.</p>
            <p className="mt-3 text-sm text-slate-600">Checkout is not available yet. Nothing is charged, and this preview is free to try.</p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="trust-title">
          <div className="mx-auto max-w-3xl">
            <h2 id="trust-title" className="font-heading text-2xl font-bold text-navy">Limits you should know about</h2>
            <p className="mt-3 text-sm text-slate-700">
              This tool helps you identify items to review. It cannot prove fraud, guarantee savings, or replace professional billing advice. Medical billing rules and coverage vary by provider, insurer, state, and plan. TickmarkTools does not claim HIPAA compliance or any certification.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="faq-title">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-title" className="font-heading text-2xl font-bold text-navy">Questions</h2>
            <div className="mt-5 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand">{f.q}</summary>
                  <p className="mt-2 text-sm text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy px-4 py-8 text-center text-sm text-slate-300">
        <Logo light />
        <p className="mt-3">Informational tool only. Not legal, medical, or financial advice.</p>
        <p className="mt-1 text-xs text-slate-400">Privacy Policy and Terms of Service: coming before public launch.</p>
      </footer>
    </div>
  )
}

/** Decorative illustration of a camera frame over a generic bill. It shows no results or numbers. */
function ScannerIllustration() {
  return (
    <svg viewBox="0 0 320 380" role="img" aria-label="Illustration of a phone camera framing a medical bill" className="mx-auto w-full max-w-xs">
      <rect x="40" y="10" width="240" height="360" rx="32" fill="#0C2749" stroke="#17B9F5" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="58" y="40" width="204" height="300" rx="16" fill="#12335C" />
      <rect x="92" y="78" width="136" height="224" rx="8" fill="#F8FAFC" />
      <rect x="106" y="96" width="60" height="8" rx="4" fill="#CBD5E1" />
      {[124, 144, 164, 184, 204, 224, 244].map((y) => (
        <rect key={y} x="106" y={y} width={y % 40 === 4 ? 90 : 108} height="6" rx="3" fill="#E2E8F0" />
      ))}
      <rect x="106" y="272" width="52" height="10" rx="5" fill="#CBD5E1" />
      <g fill="none" stroke="#00D6C9" strokeWidth="4" strokeLinecap="round">
        <path d="M80 106V88a8 8 0 0 1 8-8h18" />
        <path d="M240 80h-6a8 8 0 0 1 8 8v18" transform="translate(-14 0)" />
        <path d="M80 274v18a8 8 0 0 0 8 8h18" />
        <path d="M226 300h-6" />
      </g>
      <rect x="84" y="190" width="152" height="3" rx="1.5" fill="#17B9F5" className="motion-safe:animate-pulse" />
    </svg>
  )
}
