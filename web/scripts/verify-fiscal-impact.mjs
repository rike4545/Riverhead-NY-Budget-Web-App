import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { correctedAmount, drawsByFund, tableCorrects } from '../lib/fund-balance-lines.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

for (const file of [
  'components/FiscalImpactMeetings.tsx',
  'components/FiscalImpactTable.tsx',
  'app/fiscal-impact/page.tsx',
  'out/fiscal-impact/index.html',
]) if (!existsSync(path(file))) fail(`Fiscal-impact evidence contract is missing required file: ${file}`)

if (existsSync(path('components/FiscalImpactMeetings.tsx'))) {
  const source = readFileSync(path('components/FiscalImpactMeetings.tsx'), 'utf8')
  for (const text of [
    'VOTE_GRACE_DAYS = 7',
    'Official minutes published · vote detail omitted',
    'Meeting completed · vote record not yet available',
    'Fiscal statement available · vote record not indexed',
    'data-fiscal-record-status',
    'meetingUrl(m.slug)',
    'by itself it does not prove that the resolution was adopted',
    'Stated in the resolution, answered “No”',
    "a.role === 'cost' && a.amount === sc?.amount",
  ]) if (!source.includes(text)) fail(`Fiscal meeting evidence state regressed: missing ${text}`)
}

if (existsSync(path('components/FiscalImpactTable.tsx'))) {
  const source = readFileSync(path('components/FiscalImpactTable.tsx'), 'utf8')
  for (const text of [
    "if (r.vote.tag === 'tabled') return 'tabled'",
    "if (r.vote.adopted === false)",
    "if (r.vote.adopted === true)",
    "if (state === 'omitted') return 'vote detail omitted'",
    'Adopted resolution verified',
    'officialDocumentVerified',
    'Official document ↗',
  ]) if (!source.includes(text)) fail(`Fiscal resolution evidence state regressed: missing ${text}`)
  if (source.includes("r.vote.tag === 'tabled' ? 'tabled' : `adopted")) fail('Fiscal table reverted to labeling every non-tabled vote as adopted')
}

if (existsSync(path('app/fiscal-impact/page.tsx'))) {
  const source = readFileSync(path('app/fiscal-impact/page.tsx'), 'utf8')
  for (const text of [
    'What it does not prove',
    'a fiscal-impact form is not proof that the resolution was finally adopted',
    'full meeting decision record',
  ]) if (!source.includes(text)) fail(`Fiscal-impact page framing regressed: missing ${text}`)
}

if (existsSync(path('out/fiscal-impact/index.html'))) {
  const html = readFileSync(path('out/fiscal-impact/index.html'), 'utf8')
  for (const text of [
    'Fiscal impact, corrected',
    'What it does not prove',
    'fiscal-impact form is not proof',
  ]) if (!html.includes(text)) fail(`Fiscal-impact export framing regressed: missing ${text}`)
}

// The accounts panel's line-item extract carries no 9999 line for any fund, so
// whether a fund planned to use fund balance must come from its adopted budget
// summary: the General Fund planned $1,250,000 (lib/all-funds.ts).
if (existsSync(path('components/StatementAccounts.tsx'))) {
  const source = readFileSync(path('components/StatementAccounts.tsx'), 'utf8')
  if (!source.includes('match.plannedFundBalance')) fail('Statement accounts no longer check what the adopted budget planned before saying a fund appropriated no fund balance')
}

// What each resolution's own text states, beside the Town's answer.
if (existsSync(path('components/StatedAmounts.tsx'))) {
  const source = readFileSync(path('components/StatedAmounts.tsx'), 'utf8')
  for (const text of [
    'The resolution states:',
    "revenue: 'money in'",
    "security: 'developer security'",
    "context: 'background'",
    "program: 'grant program total'",
    '<q>{a.quote}</q>',
  ]) if (!source.includes(text)) fail(`Stated-amount labels regressed: missing ${text}`)
} else fail('Fiscal-impact evidence contract is missing required file: components/StatedAmounts.tsx')

if (existsSync(path('components/FiscalImpactTable.tsx'))) {
  const source = readFileSync(path('components/FiscalImpactTable.tsx'), 'utf8')
  for (const text of [
    '<StatedAmounts amounts={r.statedAmounts} />',
    "if (view === 'stated' && !r.statedCost) return false",
    'but the resolution states a {usd(r.statedCost)} cost',
    'stated in resolution',
    'but the resolution’s table moves {usd(r.statementBelowTable.table)}',
    'drawsByFund(r.funding, r.tableFundBalance).filter(tableCorrects)',
    'as adopted; the statement says',
    'voteLink(meetingRecord.slug, r.number)',
  ]) if (!source.includes(text)) fail(`Fiscal table no longer shows what the resolution states: missing ${text}`)
}

