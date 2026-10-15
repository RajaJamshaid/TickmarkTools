import { useId, useMemo, useState } from 'react'
import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react'
import { SmartSearchIcon } from './ToolIcons'
import ToolSticker from './ToolSticker'
import { searchTools } from '../data/search'
import { FEATURED_TOOLS } from '../data/tools'
import { keepSearchVisible } from '../lib/searchFocus'

function goTo(id: string) {
  const el = document.getElementById(`tool-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'auto', block: 'center' })
  el.classList.remove('card-ping')
  void el.offsetWidth
  el.classList.add('card-ping')
  window.setTimeout(() => el.classList.remove('card-ping'), 3000)
}

/** Keyword search over the featured tools. Runs in the browser; nothing is sent anywhere. */
export default function SmartSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const listId = useId()
  const hits = useMemo(() => searchTools(query), [query])
  const active = query.trim().length > 0
  const items = active ? hits.map((h) => h.tool) : FEATURED_TOOLS

  const pick = (id: string) => {
    setQuery('')
    setFocused(false)
    ;(document.activeElement as HTMLElement | null)?.blur()
    goTo(id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && active && hits[0]) pick(hits[0].tool.id)
    if (e.key === 'Escape') {
      setQuery('')
      setFocused(false)
    }
  }

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
  }

  return (
    <div id="smart-search-box" className="relative z-30 mx-auto mt-4 max-w-2xl" onBlur={onBlur}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pr-4 shadow-card focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/15">
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
          onFocus={() => {
            setFocused(true)
            if (window.matchMedia('(max-width: 767px)').matches) keepSearchVisible()
          }}
          placeholder="Describe your problem, e.g. hospital bill too high"
          aria-controls={focused ? listId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-navy placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {focused && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
        >
          {items.length > 0 ? (
            <ul id={listId}>
              {!active && (
                <li aria-hidden="true" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Our tools
                </li>
              )}
              {items.map((tool) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => pick(tool.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    <ToolSticker id={tool.id} size={40} className="h-10 w-10 shrink-0" still />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{tool.name}</span>
                      <span className="block truncate text-xs text-slate-500">{tool.description}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">Coming soon</span>
                  </button>
                </li>
              ))}
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
