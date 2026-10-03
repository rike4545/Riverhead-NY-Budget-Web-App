// After a deploy, wait until the live site serves this build, then check that
// its key pages and data files load. The deploy pushes to the gh-pages branch
// and GitHub publishes it a minute or two later, so a broken publish would
// otherwise pass unnoticed.
//
// Run from web/ after `npm run build`:
//   node scripts/check-live.mjs
// SITE_URL overrides the address, WAIT_MINUTES the wait (default 10), and
// MATCH_BUILD=0 checks whatever build is live now instead of waiting for this one.

import { readFileSync } from 'node:fs'

const site = (process.env.SITE_URL || 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App').replace(/\/$/, '')
const waitMinutes = Number(process.env.WAIT_MINUTES || 10)
const matchBuild = process.env.MATCH_BUILD !== '0'
const built = JSON.parse(readFileSync('out/data/meta.json', 'utf8'))
const media = JSON.parse(readFileSync('out/data/meetings/media.json', 'utf8'))

// Each page's <title> carries one of these.
const PAGES = [
  ['/', 'Riverhead Budget Live'],
  ['/fiscal-impact/', 'Fiscal Impact, corrected'],
  ['/meetings/', 'Town Board Minutes'],
  ['/payroll/', 'Payroll Explorer'],
  ['/search/', 'Search Everything'],
]
const DATA = [
  '/data/meta.json',
  '/data/meetings/index.json',
  '/data/meetings/fiscal-index.json',
  '/data/meetings/media.json',
  // Every machine transcript a meeting page offers.
  ...Object.values(media.meetings ?? {}).map((m) => m.ours?.path).filter(Boolean),
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// A fresh query string on each request gets past the CDN's copy of the last build.
async function get(path) {
  const res = await fetch(`${site}${path}?check=${Date.now()}`, { redirect: 'follow' })
  return { status: res.status, text: await res.text() }
}

const failures = []

if (matchBuild) {
  let live = null
  const deadline = Date.now() + waitMinutes * 60_000
  for (;;) {
    try {
      const { status, text } = await get('/data/meta.json')
      if (status === 200) live = JSON.parse(text)
    } catch { /* not published yet */ }
    if (live?.generatedAt === built.generatedAt || Date.now() > deadline) break
    await sleep(20_000)
  }
  if (live?.generatedAt !== built.generatedAt) {
    failures.push(`the live site did not serve this build within ${waitMinutes} minutes: its meta.json says ${live?.generatedAt ?? 'nothing readable'}, this build is ${built.generatedAt}`)
  }
}

for (const [path, title] of PAGES) {
  try {
    const { status, text } = await get(path)
    if (status !== 200) failures.push(`${path} returned ${status}`)
    else if (!(text.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').includes(title)) failures.push(`${path} loaded without its title ("${title}")`)
  } catch (e) {
    failures.push(`${path} could not be fetched (${e.message})`)
  }
}

for (const path of DATA) {
  try {
    const { status, text } = await get(path)
    if (status !== 200) failures.push(`${path} returned ${status}`)
    else JSON.parse(text)
  } catch (e) {
    failures.push(`${path} is not readable JSON (${e.message})`)
  }
}

if (failures.length) {
  for (const f of failures) console.error(`LIVE CHECK FAILED: ${f}`)
  process.exit(1)
}
console.log(`Live check passed: ${site} ${matchBuild ? `serves build ${built.generatedAt}, and ` : ''}${PAGES.length} pages and ${DATA.length} data files load.`)
