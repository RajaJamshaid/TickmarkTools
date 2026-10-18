import { expect, test } from './fixtures'
import { EXPECTED } from './sample'
import type { Page } from '@playwright/test'

const TOOL = '/tools/medical-bill-checker'

const upload = (page: Page, buffer: Buffer, name = 'bill.png') => page.locator('input[type=file]').setInputFiles({ name, mimeType: 'image/png', buffer })
const row = (page: Page, n: number) => page.locator('#scanner li').filter({ has: page.getByText(`Line ${n}`, { exact: true }) })
const heroScan = (page: Page) => page.getByRole('button', { name: 'Scan My Medical Bill' }).first()

test.describe('routing', () => {
  test('loads the tool (not the homepage or a 404) and survives a refresh', async ({ page }) => {
    const res = await page.goto(TOOL)
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveText('Understand Your Medical Bill Before You Pay.')
    await expect(page).toHaveTitle(/Medical Bill Checker/)
    await page.reload()
    await expect(page.locator('h1')).toHaveText('Understand Your Medical Bill Before You Pay.')
    await page.goto(`${TOOL}/`)
    await expect(page.locator('h1')).toHaveText('Understand Your Medical Bill Before You Pay.')
  })

  test('the homepage still loads and is not the tool', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveTitle(/Medical Bill Checker/)
    await expect(page.getByText('Understand Your Medical Bill Before You Pay.')).toHaveCount(0)
  })
})

