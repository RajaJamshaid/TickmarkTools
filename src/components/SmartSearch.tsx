import { useId, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { SmartSearchIcon } from './ToolIcons'
import { LOOK } from './toolLook'
import { searchTools } from '../data/search'

const SUGGESTIONS = ['hospital bill', 'unpaid invoice', 'mechanic quote', 'resize product photos']

function goTo(id: string) {
  const el = document.getElementById(`tool-${id}`)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  el.classList.remove('card-ping')
  void el.offsetWidth
  el.classList.add('card-ping')
  window.setTimeout(() => el.classList.remove('card-ping'), 3000)
}

/** Keyword search over the featured tools. Runs in the browser; nothing is sent anywhere. */
export default function SmartSearch() {
  const [query, setQuery] = useState('')
  const listId = useId()
  const hits = useMemo(() => searchTools(query), [query])
  const active = query.trim().length > 0

  const pick = (id: string) => {
    goTo(id)
    setQuery('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hits[0]) pick(hits[0].tool.id)
    if (e.key === 'Escape') setQuery('')
  }

  return (
    <div className="relative z-30 mx-auto mt-8 max-w-2xl">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 p-2 pr-4 shadow-card backdrop-blur focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/15">
        <span
          className="icon-tile icon-tile-sm shrink-0 bg-gradient-to-br from-accent to-sky-700"
          style={{ '--accent': '#4F46E5' } as CSSProperties}
        >
          <SmartSearchIcon className="h-6 w-6" />
        </span>
        <label htmlFor="smart-search" className="sr-only">
          Smart search
        </label>
        <input
          id="smart-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe your problem, e.g. hospital bill too high"
          aria-controls={active ? listId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-navy placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {!active && (
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-accent/40 hover:text-accent"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          {hits.length > 0 ? (
            <ul id={listId}>
              {hits.map((h) => {
                const look = LOOK[h.tool.accent]
                return (
                  <li key={h.tool.id}>
                    <button
                      type="button"
                      onClick={() => pick(h.tool.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${look.dot}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy">{h.tool.name}</span>
                        <span className="block truncate text-xs text-slate-500">{h.tool.description}</span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">Coming soon</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p id={listId} className="px-3 py-3 text-sm text-slate-500">
              No match yet. Tools launch one by one.
            </p>
          )}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {active ? `${hits.length} ${hits.length === 1 ? 'tool' : 'tools'} found` : ''}
      </p>
      <p className="mt-3 text-center text-xs text-slate-500">Runs in your browser. Nothing is sent.</p>
    </div>
  )
}
