// Runs the same checks as `npm run verify`, but prints only what needs reading:
// the full output of a failing step, any warnings a passing step writes to
// stderr, and a one-line count at the end. It reads the list of checks from
// the verify:output script in package.json, so the two can never drift apart.
//
//   node scripts/run-verify.mjs           checks only (the site must be built)
//   node scripts/run-verify.mjs --build   build first, as `npm run verify` does
//
// Like the && chain it replaces, it stops at the first failing step.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const chain = pkg.scripts?.['verify:output'] ?? ''
const steps = chain.split('&&').map((s) => s.trim()).filter((s) => s && !s.startsWith('export '))
if (steps.length === 0) {
  console.error('run-verify: found no checks in the verify:output script of package.json')
  process.exit(1)
}

const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --disable-warning=MODULE_TYPELESS_PACKAGE_JSON`.trim() }
const run = (cmd) => spawnSync(cmd, { cwd: root, env, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const started = Date.now()

if (process.argv.includes('--build')) {
  const b = run('npm run build')
  if (b.status !== 0) {
    process.stdout.write(b.stdout ?? '')
    process.stderr.write(b.stderr ?? '')
    console.error(`run-verify: the build failed (exit ${b.status ?? b.signal})`)
    process.exit(b.status || 1)
  }
  console.log('run-verify: build passed')
}

let warned = 0
for (const [i, step] of steps.entries()) {
  const r = run(step)
  if (r.status !== 0) {
    process.stdout.write(r.stdout ?? '')
    process.stderr.write(r.stderr ?? '')
    console.error(`run-verify: step ${i + 1} of ${steps.length} failed (exit ${r.status ?? r.signal}): ${step}`)
    process.exit(r.status || 1)
  }
  const err = (r.stderr ?? '').trim()
  if (err) {
    warned++
    console.error(`run-verify: ${step} passed with this on stderr:\n${err}`)
  }
}
const secs = Math.round((Date.now() - started) / 1000)
console.log(`run-verify: all ${steps.length} checks passed in ${secs}s${warned ? `; ${warned} printed warnings, shown above` : ''}`)
