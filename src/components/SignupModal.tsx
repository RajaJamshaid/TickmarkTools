import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Check, Sparkles, X } from 'lucide-react'

export type AccountMode = 'signup' | 'login'
type Status = 'idle' | 'sending' | 'sent' | 'error'

const style = (vars: Record<string, string | number>) => vars as CSSProperties

/** Early-access list. Real accounts are not live yet, and this says so plainly. */
export default function SignupModal({
  open,
  mode,
  onClose,
}: {
  open: boolean
  mode: AccountMode
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const login = mode === 'login'

  useEffect(() => {
    if (!open) return
    setStatus('idle')
    setMessage('')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, website: trap }),
      })
      if (res.ok) {
        setStatus('sent')
        setEmail('')
        return
      }
      setStatus('error')
      if (res.status === 429) setMessage('Too many attempts from this device. Please try again later.')
      else if (res.status === 400) setMessage('Please check your email address and try again.')
      else setMessage('This is not available right now. Please try again later.')
    } catch {
      setStatus('error')
      setMessage('Network problem. Please check your connection and try again.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-navy/60" />
      <div className="modal-in relative w-full max-w-md rounded-3xl border border-white/30 bg-white p-6 shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {status === 'sent' ? (
          <div className="py-6 text-center" role="status">
            <span className="icon-tile mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600" style={style({ '--accent': '#10B981' })}>
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <p className="mt-5 font-heading text-2xl font-bold text-navy">You are on the list!</p>
            <p className="mt-1 text-slate-600">We will email you when accounts open.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <span className="icon-tile bg-gradient-to-br from-accent to-sky-700" style={style({ '--accent': '#4F46E5' })}>
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 id="account-title" className="mt-4 text-2xl font-bold">
              {login ? 'Log in' : 'Create your free account'}
            </h2>
            <p className="mt-1 text-slate-600">
              {login
                ? 'Log in is not available yet. Join the early access list and we will email you when it opens.'
                : 'Accounts open soon. Reserve your spot and get early access to member features.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">You never need an account to use our tools.</p>

            <label htmlFor="account-email" className="mt-5 block text-sm font-semibold text-navy">Email</label>
            <input
              id="account-email"
              ref={inputRef}
              type="email"
              autoComplete="email"
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-navy focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
            />

            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="account-website">Leave this field empty</label>
              <input id="account-website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn-shine mt-4 w-full rounded-xl bg-gradient-to-r from-navy via-navy-700 to-accent px-6 py-3.5 font-semibold text-white shadow-glow ring-1 ring-[#E9C46A]/70 transition hover:brightness-110 disabled:opacity-70"
            >
              {status === 'sending' ? 'Sending...' : login ? 'Notify me' : 'Reserve my spot'}
            </button>

            <p role="status" aria-live="polite" className={`mt-3 min-h-[1.25rem] text-sm ${status === 'error' ? 'text-rose-600' : 'text-transparent'}`}>
              {status === 'error' ? message : ''}
            </p>
            <p className="text-xs text-slate-500">We will only use your email to tell you when accounts open.</p>
          </form>
        )}
      </div>
    </div>
  )
}
