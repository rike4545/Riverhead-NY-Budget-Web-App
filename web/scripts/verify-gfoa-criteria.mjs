// /gfoa/ scores this site against GFOA's revised Distinguished Budget
// Presentation Award criteria, typed into lib/gfoa.ts by hand. This checks them
// against the text of GFOA's own pages, kept in
// etl/data/policies/gfoa-budget-award.json:
//   - every category, in GFOA's order, with its name, its points and exactly its
//     primary questions;
//   - every phrase in GFOA_QUOTES, the dates and counts the page states, and the
//     links the page relies on (the award page still links the existing
//     criteria; the criteria page sits under "Program Changes (Effective
//     1/1/2027)");
//   - that the built /gfoa/ page shows all of it, that /programs/ quotes GFOA
//     from the same list, and that no built page brings back the old
//     "revised for 2026" wording.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  EXISTING_CRITERIA, GFOA_CHECKED, GFOA_QUOTES, GFOA_SOURCES, REVISED_CRITERIA, gfoaCategories, gfoaSummary, onGfoaScale,
} from '../lib/gfoa.ts'
import { SITE_PAGES } from '../lib/site-pages.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`GFOA VERIFY FAILED: ${message}`); process.exitCode = 1 }
// Web and PDF text break lines unpredictably and quote marks vary: compare
// without whitespace, with plain quote marks and hyphens.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, '')
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const day = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}` }

const file = JSON.parse(readFileSync(path('../etl/data/policies/gfoa-budget-award.json'), 'utf8'))
const excerpts = file.documents
if (file.retrieved !== GFOA_CHECKED) fail(`lib/gfoa.ts says the criteria were checked on ${GFOA_CHECKED}, but the saved pages were retrieved on ${file.retrieved}`)
const docText = (key) => {
  const doc = excerpts[key]
  if (!doc) { fail(`there is no excerpt “${key}”`); return '' }
  return Object.values(doc.pages).join('\n')
}

// ── The sources ──────────────────────────────────────────────────────────────
for (const [key, src] of Object.entries(GFOA_SOURCES)) {
  const doc = excerpts[src.excerpt]
  if (!doc) { fail(`${key}: there is no excerpt “${src.excerpt}”`); continue }
  if (doc.url !== src.url) fail(`${key}: lib/gfoa.ts links ${src.url}, but the excerpt is of ${doc.url}`)
  if (src.title !== doc.title && src.title !== doc.htmlTitle) fail(`${key}: lib/gfoa.ts calls it “${src.title}”, but GFOA titles it “${doc.title}”`)
}
const linksTo = (key, url) => (excerpts[GFOA_SOURCES[key].excerpt]?.links ?? []).some((l) => l.url === url)
if (!linksTo('award', GFOA_SOURCES.existing.url)) fail('the award page no longer links the existing criteria PDF the page cites')
if (!linksTo('award', GFOA_SOURCES.changes.url)) fail('the award page no longer links the Program Changes page')
for (const k of ['criteria', 'eligibility', 'scoring']) if (!linksTo('changes', GFOA_SOURCES[k].url)) fail(`the Program Changes page no longer links ${GFOA_SOURCES[k].url}`)
const crumbs = excerpts[GFOA_SOURCES.criteria.excerpt]?.breadcrumb ?? []
if (!crumbs.includes(GFOA_SOURCES.changes.title)) fail(`the criteria page no longer sits under “${GFOA_SOURCES.changes.title}”`)

// ── Every category, its points and its questions ─────────────────────────────
// The criteria page: "Categories: Content", then for each category its name,
// "<n> Points Possible", "Primary Questions", and one question per line.
const lines = docText(GFOA_SOURCES.criteria.excerpt).split('\n').map((l) => l.trim()).filter(Boolean)
const blocks = []
let kind = null
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === 'Categories: Content') { kind = 'content'; continue }
  if (lines[i] === 'Categories: Type of Material') { kind = 'material'; continue }
  const pts = lines[i + 1]?.match(/^(\d+) Points Possible$/)
  if (pts) {
    if (!kind) fail(`“${lines[i]}” comes before the criteria page's category headings`)
    blocks.push({ kind, name: lines[i], points: Number(pts[1]), questions: [] })
    i += 1
    continue
  }
  const block = blocks.at(-1)
  if (!block || /^Primary Questions:?$/.test(lines[i])) continue
  if (!lines[i].endsWith('?')) fail(`${block.name}: the criteria page now has “${lines[i]}” among its questions; read it before trusting the check`)
  block.questions.push(lines[i])
}
if (blocks.length !== gfoaCategories.length) fail(`the criteria page has ${blocks.length} categories; lib/gfoa.ts has ${gfoaCategories.length}`)
const same = (a, b) => a.length === b.length && a.every((x, i) => norm(x) === norm(b[i]))
let questions = 0
gfoaCategories.forEach((c, i) => {
  const b = blocks[i]
  if (!b) return
  if (c.name !== b.name) fail(`category ${i + 1} is “${b.name}” on GFOA's page, not “${c.name}”`)
  if (c.kind !== b.kind) fail(`${c.name} is a ${b.kind} category on GFOA's page, not ${c.kind}`)
  if (c.points !== b.points) fail(`${c.name} is worth ${b.points} points on GFOA's page, not ${c.points}`)
  if (!same(c.questions, b.questions)) fail(`${c.name}: GFOA asks ${JSON.stringify(b.questions)}; lib/gfoa.ts has ${JSON.stringify(c.questions)}`)
  questions += c.questions.length
  // A note that says GFOA repeats another category's questions must still be true.
  if (c.questionNote?.includes('same questions')) {
    const other = blocks.find((o) => o !== b && c.questionNote.includes(o.name))
    if (!other) fail(`${c.name}: its note names no other category`)
    else if (!same(b.questions, other.questions)) fail(`${c.name}: GFOA no longer lists the same questions as ${other.name}; drop the note`)
  }
})
const totals = { content: 150, material: 50 }
for (const [k, want] of Object.entries(totals)) {
  const got = blocks.filter((b) => b.kind === k).reduce((s, b) => s + b.points, 0)
  if (got !== want) fail(`GFOA's ${k} categories add to ${got} points, not ${want}`)
}
if (gfoaSummary.contentPossible !== totals.content || gfoaSummary.materialPossible !== totals.material) fail('lib/gfoa.ts totals differ from the 150 and 50 points GFOA gives')

