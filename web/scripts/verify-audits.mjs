// The audited General Fund figures in lib/audits.ts are typed in by hand, so
// this checks each one against the text of the page it cites, checks that the
// tiers add up and the years chain together, and checks that the reserve pages
// show the audited unassigned balance, not the Annual Financial Report's.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS, AUDIT_2025, AUDITED_YEARS, FUND_BALANCE_CLASSES } from '../lib/audits.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`AUDIT VERIFY FAILED: ${message}`); process.exitCode = 1 }
const fmt = (n) => n.toLocaleString('en-US')
const squash = (s) => s.replace(/\s+/g, ' ')

// Page text for a posted audit comes from the parsed document; for 2025, from the packet excerpt.
const index = JSON.parse(readFileSync(path('public/data/financial-reports/index.json'), 'utf8')).documents
const packet2025 = JSON.parse(readFileSync(path('../etl/data/audits/2025-audited-financial-statements.json'), 'utf8'))
function pageText(year, page) {
  if (year === 2025) return packet2025.pages[String(page)] ?? ''
  const url = AUDITED_GENERAL_FUND[year].source.url
  const doc = index.find((d) => d.url === url)
  if (!doc) { fail(`${year}: ${url} is not in the financial-reports index`); return '' }
  const pages = JSON.parse(readFileSync(path('public/data/financial-reports', doc.json), 'utf8')).pages
  return pages.find((p) => p.page === page)?.text ?? ''
}
const onPage = (year, page, n, what) => {
  if (n !== 0 && !pageText(year, page).includes(fmt(n))) fail(`${year} ${what} ${fmt(n)} is not on p. ${page}`)
}

let figures = 0
for (const year of AUDITED_YEARS) {
  const a = AUDITED_GENERAL_FUND[year]
  const sum = FUND_BALANCE_CLASSES.reduce((s, c) => s + a.classes[c], 0)
  if (sum !== a.total) fail(`${year}: the tiers add to ${fmt(sum)}, not the total ${fmt(a.total)}`)
  const assigned = a.assigned.subsequentYearsBudget + a.assigned.purchasesOnOrder + a.assigned.miscellaneousDesignations
  if (assigned !== a.classes.Assigned) fail(`${year}: the assigned detail adds to ${fmt(assigned)}, not ${fmt(a.classes.Assigned)}`)
  for (const c of FUND_BALANCE_CLASSES) { onPage(year, a.source.page, a.classes[c], c); figures++ }
  onPage(year, a.source.page, a.total, 'total')
  for (const [k, v] of Object.entries(a.assigned)) { onPage(year, a.source.page, v, k); figures++ }
  onPage(year, a.deficits.page, a.deficits.recreationProgram, 'Recreation Program deficit')
  onPage(year, a.deficits.page, a.deficits.pal, 'PAL deficit')
  if (!squash(pageText(year, a.deficits.page)).includes(a.deficits.plan)) fail(`${year}: the audit’s deficit sentence is not quoted word for word`)
  if (!a.deficits.plan.includes(`eliminated in ${year + 1}`)) fail(`${year}: the audit’s deficit sentence does not name the following year`)
  figures += 4
}

// Each operating statement, chained to the audited balances on either side of it.
for (const [y, g] of Object.entries(AUDITED_OPERATIONS)) {
  const year = Number(y)
  for (const [k, v] of Object.entries(g)) if (k !== 'page') { onPage(year, g.page, v, `General Fund ${k}`); figures++ }
  if (g.revenues - g.expenditures + g.transfersIn - g.transfersOut !== g.netChange) fail(`${year} revenues, expenditures and transfers do not give the net change`)
  if (g.beginning !== AUDITED_GENERAL_FUND[year - 1]?.total) fail(`${year} opening balance is not the ${year - 1} audited total`)
  if (g.beginning + g.netChange !== g.ending || g.ending !== AUDITED_GENERAL_FUND[year]?.total) fail(`${year} opening balance plus the change is not the closing balance`)
}
if (AUDIT_2025.generalFund !== AUDITED_OPERATIONS[2025]) fail('AUDIT_2025.generalFund is not the 2025 operating statement')

