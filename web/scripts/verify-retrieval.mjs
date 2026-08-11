// Retrieval eval: run with `npm run verify:retrieval`.
//
// The Ask AI answer can only be as good as the records retrieved for it — the
// model never sees the other ~16,700 entries. Bad retrieval is the failure mode
// that actually bites, and it is the one that regresses silently when the ranker
// in lib/riverheadSearchAI.ts changes or the weekly ETL reshapes the index.
//
// No API key and no model call: retrieveForQuestion is pure, so this is free,
// deterministic, and safe to gate a deploy on.
//
// Assertions describe the *kind* of record that must rank, never an exact name
// or dollar amount, so a weekly data refresh does not break the build.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { retrieveForQuestion } from '../lib/riverheadSearchAI.ts'

const indexPath = join(process.cwd(), 'public/data/search/unified.json')
const entries = JSON.parse(readFileSync(indexPath, 'utf8')).entries

if (!Array.isArray(entries) || entries.length === 0) {
  console.error(`Search index at ${indexPath} is empty or malformed.`)
  process.exit(1)
}

const K = 12 // roughly half of AI_RECORD_COUNT — what should rank near the top

// What a resident types, and the kind of record that has to come back for the
// model to have any chance of answering it.
const cases = [
  {
    q: 'How much does the Town spend on police?',
    want: 'a Police budget line',
    ok: (e) => e.t === 'line-item' && /police/i.test(`${e.n} ${e.x}`),
  },
  {
    q: 'What is the 2026 General Fund appropriation?',
    want: 'the General Fund record',
    ok: (e) => e.t === 'fund' && /general fund/i.test(e.n),
  },
  {
    q: 'What is the authorized salary for a Police Captain in 2026?',
    want: 'a 2026 authorized-salary record for a Captain',
    ok: (e) => e.t === 'salary' && /captain/i.test(e.x),
  },
  {
    q: 'What is the Community Preservation Fund?',
    want: 'the Community Preservation Fund record',
    ok: (e) => e.t === 'fund' && /community preservation/i.test(e.n),
  },
  {
    q: 'What is in the sewer district budget?',
    want: 'a sewer record',
    ok: (e) => /sewer/i.test(`${e.n} ${e.x}`),
  },
  {
    q: 'What does the Highway department cost?',
    want: 'a Highway record',
    ok: (e) => /highway/i.test(`${e.n} ${e.x}`),
  },
]

// Regression guard. Ask-mode questions essentially always end in "?", and
// scoreEntries matches terms literally, so an unstripped "petrocelli?" matches
// nothing — silently dropping the most important word in the question. Retrieval
// must not depend on trailing punctuation.
const parityCases = [
  'Which Town Board votes involved Petrocelli?',
  'How much does the Town spend on police?',
  'What is the 2026 General Fund appropriation?',
]

const failures = []

for (const c of cases) {
  const got = retrieveForQuestion(entries, c.q, K)

  if (got.length === 0) {
    failures.push(`"${c.q}"\n    retrieved nothing`)
  } else if (!got.some(c.ok)) {
    const preview = got.slice(0, 5).map((e) => `${e.t}: ${e.n}`).join('\n      ')
    failures.push(`"${c.q}"\n    expected ${c.want} in the top ${K}, got:\n      ${preview}`)
  } else if (got.every((e) => e.t === 'page')) {
    // Structured records are what the model can cite precisely. A question that
    // retrieves only raw PDF text has effectively failed even when a page
    // happens to contain the answer.
    failures.push(`"${c.q}"\n    retrieved only document pages — no structured record to cite`)
  }
}

for (const q of parityCases) {
  const withMark = retrieveForQuestion(entries, q, K).map((e) => e.n).join('|')
  const without = retrieveForQuestion(entries, q.replace(/[?.!]+$/, ''), K).map((e) => e.n).join('|')
  if (withMark !== without) {
    failures.push(`"${q}"\n    trailing punctuation changed the retrieved records`)
  }
  if (withMark === '') {
    failures.push(`"${q}"\n    retrieved nothing`)
  }
}

const total = cases.length + parityCases.length

if (failures.length) {
  console.error(`Retrieval eval failed (${failures.length}/${total} cases):\n`)
  for (const f of failures) console.error(`  - ${f}\n`)
  process.exit(1)
}

console.log(`Retrieval eval passed (${total} cases, ${entries.length} indexed entries).`)
