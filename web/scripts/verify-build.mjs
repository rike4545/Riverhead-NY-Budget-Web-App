// Post-build regression gate. `npm run verify` rebuilds first for local/manual use;
// CI/deploy run `npm run verify:output` after their explicit production build.
// Checks resident routes, generated data integrity, freshness, evidence contracts,
// claim-level provenance, meeting status, and search payload guardrails before deployment.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { realRaiseExamples } from '../lib/pba-step-schedule.ts'
import { drawsByFund, fundBalanceLines, tableCorrects } from '../lib/fund-balance-lines.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }
const warn = (message) => console.warn(`VERIFY WARNING: ${message}`)

const requiredFiles = [
  'app/page.tsx', 'components/FiscalCommandCenter.tsx', 'components/PayrollTabs.tsx',
  'components/UnifiedSearch.tsx', 'components/DataStatus.tsx', 'components/ProvenanceLine.tsx',
  'components/AuthorityAuditBadge.tsx', 'components/MeetingTimeline.tsx',
  'lib/authority-audit.ts', 'lib/osc-guidance.ts', 'lib/all-funds.ts', 'lib/afr.ts',
  'lib/payroll.ts', 'lib/salary.ts', 'lib/meetings.ts', 'lib/subaccounts.ts',
  'lib/budget-history.ts', 'lib/general-fund.ts',
]

