// /budget-amendments-2027/ sets out the six amendments to the 2027 Preliminary
// Budget on the Town Board's October 20, 2026 agenda. The resolutions in
// lib/budget-amendments-2027.ts were transcribed from the October 15
// work-session packet, so this checks them against the packet's own text
// (etl/data/budget-2027/amendments-packet-2026-10-15.json):
//   - the agenda lists each amendment under its item number;
//   - each resolution page carries its title, its item number, the draft mark,
//     every WHEREAS clause as quoted, and every account with its name and amount;
//   - each fiscal impact statement names the same accounts and amounts;
//   - each resolution balances within every fund, and moves the levy and the
//     savings used the way its WHEREAS clauses say;
// then holds the figures the page works out to the 2027 Budget Supplement and
// the Tentative's Summary, the totals RiverheadLOCAL reported to the same
// arithmetic, and the built page to all of it.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import {
  AMENDMENTS, ARTICLE, PACKET, PROPERTY_TAXES, STAFF_APPOINTMENT, change, deferredToFundBalance, fundEffects, isRevenue, revenueCode,
  scaledRate, unbalanced,
} from '../lib/budget-amendments-2027.ts'
import { TOWN_WIDE_FUNDS } from '../lib/fund-groups.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`BUDGET AMENDMENTS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const fmt = (n) => Math.round(n).toLocaleString('en-US')
const usd = (n) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n))}`
const total = (xs) => xs.reduce((s, x) => s + x, 0)
// The packet pads its amounts ("$   223"), and its lines wrap.
const norm = (s) => s.replace(/\s+/g, ' ').replace(/\$ +/g, '$').trim()

// ── The packet ───────────────────────────────────────────────────────────────
const excerpt = read(`../${PACKET.excerpt}`)
if (!PACKET.fileUrl.includes(`fileId=${excerpt.source.civicclerkFileId}`)) fail(`the excerpt is of file ${excerpt.source.civicclerkFileId}, not the one PACKET links`)
if (!/^[0-9a-f]{64}$/.test(excerpt.source.packetSha256 ?? '')) fail('the excerpt does not record the packet’s checksum')
const page = (n) => {
  const t = excerpt.pages[String(n)]
  if (t === undefined) { fail(`the excerpt has no packet page ${n}`); return '' }
  return norm(t)
}
const agenda = PACKET.agendaPages.map(page).join(' ')
if (!agenda.includes(`Town Board Regular Meeting Agenda ${PACKET.meeting.date.replace(/^(\w+) (\d+), (\d+)$/, 'Tuesday, $1 $2, $3')}`)) fail(`the agenda pages are not the agenda for ${PACKET.meeting.date}`)

let checkedLines = 0
for (const a of AMENDMENTS) {
  const title = `Authorizes Amendment #${a.n} to the 2027 Preliminary Budget`
  const itemNumber = a.item.replace(/^VII\./, '')
  if (!agenda.includes(`${itemNumber}. ${title}`)) fail(`#${a.n}: the agenda does not list "${title}" as item ${itemNumber}`)
  const resolution = page(a.page)
  if (!resolution.includes(title.toUpperCase())) fail(`#${a.n}: packet p. ${a.page} is not its resolution`)
  if (!resolution.includes(`${a.item}.`)) fail(`#${a.n}: packet p. ${a.page} does not carry item ${a.item}`)
  if (!resolution.includes(PACKET.status)) fail(`#${a.n}: packet p. ${a.page} is not marked "${PACKET.status}"`)
  for (const w of a.whereas) if (!resolution.includes(`WHEREAS, ${w}`)) fail(`#${a.n}: the WHEREAS clause "${w.slice(0, 60)}…" is not on p. ${a.page} as quoted`)
  const statement = a.statementPages.map(page).join(' ')
  if (!statement.includes(`Title of Proposed Legislation: ${title}`)) fail(`#${a.n}: ${a.statementPages.join(', ')} is not its fiscal impact statement`)
  if (!statement.includes('10/9/2026')) fail(`#${a.n}: its fiscal impact statement is not dated 10/9/2026`)
  for (const l of a.lines) {
    if (!resolution.includes(`${l.account} ${l.name}`)) fail(`#${a.n}: "${l.account} ${l.name}" is not on p. ${a.page}`)
    const at = resolution.indexOf(`${l.account} ${l.name}`)
    if (at >= 0 && !resolution.slice(at, at + l.account.length + l.name.length + 40).includes(`$${fmt(l.amount)}`)) fail(`#${a.n}: ${l.account} is not followed by $${fmt(l.amount)} on p. ${a.page}`)
    if (!statement.includes(l.account) || !statement.includes(`$${fmt(l.amount)}`)) fail(`#${a.n}: ${l.account} or $${fmt(l.amount)} is not in its fiscal impact statement`)
    checkedLines++
  }
  // The columns are the one thing the text cannot show, so hold each to its own
  // arithmetic and to what its WHEREAS clauses say it does.
  const effects = fundEffects([a])
  for (const e of effects) if (unbalanced(e) !== 0) fail(`#${a.n}: ${e.fund} does not balance (off by ${fmt(unbalanced(e))})`)
  const says = a.whereas.join(' ')
  if (/reductions to the property tax levy/.test(says) && !effects.some((e) => e.levy < 0)) fail(`#${a.n}: its WHEREAS clauses reduce the levy, but no levy falls`)
  if (/appropriated fund balance/.test(says) && !effects.some((e) => e.fundBalance < 0)) fail(`#${a.n}: its WHEREAS clauses reduce the fund balance used, but none falls`)
  if (effects.some((e) => e.levy > 0) && !/requested an adjustment/.test(says)) fail(`#${a.n}: it raises a levy without saying why`)
}

