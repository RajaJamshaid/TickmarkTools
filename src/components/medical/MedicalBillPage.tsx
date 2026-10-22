import { useEffect, useState } from 'react'
import { Camera, Check, Download, FileSearch, ListChecks, ShieldCheck, X } from 'lucide-react'
import Logo from '../Logo'
import BillWorkflow from './BillWorkflow'
import Faq from './landing/Faq'
import InteractiveDemo from './landing/InteractiveDemo'
import SampleBillCard from './landing/SampleBillCard'
import { AddPreview, CaptureMock, FindingMock, NextPreview, ReadMock, ReviewPreview } from './landing/Previews'
import { PRICE_USD, formatPrice } from '../../data/tools'
import { btnPrimary, btnSecondary, card, eyebrow, focus, h2, lead } from './landing/ui'

const TITLE = 'Medical Bill Checker \u2014 Review Charges & Billing Details | TickmarkTools'

const TRUST = [
  { Icon: ShieldCheck, text: 'Privacy-conscious bill review' },
  { Icon: FileSearch, text: 'Clear explanations of flagged items' },
  { Icon: ListChecks, text: 'Organized review notes' },
  { Icon: Download, text: 'CSV export of line items and findings' },
]

const CONFUSIONS = [
  'Unfamiliar billing descriptions.',
  'Duplicate-looking entries that require verification.',
  'Charges that may need clarification.',
  'Differences between a provider bill and an insurance explanation of benefits.',
  'Difficulty organizing questions before contacting billing support.',
]

const STEPS = [
  {
    n: '01',
    title: 'Add Your Bill',
    text: 'Capture bill pages with your camera, choose an image, or enter the details manually.',
    Preview: AddPreview,
  },
  {
    n: '02',
    title: 'Review the Findings',
    text: 'Check the figures that were read from your bill, then see items flagged for further review. Text reading can misread numbers, so verify each figure against your original bill.',
    Preview: ReviewPreview,
  },
  {
    n: '03',
    title: 'Prepare Your Next Steps',
    text: 'Review suggested questions and an editable letter, and export your line items and findings as a CSV file.',
    Preview: NextPreview,
  },
]

const FEATURES = [
  {
    title: 'Capture every page, your way',
    status: 'Available in this preview',
    text: 'Scan with your camera one page at a time, retake or delete any page, choose an image file, or enter the charges by hand. A camera only sees what is inside the frame, so each page is captured separately.',
    Mock: CaptureMock,
  },
  {
    title: 'Text reading on your device',
    status: 'In testing',
    text: 'Optional on-device text reading (OCR) turns a scan into editable draft fields. Everything it reads stays unchecked until you confirm or correct it.',
    Mock: ReadMock,
  },
  {
    title: 'Findings, questions, and a letter you can edit',
    status: 'Available in this preview',
    text: 'Rules-based checks look for arithmetic inconsistencies and similar-looking entries in the values you confirmed. Each finding shows its evidence and a question you can ask, plus a neutral letter you can edit, and a CSV export.',
    Mock: FindingMock,
  },
]

const CAN = [
  'Help you organize bill information.',
  'Point out entries that may be worth reviewing.',
  'Prepare specific questions for your provider or insurer.',
]

const CANNOT = [
  'Prove fraud or confirm that a bill is wrong.',
  'Determine the amount you legally owe.',
  'Guarantee insurance coverage or any savings.',
]

const FAQ = [
  {
    q: 'What does the Medical Bill Checker do?',
    a: 'It helps you review an itemized medical bill. You add the bill, check the figures, and the tool runs rules-based checks for arithmetic inconsistencies and similar-looking entries. Each finding comes with its evidence and a question you can ask your provider or insurer.',
  },
  {
    q: 'Can it guarantee that my bill is correct?',
    a: 'No. It cannot confirm whether a bill is right or wrong, and it cannot determine the amount you legally owe. Flags are things to verify, not proof of an error.',
  },
  {
    q: 'Can it detect duplicate charges?',
    a: 'It can flag entries that look similar, for example the same description and amount, so you can ask about them. Similar entries are not automatically duplicates, because a provider may bill separate services that share a description. Whether an entry is a duplicate is for your provider to confirm.',
  },
  {
    q: 'Does it upload my medical bill?',
    a: 'The checker is built to work in your browser. Scans stay in your browser\u2019s memory and are discarded when you close or reload the page. If you choose to read text from a scan, a reader downloaded from tickmarktools.com does it on your device. This page\u2019s security policy only allows connections to tickmarktools.com, so bill content cannot be sent to third-party services from here. The page does load fonts from Google Fonts, and that request does not include your bill.',
  },
  {
    q: 'Can I capture multiple pages?',
    a: 'Yes. Scan each page separately and retake or delete any page that is blurry. The checks only treat the line items as complete after you confirm that you entered all of them.',
  },
  {
    q: 'What if the OCR reads a charge incorrectly?',
    a: 'Text reading can misread numbers, which is why everything it reads is a draft that stays unchecked until you confirm or correct it. Compare each figure with your original bill. A wrong value can cause a wrong flag.',
  },
  {
    q: 'Can I export my results?',
    a: 'Yes. You can export your line items and findings as a CSV file. A PDF report is not available yet.',
  },
  {
    q: 'Is this a replacement for my insurer or billing department?',
    a: 'No. It helps you organize information and prepare questions. Your provider and insurer make the decisions about your charges, coverage, and adjustments. Medical billing rules vary by provider, insurer, state, and plan.',
  },
]

