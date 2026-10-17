import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Copies the Tesseract.js worker, WASM core, and English language data from node_modules into
// public/ocr so the browser loads them from our own origin (no third-party hosts, strict CSP).
// public/ocr is git-ignored and regenerated on every dev/build.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const nm = join(root, 'node_modules')
const out = join(root, 'public', 'ocr')
const problems = []

function copy(src, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) return
  copyFileSync(src, dest)
}

// 1. Worker script
const worker = join(nm, 'tesseract.js', 'dist', 'worker.min.js')
if (existsSync(worker)) copy(worker, join(out, 'worker.min.js'))
else problems.push('Missing node_modules/tesseract.js/dist/worker.min.js. Run: npm install tesseract.js@^6')

// 2. WASM core variants (the worker picks the best one for the device)
const coreDir = [join(nm, 'tesseract.js-core'), join(nm, 'tesseract.js', 'node_modules', 'tesseract.js-core')].find((d) => existsSync(d))
if (!coreDir) {
  problems.push('Missing tesseract.js-core. Run: npm install tesseract.js@^6')
} else {
  const files = readdirSync(coreDir).filter((f) => /^tesseract-core.*\.(js|wasm)$/.test(f))
  for (const required of ['tesseract-core.wasm.js', 'tesseract-core-simd.wasm.js']) {
    if (!files.includes(required)) problems.push(`Missing ${required} in ${coreDir}`)
  }
  for (const f of files) copy(join(coreDir, f), join(out, 'core', f))
}

// 3. English language data
const langBase = join(nm, '@tesseract.js-data', 'eng')
if (!existsSync(langBase)) {
  problems.push('Missing @tesseract.js-data/eng. Run: npm install -D @tesseract.js-data/eng')
} else {
  const dirs = readdirSync(langBase).filter((d) => existsSync(join(langBase, d, 'eng.traineddata.gz')))
  const pick = dirs.find((d) => d.includes('best_int')) ?? dirs.find((d) => d === '4.0.0') ?? dirs[0]
  if (!pick) problems.push(`No eng.traineddata.gz found under ${langBase}`)
  else copy(join(langBase, pick, 'eng.traineddata.gz'), join(out, 'lang', 'eng.traineddata.gz'))
}

if (problems.length > 0) {
  console.error('OCR asset copy failed:\n- ' + problems.join('\n- '))
  process.exit(1)
}
console.log('OCR assets ready in public/ocr')
