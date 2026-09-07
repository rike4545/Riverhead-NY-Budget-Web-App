// Post-build regression gate. Run with `npm run verify` after `npm run build`.
// Checks resident routes, generated data integrity, dataset freshness contracts,
// and search payload guardrails before GitHub Pages deployment.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }
const warn = (message) => console.warn(`VERIFY WARNING: ${message}`)

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

// Search manifest must exactly describe its shards. The legacy monolithic index
// must stay gone so a future ETL change cannot silently restore the old payload.
if (existsSync(path('out/data/search/unified.json'))) fail('Legacy unified.json was regenerated; sharded search regression detected')
if (existsSync(path('out/data/search/manifest.json'))) {
  const manifest = JSON.parse(readFileSync(path('out/data/search/manifest.json'), 'utf8'))
  if (manifest.version !== 2) fail(`Unexpected search manifest version: ${manifest.version}`)
  const requiredShards = ['line-item', 'payroll', 'salary', 'resolution', 'fund', 'page']
  for (const type of requiredShards) if (!manifest.shards?.[type]) fail(`Search manifest is missing required shard: ${type}`)

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
  if (manifest.total < 5_000) fail(`Search index record count collapsed unexpectedly: ${manifest.total}`)
  if (coreBytes > 2_500_000) fail(`Initial structured search payload is too large: ${(coreBytes / 1e6).toFixed(2)} MB`)
  if (bytes > 8_000_000) fail(`Total search shards unexpectedly exceed 8 MB: ${(bytes / 1e6).toFixed(2)} MB`)
}

// Freshness metadata must be newly generated, complete, and plausible. External
// source staleness is surfaced as a warning rather than making the whole site
// unavailable; pipeline-owned search/projection data must be current after CI.
if (existsSync(path('out/data/meta.json'))) {
  const meta = JSON.parse(readFileSync(path('out/data/meta.json'), 'utf8'))
  const generated = Date.parse(meta.generatedAt)
  if (!Number.isFinite(generated)) fail('meta.generatedAt is missing or invalid')
  else {
    const ageHours = (Date.now() - generated) / 3_600_000
    if (ageHours < -1) fail('meta.generatedAt is unexpectedly in the future')
    if (ageHours > 24) fail(`Freshness metadata was not regenerated for this build (${ageHours.toFixed(1)} hours old)`)
  }

  const datasets = meta.datasets ?? {}
  if ((datasets.meetings ?? 0) < 20) fail(`Meeting count is implausibly low: ${datasets.meetings ?? 0}`)
  if ((datasets.votes ?? 0) < 500) fail(`Vote count is implausibly low: ${datasets.votes ?? 0}`)
  if ((datasets.budgetLineItems ?? 0) < 500) fail(`Budget line-item count is implausibly low: ${datasets.budgetLineItems ?? 0}`)
  if ((datasets.searchEntries ?? 0) < 5_000) fail(`Search entry count is implausibly low: ${datasets.searchEntries ?? 0}`)
  if (!Array.isArray(datasets.payrollYears) || datasets.payrollYears.length < 5) fail('Payroll year coverage is unexpectedly incomplete')

  const requiredDetails = ['budget', 'meetings', 'payroll', 'annualReport', 'projection', 'search']
  const allowedFreshness = new Set(['current', 'delayed', 'stale', 'unknown'])
  const allowedStatus = new Set(['official', 'calculated', 'projected'])
  for (const key of requiredDetails) {
    const detail = meta.datasetDetails?.[key]
    if (!detail) { fail(`Dataset-specific freshness metadata is missing: ${key}`); continue }
    if (!detail.label || !detail.cadence || !detail.asOf) fail(`${key} freshness metadata is missing label/cadence/asOf`)
    if (!allowedStatus.has(detail.status)) fail(`${key} has invalid provenance status: ${detail.status}`)
    if (!allowedFreshness.has(detail.freshness)) fail(`${key} has invalid freshness state: ${detail.freshness}`)
    if (!detail.freshnessNote || !detail.freshnessPolicy?.mode) fail(`${key} is missing freshness explanation/policy`)
    if (detail.freshness === 'stale') warn(`${key} source data is stale: ${detail.freshnessNote}`)
  }
  for (const key of ['projection', 'search']) {
    if (meta.datasetDetails?.[key]?.freshness !== 'current') fail(`${key} must be current immediately after pipeline regeneration`)
  }
}

const home = readFileSync(path('out/index.html'), 'utf8')
for (const text of ['Payroll Explorer', 'Start Here', 'Current data snapshot']) {
  if (!home.includes(text)) fail(`Missing expected home-page content: ${text}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Build verification passed: routes, record floors, freshness contracts, search shards, and payload guardrails are valid.')