if (existsSync(path('app/fiscal-impact/page.tsx'))) {
  const source = readFileSync(path('app/fiscal-impact/page.tsx'), 'utf8')
  for (const text of [
    "label: 'What the resolution states'",
    'Insurance an applicant must carry is left out',
    'Only a figure that reads as the Town paying out counts as a stated cost',
  ]) if (!source.includes(text)) fail(`Fiscal-impact page no longer explains stated amounts: missing ${text}`)
}

if (existsSync(path('out/fiscal-impact/index.html'))) {
  const html = readFileSync(path('out/fiscal-impact/index.html'), 'utf8')
  if (!html.includes('What the resolution states')) fail('Fiscal-impact export no longer explains stated amounts')
}

// The data behind it: one statement per printed resolution number, quotes
// that carry their figure, and a stated cost that is one of the costs quoted.
const MONEY = /\$\s*(\d[\d,]*(?:\.\d+)?)(?![\d,])\s*([KM]\b|million\b|thousand\b)?/gi
const SCALE = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6 }
const figures = (quote) => [...quote.matchAll(MONEY)].map(([, n, s]) => Number(n.replace(/,/g, '')) * (s ? SCALE[s.toLowerCase()] : 1))
const meetingsDir = path('public/data/meetings')
const fiscalIndexPath = path('public/data/meetings/fiscal-index.json')
if (existsSync(fiscalIndexPath)) {
  const index = JSON.parse(readFileSync(fiscalIndexPath, 'utf8'))
  let stated = 0
  let corrected = 0
  for (const entry of index.meetings ?? []) {
    const slug = typeof entry === 'string' ? entry : entry.slug
    const file = join(meetingsDir, `${slug}-fiscal.json`)
    if (!existsSync(file)) { fail(`fiscal-index.json lists ${slug}, which has no fiscal file`); continue }
    const raw = readFileSync(file, 'utf8')
    if (raw.includes('=== PAGE')) fail(`${slug}: page markers leaked into the fiscal data`)
    const data = JSON.parse(raw)
    const numbers = (data.resolutions ?? []).filter((r) => r.numberSource === 'printed').map((r) => r.number)
    const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i)
    if (dupes.length) fail(`${slug}: printed resolution numbers repeat: ${[...new Set(dupes)].join(', ')}`)
    // The summary drives the meeting's stat tiles and callouts, so it must
    // count this meeting's own resolutions -- a hand-curated meeting included.
    const rs = data.resolutions ?? []
    const counted = {
      statedCostResolutions: rs.filter((r) => r.statedCost).length,
      statementBelowTable: rs.filter((r) => r.statementBelowTable).length,
      withAccounts: rs.filter((r) => (r.funding?.accounts ?? []).length > 0).length,
    }
    for (const [key, n] of Object.entries(counted)) {
      if (data.summary?.[key] !== n) fail(`${slug}: summary.${key} is ${data.summary?.[key]}, but ${n} of its resolutions qualify`)
    }
    const lu = data.summary?.largestUnderstatedMarkedNo
    if (lu != null && !(Array.isArray(lu) && lu.length === 3)) fail(`${slug}: summary.largestUnderstatedMarkedNo is not [amount, number, title]`)
    for (const r of rs) {
      for (const a of r.statedAmounts ?? []) {
        if (!figures(a.quote ?? '').some((f) => Math.abs(f - a.amount) < 0.005)) fail(`${slug} ${r.number}: quote for ${a.amount} does not carry the figure`)
      }
      if (r.statedCost != null) {
        stated += 1
        if (!(r.statedAmounts ?? []).some((a) => a.role === 'cost' && a.amount === r.statedCost)) fail(`${slug} ${r.number}: stated cost ${r.statedCost} is not one of the costs quoted`)
      }
      // The adopted table's 9999 rows: each quotes its own account and figure,
      // and where one corrects section G the amount shown is the table's.
      for (const t of r.tableFundBalance ?? []) {
        if (!t.row?.startsWith(t.code) || !figures(t.row).some((f) => Math.abs(f - t.amount) < 0.005)) {
          fail(`${slug} ${r.number}: table row "${t.row}" does not carry ${t.code} and its figure ${t.amount}`)
        }
      }
      const corrections = drawsByFund(r.funding, r.tableFundBalance).filter(tableCorrects)
      if (corrections.length) {
        // The parser's corrected_amount and lib/fund-balance-lines.ts's
        // correctedAmount must agree: a priced 9999 line moves section G's
        // figure by the difference, a blank one is replaced, not added.
        const want = correctedAmount(r.funding?.amount, corrections)
        if (Math.abs((r.amount ?? 0) - (want ?? 0)) > 0.005) fail(`${slug} ${r.number}: amount ${r.amount} is not what the adopted table makes of section G's ${r.funding?.amount} (${want})`)
        corrected += 1
      }
    }
  }
  if (stated === 0) fail('No resolution carries a stated cost; the stated-amount read did not run')
  if (corrected === 0) fail('No draw is counted at its adopted table; 2026-765 should be ($280,000 adopted, $150,000 in section G)')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Fiscal-impact verification passed: fiscal treatment, vote evidence, adopted-resolution verification, and what each resolution states remain distinct.')