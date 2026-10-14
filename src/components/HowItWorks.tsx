import type { CSSProperties } from 'react'
import { ClipboardCheck, FileDown, Upload } from 'lucide-react'
import Reveal from './Reveal'

const STEPS = [
  { icon: <Upload className="h-7 w-7" />, title: 'Upload', text: 'Add your document.' },
  { icon: <ClipboardCheck className="h-7 w-7" />, title: 'Review', text: 'See what stands out.' },
  { icon: <FileDown className="h-7 w-7" />, title: 'Get Your Report', text: 'Clear next steps.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="how-heading" className="text-4xl font-bold sm:text-5xl">How It Works</h2>
          <p className="mt-2 text-sm text-slate-500">Planned flow</p>
        </Reveal>
        <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div aria-hidden="true" className="flow-line absolute left-[17%] right-[17%] top-[3.25rem] hidden md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative z-10">
              <Reveal delay={i * 70} className="h-full">
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-22px_rgba(7,27,53,0.3)] transition hover:-translate-y-1">
                  <span
                    className="icon-tile mx-auto bg-gradient-to-br from-accent to-sky-700"
                    style={{ '--accent': '#4F46E5' } as CSSProperties}
                  >
                    {s.icon}
                  </span>
                  <p className="mt-4 font-heading text-xs font-bold tracking-widest text-accent">STEP {i + 1}</p>
                  <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
