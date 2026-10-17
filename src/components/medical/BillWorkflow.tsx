import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, FileImage, PenLine, ScanText } from 'lucide-react'
import CameraScanner from './CameraScanner'
import ManualEntry from './ManualEntry'
import ResultsDashboard from './ResultsDashboard'
import { analyzeBill } from '../../lib/medical/analysis'
import { emptyForm } from '../../lib/medical/form'
import type { BillForm } from '../../lib/medical/form'
import { imageFromFile } from '../../lib/medical/imageCapture'
import type { CapturedImage } from '../../lib/medical/imageCapture'
import { runOcr } from '../../lib/medical/ocr'
import { applyDraft, parseBillPages } from '../../lib/medical/ocrParse'
import { MAX_PAGES, addPage, newPageId, removePage, replacePage, validateFile } from '../../lib/medical/pages'
import type { CapturedPage } from '../../lib/medical/pages'
import { loadTesseractEngine } from '../../lib/medical/tesseractEngine'
import type { AnalysisResult, BillData } from '../../lib/medical/types'

type Stage = 'idle' | 'consent' | 'scan' | 'pages' | 'entry' | 'results'

type OcrUi =
  | { status: 'idle' }
  | { status: 'running'; phase: 'preparing' | 'reading'; page: number; total: number; fraction: number | null }
  | { status: 'error'; message: string }

const btnPrimary =
  'inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-glow hover:brightness-110 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand'
const btnSecondary =
  'inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-navy hover:shadow-card disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand'

const TITLES: Record<Stage, string> = {
  idle: 'Start your review',
  consent: 'Before you scan',
  scan: 'Scan your bill',
  pages: 'Scanned pages',
  entry: 'Review the figures from your bill',
  results: 'Your results',
}

