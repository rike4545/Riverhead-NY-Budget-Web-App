// Pulls the ACS denominators this site needs (households, household size,
// median household income) for Riverhead town and writes them to
// public/data/census-acs.json.
//
// The API key is read from the environment and never written to the repo:
//
//     CENSUS_API_KEY=... node scripts/fetch-census.mjs
//
// A key is free from https://api.census.gov/data/key_signup.html and must be
// activated from the confirmation email before it will authenticate.

import { writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// Node's fetch ignores HTTPS_PROXY, so fall back to curl (which honours it)
// when a proxied environment refuses the direct request.
async function get(url) {
  try {
    const res = await fetch(url)
    const body = await res.text()
    if (res.ok && body.startsWith('[')) return body
  } catch { /* fall through to curl */ }
  const { stdout } = await execFileAsync('curl', ['-sL', '--max-time', '60', url], {
    maxBuffer: 8 * 1024 * 1024,
  })
  return stdout
}

const KEY = process.env.CENSUS_API_KEY
if (!KEY) {
  console.error('CENSUS_API_KEY is not set. Get one at https://api.census.gov/data/key_signup.html')
  process.exit(1)
}

const YEAR = 2023          // ACS 5-year, the only release that covers a town this size
const STATE = '36'         // New York
const COUNTY = '103'       // Suffolk
const SUBDIVISION = '61984' // Riverhead town

// Estimate (E) and margin of error (M) for each variable we publish.
const VARIABLES = {
  households: 'DP02_0001',
  avgHouseholdSize: 'DP02_0016',
  medianHouseholdIncome: 'DP03_0062',
  housingUnits: 'DP04_0001',
  population: 'DP05_0001',
}

const fields = Object.values(VARIABLES).flatMap((v) => [`${v}E`, `${v}M`])
const url =
  `https://api.census.gov/data/${YEAR}/acs/acs5/profile?get=NAME,${fields.join(',')}` +
  `&for=county%20subdivision:${SUBDIVISION}&in=state:${STATE}%20county:${COUNTY}&key=${KEY}`

const body = await get(url)
if (!body.startsWith('[')) {
  const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'unrecognised response'
  console.error(`Census API rejected the request: ${title}`)
  console.error('A new key must be activated from the confirmation email before it will work.')
  process.exit(1)
}

const [header, row] = JSON.parse(body)
const at = (name) => row[header.indexOf(name)]
const num = (raw) => {
  const n = Number(raw)
  // The API uses large negative sentinels for "not available".
  return Number.isFinite(n) && n > -100000 ? n : null
}

const values = {}
for (const [key, code] of Object.entries(VARIABLES)) {
  values[key] = { estimate: num(at(`${code}E`)), moe: num(at(`${code}M`)), variable: `${code}E` }
}

const out = {
  place: at('NAME'),
  geoid: `${STATE}${COUNTY}${SUBDIVISION}`,
  dataset: `American Community Survey ${YEAR} 5-year estimates (${YEAR - 4}–${YEAR})`,
  source: {
    title: `U.S. Census Bureau, American Community Survey ${YEAR} 5-Year Estimates, Data Profiles`,
    url: 'https://data.census.gov/table?g=060XX00US3610361984',
    detail:
      'Retrieved from the Census Data API. Five-year estimates are used because Riverhead is far below the ' +
      '65,000-population threshold for one-year estimates.',
  },
  retrieved: new Date().toISOString().slice(0, 10),
  ...values,
}

await writeFile('public/data/census-acs.json', `${JSON.stringify(out, null, 2)}\n`)
console.log(`Wrote public/data/census-acs.json — ${out.households.estimate.toLocaleString()} households`)
