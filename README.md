# TickmarkTools

Homepage for https://tickmarktools.com. Vite + React + TypeScript + Tailwind CSS 3.

## Status

| Area | State |
| --- | --- |
| Homepage layout, nav, mobile menu, sections | Functional (static) |
| Smart search | Functional. Keyword matching in the browser (not an AI model); nothing is sent anywhere |
| "Share a problem" form | Functional once deployed with the KV binding below. Stores a message plus an optional email |
| Hero tools preview | Visual illustration only |
| 5 featured tool cards | Visual placeholders. Buttons are disabled; **no tool or tool landing page is built yet** |
| Pricing ($1.99) | Planned price only. Checkout is **not** implemented |
| Privacy Policy, Terms, Refund Policy, Disclaimer, Cookie Policy, Contact | Not written. Footer shows "Soon" text, not links |
| Language selector, Login | Not implemented, intentionally omitted |
| OG image | Not created yet (no `og:image` tag) |

## Setup

```bash
npm install
npm run dev        # local dev server (the /api/problem function does not run here)
npm run typecheck  # TypeScript
npm test           # Vitest
npm run build      # typecheck + production build to dist/
npm run preview
```

Requires Node 20+ (`.nvmrc` is set to 20). No environment variables are needed.

## Share-a-problem form (Cloudflare Pages Function)

`functions/api/problem.js` handles `POST /api/problem`. It validates input (10 to 600 characters, optional email), ignores a hidden honeypot field, limits each visitor to 5 messages per hour (hashed IP, 1 hour expiry), and stores the message in a KV namespace bound as `PROBLEMS`. Only the message, optional email and a timestamp are stored.

The KV namespace is `tickmarktools-problems` and is bound to the Pages project (preview and production) as `PROBLEMS`. If the binding is missing the form shows a friendly "not available" message and nothing is stored.

Before promoting this publicly, publish a real Privacy Policy that describes this data (what is stored, why, retention, how to request deletion).

## CI

A ready-to-use workflow is in `docs/ci.yml.example`. To enable it, copy it to `.github/workflows/ci.yml` and push (the automated GitHub connector used for early work cannot write to that folder):

```bash
mkdir -p .github/workflows && cp docs/ci.yml.example .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "Enable CI" && git push
```

It runs `npm ci`, typecheck, tests, build, and checks the build output. CI is not active until that file exists and has run.

## Cloudflare Pages

Build command `npm run build`, output directory `dist`, Node 20+. Do not commit secrets. `public/_headers` adds security headers and a CSP (`connect-src` and `form-action` are limited to this site). `public/404.html` makes unknown URLs return a real 404.

## Dependency audit (known findings)

`npm audit --omit=dev` reports 0 vulnerabilities. `npm audit` still reports 7 dev-only findings (5 high, 2 moderate) in Tailwind CSS 3's build-time chain: `braces` (GHSA-vfj7-8cjw-p6xm), `postcss-selector-parser` below 7.1.6 (GHSA-rj75-hqrm-r3gf), and packages that depend on them. They only run on a developer machine or CI against this repository's own files. npm's only automatic fix is Tailwind CSS 4 (a breaking change), planned as its own task. Do not use `npm audit fix --force`, and do not add `overrides` or suppress findings to make the report look clean.

## Troubleshooting

- Fonts missing: the page loads Google Fonts and falls back to system fonts if blocked.
- CSP errors after adding scripts, APIs, or other font/image hosts: update `public/_headers`.
- Form says sharing is unavailable: check the `PROBLEMS` KV binding in the Pages project settings.

## Not yet done

ESLint is not configured. Tests cover only the tool data and smart search. Tool landing pages, legal pages, contact details and an OG image are not created.
