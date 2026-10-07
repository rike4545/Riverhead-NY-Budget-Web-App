// The design rules in DESIGN.md that a machine can check. Each one was a
// site-wide pattern removed in October 2026; this keeps them from coming back
// one page at a time.
//
// 1. No emoji standing in for icons. Icons come from lucide-react.
// 2. No uppercase, letter-spaced labels: labels are sentence case.
// 3. No thick coloured stripe down the side of a box that already has a border.
//    A quote's left rule (a blockquote) is the one side rule allowed.
// 4. The self-hosted typeface is in the built pages.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const fail = (message) => { console.error(`DESIGN VERIFY FAILED: ${message}`); process.exitCode = 1 }

function* sourceFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* sourceFiles(p)
    else if (/\.(tsx|ts)$/.test(name)) yield p
  }
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2B50}\u{2705}]/u
const STRIPE = /border(?:Left|Right)\s*:\s*['`]([2-9]|\d{2,})px solid/
let files = 0
for (const dir of ['app', 'components', 'lib']) {
  for (const file of sourceFiles(join(root, dir))) {
    files++
    const rel = relative(root, file)
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`
      const context = lines.slice(Math.max(0, i - 2), i + 1).join(' ')
      const emoji = line.match(EMOJI)
      if (emoji) fail(`${at} uses the emoji ${emoji[0]} (use a lucide-react icon, or words)`)
      if (/textTransform\s*:\s*['"]uppercase['"]/.test(line)) fail(`${at} sets an uppercase label (labels are sentence case)`)
      if (STRIPE.test(line) && !/blockquote|quoteStyle|paddingLeft/.test(context)) fail(`${at} draws a thick side stripe (put the colour in the 1px border instead)`)
    })
  }
}

const home = join(root, 'out/index.html')
if (!existsSync(home)) fail('out/index.html was not built')
else if (!/\.woff2/.test(readFileSync(home, 'utf8'))) fail('The built home page does not load the self-hosted typeface')

if (!process.exitCode) console.log(`Design verification passed: ${files} source files free of emoji icons, uppercase labels and side stripes; the typeface is preloaded.`)
