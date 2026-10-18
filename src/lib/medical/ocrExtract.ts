import type { OcrLine, OcrPageResult } from './ocr'

/**
 * Converts a Tesseract.js result (or anything shaped like one) into OcrPageResult.
 * Defensive on purpose: unknown shapes yield empty results, never invented text.
 */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)
const notNull = (l: OcrLine | null): l is OcrLine => l !== null

function lineFrom(raw: unknown): OcrLine | null {
  if (!isRecord(raw)) return null
  const words = asArray(raw.words).filter(isRecord)
  const joined = words.map((w) => (typeof w.text === 'string' ? w.text : '')).join(' ')
  const text = (typeof raw.text === 'string' ? raw.text : joined).replace(/\s+/g, ' ').trim()
  if (!text) return null
  const wordConfidences = words.map((w) => num(w.confidence)).filter((c): c is number => c !== null)
  const confidence = wordConfidences.length > 0 ? Math.min(...wordConfidences) : num(raw.confidence)
  return { text, confidence }
}

export function extractOcrResult(data: unknown): OcrPageResult {
  const d: Record<string, unknown> = isRecord(data) ? data : {}
  let lines: OcrLine[] = asArray(d.lines).map(lineFrom).filter(notNull)
  if (lines.length === 0) {
    for (const block of asArray(d.blocks)) {
      for (const para of asArray(isRecord(block) ? block.paragraphs : null)) {
        for (const line of asArray(isRecord(para) ? para.lines : null)) {
          const l = lineFrom(line)
          if (l) lines.push(l)
        }
      }
    }
  }
  const text = typeof d.text === 'string' ? d.text : lines.map((l) => l.text).join('\n')
  if (lines.length === 0 && text.trim() !== '') {
    lines = text
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter((t) => t !== '')
      .map((t) => ({ text: t, confidence: null }))
  }
  return { text, meanConfidence: num(d.confidence), lines }
}
