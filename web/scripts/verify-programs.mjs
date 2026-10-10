// /programs/ regroups each year's budget into the seven service functions of
// the State's account system (lib/program-budget.ts, wired up in
// lib/programs.ts). This holds it to the records it is built from:
//   - each year it shows adds up, fund by fund, to that year's Summary page on
//     spending and on revenue, and only those years are shown;
//   - programs + debt service + money set aside + interfund transfers equals
//     total appropriations to the dollar in every year, so no line is dropped
//     and every benefit dollar lands on a program;
//   - 2026's program costs match the parsed 2026 Adopted Budget to the cent,
//     and every revenue line it adds to that parse is printed on the Adopted
//     Budget's own pages, with the same amount;
//   - the built page shows every year and the budget in force.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PROGRAM_NAMES, budgetYears, programBudget } from '../lib/program-budget.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`PROGRAMS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`

const spendHistory = read('public/data/budget-supplement/line-history.json')
const revenueHistory = read('public/data/budget-supplement/revenue-history.json')
const stages = read('public/data/history/budget-stages.json')

// ── The years ────────────────────────────────────────────────────────────────
const { shown, leftOut } = budgetYears(spendHistory, revenueHistory, stages.years)
const newestAdopted = Math.max(...spendHistory.adoptedYears)
if (!shown.some((y) => y.stage === 'adopted' && y.year === newestAdopted)) fail(`The newest adopted budget, ${newestAdopted}, does not reconcile, so the page cannot open on it`)
if (!shown.some((y) => y.stage === 'tentative')) fail(`The ${spendHistory.budgetYear} Tentative does not reconcile`)
if (shown.length < 5) fail(`Only ${shown.length} years reconcile: ${shown.map((y) => y.year).join(', ')}`)

const figuresByYear = new Map()
for (const y of shown) {
  const f = programBudget(y.spend, y.revenue)
  figuresByYear.set(`${y.year}-${y.stage}`, f)
  const official = Object.values(y.summary.funds).reduce((s, x) => s + (x.appropriations ?? 0), 0)
  const services = f.programs.reduce((s, p) => s + p.fullCost, 0)
  const computed = services + f.debtService + f.setAside + f.interfundTransfers
  if (Math.abs(computed - official) >= 0.5) fail(`${y.year} ${y.stage}: programs, debt, set aside and transfers add up to ${usd(computed)}, not the ${usd(official)} appropriated`)
  const allocated = f.programs.reduce((s, p) => s + p.benefits, 0)
  if (Math.abs(allocated - f.benefitPool) >= 0.5) fail(`${y.year} ${y.stage}: ${usd(f.benefitPool)} of benefits, but ${usd(allocated)} reached programs`)
  if (Math.abs(f.revenueTotal - official) >= 0.5) fail(`${y.year} ${y.stage}: revenue lines add up to ${usd(f.revenueTotal)}, not ${usd(official)}`)
}

// ── 2026 against the parsed Adopted Budget ───────────────────────────────────
const subDir = path('public/data/subaccounts')
const subSpend = []
const subRevenue = new Map()
for (const file of readdirSync(subDir).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
  const fund = JSON.parse(readFileSync(join(subDir, file), 'utf8'))
  for (const dept of fund.departments) for (const li of dept.lineItems) subSpend.push({ fund: fund.code, account: li.account, name: li.name, amount: li.adopted2026 || 0 })
  for (const r of fund.revenues) subRevenue.set(r.account, r.adopted2026 || 0)
}
const doc2026 = programBudget(subSpend, [])
const sup2026 = figuresByYear.get('2026-adopted')
if (!sup2026) fail('2026 adopted is not among the years shown')
else {
  for (const p of sup2026.programs) {
    const q = doc2026.programs.find((x) => x.key === p.key)
    if (Math.abs(p.fullCost - q.fullCost) >= 0.01) fail(`2026 ${PROGRAM_NAMES[p.key]}: ${usd(p.fullCost)} from the Supplement, ${usd(q.fullCost)} from the Adopted Budget`)
  }
  const pdf = read('public/data/financial-reports/documents/2026-2026-adopted-budget-pdf.json')
  const text = pdf.pages.map((pg) => pg.text ?? '').join('\n').replace(/[ \t]+/g, ' ')
  const shown2026 = shown.find((y) => y.year === 2026 && y.stage === 'adopted')
  let added = 0
  for (const line of shown2026.revenue) {
    const parsed = subRevenue.get(line.account)
    if (parsed !== undefined) {
      if (Math.abs(parsed - line.amount) >= 0.5) fail(`2026 revenue ${line.account}: ${usd(line.amount)} in the Supplement, ${usd(parsed)} in the Adopted Budget`)
      continue
    }
    added++
    const row = text.split('\n').find((l) => l.replace(/\s/g, '').startsWith(line.account))
    const amount = line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
    if (!row || !row.includes(amount)) fail(`2026 revenue ${line.account} (${line.name}, ${usd(line.amount)}) is not printed on the Adopted Budget's pages`)
  }
  if (added > 20) fail(`${added} revenue lines are missing from the parsed Adopted Budget; expected a handful`)
}

// ── The page ─────────────────────────────────────────────────────────────────
const file = path('out/programs/index.html')
if (!existsSync(file)) fail('/programs/ was not built')
else {
  const text = readFileSync(file, 'utf8').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  // The year switcher marks each button with its year.
  const html = readFileSync(file, 'utf8')
  const offered = Array.from(html.matchAll(/data-year="([^"]+)"/g)).map((m) => m[1])
  const expected = shown.map((y) => (y.stage === 'tentative' ? `${y.year} proposed` : String(y.year)))
  if (offered.join('|') !== expected.join('|')) fail(`/programs/ offers ${offered.join(', ') || 'no years'}; the years that reconcile are ${expected.join(', ')}`)
  const current = figuresByYear.get(`${newestAdopted}-adopted`)
  if (current) {
    const services = current.programs.reduce((s, p) => s + p.fullCost, 0)
    const shownTotal = `$${(services / 1e6).toFixed(1)}M`
    if (!text.includes(shownTotal)) fail(`/programs/ does not open on ${newestAdopted}'s cost of services (${shownTotal})`)
  }
  for (const stale of ['close to four-fifths', 'largest employer by headcount', 'contingency (']) {
    if (text.includes(stale)) fail(`/programs/ still says "${stale}", which the figures do not support`)
  }
}

if (!process.exitCode) {
  console.log(`programs: ${shown.map((y) => (y.stage === 'tentative' ? `${y.year} proposed` : y.year)).join(', ')} reconcile to their Summary pages on spending and revenue${leftOut.length ? ` (${leftOut.map((y) => y.year).join(', ')} left out)` : ''}; every year's programs, debt, set-asides and transfers equal its appropriations; 2026 matches the Adopted Budget`)
}
