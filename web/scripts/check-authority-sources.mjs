import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const registryPath = join(here, '..', 'lib', 'authority-audit.ts')
const source = await readFile(registryPath, 'utf8')

// Keep the checker dependency-free: parse the deliberately simple registry
// rather than requiring a TypeScript runtime in CI.
const objects = [...source.matchAll(/\{\n\s+id: '([^']+)',\n\s+url: '([^']+)',\n\s+checkedAt: '([^']+)',\n\s+mode: '([^']+)',([\s\S]*?)\n\s+note: '([^']*)',\n\s+\}/g)]
const records = objects.map((m) => ({
  id: m[1],
  url: m[2],
  checkedAt: m[3],
  mode: m[4],
  expectedSha256: m[5].match(/expectedSha256: '([a-f0-9]{64})'/)?.[1],
}))

if (records.length < 12) {
  console.error(`AUTHORITY CHECK FAILED: parsed only ${records.length} authority records; expected at least 12 including claim-level sources`)
  process.exit(1)
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
        headers: { 'user-agent': 'Riverhead-Budget-Live-evidence-check/1.0' },
      })
      if (response.ok || (response.status >= 400 && response.status < 500)) return response
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
  }
  throw lastError ?? new Error('unknown fetch failure')
}

// Only positive evidence that a cited document is gone fails this gate. A
// refusal, a rate limit, or an outage means the checker never saw the document,
// which is not the same as the citation being dead. On 2026-09-18 osc.ny.gov,
// which hosts eleven of these twelve records, returned 403 to every request
// from the GitHub Actions runner while serving all eleven at unchanged
// fingerprints, to the same user-agent, from a developer machine minutes later.
// Reddening the build on someone else's edge policy teaches everyone to wave
// this gate through, which is exactly how a genuinely dead citation would slip
// past it. Records the checker could not reach are counted and named instead.
const CITATION_GONE = new Set([404, 410])

const gone = []
const unreachable = []
const changed = []
const unbaselined = []
let confirmed = 0

for (const record of records) {
  try {
    const response = await fetchWithRetry(record.url)
    if (!response.ok) {
      if (CITATION_GONE.has(response.status)) {
        console.error(`AUTHORITY CHECK FAILED: ${record.id} returned HTTP ${response.status}`)
        gone.push(record.id)
      } else {
        console.warn(`AUTHORITY UNREACHABLE: ${record.id} returned HTTP ${response.status}; not evidence the citation is dead`)
        unreachable.push(record.id)
      }
      continue
    }

    const body = Buffer.from(await response.arrayBuffer())
    const sha = createHash('sha256').update(body).digest('hex')
    if (record.mode === 'sha256') {
      if (!record.expectedSha256) {
        console.warn(`AUTHORITY FINGERPRINT BASELINE NEEDED: ${record.id} sha256=${sha}`)
        unbaselined.push(record.id)
      } else if (sha !== record.expectedSha256) {
        console.warn(`AUTHORITY CONTENT CHANGED: ${record.id} expected=${record.expectedSha256} observed=${sha}`)
        changed.push(record.id)
      } else {
        console.log(`Authority unchanged: ${record.id} sha256=${sha}`)
        confirmed += 1
      }
    } else {
      console.log(`Authority reachable: ${record.id} HTTP ${response.status} (${body.length} bytes)`)
      confirmed += 1
    }
  } catch (error) {
    console.warn(`AUTHORITY UNREACHABLE: ${record.id}: ${error instanceof Error ? error.message : String(error)}; not evidence the citation is dead`)
    unreachable.push(record.id)
  }
}

console.log(
  `Authority source check: ${confirmed} confirmed, ${changed.length} changed, ` +
  `${unbaselined.length} unbaselined, ${unreachable.length} unreachable, ` +
  `${gone.length} dead, of ${records.length} records.`
)
for (const [label, ids] of [['changed', changed], ['unbaselined', unbaselined], ['unreachable', unreachable]]) {
  if (ids.length) console.log(`  ${label}: ${ids.join(', ')}`)
}

// A run that confirmed nothing has not exercised the registry at all. Say so
// plainly rather than letting a clean exit code imply the citations were checked.
if (confirmed === 0) {
  console.warn('AUTHORITY CHECK DEGRADED: no record could be confirmed in this run; the citation registry was not exercised')
}

if (gone.length) process.exit(1)
