import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { LOW_CONFIDENCE, MAX_ITEMS, MONEY_FIELDS, buildBill, newItemForm } from '../../lib/medical/form'
import type { BillForm, FieldOrigin, FormErrors, LineItemForm, MoneyFieldKey } from '../../lib/medical/form'
import type { BillData } from '../../lib/medical/types'

const inputCls =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-navy focus:border-cyan-brand focus:outline-none focus:ring-2 focus:ring-cyan-brand/40 aria-[invalid=true]:border-rose-500'

interface TextInputProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  inputMode?: 'decimal' | 'text'
  type?: 'text' | 'date'
  placeholder?: string
  extra?: ReactNode
}

function TextInput({ id, label, value, onChange, error, inputMode = 'text', type = 'text', placeholder, extra }: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={inputCls}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-rose-700">
          {error}
        </p>
      )}
      {extra}
    </div>
  )
}

/** Shows where a scanned value came from. Scanned values are drafts until the user checks them. */
function OriginNote({ origin, label, onChecked }: { origin: FieldOrigin; label: string; onChecked: (v: boolean) => void }) {
  const low = origin.confidence !== null && origin.confidence < LOW_CONFIDENCE
  return (
    <div className={`mt-2 rounded-xl p-2 text-xs ${origin.checked ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
      <p>
        From scan{origin.page ? `, page ${origin.page}` : ''} ·{' '}
        {origin.confidence === null ? 'reader confidence unavailable' : `reader confidence ${origin.confidence}%${low ? ' (low)' : ''} (lowest word on the line)`}
      </p>
      <p className="mt-1 break-words font-mono">“{origin.raw}”</p>
      <label className="mt-1 flex items-center gap-2">
        <input type="checkbox" checked={origin.checked} onChange={(e) => onChecked(e.target.checked)} className="h-4 w-4 accent-teal-deep" />
        {label}
      </label>
    </div>
  )
}

const touch = (origins: BillForm['fieldOrigins'], key: string): BillForm['fieldOrigins'] => {
  const cur = origins[key]
  return cur ? { ...origins, [key]: { ...cur, checked: true } } : origins
}

interface Props {
  form: BillForm
  onChange: (form: BillForm) => void
  pagesScanned: number
  onSubmit: (bill: BillData) => void
  onBack: () => void
}

export default function ManualEntry({ form, onChange, pagesScanned, onSubmit, onBack }: Props) {
  const [errors, setErrors] = useState<FormErrors>({ fields: {}, items: {} })
  const [summary, setSummary] = useState(false)

  // Editing a scanned value counts as the user having looked at it.
  const setMoney = (key: MoneyFieldKey, v: string) => {
    const next: BillForm = { ...form, fieldOrigins: touch(form.fieldOrigins, key) }
    next[key] = v
    onChange(next)
  }
  const setText = (key: 'provider' | 'statementDate' | 'pagesExpected', v: string) => {
    const next: BillForm = { ...form, fieldOrigins: key === 'statementDate' ? touch(form.fieldOrigins, key) : form.fieldOrigins }
    next[key] = v
    onChange(next)
  }
  const setOriginChecked = (key: string, checked: boolean) => {
    const cur = form.fieldOrigins[key]
    if (cur) onChange({ ...form, fieldOrigins: { ...form.fieldOrigins, [key]: { ...cur, checked } } })
  }
  const setItem = (id: string, patch: Partial<Omit<LineItemForm, 'id'>>) =>
    onChange({
      ...form,
      items: form.items.map((r) => {
        if (r.id !== id) return r
        const next: LineItemForm = { ...r, ...patch }
        if (r.origin && !('origin' in patch)) next.origin = { ...r.origin, checked: true }
        return next
      }),
    })

  const uncheckedCount =
    form.items.filter((r) => r.origin && !r.origin.checked).length + Object.values(form.fieldOrigins).filter((o) => o && !o.checked).length
  const markAllChecked = () => {
    const origins: BillForm['fieldOrigins'] = {}
    for (const [k, o] of Object.entries(form.fieldOrigins)) if (o) origins[k] = { ...o, checked: true }
    onChange({ ...form, fieldOrigins: origins, items: form.items.map((r) => (r.origin ? { ...r, origin: { ...r.origin, checked: true } } : r)) })
  }

  const submit = () => {
    const result = buildBill(form, pagesScanned)
    if (result.ok) {
      setErrors({ fields: {}, items: {} })
      setSummary(false)
      onSubmit(result.bill)
    } else {
      setErrors(result.errors)
      setSummary(true)
    }
  }

  const originOf = (key: string, label: string) => {
    const o = form.fieldOrigins[key]
    return o ? <OriginNote origin={o} label={label} onChecked={(v) => setOriginChecked(key, v)} /> : undefined
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Type the figures exactly as printed on your bill, or review the ones read from your scan. Leave a box empty if the bill does not show it. Nothing is guessed, and nothing leaves this device.
      </p>

      {uncheckedCount > 0 && (
        <div role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            <span className="font-semibold">{uncheckedCount}</span> value{uncheckedCount === 1 ? '' : 's'} read from your scan {uncheckedCount === 1 ? 'is' : 'are'} not checked yet. Scanned values can be wrong. Unchecked values are left out of the confirmed checks until you check or correct them.
          </p>
          <button
            type="button"
            onClick={markAllChecked}
            className="mt-2 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-sm font-semibold text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
          >
            I checked all of them against my bill
          </button>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-heading text-base font-semibold text-navy">Bill details</legend>
        <TextInput id="provider" label="Provider or facility (optional)" value={form.provider} onChange={(v) => setText('provider', v)} error={errors.fields.provider} />
        <TextInput
          id="statementDate"
          label="Statement date (optional)"
          type="date"
          value={form.statementDate}
          onChange={(v) => setText('statementDate', v)}
          error={errors.fields.statementDate}
          extra={originOf('statementDate', 'I checked this date')}
        />
        <TextInput id="pagesExpected" label="Total pages in the bill (optional)" inputMode="decimal" value={form.pagesExpected} onChange={(v) => setText('pagesExpected', v)} error={errors.fields.pagesExpected} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 font-heading text-base font-semibold text-navy">Totals shown on the bill</legend>
        <p className="text-sm text-slate-500 sm:col-span-2">Enter adjustments, payments, and credits as amounts that reduce the balance.</p>
        {MONEY_FIELDS.map((f) => (
          <TextInput
            key={f.key}
            id={`m-${f.key}`}
            label={f.label}
            inputMode="decimal"
            placeholder="0.00"
            value={form[f.key]}
            onChange={(v) => setMoney(f.key, v)}
            error={errors.fields[f.key]}
            extra={originOf(f.key, 'I checked this amount')}
          />
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-heading text-base font-semibold text-navy">Line items</legend>
        <ul className="space-y-4">
          {form.items.map((row, idx) => {
            const e = errors.items[row.id] ?? {}
            return (
              <li key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Line {idx + 1}</p>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onChange({ ...form, items: form.items.filter((r) => r.id !== row.id) })}
                      aria-label={`Remove line ${idx + 1}`}
                      className="rounded-full p-1.5 text-slate-500 hover:bg-white hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <TextInput id={`${row.id}-d`} label="Description" value={row.description} onChange={(v) => setItem(row.id, { description: v })} error={e.description} />
                  </div>
                  <TextInput id={`${row.id}-c`} label="Billing code (optional)" value={row.code} onChange={(v) => setItem(row.id, { code: v })} />
                  <TextInput id={`${row.id}-s`} label="Service date" type="date" value={row.serviceDate} onChange={(v) => setItem(row.id, { serviceDate: v })} error={e.serviceDate} />
                  <TextInput id={`${row.id}-q`} label="Quantity" inputMode="decimal" value={row.quantity} onChange={(v) => setItem(row.id, { quantity: v })} error={e.quantity} />
                  <TextInput id={`${row.id}-u`} label="Unit price" inputMode="decimal" placeholder="0.00" value={row.unit} onChange={(v) => setItem(row.id, { unit: v })} error={e.unit} />
                  <TextInput id={`${row.id}-a`} label="Amount" inputMode="decimal" placeholder="0.00" value={row.amount} onChange={(v) => setItem(row.id, { amount: v })} error={e.amount} />
                </div>
                {row.origin && (
                  <OriginNote origin={row.origin} label="I checked this line against my bill" onChecked={(v) => setItem(row.id, { origin: { ...(row.origin as FieldOrigin), checked: v } })} />
                )}
              </li>
            )
          })}
        </ul>
        {form.items.length < MAX_ITEMS && (
          <button
            type="button"
            onClick={() => onChange({ ...form, items: [...form.items, newItemForm()] })}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>
        )}
        {errors.fields.items && <p className="mt-2 text-sm text-rose-700">{errors.fields.items}</p>}
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" checked={form.lineItemsComplete} onChange={(e) => onChange({ ...form, lineItemsComplete: e.target.checked })} className="mt-1 h-4 w-4 accent-teal-deep" />
        <span>I entered every line item shown on the bill. (Without this, totals are not compared with the line items.)</span>
      </label>

      {summary && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Some values could not be read. Please fix the highlighted fields.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={submit} className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-glow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand">
          Check this bill
        </button>
        <button type="button" onClick={onBack} className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand">
          Back
        </button>
      </div>
    </div>
  )
}
