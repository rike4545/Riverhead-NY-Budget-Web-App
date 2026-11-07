// /legal-costs/ and /regional-cpf-counsel/ quote the Town's own records. This
// checks, against the records themselves:
//   - every account lib/legal-costs.ts groups is a Budget Supplement account,
//     no account is in two groups, and every Town Attorney (1420) account and
//     every "Legal" professional-services (433) account that spent money is in
//     a group;
//   - the built legal-costs page shows the totals rebuilt here from
//     line-history.json, and calls the current year's outside-counsel spending
//     "more than the whole year's budget" only when it is;
//   - the regional-counsel page's quotations of resolution 2026-980 and its
//     retainer appear word for word in the November 5, 2026 agenda packet, its
//     quotations of resolution 2025-964 appear on the page, its deadline is 90
//     days after the law was signed, and its illustration multiplies out.

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
const fail = (message) => { console.error(`LEGAL COSTS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `${n < 0 ? '-' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const squash = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const decode = (html) => squash(html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&ldquo;|&rdquo;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))))
const page = (route) => {
  const file = path('out', route, 'index.html')
  if (!existsSync(file)) { fail(`${route} was not built`); return '' }
  return decode(readFileSync(file, 'utf8'))
}

// ── The groups ────────────────────────────────────────────────────────────────
const lib = readFileSync(path('lib', 'legal-costs.ts'), 'utf8')
const groupsSrc = lib.slice(lib.indexOf('export const groups'), lib.indexOf('export const SELF_INSURANCE'))
const groupBlocks = [...groupsSrc.matchAll(/group\('(\w+)'([\s\S]*?)\]\)/g)].map((m) => ({ key: m[1], accounts: [...m[2].matchAll(/'([A-Z0-9]{3}-\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{5})'/g)].map((x) => x[1]) }))
const outsideAccount = lib.match(/OUTSIDE_COUNSEL = '([^']+)'/)?.[1]
const selfInsAccount = lib.match(/SELF_INSURANCE = '([^']+)'/)?.[1]
if (groupBlocks.length !== 4) fail(`expected four legal-service groups, read ${groupBlocks.length}`)
groupBlocks[0].accounts = groupBlocks[0].accounts.length ? groupBlocks[0].accounts : [outsideAccount]

const history = JSON.parse(readFileSync(path('public', 'data', 'budget-supplement', 'line-history.json'), 'utf8'))
const byAccount = new Map(history.accounts.map((a) => [a.account, a]))
const grouped = groupBlocks.flatMap((g) => g.accounts)
for (const a of grouped) if (!byAccount.has(a)) fail(`${a} is not a Budget Supplement account`)
if (new Set(grouped).size !== grouped.length) fail('an account is in two groups')
for (const a of history.accounts) {
  const [, , fn, obj] = a.account.split('-')
  const spent = Object.values(a.actual).some((v) => v !== 0) || Object.values(a.ytd ?? {}).some((v) => v !== 0)
  const isLegal = fn === '1420' || (obj === '433' && /legal/i.test(a.name))
  if (isLegal && spent && !grouped.includes(a.account)) fail(`${a.account} (${a.name}) spent money but is in no group`)
}

const years = history.actualYears
const current = history.budgetYear - 1
const sumOf = (accounts, field, year) => accounts.reduce((s, acct) => s + (byAccount.get(acct)?.[field]?.[String(year)] ?? 0), 0)
const total = (year) => sumOf(grouped, 'actual', year)
const last = years[years.length - 1]