// ── Against the Supplement and the Summary ───────────────────────────────────
const supplement = read('public/data/budget-supplement/current-lines.json')
if (supplement.columns.tentative !== 2027 || !supplement.reconciliation.complete) fail('the Budget Supplement is not a 2027 one that adds up to the Tentative')
const lines = new Map(supplement.lines.map((l) => [l.account, l]))
for (const a of AMENDMENTS) for (const l of a.lines) {
  const s = lines.get(l.account)
  if (!s || s.tentative === null) { fail(`#${a.n}: ${l.account} has no 2027 Tentative figure in the Supplement`); continue }
  if (isRevenue(l.account) !== (s.kind === 'revenue')) fail(`#${a.n}: ${l.account} is a ${s.kind} line, not what its account number says`)
  if (s.tentative + change(l) < 0) fail(`#${a.n}: ${l.account} would fall below zero`)
}
const stages = read('public/data/history/budget-stages.json')
const t2027 = stages.years['2027']?.tentative
const a2026 = stages.years['2026']?.adopted
const effects = fundEffects(AMENDMENTS)
const levyChange = total(effects.filter((e) => TOWN_WIDE_FUNDS.includes(e.fund)).map((e) => e.levy))
for (const e of effects) {
  if (unbalanced(e) !== 0) fail(`all six: ${e.fund} does not balance`)
  const f = t2027?.funds[e.fund]
  if (!f) { fail(`the Tentative's Summary has no ${e.fund}`); continue }
  const levyLine = lines.get(`${e.fund}-1001-001-00000-A`)
  if (levyLine && levyLine.tentative !== f.levy) fail(`${e.fund}: the Supplement's property tax line is not the Summary's levy`)
  const fb = lines.get(`${e.fund}-9999-000-00000-0`)
  if (e.fundBalance && fb?.tentative !== f.fundBalance) fail(`${e.fund}: the Supplement's appropriated fund balance is not the Summary's`)
}
const levyAfter = t2027.townWide.levy + levyChange
const pctAfter = ((levyAfter - t2027.townWide.priorLevy) / t2027.townWide.priorLevy) * 100
const deferred = deferredToFundBalance(AMENDMENTS)
const deferredTotal = total(deferred.map((d) => d.line.amount))
// RiverheadLOCAL's totals, from the same resolutions.
if (-levyChange !== 643_858) fail(`the six lower the town-wide levy by ${fmt(-levyChange)}, not the $643,858 RiverheadLOCAL reported`)
if (pctAfter.toFixed(2) !== '1.73') fail(`the amended levy rises ${pctAfter.toFixed(2)}%, not the reported 1.73%`)
if (deferredTotal !== 201_237) fail(`the equipment moved to savings is ${fmt(deferredTotal)}, not the reported $201,237`)
const history = new Map(read('public/data/budget-supplement/revenue-history.json').accounts.map((h) => [h.account, h]))
const gfInterest = history.get('A01-2401-000-00000-G')
const threeYears = gfInterest ? total([2023, 2024, 2025].map((y) => Math.round(gfInterest.actual[String(y)] ?? 0))) : 0
if (Math.round(threeYears / 1e5) / 10 !== ARTICLE.reported.earningsMillions) fail(`the General Fund's 2023–2025 interest, ${fmt(threeYears)}, does not round to the $${ARTICLE.reported.earningsMillions} million the page matches it to`)
const october6 = read(`public/data/meetings/${STAFF_APPOINTMENT.meeting}.json`)
const appointment = october6.resolutions.find((r) => r.number === STAFF_APPOINTMENT.number)
if (appointment?.title !== STAFF_APPOINTMENT.title || !appointment.adopted) fail(`Resolution ${STAFF_APPOINTMENT.number} is not an adopted "${STAFF_APPOINTMENT.title}" on ${STAFF_APPOINTMENT.meeting}`)

