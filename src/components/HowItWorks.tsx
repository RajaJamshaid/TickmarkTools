import { ClipboardCheck, FileDown, Upload } from 'lucide-react'

const STEPS = [
  {
    icon: <Upload className="h-6 w-6" />,
    title: 'Upload Your Document',
    text: 'Most document tools start with a file upload. Some tools use simple inputs instead.',
  },
  {
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: 'Review the Analysis',
    text: 'See what the tool found and what still needs confirmation.',
  },
  {
    icon: <FileDown className="h-6 w-6" />,
    title: 'Get Your Report and Next Steps',
    text: 'Receive a clear report and practical questions or messages you can use.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="how-heading" className="text-3xl font-bold sm:text-4xl">How It Works</h2>
        <p className="mt-2 text-sm text-slate-500">Planned flow. Tools are not yet available.</p>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-white p-6 shadow-card">
              <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-brand/15 text-sky-700">{s.icon}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
