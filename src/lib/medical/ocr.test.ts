import { describe, expect, it, vi } from 'vitest'
import { runOcr } from './ocr'
import type { OcrEngine } from './ocr'

const blob = {} as Blob
const engineWith = (recognize: OcrEngine['recognize']): OcrEngine => ({ recognize, dispose: vi.fn(async () => undefined) })

describe('runOcr', () => {
  it('reports not-configured and produces no text when no engine is available', async () => {
    const r = await runOcr(null, [blob])
    expect(r).toMatchObject({ ok: false, reason: 'not-configured' })
    expect(r).not.toHaveProperty('pages')
  })

  it('returns exactly what the engine produced and disposes it', async () => {
    const engine = engineWith(async () => ({ text: 'hello', meanConfidence: 90 }))
    const progress = vi.fn()
    const r = await runOcr(async () => engine, [blob, blob], { onProgress: progress })
    expect(r).toEqual({ ok: true, pages: [{ text: 'hello', meanConfidence: 90 }, { text: 'hello', meanConfidence: 90 }] })
    expect(progress).toHaveBeenLastCalledWith(2, 2)
    expect(engine.dispose).toHaveBeenCalled()
  })

  it('forwards real per-page progress', async () => {
    const engine = engineWith(async (_img, opts) => {
      opts.onProgress?.(0.5)
      return { text: 'x', meanConfidence: null }
    })
    const onPageProgress = vi.fn()
    await runOcr(async () => engine, [blob], { onPageProgress })
    expect(onPageProgress).toHaveBeenCalledWith(1, 1, 0.5)
  })

  it('reports a load failure without leaking error text', async () => {
    const r = await runOcr(async () => {
      throw new Error('SECRET bill text')
    }, [blob])
    expect(r).toMatchObject({ ok: false, reason: 'engine-load-failed' })
    expect(JSON.stringify(r)).not.toContain('SECRET')
  })

  it('fails safely and disposes if recognition throws', async () => {
    const engine = engineWith(async () => {
      throw new Error('SECRET')
    })
    const r = await runOcr(async () => engine, [blob])
    expect(r).toMatchObject({ ok: false, reason: 'engine-failed' })
    expect(JSON.stringify(r)).not.toContain('SECRET')
    expect(engine.dispose).toHaveBeenCalled()
  })

  it('stops when aborted before recognition starts', async () => {
    const recognize = vi.fn(async () => ({ text: 'x', meanConfidence: null }))
    const ctrl = new AbortController()
    ctrl.abort()
    const r = await runOcr(async () => engineWith(recognize), [blob], { signal: ctrl.signal })
    expect(r).toMatchObject({ ok: false, reason: 'aborted' })
    expect(recognize).not.toHaveBeenCalled()
  })

  it('reports aborted if recognition throws after cancellation', async () => {
    const ctrl = new AbortController()
    const engine = engineWith(async () => {
      ctrl.abort()
      throw new Error('terminated')
    })
    const r = await runOcr(async () => engine, [blob], { signal: ctrl.signal })
    expect(r).toMatchObject({ ok: false, reason: 'aborted' })
  })
})