const legal = page('legal-costs')
if (legal) {
  for (const y of years) if (!legal.includes(usd(total(y)))) fail(`legal-costs: the ${y} total ${usd(total(y))} is not on the page`)
  const all = years.reduce((s, y) => s + total(y), 0)
  if (!legal.includes(usd(all))) fail(`legal-costs: the ${years[0]}–${last} total ${usd(all)} is not on the page`)
  const out = byAccount.get(outsideAccount)
  const ytd = out.ytd[String(current)], budget = out.adopted[String(current)]
  if (!legal.includes(`By June 30, ${current} it had already spent ${usd(ytd)}`)) fail(`legal-costs: the ${current} outside-counsel spending by June 30 (${usd(ytd)}) is not stated`)
  if ((ytd > budget) !== legal.includes("more than the whole year's budget")) fail(`legal-costs: "more than the whole year's budget" does not match ${usd(ytd)} against ${usd(budget)}`)
  const pairs = years.filter((y) => out.adopted[String(y)] != null && out.actual[String(y)] != null)
  const over = pairs.filter((y) => out.actual[String(y)] > out.adopted[String(y)]).length
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  if (!legal.includes(`in ${words[over]} of the ${words[pairs.length]} years since ${pairs[0]}`)) fail(`legal-costs: expected "${words[over]} of the ${words[pairs.length]} years" over budget`)
  const si = byAccount.get(selfInsAccount)
  if (!legal.includes(`It paid ${usd(si.actual[String(last)])} in ${last}`)) fail('legal-costs: the self-insurance payment for the last year is not stated')
  if (!/2026-970/.test(legal) || !legal.includes('$225,000')) fail('legal-costs: the November 5 claims transfer (2026-970) is missing')
}

// ── Regional CPF counsel ─────────────────────────────────────────────────────
// Page footers ("Page 43 of 120") fall mid-sentence; drop them before matching.
const packet = squash(readFileSync(path('..', 'etl', 'data', 'meetings', '2026-11-05-vote-packet.txt'), 'utf8').replace(/^\s*Page \d+ of \d+\s*$/gm, ' '))
const cpf = page('regional-cpf-counsel')
const fromPacket = [
  'this Contract shall be effective for the 2026 calendar year',
  'reimbursement for additional expenses for travel time, telecopies, photocopying and printing fees, as the same may be incurred from time to time',
  'periodic invoices, quarterly, bi-annually or annually at the discretion of regional counsel',
  "in proportion to each Member Town's percentage allotment of total annual CPF revenues (last full year of realized revenue)",
  'No Member Town shall be responsible for payment of legal costs above their respective share as provided in the IMA.',
  'Payments shall be paid from the appropriate capital budget account.',
  'billed at a rate of $400.00 per hour',
  'proposal of January 10, 2025',
]
for (const q of fromPacket) {
  if (!packet.includes(squash(q))) fail(`regional-cpf-counsel: "${q.slice(0, 60)}…" is not in the November 5, 2026 packet`)
  if (cpf && !q.startsWith('billed') && !q.startsWith('proposal') && !cpf.includes(squash(q))) fail(`regional-cpf-counsel: "${q.slice(0, 60)}…" is not on the page`)
}
if (!/TB Resolution 2026-980[\s\S]{0,4000}Will the Proposed Legislation have a Fiscal Impact: Yes/.test(readFileSync(path('..', 'etl', 'data', 'meetings', '2026-11-05-vote-packet.txt'), 'utf8'))) fail('the 2026-980 Fiscal Impact Statement no longer answers Yes')
if (cpf) {
  for (const q of ['without requirement for Home Rule Message', 'without consultation with or recommendation of the Town of Riverhead', 'is compelled to approve an Intermunicipal Agreement', 'tables resolution 2026-980, 5–0']) {
    if (!cpf.includes(q)) fail(`regional-cpf-counsel: "${q}" is not on the page`)
  }
  const signed = new Date('2024-12-21T12:00:00Z'); signed.setUTCDate(signed.getUTCDate() + 90)
  const due = signed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  if (due !== 'March 21, 2025' || !cpf.includes(due)) fail(`regional-cpf-counsel: the 90-day deadline should read ${due}`)
  for (const h of [25, 100, 250]) {
    const row = `${h} hours ${usd(h * 400)} ${usd(h * 400 * 0.053)}`
    if (!cpf.includes(row)) fail(`regional-cpf-counsel: the illustration row "${row}" is missing`)
  }
  if (!cpf.includes('Chapter 666 of the Laws of 2024')) fail('regional-cpf-counsel: the chapter law is not named')
}

if (!process.exitCode) console.log(`Legal costs verified: ${grouped.length} accounts in 4 groups, ${years[0]}–${last}; regional CPF counsel quotes match the packet.`)
