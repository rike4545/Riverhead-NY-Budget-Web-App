// Checks the glossary (lib/glossary.ts), /glossary/ and /accounting-basics/:
// - every <Term id="..."> and every /glossary/#term-... link names an entry;
// - every entry has a term, a definition and one of the listed topics, and no
//   two entries share a term;
// - every "where it matters" link is a page the build exports;
// - the built glossary shows every term;
// - the built accounting page shows each fund-balance tier and the total from
//   the 2025 audit (lib/audits.ts), and every concept from lib/budget-concepts.ts.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = (m) => { console.error(`VOCABULARY VERIFY FAILED: ${m}`); process.exitCode = 1 }
const src = (p) => readFileSync(join(root, p), 'utf8')
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const text = (p) => norm(readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))

const g = src('lib/glossary.ts')
const cats = [...g.match(/export type GlossaryCategory =([^]*?)\n\n/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
const body = g.slice(g.indexOf('export const glossary:'), g.indexOf('export function lookup'))
const entries = [...body.matchAll(/^ {2}(?:'([a-z0-9-]+)'|([a-z0-9]+)): \{([^]*?)^ {2}\},?$/gm)].map((m) => {
  const b = m[3]
  return {
    id: m[1] ?? m[2],
    term: b.match(/term: '((?:[^'\\]|\\.)*)'/)?.[1],
    category: b.match(/category: '([^']+)'/)?.[1],
    plain: b.match(/plain: '((?:[^'\\]|\\.)*)'/)?.[1] ?? b.match(/plain: "((?:[^"\\]|\\.)*)"/)?.[1],
    href: b.match(/href: '([^']+)'/)?.[1],
  }
})
if (entries.length < 50) fail(`found only ${entries.length} glossary entries; the parser may have missed the format`)
const ids = new Set(entries.map((e) => e.id))
const terms = new Map()
for (const e of entries) {
  if (!e.term) fail(`${e.id} has no term`)
  if (!e.plain) fail(`${e.id} has no definition`)
  if (!cats.includes(e.category)) fail(`${e.id} has topic "${e.category}", which is not a listed topic`)
  const k = e.term?.toLowerCase()
  if (terms.has(k)) fail(`"${e.term}" is defined twice (${terms.get(k)} and ${e.id})`)
  terms.set(k, e.id)
  if (e.href) {
    const dir = e.href.replace(/^\/|\/$/g, '').split('#')[0]
    if (!existsSync(join(root, 'app', dir, 'page.tsx'))) fail(`${e.id} links to ${e.href}, which is not a page`)
  }
}

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : []
})
for (const f of [...walk(join(root, 'app')), ...walk(join(root, 'components'))]) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(/<Term\s+id="([^"]+)"/g)) if (!ids.has(m[1])) fail(`${f.slice(root.length + 1)} uses <Term id="${m[1]}">, which has no glossary entry`)
  for (const m of s.matchAll(/glossary\/#term-([a-z0-9-]+)/g)) if (!ids.has(m[1])) fail(`${f.slice(root.length + 1)} links to #term-${m[1]}, which has no glossary entry`)
  for (const m of s.matchAll(/\bg\('([a-z0-9-]+)',/g)) if (f.includes('accounting-basics') && !ids.has(m[1])) fail(`accounting-basics links the term ${m[1]}, which has no glossary entry`)
}

const gloss = join(root, 'out/glossary/index.html')
if (!existsSync(gloss)) fail('out/glossary/index.html was not built')
else {
  const html = text(gloss)
  const raw = readFileSync(gloss, 'utf8')
  for (const e of entries) {
    if (!html.includes(norm(e.term.replace(/\\'/g, "'")))) fail(`the glossary page does not show "${e.term}"`)
    if (!raw.includes(`id="term-${e.id}"`)) fail(`the glossary page has no anchor for ${e.id}`)
  }
}

const audits = src('lib/audits.ts')
const y2025 = audits.slice(audits.indexOf('  2025: {'))
const classes = y2025.match(/classes: \{([^}]+)\}/)[1]
const total = Number(y2025.match(/total: ([\d_]+)/)[1].replace(/_/g, ''))
const usd = (n) => `$${n.toLocaleString('en-US')}`
const acct = join(root, 'out/accounting-basics/index.html')
if (!existsSync(acct)) fail('out/accounting-basics/index.html was not built')
else {
  const html = text(acct)
  for (const [, name, v] of classes.matchAll(/(\w+): ([\d_]+)/g)) {
    if (!html.includes(`${name} ${usd(Number(v.replace(/_/g, '')))}`) && !html.includes(usd(Number(v.replace(/_/g, ''))))) fail(`the accounting page does not show the 2025 ${name} tier`)
  }
  if (!html.includes(usd(total))) fail(`the accounting page does not show the 2025 total of ${usd(total)}`)
  const sum = [...classes.matchAll(/: ([\d_]+)/g)].reduce((s, m) => s + Number(m[1].replace(/_/g, '')), 0)
  if (sum !== total) fail(`the 2025 tiers add to ${usd(sum)}, not the audit's total of ${usd(total)}`)
  for (const m of src('lib/budget-concepts.ts').matchAll(/^ {4}title: '((?:[^'\\]|\\.)*)'/gm)) {
    if (!html.includes(norm(m[1].replace(/\\'/g, "'")))) fail(`the accounting page does not show the concept "${m[1]}"`)
  }
}

if (!process.exitCode) console.log(`vocabulary: ${entries.length} glossary terms in ${cats.length} topics, every Term id and link resolves, and the accounting page matches the 2025 audit.`)
