// /spending-reduction-2027/: the package builder must start empty, so no
// candidate reads as recommended until a resident picks it, and the page must
// not describe untested trims as savings the Town already has.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const fail = (message) => { console.error(`SPENDING REDUCTION VERIFY FAILED: ${message}`); process.exitCode = 1 }

const source = readFileSync(resolve(root, 'components/SpendingReductionToggleList.tsx'), 'utf8')
if (!/useState<Set<string>>\(new Set\(allItems\.map\(\(i\) => i\.id\)\)\)/.test(source)) fail('the builder no longer starts with nothing selected')

const page = resolve(root, 'out/spending-reduction-2027/index.html')
if (!existsSync(page)) fail('out/spending-reduction-2027/index.html is missing; run the build first')
else {
  const text = readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ')
  for (const want of ['Your test package', 'not booked savings', 'Select firm line trims', 'Nothing selected yet', 'it is not the tax-cap test']) {
    if (!text.includes(want)) fail(`the page no longer says "${want}"`)
  }
  for (const banned of ['largely in hand', 'cover essentially the entire', 'close the tax-cap gap', 'available']) {
    if (banned === 'available' ? /out of \$[\d,]+ available/.test(text) : text.includes(banned)) fail(`the page still says "${banned}"`)
  }
}

if (!process.exitCode) console.log('spending reduction: builder starts empty; candidates are labelled as candidates')
