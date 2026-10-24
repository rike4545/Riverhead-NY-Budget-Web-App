// Adds a Content-Security-Policy and a Referrer-Policy to every page of the
// static export. GitHub Pages cannot send response headers, so the policy goes
// in a <meta http-equiv> tag at the top of each page's <head>.
//
// Scripts: the site's own files ('self'), Google Analytics' loader, and each
// page's own inline scripts, named by their SHA-256 hashes. Next.js writes a
// different set of inline scripts into every page, so the hashes are taken per
// page after the build. A script injected into a page later, by a compromised
// data file or anything else, matches no hash and the browser refuses to run it.
// That matters here because the search's "ask" feature keeps a visitor's own
// OpenAI key in their browser.
//
// Runs as part of `npm run build`; scripts/verify-csp.mjs checks the result.

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')

/** Where the browser may connect, and why. Keep this list short and sourced. */
export const ALLOWED = {
  // Google Analytics 4: its loader, and the addresses it reports to (www.google.com/g/collect among them).
  analytics: ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.google.com'],
  // Officials' photos on /campaign-finance/, from the Town's own site.
  townImages: ['https://www.townofriverheadny.gov'],
  // The search's "ask" feature, with the visitor's own key (lib/riverheadSearchAI.ts).
  openai: ['https://api.openai.com'],
  // Campaign finance filings read live from the State's open data (lib/campaign-finance.ts).
  stateData: ['https://data.ny.gov'],
}

export function policy(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.map((h) => `'sha256-${h}'`).join(' ')} https://www.googletagmanager.com`,
    // React writes style attributes inline on every element, so styles need 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${[...ALLOWED.analytics, ...ALLOWED.townImages].join(' ')}`,
    "font-src 'self'",
    `connect-src 'self' ${[...ALLOWED.analytics, ...ALLOWED.openai, ...ALLOWED.stateData].join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export const REFERRER = 'strict-origin-when-cross-origin'

/** The contents of every inline <script> in a page, in order. */
export function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
}

export const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('base64')

const META = /<meta http-equiv="Content-Security-Policy"[^>]*>|<meta name="referrer"[^>]*>/g

export function addPolicy(html) {
  const clean = html.replace(META, '')
  const hashes = [...new Set(inlineScripts(clean).map(sha256))]
  const tags = `<meta http-equiv="Content-Security-Policy" content="${policy(hashes)}"><meta name="referrer" content="${REFERRER}">`
  // Right after the character-set tag, which browsers look for in the first
  // 1,024 bytes, and before any script or stylesheet.
  const charset = /<head[^>]*>\s*<meta charSet="utf-8"\/?>/i.exec(clean)
  if (!charset) throw new Error('page has no <head> opening with its character set')
  const end = charset.index + charset[0].length
  return clean.slice(0, end) + tags + clean.slice(end)
}

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* pages(path)
    else if (name.endsWith('.html')) yield path
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let n = 0
  for (const path of pages(OUT)) {
    writeFileSync(path, addPolicy(readFileSync(path, 'utf8')))
    n += 1
  }
  if (n === 0) throw new Error(`no pages found in ${OUT}; run next build first`)
  console.log(`csp: added a Content-Security-Policy to ${n} pages`)
}
