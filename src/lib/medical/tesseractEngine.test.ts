import { afterEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ createWorker: vi.fn() }))
vi.mock('tesseract.js', () => ({ createWorker: h.createWorker }))

import { LOAD_TIMEOUT_MS, loadTesseractEngine } from './tesseractEngine'

type Logger = (m: { status: string; progress: number }) => void

function fakeWorker(data: unknown, recognizeImpl?: () => Promise<unknown>) {
  let logger: Logger | undefined
  const worker = {
    recognize: vi.fn(async () => {
      logger?.({ status: 'loading language traineddata', progress: 1 })
      logger?.({ status: 'recognizing text', progress: 0.5 })
      return recognizeImpl ? recognizeImpl() : { data }
    }),
    terminate: vi.fn(async () => undefined),
  }
  h.createWorker.mockReset()
  h.createWorker.mockImplementation(async (_lang: string, _oem: number, opts: { logger?: Logger }) => {
    logger = opts.logger
    return worker
  })
  return worker
}

const blob = {} as Blob

afterEach(() => vi.useRealTimers())

describe('loadTesseractEngine (mocked tesseract.js: verifies our wiring, not OCR accuracy)', () => {
  it('creates an English LSTM worker that loads everything from our own origin', async () => {
    fakeWorker({ text: '' })
    await loadTesseractEngine()
    expect(h.createWorker).toHaveBeenCalledWith(
      'eng',
      1,
      expect.objectContaining({
        workerPath: '/ocr/worker.min.js',
        corePath: '/ocr/core',
        langPath: '/ocr/lang',
        workerBlobURL: false,
        cacheMethod: 'none',
        gzip: true,
        errorHandler: expect.any(Function),
      }),
    )
  })

  it('requests text and blocks, returns extracted lines, and forwards only recognition progress', async () => {
    const worker = fakeWorker({ text: 'Lab panel 45.00\n', confidence: 90, blocks: [{ paragraphs: [{ lines: [{ text: 'Lab panel 45.00', words: [{ text: '45.00', confidence: 70 }] }] }] }] })
    const engine = await loadTesseractEngine()
    const onProgress = vi.fn()
    const result = await engine.recognize(blob, { onProgress })
    expect(worker.recognize).toHaveBeenCalledWith(blob, {}, { text: true, blocks: true })
    expect(result.lines).toEqual([{ text: 'Lab panel 45.00', confidence: 70 }])
    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith(0.5)
  })

  it('terminates the worker once on dispose', async () => {
    const worker = fakeWorker({ text: '' })
    const engine = await loadTesseractEngine()
    await engine.dispose()
    await engine.dispose()
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })

  it('rejects and terminates the worker when cancelled mid-recognition', async () => {
    const worker = fakeWorker({}, () => new Promise(() => undefined))
    const engine = await loadTesseractEngine()
    const ctrl = new AbortController()
    const pending = engine.recognize(blob, { signal: ctrl.signal })
    ctrl.abort()
    await expect(pending).rejects.toThrow()
    expect(worker.terminate).toHaveBeenCalled()
  })

  it('does not start recognition if already cancelled', async () => {
    const worker = fakeWorker({ text: '' })
    const engine = await loadTesseractEngine()
    const ctrl = new AbortController()
    ctrl.abort()
    await expect(engine.recognize(blob, { signal: ctrl.signal })).rejects.toThrow()
    expect(worker.recognize).not.toHaveBeenCalled()
  })
})

describe('load failures (regression: language data fetch failed and the UI waited forever)', () => {
  it('rejects when Tesseract reports a worker error while loading', async () => {
    h.createWorker.mockReset()
    h.createWorker.mockImplementation((_l: string, _o: number, opts: { errorHandler?: (e: unknown) => void }) => {
      queueMicrotask(() => opts.errorHandler?.(new Error('Failed to fetch')))
      return new Promise(() => undefined) // real createWorker never settles in this case
    })
    await expect(loadTesseractEngine()).rejects.toThrow('worker-error')
  })

  it('rejects with a timeout if loading never finishes', async () => {
    vi.useFakeTimers()
    h.createWorker.mockReset()
    h.createWorker.mockImplementation(() => new Promise(() => undefined))
    const assertion = expect(loadTesseractEngine()).rejects.toThrow('load-timeout')
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS + 1000)
    await assertion
  })

  it('shuts down a worker that finishes loading after the load already failed', async () => {
    const worker = { recognize: vi.fn(), terminate: vi.fn(async () => undefined) }
    let resolveLate: (w: unknown) => void = () => undefined
    h.createWorker.mockReset()
    h.createWorker.mockImplementation((_l: string, _o: number, opts: { errorHandler?: (e: unknown) => void }) => {
      queueMicrotask(() => opts.errorHandler?.(new Error('x')))
      return new Promise((resolve) => {
        resolveLate = resolve
      })
    })
    await expect(loadTesseractEngine()).rejects.toThrow()
    resolveLate(worker)
    await vi.waitFor(() => expect(worker.terminate).toHaveBeenCalled())
  })

  it('fails a recognition in progress if the worker reports an error', async () => {
    let handler: ((e: unknown) => void) | undefined
    const worker = { recognize: vi.fn(() => new Promise(() => undefined)), terminate: vi.fn(async () => undefined) }
    h.createWorker.mockReset()
    h.createWorker.mockImplementation(async (_l: string, _o: number, opts: { errorHandler?: (e: unknown) => void }) => {
      handler = opts.errorHandler
      return worker
    })
    const engine = await loadTesseractEngine()
    const pending = engine.recognize(blob, {})
    handler?.(new Error('boom'))
    await expect(pending).rejects.toThrow('worker-error')
  })
})
