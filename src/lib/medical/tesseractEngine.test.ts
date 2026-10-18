import { describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ createWorker: vi.fn() }))
vi.mock('tesseract.js', () => ({ createWorker: h.createWorker }))

import { loadTesseractEngine } from './tesseractEngine'

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
