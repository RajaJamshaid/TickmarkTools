import { defineConfig, devices } from '@playwright/test'

// Default: test the PRODUCTION build served by `vite preview` (closest to Cloudflare Pages).
// E2E_MODE=dev uses the Vite dev server instead (no CSP emulation, because Vite injects inline scripts).
const dev = process.env.E2E_MODE === 'dev'
const port = dev ? 5173 : 4173

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    permissions: ['camera'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Synthetic camera so the real getUserMedia path can be tested without hardware.
        launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
      },
    },
  ],
  webServer: {
    command: dev ? `npm run dev -- --port ${port} --strictPort` : `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/tools/medical-bill-checker`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
