// The Supplement data behind /budget-accuracy/, /revenue/, /spending-reduction-
// 2027/ and the Tentative page's findings is read from the PDFs by
// etl/parse_supplement_history.py, with PyMuPDF. parse_all_pdfs.py reads the
// same PDFs a second way, with pypdf, into financial-reports/documents. This
// checks the two readings against each other, line by line, for every
// Supplement whose text is complete; checks that the newest Supplement adds up
// to the Tentative; checks the two budgets typed into spending-reduction-2027.ts;
// re-derives the multi-year findings; and checks the pages show what they are
// built from. A misread figure fails the build instead of reaching a page.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`SUPPLEMENT VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const same = (a, b) => Math.abs((a ?? 0) - (b ?? 0)) < 0.005

const DATA = 'public/data/budget-supplement'
const lineHistory = read(`${DATA}/line-history.json`)
const revenue = read(`${DATA}/revenue-history.json`)
const current = read(`${DATA}/current-lines.json`)
const history = read(`${DATA}/history.json`)
const reductions = read(`${DATA}/current-reductions.json`)
const requests = read(`${DATA}/requests-by-year.json`)
const index = read('public/data/financial-reports/index.json').documents

const LATEST = current.supplementYear
const expById = new Map(lineHistory.accounts.map((a) => [a.account, a]))
const revById = new Map(revenue.accounts.map((a) => [a.account, a]))

// ── The newest Supplement adds up to the Tentative ────────────────────────────
if (!current.reconciliation?.complete) fail(`The ${LATEST} Supplement does not add up to the Tentative: ${JSON.stringify(current.reconciliation)}`)
if (lineHistory.budgetYear !== LATEST || revenue.budgetYear !== LATEST || history.budgetYear !== LATEST) {
  fail('The Supplement files disagree about the newest year')
}

// ── Two readings of the same PDFs ─────────────────────────────────────────────
// The line rules are parse_budget_requests.py's: five trailing figures, the
// account first, subtotal rows skipped.
// A figure in parentheses is negative; the PDFs print a few that way.
const NUM = /\(?-?[\d,]+\.\d{2}\)?/g
const figure = (n) => (n.startsWith('(') && n.endsWith(')') ? -1 : 1) * Number(n.replace(/[(),]/g, ''))
const SPLIT_DECIMAL = /(\.\d)\s(\d)(?![\d,])/g
const normalise = (s) => s.replace(/ /g, ' ').replace(/[‐-—]/g, '-')
const EXP = /^[A-Z]{1,3}\d{1,2}-\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{4,5}$/
const REV = /^[A-Z]{1,3}\d{1,2}-\d{4}-[A-Z0-9]{3}-\d{5}-[A-Z0-9]$/

function docRows(doc) {
  const rows = new Map()
  for (const page of doc.pages ?? []) {
    for (let line of normalise(page.text ?? '').split('\n')) {
      // pypdf sets a minus sign apart from its figure ("- 1,288.28")
      line = line.replace(SPLIT_DECIMAL, '$1$2').replace(/(^|\s)-\s+(?=\d)/g, '$1-')
      const nums = line.match(NUM)
      if (!nums || nums.length < 5) continue
      const head = line.slice(0, line.search(NUM)).trim()
      if (head.includes('Total')) continue
      const account = head.split(' ')[0]
      if (!EXP.test(account) && !REV.test(account)) continue
      rows.set(account, nums.slice(-5).map(figure))
    }
  }
  return rows
}

let compared = 0
const mismatches = []
for (const year of requests.completeYears ?? []) {
  const entries = index.filter((d) => d.category === 'budget_supplement' && d.year === year)
  const entry = entries.find((d) => d.slug.endsWith('-pdf')) ?? entries[0]
  const file = entry && path('public/data/financial-reports', entry.json ?? `documents/${entry.slug}.json`)
  if (!file || !existsSync(file)) { fail(`No parsed text for the ${year} Supplement`); continue }
  for (const [account, [actual, adopted, ytd, request, tentative]] of docRows(JSON.parse(readFileSync(file, 'utf8')))) {
    const rec = EXP.test(account) ? expById.get(account) : revById.get(account)
    if (!rec) {
      // The parse keeps a line only when a column it stores is non-zero; for
      // older Supplements that is the actual, adopted and mid-year columns.
      const stored = year === LATEST ? [actual, adopted, ytd, request, tentative] : [actual, adopted, ytd]
      if (stored.some((v) => v !== 0)) mismatches.push(`${year} ${account}: in the PDF text, missing from the parse`)
      continue
    }
    const checks = [
      ['actual', year - 2, actual, rec.actual[String(year - 2)]],
      ['adopted', year - 1, adopted, rec.adopted[String(year - 1)]],
      ['mid-year', year - 1, ytd, rec.ytd[String(year - 1)]],
    ]
    if (year === LATEST) checks.push(['request', year, request, rec.request], ['tentative', year, tentative, rec.tentative])
    for (const [what, y, fromText, fromParse] of checks) {
      compared++
      if (!same(fromText, fromParse)) mismatches.push(`${account} ${what} ${y}: PDF text ${fromText}, parse ${fromParse}`)
    }
  }
}
if (compared < 10000) fail(`Only ${compared} figures were compared; the Supplement text looks incomplete`)
if (mismatches.length) fail(`${mismatches.length} figures differ between the two readings:\n  ${mismatches.slice(0, 12).join('\n  ')}`)

