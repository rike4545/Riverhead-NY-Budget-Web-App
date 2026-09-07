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

if (process.exitCode) process.exit(process.exitCode)
console.log('Fiscal-impact verification passed: fiscal treatment, vote evidence, and adopted-resolution verification remain distinct.')