const requiredOutputs = [
  'out/index.html', 'out/guide/index.html', 'out/what-changed/index.html',
  'out/data-quality/index.html', 'out/payroll/index.html', 'out/funds/index.html',
  'out/funds/A01/index.html', 'out/compare/index.html', 'out/general-fund/index.html',
  'out/annual-report/index.html', 'out/meetings/index.html', 'out/search/index.html',
  'out/downloads/index.html', 'out/analytics/index.html', 'out/taxpayer-impact/index.html',
  'out/predict-2027/index.html', 'out/tax-cap/index.html', 'out/sources/index.html',
  'out/sitemap.xml', 'out/robots.txt', 'out/data/search/manifest.json',
  'out/data/payroll/records.json', 'out/data/meta.json', 'out/data/meetings/upcoming.json',
  'out/downloads/payroll_actual_2018_2025.csv',
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
    if (actualBytes !== shard.bytes) fail(`${type} shard byte mismatch: manifest ${shard.bytes}, actual ${actualCount}`)
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

// ETL DATASET SHAPE FLOORS.
//
// On September 14, 2026 a re-extraction of the Town Board minutes collapsed the
// column padding parse_salary_schedule.py splits on. authorized-2025.json fell
// from 345 records to 177 — the entire Police, Elected Officials and Boards
// groups — and nothing here noticed. The loss surfaced a week later, and only
// because an unrelated page stopped type-checking against a downstream null.
//
// A bare record count is the weaker guard: the break was GROUP-SHAPED, so the
// invariant worth asserting is that the groups the Town actually publishes are
// all still present with a plausible headcount. Both are checked.
{
  const salaryPath = path('out/data/salary/authorized-2025.json')
  if (!existsSync(salaryPath)) fail('Missing required file: out/data/salary/authorized-2025.json')
  else {
    const salary = JSON.parse(readFileSync(salaryPath, 'utf8'))
    const records = Array.isArray(salary.records) ? salary.records : []
    if (records.length < 300) fail(`Authorized-salary record count collapsed: ${records.length} (expected 300+)`)

    // Every group the January salary resolutions set. Losing one whole group is
    // the exact shape of the 2026 regression.
    const counts = new Map()
    for (const r of records) counts.set(r.group, (counts.get(r.group) ?? 0) + 1)
    for (const [group, floor] of [['Police', 50], ['General Fund', 100], ['Highway', 20], ['Elected Officials', 5], ['Boards', 10]]) {
      const n = counts.get(group) ?? 0
      if (n < floor) fail(`Authorized-salary group "${group}" has ${n} records (expected ${floor}+) — a parser regression drops whole groups`)
    }
  }

  // The Police Pay Steps tab types the 2025-to-2026 Police Officer raise groups
  // by hand (lib/pba-step-schedule.ts), and the 2027 step-cost estimate is
  // built on their counts. Recount them from the comparison they came from:
  // the September 30, 2026 fix to names like "Seal Jr., John" found two more
  // officers, and nothing would have noticed the counts going stale.
  const comparisonPath = path('out/data/salary/comparison-2025-2026.json')
  if (existsSync(comparisonPath)) {
    const groups = new Map()
    for (const r of JSON.parse(readFileSync(comparisonPath, 'utf8')).records) {
      if (r.title2025 !== 'Police Officer' || r.title2026 !== 'Police Officer') continue
      const pair = `${r.annual2025}|${r.annual2026}`
      groups.set(pair, (groups.get(pair) ?? 0) + 1)
    }
    for (const e of realRaiseExamples) {
      const n = groups.get(`${e.actual2025}|${e.actual2026}`) ?? 0
      if (n !== e.officerCount) fail(`Police Pay Steps counts ${e.officerCount} officers moving ${e.fromStep} -> ${e.toStep}; the salary comparison has ${n}`)
    }
  }

  // policeChain is derived from the Police salary group. It going null is what
  // finally broke the build; assert it directly so the cause is named, not the
  // symptom.
  const buyoutPath = path('out/data/buyout-analysis.json')
  if (existsSync(buyoutPath)) {
    const buyout = JSON.parse(readFileSync(buyoutPath, 'utf8'))
    if (buyout.policeChain == null) fail('buyout-analysis.policeChain is null — the police rank ladder failed to build, usually because the authorized-salary Police group is empty')
    else if (!Array.isArray(buyout.policeChain.ladder) || buyout.policeChain.ladder.length < 5) fail(`buyout-analysis.policeChain.ladder has ${buyout.policeChain.ladder?.length ?? 0} ranks (expected 5+)`)
  }
}

const home = readFileSync(path('out/index.html'), 'utf8')
for (const text of ['Payroll Explorer', 'Start Here', 'Current data snapshot']) if (!home.includes(text)) fail(`Missing expected home-page content: ${text}`)

// Meeting UX contract: completed and upcoming states must remain distinct.
const meetingsPage = readFileSync(path('out/meetings/index.html'), 'utf8')
for (const text of ['Meeting timeline', 'What just happened', 'Open a meeting and inspect the votes', 'Completed is not the same as fully archived']) {
  if (!meetingsPage.includes(text)) fail(`Meeting experience regressed: missing ${text}`)
}
const meetingSchedule = JSON.parse(readFileSync(path('out/data/meetings/upcoming.json'), 'utf8'))
if (!Array.isArray(meetingSchedule.recent)) fail('Meeting timeline is missing the recent-completed collection')
if (!Array.isArray(meetingSchedule.meetings)) fail('Meeting timeline is missing the upcoming collection')
const scheduleGenerated = Date.parse(`${meetingSchedule.generatedAt}T12:00:00Z`)
if (!Number.isFinite(scheduleGenerated)) fail('Meeting schedule generatedAt is invalid')
else {
  const scheduleAgeDays = (Date.now() - scheduleGenerated) / 86_400_000
  if (scheduleAgeDays > 3) fail(`Meeting schedule is stale (${scheduleAgeDays.toFixed(1)} days old)`)
}
const scheduleSlugs = [...(meetingSchedule.recent ?? []), ...(meetingSchedule.meetings ?? [])].map((m) => m.slug)
if (new Set(scheduleSlugs).size !== scheduleSlugs.length) fail('Meeting timeline contains duplicate meeting slugs')

// 2027 model must keep its legal-limit caveat, statewide override context, and claim provenance.
const predict2027 = readFileSync(path('out/predict-2027/index.html'), 'utf8')
for (const text of ['2% allowable-growth planning proxy', '28.6% of towns', 'final legal limit is not simply']) if (!predict2027.includes(text)) fail(`2027 tax-cap framing regressed: missing ${text}`)
for (const claim of ['claim-2027-model-headline', 'claim-2027-growth-factor', 'claim-override-trend']) {
  if (!predict2027.includes(claim)) fail(`Missing required 2027 claim provenance marker: ${claim}`)
}

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

// Source library must preserve authority hierarchy and machine-readable audit metadata.
const sources = readFileSync(path('out/sources/index.html'), 'utf8')
for (const text of [
  'OSC guidance used to interpret Riverhead',
  'Real Property Tax Cap and Tax Cap Compliance',
  'Understanding the Budget Process',
  'FASB Accounting Standards Codification',
  'nongovernmental entities',
  'not Riverhead’s governing municipal GAAP',
  'External authority monitoring',
  'data-authority-checked-at="2026-09-07"',
]) {
  if (!sources.includes(text)) fail(`Source-library authority/audit framing regressed: missing ${text}`)
}
const authorityMarkers = (sources.match(/data-authority-id=/g) ?? []).length
if (authorityMarkers < 9) fail(`Authority audit metadata coverage collapsed: found ${authorityMarkers}, expected at least 9`)

// Claim-level provenance coverage: only stable data-claim-id markers count.
const provenancePages = ['analytics', 'what-changed', 'taxpayer-impact', 'predict-2027', 'tax-cap', 'reserves', 'capital-debt', 'town-square', 'buyout']
let pagesWithClaimProvenance = 0
for (const route of provenancePages) {
  const file = path(`out/${route}/index.html`)
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  const claimIds = html.match(/data-claim-id="[^"]+"/g) ?? []
  if (claimIds.length > 0) pagesWithClaimProvenance += 1
  else warn(`Claim-level provenance rollout pending on /${route}/`)
}
if (pagesWithClaimProvenance < 3) fail(`Claim-level provenance coverage is unexpectedly low: ${pagesWithClaimProvenance} analytical pages`)

// ── Fund-balance ledger: catch a curated entry a new resolution has superseded ──
//
// The documented side of the ledger updates itself: the twice-daily meeting sync
// reparses the packets, commits the fiscal JSONs, and the deploy rebuilds. The
// CURATED side does not. lib/town-square.ts holds hand-written draws, and
// lib/fiscal-commitments-2027.ts holds a hardcoded SUPERSEDES map saying which
// of them a documented resolution replaces.
//
// That map is the fragile part. The Town Square paydown sat at a $2,725,000
// ceiling until resolution 2026-762 booked $1,874,218 for the same paydown
// against A01-9999 — and nothing would have noticed the overlap automatically.
// The next one would double-count in silence.
//
// So: whenever a documented General Fund draw's title shares a distinctive word
// with a curated entry's label, and the map does not already record it, say so.
// A warning rather than a failure, because a shared word is a prompt to look,
// not proof of an overlap.
const STOPWORDS = new Set(['budget', 'adjustment', 'transfer', 'for', 'the', 'of', 'and', 'to', 'at',
  'ratifies', 'adopts', 'authorizes', 'approves', 'capital', 'project', 'from', 'fund', 'funds',
  'town', 'a', 'an', 'in', 'on', 'with', 'by', 'repairs', 'replacement', 'new', 'other',
  'management', 'department', 'agreement', 'agreements', 'services', 'program', 'fees', 'cost',
  'costs', 'total', 'annual', 'monthly', 'grant', 'federal', 'state', 'county', '2024', '2025',
  '2026', '2027'])
const distinctive = (text) => new Set(
  String(text).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOPWORDS.has(w)),
)

