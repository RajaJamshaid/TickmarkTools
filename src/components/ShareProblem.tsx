import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Check, Lightbulb, Send } from 'lucide-react'
import Reveal from './Reveal'

const EXAMPLES = [
  'My lease has clauses I do not understand...',
  'I need a quick way to compare job offers...',
  'My insurance paperwork makes no sense...',
  'I wish there was a tool that...',
]
const MAX = 600

type Status = 'idle' | 'sending' | 'sent' | 'error'

const style = (vars: Record<string, string | number>) => vars as CSSProperties

export default function ShareProblem() {
  const [problem, setProblem] = useState('')
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [example, setExample] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setExample((n) => (n + 1) % EXAMPLES.length), 3500)
    return () => window.clearInterval(t)
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    const text = problem.trim()
    if (text.length < 10) {
      setStatus('error')
      setMessage('Please describe your problem in at least 10 characters.')
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: text, email: email.trim(), website: trap }),
      })
      if (res.ok) {
        setStatus('sent')
        setProblem('')
        setEmail('')
        return
      }
      setStatus('error')
      if (res.status === 429) setMessage('Too many submissions from this device. Please try again later.')
      else if (res.status === 400) setMessage('Please check your message and email, then try again.')
      else setMessage('Sharing is not available right now. Please try again later.')
    } catch {
      setStatus('error')
      setMessage('Network problem. Please check your connection and try again.')
    }
  }

  return (
    <section id="share" aria-labelledby="share-heading" className="relative py-8 sm:py-12">
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <Reveal>
          <div>
            <span
              className="icon-tile bg-gradient-to-br from-amber-400 to-orange-500"
              style={style({ '--accent': '#F59E0B' })}
            >
              <Lightbulb className="h-7 w-7" />
            </span>
            <h2 id="share-heading" className="mt-5 text-4xl font-bold sm:text-5xl">
              Got a Problem? <span className="text-gradient">We Will Build the Tool.</span>
            </h2>
            <p className="mt-3 max-w-md text-lg text-slate-600">
              Tell us what frustrates you. It helps us decide what to build next.
            </p>
            <ul aria-hidden="true" className="mt-6 flex flex-wrap gap-2.5">
              {['Confusing bill?', 'Unclear quote?', 'Too much paperwork?'].map((t, i) => (
                <li
                  key={t}
                  className="float rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-card"
                  style={style({ '--dur': `${5 + i}s`, '--r': `${i % 2 === 0 ? -2 : 2}deg` })}
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-22px_rgba(7,27,53,0.35)] sm:p-6">
            {status === 'sent' ? (
              <div className="py-8 text-center" role="status">
                <span
                  className="icon-tile mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600"
                  style={style({ '--accent': '#10B981' })}
                >
                  <Check className="h-7 w-7" strokeWidth={3} />
                </span>
                <p className="mt-5 font-heading text-2xl font-bold text-navy">Thank you!</p>
                <p className="mt-1 text-slate-600">This helps us decide what to build next.</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
                >
                  Share another
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <label htmlFor="problem" className="block text-sm font-semibold text-navy">
                  Your problem
                </label>
                <textarea
                  id="problem"
                  rows={5}
                  maxLength={MAX}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder={EXAMPLES[example]}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-base text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                />
                <p className="mt-1 text-right text-xs text-slate-500">{problem.length}/{MAX}</p>

                <label htmlFor="problem-email" className="mt-3 block text-sm font-semibold text-navy">
                  Email <span className="font-normal text-slate-500">(optional, only if you want a reply)</span>
                </label>
                <input
                  id="problem-email"
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-navy focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                />

                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="problem-website">Leave this field empty</label>
                  <input id="problem-website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-shine mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-sky-700 px-6 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
                >
                  {status === 'sending' ? 'Sending...' : 'Share my problem'} <Send className="h-4 w-4" />
                </button>

                <p role="status" aria-live="polite" className={`mt-3 min-h-[1.25rem] text-sm ${status === 'error' ? 'text-rose-600' : 'text-transparent'}`}>
                  {status === 'error' ? message : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Please do not include personal, medical, or financial details. Messages are only used to decide which tools to build.
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
