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

/** If the worker has not finished loading by then, report a load failure instead of waiting forever. */
export const LOAD_TIMEOUT_MS = 90_000

interface MinimalWorker {
  recognize(image: Blob, options: object, output: object): Promise<{ data: unknown }>
  terminate(): Promise<unknown>
}

export const loadTesseractEngine: OcrEngineLoader = async () => {
  const { createWorker } = await import('tesseract.js')
  let listener: ((fraction: number) => void) | null = null

  // Tesseract.js reports worker/network errors through `errorHandler` (its default rethrows as an uncaught
  // error and leaves createWorker pending forever). We turn them into a rejected promise instead.
  let fail: (e: Error) => void = () => undefined
  const failed = new Promise<never>((_, reject) => {
    fail = reject
  })
  failed.catch(() => undefined)

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('load-timeout')), LOAD_TIMEOUT_MS)
  })
  timeout.catch(() => undefined)

  const creating = createWorker('eng', 1, {
    workerPath: `${BASE}/worker.min.js`,
    corePath: `${BASE}/core`,
    langPath: `${BASE}/lang`,
    workerBlobURL: false, // load the worker from our origin (CSP: worker-src 'self')
    cacheMethod: 'none', // do not write anything to IndexedDB
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && listener) listener(m.progress)
    },
    errorHandler: () => fail(new Error('worker-error')),
  })
  creating.catch(() => undefined)

  let worker: MinimalWorker
  try {
    worker = (await Promise.race([creating, failed, timeout])) as unknown as MinimalWorker
  } catch (err) {
    // If the worker does finish loading later, shut it down so it does not linger.
    void creating.then((w) => (w as unknown as MinimalWorker).terminate()).catch(() => undefined)
    throw err
  } finally {
    clearTimeout(timer)
  }

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
        job.catch(() => undefined) // avoid an unhandled rejection if cancellation or an error wins the race
        const result = await Promise.race([job, aborted, failed])
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
