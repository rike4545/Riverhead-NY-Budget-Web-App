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

let failed = false
for (const record of records) {
  try {
    const response = await fetchWithRetry(record.url)
    if (!response.ok) {
      if (record.mode === 'status' && ![404, 410].includes(response.status)) {
        console.warn(`AUTHORITY PORTAL WARNING: ${record.id} returned HTTP ${response.status}; dynamic portal check is non-blocking`)
        continue
      }
      console.error(`AUTHORITY CHECK FAILED: ${record.id} returned HTTP ${response.status}`)
      failed = true
      continue
    }

    const body = Buffer.from(await response.arrayBuffer())
    const sha = createHash('sha256').update(body).digest('hex')
    if (record.mode === 'sha256') {
      if (!record.expectedSha256) {
        console.warn(`AUTHORITY FINGERPRINT BASELINE NEEDED: ${record.id} sha256=${sha}`)
      } else if (sha !== record.expectedSha256) {
        console.warn(`AUTHORITY CONTENT CHANGED: ${record.id} expected=${record.expectedSha256} observed=${sha}`)
      } else {
        console.log(`Authority unchanged: ${record.id} sha256=${sha}`)
      }
    } else {
      console.log(`Authority reachable: ${record.id} HTTP ${response.status} (${body.length} bytes)`)
    }
  } catch (error) {
    if (record.mode === 'status') {
      console.warn(`AUTHORITY PORTAL WARNING: ${record.id}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    console.error(`AUTHORITY CHECK FAILED: ${record.id}: ${error instanceof Error ? error.message : String(error)}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`Authority source check completed for ${records.length} records.`)
