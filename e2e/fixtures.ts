import { readFileSync } from 'node:fs'
import { test as base, expect } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { SAMPLE_LINES, renderPng } from './sample'

/** Hosts the page may contact besides itself (Google Fonts from index.html). Bill data must never go anywhere else. */
const ALLOWED_EXTERNAL = ['fonts.googleapis.com', 'fonts.gstatic.com']

/** Parses the `/*` block of public/_headers so the app is tested under the same CSP / Permissions-Policy Cloudflare Pages will send. */
export function pagesHeaders(): Record<string, string> {
  const block = readFileSync('public/_headers', 'utf8').split(/\n\s*\n/)[0]
  const out: Record<string, string> = {}
  for (const line of block.split('\n').slice(1)) {
    const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(line)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

async function emulatePagesHeaders(context: BrowserContext, origin: string) {
  const headers = pagesHeaders()
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== origin) return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } })
  })
}

export function attachMonitor(context: BrowserContext, page: Page, origin: string) {
  const s = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    failed: [] as string[],
    badStatus: [] as string[],
    external: [] as string[],
    nonGet: [] as string[],
    responses: [] as { url: string; status: number }[],
    ignore: [] as RegExp[],
  }
  page.on('console', (m) => m.type() === 'error' && s.consoleErrors.push(m.text()))
  page.on('pageerror', (e) => s.pageErrors.push(e.message))
  context.on('request', (r) => {
    const url = r.url()
    if (/^(data|blob|about):/.test(url)) return
    const u = new URL(url)
    if (u.origin !== origin && !ALLOWED_EXTERNAL.includes(u.hostname)) s.external.push(url)
    if (!['GET', 'HEAD'].includes(r.method())) s.nonGet.push(`${r.method()} ${url}`)
  })
  context.on('requestfailed', (r) => s.failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText ?? ''}`))
  context.on('response', (r) => {
    s.responses.push({ url: r.url(), status: r.status() })
    if (r.status() >= 400) s.badStatus.push(`${r.status()} ${r.url()}`)
  })
  return s
}
export type Monitor = ReturnType<typeof attachMonitor>

export const test = base.extend<{ mon: Monitor }, { sampleBill: Buffer; secondPage: Buffer }>({
  sampleBill: [
    async ({ browser }, use) => {
      await use(await renderPng(browser, SAMPLE_LINES))
    },
    { scope: 'worker' },
  ],
  secondPage: [
    async ({ browser }, use) => {
      await use(await renderPng(browser, ['Page 2 of 2', 'Lab results summary'], true))
    },
    { scope: 'worker' },
  ],
  mon: [
    async ({ context, page, baseURL }, use) => {
      const origin = new URL(baseURL ?? 'http://localhost').origin
      if (process.env.E2E_MODE !== 'dev') await emulatePagesHeaders(context, origin)
      const mon = attachMonitor(context, page, origin)
      await use(mon)
      const keep = (list: string[]) => list.filter((x) => !mon.ignore.some((re) => re.test(x)))
      expect(mon.pageErrors, 'uncaught page errors').toEqual([])
      expect(keep(mon.consoleErrors), 'console errors (includes CSP violations)').toEqual([])
      expect(keep(mon.failed), 'failed requests').toEqual([])
      expect(keep(mon.badStatus), 'HTTP >= 400 responses').toEqual([])
      expect(mon.external, 'requests to unexpected external hosts').toEqual([])
      expect(mon.nonGet, 'non-GET requests (nothing should be uploaded)').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