const o = AUDIT_2025.opeb
if (o.governmental + o.businessType !== o.total) fail('OPEB governmental and business-type shares do not add to the total')
for (const v of [o.total, o.governmental, o.businessType]) { onPage(2025, o.page, v, 'OPEB'); figures++ }
if (!pageText(2025, o.page + 1).includes(fmt(o.netChange))) fail('OPEB net change is not on the next page')
if (!pageText(2025, o.page + 1).includes(`${o.discountRatePct}% discount rate`)) fail(`OPEB discount rate ${o.discountRatePct}% is not on the next page`)
const d = AUDIT_2025.debtLimit
for (const v of [d.subjectToLimit, d.aggregate, d.authorizedUnissued]) { onPage(2025, d.page, v, 'debt-limit note'); figures++ }
for (const v of [d.limit, d.governmentalBonds, d.waterBonds, d.efcBonds, d.bans]) { onPage(2025, d.limitPage, v, 'MD&A debt'); figures++ }
if (!pageText(2025, d.page).includes(`${d.pct}%`)) fail(`The debt-limit share ${d.pct}% is not on p. ${d.page}`)
if (d.governmentalBonds + d.bans !== d.subjectToLimit) fail('Governmental bonds and BANs do not add to the debt subject to the limit')
if (d.governmentalBonds + d.waterBonds + d.efcBonds + d.bans !== d.aggregate) fail('The debt by type does not add to the aggregate')
if (Math.abs((d.subjectToLimit / d.limit) * 100 - d.pct) > 0.005) fail('The debt subject to the limit over the limit is not the share the audit gives')
if (!squash(pageText(2025, 149)).includes(AUDIT_2025.deficitPlan)) fail('The deficit plan is not quoted word for word')
onPage(2025, 149, AUDIT_2025.communityBenefitDesignation, 'community benefit designation')
for (const d of AUDIT_2025.designations) { onPage(2025, 149, d.amount, `designation for ${d.purpose}`); figures++ }
if (!AUDIT_2025.designations.some((d) => d.amount === AUDIT_2025.communityBenefitDesignation)) fail('The community benefit designation is not among the designations')
if (AUDIT_2025.designations.reduce((s, d) => s + d.amount, 0) > AUDITED_GENERAL_FUND[2025].assigned.miscellaneousDesignations) fail('The listed designations add to more than the miscellaneous designations')

// The 2027 projection script carries the same balance as a constant.
const predict = readFileSync(path('../etl/predict_2027.py'), 'utf8').match(/^UNASSIGNED_2025_AUDITED = ([\d_]+)$/m)
if (!predict || Number(predict[1].replace(/_/g, '')) !== AUDITED_GENERAL_FUND[2025].classes.Unassigned) fail('etl/predict_2027.py does not carry the audited 2025 unassigned balance')

// ── The pages ─────────────────────────────────────────────────────────────────
// Every reserve figure measures the audited balance. The Annual Financial
// Report's unassigned figure may appear only where it is set beside the
// audit's and called unaudited, and its percentage of appropriations nowhere.
const visible = (file) =>
  readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
const html = (route) => (existsSync(path(`out${route}index.html`)) ? visible(path(`out${route}index.html`)) : (fail(`${route} was not exported`), ''))
const unassigned = fmt(AUDITED_GENERAL_FUND[2025].classes.Unassigned)
const afr = JSON.parse(readFileSync(path('public/data/afr/2025.json'), 'utf8')).funds.find((f) => f.code === 'A')
const afrUnassigned = fmt(Math.round(afr.fundBalanceClasses.find((c) => c.class === 'Unassigned').values['2025']))
const appropriations = JSON.parse(readFileSync(path('public/data/history/budget-stages.json'), 'utf8')).years['2026'].adopted.funds.A01.appropriations
const pctOf = (n) => `${((n / appropriations) * 100).toFixed(1)}%`
const auditedPct = pctOf(AUDITED_GENERAL_FUND[2025].classes.Unassigned)
const afrPct = pctOf(afr.fundBalanceClasses.find((c) => c.class === 'Unassigned').values['2025'])

