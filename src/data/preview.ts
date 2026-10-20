import type { ToolId } from './tools'

/** Tools that already have a free preview page. Every other tool stays "Coming soon". */
export const PREVIEW_LINKS: Partial<Record<ToolId, string>> = {
  'medical-bill-checker': '/tools/medical-bill-checker/',
}
