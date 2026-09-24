// Search regression gate. Runs the ranker the search page uses against the
// index this build ships, and checks the searches that used to fail: topics
// that found nothing ("reserves", "buyout"), a plural that missed its
// singular, a misspelling, a hyphenated name, a meeting date, and a word that
// matched the start of a surname. Also checks that every page in the site menu
// can be found as a page, so a new page cannot be left out of search.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { searchEntries } from '../lib/search-rank.ts'
import { SITE_PAGES } from '../lib/site-pages.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`SEARCH VERIFY FAILED: ${message}`); process.exitCode = 1 }

// Every menu page is a search result, and every listed page exists.
const nav = readFileSync(path('components/SiteNav.tsx'), 'utf8')
const navRoutes = new Set([...nav.matchAll(/\$\{base\}(\/[a-z0-9-]+\/)/g)].map((m) => m[1]))
const listed = new Set(SITE_PAGES.map((p) => p.path))
for (const route of navRoutes) if (route !== '/search/' && !listed.has(route)) fail(`Menu page ${route} is missing from lib/site-pages.ts`)
for (const page of SITE_PAGES) {
  if (!existsSync(path(`out${page.path}index.html`))) fail(`lib/site-pages.ts lists ${page.path}, which the build did not export`)
  if (!page.title || !page.summary || !page.keywords) fail(`lib/site-pages.ts entry ${page.path} needs a title, summary and keywords`)
}
if (listed.size !== SITE_PAGES.length) fail('lib/site-pages.ts lists a page twice')

// The index as the page loads it.
const dir = path('out/data/search')
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))
const core = SITE_PAGES.map((p) => ({ t: 'site', n: p.title, x: p.summary, k: p.keywords, u: p.path }))
let pages = []
for (const [type, shard] of Object.entries(manifest.shards)) {
  const data = JSON.parse(readFileSync(join(dir, shard.url), 'utf8'))
  if (type === 'page') {
    if (!Array.isArray(data.docs)) { fail('The page shard has no docs list'); continue }
    pages = data.entries.map((r) => ({ t: 'page', n: `${data.docs[r.d].n} — p. ${r.p}`, x: r.x, k: r.k, u: data.docs[r.d].u }))
    const withWords = pages.filter((e) => e.k).length
    if (withWords < pages.length * 0.5) fail(`Only ${withWords} of ${pages.length} document pages carry their text's words`)
  } else core.push(...data.entries)
}
const all = core.concat(pages)

const firstSite = (q) => searchEntries(core, q).sites[0]?.u
for (const [q, want] of [
  ['reserves', '/reserves/'], ['buyout', '/buyout/'], ['open meetings', '/open-meetings/'], ['tax cap', '/tax-cap/'],
  ['ICE', '/know-your-rights/'], ['Vail-Leavitt', '/supervisor-promises/'], ['early retirement', '/buyout/'],
]) {
  const got = firstSite(q)
  if (got !== want) fail(`"${q}" should offer ${want} first, offered ${got ?? 'no page'}`)
}

const top = (q, n = 10, entries = core) => searchEntries(entries, q).results.filter((e) => e.t !== 'site').slice(0, n)

if (!top('salaries').some((e) => e.t === 'salary')) fail('"salaries" no longer finds salary records')

const typo = searchEntries(all, 'Hegermiler')
if (!typo.corrections.some((c) => c.to === 'hegermiller')) fail('"Hegermiler" is no longer read as "hegermiller"')
else if (!typo.results.some((e) => /Hegermiller/.test(e.n))) fail('"Hegermiler" does not find Hegermiller')

const resolution = top('2026-642', 1)[0]
if (!resolution?.x.startsWith('2026-642')) fail(`"2026-642" should find resolution 2026-642 first, found ${resolution?.n ?? 'nothing'}`)

if (top('sewer district', 1)[0]?.t !== 'fund') fail('"sewer district" should lead with the sewer district fund')

if (top('how much does the police department cost', 5).some((e) => /^Costa/.test(e.n))) fail('"cost" is matching the start of surnames again')

// The latest meeting's votes (or agenda) by date.
const meetings = JSON.parse(readFileSync(path('out/data/meetings/index.json'), 'utf8')).meetings
const latest = meetings.find((m) => (m.total ?? 0) > 0 || (m.docketCount ?? 0) > 0)
if (latest) {
  const [month, day] = latest.date.split(/[ ,]+/)
  const hit = top(`${month} ${day}`, 3)
  if (!hit.length || !hit.every((e) => e.x.includes(latest.date))) fail(`"${month} ${day}" should list the ${latest.date} meeting first`)
}

const earners = top('highest paid employees', 5).filter((e) => e.t === 'payroll')
const payYears = core.filter((e) => e.t === 'payroll').map((e) => Number((e.x.match(/\b(20\d\d) gross pay/) ?? [])[1] ?? 0))
const payYear = Math.max(...payYears)
if (earners.some((e) => !e.x.includes(`${payYear} gross pay`))) fail(`"highest paid employees" should rank ${payYear} pay, not an earlier year's`)

if (!process.exitCode) console.log(`Search verification passed: ${SITE_PAGES.length} site pages, ${all.length.toLocaleString()} records, typo, plural, date, role and topic searches.`)
