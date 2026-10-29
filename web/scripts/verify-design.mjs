// The design rules in DESIGN.md that a machine can check. Each one was a
// site-wide pattern removed in October 2026; this keeps them from coming back
// one page at a time.
//
// 1. No emoji standing in for icons. Icons come from lucide-react.
// 2. No uppercase, letter-spaced labels: labels are sentence case.
// 3. No thick coloured stripe down the side of a box that already has a border.
//    A quote's left rule (a blockquote) is the one side rule allowed.
// 4. The self-hosted typeface is in the built pages.
// 5. No <style> element in a page or component. The HTML standard allows one
//    only in head, so the W3C Nu HTML Checker fails the page; rules go in
//    app/site.css. app/layout.tsx writes its styles inside head.
//
// Four more from the Open Design Agent Kit's craft rules (the copies kept in
// .claude/references/ux-writing.md and accessibility-baseline.md):
// 6. No link or button whose whole label is "Learn more", "Read more",
//    "Click here", "Submit", "OK" or "Go". A label names the action and what it
//    acts on.
// 7. No placeholder copy: lorem ipsum, "placeholder text", "John Doe", "$X,XXX".
// 8. No focus outline switched off, in a component or in site.css. Keyboard
//    users need to see where they are (WCAG 2.4.7).
// 9. No raw error message put in front of a reader ("Something went wrong",
//    "Update failed: " + err.message). Errors say what happened, why and what
//    to do: use components/LoadError.tsx.

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
const VAGUE_LABEL = />\s*(Learn more|Read more|Click here|Submit|OK|Go)\s*</i
const PLACEHOLDER = /lorem ipsum|placeholder text|\b(John|Jane) Doe\b|\$X,XXX/i
const NO_OUTLINE = /outline\s*:\s*['"]?(none|0)\b/
const RAW_ERROR = /Something went wrong|failed: \{|\{\s*\w+\.message\s*\}/
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
      // Code only: a comment may name the element, as this one does.
      const code = /^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line) ? '' : line.replace(/\/\/.*$/, '')
      if (/<style[\s>]/.test(code) && rel !== join('app', 'layout.tsx')) fail(`${at} puts a <style> element in the page body, which HTML allows only in head (move the rules to app/site.css)`)
      const label = code.match(VAGUE_LABEL)
      if (label) fail(`${at} labels a link or button only "${label[1]}" (say the action and what it acts on)`)
      if (PLACEHOLDER.test(code)) fail(`${at} has placeholder copy (write the real words, or leave a clearly marked gap)`)
      if (NO_OUTLINE.test(code)) fail(`${at} switches off the focus outline (keyboard users need to see where they are)`)
      if (rel.endsWith('.tsx') && RAW_ERROR.test(code)) fail(`${at} shows a raw error to readers (say what happened, why and what to do: components/LoadError.tsx)`)
    })
  }
}

const css = readFileSync(join(root, 'app/site.css'), 'utf8')
if (/outline\s*:\s*(none|0)\b/.test(css)) fail('app/site.css switches off a focus outline (keyboard users need to see where they are)')

const home = join(root, 'out/index.html')
if (!existsSync(home)) fail('out/index.html was not built')
else if (!/\.woff2/.test(readFileSync(home, 'utf8'))) fail('The built home page does not load the self-hosted typeface')

if (!process.exitCode) console.log(`Design verification passed: ${files} source files free of emoji icons, uppercase labels, side stripes, body <style> elements, vague labels, placeholder copy, hidden focus outlines and raw error messages; the typeface is preloaded.`)