try {
  const commitmentsSrc = readFileSync(path('lib/fiscal-commitments-2027.ts'), 'utf8')
  // Entries read either as '2026-762': 'label' or as '2026-762': { label: 'label', ... }.
  const supersedes = new Set(
    Array.from(commitmentsSrc.matchAll(/'(\d{4}-\d+)':\s*(?:\{\s*label:\s*)?'([^']+)'/g)).map((m) => m[2]),
  )
  if (supersedes.size === 0 && commitmentsSrc.includes('const SUPERSEDES')) {
    warn('Fund-balance ledger overlap check could not read SUPERSEDES in lib/fiscal-commitments-2027.ts — the map shape may have changed.')
  }
  // Only the labels that actually feed the ledger — the fundBalanceImpact.draws
  // block. town-square.ts carries dozens of other `label:` fields (rents,
  // construction agreements, grants) that are not fund-balance draws, and
  // matching against those buried the real signal in false positives.
  const curatedSrc = readFileSync(path('lib/town-square.ts'), 'utf8')
  const drawsStart = curatedSrc.indexOf('export const fundBalanceImpact')
  const drawsBlock = drawsStart === -1
    ? ''
    : curatedSrc.slice(drawsStart, curatedSrc.indexOf('offsets:', drawsStart))
  const curatedLabels = Array.from(drawsBlock.matchAll(/label:\s*'([^']+)'/g)).map((m) => m[1])
    .filter((l) => !supersedes.has(l))
  if (curatedLabels.length === 0 && drawsStart !== -1) {
    warn('Fund-balance ledger overlap check found no curated draw labels — the town-square.ts shape may have changed.')
  }

  const meetingDir = path('public/data/meetings')
  const index = JSON.parse(readFileSync(join(meetingDir, 'fiscal-index.json'), 'utf8'))
  let collisions = 0
  for (const slug of index.meetings) {
    const file = join(meetingDir, `${slug}-fiscal.json`)
    if (!existsSync(file)) continue
    for (const r of JSON.parse(readFileSync(file, 'utf8')).resolutions ?? []) {
      const f = r.funding
      if (!f?.drawsFundBalance || r.vote?.adopted !== true) continue
      if (!(f.fundBalanceFunds ?? []).includes('General Fund')) continue
      if (supersedes.has(r.title)) continue
      const words = distinctive(r.title)
      for (const label of curatedLabels) {
        const shared = Array.from(distinctive(label)).filter((w) => words.has(w))
        if (shared.length > 0) {
          collisions += 1
          warn(
            `Fund-balance ledger may double-count: documented draw ${r.number} shares "${shared.join(', ')}" ` +
            `with the curated entry "${label}". Check whether it supersedes that entry and add it to SUPERSEDES ` +
            `in lib/fiscal-commitments-2027.ts if so.`,
          )
        }
      }
    }
  }
  if (collisions === 0) console.log('Fund-balance ledger: no documented draw overlaps an un-superseded curated entry.')
} catch (error) {
  warn(`Fund-balance ledger overlap check could not run: ${error.message}`)
}

// ── Section G against the budget table the Board adopted ────────────────────
//
// A fund's draw is the figure on the adopted budget table wherever
// etl/parse_fiscal_impact.py read that fund's 9999 row (tableFundBalance), and
// section G's otherwise (lib/fund-balance-lines.ts): 2026-765 is counted at the
// $280,000 adopted, not section G's $150,000. Two cases need a person:
//   - the ETL flagged section G below the table (statementBelowTable) but read
//     no 9999 row for the fund drawn, so the pages count section G's figure;
//   - a table names a 9999 account in a fund section G does not draw on. It is
//     not counted, because a row does not say whether money leaves the balance
//     or returns to it (2026-569 returns $17,972.55 to one).
try {
  const meetingDir = path('public/data/meetings')
  const index = JSON.parse(readFileSync(join(meetingDir, 'fiscal-index.json'), 'utf8'))
  const usd = (n) => `$${n.toLocaleString('en-US')}`
  const corrected = []
  const tableOnly = []
  for (const slug of index.meetings) {
    const file = join(meetingDir, `${slug}-fiscal.json`)
    if (!existsSync(file)) continue
    for (const r of JSON.parse(readFileSync(file, 'utf8')).resolutions ?? []) {
      if (r.vote?.adopted !== true) continue
      const draws = drawsByFund(r.funding, r.tableFundBalance)
      for (const d of draws.filter(tableCorrects)) {
        corrected.push(`${r.number} (${d.fund}: ${usd(d.table)} adopted, ${d.statement === null ? 'no amount' : usd(d.statement)} in section G)`)
      }
      const gap = r.statementBelowTable
      if (r.funding?.drawsFundBalance && gap && draws.every((d) => d.table === null)) {
        warn(`Fund-balance draw ${r.number} (${slug}): section G says ${usd(gap.statement)}, below the ${usd(gap.table)} on its own budget table, ` +
          'but no 9999 row of the table was read, so the pages count section G. Read the packet, then fix table_fund_balance in etl/parse_fiscal_impact.py.')
      }
      const drawn = new Set(fundBalanceLines(r.funding).map((l) => l.fund))
      const extra = (r.tableFundBalance ?? []).filter((t) => !drawn.has(t.fund))
      if (extra.length) tableOnly.push(`${r.number} (${extra.map((t) => `${t.fund} ${usd(t.amount)}`).join(', ')})`)
    }
  }
  console.log(`Adopted-table check: ${corrected.length} adopted draw${corrected.length === 1 ? '' : 's'} counted at the adopted table over section G${corrected.length ? `: ${corrected.join('; ')}` : ''}.`)
  if (tableOnly.length) {
    console.log(`Adopted-table check: ${tableOnly.length} adopted table${tableOnly.length === 1 ? ' names' : 's name'} a 9999 account in a fund section G does not draw on, not counted: ${tableOnly.join('; ')}.`)
  }
} catch (error) {
  warn(`Adopted-table check could not run: ${error.message}`)
}

// ── Evidence links: a card's figures must appear on the page it opens ─────────
//
// The Financial Health cards and signals, and What Changed's tiles, each link to
// the page meant to substantiate them. When /what-changed/ moved to the 2027
// Tentative, links citing 2025 -> 2026 adopted figures went on opening it, and
// tiles pointed at pages that never print their figures. Nothing noticed. So
// every link on these pages whose text carries a dollar figure or a percentage
// must lead to a built page that prints each of those figures.
const EVIDENCE_PAGES = ['analytics', 'what-changed']
const BASE_PATH = '/Riverhead-NY-Budget-Web-App'
// React separates adjacent text with empty comments ("4.20<!-- -->%"), which
// render as nothing, so they are dropped rather than read as a space.
const htmlText = (html) => html
  .replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/\$\s+(?=\d)/g, '$').replace(/\s+/g, ' ')
