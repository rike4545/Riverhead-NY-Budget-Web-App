import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

const pagePath = path('out/spending-reduction-2027/index.html')
const componentPath = path('components/SpendingReductionToggleList.tsx')

if (!existsSync(pagePath)) fail('Spending-reduction page export is missing')
if (!existsSync(componentPath)) fail('Spending-reduction builder source is missing')

if (existsSync(pagePath)) {
  const html = readFileSync(pagePath, 'utf8')
  for (const text of [
    '2% planning proxy',
    'not Riverhead’s final legal tax-cap shortfall',
    'The retirement incentive is authorized. The savings are not yet booked.',
    'Realized savings',
    'A defensible order of operations',
    'What can actually be reduced?',
    'claim-spending-2027-proxy-gap',
    'claim-spending-2027-retirement-status',
  ]) if (!html.includes(text)) fail(`Spending-plan experience regressed: missing ${text}`)

  for (const forbidden of [
    'on track to blow past the tax cap',
    'on track to pierce the state tax cap',
    'cap-piercing gap',
    'Two things the Town has largely in hand already',
  ]) if (html.includes(forbidden)) fail(`Spending-plan certainty regressed: found ${forbidden}`)
}

if (existsSync(componentPath)) {
  const source = readFileSync(componentPath, 'utf8')
  for (const text of [
    '2% planning-proxy gap',
    'not booked savings',
    'Select firm line trims',
    'starts with nothing selected',
    'aria-pressed={selected}',
  ]) if (!source.includes(text)) fail(`Spending builder contract regressed: missing ${text}`)
  if (source.includes('grandSelected / modeledAutomaticPayrollPressure')) fail('Builder primary progress reverted to the smaller payroll-pressure gap')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Spending-plan verification passed: planning-proxy framing, pending retirement status, conservative builder defaults, and evidence state are intact.')