const PRIVACY_FACTS = [
  'Text reading runs on your device. The reader and its English language data are served from tickmarktools.com itself, not from a third-party host.',
  'Scans stay in your browser\u2019s memory and are discarded when you close or reload the page.',
  'This page\u2019s security policy only allows connections to tickmarktools.com, so bill content cannot be sent to third-party services from here.',
  'The page loads fonts from Google Fonts. That request does not include your bill.',
]

const statusClass = (s: string) =>
  s === 'In testing'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-[#C9D8C8] bg-[#E6EDE4] text-[#2F5A4A]'

export default function MedicalBillPage() {
  const [startSignal, setStartSignal] = useState(0)
  const start = () => setStartSignal((n) => n + 1)

  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="bg-[#FAF9F6] font-sans text-[#172033]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#E4DED0] bg-[#FAF9F6]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" aria-label="TickmarkTools home" className={focus}>
            <Logo />
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-[#46506A] md:flex">
            <a href="/" className={`hover:text-[#146356] ${focus}`}>Home</a>
            <a href="#how-it-works" className={`hover:text-[#146356] ${focus}`}>How it works</a>
            <a href="#privacy" className={`hover:text-[#146356] ${focus}`}>Privacy</a>
            <a href="#faq" className={`hover:text-[#146356] ${focus}`}>FAQ</a>
          </nav>
          <button type="button" onClick={start} className={`${btnPrimary} hidden !px-4 !py-2 text-sm sm:inline-flex`}>
            Check My Medical Bill
          </button>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className={eyebrow}>Medical bill review</p>
              <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-[#172033] sm:text-5xl lg:text-[3.3rem]">
                Understand Your Medical Bill. <span className="text-[#146356]">Question Charges With Confidence.</span>
              </h1>
              <p className={`mt-5 max-w-xl ${lead}`}>
                Review medical bills, organize charges, and flag items that may deserve a closer look\u2014before you contact your healthcare provider or insurer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={start} className={btnPrimary}>
                  <Camera className="h-5 w-5" aria-hidden="true" /> Check My Medical Bill
                </button>
                <a href="#how-it-works" className={btnSecondary}>
                  See How It Works
                </a>
              </div>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#5B647A]">
                Designed with privacy in mind \u00b7 Review before you share \u00b7 No guaranteed savings claims
              </p>
            </div>
            <SampleBillCard />
          </div>
        </section>

        {/* Trust bar */}
        <section aria-label="Highlights" className="border-y border-[#E4DED0] bg-white px-4 py-6 sm:px-6 lg:px-8">
          <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium text-[#172033]">
                <Icon className="h-5 w-5 shrink-0 text-[#146356]" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Problem and value */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="problem-title">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className={eyebrow}>Why it is hard</p>
              <h2 id="problem-title" className={`mt-3 ${h2}`}>
                Medical bills can be difficult to review. Start with a clearer breakdown.
              </h2>
              <p className={`mt-5 ${lead}`}>
                The checker is a practical review assistant. It is not a substitute for a qualified billing professional, your insurer, or your healthcare provider.
              </p>
            </div>
            <div>
              <ul className="divide-y divide-[#E4DED0] border-y border-[#E4DED0]">
                {CONFUSIONS.map((c, i) => (
                  <li key={c} className="flex items-baseline gap-4 py-4">
                    <span className="font-mono text-xs text-[#146356]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-base text-[#172033]">{c}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl border border-[#C9D8C8] bg-[#EEF4F1] p-4 text-sm leading-relaxed text-[#2F4A40]">
                Similar-looking entries are not automatically duplicate charges. Insurance coverage, billing codes, and contractual adjustments all need context.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-[#E4DED0] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="how-title">
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>How it works</p>
            <h2 id="how-title" className={`mt-3 ${h2}`}>Three steps, in plain order.</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ n, title, text, Preview }) => (
                <li key={n} className={`${card} flex flex-col p-6`}>
                  <span className="font-mono text-sm text-[#146356]">{n}</span>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-[#172033]">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#46506A]">{text}</p>
                  <div className="mt-5">
                    <Preview />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The real tool */}
        <section id="check" className="scroll-mt-20 px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24" aria-labelledby="check-title">
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>The checker</p>
            <h2 id="check-title" className={`mt-3 ${h2}`}>Start your review.</h2>
            <p className={`mt-4 max-w-2xl ${lead}`}>This is the working preview. It is free to try, and nothing is charged.</p>
          </div>
        </section>
        <BillWorkflow startSignal={startSignal} />

        {/* Features */}
        <section className="border-t border-[#E4DED0] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="features-title">
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>What you can do</p>
            <h2 id="features-title" className={`mt-3 ${h2}`}>Built around what actually works today.</h2>
            <div className="mt-12 space-y-16">
              {FEATURES.map(({ title, status, text, Mock }, i) => (
                <div key={title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(status)}`}>{status}</span>
                    <h3 className="mt-3 font-heading text-2xl font-semibold text-[#172033]">{title}</h3>
                    <p className={`mt-3 ${lead}`}>{text}</p>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <Mock />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-12 rounded-xl border border-[#E4DED0] bg-[#FBFAF7] p-4 text-sm text-[#46506A]">
              Not available yet: a PDF report and billing-code explanations. This version does not read Explanation of Benefits (EOB) documents, and it only reminds you to compare them.
            </p>
          </div>
        </section>

        {/* Interactive sample */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="demo-title">
          <div className="mx-auto max-w-4xl">
            <p className={eyebrow}>Try a sample</p>
            <h2 id="demo-title" className={`mt-3 ${h2}`}>Explore a sample review.</h2>
            <p className={`mt-4 max-w-2xl ${lead}`}>
              This demo uses fictional data. It does not analyze a real bill, and nothing you do here is sent anywhere.
            </p>
            <div className="mt-8">
              <InteractiveDemo />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-20 border-t border-[#E4DED0] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="privacy-title">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className={eyebrow}>Privacy</p>
              <h2 id="privacy-title" className={`mt-3 ${h2}`}>Your medical information deserves careful handling.</h2>
              <p className={`mt-5 ${lead}`}>
                A medical bill contains sensitive details. Here is what we verified in how this page works, stated plainly.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-[#5B647A]">
                We do not claim HIPAA compliance or any certification. A Privacy Policy and Terms of Service are coming before public launch.
              </p>
            </div>
            <ul className="space-y-4">
              {PRIVACY_FACTS.map((f) => (
                <li key={f} className="flex gap-3 rounded-xl border border-[#E4DED0] bg-[#FBFAF7] p-4 text-sm leading-relaxed text-[#46506A]">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#146356]" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Limits */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="limits-title">
          <div className="mx-auto max-w-4xl">
            <p className={eyebrow}>Results and limits</p>
            <h2 id="limits-title" className={`mt-3 ${h2}`}>What it can and cannot do.</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className={`${card} p-6`}>
                <h3 className="font-heading text-lg font-semibold text-[#172033]">It can</h3>
                <ul className="mt-4 space-y-3">
                  {CAN.map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-[#46506A]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#146356]" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${card} p-6`}>
                <h3 className="font-heading text-lg font-semibold text-[#172033]">It cannot</h3>
                <ul className="mt-4 space-y-3">
                  {CANNOT.map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-[#46506A]">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6D1F]" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-[#E4DED0] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="faq-title">
          <div className="mx-auto max-w-3xl">
            <p className={eyebrow}>FAQ</p>
            <h2 id="faq-title" className={`mt-3 ${h2}`}>Questions, answered carefully.</h2>
            <div className="mt-8">
              <Faq items={FAQ} />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="cta-title">
          <div className="mx-auto max-w-4xl rounded-2xl bg-[#146356] px-6 py-12 text-center text-white sm:px-12">
            <h2 id="cta-title" className="font-heading text-3xl font-bold leading-tight sm:text-4xl">Take a closer look at your medical bill.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#D7E8E2]">
              Organize the details, review potential concerns, and prepare informed questions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={start}
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#146356] transition-colors hover:bg-[#F3F0E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                <Camera className="h-5 w-5" aria-hidden="true" /> Check My Medical Bill
              </button>
              <a href="#how-it-works" className="text-base font-semibold text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                How It Works
              </a>
            </div>
            <p className="mt-6 text-sm text-[#D7E8E2]">
              Free to try in this preview. Planned price: {formatPrice(PRICE_USD)} one-time. Checkout is not available yet, and nothing is charged.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E4DED0] bg-[#FAF9F6] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-[#5B647A]">Informational tool only. Not legal, medical, or financial advice.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <a href="/" className={`text-[#46506A] hover:text-[#146356] ${focus}`}>Home</a>
            <a href="#main" className={`text-[#46506A] hover:text-[#146356] ${focus}`}>Medical Bill Checker</a>
            <a href="#how-it-works" className={`text-[#46506A] hover:text-[#146356] ${focus}`}>How It Works</a>
            <span className="text-[#8A93A6]">Privacy Policy (coming soon)</span>
            <span className="text-[#8A93A6]">Terms of Service (coming soon)</span>
            <span className="text-[#8A93A6]">Contact (coming soon)</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
