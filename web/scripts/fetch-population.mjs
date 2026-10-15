// Pulls the Census Bureau's population estimates for every town in Suffolk
// County and writes them to public/data/census-pep.json.
//
// The estimates come from the Bureau's own files of subcounty estimates (one
// per state, per vintage), which need no API key:
//
//     node scripts/fetch-population.mjs           # the 2025 vintage
//     node scripts/fetch-population.mjs 2026      # a later one, once published
//
// Each vintage revises every year back to 2020, so a page should take all its
// figures from one vintage. The file keeps the vintage's estimates for every
// year it covers.

import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const VINTAGE = Number(process.argv[2] ?? 2025)
const STATE = '36' // New York
const COUNTY = '103' // Suffolk
const url = `https://www2.census.gov/programs-surveys/popest/datasets/2020-${VINTAGE}/cities/totals/sub-est${VINTAGE}_${STATE}.csv`

// Node's fetch ignores HTTPS_PROXY, so fall back to curl (which honours it)
// when a proxied environment refuses the direct request.
async function get(target) {
  try {
    const res = await fetch(target)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  } catch { /* fall through to curl */ }
  const { stdout } = await execFileAsync('curl', ['-sSfL', '--max-time', '120', target], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

/** One CSV line into fields, honouring double quotes. */
function fields(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

const body = await get(url)
// The Bureau's files are Latin-1.
const text = new TextDecoder('latin1').decode(body)
const [head, ...lines] = text.split(/\r?\n/).filter(Boolean)
const columns = fields(head)
if (!columns.includes('COUSUB') || !columns.includes(`POPESTIMATE${VINTAGE}`)) {
  console.error(`${url} is not the subcounty estimates file for vintage ${VINTAGE}: its columns are ${columns.slice(0, 8).join(', ')}…`)
  process.exit(1)
}
const rows = lines.map((l) => Object.fromEntries(fields(l).map((v, i) => [columns[i], v])))
// Summary level 061 is a county subdivision. In Suffolk those are the ten
// towns and two reservations (Poospatuck and Shinnecock); keep the towns.
const towns = rows
  .filter((r) => r.SUMLEV === '061' && r.STATE === STATE && r.COUNTY === COUNTY && / town$/.test(r.NAME))
  .map((r) => ({
    name: r.NAME,
    cousub: r.COUSUB,
    base2020: Number(r.ESTIMATESBASE2020),
    estimates: Object.fromEntries(columns.filter((c) => /^POPESTIMATE\d{4}$/.test(c)).map((c) => [c.slice(-4), Number(r[c])])),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
if (towns.length !== 10) {
  console.error(`expected Suffolk County's 10 towns in ${url}, found ${towns.length}`)
  process.exit(1)
}

const out = {
  dataset: `Census Bureau Population Estimates, vintage ${VINTAGE}: resident population of Suffolk County's towns, April 1, 2020 to July 1, ${VINTAGE}`,
  vintage: VINTAGE,
  asOf: `July 1, ${VINTAGE}`,
  source: {
    title: `U.S. Census Bureau, Annual Estimates of the Resident Population for Minor Civil Divisions in New York (SUB-EST${VINTAGE})`,
    url,
    sha256: createHash('sha256').update(body).digest('hex'),
    detail: 'A town’s figure includes the residents of the incorporated villages inside it.',
  },
  retrieved: new Date().toISOString().slice(0, 10),
  towns,
}
await writeFile('public/data/census-pep.json', `${JSON.stringify(out, null, 2)}\n`)
console.log(`Wrote public/data/census-pep.json: ${towns.length} towns, vintage ${VINTAGE} (${towns.map((t) => `${t.name.replace(/ town$/, '')} ${t.estimates[String(VINTAGE)].toLocaleString('en-US')}`).join(', ')})`)
