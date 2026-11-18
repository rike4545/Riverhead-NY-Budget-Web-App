// The watched resolutions (etl/data/watched-resolutions.json, resolved by
// etl/resolve_watched.py into public/data/watched-resolutions.json):
// - the resolved file lists exactly the registry's items, with the same fields;
// - each item's status is what its meeting record says now, so a vote the
//   sync job picked up cannot sit unpublished behind a stale "pending";
// - every page an item names shows its status in words (lib/watched-resolutions.ts).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = (m) => { console.error(`WATCHED RESOLUTIONS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const registry = read('../etl/data/watched-resolutions.json').items
const resolved = read('public/data/watched-resolutions.json').items

const statusOf = (vote) => (!vote || vote.adopted == null ? 'pending' : vote.adopted ? 'adopted' : vote.tag === 'tabled' ? 'tabled' : 'failed')

if (resolved.length !== registry.length) fail(`${resolved.length} resolved items for ${registry.length} in the registry; run etl/resolve_watched.py`)
for (const item of registry) {
  const r = resolved.find((x) => x.id === item.id)
  if (!r) { fail(`${item.id} is not in the resolved file; run etl/resolve_watched.py`); continue }
  for (const k of ['meetingDate', 'agendaItem', 'match']) if (r[k] !== item[k]) fail(`${item.id}: ${k} differs from the registry; run etl/resolve_watched.py`)

  // What the meeting record says now.
  const file = join(root, `public/data/meetings/${item.meetingDate}-fiscal.json`)
  let expected = 'pending'
  let number = null
  if (existsSync(file)) {
    const hits = JSON.parse(readFileSync(file, 'utf8')).resolutions.filter((x) => (x.title ?? '').toLowerCase().includes(item.match.toLowerCase()))
    if (hits.length === 1) { expected = statusOf(hits[0].vote); number = hits[0].number }
    if (hits.length > 1) fail(`${item.id}: ${hits.length} resolutions on ${item.meetingDate} match "${item.match}"; make it more specific`)
  }
  if (r.status !== expected) fail(`${item.id}: the resolved file says ${r.status}, the meeting record says ${expected}; run etl/resolve_watched.py`)
  if (expected !== 'pending' && r.number !== number) fail(`${item.id}: resolution number ${r.number}, the meeting record has ${number}`)

  // Every page it names says so.
  // A pending item reads "proposed, not yet voted on" before its meeting and
  // "with no vote in the published record yet" after it (lib/watched-resolutions.ts).
  const phrases = r.status === 'pending' ? ['proposed, not yet voted on', 'with no vote in the published record yet'] : [{ adopted: 'approved by the Town Board', tabled: 'tabled by the Town Board', failed: 'not approved by the Town Board' }[r.status]]
  for (const page of item.pages) {
    const html = join(root, 'out', page, 'index.html')
    if (!existsSync(html)) { fail(`${item.id}: ${page} was not built`); continue }
    const text = readFileSync(html, 'utf8').replace(/<!-- -->/g, '')
    if (!phrases.some((p) => text.includes(p))) fail(`${item.id}: ${page} does not say "${phrases.join('" or "')}"`)
    if (r.number && !text.includes(r.number)) fail(`${item.id}: ${page} does not give Resolution ${r.number}`)
  }
}

if (!process.exitCode) console.log(`Watched resolutions: ${registry.length} match their meeting records (${resolved.map((r) => `${r.id} ${r.status}`).join(', ')}); every page they name shows the status.`)
