import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, FileImage, PenLine } from 'lucide-react'
import CameraScanner from './CameraScanner'
import ManualEntry from './ManualEntry'
import FindingsList from './FindingsList'
import { analyzeBill } from '../../lib/medical/analysis'
import { emptyForm } from '../../lib/medical/form'
import type { BillForm } from '../../lib/medical/form'
import { imageFromFile } from '../../lib/medical/imageCapture'
import type { CapturedImage } from '../../lib/medical/imageCapture'
import { DEFAULT_OCR_LOADER, OCR_MESSAGES } from '../../lib/medical/ocr'
import { MAX_PAGES, addPage, newPageId, removePage, replacePage, validateFile } from '../../lib/medical/pages'
import type { CapturedPage } from '../../lib/medical/pages'
import type { AnalysisResult, BillData } from '../../lib/medical/types'

type Stage = 'idle' | 'consent' | 'scan' | 'pages' | 'entry' | 'results'

const btnPrimary =
  'inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-glow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand'
const btnSecondary =
  'inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-navy hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand'

const TITLES: Record<Stage, string> = {
  idle: 'Start your review',
  consent: 'Before you scan',
  scan: 'Scan your bill',
  pages: 'Scanned pages',
  entry: 'Enter the figures from your bill',
  results: 'Basic results',
}

export default function BillWorkflow({ startSignal }: { startSignal: number }) {
  const [stage, setStage] = useState<Stage>('idle')
  const [pages, setPages] = useState<CapturedPage[]>([])
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [pendingDup, setPendingDup] = useState<{ page: CapturedPage; matchIndex: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<BillForm>(emptyForm)
  const [outcome, setOutcome] = useState<{ bill: BillData; analysis: AnalysisResult } | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pagesRef = useRef<CapturedPage[]>(pages)
  pagesRef.current = pages
  const firstRender = useRef(true)

  // Scans exist only in memory: release them when leaving the page.
  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [])

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
  }
  const startOver = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    if (pendingDup) URL.revokeObjectURL(pendingDup.page.previewUrl)
    setPages([])
    setPendingDup(null)
    setReplaceId(null)
    setForm(emptyForm())
    setOutcome(null)
    setNotice(null)
    setStage('idle')
  }
  const pickFile = () => fileRef.current?.click()
  const scanPageNumber = replaceId ? pages.findIndex((p) => p.id === replaceId) + 1 : pages.length + 1

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
              <p className="text-sm text-slate-600">Scan with your camera, or enter the figures yourself. This preview does not upload or save anything.</p>
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
                <li>Each page you capture stays in this browser’s memory on your device. In this version nothing is uploaded and no images are saved.</li>
                <li>Closing or reloading this page discards your scans and anything you typed.</li>
                <li>A camera only sees what is inside the frame. Scan every page that lists charges.</li>
                <li>{OCR_MESSAGES['not-configured']}</li>
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
                        className="rounded-full px-3 py-1 font-medium text-teal-deep underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
                        onClick={() => {
                          setReplaceId(p.id)
                          setStage('scan')
                        }}
                      >
                        Retake
                      </button>
                      <button type="button" className="rounded-full px-3 py-1 font-medium text-rose-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand" onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {pages.length} page{pages.length === 1 ? '' : 's'} scanned. A camera only captures what is in view, so this does not mean the whole bill was scanned. {DEFAULT_OCR_LOADER === null ? OCR_MESSAGES['not-configured'] : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                {pages.length < MAX_PAGES && (
                  <button type="button" className={btnSecondary} onClick={() => setStage('scan')}>
                    <Camera className="h-4 w-4" /> Scan another page
                  </button>
                )}
                <button type="button" className={btnSecondary} onClick={pickFile}>
                  <FileImage className="h-4 w-4" /> Choose an image file
                </button>
                <button type="button" className={btnPrimary} onClick={() => setStage('entry')} disabled={!!pendingDup}>
                  Continue to enter figures
                </button>
              </div>
            </div>
          )}

          {stage === 'entry' && (
            <div className="space-y-5">
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

          {stage === 'results' && outcome && (
            <div className="space-y-5">
              <FindingsList bill={outcome.bill} analysis={outcome.analysis} />
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnSecondary} onClick={() => setStage('entry')}>
                  Edit entries
                </button>
                <button type="button" className={btnSecondary} onClick={startOver}>
                  Start over and clear everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
