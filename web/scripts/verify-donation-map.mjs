// /donation-map/ adds up each committee's itemized contributions by ZIP code.
// This checks:
//   - each committee's total equals the "direct contributions" on its
//     campaign-finance card (campaign-finance-totals.json), to the cent;
//   - the data holds no names or street addresses: committees map years to
//     ZIP codes to [amount, count], and ZIP codes to a place and a state only;
//   - the ZIP code areas cover the Town (their shares of it add to about 1);
//   - the built page draws every ZIP code area and lists every committee.

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
const read = (...p) => JSON.parse(readFileSync(path(...p), 'utf8'))
const fail = (message) => { console.error(`DONATION MAP VERIFY FAILED: ${message}`); process.exitCode = 1 }

const data = read('public', 'data', 'campaign-donations-by-zip.json')
const totals = read('public', 'data', 'campaign-finance-totals.json')
const areas = read('public', 'data', 'geo', 'riverhead-zip-areas.json')

if (JSON.stringify(data.window) !== JSON.stringify(totals.window)) fail(`window ${data.window} differs from the cards' ${totals.window}`)
for (const [name, years] of Object.entries(data.committees)) {
  let sum = 0
  for (const [year, zips] of Object.entries(years)) {
    if (!/^\d{4}$/.test(year)) fail(`${name}: year key ${year}`)
    for (const [z, cell] of Object.entries(zips)) {
      if (!/^(\d{5}|unknown)$/.test(z)) fail(`${name} ${year}: ZIP key ${z}`)
      if (!Array.isArray(cell) || cell.length !== 2 || typeof cell[0] !== 'number' || !Number.isInteger(cell[1])) fail(`${name} ${year} ${z}: cell ${JSON.stringify(cell)}`)
      sum += cell[0]
    }
  }
  const card = totals.committees[name]?.directContributions
  if (card == null || Math.abs(sum - card) > 0.01) fail(`${name}: ${sum.toFixed(2)} by ZIP code but ${card} on the card`)
}
for (const [z, info] of Object.entries(data.zips)) {
  const keys = Object.keys(info).sort().join()
  if (keys !== 'place,state') fail(`ZIP ${z} carries ${keys}, not just place and state`)
}
const covered = areas.features.reduce((s, f) => s + f.properties.riverheadShare, 0)
if (covered < 0.97 || covered > 1.03) fail(`the ZIP code areas cover ${covered} of the Town`)

const file = path('out', 'donation-map', 'index.html')
if (!existsSync(file)) fail('/donation-map/ was not built')
else {
  const html = readFileSync(file, 'utf8')
  const drawn = (html.match(/<path[^>]*tabindex="0"/g) ?? []).length
  if (drawn !== areas.features.length) fail(`the page draws ${drawn} ZIP code areas, not ${areas.features.length}`)
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ')
  for (const name of Object.keys(data.committees)) {
    const label = name.replace(/^Honorable /, '')
    if (!text.includes(label)) fail(`the page does not list ${label}`)
  }
}

if (!process.exitCode) console.log(`Donation map verified: ${Object.keys(data.committees).length} committees match their cards, ${Object.keys(data.zips).length} ZIP codes, ${areas.features.length} areas drawn, no names or addresses.`)
