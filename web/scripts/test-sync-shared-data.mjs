// Integration test for consumer-specific manifest mappings. It exercises both
// destinations in isolated temporary checkouts: iOS must receive only its
// declared subset, while Android receives the full JSON mirror including the
// canonical search shards. No native repository checkout or network is needed.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const temp = mkdtempSync(join(tmpdir(), 'riverhead-shared-data-'))
const run = (args) => {
  const result = spawnSync(process.execPath, ['scripts/sync-shared-data.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`sync-shared-data ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

try {
  const iosRoot = join(temp, 'ios')
  const androidRoot = join(temp, 'android')
  mkdirSync(join(iosRoot, 'Riverhead NY Budget App'), { recursive: true })
  mkdirSync(join(androidRoot, 'app/src/main/assets/data'), { recursive: true })

  run(['--consumer', 'ios', '--root', iosRoot])
  run(['--consumer', 'ios', '--root', iosRoot, '--check'])
  const iosData = join(iosRoot, 'Riverhead NY Budget App')
  assert.ok(existsSync(join(iosData, 'payroll-records.json')), 'iOS payroll mapping should sync')
  assert.ok(existsSync(join(iosData, 'MeetingsData')), 'iOS meeting directory should sync')
  assert.ok(!existsSync(join(iosData, 'afr')), 'Android-only AFR data must not leak into the iOS bundle')
  assert.ok(!existsSync(join(iosData, 'search')), 'Android-only search shards must not leak into the iOS bundle')

  run(['--consumer', 'android', '--root', androidRoot])
  run(['--consumer', 'android', '--root', androidRoot, '--check'])
  const androidData = join(androidRoot, 'app/src/main/assets/data')
  for (const path of [
    'meta.json',
    'afr/2025.json',
    'budget-supplement/history.json',
    'history/budget-stages.json',
    'payroll/summary.json',
    'salary/authorized-2026.json',
    'search/manifest.json',
    'search/page.json',
    'subaccounts/index.json',
    'meetings/upcoming.json',
  ]) {
    assert.ok(existsSync(join(androidData, path)), `Android canonical mirror is missing ${path}`)
  }

  console.log('Shared-data sync integration passed: iOS subset and full Android JSON mirror are both reproducible and in sync.')
} finally {
  rmSync(temp, { recursive: true, force: true })
}
