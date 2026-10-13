export const PRICE_USD = 1.99

export const formatPrice = (amount: number): string => `$${amount.toFixed(2)}`

export type ToolId =
  | 'medical-bill-checker'
  | 'overdue-invoice-recovery-kit'
  | 'car-repair-quote-checker'
  | 'home-contractor-quote-checker'
  | 'ecommerce-asset-auto-resizer'

export type Accent = 'cyan' | 'teal' | 'blue' | 'amber' | 'indigo'

/** Only 'coming-soon' exists today: no tool is functional yet. */
export type ToolStatus = 'coming-soon'

export interface Tool {
  id: ToolId
  name: string
  description: string
  intendedCta: string
  accent: Accent
  status: ToolStatus
  price: number
}

export const FEATURED_TOOLS: readonly Tool[] = [
  {
    id: 'medical-bill-checker',
    name: 'Medical Bill Checker',
    description:
      'Review medical bills for potential billing errors, duplicate charges, unclear fees, and insurance discrepancies when supporting documents are available.',
    intendedCta: 'Check Your Bill',
    accent: 'cyan',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'overdue-invoice-recovery-kit',
    name: 'Overdue Invoice Recovery Kit',
    description:
      'Create professional payment reminders, follow-up messages, and a structured plan for chasing overdue invoices.',
    intendedCta: 'Recover Payments',
    accent: 'teal',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'car-repair-quote-checker',
    name: 'Car Repair Quote Checker',
    description:
      'Review mechanic estimates for unclear charges, calculation issues, and questions worth asking before approving repairs.',
    intendedCta: 'Check Repair Quote',
    accent: 'blue',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'home-contractor-quote-checker',
    name: 'Home Contractor Quote Checker',
    description:
      'Review contractor estimates, identify missing scope details, and prepare questions before approving home improvement work.',
    intendedCta: 'Review Contractor Quote',
    accent: 'amber',
    status: 'coming-soon',
    price: PRICE_USD,
  },
  {
    id: 'ecommerce-asset-auto-resizer',
    name: 'E-Commerce Product Asset Auto-Resizer',
    description:
      'Prepare product images for multiple e-commerce platforms with suitable dimensions and downloadable exports.',
    intendedCta: 'Resize Product Images',
    accent: 'indigo',
    status: 'coming-soon',
    price: PRICE_USD,
  },
]
