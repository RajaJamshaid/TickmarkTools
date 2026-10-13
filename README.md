# TickmarkTools

Homepage for https://tickmarktools.com. Vite + React + TypeScript + Tailwind CSS 3.

## Status

| Area | State |
| --- | --- |
| Homepage layout, nav, mobile menu, sections | Functional (static) |
| Hero tools preview | Visual illustration only |
| 5 featured tool cards | Visual placeholders. Buttons are disabled; **no tool is built yet** |
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

A ready-to-use workflow is in `docs/ci.yml.example`. Copy it to `.github/workflows/ci.yml` (it runs install, typecheck, tests, build, and an output check). After the first local `npm install`, commit `package-lock.json`, then switch the workflow to `npm ci` with `cache: npm`.

## Cloudflare Pages

Set these in the Pages project (Settings -> Builds): build command `npm run build`, output directory `dist`, Node 20+. Do not commit secrets; set them as Pages environment variables. `public/_headers` adds security headers and a CSP. `public/404.html` makes unknown URLs return a real 404 (this is a single-page site).

## Troubleshooting

- Fonts missing: the page loads Google Fonts; it falls back to system fonts if blocked.
- CSP errors after adding scripts, APIs, or other font/image hosts: update `public/_headers`.
- Build error about a missing lucide icon: check the icon name against the installed `lucide-react` version.

## Not yet done

ESLint is not configured. Tests currently cover only the tool data. No `package-lock.json` yet.
