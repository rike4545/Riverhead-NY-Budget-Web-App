// Post-build smoke check: run with `npm run verify` after `npm run build`.
// Confirms the export contains the pages and datasets the site depends on.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'app/page.tsx',
  'components/FiscalCommandCenter.tsx',
  'components/PayrollTabs.tsx',
  'components/UnifiedSearch.tsx',
  'lib/all-funds.ts',
  'lib/afr.ts',
  'lib/payroll.ts',
  'lib/salary.ts',
  'lib/meetings.ts',
  'lib/subaccounts.ts',
  'lib/budget-history.ts',
  'lib/general-fund.ts',
]

const requiredOutputs = [
  'out/index.html',
  'out/guide/index.html',
  'out/payroll/index.html',
  'out/funds/index.html',
  'out/funds/A01/index.html',
  'out/compare/index.html',
  'out/general-fund/index.html',
  'out/annual-report/index.html',
  'out/meetings/index.html',
  'out/search/index.html',
  'out/downloads/index.html',
  'out/sitemap.xml',
  'out/robots.txt',
  'out/data/search/unified.json',
  'out/data/payroll/records.json',
  'out/downloads/payroll_actual_2018_2023.csv',
]

const missing = [...requiredFiles, ...requiredOutputs].filter((f) => !existsSync(join(root, f)))
if (missing.length) {
  console.error('Missing required files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const home = readFileSync(join(root, 'out/index.html'), 'utf8')
const requiredCopy = ['Payroll Explorer', 'Start Here']
const missingCopy = requiredCopy.filter((text) => !home.includes(text))
if (missingCopy.length) {
  console.error('Missing expected home-page content:')
  for (const text of missingCopy) console.error(`- ${text}`)
  process.exit(1)
}

console.log('Build verification passed.')
