// Every built page checked by the W3C Nu HTML Checker (vnu), the engine behind
// validator.w3.org/nu, run locally from the pinned vnu-jar package so no page
// leaves the machine. An error fails the build: markup the HTML standard does
// not allow, such as a <div> inside a <button> or a <style> in the body. The
// checker's warnings and notes are counted but pass.
//
// It needs a `java` command (Java 11 or later); GitHub's Ubuntu runners have
// one. Without it the check fails rather than passing unchecked.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import vnuJar from 'vnu-jar'

const root = process.cwd()
const out = join(root, 'out')
const fail = (message) => { console.error(`HTML VERIFY FAILED: ${message}`); process.exitCode = 1 }

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== '_next') yield* pages(p) }
    else if (name.endsWith('.html')) yield p
  }
}

if (!existsSync(out)) { fail('out/ was not built'); process.exit() }
const files = Array.from(pages(out)).sort()
if (files.length < 50) fail(`only ${files.length} built pages found in out/`)

const run = spawnSync('java', ['-Xss4m', '-jar', String(vnuJar), '--format', 'json', '--exit-zero-always', ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
if (run.error) { fail(`could not run java for the checker: ${run.error.message}`); process.exit() }
// The report is JSON on stderr; the JVM may print a line about its options first.
const start = run.stderr.indexOf('{')
let report
try { report = JSON.parse(run.stderr.slice(start)) } catch { fail(`the checker gave no report: ${run.stderr.slice(0, 400)}`); process.exit() }

const where = (m) => relative(out, decodeURIComponent((m.url ?? '').replace(/^file:/, ''))).replace(/(^|\/)index\.html$/, '$1') || '/'
const errors = report.messages.filter((m) => m.type === 'error' || m.type === 'non-document-error')
const warnings = report.messages.filter((m) => m.type === 'info' && m.subType === 'warning')
for (const m of errors.slice(0, 40)) fail(`/${where(m)}: ${m.message}${m.extract ? ` [${m.extract.replace(/\s+/g, ' ').slice(0, 120)}]` : ''}`)
if (errors.length > 40) fail(`and ${errors.length - 40} more errors`)

if (!process.exitCode) {
  console.log(`HTML verification passed: the W3C Nu HTML Checker finds no errors in ${files.length} built pages (${warnings.length} warnings, which pass).`)
}