test.describe('responsive layout', () => {
  for (const vp of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ]) {
    test(`no horizontal overflow at ${vp.name} ${vp.width}x${vp.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(TOOL)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`tool-${vp.name}.png`), fullPage: true })
      await heroScan(page).click()
      await page.getByRole('button', { name: 'Enter details manually' }).first().click()
      await expect(page.getByRole('heading', { name: 'Review the figures from your bill' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`entry-${vp.name}.png`), fullPage: true })
    })
  }
})

test.describe('manual entry, validation, analysis, letter, export', () => {
  test('rejects unreadable amounts, then produces evidence-linked findings', async ({ page, context }, testInfo) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(TOOL)
    await heroScan(page).click()
    await page.getByRole('button', { name: 'Enter details manually' }).first().click()

    // validation: unreadable amount is an error, never guessed
    await page.getByLabel('Total charges', { exact: true }).fill('abc')
    await page.getByRole('button', { name: 'Check this bill' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'could not be read' })).toBeVisible()
    await expect(page.getByText("Couldn't read this amount").first()).toBeVisible()

    // valid data: two identical lab lines on the same date, total that does not add up
    await page.getByLabel('Total charges', { exact: true }).fill('100.00')
    for (const n of [1, 2]) {
      if (n === 2) await page.getByRole('button', { name: 'Add line' }).click()
      const r = row(page, n)
      await r.getByLabel('Description').fill('Lab panel')
      await r.getByLabel('Billing code (optional)').fill('80053')
      await r.getByLabel('Service date').fill('2026-03-01')
      await r.getByLabel('Amount', { exact: true }).fill('45.00')
    }
    await page.getByLabel(/I entered every line item/).check()
    await page.getByRole('button', { name: 'Check this bill' }).click()

    await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible()
    await expect(page.getByText('Possible duplicate — verify').first()).toBeVisible()
    await expect(page.getByText('Line items do not add up to the total charges')).toBeVisible()
    await expect(page.getByRole('button', { name: /Show line: Lab panel/ }).first()).toBeVisible()
    await page.getByRole('button', { name: /Show line: Lab panel/ }).first().click()
    await expect(page.locator('tr[id^="line-"]').first()).toBeFocused()
    await page.screenshot({ path: testInfo.outputPath('results.png'), fullPage: true })

    // letter: neutral, copyable
    const letter = page.locator('#letter')
    await expect(letter).toContainText('To the Billing Department')
    await expect(letter).not.toContainText(/fraud|refund|overcharg/i)
    await page.getByRole('button', { name: 'Copy letter' }).click()
    await expect(page.getByText('Letter copied to your clipboard.')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await letter.inputValue())

    // CSV export: warning first, then a real download
    await page.getByRole('button', { name: 'Line items (CSV)' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('sensitive information')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download anyway' }).click()])
    expect(download.suggestedFilename()).toBe('tickmarktools-line-items.csv')
    const csv = (await (await import('node:fs/promises')).readFile(await download.path(), 'utf8')) as string
    expect(csv.split('\r\n')[0]).toBe('"Page","Service date","Code","Description","Quantity","Unit price","Amount","Needs review"')
    expect(csv).toContain('"80053"')

    // start over clears everything
    await page.getByRole('button', { name: 'Start over and clear everything' }).click()
    await expect(page.getByRole('heading', { name: 'Start your review' })).toBeVisible()
  })
})

test.describe('image upload and multi-page handling', () => {
  test('adds pages, warns about a near-duplicate, supports keep/discard and delete', async ({ page, sampleBill, secondPage }) => {
    await page.goto(TOOL)
    await upload(page, sampleBill)
    await expect(page.getByRole('heading', { name: 'Scanned pages' })).toBeVisible()
    await expect(page.getByAltText('Scanned page 1')).toBeVisible()

    await upload(page, secondPage, 'page2.png')
    await expect(page.getByAltText('Scanned page 2')).toBeVisible()

    await upload(page, sampleBill)
    await expect(page.getByRole('alert').filter({ hasText: 'looks nearly identical to page 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Discard it' }).click()
    await expect(page.getByAltText('Scanned page 3')).toHaveCount(0)

    await upload(page, sampleBill)
    await page.getByRole('button', { name: 'Keep it anyway' }).click()
    await expect(page.getByAltText('Scanned page 3')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).first().click()
    await expect(page.getByAltText('Scanned page 3')).toHaveCount(0)
    await expect(page.getByAltText('Scanned page 2')).toBeVisible()
  })

  test('rejects unsupported files with a clear message', async ({ page }) => {
    await page.goto(TOOL)
    await page.locator('input[type=file]').setInputFiles({ name: 'x.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })
    await expect(page.getByRole('alert').filter({ hasText: 'JPEG, PNG, or WebP' })).toBeVisible()
  })
})

test.describe('camera', () => {
  test('opens a (fake) camera, captures a page, and stops every track', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __stops: number }).__stops = 0
      const orig = MediaStreamTrack.prototype.stop
      MediaStreamTrack.prototype.stop = function () {
        ;(window as unknown as { __stops: number }).__stops++
        return orig.call(this)
      }
    })
    await page.goto(TOOL)
    await heroScan(page).click()
    await page.getByRole('button', { name: 'Open camera' }).click()
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.videoWidth), { timeout: 15_000 }).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Capture page 1' }).click()
    await expect(page.getByAltText('Scanned page 1')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __stops: number }).__stops)).toBeGreaterThan(0)
  })

  test('closing the camera stops its tracks', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __stops: number }).__stops = 0
      const orig = MediaStreamTrack.prototype.stop
      MediaStreamTrack.prototype.stop = function () {
        ;(window as unknown as { __stops: number }).__stops++
        return orig.call(this)
      }
    })
    await page.goto(TOOL)
    await heroScan(page).click()
    await page.getByRole('button', { name: 'Open camera' }).click()
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.videoWidth), { timeout: 15_000 }).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Close camera' }).click()
    await expect(page.getByRole('heading', { name: 'Before you scan' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __stops: number }).__stops)).toBeGreaterThan(0)
  })

  test('permission denial shows a helpful message with fallbacks (simulated NotAllowedError)', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
    })
    await page.goto(TOOL)
    await heroScan(page).click()
    await page.getByRole('button', { name: 'Open camera' }).click()
    await expect(page.getByRole('alert')).toContainText('Camera permission was denied')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Choose an image file' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enter details manually' }).last()).toBeVisible()
  })
})

test.describe('OCR in the browser (real Tesseract.js, synthetic bill)', () => {
  test.setTimeout(180_000)

  test('reads the sample bill on-device, drafts unchecked values, and never treats them as verified', async ({ page, sampleBill, mon }, testInfo) => {
    await page.goto(TOOL)
    await upload(page, sampleBill)
    await page.getByRole('button', { name: 'Read text from my scan' }).click()
    await expect(page.getByRole('status').filter({ hasText: /text reader|Reading page/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Review the figures from your bill' })).toBeVisible({ timeout: 150_000 })
    await page.screenshot({ path: testInfo.outputPath('ocr-drafts.png'), fullPage: true })

    // ---- engine assets: loaded from our own origin, successfully
    const ocr = mon.responses.filter((r) => r.url.includes('/ocr/'))
    const find = (re: RegExp) => ocr.find((r) => re.test(r.url))
    expect(find(/\/ocr\/worker\.min\.js$/)?.status, 'worker script').toBe(200)
    expect(find(/\/ocr\/core\/tesseract-core[^/]*\.wasm\.js$/)?.status, 'WASM core').toBe(200)
    expect(find(/\/ocr\/lang\/eng\.traineddata\.gz$/)?.status, 'English language data').toBe(200)

    // ---- actual output (recorded, then compared with the known sample)
    const val = (label: string) => page.getByLabel(label, { exact: true }).inputValue()
    const actual = {
      statementDate: await page.getByLabel('Statement date (optional)').inputValue(),
      gross: await val('Total charges'),
      adjustments: await val('Adjustments / discounts'),
      insurance: await val('Insurance payments'),
      balance: await val('Current balance'),
      items: [] as Record<string, string>[],
    }
    for (const n of [1, 2]) {
      const r = row(page, n)
      actual.items.push({
        description: await r.getByLabel('Description').inputValue(),
        code: await r.getByLabel('Billing code (optional)').inputValue(),
        serviceDate: await r.getByLabel('Service date').inputValue(),
        quantity: await r.getByLabel('Quantity').inputValue(),
        unit: await r.getByLabel('Unit price').inputValue(),
        amount: await r.getByLabel('Amount', { exact: true }).inputValue(),
      })
    }
    await testInfo.attach('ocr-actual-vs-expected.json', { body: JSON.stringify({ expected: EXPECTED, actual }, null, 2), contentType: 'application/json' })
    expect(actual).toEqual(EXPECTED)

    // ---- source evidence + confidence indicator + unchecked state
    await expect(page.getByText('From scan, page 1').first()).toBeVisible()
    await expect(page.getByText(/reader confidence/).first()).toBeVisible()
    const boxes = page.getByRole('checkbox', { name: /I checked this/ })
    expect(await boxes.count()).toBeGreaterThanOrEqual(7)
    for (const box of await boxes.all()) await expect(box).not.toBeChecked()

    // ---- unchecked scanned values are NOT treated as verified
    await page.getByLabel(/I entered every line item/).check()
    await page.getByRole('button', { name: 'Check this bill' }).click()
    await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible()
    await expect(page.getByText('Needs review').first()).toBeVisible()
    await expect(page.getByText('Arithmetic check passed')).toHaveCount(0)

    // ---- once the user checks them, the same numbers are analysed
    await page.getByRole('button', { name: 'Edit entries' }).click()
    await page.getByRole('button', { name: 'I checked all of them against my bill' }).click()
    await page.getByRole('button', { name: 'Check this bill' }).click()
    await expect(page.getByText('Line items add up to the total charges')).toBeVisible()
    await expect(page.getByText('Balance matches charges, adjustments, payments, and credits')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('ocr-results-confirmed.png'), fullPage: true })

    // ---- privacy: no bill data left the browser
    expect(mon.nonGet).toEqual([])
    expect(mon.external).toEqual([])
  })

  test('cancel stops reading and returns to the pages screen', async ({ page, sampleBill }) => {
    await page.goto(TOOL)
    await upload(page, sampleBill)
    await page.getByRole('button', { name: 'Read text from my scan' }).click()
    await expect(page.getByRole('status').filter({ hasText: /text reader|Reading page/ })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('status').filter({ hasText: /text reader|Reading page/ })).toHaveCount(0)
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: 'Scanned pages' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Read text from my scan' })).toBeEnabled()
  })

  test('shows an error when the language data cannot load, and retry succeeds', async ({ page, context, sampleBill, mon }) => {
    test.slow()
    mon.ignore.push(/eng\.traineddata/, /ERR_FAILED|net::/)
    const abort = (route: { abort: () => Promise<void> }) => route.abort()
    await context.route('**/ocr/lang/eng.traineddata.gz', abort)
    await page.goto(TOOL)
    await upload(page, sampleBill)
    await page.getByRole('button', { name: 'Read text from my scan' }).click()
    await expect(page.getByRole('alert').filter({ hasText: /could not be loaded|failed on this device/ })).toBeVisible({ timeout: 120_000 })
    await expect(page.getByRole('button', { name: 'Enter figures manually' }).first()).toBeVisible()
    await context.unroute('**/ocr/lang/eng.traineddata.gz', abort)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Review the figures from your bill' })).toBeVisible({ timeout: 150_000 })
  })
})
