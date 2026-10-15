// Cloudflare Pages Function: POST /api/problem
// Stores a short "problem I want a tool for" message in the KV namespace bound as PROBLEMS.
// Collects only: the message, an optional email, and a timestamp. No tracking.

const MAX_PROBLEM = 600
const MAX_EMAIL = 120
const PER_HOUR = 5

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

async function shortHash(text) {
  const data = new TextEncoder().encode(`tm:${text}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .slice(0, 8)
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

  // Honeypot: real people never fill this hidden field. Pretend success, store nothing.
  if (typeof body.website === 'string' && body.website.length > 0) return json({ ok: true })

  const problem = typeof body.problem === 'string' ? body.problem.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (problem.length < 10 || problem.length > MAX_PROBLEM) return json({ ok: false, error: 'length' }, 400)
  if (email && (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return json({ ok: false, error: 'email' }, 400)
  }

  // Simple per-visitor limit (hashed IP, expires after one hour).
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const rateKey = `rl:${await shortHash(ip)}`
  const used = parseInt((await env.PROBLEMS.get(rateKey)) || '0', 10)
  if (used >= PER_HOUR) return json({ ok: false, error: 'rate' }, 429)
  await env.PROBLEMS.put(rateKey, String(used + 1), { expirationTtl: 3600 })

  const key = `p:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`
  await env.PROBLEMS.put(key, JSON.stringify({ problem, email: email || null, at: new Date().toISOString() }))
  return json({ ok: true })
}

export function onRequest() {
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } })
}
