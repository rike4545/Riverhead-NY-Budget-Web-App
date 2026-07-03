import PageShell from '../../components/PageShell'
import PayrollTabs from '../../components/PayrollTabs'
import PlainCallout from '../../components/PlainCallout'
import { payrollYears } from '../../lib/payroll'

export const metadata = {
  title: 'Payroll Explorer — employee pay, overtime & salaries',
  description:
    'Search actual Town of Riverhead employee pay 2018–2023 (base, overtime, gross), Board-authorized salaries for 2025 and 2026, and every raise between them.',
}

export default function PayrollPage() {
  return (
    <PageShell
      title="Riverhead Payroll Explorer"
      subtitle={`A searchable, SeeThroughNY-style record of actual Town of Riverhead employee earnings ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]} — base pay, overtime, and total gross pay by employee, title, department, and union.`}
    >
      <PlainCallout
        tips={[
          { label: 'Three views', text: 'use the tabs below — "Actual Pay" is what employees were really paid (2018–2023); "Authorized Salary" is the base pay the Board set for 2025; "Raises 2025→2026" shows who got a raise and by how much.' },
          { label: 'Base vs. actual', text: 'authorized salary is the base rate; actual gross pay adds overtime, longevity, and buy-outs — so actual often exceeds the authorized base.' },
          { label: 'Search & sort', text: 'search a name or title and click a column heading to sort. In Actual Pay, click a name to follow that person across years.' },
        ]}
      >
        This page shows <strong>what the Town pays its people</strong> — both what employees were actually paid and what
        the Board authorized — similar to the statewide SeeThroughNY payroll database, but focused on Riverhead.
      </PlainCallout>
      <PayrollTabs />
    </PageShell>
  )
}
