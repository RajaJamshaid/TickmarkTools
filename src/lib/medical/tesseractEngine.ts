import type { OcrEngine, OcrEngineLoader } from './ocr'
import { extractOcrResult } from './ocrExtract'

/**
 * Tesseract.js engine. Runs entirely in the browser:
 * - tesseract.js is loaded with a dynamic import, so it is a separate chunk fetched only on demand
 * - the worker, WASM core and English language data are served from our own origin under /ocr
 *   (copied from node_modules by scripts/copy-ocr-assets.mjs), so no third-party host is contacted
 * - images are passed to the worker in memory and are never uploaded
 */

const BASE = '/ocr'

interface MinimalWorker {
  recognize(image: Blob, options: object, output: object): Promise<{ data: unknown }>
  terminate(): Promise<unknown>
}

export const loadTesseractEngine: OcrEngineLoader = async () => {
  const { createWorker } = await import('tesseract.js')
  let listener: ((fraction: number) => void) | null = null

  const worker = (await createWorker('eng', 1, {
    workerPath: `${BASE}/worker.min.js`,
    corePath: `${BASE}/core`,
    langPath: `${BASE}/lang`,
    workerBlobURL: false, // load the worker from our origin (CSP: worker-src 'self')
    cacheMethod: 'none', // do not write anything to IndexedDB
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && listener) listener(m.progress)
    },
  })) as unknown as MinimalWorker

  let terminated = false
  const terminate = async (): Promise<void> => {
    if (terminated) return
    terminated = true
    try {
      await worker.terminate()
    } catch {
      /* already gone */
    }
  }

  const engine: OcrEngine = {
    async recognize(image, opts) {
      if (opts.signal?.aborted) throw new Error('aborted')
      listener = opts.onProgress ?? null
      let onAbort: (() => void) | null = null
      const aborted = new Promise<never>((_, reject) => {
        onAbort = () => {
          void terminate()
          reject(new Error('aborted'))
        }
        opts.signal?.addEventListener('abort', onAbort, { once: true })
      })
      try {
        const job = worker.recognize(image, {}, { text: true, blocks: true })
        job.catch(() => undefined) // avoid an unhandled rejection if cancellation wins the race
        const result = await Promise.race([job, aborted])
        return extractOcrResult(result.data)
      } finally {
        listener = null
        if (onAbort) opts.signal?.removeEventListener('abort', onAbort)
      }
    },
    dispose: terminate,
  }
  return engine
}
