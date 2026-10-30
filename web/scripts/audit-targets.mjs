// Tap targets on the built site, measured in a browser against WCAG 2.2's
// Target Size (Minimum), success criterion 2.5.8: every link, button and
// control is at least 24 by 24 CSS pixels, unless one of its exceptions holds.
// This applies the two that matter here:
//   - Inline: a link inside a sentence or a line of text.
//   - Spacing: a 24px circle centred on the small target touches no other
//     target, and no other small target's circle.
// See .claude/references/accessibility-baseline.md.
//
// The quality-gate workflow installs Playwright and runs this against key routes
// at phone, tablet and desktop widths. It can also be run manually after a page change.

import { createServer } from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const args = process.argv.slice(2)
const width = Number(args[args.indexOf('--width') + 1]) || 390
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--width')
const OUT = join(process.cwd(), 'out')
const BASE = '/Riverhead-NY-Budget-Web-App'

const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'))

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* pages(p)
    else if (name === 'index.html') yield `/${relative(OUT, dir)}${relative(OUT, dir) ? '/' : ''}`
  }
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' }
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!path.startsWith(BASE)) { res.writeHead(404).end(); return }
  path = join(OUT, path.slice(BASE.length))
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html')
  if (!existsSync(path)) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path))
})

await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen)
  server.listen(0, '127.0.0.1', resolveListen)
})
const origin = `http://127.0.0.1:${server.address().port}`

/** Runs in the page: every target that fails 2.5.8 after the exceptions. */
function failingTargets() {
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [tabindex]:not([tabindex="-1"])'
  const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 }
  const targets = [...document.querySelectorAll(SEL)].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() }))
  const isInline = (el) => {
    // A link inside running text: the line it sits on holds more than the link.
    // A target set in a line of text: the block it sits in holds more than it,
    // so its height is the line's. That covers a link in a sentence and a
    // "Source · Source" line alike, which WCAG's exception also allows ("its
    // size is otherwise constrained by the line-height of non-target text").
    // It is lenient by design: a target alone in its block is still measured.
    if (!/^inline/.test(getComputedStyle(el).display)) return false
    let block = el.parentElement
    while (block && /^(inline|contents)/.test(getComputedStyle(block).display)) block = block.parentElement
    return !!block && (block.textContent ?? '').trim().length > (el.textContent ?? '').trim().length
  }
  const small = targets.filter((t) => (t.r.width < 24 || t.r.height < 24) && !isInline(t.el))
  const centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  const distToRect = (p, r) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom))
  const contains = (a, b) => a.el.contains(b.el) || b.el.contains(a.el)
  return small.filter((t) => {
    const c = centre(t.r)
    const hitsTarget = targets.some((o) => o !== t && !contains(o, t) && distToRect(c, o.r) < 12)
    const hitsCircle = small.some((o) => o !== t && !contains(o, t) && Math.hypot(c.x - centre(o.r).x, c.y - centre(o.r).y) < 24)
    return hitsTarget || hitsCircle
  }).map((t) => `${t.el.tagName.toLowerCase()} ${Math.round(t.r.width)}×${Math.round(t.r.height)} “${(t.el.innerText || t.el.textContent || t.el.getAttribute('aria-label') || t.el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}”`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 900 } })
const list = only.length ? only.map((p) => (p.startsWith('/') ? p : `/${p}`)) : [...pages(OUT)].filter((p) => !p.startsWith('/_'))
let failures = 0
for (const p of list.sort()) {
  await page.goto(`${origin}${BASE}${p}`, { waitUntil: 'load', timeout: 15000 }).catch(() => {})
  const bad = await page.evaluate(failingTargets)
  if (bad.length) {
    failures += bad.length
    console.log(`${p}: ${bad.length} target${bad.length === 1 ? '' : 's'} under 24px with a neighbour too close`)
    for (const b of [...new Set(bad)].slice(0, 8)) console.log(`    ${b}`)
  }
}
await browser.close()
await new Promise((resolveClose) => server.close(resolveClose))
console.log(`targets: ${list.length} pages at ${width}px, ${failures} failing WCAG 2.5.8`)
process.exitCode = failures ? 1 : 0
