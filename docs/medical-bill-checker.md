# Medical Bill Checker (phase 2)

Route: `/tools/medical-bill-checker`. Not linked from the homepage and not in `sitemap.xml` until the tool is fully working (the featured card stays "Coming Soon"). Payment is not implemented.

## One-time setup (required before typecheck/build)
Phase 2 imports `tesseract.js`. The GitHub connector cannot generate a lockfile, so run this in Codespaces and commit both files:

```
git pull
npm install tesseract.js@^6
npm install -D @tesseract.js-data/eng
git add package.json package-lock.json
git commit -m "chore: add tesseract.js and English language data"
```

Then `npm run ocr:assets` (also runs automatically before `dev` and `build`) copies the Tesseract worker, WASM core, and English language data into `public/ocr/`. That folder is git-ignored and regenerated on every build, so Cloudflare's normal `npm run build` produces it.

## What exists
- Landing page, camera scanner, multi-page capture, retake/delete (phase 1)
- **On-device OCR:** `tesseractEngine.ts` lazy-loads Tesseract.js (separate chunk, fetched only when the user taps "Read text from my scan"). Worker, core, and language data are served from our own origin under `/ocr`. Images are passed in memory. `cacheMethod: 'none'` so nothing is written to IndexedDB. Progress is the engine's real per-page progress. Cancel terminates the worker.
- **OCR to draft fields:** `ocrParse.ts` fills only values that match clear patterns (labelled totals, a date plus a code or amount for line items, quantity × unit = amount only when it adds up). Conflicting totals are left blank. Every drafted value carries its source line, page, and confidence, and starts **unchecked**.
- **Verification rule:** unchecked scanned line items are marked "Needs review" and unchecked scanned totals are "unreadable", so they are excluded from confirmed checks until the user checks or edits them (`form.ts` `buildBill`).
- **Results dashboard:** summary, charge-review table with flags, findings with evidence and "Show line" links to the table, questions, neutral inquiry letter (editable, copy, .txt download), CSV export of line items and findings.
- **CSV:** formula-injection protected, behind a sensitive-data warning. **PDF export is not implemented** (it would need another dependency that cannot be verified from here).

## Privacy
No uploads, no storage (no localStorage/IndexedDB), images only as in-memory Blobs, object URLs revoked on delete/unmount, OCR errors are never logged or surfaced with content. `safeLog.ts` emits only numbers/booleans in dev builds.

## Config changes
- `public/_headers`: `Permissions-Policy: camera=(self)`; CSP now has `script-src 'self' 'wasm-unsafe-eval'` (WASM), `worker-src 'self'`, `img-src ... blob:`, `media-src 'self' blob:`, `connect-src 'self'`; `/ocr/*` cached for 7 days.
- `public/_redirects`: SPA rewrite for the tool route.
- `package.json` scripts: `ocr:assets`, `predev`, `prebuild`.
- `.gitignore`: `public/ocr`.

## Known limitations
- The parser expects one amount per labelled line and US month/day/year dates. Table layouts where the label and amount are on different lines are not matched, so the user enters those. It does not read provider names or account numbers.
- Pages that overlap can produce the same line twice; the duplicate check will flag it as "possible duplicate — verify" and shows the page numbers.
- Findings about lines that are unchecked scanned values say "unreadable or missing an amount"; the wording is slightly narrower than the real reason and should be updated in a later pass.
- Image-quality thresholds and the OCR accuracy on real bills are untuned. No edge detection or perspective correction. PDFs/HEIC not accepted. EOBs are not read.
- Tesseract.js option names (`corePath` as a directory, `workerBlobURL`, `cacheMethod`, `recognize(image, {}, {text, blocks})`) follow the v6 docs and must be confirmed by running it.

## Verify
```
npm ci && npm run typecheck && npm test && npm run build
npm run dev
```

## Next
Payment verification and report delivery (Phase 5 of the master plan), privacy policy and terms, SEO content, tuning on real bills.
