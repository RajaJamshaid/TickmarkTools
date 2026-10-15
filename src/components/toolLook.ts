import type { Accent } from '../data/tools'

export interface Look {
  price: string
  badge: string
  button: string
  accent: string
  tint: string
  edge: string
  glow: string
  strong: string
}

/** Light card colors taken from each tool's sticker: teal, sky blue, warm orange, gold, lavender. */
export const LOOK: Record<Accent, Look> = {
  teal: {
    price: 'text-teal-700',
    badge: 'border-teal-200 bg-teal-50 text-teal-700',
    button: 'border-teal-200 bg-teal-50 text-teal-700',
    accent: '#14B8B2',
    tint: 'rgba(20,184,178,0.15)',
    edge: 'rgba(20,184,178,0.45)',
    glow: 'rgba(20,184,178,0.22)',
    strong: 'rgba(20,184,178,0.45)',
  },
  sky: {
    price: 'text-sky-700',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
    button: 'border-sky-200 bg-sky-50 text-sky-700',
    accent: '#38A9DC',
    tint: 'rgba(56,169,220,0.16)',
    edge: 'rgba(56,169,220,0.45)',
    glow: 'rgba(56,169,220,0.22)',
    strong: 'rgba(56,169,220,0.45)',
  },
  orange: {
    price: 'text-orange-700',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    button: 'border-orange-200 bg-orange-50 text-orange-700',
    accent: '#EE7B30',
    tint: 'rgba(238,123,48,0.14)',
    edge: 'rgba(238,123,48,0.45)',
    glow: 'rgba(238,123,48,0.22)',
    strong: 'rgba(238,123,48,0.45)',
  },
  gold: {
    price: 'text-amber-700',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    button: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: '#D9A03A',
    tint: 'rgba(217,160,58,0.18)',
    edge: 'rgba(217,160,58,0.5)',
    glow: 'rgba(217,160,58,0.22)',
    strong: 'rgba(217,160,58,0.45)',
  },
  violet: {
    price: 'text-violet-700',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    button: 'border-violet-200 bg-violet-50 text-violet-700',
    accent: '#8B6CE0',
    tint: 'rgba(139,108,224,0.15)',
    edge: 'rgba(139,108,224,0.45)',
    glow: 'rgba(139,108,224,0.22)',
    strong: 'rgba(139,108,224,0.45)',
  },
}
