import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure } from '../../lib/spending-reduction-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: '2027 Spending Reduction — a real, sourced savings package',
  description:
    'Every real, individually-sourced recurring spending-reduction candidate identified for the 2027 budget, toggleable so you can build your own package and see it against the modeled payroll-pressure gap.',
}

export default function SpendingReduction2027Page() {
  return (
    <PageShell
      title="2027 Spending Reduction"
      subtitle="A real, sourced recurring spending-reduction package for the 2027 budget — not a wishlist. Toggle items to build your own package and watch it move against the modeled payroll-pressure gap."
    >
      <PlainCallout title="Where this comes from">
        This totals <strong>{usd(fullRecurringReductionPackage)}</strong> — reconciled across the app&apos;s
        own three previously-inconsistent 2027 planning models, which used to disagree with each other by
        up to $12K on this same figure. It is deliberately not $2.75M: the largest driver in the 2027
        model, about $907.9K of modeled PBA/SOA/CSEA union wage growth, is contractually locked and stays
        on the pressure side of the budget rather than being counted as a lever here. The modeled 2027
        automatic payroll-pressure gap this package is measured against is{' '}
        <strong>{usd(modeledAutomaticPayrollPressure)}</strong>.
      </PlainCallout>

      <div style={{ marginTop: 16 }}>
        <SpendingReductionToggleList />
      </div>
    </PageShell>
  )
}
