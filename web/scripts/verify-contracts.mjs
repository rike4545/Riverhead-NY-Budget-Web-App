// /contracts/: the list of 2026 bid awards, purchases, change orders and service
// agreements (etl/build_contract_awards.py). The data must be a fresh build, its
// counts must add up, every amount must carry the clause that states it, no
// contact details may survive, and the built page must show the counts and
// the note on how the list is made.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const fail = (message) => { console.error(`CONTRACTS VERIFY FAILED: ${message}`); process.exitCode = 1 }

const data = JSON.parse(readFileSync(resolve(root, 'public/data/meetings/contract-awards.json'), 'utf8'))
if (data.preview) fail('contract-awards.json was built from cached packet text; rebuild it from fresh downloads')
const awards = data.awards ?? []
if (awards.length < 50) fail(`only ${awards.length} resolutions; the 2026 packets hold more than 50`)
const counts = {
  resolutions: awards.length,
  withVendor: awards.filter((a) => a.vendors.length).length,
  withAmount: awards.filter((a) => a.amount).length,
  meetings: new Set(awards.map((a) => a.date)).size,
}
for (const [k, v] of Object.entries(counts)) if (data.counts[k] !== v) fail(`counts.${k} says ${data.counts[k]}, the list has ${v}`)
const seen = new Set()
for (const a of awards) {
  const id = `${a.date} ${a.resolution}`
  if (seen.has(id)) fail(`${id} is listed twice`)
  seen.add(id)
  if (!data.kinds[a.kind]) fail(`${id} has an unknown kind ${a.kind}`)
  if (a.amount && !a.quote) fail(`${id} shows ${a.amount} with no clause stating it`)
  if (a.amount && a.quote && !a.quote.includes(Math.trunc(a.amount).toLocaleString('en-US'))) fail(`${id}: the quoted clause does not contain ${a.amount}`)
  if (/\S+@\S+\.\w+/.test(JSON.stringify(a))) fail(`${id} still carries an e-mail address`)
  if (a.kind === 'change-order' && a.vendors.length) fail(`${id}: a change order's vendor comes from a recital, not the resolution`)
  if (!a.sourceUrl?.startsWith('https://riverheadny.api.civicclerk.com/')) fail(`${id} has no CivicClerk packet link`)
  for (const v of a.vendors) if (!v.name || v.name.length > 90 || /attached|resolution|forward/i.test(v.name)) fail(`${id}: "${v.name}" does not read as a vendor`)
}

const page = resolve(root, 'out/contracts/index.html')
if (!existsSync(page)) fail('out/contracts/index.html is missing; run the build first')
else {
  const text = readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ')
  for (const want of [`voted on ${counts.resolutions} resolutions`, `${counts.withVendor} of them name the vendor`, 'How this list is made', 'not what it paid']) {
    if (!text.includes(want)) fail(`the page does not say "${want}"`)
  }
}

if (!process.exitCode) console.log(`contracts: ${counts.resolutions} resolutions, ${counts.withVendor} with a vendor, ${counts.withAmount} with an amount`)