// ── The two budgets typed into spending-reduction-2027.ts ─────────────────────
const reductionSource = readFileSync(path('lib/spending-reduction-2027.ts'), 'utf8')
const police = expById.get('A01-3-3120-111-UNI-00000')
for (const year of [2024, 2025]) {
  const m = reductionSource.match(new RegExp(`policeUniformOTBudget${year} = ([\\d_.]+)`))
  const typed = m ? Number(m[1].replace(/_/g, '')) : null
  if (typed === null || !same(typed, police?.adopted[String(year)])) fail(`spending-reduction-2027.ts has ${typed} for the ${year} police overtime budget; the Supplement has ${police?.adopted[String(year)]}`)
}

// ── The multi-year findings, re-derived ───────────────────────────────────────
const last3 = history.actualYears.slice(-3).map(String)
for (const r of history.chronicUnderBudget) {
  const rec = expById.get(r.account)
  for (const y of last3) {
    if (!rec || !(rec.actual[y] > rec.adopted[y])) fail(`${r.account} is listed as over budget in ${y}, but the Supplement says otherwise`)
  }
  if (!rec || !(rec.tentative < r.averageActual)) fail(`${r.account} is listed as budgeted low, but the Tentative covers its average`)
}
for (const r of history.unused) {
  const rec = expById.get(r.account)
  if (!rec || last3.some((y) => rec.actual[y] !== 0) || rec.ytd[String(LATEST - 1)] !== 0 || !(rec.tentative > 0)) fail(`${r.account} is listed as unused, but the Supplement shows spending or no budget`)
}
for (const r of revenue.neverCollected) {
  const rec = revById.get(r.account)
  if (!rec || last3.some((y) => (rec.actual[y] ?? 0) > 0 || (rec.ytd[y] ?? 0) > 0)) fail(`${r.account} is listed as never collected, but the Supplement shows collections`)
}

// ── The pages show what they are built from ──────────────────────────────────
const page = (route) => {
  const file = path('out', route, 'index.html')
  if (!existsSync(file)) { fail(`${route} was not built`); return '' }
  return readFileSync(file, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
}
const has = (route, text, what) => { if (!page(route).includes(text)) fail(`${route} does not show ${what} (${text})`) }

const debt = expById.get('A01-9-9901-900-V01-00000')
has('tentative-2027', usd(debt.adopted[String(LATEST - 1)] - debt.tentative), 'the drop in General Fund debt payments')
has('tentative-2027', 'What the line-by-line Supplement shows', 'the Supplement findings')
has('budget-accuracy', usd(police.adopted['2024']), 'the corrected 2024 police overtime budget')
if (page('budget-accuracy').includes('Finance Department - Management Buy-Back')) fail('/budget-accuracy/ still flags the Finance Department buy-back, which was within its 2024 budget')
has('budget-accuracy', `${history.unused.length} have been budgeted year after year`, 'the count of unused lines')
has('spending-reduction-2027', usd(reductions.total), 'the run-rate test on the newest Tentative')
const gfOutside = revenue.accounts.filter((a) => a.fund === 'A01' && !['property-tax', 'fund-balance', 'interfund-revenue', 'other-sources'].includes(a.category))
const lastYear = history.actualYears[history.actualYears.length - 1]
has('revenue', usd(gfOutside.reduce((s, a) => s + (a.actual[String(lastYear)] ?? 0), 0)), `the General Fund's outside revenue for ${lastYear}`)
for (const r of revenue.neverCollected) has('revenue', r.account, `the never-collected line ${r.account}`)

if (!process.exitCode) {
  console.log(`supplement: ${compared.toLocaleString('en-US')} figures agree across two readings of ${(requests.completeYears ?? []).length} Supplements; ${LATEST} ties to the Tentative; findings and pages check out`)
}
