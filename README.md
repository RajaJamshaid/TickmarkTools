# TickmarkTools

Homepage for https://tickmarktools.com, plus the Medical Bill Checker preview at `/tools/medical-bill-checker/`. Vite + React + TypeScript + Tailwind CSS 3.

## Status

| Area | State |
| --- | --- |
| Homepage layout, floating nav bar, mobile menu, sections | Functional (static) |
| Smart search | Functional. Keyword matching in the browser (not an AI model); nothing is sent anywhere |
| "Share a problem" form | Functional. Stores a message plus an optional email (see below) |
| "Sign up" | **Early-access list only.** Collects an email; real accounts (passwords, login, sessions) are NOT built yet |
| Hero tools preview | Visual illustration only |
| 5 featured tool cards | Medical Bill Checker links to its **preview** page. The other four are disabled "Coming soon" placeholders |
| Medical Bill Checker | **Preview.** Camera scan, multi-page capture, on-device OCR (Tesseract.js) into editable draft values, rules-based checks, results, letter, CSV export. See `docs/medical-bill-checker.md`. Not tested on real bills or a real phone camera |
| Pricing ($1.99) | Planned price only, for customers worldwide. Checkout is **not** implemented |
| Privacy Policy, Terms, Refund Policy, Disclaimer, Cookie Policy, Contact | Not written. Footer shows "Soon" text, not links |
| OG image | Not created yet (no `og:image` tag) |

## Setup

```bash
npm install
npm run dev        # local dev server (the /api functions do not run here)
npm run typecheck  # TypeScript
npm test           # Vitest
npm run build      # copies OCR assets, typechecks, builds to dist/
npm run preview
npm run e2e:install && npm run e2e   # Playwright browser tests (see docs/e2e-testing.md)
```

Requires Node 20+ (`.nvmrc` is set to 20). No environment variables are needed.

## Routes and build output

The site is a Vite multi-page build with two HTML entries sharing one app bundle:

- `index.html` -> `dist/index.html` (homepage, canonical `https://tickmarktools.com/`)
- `tools/medical-bill-checker/index.html` -> `dist/tools/medical-bill-checker/index.html` (tool page, its own title, description and canonical `https://tickmarktools.com/tools/medical-bill-checker/`)

`src/App.tsx` picks the page from the URL path. There are no rewrite rules: static hosts serve the tool page's real file. `public/sitemap.xml` lists both pages. `npm run build` also copies the Tesseract worker, WASM cores and English data to `dist/ocr/` (from `node_modules`, via `scripts/copy-ocr-assets.mjs`).

## Cloudflare Pages Functions

- `functions/api/problem.js` handles `POST /api/problem` (share-a-problem form).
- `functions/api/signup.js` handles `POST /api/signup` (early-access email list).

Both validate input, ignore a hidden honeypot field, limit each visitor to 5 requests per hour (hashed IP, 1 hour expiry), only accept same-site requests, and store records in the KV namespace `tickmarktools-problems`, bound to the Pages project (preview and production) as `PROBLEMS`. Stored: the message or email plus a timestamp. Keys: `p:` (problems), `s:` (sign-ups), `rl:`/`rls:` (rate limits). If the binding is missing the forms show a friendly "not available" message and nothing is stored.

These functions only run on **Cloudflare Pages**. On any other host the two forms will not work.

Before promoting this publicly, publish a real Privacy Policy that describes this data (what is stored, why, retention, how to request deletion).

## Cloudflare Pages

Build command `npm run build`, output directory `dist`, Node 20+, production branch `main`. Do not commit secrets. `public/_headers` adds security headers and a CSP (`connect-src` and `form-action` are limited to this site; `script-src` allows `'wasm-unsafe-eval'` and `worker-src 'self'` for on-device OCR) and `camera=(self)` in Permissions-Policy. `public/404.html` makes unknown URLs return a real 404.

### Hosting check

A separate Netlify project also named `tickmarktools` is connected to this repository (it posts deploy-preview checks on pull requests). Only one host should serve tickmarktools.com. Confirm in each dashboard which one has the custom domain, and disconnect the other from this repository if it is not needed, so there is no stale or competing deployment.

## CI

`.github/workflows/e2e.yml` runs install, typecheck, unit tests, audit and the Playwright browser tests on pushes to `feature/medical-bill-checker` (or manually via "Run workflow") and publishes logs and results to the `ci-results` branch. It never deploys.

## Dependency audit (known findings)

`npm audit --omit=dev` reports 0 vulnerabilities. `npm audit` still reports 7 dev-only findings (5 high, 2 moderate) in Tailwind CSS 3's build-time chain: `braces` (GHSA-vfj7-8cjw-p6xm), `postcss-selector-parser` below 7.1.6 (GHSA-rj75-hqrm-r3gf), and packages that depend on them. They only run on a developer machine or CI against this repository's own files. npm's only automatic fix is Tailwind CSS 4 (a breaking change), planned as its own task. Do not use `npm audit fix --force`, and do not add `overrides` or suppress findings to make the report look clean.

## Troubleshooting

- Fonts missing: the page loads Google Fonts and falls back to system fonts if blocked.
- CSP errors after adding scripts, APIs, or other font/image hosts: update `public/_headers`.
- A form says it is unavailable: check the `PROBLEMS` KV binding in the Pages project settings.
- OCR assets missing (`/ocr/...` 404): run `npm run ocr:assets` (it runs automatically before `dev` and `build`).

## Not yet done

ESLint is not configured. Real user accounts, legal pages, contact details, checkout, PDF export and an OG image are not created. The Medical Bill Checker has not been tested on real bills or a real phone camera.
