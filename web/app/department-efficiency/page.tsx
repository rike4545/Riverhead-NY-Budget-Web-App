import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import DepartmentEfficiency from '../../components/DepartmentEfficiency'
import { departmentMeasures, type HistoryLine, type OneOff } from '../../lib/dept-efficiency'
import { plainAccountName, departmentName, FUND_NAMES, isFundWide } from '../../lib/account-names'
import { ONE_OFF_EXPLAINED } from '../../lib/account-changes'
import { riverheadPopulation } from '../../lib/population'
import lineHistory from '../../public/data/budget-supplement/line-history.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

export const metadata = {
  title: 'Department efficiency',
  description: 'Compare the Town of Riverhead’s departments and cost centers on spending, growth, cost per resident and how close they come to budget, see which lines a review would start with, and print survey kits for residents and staff.',
}

const oneOffs: OneOff[] = Object.entries(ONE_OFF_EXPLAINED).map(([account, o]) => ({ account, year: o.year, amount: o.amount, number: o.number }))
const actualYears = lineHistory.actualYears as number[]
const adoptedYears = lineHistory.adoptedYears as number[]
const departments = departmentMeasures(lineHistory.accounts as unknown as HistoryLine[], { plainAccountName, departmentName, FUND_NAMES, isFundWide }, actualYears, adoptedYears, riverheadPopulation.estimate, oneOffs)
const lastYear = Math.max(...actualYears)
const currentYear = Math.max(...adoptedYears)

export default function DepartmentEfficiencyPage() {
  return (
    <PageShell
      title="Department efficiency"
      subtitle={`How each department and cost center has spent, against its budget, from ${Math.min(...actualYears)} to ${lastYear}, with the lines and questions a review would start with, and survey kits to hear from residents and staff.`}
    >
      <PlainCallout
        tips={[
          { label: 'Cost center', text: 'a fund and function in the Town’s accounts, such as the General Fund’s Police (A01-3120) or the Highway Fund’s snow removal (DA1-5142).' },
          { label: 'From budget', text: 'how far actual spending landed from the original adopted budget, on average. Smaller means the budget was a better guide.' },
          { label: 'Not a finding', text: 'the measures point to questions. Only the department can say why a number moved.' },
        ]}
      >
        Every figure here comes from the Town’s Budget Supplements: actual spending for each year from {Math.min(...actualYears)} to {lastYear}, adopted
        budgets from {Math.min(...adoptedYears)} to {currentYear}, and the {lineHistory.budgetYear} Preliminary budget. Employee benefits are budgeted for each
        fund as a whole, so they are not in any department’s figures. One-time entries the records explain are taken out ({oneOffs.map((o) => `Resolution ${o.number}`).join(', ')});
        see <a href={`${base}/outliers/#by-category`} style={link}>Unusual spending patterns</a>. The budget records show cost, not output, so the surveys
        and questions are how a review learns what the money buys.
      </PlainCallout>
      <DepartmentEfficiency
        departments={departments}
        lastYear={lastYear}
        currentYear={currentYear}
        budgetYear={lineHistory.budgetYear}
        population={riverheadPopulation.estimate}
        populationAsOf={riverheadPopulation.asOf}
      />
    </PageShell>
  )
}