for (const route of ['/reserves/', '/answers/', '/credit-rating/', '/town-square/', '/zero-percent-2027/', '/supervisor-promises/']) {
  const text = html(route)
  if (!text.includes(auditedPct)) fail(`${route} does not show the audited reserve share, ${auditedPct} of appropriations`)
  if (text.includes(afrPct)) fail(`${route} still shows the Annual Financial Report’s reserve share, ${afrPct}`)
}
if (!html('/reserves/').includes(unassigned)) fail(`/reserves/ does not show the audited unassigned balance ${unassigned}`)
const report = html('/annual-report/')
if (!report.includes(unassigned) || !report.includes(afrUnassigned)) fail('/annual-report/ should set the report’s unassigned balance beside the audit’s')

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : []
})
let afrMentions = 0
for (const file of walk(path('out'))) {
  const text = visible(file)
  for (let i = text.indexOf(afrUnassigned); i !== -1; i = text.indexOf(afrUnassigned, i + 1)) {
    afrMentions++
    const around = text.slice(Math.max(0, i - 400), i + 200)
    if (!/unaudited/i.test(around)) fail(`${file.slice(path('out').length)} shows the Annual Financial Report’s ${afrUnassigned} without calling it unaudited`)
  }
}

// ── The fund balance policy ──────────────────────────────────────────────────
// The policy in force is Resolution 918 of 2011: a 15% floor, no ceiling, and
// three permitted uses for money above the floor. This site once described "a
// 15% minimum and 20% upper target"; no Town record sets 20%. The build fails if
// that description comes back anywhere outside the correction note that quotes
// it, and /reserves/ must cite the resolution, quote the policy and link the
// Town's own record of each vote.
const STALE_POLICY = [/upper target/i, /15\s*[–-]\s*20\s*%/, /20% (upper|target|ceiling)/i, /policy range/i, /policy ceiling/i, /upper reserve policy/i]
let policyPages = 0
for (const file of walk(path('out'))) {
  const raw = readFileSync(file, 'utf8').replace(/<p data-policy-correction[\s\S]*?<\/p>/g, ' ')
  const text = raw.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  for (const re of STALE_POLICY) {
    const m = text.match(re)
    if (m) fail(`${file.slice(path('out').length)} still describes a 20% policy target or range: “…${text.slice(Math.max(0, m.index - 70), m.index + 50)}…”`)
  }
  if (text.includes('Resolution 918')) policyPages++
}
const reserves = html('/reserves/')
for (const phrase of ['Resolution 918 of 2011', 'To reduce the subsequent year’s property taxes', 'no ceiling', 'Resolution 2006-1101', 'Adopted 4–0', 'Tabled 5–0', 'Adopted 5–0']) {
  if (!reserves.includes(phrase)) fail(`/reserves/ does not show the fund balance policy’s “${phrase}”`)
}
const reservesRaw = existsSync(path('out/reserves/index.html')) ? readFileSync(path('out/reserves/index.html'), 'utf8') : ''
for (const fileId of [7270, 7271, 6773, 7064, 7065]) {
  if (!reservesRaw.includes(`fileId=${fileId},plainText=false`)) fail(`/reserves/ does not link the policy record (CivicClerk file ${fileId})`)
}

if (!process.exitCode) console.log(`Audit verification passed: ${AUDITED_YEARS.join(', ')} General Fund audits, ${figures} figures on their cited pages, the reserve share (${auditedPct}) on the reserve pages, ${afrMentions} labeled mention(s) of the unaudited figure, and the fund balance policy (Resolution 918 of 2011) on ${policyPages} pages with no 20% target anywhere.`)
