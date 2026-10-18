/** Captured-page bookkeeping. Pure functions so they can be unit-tested without a browser. */

export const MAX_PAGES = 10
export const MAX_FILE_BYTES = 12 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/** Fingerprints within this many differing bits (of 256) are warned about as a possible duplicate. */
export const DUPLICATE_MAX_DISTANCE = 6

export interface CapturedPage {
  id: string
  /** 256-char '0'/'1' average-hash of the image, or '' if unavailable. */
  fingerprint: string
  width: number
  height: number
  /** Kept in browser memory only. Never uploaded or persisted in this version. */
  blob: Blob
  previewUrl: string
}

let seq = 0
export const newPageId = (): string => `page-${++seq}`

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Index of an existing page that looks nearly identical, or -1. */
export function findPossibleDuplicate(pages: readonly CapturedPage[], fingerprint: string): number {
  if (fingerprint === '') return -1
  return pages.findIndex((p) => p.fingerprint !== '' && hammingDistance(p.fingerprint, fingerprint) <= DUPLICATE_MAX_DISTANCE)
}

export type AddResult =
  | { status: 'added'; pages: CapturedPage[] }
  | { status: 'limit' }
  | { status: 'possible-duplicate'; matchIndex: number }

/** A near-duplicate is never silently dropped or added: the caller must confirm with force. */
export function addPage(pages: readonly CapturedPage[], page: CapturedPage, opts: { force?: boolean } = {}): AddResult {
  if (pages.length >= MAX_PAGES) return { status: 'limit' }
  if (!opts.force) {
    const matchIndex = findPossibleDuplicate(pages, page.fingerprint)
    if (matchIndex >= 0) return { status: 'possible-duplicate', matchIndex }
  }
  return { status: 'added', pages: [...pages, page] }
}

export const replacePage = (pages: readonly CapturedPage[], id: string, page: CapturedPage): CapturedPage[] =>
  pages.map((p) => (p.id === id ? page : p))

export const removePage = (pages: readonly CapturedPage[], id: string): CapturedPage[] => pages.filter((p) => p.id !== id)

/** Returns a user-facing problem, or null if the file can be used. */
export function validateFile(file: { type: string; size: number }): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Please choose a JPEG, PNG, or WebP image. PDFs and HEIC photos are not supported yet.'
  }
  if (file.size <= 0) return 'That file is empty.'
  if (file.size > MAX_FILE_BYTES) return `That image is larger than ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB. Try a smaller photo.`
  return null
}
