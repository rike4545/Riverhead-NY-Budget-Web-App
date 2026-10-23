// Every built page must carry the Content-Security-Policy from add-csp.mjs as
// the first thing in its <head>, and the policy must list a hash for each of the
// page's inline scripts and nothing that would let other scripts run.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { inlineScripts, sha256, REFERRER } from './add-csp.mjs'

const OUT = join(process.cwd(), 'out')
const fail = (message) => { console.error(`CSP VERIFY FAILED: ${message}`); process.exitCode = 1 }

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* pages(path)
    else if (name.endsWith('.html')) yield path
  }
}

let n = 0
for (const path of pages(OUT)) {
  n += 1
  const page = path.slice(OUT.length)
  const html = readFileSync(path, 'utf8')
  const metas = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g)]
  if (metas.length !== 1) { fail(`${page} has ${metas.length} policies`); continue }
  const head = html.slice(html.search(/<head[^>]*>/))
  if (!/^<head[^>]*>\s*<meta charSet="utf-8"\/?><meta http-equiv="Content-Security-Policy"/i.test(head)) fail(`${page}: the policy does not follow the character set at the top of <head>, so earlier tags escape it`)
  if (!html.includes(`<meta name="referrer" content="${REFERRER}">`)) fail(`${page} has no referrer policy`)
  const directives = Object.fromEntries(metas[0][1].split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]))
  const scripts = directives['script-src'] ?? []
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:']) if (scripts.includes(bad)) fail(`${page}: script-src allows ${bad}`)
  if ((directives['object-src'] ?? []).join(' ') !== "'none'") fail(`${page}: object-src is not 'none'`)
  if ((directives['base-uri'] ?? []).join(' ') !== "'self'") fail(`${page}: base-uri is not 'self'`)
  for (const body of inlineScripts(html)) {
    if (!scripts.includes(`'sha256-${sha256(body)}'`)) { fail(`${page}: an inline script has no hash in the policy, so the browser would block it`); break }
  }
  if (/\son[a-z]+="/i.test(html)) fail(`${page} has an inline event handler, which the policy blocks`)
}
if (n === 0) fail('no built pages; run the build first')
if (!process.exitCode) console.log(`csp: ${n} pages carry a hash-based Content-Security-Policy and a referrer policy`)
