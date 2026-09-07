import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

const required = [
  'components/MeetingRecordExplorer.tsx',
  'out/meetings/index.html',
  'out/data/meetings/fiscal-index.json',
]
for (const file of required) if (!existsSync(path(file))) fail(`Meeting record is missing required file: ${file}`)

if (existsSync(path('out/meetings/index.html'))) {
  const html = readFileSync(path('out/meetings/index.html'), 'utf8')
  for (const text of [
    'Town Board Minutes &amp; Votes',
    'The decision record',
    'What happened, who voted how, and what did it cost?',
    'Minutes should answer a resident',
    'Need the full fiscal-impact audit?',
  ]) if (!html.includes(text)) fail(`Meeting decision-record framing regressed: missing ${text}`)
}

if (existsSync(path('components/MeetingRecordExplorer.tsx'))) {
  const source = readFileSync(path('components/MeetingRecordExplorer.tsx'), 'utf8')
  for (const text of [
    'Official vote record available',
    'Fiscal impact companion',
    'Has fiscal statement',
    'Town filing:',
    'dollar amounts are shown only where they can be tied unambiguously',
    'meetings[0]?.slug',
  ]) if (!source.includes(text)) fail(`Meeting explorer contract regressed: missing ${text}`)
  if (!source.includes('fiscal-index.json')) fail('Meeting explorer no longer uses the fiscal-impact meeting index')
  if (!source.includes('${slug}-fiscal.json')) fail('Meeting explorer no longer loads the selected meeting fiscal companion')
}

if (existsSync(path('out/data/meetings/fiscal-index.json'))) {
  const fiscal = JSON.parse(readFileSync(path('out/data/meetings/fiscal-index.json'), 'utf8'))
  if (!Array.isArray(fiscal.meetings) || fiscal.meetings.length < 10) fail(`Fiscal-impact meeting coverage collapsed: ${fiscal.meetings?.length ?? 0} meetings`)
  if (!fiscal.meetings.includes('2026-07-07')) fail('Hand-curated July 7 fiscal-impact record is missing from the fiscal index')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Meeting record verification passed: decision-first UX, official-record status, fiscal-impact integration, and fiscal coverage are intact.')