const FIGURE = /\$\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?%/g
let evidenceLinks = 0
for (const page of EVIDENCE_PAGES) {
  const file = path('out', page, 'index.html')
  if (!existsSync(file)) { fail(`Evidence-link check: out/${page}/index.html is missing`); continue }
  for (const [, href, inner] of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const figures = Array.from(new Set(htmlText(inner).match(FIGURE) ?? []))
    if (!figures.length || /^https?:/.test(href)) continue
    let route = href.startsWith(BASE_PATH) ? href.slice(BASE_PATH.length) : href
    route = route.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')
    const target = path('out', route, 'index.html')
    if (!existsSync(target)) { fail(`Evidence-link check: /${page}/ links to ${href}, which is not a built page`); continue }
    const text = htmlText(readFileSync(target, 'utf8'))
    const missing = figures.filter((f) => !text.includes(f))
    evidenceLinks += 1
    if (missing.length) fail(`Evidence-link check: /${page}/ links "${htmlText(inner).trim().slice(0, 60)}" to ${href}, which does not show ${missing.join(', ')}`)
  }
}
if (evidenceLinks === 0) fail('Evidence-link check found no figure-bearing links on /analytics/ or /what-changed/; the card markup may have changed.')
else console.log(`Evidence links: ${evidenceLinks} figure-bearing links on /analytics/ and /what-changed/ open pages that show their figures.`)

if (process.exitCode) process.exit(process.exitCode)
console.log(`Build verification passed: routes, record floors, freshness, meeting timeline, evidence contracts, source authority audit, claim-level provenance coverage (${pagesWithClaimProvenance}/${provenancePages.length}), search shards, and payload guardrails are valid.`)
