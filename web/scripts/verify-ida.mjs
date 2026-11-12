// /ida/ (lib/ida.ts and public/data/ida.json, built by etl/build_ida.py).
// - every report in the State's data adds up: its six tax breaks to its total,
//   its three PILOTs to its total, and the total less PILOTs to its net;
// - ida.json's years and projects add up to the raw rows exactly;
// - the agency's revenue and spending match the quoted lines of its audited
//   statements, kept in etl/data/ida/;
// - the built page shows the totals, names the sources and links them.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IDA_FINANCES, ABO_REVIEW, hadBreaks, totals } from '../lib/ida.ts'

const root = process.cwd()
const fail = (m) => { console.error(`IDA VERIFY FAILED: ${m}`); process.exitCode = 1 }
const raw = JSON.parse(readFileSync(join(root, '../etl/data/ida/abo-project-data.json'), 'utf8'))
const data = JSON.parse(readFileSync(join(root, 'public/data/ida.json'), 'utf8'))
const n = (r, k) => Number(r[k] || 0)
const near = (a, b) => Math.abs(a - b) < 0.6

if (raw.rows.length < 100) fail(`only ${raw.rows.length} reports in the kept State data`)
if (raw.rows.some((r) => r.authority_name !== 'Riverhead Industrial Development Agency')) fail('a report from another agency is in the data')
for (const r of raw.rows) {
  const id = `${r.project_code} ${r.fiscal_year_end_date.slice(0, 4)}`
  const parts = ['state_sales_tax_exemption_amount', 'local_sales_tax_exemption_amount', 'county_real_property_tax_exemption_amount', 'local_property_tax_exemption_amount', 'school_property_tax_exemption_amount', 'mortgage_recording_tax_exemption_amount'].reduce((s, k) => s + n(r, k), 0)
  if (!near(parts, n(r, 'total_exemptions'))) fail(`${id}: tax breaks add to ${parts}, the report says ${r.total_exemptions}`)
  const pilots = n(r, 'county_pilot_made') + n(r, 'local_pilot_made') + n(r, 'school_district_pilot_made')
  if (!near(pilots, n(r, 'total_pilot_made'))) fail(`${id}: PILOTs add to ${pilots}, the report says ${r.total_pilot_made}`)
  if (!near(n(r, 'total_exemptions') - n(r, 'total_pilot_made'), n(r, 'net_exemptions'))) fail(`${id}: tax breaks less PILOTs is not the reported net`)
}

// The built data adds up to the raw rows.
const rawSum = (k) => raw.rows.reduce((s, r) => s + n(r, k), 0)
const t = totals(data)
if (!near(t.exemptions, rawSum('total_exemptions'))) fail(`years add to ${t.exemptions} in tax breaks, the reports to ${rawSum('total_exemptions')}`)
if (!near(t.pilots, rawSum('total_pilot_made'))) fail('the years do not add to the reports’ PILOTs')
if (!near(t.net, rawSum('net_exemptions'))) fail('the years do not add to the reports’ net')
if (!near(data.projects.reduce((s, p) => s + p.net, 0), t.net)) fail('the projects do not add to the years’ net')
if (data.reports !== raw.rows.length) fail('ida.json counts a different number of reports')
if (new Set(raw.rows.map((r) => r.project_code)).size !== data.projects.length) fail('ida.json has a different number of projects than the reports')
if (data.projects.filter(hadBreaks).length !== t.withBreaks) fail('the count of projects with tax breaks is inconsistent')
for (let i = 1; i < data.projects.length; i++) if (data.projects[i].net > data.projects[i - 1].net) fail('projects are not sorted by net tax break')

// The agency's own money, from its audited statements.
const fs = readFileSync(join(root, '../etl/data/ida/audited-financial-statements-2024-excerpt.txt'), 'utf8')
for (const [k, q] of Object.entries(IDA_FINANCES.quotes)) if (!fs.includes(q)) fail(`audited statements: the ${k} line is not in the excerpt`)
const fmt = (v) => v.toLocaleString('en-US')
const [y22, y23, y24] = IDA_FINANCES.years
if (!IDA_FINANCES.quotes.revenue.includes(`$   ${fmt(y24.revenue)}`) || !IDA_FINANCES.quotes.revenue.includes(fmt(y23.revenue)) || !IDA_FINANCES.quotes.revenue.trim().endsWith(fmt(y22.revenue))) fail('revenue by year does not match the audited summary')
if (!IDA_FINANCES.quotes.expenses.trim().startsWith(`Total operating expenses                           ${fmt(y24.expenses)}`) || !IDA_FINANCES.quotes.expenses.includes(fmt(y23.expenses)) || !IDA_FINANCES.quotes.expenses.trim().endsWith(fmt(y22.expenses))) fail('expenses by year do not match the audited summary')

// The built page.
const out = join(root, 'out/ida/index.html')
if (!existsSync(out)) fail('out/ida/index.html was not built')
else {
  const html = readFileSync(out, 'utf8')
  const m = (v) => `$${(v / 1e6).toFixed(1)} million`
  for (const s of [m(t.exemptions), m(t.pilots), m(t.net), data.source.url, IDA_FINANCES.source.url, ABO_REVIEW.url, 'not audited', '$251,489', '$135,875', '$173,748']) if (!html.includes(s)) fail(`the page does not show "${s}"`)
}

if (!process.exitCode) console.log(`IDA: ${raw.rows.length} reports reconcile (tax breaks, PILOTs, net); ${data.projects.length} projects, ${t.withBreaks} with tax breaks; $${Math.round(t.net).toLocaleString('en-US')} net over ${t.firstYear}-${t.lastYear}; audited revenue for ${IDA_FINANCES.years.length} years matches the excerpt.`)
