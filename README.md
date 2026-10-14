# TickmarkTools

Homepage for https://tickmarktools.com. Vite + React + TypeScript + Tailwind CSS 3.

## Status

| Area | State |
| --- | --- |
| Homepage layout, nav, mobile menu, sections | Functional (static) |
| Hero tools preview | Visual illustration only |
| 5 featured tool cards | Visual placeholders. Buttons are disabled; **no tool or tool landing page is built yet** |
| Pricing ($1.99) | Planned price only. Checkout is **not** implemented |
| Privacy Policy, Terms, Contact | Not written. Footer shows "coming soon" text |
| Language selector, Login, search | Not implemented, intentionally omitted |
| OG image | Not created yet (no `og:image` tag) |

## Setup

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # TypeScript
npm test           # Vitest
npm run build      # typecheck + production build to dist/
npm run preview
```

Requires Node 20+ (`.nvmrc` is set to 20). No environment variables are needed yet (see `.env.example`).

## CI

A ready-to-use workflow is in `docs/ci.yml.example`. To enable it, copy it to `.github/workflows/ci.yml` and push (the automated GitHub connector used for early work cannot write to that folder):

```bash
mkdir -p .github/workflows && cp docs/ci.yml.example .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "Enable CI" && git push
```

It runs `npm ci`, typecheck, tests, build, and checks the build output. CI is not active until that file exists and has run.

## Cloudflare Pages

Set these in the Pages project (Settings -> Builds): build command `npm run build`, output directory `dist`, Node 20+. Do not commit secrets; set them as Pages environment variables. `public/_headers` adds security headers and a CSP. `public/404.html` makes unknown URLs return a real 404 (this is a single-page site).

## Dependency audit (known findings)

Checked after upgrading to Vite 6 and Vitest 4. `npm audit --omit=dev` reports 0 vulnerabilities (nothing shipped to visitors is affected). `npm audit` still reports 7 findings (5 high, 2 moderate), all in Tailwind CSS 3's build-time dependency chain:

- `braces` (GHSA-vfj7-8cjw-p6xm, high): stack-exhaustion denial of service from deeply nested brace patterns. npm lists no patched version of `braces` (affected range `*`).
- `postcss-selector-parser` below 7.1.6 (GHSA-rj75-hqrm-r3gf, moderate): CPU exhaustion from crafted selectors. Tailwind 3 requires the 6.x line.
- `micromatch`, `fast-glob`, `chokidar`, `postcss-nested`, `tailwindcss`: flagged only because they depend on the two packages above.

Why this is accepted for now: these run only on a developer machine or CI during the build, and only process this repository's own files and Tailwind config, not untrusted input. npm's only automatic fix is `npm audit fix --force`, which installs Tailwind CSS 4 (a breaking change to config and CSS directives). Do not run that casually.

Planned resolution: migrate to Tailwind CSS 4 as its own task, verifying the design against the reference afterwards. Re-run `npm audit` after any dependency change; do not add `overrides` or suppress findings to make the report look clean.

## Troubleshooting

- Fonts missing: the page loads Google Fonts; it falls back to system fonts if blocked.
- CSP errors after adding scripts, APIs, or other font/image hosts: update `public/_headers`.
- Build error about a missing lucide icon: check the icon name against the installed `lucide-react` version.

## Not yet done

ESLint is not configured. Tests currently cover only the tool data. Tool landing pages, legal pages, and an OG image are not created.
