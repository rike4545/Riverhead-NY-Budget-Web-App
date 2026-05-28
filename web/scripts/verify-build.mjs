import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'app/page.tsx',
  'components/FiscalCommandCenter.tsx',
  'components/InteractiveDashboard.tsx',
  'lib/all-funds.ts',
  'lib/analytics-modules.ts',
  'lib/department-drilldowns.ts',
  'lib/financial-data.ts',
  'lib/financial-reports-archive.ts',
  'lib/intelligence.ts',
  'lib/retirement-risk-analysis.ts',
  'lib/source-documents.ts',
  'lib/surplus-scenarios.ts',
]

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)))
if (missing.length) {
  console.error('Missing required files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const page = readFileSync(join(root, 'app/page.tsx'), 'utf8')
if (!page.includes('FiscalCommandCenter') && !page.includes('InteractiveDashboard')) {
  console.error('app/page.tsx is not wired to a dashboard component.')
  process.exit(1)
}

const commandCenter = existsSync(join(root, 'components/FiscalCommandCenter.tsx'))
  ? readFileSync(join(root, 'components/FiscalCommandCenter.tsx'), 'utf8')
  : ''

const requiredCopy = [
  'Not an official Town website',
  'All Operating Funds',
  'Fund Balance / Reserve Use',
  'Scenario Lab',
  'Early Retirement Risk Review',
  'Automation and Analytics Modules',
]

const missingCopy = requiredCopy.filter((text) => !commandCenter.includes(text))
if (missingCopy.length) {
  console.error('Missing required interface sections:')
  for (const text of missingCopy) console.error(`- ${text}`)
  process.exit(1)
}

if (!existsSync(join(root, 'out', 'index.html'))) {
  console.error('Static export failed: out/index.html was not generated.')
  process.exit(1)
}

console.log('Build verification passed.')
