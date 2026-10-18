import type { Browser } from '@playwright/test'

/** Synthetic bill text. No real patient data. Used both to render the test image and as the OCR ground truth. */
export const SAMPLE_LINES = [
  'Springfield Family Clinic',
  'Statement Date: 03/15/2026',
  '',
  '03/01/2026  99213  Office visit  1  150.00  150.00',
  '03/01/2026  80053  Lab panel  45.00',
  '',
  'Total Charges  $195.00',
  'Insurance Payments  100.00',
  'Adjustments  20.00',
  'Balance Due  $75.00',
]

/** What the OCR + parser should draft from SAMPLE_LINES. */
export const EXPECTED = {
  statementDate: '2026-03-15',
  gross: '195.00',
  insurance: '100.00',
  adjustments: '20.00',
  balance: '75.00',
  items: [
    { description: 'Office visit', code: '99213', serviceDate: '2026-03-01', quantity: '1', unit: '150.00', amount: '150.00' },
    { description: 'Lab panel', code: '80053', serviceDate: '2026-03-01', quantity: '', unit: '', amount: '45.00' },
  ],
}

/** Renders text to a PNG in the real browser, so no binary fixture has to be committed. */
export async function renderPng(browser: Browser, lines: string[], banner = false): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })
  const bar = banner ? '<div style="height:260px;background:#000"></div>' : ''
  await page.setContent(
    `<html><body style="margin:0;background:#fff">${bar}<div style="width:1100px;padding:48px;font:32px/1.7 'DejaVu Sans Mono','Liberation Mono',monospace;color:#111;white-space:pre">${lines.join('\n')}</div></body></html>`,
  )
  const png = await page.screenshot({ fullPage: true, type: 'png' })
  await page.close()
  return png
}
