import { badgeMuted, badgeOk, badgeReview, chip, previewBox } from './ui'

/** Small decorative interface previews. They illustrate the flow; they show no real results. */

const LINE_WIDTHS = [88, 76, 64, 52]

export function AddPreview() {
  return (
    <div aria-hidden="true" className={previewBox}>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-md border border-[#E4DED0] bg-white p-1.5">
            <div className="h-1.5 w-2/3 rounded bg-[#E4DED0]" />
            <div className="mt-1.5 space-y-1">
              {LINE_WIDTHS.map((w) => (
                <div key={w} className="h-1 rounded bg-[#F0ECE3]" style={{ width: `${w}%` }} />
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[10px] text-[#5B647A]">Page {n}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Camera', 'Choose image', 'Enter manually'].map((t) => (
          <span key={t} className={chip}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ReviewPreview() {
  const rows = [
    { label: 'Description', value: 'Laboratory panel', ok: true },
    { label: 'Amount', value: '$186.00', ok: false },
    { label: 'Balance due', value: '$1,284.00', ok: false },
  ]
  return (
    <div aria-hidden="true" className={previewBox}>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-2 rounded-md border border-[#E4DED0] bg-white px-2.5 py-1.5">
            <span className="text-[11px] text-[#5B647A]">{r.label}</span>
            <span className="font-mono text-xs text-[#172033]">{r.value}</span>
            <span className={r.ok ? badgeOk : badgeReview}>{r.ok ? 'Confirmed' : 'Unchecked'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function NextPreview() {
  return (
    <div aria-hidden="true" className={previewBox}>
      <div className="rounded-md border border-[#E4DED0] bg-white p-2.5">
        <p className="text-[11px] font-semibold text-[#172033]">Question for the billing department</p>
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-full rounded bg-[#F0ECE3]" />
          <div className="h-1.5 w-4/5 rounded bg-[#F0ECE3]" />
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <span className={chip}>Editable letter</span>
        <span className={chip}>Export CSV</span>
      </div>
    </div>
  )
}

export function CaptureMock() {
  return (
    <div aria-hidden="true" className={`${previewBox} p-4`}>
      <div className="flex items-end gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 rounded-lg border bg-white p-2 ${n === 2 ? 'border-[#146356] shadow-[0_0_0_3px_rgba(20,99,86,0.12)]' : 'border-[#E4DED0]'}`}>
            <div className="aspect-[3/4] rounded bg-[#F3F0E8] p-2">
              <div className="h-1.5 w-1/2 rounded bg-[#DDD6C6]" />
              <div className="mt-2 space-y-1.5">
                {LINE_WIDTHS.map((w) => (
                  <div key={w} className="h-1 rounded bg-[#E4DED0]" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-center font-mono text-[10px] text-[#5B647A]">Page {n}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={chip}>Retake</span>
        <span className={chip}>Delete</span>
        <span className={chip}>Add page</span>
      </div>
    </div>
  )
}

export function ReadMock() {
  return (
    <div aria-hidden="true" className={`${previewBox} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#172033]">Reading page 2 of 3</p>
        <span className={badgeMuted}>In testing</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-[#E4DED0]">
        <div className="h-1.5 w-2/3 rounded-full bg-[#146356]" />
      </div>
      <ul className="mt-3 space-y-2">
        {[
          ['Description', 'Laboratory panel'],
          ['Amount', '$186.00'],
        ].map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-2 rounded-md border border-[#E4DED0] bg-white px-2.5 py-1.5">
            <span className="text-[11px] text-[#5B647A]">{k}</span>
            <span className="font-mono text-xs text-[#172033]">{v}</span>
            <span className={badgeReview}>Draft</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FindingMock() {
  return (
    <div aria-hidden="true" className={`${previewBox} p-4`}>
      <div className="rounded-lg border border-[#E4DED0] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#172033]">Similar-looking entries</p>
          <span className={badgeReview}>Needs review</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#46506A]">Evidence: two entries with the same description and amount.</p>
        <p className="mt-2 border-t border-[#F0ECE3] pt-2 text-[11px] leading-relaxed text-[#46506A]">Question: could you confirm whether both were separate services?</p>
      </div>
      <div className="mt-2 flex gap-1.5">
        <span className={chip}>Editable letter</span>
        <span className={chip}>Export CSV</span>
      </div>
    </div>
  )
}
