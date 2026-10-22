// Clearly fictional sample data used by the landing page preview and demo.
// It is NOT the output of the real checker and does not come from a real patient, insurer, or claim.

export interface SampleCharge {
  id: string
  description: string
  amount: number
  review?: boolean
}

export const SAMPLE_PROVIDER = 'Sample Clinic (fictional)'
export const SAMPLE_DATE = 'Statement dated Jan 14, 2026'

export const SAMPLE_CHARGES: readonly SampleCharge[] = [
  { id: 'c1', description: 'Office visit, established patient', amount: 210 },
  { id: 'c2', description: 'Laboratory panel', amount: 186 },
  { id: 'c3', description: 'X-ray, 2 views', amount: 320 },
  { id: 'c4', description: 'X-ray, 2 views', amount: 320, review: true },
  { id: 'c5', description: 'Facility fee', amount: 248, review: true },
]

export interface SampleFlag {
  id: string
  title: string
  noticed: string
  why: string
  verify: string
  question: string
}

export const SAMPLE_FLAGS: readonly SampleFlag[] = [
  {
    id: 'f1',
    title: 'Similar-looking entries',
    noticed: 'Two X-ray entries with the same description and amount appear on the same statement.',
    why: 'Similar entries are not always duplicates. A provider may bill separate services that share a description.',
    verify: 'Compare the date and details of each service on your original bill.',
    question:
      'Could you confirm whether both X-ray entries on this statement were separate services, and share the date of each?',
  },
  {
    id: 'f2',
    title: 'Facility fee needs context',
    noticed: 'A facility fee is listed without a description of what it covers.',
    why: 'Facility fees are common, but the label alone may not explain what is included.',
    verify: 'Look for a note on the bill, or an explanation of benefits from your insurer.',
    question: 'What does the facility fee cover, and how was it applied to my insurer\u2019s allowed amount?',
  },
]

export const sampleTotal = (): number => SAMPLE_CHARGES.reduce((sum, c) => sum + c.amount, 0)

export const money = (n: number): string => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
