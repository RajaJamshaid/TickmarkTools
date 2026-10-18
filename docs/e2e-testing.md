# End-to-end browser tests (Playwright, Chromium)

Status: written and committed, **not yet run against the app**. See the report in the PR/chat for what was and was not executed.

## Run in Codespaces
```
git fetch && git checkout feature/medical-bill-checker && git pull
npm install                      # adds tesseract.js, @tesseract.js-data/eng, @playwright/test; updates package-lock.json
npm run e2e:install              # Chromium + system dependencies
npm run typecheck && npm test    # unit tests first
npm run e2e                      # builds, serves `vite preview` on :4173, runs all browser tests
npx playwright show-report       # HTML report; attachments include the OCR actual-vs-expected JSON
```
Optional: `npm run e2e:dev` runs against the Vite dev server (no CSP emulation).

## What the suite does
- Serves the **production build** and re-applies the `/*` headers from `public/_headers` (CSP, Permissions-Policy) to every same-origin response, so CSP violations and a blocked camera show up as failures. Cloudflare itself is not involved.
- Every test fails on: uncaught page errors, console errors (including CSP violations), failed requests, HTTP >= 400, any request to a host other than the site itself and Google Fonts, and **any non-GET request** (nothing may be uploaded).
- Synthetic bill: `e2e/sample.ts` renders text to a PNG in the browser (no binary committed, no real patient data) and holds the expected OCR result.
- Camera: Chromium's fake device (`--use-fake-device-for-media-stream`). Permission denial is simulated by rejecting `getUserMedia` with `NotAllowedError`. **This is not a substitute for manual testing on a real phone camera.**
- Screenshots are written to `test-results/**` (mobile 375x812, tablet 768x1024, desktop 1280x800, results, OCR drafts).

## Known assumptions to confirm on first run
- Playwright's `context.route` is expected to also intercept requests made by the Tesseract web worker (needed for the language-data failure test).
- If Tesseract retries a failed language-data download internally, the error-state test may take longer than its 120 s wait.
- The OCR test asserts the exact sample values. A failure means the real OCR output differed; the actual output is attached as `ocr-actual-vs-expected.json`.
