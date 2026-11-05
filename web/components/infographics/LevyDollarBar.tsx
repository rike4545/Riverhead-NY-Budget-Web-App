import StackedBar from '../charts/StackedBar'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { money } from './format'

// Where the Town's own 2026 levy goes, by fund. This is the Town's share of a
// property-tax bill only: county, school, fire and library taxes are billed
// separately and are not in the Town's budget, so they are not drawn here.
export default function LevyDollarBar() {
  const funds = allOperatingFunds2026.filter((f) => f.taxLevy2026 > 0)
  return (
    <StackedBar
      title="Where each dollar of the Town levy goes"
      lede="The Town’s 2026 property-tax levy split by fund. This is the Town’s share only, not your whole tax bill."
      source="Source: Town of Riverhead 2026 Adopted Budget, fund-level tax levy schedule. Shares are of the levies listed, calculated here."
      segments={funds.map((f) => ({ label: f.name, value: f.taxLevy2026 }))}
      format={money}
      keep={4}
      otherLabel="Other funds"
    />
  )
}
