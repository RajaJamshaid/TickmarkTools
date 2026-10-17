/**
 * OCR adapter boundary. No OCR engine is installed yet, so nothing here can produce text.
 * The next phase adds a lazy-loaded Tesseract.js engine behind OcrEngineLoader. Until then every
 * run reports "not-configured" and the UI falls back to manual entry. OCR output is never invented.
 */

export interface OcrPageResult {
  text: string
  /** Mean word confidence 0-100 if the engine reports it, otherwise null. */
  meanConfidence: number | null
}

export interface OcrRecognizeOptions {
  signal?: AbortSignal
  onProgress?: (fraction: number) => void
}

export interface OcrEngine {
  recognize(image: Blob, opts: OcrRecognizeOptions): Promise<OcrPageResult>
  dispose(): Promise<void>
}

/** Must lazy-load the engine (dynamic import) so it is never part of the initial bundle. */
export type OcrEngineLoader = () => Promise<OcrEngine>

export type OcrFailureReason = 'not-configured' | 'aborted' | 'engine-failed'

export type OcrRunResult = { ok: true; pages: OcrPageResult[] } | { ok: false; reason: OcrFailureReason; message: string }

export const OCR_MESSAGES: Record<OcrFailureReason, string> = {
  'not-configured': 'Automatic text reading is not available yet. You can enter the figures from your scan manually.',
  aborted: 'Text reading was cancelled.',
  'engine-failed': 'Automatic text reading failed on this device. You can retake the scan or enter the figures manually.',
}

/** Replace with a dynamic-import loader once an engine is installed. null = OCR unavailable. */
export const DEFAULT_OCR_LOADER: OcrEngineLoader | null = null

const fail = (reason: OcrFailureReason): OcrRunResult => ({ ok: false, reason, message: OCR_MESSAGES[reason] })

export async function runOcr(
  loader: OcrEngineLoader | null,
  images: readonly Blob[],
  opts: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<OcrRunResult> {
  if (!loader) return fail('not-configured')
  let engine: OcrEngine | null = null
  try {
    engine = await loader()
    const pages: OcrPageResult[] = []
    for (let i = 0; i < images.length; i++) {
      if (opts.signal?.aborted) return fail('aborted')
      pages.push(await engine.recognize(images[i], { signal: opts.signal }))
      opts.onProgress?.(i + 1, images.length)
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
