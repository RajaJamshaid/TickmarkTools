# Medical Bill Checker (phase 1)

Route: `/tools/medical-bill-checker`. Not linked from the homepage and not in `sitemap.xml` until the tool is fully working (the featured card stays "Coming Soon").

## What exists
- Landing page and workflow: `src/components/medical/*`
- Camera: `src/lib/medical/camera.ts` (getUserMedia, error classification, track cleanup), UI in `CameraScanner.tsx`
- Pages in memory only: `pages.ts` (limit 10, near-duplicate warning, retake/delete)
- Quality guidance: `quality.ts` (heuristic thresholds, need tuning on real phones; never blocks capture)
- Manual entry: `form.ts`, `ManualEntry.tsx` (nothing is guessed; unreadable values are errors)
- Analysis core: `money.ts` (integer cents), `analysis.ts` (deterministic rules, no AI, no network)
- OCR boundary: `ocr.ts` (no engine installed; always reports "not-configured")

## Privacy in this phase
No network calls, no uploads, no storage (no localStorage/IndexedDB), images only as in-memory Blobs, object URLs revoked on delete/unmount. `safeLog.ts` emits only numbers/booleans, in dev builds only.

## Config changes
- `public/_headers`: `Permissions-Policy: camera=(self)` (was `camera=()`, which blocks the camera), `img-src` + `blob:`, `media-src 'self' blob:`.
- `public/_redirects`: rewrites the tool route to `index.html` (a top-level `404.html` disables Pages' automatic SPA fallback).

## Not implemented yet
OCR, edge detection / perspective correction, auto-capture, PDF input, EOB reading, report/PDF/letter/export, payment, privacy policy and terms, per-page region mapping, SEO prerendering for this route.

## Next phase
1. In Codespaces: `npm install tesseract.js` and commit the updated `package-lock.json` (it cannot be generated from the GitHub connector).
2. Self-host the Tesseract worker, core WASM, and English language data under `/public` (CSP currently allows only `'self'`; add `worker-src 'self' blob:` and `'wasm-unsafe-eval'` only if required).
3. Lazy-load behind `DEFAULT_OCR_LOADER` and map OCR text to editable draft fields with confidence flags.
4. Results dashboard, letter, verified export.

## Verify locally
```
npm ci && npm run typecheck && npm test && npm run build
npm run dev   # camera works on localhost; on a phone use an HTTPS preview URL
```
