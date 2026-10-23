import { expect, test } from './fixtures'

const TOOL_SLASH = '/tools/medical-bill-checker/'

test.describe('homepage link, page metadata, and sitemap', () => {
  test('the Medical Bill Checker card on the homepage links to the tool page and the order is unchanged', async ({ page }) => {
    await page.goto('/')
    const names = await page.locator('#tools article h3').allTextContents()
    expect(names[0]).toMatch(/Medical Bill Checker/i)
    expect(names).toHaveLength(5)
    const link = page.getByRole('link', { name: /Try the .*Medical Bill Checker.* preview/i })
    await expect(link).toHaveAttribute('href', TOOL_SLASH)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${TOOL_SLASH}$`))
    await expect(page.locator('h1')).toHaveText('Understand Your Medical Bill. Question Charges With Confidence.')
    // the other four cards are still disabled "Coming soon"
    await page.goto('/')
    await expect(page.getByRole('button', { name: /coming soon/i })).toHaveCount(4)
  })

  test('the tool page has its own title, description, and canonical URL (not the homepage ones)', async ({ page }) => {
    await page.goto(TOOL_SLASH)
    await expect(page).toHaveTitle(/Medical Bill Checker/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tickmarktools.com/tools/medical-bill-checker/')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /medical bill/i)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://tickmarktools.com/tools/medical-bill-checker/')
  })

  test('the homepage keeps its own canonical URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tickmarktools.com/')
  })

  test('sitemap.xml lists the homepage and the tool page', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('<loc>https://tickmarktools.com/</loc>')
    expect(xml).toContain('<loc>https://tickmarktools.com/tools/medical-bill-checker/</loc>')
  })

  test('OCR assets are part of the build output (worker, four WASM cores, English data)', async ({ request }) => {
    for (const path of [
      '/ocr/worker.min.js',
      '/ocr/core/tesseract-core.wasm.js',
      '/ocr/core/tesseract-core-simd.wasm.js',
      '/ocr/core/tesseract-core-lstm.wasm.js',
      '/ocr/core/tesseract-core-simd-lstm.wasm.js',
      '/ocr/lang/eng.traineddata.gz',
    ]) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
    }
  })
})
