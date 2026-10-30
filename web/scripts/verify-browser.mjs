// Browser-level responsive and accessibility smoke tests for the static export.
// The W3C checker validates markup; this pass checks the rendered experience at
// phone and desktop widths and runs axe against representative resident workflows.
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const axePath = require.resolve('axe-core/axe.min.js')
const out = resolve(process.cwd(), 'out')
const reportPath = join(out, 'browser-a11y-report.json')
const snapshots = join(out, 'browser-snapshots')
const basePath = '/Riverhead-NY-Budget-Web-App'
const routes = [
  '/', '/tax-bill/', '/what-changed/', '/taxpayer-impact/', '/reserves/',
  '/capital-debt/', '/town-square/', '/buyout/', '/meetings/',
  '/search/', '/budget-amendments-2027/',
]
const screenshotRoutes = new Set(['/', '/what-changed/', '/reserves/', '/budget-amendments-2027/'])
const failures = []
const layoutIssues = []
const accessibility = []
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
}

if (!existsSync(join(out, 'index.html'))) {
  console.error('BROWSER VERIFY FAILED: out/index.html is missing; build the static export first.')
  process.exit(1)
}
mkdirSync(snapshots, { recursive: true })

const server = createServer((req, res) => {
  let pathname
  try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname) }
  catch { res.writeHead(400).end('Bad request'); return }
  if (pathname === basePath || pathname.startsWith(basePath + '/')) pathname = pathname.slice(basePath.length) || '/'
  if (!pathname.startsWith('/')) pathname = '/' + pathname
  // Serve axe from the same origin so the site's restrictive CSP remains on.
  if (pathname === '/__audit/axe.min.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    createReadStream(axePath).pipe(res)
    return
  }
  let target = resolve(out, '.' + pathname)
  if (target !== out && !target.startsWith(out + sep)) { res.writeHead(403).end('Forbidden'); return }
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html')
  if (!existsSync(target) && !extname(target)) target = join(target, 'index.html')
  if (!existsSync(target) || !statSync(target).isFile()) { res.writeHead(404).end('Not found'); return }
  res.writeHead(200, { 'content-type': mime[extname(target)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
  createReadStream(target).pipe(res)
})

await new Promise((resolveListen, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolveListen)
})
const address = server.address()
const origin = `http://127.0.0.1:${address.port}`
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  page.setDefaultTimeout(15000)

  for (const route of routes) {
    const url = `${origin}${basePath}${route}`
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
      if (!response || !response.ok()) {
        failures.push({ route, issue: `HTTP ${response?.status() ?? 'no response'}` })
        continue
      }
      const structure = await page.evaluate(() => ({
        title: document.title,
        hasMain: !!document.querySelector('main'),
        width: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }))
      if (!structure.title.trim()) failures.push({ route, issue: 'document title is empty' })
      if (!structure.hasMain) failures.push({ route, issue: 'main landmark is missing' })

      await page.addScriptTag({ url: `${origin}${basePath}/__audit/axe.min.js` })
      const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      }))
      accessibility.push({
        route,
        violations: result.violations.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
          nodes: v.nodes.slice(0, 12).map((n) => ({ target: n.target, html: n.html.slice(0, 240), summary: n.failureSummary })),
          totalNodes: v.nodes.length,
        })),
        passes: result.passes.length,
        incomplete: result.incomplete.length,
      })
      if (screenshotRoutes.has(route)) {
        const name = route === '/' ? 'home' : route.replaceAll('/', '')
        await page.screenshot({ path: join(snapshots, `${name}-desktop.png`), fullPage: true })
      }
    } catch (error) {
      failures.push({ route, issue: String(error).slice(0, 500) })
    }
  }

  // A 320px check is the narrowest documented layout target for this site.
  for (const route of routes) {
    try {
      await page.setViewportSize({ width: 320, height: 800 })
      const response = await page.goto(`${origin}${basePath}${route}`, { waitUntil: 'domcontentloaded' })
      if (!response?.ok()) { layoutIssues.push({ route, issue: `HTTP ${response?.status() ?? 'no response'} at 320px` }); continue }
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }))
      if (dimensions.document > dimensions.viewport + 2 || dimensions.body > dimensions.viewport + 2) {
        layoutIssues.push({ route, ...dimensions })
      }
      if (screenshotRoutes.has(route)) {
        const name = route === '/' ? 'home' : route.replaceAll('/', '')
        await page.screenshot({ path: join(snapshots, `${name}-mobile-320.png`), fullPage: true })
      }
    } catch (error) {
      layoutIssues.push({ route, issue: String(error).slice(0, 500) })
    }
  }
} finally {
  await browser.close()
  await new Promise((resolveClose) => server.close(resolveClose))
}

const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
for (const page of accessibility) for (const violation of page.violations) counts[violation.impact ?? 'minor']++
const report = {
  generatedAt: new Date().toISOString(),
  standard: 'axe-core WCAG 2.0/2.1/2.2 A and AA tags',
  routes,
  summary: { routesAudited: accessibility.length, violationsByImpact: counts, layoutIssues: layoutIssues.length, failures: failures.length },
  failures,
  layoutIssues,
  accessibility,
}
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(`Browser audit: ${accessibility.length}/${routes.length} routes; axe violations ${JSON.stringify(counts)}; 320px layout issues ${layoutIssues.length}; route failures ${failures.length}.`)
console.log(`Visual QA screenshots and full accessibility report: ${reportPath}`)
if (failures.length || layoutIssues.length || counts.critical > 0) {
  for (const issue of failures) console.error(`BROWSER VERIFY FAILED: ${issue.route}: ${issue.issue}`)
  for (const issue of layoutIssues) console.error(`MOBILE LAYOUT ISSUE: ${issue.route}: ${JSON.stringify(issue)}`)
  if (counts.critical > 0) console.error(`ACCESSIBILITY: ${counts.critical} critical axe violation group(s); see ${reportPath}`)
  process.exitCode = 1
} else if (counts.serious > 0) {
  console.warn(`Accessibility review needed: ${counts.serious} serious axe violation group(s); see the uploaded report. Critical issues and 320px overflow fail this check.`)
} else {
  console.log('Browser smoke tests passed: core routes load, expose a main landmark, and fit a 320px viewport; no critical axe violations.')
}
