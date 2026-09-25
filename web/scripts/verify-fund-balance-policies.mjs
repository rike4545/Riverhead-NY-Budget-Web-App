// The fund balance policies on /reserves/ are typed in by hand: Riverhead's own,
// six nearby towns' and GFOA's guidance, and three neighbors' balances. This
// checks every quoted phrase and every figure in lib/fund-balance-policies.ts
// against the text of the page it cites, kept in
// etl/data/policies/fund-balance-policies.json. It checks that the sentence the
// page says the 2011 rewrite dropped is in the 2006 policy and not in the 2011
// one. Then it checks that /reserves/ shows the comparison, and that no page
// brings back the mixed peer figures the comparison corrects.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FUND_BALANCE_POLICY, GFOA_GUIDANCE, PEER_BALANCES, PEER_POLICIES, RIVERHEAD_POLICY } from '../lib/fund-balance-policies.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`POLICY VERIFY FAILED: ${message}`); process.exitCode = 1 }
const fmt = (n) => n.toLocaleString('en-US')
// PDF and OCR text break lines and words unpredictably, and quote marks vary:
// compare without whitespace, with plain quote marks and hyphens.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, '')

const excerpts = JSON.parse(readFileSync(path('../etl/data/policies/fund-balance-policies.json'), 'utf8')).documents
function docText(key, pages) {
  const doc = excerpts[key]
  if (!doc) { fail(`there is no excerpt “${key}”`); return '' }
  return (pages ?? Object.keys(doc.pages)).map((p) => {
    if (!(p in doc.pages)) fail(`${key} has no page ${p}`)
    return doc.pages[p] ?? ''
  }).join('\n')
}
let phrases = 0
function quoted(key, pages, phrase, what, { anyCase = false } = {}) {
  phrases++
  let text = norm(docText(key, pages))
  let want = norm(phrase)
  if (anyCase) { text = text.toLowerCase(); want = want.toLowerCase() }
  // A quotation that starts mid-sentence may capitalize its first letter.
  const found = text.includes(want) || text.includes(want.charAt(0).toLowerCase() + want.slice(1))
  if (!found) fail(`${what}: “${phrase}” is not in ${key}${pages ? ` p. ${pages.join(', ')}` : ''}`)
}

// ── Riverhead's own policy ───────────────────────────────────────────────────
const own = FUND_BALANCE_POLICY
const ownPhrases = [
  ['floor', own.floorText], ['uses', own.usesIntro], ...own.uses.map((u) => ['use', u]), ['review', own.reviewText],
  ['below the floor', own.belowFloorText], ...Object.entries(own.gasb54),
]
for (const [what, phrase] of ownPhrases) quoted(own.excerpts.current, null, phrase, `Resolution 918 (${what})`)
// The 2006 policy had the same floor and uses, and the rebuild sentence 2011 dropped.
for (const phrase of ['no less than 15% of its total operating budget', own.usesIntro, ...own.uses]) quoted(own.excerpts.original, null, phrase, 'Resolution 1101 of 2006')
quoted(own.excerpts.original, null, own.droppedRebuildText, 'The 2006 rebuild sentence')
if (norm(docText(own.excerpts.current)).includes(norm('immediately begin the process'))) fail('The 2011 policy has the rebuild sentence the page says it dropped')

// ── Each written rule, and GFOA's guidance ───────────────────────────────────
const policies = [RIVERHEAD_POLICY, ...PEER_POLICIES, GFOA_GUIDANCE]
for (const p of policies) {
  const doc = excerpts[p.source.excerpt]
  if (!doc) { fail(`${p.town}: there is no excerpt “${p.source.excerpt}”`); continue }
  if (doc.url !== p.source.url) fail(`${p.town}: the card links ${p.source.url}, not the excerpted document`)
  for (const q of p.quotes) quoted(p.source.excerpt, p.source.pages, q, p.town)
  // A phrase quoted inside a card's plain-language text must be in the source too.
  for (const field of [p.ifBelow, p.aboveMinimum, p.minimumText, p.counts, p.otherFunds, p.note]) {
    for (const m of (field ?? '').matchAll(/“([^”]+)”/g)) quoted(p.source.excerpt, p.source.pages, m[1].replace(/[.,]$/, ''), `${p.town} (quoted on its card)`, { anyCase: true })
  }
  if (p.rebuildWithin && !p.ifBelow) fail(`${p.town}: a rebuild deadline with nothing said about falling below`)
}

