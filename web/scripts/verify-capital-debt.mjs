// /capital-debt/'s 2027 section sets what the 2027 Tentative budgets for debt
// beside the 2025 Annual Financial Report's repayment schedule, and its
// "since" list adds the September 1, 2026 ambulance bond resolution. This
// re-derives the budget's debt lines from the 2027 Budget Supplement and the
// resolution's figures from the meeting's fiscal-impact record, then holds the
// built page to them.

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
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`CAPITAL DEBT VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`

// The AFR's Bond Repayment schedule (p. 144), as the page charts it.
const SCHEDULE_2027 = { principal: 5_845_778, interest: 1_036_167 }

const lines = read('public/data/budget-supplement/current-lines.json').lines.filter((l) => l.kind === 'expenditure' && !/fee/i.test(l.name))
const sum = (fn, obj, col) => lines.filter((l) => l.account.split('-')[2] === fn && l.account.split('-')[3] === obj).reduce((s, l) => s + (l[col] ?? 0), 0)
const plan = {
  bondPrincipal: [sum('9710', '600', 'adopted'), sum('9710', '600', 'tentative')],
  bondInterest: [sum('9710', '700', 'adopted'), sum('9710', '700', 'tentative')],
  notePrincipal: [sum('9730', '600', 'adopted'), sum('9730', '600', 'tentative')],
  noteInterest: [sum('9730', '700', 'adopted'), sum('9730', '700', 'tentative')],
}
if (plan.bondPrincipal[1] >= SCHEDULE_2027.principal) fail('the Tentative no longer budgets less bond principal than the schedule; the page’s explanation no longer holds')
if (plan.noteInterest[1] <= 0) fail('the Tentative budgets no note interest, so the page should not say the Town Hall note is expected to be outstanding')

const r833 = read('public/data/meetings/2026-09-01-fiscal.json').resolutions.find((r) => r.number === '2026-833')
const amounts = new Set((r833?.statedAmounts ?? []).map((a) => a.amount))
for (const n of [14_100_000, 6_000_000, 8_100_000]) if (!amounts.has(n)) fail(`Resolution 2026-833 does not state ${usd(n)}`)

const built = 'out/capital-debt/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const visible = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
const html = readFileSync(path(built), 'utf8')
const i = html.indexOf('data-debt-plan-2027')
const section = i === -1 ? '' : visible(html.slice(i, html.indexOf('</section>', i)))
if (!section) fail('/capital-debt/ has no 2027 plan section')
for (const s of [
  ...Object.values(plan).flat().map(usd), usd(SCHEDULE_2027.principal), usd(SCHEDULE_2027.interest),
  `${usd(SCHEDULE_2027.principal - plan.bondPrincipal[1])} less`,
]) if (section && !section.includes(s)) fail(`the 2027 plan section does not show ${s}`)
const text = visible(html)
for (const s of ['Resolution 2026-833', '$14,100,000', '$8,100,000', '“$6,000,000 provided by Riverhead Volunteer Ambulance Corp, as Lessee, from private funding secured by Lessee,”', '$49,965,000', '$480,000']) {
  if (!text.includes(s)) fail(`/capital-debt/ does not show ${s}`)
}

if (!process.exitCode) console.log(`Capital-debt verification passed: the 2027 Tentative budgets ${usd(plan.bondPrincipal[1])} of bond principal against the schedule’s ${usd(SCHEDULE_2027.principal)}.`)
