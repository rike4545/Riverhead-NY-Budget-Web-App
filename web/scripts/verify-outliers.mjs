// /outliers/ flags fund-by-fund budget swings under the rule in
// lib/outlier-rules.ts, from 2020 through next year's budget while it is still
// a proposal (the 2027 Tentative now). This holds the built page to the
// records, running the same rule on them:
//   - the comparison starts from the adopted budget the stage history also
//     read, so the proposal is set against the same Summary figures;
//   - the page lists every flagged change, with its amount, and the proposal's
//     section names every fund that clears one bar or both;
//   - each flagged fund's Budget Supplement lines add up to its two Summary
//     figures, so the line tables are never left off without a word;
//   - while the Debt Service Fund's fall is shown, the two 2026 votes that
//     paid debt down are still in the meeting records with every amount the
//     page quotes, and the Community Preservation Fund sentence appears only
//     while the Supplement bears it out.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { compareColumns, lineMoves, splitByBar } from '../lib/outlier-rules.ts'

const root = resolve(process.cwd())
// Every file this check opens must sit inside the web/ directory it runs from.
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(root, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${root}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`OUTLIERS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n) => `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`

const history = read('public/data/history/fund-appropriations.json')
const stages = read('public/data/history/budget-stages.json')
const supplement = read('public/data/budget-supplement/current-lines.json')

// ── The budgets compared, built as lib/budget-history.ts builds them ─────────
const adopted = history.years.map((year) => ({
  year, stage: 'adopted', label: String(year),
  appropriations: Object.fromEntries(history.funds.flatMap((f) => (f.years[String(year)] ? [[f.code, f.years[String(year)].appropriations]] : []))),
}))
const lastYear = history.years[history.years.length - 1]
const next = stages.years[String(lastYear + 1)] ?? {}
const stage = ['preliminary', 'tentative'].find((s) => next[s])
const proposalColumn = stage
  ? { year: lastYear + 1, stage, label: `${lastYear + 1} ${stage[0].toUpperCase()}${stage.slice(1)}`, appropriations: Object.fromEntries(Object.entries(next[stage].funds).map(([c, f]) => [c, f.appropriations])) }
  : null
const columns = proposalColumn ? [...adopted, proposalColumn] : adopted

// The proposal is compared with the last adopted budget from the history; the
// stage history read the same Summary page, and the two must agree.
const stagedAdopted = stages.years[String(lastYear)]?.adopted
if (proposalColumn && !stagedAdopted) fail(`the stage history has no ${lastYear} adopted budget to check the comparison's starting point against`)
if (proposalColumn && stagedAdopted) {
  for (const [code, f] of Object.entries(stagedAdopted.funds)) {
    const h = adopted[adopted.length - 1].appropriations[code]
    if (h !== f.appropriations) fail(`${code} ${lastYear}: the fund history reads ${h == null ? 'nothing' : usd(h)}, the stage history ${usd(f.appropriations)}`)
  }
}

const { transitions, changes, outliers } = compareColumns(columns, history.funds)
if (outliers.length === 0) fail('no change is flagged in any year, which this history has never produced')

// ── The built page ───────────────────────────────────────────────────────────
const built = path('out/outliers/index.html')
if (!existsSync(built)) { fail('out/outliers/index.html was not built'); process.exit() }
const text = readFileSync(built, 'utf8')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const has = (s) => text.includes(s)

if (!has(`All years (${outliers.length})`)) fail(`the year filter does not count ${outliers.length} flags`)
for (const t of transitions) {
  const n = outliers.filter((o) => o.transition === t.key).length
  if (!has(`${t.key.replace('→', ' → ')} (${n})`)) fail(`the ${t.key} filter does not count ${n}`)
}
if (!has(`${changes.length} fund-year comparisons`)) fail(`the page does not give the ${changes.length} comparisons`)
for (const o of outliers) {
  for (const s of [o.name, o.transition.replace('→', ' → '), usd(o.prior), usd(o.current), signed(o.dollarChange)]) {
    if (!has(s)) fail(`flagged ${o.code} ${o.transition}: "${s}" is not on the page`)
  }
}
for (const stale of ['2020–2026, all 19 funds', 'since 2020, 6 clear']) if (has(stale)) fail(`the page still says "${stale}"`)

// ── The proposal ─────────────────────────────────────────────────────────────
let detail = 'no proposal published'
if (proposalColumn) {
  const t = transitions.find((x) => x.proposed)
  const split = splitByBar(changes.filter((c) => c.transition === t.key))
  if (!has(`What the ${proposalColumn.label} flags`)) fail(`the page has no section on the ${proposalColumn.label}`)
  for (const c of [...split.flagged, ...split.dollarsOnly, ...split.percentOnly]) {
    if (!has(`${c.name}`) || !has(usd(Math.abs(c.dollarChange)))) fail(`the ${proposalColumn.label} section leaves out ${c.name}, ${signed(c.dollarChange)}`)
  }

  // Line by line, from the Supplement, when it prints this proposal.
  const supplementFits = proposalColumn.stage === 'tentative' && supplement.columns.tentative === proposalColumn.year &&
    supplement.reconciliation.complete && supplement.columns.adopted === lastYear
  // If the latest published stage is Tentative, the line-level data must be
  // the current year's Supplement reconciled to that same Tentative and the
  // adopted budget used as the comparison baseline. Do not silently skip line
  // detail when the deploy parser has produced stale or mismatched data.
  if (proposalColumn.stage === 'tentative') {
    if (supplement.supplementYear !== proposalColumn.year) fail(`the Outlier Watch compares ${proposalColumn.label}, but current-lines.json is Supplement ${supplement.supplementYear}`)
    if (supplement.columns.tentative !== proposalColumn.year) fail(`the Supplement's Tentative column is ${supplement.columns.tentative}, not ${proposalColumn.year}`)
    if (supplement.columns.adopted !== lastYear) fail(`the Supplement's adopted column is ${supplement.columns.adopted}, not the ${lastYear} comparison baseline`)
    if (supplement.reconciliation.complete !== true || Math.abs(Number(supplement.reconciliation.gap ?? Infinity)) > 0.01 || (supplement.reconciliation.fundsOff ?? []).length) {
      fail(`the ${proposalColumn.label} Supplement is not fully reconciled: ${JSON.stringify(supplement.reconciliation)}`)
    }
    if (!supplementFits) fail(`the ${proposalColumn.label} proposal has no valid, reconciled Supplement line data`)
  }
  const lines = supplementFits ? supplement.lines : []
  for (const c of split.flagged) {
    if (!supplementFits) continue
    const moves = lineMoves(lines, c.code, c.prior, c.current)
    if (!moves) { fail(`${c.code}: its Supplement lines do not add up to ${usd(c.prior)} and ${usd(c.current)}, so the page drops its line table`); continue }
    for (const l of [...moves.spending, ...moves.money]) {
      if (!has(l.account) || !has(signed(l.dollarChange))) fail(`${c.code}: line ${l.account} (${signed(l.dollarChange)}) is not on the page`)
    }
  }

  // The Debt Service Fund's fall, and the votes set beside it.
  const debt = split.flagged.find((c) => c.code === 'V01' && c.toYear === 2027 && c.dollarChange < 0)
  if (debt) {
    const meetings = read('public/data/meetings/fiscal-index.json').meetings.map((slug) => read(`public/data/meetings/${slug}-fiscal.json`))
    const quoted = {
      '2026-642': ['CM4-9999-000-00000-0', 'A01-2660-000-00000-1'],
      '2026-762': ['A01-9999-000-00000-0', 'A01-2410-357-00000-1'],
    }
    for (const [number, accounts] of Object.entries(quoted)) {
      const r = meetings.flatMap((m) => m.resolutions).find((x) => x.number === number)
      if (!r || r.vote?.adopted !== true) { fail(`resolution ${number} is no longer in the meeting records as adopted`); continue }
      if (!has(`Resolution ${number}`)) fail(`resolution ${number} is not on the page`)
      for (const code of accounts) {
        const a = r.funding?.accounts?.find((x) => x.code === code && x.role === 'revenue')
        if (!a?.amount) fail(`resolution ${number} no longer names ${code}`)
        else if (!has(usd(a.amount))) fail(`resolution ${number}: ${usd(a.amount)} from ${code} is not on the page`)
      }
    }
    const line = (account) => lines.find((l) => l.account === account)
    const transfer = line('CM4-9-9901-900-V01-00000')
    const contribution = line('CM4-9-9990-000-000-00000')
    const holds = !!transfer && !!contribution && transfer.tentative === 0 && contribution.adopted === 0 &&
      contribution.tentative === transfer.adopted && !split.flagged.some((c) => c.code === 'CM4')
    const shown = has('which is why the Community Preservation Fund is not flagged')
    if (holds !== shown) fail(`the Community Preservation Fund sentence is ${shown ? 'shown' : 'missing'}, but the Supplement ${holds ? 'bears it out' : 'does not bear it out'}`)
  }
  detail = `${proposalColumn.label}: ${split.flagged.length} flagged, ${split.dollarsOnly.length} past the dollar bar only, ${split.percentOnly.length} past the percent bar only`
}

if (!process.exitCode) {
  console.log(`outliers: ${outliers.length} flags in ${changes.length} fund-year comparisons, ${columns[0].label} to ${columns[columns.length - 1].label}; ${detail}`)
}
