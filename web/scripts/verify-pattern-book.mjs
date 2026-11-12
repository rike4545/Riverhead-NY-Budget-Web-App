// /pattern-book/ (lib/pattern-book.ts).
// - every quote from the book is in the kept excerpt of the adopted PDF;
// - the resolutions the page cites are in the minutes or meeting data with the result it gives;
// - the 2024 plan's quote matches the Comprehensive Plan tracker's;
// - the built page links every source and labels its reading as the site's.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BOOK, NEWS, QUOTES, TIMELINE } from '../lib/pattern-book.ts'

const root = process.cwd()
const fail = (m) => { console.error(`PATTERN BOOK VERIFY FAILED: ${m}`); process.exitCode = 1 }
const squash = (s) => s.replace(/-[ \t]*\n\s*/g, '').replace(/\s+/g, ' ').replace(/[’']/g, "'")
const excerpt = squash(readFileSync(join(root, '../etl/data/pattern-book/downtown-pattern-book-2021-excerpt.txt'), 'utf8'))
for (const [k, q] of Object.entries(QUOTES)) if (!excerpt.includes(squash(q.text))) fail(`quote ${k} is not in the kept excerpt`)

const plan = JSON.parse(readFileSync(join(root, 'public/data/comprehensive-plan.json'), 'utf8'))
const rec = plan.items.find((i) => i.id === 'pattern-book')
const planEvent = TIMELINE.find((e) => e.what.includes('Resolution 2024-760'))
if (!rec || !planEvent?.what.includes(rec.quote)) fail('the 2024 plan quote differs from the Comprehensive Plan tracker')
if (plan.plan.adopted.resolution !== '2024-760' || !/unanimously/i.test(plan.plan.adopted.vote)) fail('the plan’s adoption is not Resolution 2024-760, unanimous')

const minutes = (d) => readFileSync(join(root, `../etl/data/meetings/${d}-minutes.txt`), 'utf8')
const m0317 = minutes('2026-03-17')
if (!/2026-257 Zenith Building Addition[\s\S]{0,300}RESULT: ADOPTED \[4 - 0\][\s\S]{0,200}ABSTAIN Jerry Halpin/.test(m0317)) fail('2026-257 is not a 4-0 vote with Halpin abstaining in the March 17 minutes')
if (!/2026-746 Grants Special Permit[\s\S]{0,300}PECONIC RIVER HOTEL[\s\S]{0,200}RESULT: ADOPTED \[UNANIMOUS\]/.test(minutes('2026-08-04'))) fail('2026-746 is not the unanimous hotel approval in the August 4 minutes')
if (!/Project designs and implementation shall follow the Downtown Riverhead Pattern Book/.test(minutes('2025-03-18'))) fail('the 2025-263 mitigation standard is not in the March 18, 2025 minutes')

const out = join(root, 'out/pattern-book/index.html')
if (!existsSync(out)) fail('out/pattern-book/index.html was not built')
else {
  const html = readFileSync(out, 'utf8').replace(/<!-- -->/g, '')
  for (const u of [BOOK.url, ...Object.values(NEWS).map((n) => n.url)]) if (!html.includes(u)) fail(`the page does not link ${u}`)
  for (const s of ['this site’s reading of the record', 'machine transcript', 'Pro-Housing']) if (!html.includes(s)) fail(`the page does not say "${s}"`)
  if (!process.exitCode) console.log(`Pattern Book: ${Object.keys(QUOTES).length} quotes match the adopted book; 4 Board actions match the minutes and plan data; ${Object.keys(NEWS).length + 1} sources linked.`)
}
