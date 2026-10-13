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

Requires Node 20+. No environment variables are needed yet (see `.env.example`).

## Cloudflare Pages

Set these in the Pages project (Settings -> Builds): build command `npm run build`, output directory `dist`, Node 20+. Do not commit secrets; set them as Pages environment variables. `public/_headers` adds security headers and a CSP.

## Troubleshooting

- Fonts missing: the page loads Google Fonts; it falls back to system fonts if blocked.
- CSP errors after adding scripts or APIs: update `public/_headers`.

## Not yet done

ESLint is not configured. Tests currently cover only the tool data. A lockfile will be created by the first `npm install`; commit it.
