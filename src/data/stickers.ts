import type { ToolId } from './tools'

/** One cartoon sticker per tool (files live in public/stickers). */
export const STICKERS: Record<ToolId, string> = {
  'medical-bill-checker': '/stickers/medical-bill-checker.svg',
  'overdue-invoice-recovery-kit': '/stickers/overdue-invoice-recovery-kit.svg',
  'car-repair-quote-checker': '/stickers/car-repair-quote-checker.svg',
  'home-contractor-quote-checker': '/stickers/home-contractor-quote-checker.svg',
  'ecommerce-asset-auto-resizer': '/stickers/ecommerce-asset-auto-resizer.svg',
}
