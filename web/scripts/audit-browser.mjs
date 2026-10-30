// Browser quality gate for the pages residents use most. It checks responsive
// overflow, WCAG 2.2 AA with axe-core, and captures reviewable screenshots at
// phone and desktop widths. Screenshots are CI artifacts; they are not yet
// pixel-baseline comparisons.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')
const { chromium } = await import('playwright')
const OUT = resolve(process.cwd(), 'out')
const BASE = '/Riverhead-NY-Budget-Web-App'
const SCREENSHOTS = resolve(process.cwd(), 'artifacts/screenshots')
const ROUTES = [
  '/', '/tentative-2027/', '/tax-bill/', '/budget-amendments-2027/',
  '/scenarios/', '/meetings/', '/reserves/', '/capital-debt/',
  '/town-square/', '/buyout/', '/budget-accuracy/', '/sources/',
  '/data-quality/',
]
const WIDTHS = [390, 768, 1280, 1920]
const SCREENSHOT_ROUTES = new Set(['/', '/tentative-2027/', '/tax-bill/', '/budget-amendments-2027/', '/budget-accuracy/', '/capital-debt/', '/buyout/'])
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain',
}
const failures = []
const fail = (message) => { failures.push(message); console.error(`BROWSER AUDIT FAILED: ${message}`) }

if (!existsSync(OUT)) {
  console.error('BROWSER AUDIT FAILED: web/out is missing; run the production build first.')
  process.exit(1)
}
mkdirSync(SCREENSHOTS, { recursive: true })

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    let pathname = decodeURIComponent(url.pathname)
    if (!pathname.startsWith(BASE)) { res.writeHead(404).end(); return }
    // Serve axe as a same-origin external script so the site's strict CSP can
    // allow the audit without weakening production Content-Security-Policy.
    if (pathname === `${BASE}/__audit/axe.min.js`) {
      res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' })
      res.end(readFileSync(axePath))
      return
    }
    const relativePath = pathname.slice(BASE.length) || '/'
    let file = resolve(OUT, `.${relativePath}`)
    if (!file.startsWith(OUT)) { res.writeHead(403).end(); return }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  } catch {
    res.writeHead(400).end()
  }
})

await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen)
  server.listen(0, '127.0.0.1', resolveListen)
})
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
let pageCount = 0
let axeRuns = 0
let violationCount = 0

try {
  for (const route of ROUTES) {
    const routeName = route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-')
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      const response = await page.goto(`${origin}${BASE}${route}`, { waitUntil: 'load', timeout: 15000 })
      if (!response || response.status() !== 200) {
        fail(`${route} returned ${response?.status() ?? 'no response'} at ${width}px`)
        continue
      }
      pageCount++
      const layout = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth
        const offenders = [...document.querySelectorAll('body *')].map((element) => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === 'string' ? element.className.slice(0, 90) : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            display: style.display,
            position: style.position,
          }
        }).filter((item) => item.display !== 'none' && item.width > 0 && item.right > viewport + 2)
          .sort((a, b) => b.right - a.right).slice(0, 6)
        return {
          viewport,
          document: document.documentElement.scrollWidth,
          body: document.body?.scrollWidth ?? 0,
          offenders,
        }
      })
      const contentWidth = Math.max(layout.document, layout.body)
      if (contentWidth > layout.viewport + 2) fail(`${route} has horizontal overflow at ${width}px: content ${contentWidth}px vs viewport ${layout.viewport}px; offenders=${JSON.stringify(layout.offenders)}`)

      if (SCREENSHOT_ROUTES.has(route) && (width === 390 || width === 1280 || width === 1920)) {
        const screenshot = join(SCREENSHOTS, `${routeName}-${width}.png`)
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' })
      }

      if (width === 390 || width === 1920) {
        await page.addScriptTag({ url: `${origin}${BASE}/__audit/axe.min.js` })
        const audit = await page.evaluate(async (tags) => window.axe.run(document, {
          runOnly: { type: 'tag', values: tags },
        }), axeTags)
        axeRuns++
        const serious = audit.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        violationCount += audit.violations.length
        for (const v of audit.violations) {
          const targets = v.nodes.slice(0, 5).map((node) => `${node.target.join(', ')} ${(node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 700)}`).join(' || ')
          const summary = `${route} at ${width}px: ${v.id} (${v.impact}) — ${v.help}; ${v.nodes.length} affected node(s); ${targets}`
          if (v.impact === 'critical' || v.impact === 'serious') fail(summary)
          else console.warn(`ACCESSIBILITY NOTE: ${summary}`)
        }

        // Audit the expanded navigation as a separate interactive state.
        if (width <= 1720) {
          const menu = page.locator('.nav-hamburger')
          if (await menu.isVisible()) await menu.click()
        } else {
          const dropdown = page.locator('button[aria-controls^="nav-dropdown-"]').first()
          if (await dropdown.isVisible()) await dropdown.click()
        }
        const expandedAudit = await page.evaluate(async (tags) => window.axe.run(document, {
          runOnly: { type: 'tag', values: tags },
        }), axeTags)
        axeRuns++
        for (const v of expandedAudit.violations) {
          const targets = v.nodes.slice(0, 5).map((node) => `${node.target.join(', ')} ${(node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 700)}`).join(' || ')
          const summary = `${route} expanded navigation at ${width}px: ${v.id} (${v.impact}) — ${v.help}; ${v.nodes.length} affected node(s); ${targets}`
          if (v.impact === 'critical' || v.impact === 'serious') fail(summary)
          else console.warn(`ACCESSIBILITY NOTE: ${summary}`)
        }
        violationCount += expandedAudit.violations.length
        }
      }
    }
} finally {
  await browser.close()
  await new Promise((resolveClose) => server.close(resolveClose))
}

console.log(`Browser audit: ${pageCount} responsive page states, ${axeRuns} axe-core runs, ${violationCount} total accessibility findings; screenshots saved to artifacts/screenshots.`)
if (!failures.length) console.log('Browser quality gate passed: no serious/critical WCAG 2.2 AA violations or horizontal overflow on audited routes.')
process.exitCode = failures.length ? 1 : 0