// ── The neighbors' balances ──────────────────────────────────────────────────
let figures = 0
for (const b of PEER_BALANCES) {
  const text = docText(b.source.excerpt, b.source.pages)
  const printed = (n, what) => { figures++; if (!text.includes(fmt(n))) fail(`${b.town} ${what} ${fmt(n)} is not on ${b.source.excerpt} p. ${b.source.pages.join(', ')}`) }
  if (b.parts) {
    b.parts.forEach((x) => printed(x.amount, `${x.label} balance`))
    if (b.parts.reduce((s, x) => s + x.amount, 0) !== b.total) fail(`${b.town}: the parts do not add to ${fmt(b.total)}`)
  } else printed(b.total, 'balance')
  printed(b.budget, 'budget')
  if (b.budgetParts) {
    b.budgetParts.forEach((x) => printed(x.amount, `${x.label} budget`))
    if (b.budgetParts.reduce((s, x) => s + x.amount, 0) !== b.budget) fail(`${b.town}: the budget parts do not add to ${fmt(b.budget)}`)
  }
  if (b.narrower) printed(b.narrower.amount, b.narrower.label)
  const known = [b.total, b.budget, b.narrower?.amount, ...(b.parts ?? []).map((x) => x.amount), ...(b.budgetParts ?? []).map((x) => x.amount)].filter(Boolean).map(fmt)
  for (const m of b.detail.matchAll(/\$([\d,]+)/g)) if (!known.includes(m[1])) fail(`${b.town}: the detail's $${m[1]} is not one of the checked figures`)
}

// ── The pages ────────────────────────────────────────────────────────────────
const decode = (s) => s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const visible = (raw) => decode(raw.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ')
const has = (text, phrase) => norm(text).includes(norm(phrase))
const reservesFile = path('out/reserves/index.html')
const raw = existsSync(reservesFile) ? readFileSync(reservesFile, 'utf8') : (fail('/reserves/ was not exported'), '')
const section = (attr) => {
  const i = raw.indexOf(`<section ${attr}`)
  if (i === -1) { fail(`/reserves/ has no ${attr} section`); return '' }
  return raw.slice(i, raw.indexOf('</section>', i))
}

const policySection = section('data-fund-balance-policy')
for (const phrase of [own.belowFloorText, own.droppedRebuildText, 'dropped that sentence', ...own.history.map((h) => h.note)]) {
  if (!has(visible(policySection), phrase)) fail(`/reserves/ policy section does not show “${phrase.slice(0, 70)}…”`)
}

const peers = section('data-peer-policies')
const cards = (peers.match(/data-policy-town=/g) ?? []).length
if (cards !== policies.length) fail(`/reserves/ shows ${cards} policy cards, not ${policies.length}`)
for (const p of policies) {
  const card = peers.slice(peers.indexOf(`data-policy-town="${p.town}"`))
  if (!peers.includes(`data-policy-town="${p.town}"`)) { fail(`/reserves/ has no card for ${p.town}`); continue }
  if (!card.includes(`href="${p.source.url}"`)) fail(`/reserves/ ${p.town} card does not link its source`)
  for (const field of [p.minimumText, p.counts, p.ifBelow, p.aboveMinimum]) if (field && !has(visible(card), field)) fail(`/reserves/ ${p.town} card does not show “${field.slice(0, 60)}…”`)
}

const holdings = section('data-peer-holdings')
const holdingsText = visible(holdings.replace(/<p data-peer-correction[\s\S]*?<\/p>/, ' '))
const shares = PEER_BALANCES.map((b) => b.total / b.budget)
const average = `${((shares.reduce((s, x) => s + x, 0) / shares.length) * 100).toFixed(1)}%`
if (!has(holdingsText, `Average of ${PEER_BALANCES.map((b) => b.town).slice(0, -1).join(', ')} and ${PEER_BALANCES.at(-1).town}`) || !holdingsText.includes(average)) fail(`/reserves/ does not show the neighbors' average of their balances alone, ${average}`)
for (const [i, b] of PEER_BALANCES.entries()) if (!holdingsText.includes(`${(shares[i] * 100).toFixed(1)}%`)) fail(`/reserves/ does not show ${b.town}'s ${(shares[i] * 100).toFixed(1)}%`)
if (/Southampton/.test(holdingsText)) fail('/reserves/ balances list includes Southampton, which has a policy here, not a balance')

const appropriations = JSON.parse(readFileSync(path('public/data/history/budget-stages.json'), 'utf8')).years['2026'].adopted.funds.A01.appropriations
const rules = visible(section('data-rule-scenarios'))
for (const p of policies) {
  const top = typeof p.minimum === 'number' ? p.minimum : p.minimum[1]
  const required = `$${fmt(Math.round(appropriations * top))}`
  if (!rules.includes(required)) fail(`/reserves/ rule scenarios do not show ${p.town}'s ${(top * 100).toFixed(1)}% as ${required}`)
}

// The mixed figures this corrects may appear only in the correction note that quotes them.
const STALE = [/Smithtown[^.]{0,120}39\.9%/, /~38\.8%/, /Match average of peers/i, /average of Brookhaven, Smithtown, East Hampton and Southampton/i, /Brookhaven's own posture/i]
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : []
})
for (const file of walk(path('out'))) {
  const text = visible(readFileSync(file, 'utf8').replace(/<p data-peer-correction[\s\S]*?<\/p>/g, ' '))
  for (const re of STALE) {
    const m = text.match(re)
    if (m) fail(`${file.slice(path('out').length)} still shows a mixed peer figure: “…${text.slice(Math.max(0, m.index - 60), m.index + 60)}…”`)
  }
}

if (!process.exitCode) console.log(`Fund balance policy verification passed: ${phrases} quoted phrases in ${Object.keys(excerpts).length} documents, ${figures} balance figures, ${policies.length} policy cards on /reserves/, the rebuild sentence in 2006 and not 2011, and the neighbors' average (${average}) from balances alone.`)