export default function BillWorkflow({ startSignal }: { startSignal: number }) {
  const [stage, setStage] = useState<Stage>('idle')
  const [pages, setPages] = useState<CapturedPage[]>([])
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [pendingDup, setPendingDup] = useState<{ page: CapturedPage; matchIndex: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [ocr, setOcr] = useState<OcrUi>({ status: 'idle' })
  const [ocrNote, setOcrNote] = useState<string | null>(null)
  const [form, setForm] = useState<BillForm>(emptyForm)
  const [outcome, setOutcome] = useState<{ bill: BillData; analysis: AnalysisResult } | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pagesRef = useRef<CapturedPage[]>(pages)
  pagesRef.current = pages
  const firstRender = useRef(true)

  // Scans exist only in memory: release them, and stop any OCR job, when leaving the page.
  useEffect(
    () => () => {
      abortRef.current?.abort()
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    },
    [],
  )

  useEffect(() => {
    if (startSignal === 0) return
    setStage('consent')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sectionRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [startSignal])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [stage])

  const ingest = useCallback(
    (img: CapturedImage) => {
      const page: CapturedPage = { id: newPageId(), fingerprint: img.fingerprint, width: img.width, height: img.height, blob: img.blob, previewUrl: URL.createObjectURL(img.blob) }
      setNotice(null)
      setOcr({ status: 'idle' })
      if (replaceId) {
        const old = pages.find((p) => p.id === replaceId)
        if (old) URL.revokeObjectURL(old.previewUrl)
        setPages(replacePage(pages, replaceId, page))
        setReplaceId(null)
        setStage('pages')
        return
      }
      const result = addPage(pages, page)
      if (result.status === 'added') setPages(result.pages)
      else if (result.status === 'limit') {
        URL.revokeObjectURL(page.previewUrl)
        setNotice(`You can scan up to ${MAX_PAGES} pages at a time.`)
      } else setPendingDup({ page, matchIndex: result.matchIndex })
      setStage('pages')
    },
    [pages, replaceId],
  )

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateFile(file)
    if (problem) {
      setNotice(problem)
      if (stage === 'scan') setStage(pages.length ? 'pages' : 'consent')
      return
    }
    try {
      ingest(await imageFromFile(file))
    } catch {
      setNotice('That image could not be read. Try a different JPEG, PNG, or WebP photo.')
      if (stage === 'scan') setStage(pages.length ? 'pages' : 'consent')
    }
  }

  const keepDuplicate = () => {
    if (!pendingDup) return
    const result = addPage(pages, pendingDup.page, { force: true })
    if (result.status === 'added') setPages(result.pages)
    else URL.revokeObjectURL(pendingDup.page.previewUrl)
    setPendingDup(null)
  }
  const discardDuplicate = () => {
    if (pendingDup) URL.revokeObjectURL(pendingDup.page.previewUrl)
    setPendingDup(null)
  }
  const remove = (id: string) => {
    const p = pages.find((x) => x.id === id)
    if (p) URL.revokeObjectURL(p.previewUrl)
    setPages(removePage(pages, id))
    setOcr({ status: 'idle' })
  }
  const startOver = () => {
    abortRef.current?.abort()
    abortRef.current = null
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    if (pendingDup) URL.revokeObjectURL(pendingDup.page.previewUrl)
    setPages([])
    setPendingDup(null)
    setReplaceId(null)
    setForm(emptyForm())
    setOutcome(null)
    setNotice(null)
    setOcr({ status: 'idle' })
    setOcrNote(null)
    setStage('idle')
  }
  const pickFile = () => fileRef.current?.click()
  const scanPageNumber = replaceId ? pages.findIndex((p) => p.id === replaceId) + 1 : pages.length + 1

  // On-device OCR. Results are drafts: every value starts unchecked and the user must confirm it.
  const startOcr = async () => {
    if (pages.length === 0 || ocr.status === 'running') return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setNotice(null)
    setOcr({ status: 'running', phase: 'preparing', page: 0, total: pages.length, fraction: null })
    const result = await runOcr(
      loadTesseractEngine,
      pages.map((p) => p.blob),
      { signal: ctrl.signal, onPageProgress: (page, total, fraction) => setOcr({ status: 'running', phase: 'reading', page, total, fraction }) },
    )
    if (abortRef.current !== ctrl) return // cancelled or superseded
    abortRef.current = null
    if (!result.ok) {
      setOcr(result.reason === 'aborted' ? { status: 'idle' } : { status: 'error', message: result.message })
      return
    }
    const draft = parseBillPages(result.pages)
    const filled = Object.keys(draft.totals).length + (draft.statementDate ? 1 : 0)
    setForm((prev) => applyDraft(prev, draft))
    setOcr({ status: 'idle' })
    setOcrNote(
      filled + draft.items.length === 0
        ? `The reader processed ${draft.linesRead} line${draft.linesRead === 1 ? '' : 's'} but could not recognize any charges or totals with confidence. Enter them manually, using your scans as a reference.`
        : `The reader processed ${draft.linesRead} line${draft.linesRead === 1 ? '' : 's'} and drafted ${draft.items.length} line item${draft.items.length === 1 ? '' : 's'} and ${filled} other value${filled === 1 ? '' : 's'}. These are drafts and may be wrong or incomplete. Check each against your bill.${draft.ambiguous.length > 0 ? ' Some totals appeared more than once with different values and were left blank.' : ''}`,
    )
    setStage('entry')
  }
  const cancelOcr = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setOcr({ status: 'idle' })
  }
  const running = ocr.status === 'running'

  return (
    <section ref={sectionRef} id="scanner" aria-labelledby="scanner-title" className="scroll-mt-24 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 id="scanner-title" ref={headingRef} tabIndex={-1} className="font-heading text-2xl font-bold text-navy focus:outline-none">
          {TITLES[stage]}
        </h2>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />

        {notice && (
          <p role="alert" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </p>
        )}

        <div className="mt-5">
          {stage === 'idle' && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-600">Scan with your camera, or enter the figures yourself. Everything stays on this device: nothing is uploaded or saved.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} onClick={() => setStage('consent')}>
                  <Camera className="h-4 w-4" /> Scan My Medical Bill
                </button>
                <button type="button" className={btnSecondary} onClick={() => setStage('entry')}>
                  <PenLine className="h-4 w-4" /> Enter details manually
                </button>
                <button type="button" className={btnSecondary} onClick={pickFile}>
                  <FileImage className="h-4 w-4" /> Choose an image instead
                </button>
              </div>
            </div>
          )}

          {stage === 'consent' && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Your camera opens only after you tap “Open camera”. Nothing is recorded.</li>
                <li>Each page you capture stays in this browser’s memory on your device. No images are uploaded or saved.</li>
                <li>If you choose “Read text from my scan”, the text is read on this device by a reader that is downloaded from this site the first time. The images are not sent anywhere.</li>
                <li>Text reading can be wrong. Everything it reads is a draft that you check against your bill.</li>
                <li>Closing or reloading this page discards your scans and anything you typed.</li>
                <li>A camera only sees what is inside the frame. Scan every page that lists charges.</li>
                <li>Camera access needs a secure (HTTPS) connection.</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} onClick={() => setStage('scan')}>
                  <Camera className="h-4 w-4" /> Open camera
                </button>
                <button type="button" className={btnSecondary} onClick={() => setStage('entry')}>
                  Enter details manually
                </button>
                <button type="button" className={btnSecondary} onClick={pickFile}>
                  Choose an image instead
                </button>
              </div>
            </div>
          )}

          {stage === 'scan' && (
            <CameraScanner
              pageNumber={Math.max(1, scanPageNumber)}
              onCaptured={ingest}
              onClose={() => {
                setReplaceId(null)
                setStage(pages.length ? 'pages' : 'consent')
              }}
              onManualEntry={() => setStage('entry')}
              onPickFile={pickFile}
            />
          )}

          {stage === 'pages' && (
            <div className="space-y-5">
              {pendingDup && (
                <div role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p>This page looks nearly identical to page {pendingDup.matchIndex + 1}. Did you scan the same page twice?</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className={btnSecondary} onClick={keepDuplicate}>
                      Keep it anyway
                    </button>
                    <button type="button" className={btnSecondary} onClick={discardDuplicate}>
                      Discard it
                    </button>
                  </div>
                </div>
              )}
              {pages.length === 0 && !pendingDup && <p className="text-sm text-slate-600">No pages scanned yet.</p>}
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {pages.map((p, i) => (
                  <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                    <img src={p.previewUrl} alt={`Scanned page ${i + 1}`} className="aspect-[3/4] w-full rounded-xl bg-slate-100 object-contain" />
                    <p className="mt-2 text-center text-sm font-semibold text-navy">Page {i + 1}</p>
                    <div className="mt-1 flex justify-center gap-2 text-sm">
                      <button
                        type="button"
                        disabled={running}
                        className="rounded-full px-3 py-1 font-medium text-teal-deep underline disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
                        onClick={() => {
                          setReplaceId(p.id)
                          setStage('scan')
                        }}
                      >
                        Retake
                      </button>
                      <button type="button" disabled={running} className="rounded-full px-3 py-1 font-medium text-rose-700 underline disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand" onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {pages.length} page{pages.length === 1 ? '' : 's'} scanned. A camera only captures what is in view, so this does not mean the whole bill was scanned.
              </p>

              {running && (
                <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-navy">
                    {ocr.phase === 'preparing' ? 'Preparing the on-device text reader…' : `Reading page ${ocr.page} of ${ocr.total}${ocr.fraction !== null ? ` — ${Math.round(ocr.fraction * 100)}%` : ''}`}
                  </p>
                  {ocr.phase === 'reading' && ocr.fraction !== null && <progress className="mt-2 h-2 w-full" max={1} value={ocr.fraction} aria-label="Text reading progress for the current page" />}
                  <p className="mt-1 text-slate-600">Everything happens on this device. The first run can take longer while the reader loads.</p>
                  <button type="button" className={`${btnSecondary} mt-3`} onClick={cancelOcr}>
                    Cancel
                  </button>
                </div>
              )}
              {ocr.status === 'error' && (
                <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
                  <p>{ocr.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={btnSecondary} onClick={startOcr}>
                      Try again
                    </button>
                    <button type="button" className={btnSecondary} onClick={() => setStage('entry')}>
                      Enter figures manually
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} onClick={startOcr} disabled={running || pages.length === 0 || !!pendingDup}>
                  <ScanText className="h-4 w-4" /> Read text from my scan
                </button>
                {pages.length < MAX_PAGES && (
                  <button type="button" className={btnSecondary} onClick={() => setStage('scan')} disabled={running}>
                    <Camera className="h-4 w-4" /> Scan another page
                  </button>
                )}
                <button type="button" className={btnSecondary} onClick={pickFile} disabled={running}>
                  <FileImage className="h-4 w-4" /> Choose an image file
                </button>
                <button type="button" className={btnSecondary} onClick={() => setStage('entry')} disabled={running || !!pendingDup}>
                  Enter figures manually
                </button>
              </div>
            </div>
          )}

          {stage === 'entry' && (
            <div className="space-y-5">
              {ocrNote && (
                <p role="status" className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  {ocrNote}
                </p>
              )}
              {pages.length > 0 && (
                <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-navy">View your scanned pages ({pages.length})</summary>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {pages.map((p, i) => (
                      <img key={p.id} src={p.previewUrl} alt={`Scanned page ${i + 1}`} className="w-full rounded-xl border border-slate-200 bg-white object-contain" />
                    ))}
                  </div>
                </details>
              )}
              <ManualEntry
                form={form}
                onChange={setForm}
                pagesScanned={pages.length}
                onBack={() => setStage(pages.length ? 'pages' : 'idle')}
                onSubmit={(bill) => {
                  setOutcome({ bill, analysis: analyzeBill(bill) })
                  setStage('results')
                }}
              />
            </div>
          )}

          {stage === 'results' && outcome && <ResultsDashboard bill={outcome.bill} analysis={outcome.analysis} onEdit={() => setStage('entry')} onStartOver={startOver} />}
        </div>
      </div>
    </section>
  )
}
