import { FEATURED_TOOLS } from './tools'
import type { Tool, ToolId } from './tools'

/** Keyword matching runs entirely in the browser. It is keyword scoring, not a language model. */
const KEYWORDS: Record<ToolId, string[]> = {
  'medical-bill-checker': [
    'medical', 'bill', 'bills', 'billing', 'hospital', 'doctor', 'clinic', 'insurance', 'eob',
    'health', 'charge', 'charges', 'duplicate', 'overcharged', 'overcharge', 'patient', 'surgery', 'procedure',
  ],
  'overdue-invoice-recovery-kit': [
    'invoice', 'invoices', 'overdue', 'unpaid', 'payment', 'paid', 'client', 'freelance', 'freelancer',
    'late', 'reminder', 'chase', 'collect', 'collection', 'followup', 'receivable',
  ],
  'car-repair-quote-checker': [
    'car', 'auto', 'vehicle', 'mechanic', 'garage', 'repair', 'repairs', 'estimate', 'quote',
    'brake', 'brakes', 'engine', 'tire', 'tyre', 'oil', 'workshop',
  ],
  'home-contractor-quote-checker': [
    'home', 'house', 'contractor', 'renovation', 'remodel', 'roof', 'roofing', 'kitchen', 'bathroom',
    'builder', 'construction', 'plumber', 'plumbing', 'electrician', 'estimate', 'quote', 'homeowner',
  ],
  'ecommerce-asset-auto-resizer': [
    'image', 'images', 'photo', 'photos', 'picture', 'resize', 'resizer', 'product', 'ecommerce',
    'amazon', 'shopify', 'ebay', 'etsy', 'marketplace', 'listing', 'crop', 'dimensions', 'instagram', 'social',
  ],
}

const STOP = new Set(['the', 'my', 'for', 'to', 'of', 'is', 'it', 'and', 'or', 'in', 'on', 'too', 'with', 'too', 'how', 'can', 'get'])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

function distance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array<number>(b.length + 1).fill(0)
    row[0] = i
    return row
  })
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

function tokenScore(token: string, word: string): number {
  if (token === word) return 3
  if (token.length >= 3 && word.startsWith(token)) return 2
  if (token.length >= 5 && Math.abs(token.length - word.length) <= 1 && distance(token, word) <= 1) return 1
  return 0
}

export interface SearchHit {
  tool: Tool
  score: number
}

export function searchTools(query: string, tools: readonly Tool[] = FEATURED_TOOLS): SearchHit[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const hits: SearchHit[] = []
  for (const tool of tools) {
    const words = [...KEYWORDS[tool.id], ...tokenize(tool.name)]
    let score = 0
    for (const token of tokens) {
      let best = 0
      for (const word of words) best = Math.max(best, tokenScore(token, word))
      score += best
    }
    if (score > 0) hits.push({ tool, score })
  }

  return hits.sort(
    (a, b) => b.score - a.score || tools.indexOf(a.tool) - tools.indexOf(b.tool),
  )
}
