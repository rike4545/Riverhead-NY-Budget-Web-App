#!/usr/bin/env node
// Moves the datasets the native apps consume out of this repo and into theirs,
// and — more usefully — tells you when they have drifted apart.
//
// The web repo is the source of truth. etl/ writes web/public/data, and the iOS
// and Android apps ship copies of a subset of it. Those copies were being kept
// current by hand, which is why the iOS app was three weeks behind on Town Board
// meetings and still listing a meeting that had already happened as upcoming.
//
//   node scripts/sync-shared-data.mjs --check --root ../riverhead-ny-budget-ios-app
//   node scripts/sync-shared-data.mjs         --root ../riverhead-ny-budget-ios-app
//
// --check writes nothing and exits 1 if anything is out of sync, so it can run in
// CI. Without it, the consumer is brought up to date and every copy is verified by
// SHA-256 after writing.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')
const manifest = JSON.parse(readFileSync(join(REPO, 'shared-data', 'manifest.json'), 'utf8'))

const argv = process.argv.slice(2)
const check = argv.includes('--check')
const consumerName = valueOf('--consumer') ?? 'ios'
const consumerRoot = valueOf('--root')

function valueOf(flag) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined
}

const consumer = manifest.consumers[consumerName]
if (!consumer) die(`unknown consumer "${consumerName}" — manifest knows: ${Object.keys(manifest.consumers).join(', ')}`)
if (!consumerRoot) die('pass --root <path to the consumer repo checkout>')
const destBase = join(resolve(consumerRoot), consumer.root)
if (!existsSync(destBase)) die(`consumer root does not exist: ${destBase}`)

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const srcBase = join(REPO, manifest.canonicalRoot)

// Expand the manifest into concrete source -> destination pairs. Directory rules
// are expanded against what is on disk now, so a meeting added this morning is
// carried without anyone editing the manifest.
const pairs = []
for (const f of manifest.files) pairs.push({ src: join(srcBase, f.web), dest: join(destBase, f[consumerName]), label: f.web })
for (const d of manifest.directories ?? []) {
  const from = join(srcBase, d.web)
  if (!existsSync(from)) continue
  const suffix = d.pattern?.replace('*', '') ?? ''
  for (const name of readdirSync(from)) {
    if (suffix && !name.endsWith(suffix)) continue
    if (statSync(join(from, name)).isDirectory()) continue
    pairs.push({ src: join(from, name), dest: join(destBase, d[consumerName], name), label: `${d.web}/${name}` })
  }
}

const state = { synced: [], stale: [], missing: [], absent: [] }
for (const p of pairs) {
  if (!existsSync(p.src)) { state.absent.push(p); continue }
  if (!existsSync(p.dest)) { state.missing.push(p); continue }
  ;(sha(p.src) === sha(p.dest) ? state.synced : state.stale).push(p)
}

// Anything in a mirrored directory on the consumer side that this repo no longer
// produces. Not deleted automatically — a stale meeting file is worth a human
// glance, and deleting from a bundle can break a build that references it.
const orphans = []
for (const d of manifest.directories ?? []) {
  const there = join(destBase, d[consumerName])
  if (!existsSync(there)) continue
  const here = new Set(existsSync(join(srcBase, d.web)) ? readdirSync(join(srcBase, d.web)) : [])
  const suffix = d.pattern?.replace('*', '') ?? ''
  for (const name of readdirSync(there)) {
    if (suffix && !name.endsWith(suffix)) continue
    if (!here.has(name)) orphans.push(`${d[consumerName]}/${name}`)
  }
}

console.log(`shared data · ${manifest.canonicalRoot} -> ${consumer.repo}`)
console.log(`  ${pairs.length} datasets in scope`)
console.log(`  ${state.synced.length} already identical`)
for (const [key, title] of [['stale', 'out of date in the app'], ['missing', 'absent from the app'], ['absent', 'named by the manifest but missing HERE']]) {
  if (!state[key].length) continue
  console.log(`  ${state[key].length} ${title}:`)
  for (const p of state[key]) console.log(`     ${p.label}`)
}
if (orphans.length) {
  console.log(`  ${orphans.length} in the app but no longer produced here (not touched — review by hand):`)
  for (const o of orphans) console.log(`     ${o}`)
}

const drifted = state.stale.length + state.missing.length
if (check) {
  if (state.absent.length) die(`\n${state.absent.length} manifest entr${state.absent.length === 1 ? 'y is' : 'ies are'} missing from this repo — the manifest is wrong, or the ETL did not run.`)
  if (drifted) { console.log(`\nout of sync: ${drifted} dataset(s). Run without --check to fix.`); process.exit(1) }
  console.log('\nin sync.')
  process.exit(0)
}

if (state.absent.length) die('\nrefusing to sync: the manifest names datasets this repo does not have.')
let wrote = 0
for (const p of [...state.stale, ...state.missing]) {
  mkdirSync(dirname(p.dest), { recursive: true })
  writeFileSync(p.dest, readFileSync(p.src))
  if (sha(p.dest) !== sha(p.src)) die(`verification failed after writing ${p.label}`)
  wrote++
}
console.log(`\n${wrote} dataset(s) written and verified.${wrote ? ` Commit them in ${basename(resolve(consumerRoot))}.` : ''}`)

function die(msg) { console.error(msg); process.exit(1) }
