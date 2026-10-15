// Cloudflare Pages Function: POST /api/signup
// Early-access list: stores an email so we can tell people when accounts open.
// Real accounts (passwords, sessions) are NOT implemented yet.

const MAX_EMAIL = 120
const PER_HOUR = 5

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

async function shortHash(text, bytes = 8) {
  const data = new TextEncoder().encode(`tm:${text}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .slice(0, bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost({ request, env }) {
  if (!env.PROBLEMS) return json({ ok: false, error: 'unavailable' }, 503)

  const origin = request.headers.get('origin')
  if (origin) {
    let sameSite = false
    try {
      sameSite = new URL(origin).host === new URL(request.url).host
    } catch {
      sameSite = false
    }
    if (!sameSite) return json({ ok: false, error: 'forbidden' }, 403)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'invalid' }, 400)
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid' }, 400)

  if (typeof body.website === 'string' && body.website.length > 0) return json({ ok: true })

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'email' }, 400)
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const rateKey = `rls:${await shortHash(ip)}`
  const used = parseInt((await env.PROBLEMS.get(rateKey)) || '0', 10)
  if (used >= PER_HOUR) return json({ ok: false, error: 'rate' }, 429)
  await env.PROBLEMS.put(rateKey, String(used + 1), { expirationTtl: 3600 })

  // One record per email, so repeat submissions do not create duplicates.
  const key = `s:${await shortHash(email, 16)}`
  await env.PROBLEMS.put(key, JSON.stringify({ email, at: new Date().toISOString() }))
  return json({ ok: true })
}

export function onRequest() {
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } })
}
