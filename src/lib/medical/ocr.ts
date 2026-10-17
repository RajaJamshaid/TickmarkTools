/**
 * OCR adapter boundary. Engines run on-device; nothing here uploads images.
 * OCR output is never treated as verified: callers must present it as a draft for the user to check.
 */

export interface OcrLine {
  text: string
  /** Lowest word confidence (0-100) on the line if the engine reports it, otherwise null. */
  confidence: number | null
}

export interface OcrPageResult {
  text: string
  /** Mean confidence 0-100 for the page if the engine reports it, otherwise null. */
  meanConfidence: number | null
  lines?: OcrLine[]
}

export interface OcrRecognizeOptions {
  signal?: AbortSignal
  /** Real engine progress for the current page, 0..1. */
  onProgress?: (fraction: number) => void
}

export interface OcrEngine {
  recognize(image: Blob, opts: OcrRecognizeOptions): Promise<OcrPageResult>
  dispose(): Promise<void>
}

/** Must lazy-load the engine (dynamic import) so it is never part of the initial bundle. */
export type OcrEngineLoader = () => Promise<OcrEngine>

export type OcrFailureReason = 'not-configured' | 'aborted' | 'engine-load-failed' | 'engine-failed'

export type OcrRunResult = { ok: true; pages: OcrPageResult[] } | { ok: false; reason: OcrFailureReason; message: string }

export const OCR_MESSAGES: Record<OcrFailureReason, string> = {
  'not-configured': 'Automatic text reading is not available. You can enter the figures from your scan manually.',
  aborted: 'Text reading was cancelled.',
  'engine-load-failed': 'The on-device text reader could not be loaded. Check your connection and try again, or enter the figures manually.',
  'engine-failed': 'Text reading failed on this device. You can retry, retake the scan, or enter the figures manually.',
}

const fail = (reason: OcrFailureReason): OcrRunResult => ({ ok: false, reason, message: OCR_MESSAGES[reason] })

export interface RunOcrOptions {
  signal?: AbortSignal
  /** Called after each page finishes. */
  onProgress?: (done: number, total: number) => void
  /** Real per-page engine progress. Never invented. */
  onPageProgress?: (page: number, total: number, fraction: number) => void
}

export async function runOcr(loader: OcrEngineLoader | null, images: readonly Blob[], opts: RunOcrOptions = {}): Promise<OcrRunResult> {
  if (!loader) return fail('not-configured')
  let engine: OcrEngine | null = null
  try {
    try {
      engine = await loader()
    } catch {
      return opts.signal?.aborted ? fail('aborted') : fail('engine-load-failed')
    }
    const pages: OcrPageResult[] = []
    for (let i = 0; i < images.length; i++) {
      if (opts.signal?.aborted) return fail('aborted')
      const page = i + 1
      pages.push(await engine.recognize(images[i], { signal: opts.signal, onProgress: (f) => opts.onPageProgress?.(page, images.length, f) }))
      opts.onProgress?.(page, images.length)
    }
    return { ok: true, pages }
  } catch {
    // Deliberately drops the error object: it could carry text from the bill.
    return opts.signal?.aborted ? fail('aborted') : fail('engine-failed')
  } finally {
    try {
      await engine?.dispose()
    } catch {
      /* ignore cleanup failure */
    }
  }
}
