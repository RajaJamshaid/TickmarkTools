export const PRICE_USD = 1.99

export const formatPrice = (amount: number): string => `$${amount.toFixed(2)}`

export type ToolId =
  | 'medical-bill-checker'
  | 'overdue-invoice-recovery-kit'
  | 'car-repair-quote-checker'
  | 'home-contractor-quote-checker'
  | 'ecommerce-asset-auto-resizer'

export type Accent = 'cyan' | 'teal' | 'blue' | 'amber' | 'indigo'

/** Only 'coming-soon' exists today: no tool or landing page is functional yet. */
export type ToolStatus = 'coming-soon'

export interface Tool {
  id: ToolId
  name: string
  description: string
  /** The action this button will perform once the tool exists. Not shown as a live button until then. */
  intendedCta: string
  /** Planned landing page path. Do NOT link to it until the page exists and status is no longer 'coming-soon'. */
  path: string
  accent: Accent
  status: ToolStatus
  price: number
}

/** Order is approved and must not change. */
export const FEATURED_TOOLS: readonly Tool[] = [
  {
    id: 'medical-bill-checker',
    name: 'Medical Bill Checker',
    description: 'Spot questionable charges and organize items to verify.',
    intendedCta: 'Check My Medical Bill',
    path: '/tools/medical-bill-checker',
    accent: 'cyan',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'overdue-invoice-recovery-kit',
    name: 'Overdue Invoice Recovery Kit',
    description: 'Payment reminders and a follow-up plan for overdue invoices.',
    intendedCta: 'Recover My Payment',
    path: '/tools/overdue-invoice-recovery-kit',
    accent: 'teal',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'car-repair-quote-checker',
    name: 'Car Repair Quote Checker',
    description: 'Understand repair estimates and know what to ask.',
    intendedCta: 'Check Repair Quote',
    path: '/tools/car-repair-quote-checker',
    accent: 'blue',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'home-contractor-quote-checker',
    name: 'Home Contractor Quote Checker',
    description: 'Compare quote items and prepare questions before approving.',
    intendedCta: 'Review My Quote',
    path: '/tools/home-contractor-quote-checker',
    accent: 'amber',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'ecommerce-asset-auto-resizer',
    name: 'E-Commerce Product Asset Auto-Resizer',
    description: 'Resize product images for marketplaces and social shops.',
    intendedCta: 'Resize Product Images',
    path: '/tools/ecommerce-asset-auto-resizer',
    accent: 'indigo',
    status: 'coming-soon',
    price: PRICE_USD,
  },
]
