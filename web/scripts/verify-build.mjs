// Post-build regression gate. Run with `npm run verify` after `npm run build`.
// Checks resident routes, generated data integrity, freshness, evidence contracts,
// claim-level provenance, and search payload guardrails before deployment.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }
const warn = (message) => console.warn(`VERIFY WARNING: ${message}`)

const requiredFiles = [
  'app/page.tsx', 'components/FiscalCommandCenter.tsx', 'components/PayrollTabs.tsx',
  'components/UnifiedSearch.tsx', 'components/DataStatus.tsx', 'components/ProvenanceLine.tsx',
  'components/AuthorityAuditBadge.tsx', 'lib/authority-audit.ts', 'lib/osc-guidance.ts',
  'lib/all-funds.ts', 'lib/afr.ts', 'lib/payroll.ts', 'lib/salary.ts', 'lib/meetings.ts',
  'lib/subaccounts.ts', 'lib/budget-history.ts', 'lib/general-fund.ts',
]

const requiredOutputs = [
  'out/index.html', 'out/guide/index.html', 'out/what-changed/index.html',
  'out/data-quality/index.html', 'out/payroll/index.html', 'out/funds/index.html',
  'out/funds/A01/index.html', 'out/compare/index.html', 'out/general-fund/index.html',
  'out/annual-report/index.html', 'out/meetings/index.html', 'out/search/index.html',
  'out/downloads/index.html', 'out/analytics/index.html', 'out/taxpayer-impact/index.html',
  'out/predict-2027/index.html', 'out/tax-cap/index.html', 'out/sources/index.html',
  'out/sitemap.xml', 'out/robots.txt', 'out/data/search/manifest.json',
  'out/data/payroll/records.json', 'out/data/meta.json', 'out/downloads/payroll_actual_2018_2025.csv',
]

for (const file of [...requiredFiles, ...requiredOutputs]) {
  if (!existsSync(path(file))) fail(`Missing required file: ${file}`)
}

// Route integrity: every root-relative page href defined in SiteNav must export.
const nav = readFileSync(path('components/SiteNav.tsx'), 'utf8')
const routeMatches = [...nav.matchAll(/\$\{base\}(\/[^'"`?#]*\/)/g)].map((m) => m[1])
for (const route of new Set(routeMatches)) {
  const output = route === '/' ? 'out/index.html' : `out${route}index.html`
  if (!existsSync(path(output))) fail(`Navigation route has no exported page: ${route}`)
}

// Search manifest must exactly describe its shards. The legacy monolith stays gone.
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

// Dataset freshness contracts.
if (existsSync(path('out/data/meta.json'))) {
  const meta = JSON.parse(readFileSync(path('out/data/meta.json'), 'utf8'))
  const generated = Date.parse(meta.generatedAt)
  if (!Number.isFinite(generated)) fail('meta.generatedAt is missing or invalid')
  else {
    const ageHours = (Date.now() - generated) / 3_600_000
    if (ageHours < -1) fail('meta.generatedAt is unexpectedly in the future')
    if (ageHours > 24) fail(`Freshness metadata was not regenerated for this build (${ageHours.toFixed(1)} hours old)`)
  }
  if (!/^[a-f0-9]{16}$/.test(meta.dataVersion ?? '')) fail('meta.dataVersion is missing or invalid')

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
  for (const key of ['projection', 'search']) if (meta.datasetDetails?.[key]?.freshness !== 'current') fail(`${key} must be current immediately after pipeline regeneration`)
}

const home = readFileSync(path('out/index.html'), 'utf8')
for (const text of ['Payroll Explorer', 'Start Here', 'Current data snapshot']) if (!home.includes(text)) fail(`Missing expected home-page content: ${text}`)

// 2027 model must keep its legal-limit caveat and statewide override context.
const predict2027 = readFileSync(path('out/predict-2027/index.html'), 'utf8')
for (const text of ['2% allowable-growth planning proxy', '28.6% of towns', 'final legal limit is not simply']) if (!predict2027.includes(text)) fail(`2027 tax-cap framing regressed: missing ${text}`)

// Tax-cap page must use the OSC formula vocabulary. A 2% reference may be shown,
// but never as though it were Riverhead's already-determined final levy limit.
const taxCap = readFileSync(path('out/tax-cap/index.html'), 'utf8')
for (const text of ['levy limit is a formula', '2% is one factor', '2% growth reference', 'An override is authorization, not an outcome', '2027 allowable levy growth factor']) {
  if (!taxCap.includes(text)) fail(`Tax-cap evidence framing regressed: missing ${text}`)
}
for (const forbidden of ['General Fund levy growth against the 2% cap', '>2% cap<', 'real ceiling is usually']) {
  if (taxCap.includes(forbidden)) fail(`Tax-cap shorthand regressed: found ${forbidden}`)
}
const taxCapProvenance = (taxCap.match(/data-provenance="true"/g) ?? []).length
if (taxCapProvenance < 4) fail(`Tax-cap claim-level provenance coverage collapsed: found ${taxCapProvenance}, expected at least 4`)
for (const claim of ['claim-tax-cap-formula', 'claim-override-rule', 'claim-riverhead-cap-history', 'claim-2027-growth-factor']) {
  if (!taxCap.includes(claim)) fail(`Missing required tax-cap claim provenance marker: ${claim}`)
}

// Source library must preserve authority hierarchy and external audit metadata.
const sources = readFileSync(path('out/sources/index.html'), 'utf8')
for (const text of [
  'OSC guidance used to interpret Riverhead',
  'Real Property Tax Cap and Tax Cap Compliance',
  'Understanding the Budget Process',
  'FASB Accounting Standards Codification',
  'nongovernmental entities',
  'not Riverhead’s governing municipal GAAP',
  'External authority monitoring',
  'Checked Sep 7, 2026',
]) {
  if (!sources.includes(text)) fail(`Source-library authority/audit framing regressed: missing ${text}`)
}

// Provenance coverage report: warn on analytical pages with no claim metadata.
// This does not fail older pages yet, but it makes the remaining rollout visible
// while the tax-cap page establishes a hard non-regression floor.
const provenancePages = ['analytics', 'what-changed', 'taxpayer-impact', 'predict-2027', 'tax-cap', 'reserves', 'capital-debt', 'town-square', 'buyout']
let pagesWithProvenance = 0
for (const route of provenancePages) {
  const file = path(`out/${route}/index.html`)
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  const count = (html.match(/data-provenance="true"/g) ?? []).length
  if (count > 0) pagesWithProvenance += 1
  else warn(`Claim-level provenance rollout pending on /${route}/`)
}
if (pagesWithProvenance < 2) fail(`Claim-level provenance coverage is unexpectedly low: ${pagesWithProvenance} analytical pages`)

if (process.exitCode) process.exit(process.exitCode)
console.log(`Build verification passed: routes, record floors, freshness, tax-cap evidence contracts, source authority audit, provenance coverage (${pagesWithProvenance}/${provenancePages.length}), search shards, and payload guardrails are valid.`)
