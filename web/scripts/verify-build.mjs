// Post-build regression gate. Run with `npm run verify` after `npm run build`.
// It checks resident routes, generated data integrity, freshness metadata, and
// search payload guardrails before GitHub Pages deployment.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

const requiredFiles = [
  'app/page.tsx', 'components/FiscalCommandCenter.tsx', 'components/PayrollTabs.tsx',
  'components/UnifiedSearch.tsx', 'components/DataStatus.tsx', 'components/ProvenanceLine.tsx',
  'lib/all-funds.ts', 'lib/afr.ts', 'lib/payroll.ts', 'lib/salary.ts', 'lib/meetings.ts',
  'lib/subaccounts.ts', 'lib/budget-history.ts', 'lib/general-fund.ts',
]

const requiredOutputs = [
  'out/index.html', 'out/guide/index.html', 'out/what-changed/index.html',
  'out/data-quality/index.html', 'out/payroll/index.html', 'out/funds/index.html',
  'out/funds/A01/index.html', 'out/compare/index.html', 'out/general-fund/index.html',
  'out/annual-report/index.html', 'out/meetings/index.html', 'out/search/index.html',
  'out/downloads/index.html', 'out/analytics/index.html', 'out/taxpayer-impact/index.html',
  'out/sitemap.xml', 'out/robots.txt', 'out/data/search/manifest.json',
  'out/data/payroll/records.json', 'out/data/meta.json',
  'out/downloads/payroll_actual_2018_2025.csv',
]

for (const file of [...requiredFiles, ...requiredOutputs]) {
  if (!existsSync(path(file))) fail(`Missing required file: ${file}`)
}

// Route integrity: every root-relative page href defined in SiteNav must have a
// corresponding static export. Ignore anchors and external links.
const nav = readFileSync(path('components/SiteNav.tsx'), 'utf8')
const routeMatches = [...nav.matchAll(/\$\{base\}(\/[^'"`?#]*\/)/g)].map((m) => m[1])
for (const route of new Set(routeMatches)) {
  const output = route === '/' ? 'out/index.html' : `out${route}index.html`
  if (!existsSync(path(output))) fail(`Navigation route has no exported page: ${route}`)
}

// Search manifest must exactly describe its shards.
if (existsSync(path('out/data/search/manifest.json'))) {
  const manifest = JSON.parse(readFileSync(path('out/data/search/manifest.json'), 'utf8'))
  if (manifest.version !== 2) fail(`Unexpected search manifest version: ${manifest.version}`)
  let count = 0
  let bytes = 0
  let coreBytes = 0
  for (const [type, shard] of Object.entries(manifest.shards ?? {})) {
    const shardPath = path('out/data/search', shard.url)
    if (!existsSync(shardPath)) { fail(`Missing search shard: ${shard.url}`); continue }
    const actualBytes = statSync(shardPath).size
    const payload = JSON.parse(readFileSync(shardPath, 'utf8'))
    const actualCount = Array.isArray(payload.entries) ? payload.entries.length : -1
    if (actualCount !== shard.count) fail(`${type} shard count mismatch: manifest ${shard.count}, actual ${actualCount}`)
    if (actualBytes !== shard.bytes) fail(`${type} shard byte mismatch: manifest ${shard.bytes}, actual ${actualBytes}`)
    count += actualCount
    bytes += actualBytes
    if (type !== 'page') coreBytes += actualBytes
  }
  if (count !== manifest.total) fail(`Search total mismatch: manifest ${manifest.total}, shards ${count}`)
  // Guardrails are intentionally generous: fail on a substantial regression,
  // not ordinary record growth. Document pages are lazy-loaded.
  if (coreBytes > 2_500_000) fail(`Initial structured search payload is too large: ${(coreBytes / 1e6).toFixed(2)} MB`)
  if (bytes > 8_000_000) fail(`Total search shards unexpectedly exceed 8 MB: ${(bytes / 1e6).toFixed(2)} MB`)
}

// Freshness metadata must be present and parseable, and generated during a
// build/ETL run rather than silently carrying an invalid timestamp forever.
if (existsSync(path('out/data/meta.json'))) {
  const meta = JSON.parse(readFileSync(path('out/data/meta.json'), 'utf8'))
  const generated = Date.parse(meta.generatedAt)
  if (!Number.isFinite(generated)) fail('meta.generatedAt is missing or invalid')
  if (!meta.datasetDetails?.budget || !meta.datasetDetails?.meetings || !meta.datasetDetails?.search) fail('Dataset-specific freshness metadata is incomplete')
}

const home = readFileSync(path('out/index.html'), 'utf8')
for (const text of ['Payroll Explorer', 'Start Here', 'Current data snapshot']) {
  if (!home.includes(text)) fail(`Missing expected home-page content: ${text}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Build verification passed: routes, datasets, freshness, search shards, and payload guardrails are valid.')