// The final agenda and the vote, once the Town publishes them. The page reports
// either on its own; a final agenda without all six means the page needs updating.
const upcoming = read('public/data/meetings/upcoming.json')
const listed = [...upcoming.recent, ...upcoming.meetings].find((m) => m.slug === PACKET.meeting.slug)
if (listed?.agendaPublished) {
  const onFinal = (listed.docket ?? []).filter((d) => /Amendment #\d to the 2027 Preliminary Budget/i.test(d.title ?? '')).length
  if (onFinal !== AMENDMENTS.length) console.warn(`budget amendments: the final ${PACKET.meeting.slug} agenda lists ${onFinal} of the six; the page says so, but lib/budget-amendments-2027.ts should be brought up to date`)
}

// ── The built page ───────────────────────────────────────────────────────────
const built = 'out/budget-amendments-2027/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const text = readFileSync(path(built), 'utf8')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const has = (s) => text.includes(s)
const count = (s) => text.split(s).length - 1
const rates = TOWN_WIDE_FUNDS.map((code) => {
  const r = t2027.townWide.fundRates[code]
  const e = effects.find((x) => x.fund === code)
  return scaledRate(r.rate, t2027.funds[code].levy, t2027.funds[code].levy + (e?.levy ?? 0))
})
const onPage = [
  usd(t2027.townWide.levy), usd(levyAfter), usd(-levyChange), usd(t2027.townWide.priorLevy), `${pctAfter.toFixed(2)}%`,
  usd(t2027.totals.appropriations), usd(t2027.totals.appropriations + total(effects.map((e) => e.appropriations))),
  usd(deferredTotal), usd(threeYears), total(rates).toFixed(3), ...rates.map((r) => r.toFixed(3)),
  ...TOWN_WIDE_FUNDS.map((c) => usd(t2027.funds[c].levy + (effects.find((e) => e.fund === c)?.levy ?? 0))),
  `Resolution ${STAFF_APPOINTMENT.number}`, PACKET.status,
]
for (const s of onPage) if (!has(s)) fail(`"${s}" is not on the page`)
for (const a of AMENDMENTS) {
  if (!has(`Amendment #${a.n}:`)) fail(`#${a.n} has no section on the page`)
  for (const w of a.whereas) if (!has(`“${w}”`)) fail(`#${a.n}: its WHEREAS clause is not quoted on the page`)
  for (const l of a.lines) if (!has(l.account)) fail(`#${a.n}: ${l.account} is not on the page`)
}
for (const raised of AMENDMENTS.flatMap((a) => a.lines).filter((l) => isRevenue(l.account) && revenueCode(l.account) !== PROPERTY_TAXES && l.side === 'from')) {
  const s = lines.get(raised.account)
  if (s && !has(usd(s.tentative))) fail(`the Tentative estimate for ${raised.account} is not on the page`)
}
// The election section weighs both candidates alike.
for (const heading of ['For Rothwell, the challenger', 'For Halpin, the incumbent', 'Does the staff’s party matter?']) if (!has(heading)) fail(`the page has no "${heading}"`)
if (count('Could help.') !== 2 || count('Could hurt.') !== 2) fail(`the election section should give each candidate one "Could help." and one "Could hurt." (found ${count('Could help.')} and ${count('Could hurt.')})`)
for (const bad of ['NaN', 'undefined', 'Infinity']) if (has(bad)) fail(`the page shows "${bad}"`)
if (existsSync(path(`public/data/meetings/${PACKET.meeting.slug}.json`))) {
  const meeting = read(`public/data/meetings/${PACKET.meeting.slug}.json`)
  const voted = (meeting.resolutions ?? []).filter((r) => /Amendment #\d to the 2027 Preliminary Budget/i.test(r.title ?? ''))
  if (voted.length && count('the Board’s record shows it') !== voted.length) fail(`the meeting record has ${voted.length} amendment votes, but the page shows ${count('the Board’s record shows it')}`)
}

if (!process.exitCode) {
  console.log(`budget amendments: ${AMENDMENTS.length} resolutions, ${checkedLines} lines on their packet pages and fiscal impact statements, each fund balanced; town-wide levy ${usd(t2027.townWide.levy)} → ${usd(levyAfter)} (up ${pctAfter.toFixed(2)}% on 2026), ${usd(deferredTotal)} of equipment to savings, estimated rate ${total(rates).toFixed(3)}; the page shows ${onPage.length} checked figures`)
}
