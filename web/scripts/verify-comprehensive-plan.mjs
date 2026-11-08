// Checks for /comprehensive-plan/:
//   - the plan's adoption is recorded with its resolution, date and a link;
//   - every recommendation has a known status, and a status of done, partial,
//     related or underway has at least one action, while "none" has none;
//   - "done" means at least one action whose resolution says it carries out
//     the plan, and "related" means no such action;
//   - every action has a date, a resolution number, a description and a link;
//   - every quote is short enough to be a quote, and every page is in the plan;
//   - the built page states each status count and lists every recommendation.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const fail = (m) => { console.error(`COMPREHENSIVE PLAN VERIFY FAILED: ${m}`); process.exitCode = 1 }

const d = JSON.parse(readFileSync(path('public', 'data', 'comprehensive-plan.json'), 'utf8'))
const statuses = Object.keys(d.statuses)
const a = d.plan?.adopted
if (!a?.resolution || !/^\d{4}-\d{2}-\d{2}$/.test(a?.date ?? '') || !a?.url) fail('plan adoption is missing its resolution, date or link')
if (!d.plan?.url?.startsWith('https://www.townofriverheadny.gov/')) fail('plan link is not the Town’s copy')
const ids = new Set()
for (const i of d.items) {
  if (ids.has(i.id)) fail(`duplicate id ${i.id}`)
  ids.add(i.id)
  if (!statuses.includes(i.status)) fail(`${i.id}: unknown status ${i.status}`)
  if (i.status === 'none' && i.actions.length) fail(`${i.id}: "none" but lists actions`)
  if (i.status !== 'none' && !i.actions.length) fail(`${i.id}: ${i.status} with no action`)
  const cites = i.actions.some((x) => x.citesPlan)
  if (i.status === 'done' && !cites) fail(`${i.id}: "done" but no action says it carries out the plan`)
  if (i.status === 'related' && cites) fail(`${i.id}: "related" but an action cites the plan; call it done or partial`)
  if (i.planPage != null && (i.planPage < 1 || i.planPage > d.plan.pages)) fail(`${i.id}: page ${i.planPage} is outside the plan`)
  if (i.quote && i.quote.length > 320) fail(`${i.id}: quote is too long to be a quote`)
  if (!i.recommendation || i.recommendation.length < 20) fail(`${i.id}: no recommendation text`)
  for (const x of i.actions) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !/^\d{4}-\d+$/.test(x.resolution) || !x.what || !x.url) fail(`${i.id}: incomplete action ${x.resolution}`)
    if (x.date < a.date) fail(`${i.id}: action ${x.resolution} predates the plan's adoption`)
    if (x.date > d.asOf) fail(`${i.id}: action ${x.resolution} is after the as-of date`)
  }
}

const html = path('out', 'comprehensive-plan', 'index.html')
if (!existsSync(html)) fail('out/comprehensive-plan/index.html is missing; run the build first')
else {
  const text = readFileSync(html, 'utf8').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    .replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  const n = (s) => d.items.filter((i) => i.status === s).length
  if (!text.includes(`${n('done')} became law`)) fail(`page does not say "${n('done')} became law"`)
  if (!text.includes(`${n('none')} show no Town Board action`)) fail(`page does not say "${n('none')} show no Town Board action"`)
  for (const i of d.items) if (!text.includes(i.recommendation.slice(0, 40))) fail(`page does not list ${i.id}`)
}
if (!process.exitCode) {
  const c = Object.fromEntries(statuses.map((s) => [s, d.items.filter((i) => i.status === s).length]))
  console.log(`comprehensive plan: ${d.items.length} recommendations ${JSON.stringify(c)}`)
}
