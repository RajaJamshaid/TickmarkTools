import type { Accent } from '../data/tools'

export interface Look {
  tile: string
  dot: string
  price: string
  badge: string
  button: string
  accent: string
  tint: string
  edge: string
  glow: string
  strong: string
}

/** Identity color per tool: rose = health, emerald = money, blue = auto, amber = construction, violet = creative. */
export const LOOK: Record<Accent, Look> = {
  rose: {
    tile: 'from-rose-400 to-rose-600',
    dot: 'bg-rose-500',
    price: 'text-rose-600',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    button: 'border-rose-200 bg-rose-50/70 text-rose-700',
    accent: '#F43F5E',
    tint: 'rgba(244,63,94,0.10)',
    edge: 'rgba(244,63,94,0.30)',
    glow: 'rgba(244,63,94,0.22)',
    strong: 'rgba(244,63,94,0.42)',
  },
  emerald: {
    tile: 'from-emerald-400 to-emerald-600',
    dot: 'bg-emerald-500',
    price: 'text-emerald-700',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    button: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    accent: '#10B981',
    tint: 'rgba(16,185,129,0.10)',
    edge: 'rgba(16,185,129,0.30)',
    glow: 'rgba(16,185,129,0.22)',
    strong: 'rgba(16,185,129,0.42)',
  },
  blue: {
    tile: 'from-sky-400 to-blue-600',
    dot: 'bg-blue-500',
    price: 'text-blue-700',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    button: 'border-blue-200 bg-blue-50/70 text-blue-700',
    accent: '#3B82F6',
    tint: 'rgba(59,130,246,0.10)',
    edge: 'rgba(59,130,246,0.30)',
    glow: 'rgba(59,130,246,0.22)',
    strong: 'rgba(59,130,246,0.42)',
  },
  amber: {
    tile: 'from-amber-400 to-orange-500',
    dot: 'bg-amber-500',
    price: 'text-amber-700',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    button: 'border-amber-200 bg-amber-50/70 text-amber-700',
    accent: '#F59E0B',
    tint: 'rgba(245,158,11,0.11)',
    edge: 'rgba(245,158,11,0.32)',
    glow: 'rgba(245,158,11,0.22)',
    strong: 'rgba(245,158,11,0.42)',
  },
  violet: {
    tile: 'from-violet-400 to-violet-600',
    dot: 'bg-violet-500',
    price: 'text-violet-700',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    button: 'border-violet-200 bg-violet-50/70 text-violet-700',
    accent: '#8B5CF6',
    tint: 'rgba(139,92,246,0.10)',
    edge: 'rgba(139,92,246,0.30)',
    glow: 'rgba(139,92,246,0.22)',
    strong: 'rgba(139,92,246,0.42)',
  },
}
