import LineChart from '../charts/LineChart'
import { fundBalanceTiers, fundBalanceYears, policyMinimumPercent } from '../../lib/reserve-policy'
import generalFund from '../../public/data/history/general-fund.json'
import { pct1 } from './format'

// General Fund balance as a share of that year's adopted General Fund budget.
// The Town's policy (Resolution 2011-918) is written against the total balance;
// the site's own, stricter test is the Unassigned tier alone. Both are drawn
// against the policy's 15% floor.
export default function ReserveCushion() {
  const budgetBy = new Map((generalFund.rows as { year: number; appropriations: number }[]).map((r) => [String(r.year), r.appropriations]))
  const years = fundBalanceYears.filter((y) => budgetBy.has(y))
  if (years.length < 2) return null
  const val = (tier: string, y: string) => fundBalanceTiers.find((t) => t.name === tier)?.values[y] ?? 0
  const total = (y: string) => fundBalanceTiers.reduce((n, t) => n + (t.values[y] ?? 0), 0)
  const share = (n: number, y: string) => (n / (budgetBy.get(y) as number)) * 100
  const floor = policyMinimumPercent * 100
  return (
    <LineChart
      title="General Fund balance as a share of the budget"
      lede={`The Town’s policy calls for a total balance of at least ${floor}% of the General Fund budget. The unassigned line is the stricter test: money free for any use.`}
      source="Source: the audited General Fund statements, and the Town’s unaudited Annual Financial Report for a year with no audit yet, each year-end divided by that same year’s adopted General Fund appropriations, calculated here. The reserve figures elsewhere on this site measure the 2025 year-end against the 2026 budget, so their percentages are lower."
      categories={years}
      series={[
        { label: 'Total balance', color: 'var(--rbl-series-blue)', values: years.map((y) => share(total(y), y)) },
        { label: 'Unassigned only', color: 'var(--rbl-series-teal)', values: years.map((y) => share(val('Unassigned', y), y)) },
        { label: `Policy floor (${floor}%)`, color: 'var(--rbl-danger)', values: years.map(() => floor) },
      ]}
      format={pct1}
      height={260}
    />
  )
}
