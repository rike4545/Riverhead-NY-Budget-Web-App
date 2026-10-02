import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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

// What each resolution's own text states, beside the Town's answer.
if (existsSync(path('components/StatedAmounts.tsx'))) {
  const source = readFileSync(path('components/StatedAmounts.tsx'), 'utf8')
  for (const text of [
    'The resolution states:',
    "revenue: 'money in'",
    "security: 'developer security'",
    "context: 'background'",
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
    for (const r of data.resolutions ?? []) {
      for (const a of r.statedAmounts ?? []) {
        if (!figures(a.quote ?? '').some((f) => Math.abs(f - a.amount) < 0.005)) fail(`${slug} ${r.number}: quote for ${a.amount} does not carry the figure`)
      }
      if (r.statedCost != null) {
        stated += 1
        if (!(r.statedAmounts ?? []).some((a) => a.role === 'cost' && a.amount === r.statedCost)) fail(`${slug} ${r.number}: stated cost ${r.statedCost} is not one of the costs quoted`)
      }
    }
  }
  if (stated === 0) fail('No resolution carries a stated cost; the stated-amount read did not run')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Fiscal-impact verification passed: fiscal treatment, vote evidence, adopted-resolution verification, and what each resolution states remain distinct.')