// ── Every quote, and the dates and counts the page states ────────────────────
for (const [key, q] of Object.entries(GFOA_QUOTES)) {
  if (!norm(docText(GFOA_SOURCES[q.source].excerpt)).includes(norm(q.text))) fail(`GFOA_QUOTES.${key}: “${q.text}” is not on ${GFOA_SOURCES[q.source].url}`)
}
for (const iso of [REVISED_CRITERIA.optionalFrom, REVISED_CRITERIA.requiredFrom]) {
  if (!GFOA_QUOTES.eitherSet.text.includes(day(iso))) fail(`GFOA's dates for the revised criteria do not include ${day(iso)}`)
}
if (!GFOA_QUOTES.within90.text.includes(`${EXISTING_CRITERIA.windowDays} days`)) fail(`GFOA's existing window is not ${EXISTING_CRITERIA.windowDays} days`)
if (!GFOA_QUOTES.threshold.text.includes(`more than ${gfoaSummary.threshold}`)) fail(`GFOA's threshold is not more than ${gfoaSummary.threshold}`)
const existing = docText(GFOA_SOURCES.existing.excerpt)
const criteriaCount = (existing.match(/#[A-Z]\d+\.\s*\|/g) ?? []).length
const mandatoryCount = (existing.match(/Mandatory:/g) ?? []).length
if (criteriaCount !== EXISTING_CRITERIA.criteria) fail(`the existing criteria PDF has ${criteriaCount} criteria, not ${EXISTING_CRITERIA.criteria}`)
if (mandatoryCount !== EXISTING_CRITERIA.mandatory) fail(`the existing criteria PDF marks ${mandatoryCount} criteria “Mandatory”, not ${EXISTING_CRITERIA.mandatory}`)

// ── The built pages ──────────────────────────────────────────────────────────
const decode = (s) => s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const visible = (raw) => decode(raw.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ')
const has = (text, phrase) => norm(text).includes(norm(phrase))
const read = (route) => {
  const f = path(`out${route}index.html`)
  if (!existsSync(f)) { fail(`${route} was not exported`); return '' }
  return readFileSync(f, 'utf8')
}

const gfoaRaw = read('/gfoa/')
const gfoaText = visible(gfoaRaw)
const rows = [...gfoaRaw.matchAll(/<article data-gfoa-category="([^"]*)" data-gfoa-points="(\d+)"[\s\S]*?<\/article>/g)]
if (rows.length !== gfoaCategories.length) fail(`/gfoa/ shows ${rows.length} categories, not ${gfoaCategories.length}`)
gfoaCategories.forEach((c, i) => {
  const row = rows[i]
  if (!row) return
  if (decode(row[1]) !== c.name || Number(row[2]) !== c.points) fail(`/gfoa/ row ${i + 1} is “${decode(row[1])}” (${row[2]} points), not “${c.name}” (${c.points})`)
  const asked = visible(row[0].match(/<p data-gfoa-questions[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '')
  for (const q of c.questions) if (!has(asked, q)) fail(`/gfoa/ ${c.name} does not show GFOA's question “${q}”`)
  if (!has(visible(row[0]), `${c.selfScore} / ${c.points}`)) fail(`/gfoa/ ${c.name} does not show its score`)
})

const timingAt = gfoaRaw.indexOf('<section data-gfoa-criteria-timing')
const timing = timingAt === -1 ? (fail('/gfoa/ has no section on which criteria apply when'), '') : visible(gfoaRaw.slice(timingAt, gfoaRaw.indexOf('</section>', timingAt)))
for (const key of ['eitherSet', 'existingHeading', 'noMandatory', 'notEveryCategory', 'within90']) if (!has(timing, GFOA_QUOTES[key].text)) fail(`/gfoa/ does not say when the criteria apply: “${GFOA_QUOTES[key].text.slice(0, 60)}…” is missing`)
if (!has(timing, `take effect on ${day(REVISED_CRITERIA.optionalFrom)}`)) fail(`/gfoa/ does not give the date the revised criteria take effect, ${day(REVISED_CRITERIA.optionalFrom)}`)
if (!has(timing, `mark ${EXISTING_CRITERIA.mandatory} of their ${EXISTING_CRITERIA.criteria} criteria`)) fail('/gfoa/ does not give the existing criteria\'s mandatory count')
// The 2026 sentence holds only if that budget's window closed before the revised criteria took effect.
const adopted = timing.match(/adopted the 2026 budget on ([A-Z][a-z]+ \d{1,2}, \d{4})/)
if (!adopted) fail('/gfoa/ does not say when the 2026 budget was adopted')
else {
  const [, month, d, y] = adopted[1].match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/)
  const due = Date.UTC(Number(y), MONTHS.indexOf(month), Number(d)) + EXISTING_CRITERIA.windowDays * 86_400_000
  if (!(due < Date.parse(`${REVISED_CRITERIA.optionalFrom}T00:00:00Z`))) fail(`a 2026 budget adopted ${adopted[1]} could still be submitted after ${day(REVISED_CRITERIA.optionalFrom)}; /gfoa/'s sentence about it is wrong`)
}

for (const key of ['whoMayApply', 'scope', 'categoryScore', 'scaled', 'contentQuestions', 'materialFocus']) if (!has(gfoaText, GFOA_QUOTES[key].text)) fail(`/gfoa/ does not show GFOA's “${GFOA_QUOTES[key].text.slice(0, 60)}”`)
const offScale = gfoaCategories.filter((c) => !onGfoaScale(c)).length
if (!has(gfoaText, `${offScale} of the ${gfoaCategories.length} could not come from a whole-number score out of 5`)) fail(`/gfoa/ does not say that ${offScale} of its scores fall off GFOA's scale`)
if (!has(gfoaText, `more than ${gfoaSummary.threshold}`)) fail('/gfoa/ does not say the award needs more than 100 points')
for (const [key, src] of Object.entries(GFOA_SOURCES)) if (!gfoaRaw.includes(`href="${src.url.replace(/&/g, '&amp;')}"`)) fail(`/gfoa/ does not link ${key}, ${src.url}`)

if (!has(visible(read('/programs/')), `“${GFOA_QUOTES.programGoals.text}”`)) fail(`/programs/ does not quote GFOA's “${GFOA_QUOTES.programGoals.text}”`)

const gfoaPage = SITE_PAGES.find((p) => p.path === '/gfoa/')
if (!gfoaPage?.summary.includes(day(REVISED_CRITERIA.optionalFrom))) fail(`lib/site-pages.ts does not give /gfoa/'s criteria their date, ${day(REVISED_CRITERIA.optionalFrom)}`)

// The wording this replaced, and the category names GFOA does not use.
const STALE = [
  /revised for (the )?2026/i, /2026 program year/i, /What changed in 2026/i, /The 2026 revision/i,
  /not a rubric for partial credit/i, /Budget Website or Dashboard/, /Budget-In-Brief/,
]
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : []
})
for (const f of walk(path('out'))) {
  const text = visible(readFileSync(f, 'utf8'))
  for (const re of STALE) {
    const m = text.match(re)
    if (m) fail(`${f.slice(path('out').length)} still says “…${text.slice(Math.max(0, m.index - 60), m.index + 60)}…”`)
  }
}

if (!process.exitCode) console.log(`GFOA criteria verification passed: ${gfoaCategories.length} categories, ${questions} primary questions and their points match GFOA's revised criteria page; ${Object.keys(GFOA_QUOTES).length} quotes in ${Object.keys(excerpts).length} saved GFOA pages; the existing criteria's ${EXISTING_CRITERIA.mandatory} of ${EXISTING_CRITERIA.criteria} mandatory; /gfoa/ shows them with the ${day(REVISED_CRITERIA.optionalFrom)} start, and ${offScale} self-scores are flagged as off GFOA's scale.`)
