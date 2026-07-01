import PageShell from '../../components/PageShell'
import PayrollTabs from '../../components/PayrollTabs'
import PlainCallout from '../../components/PlainCallout'
import { payrollYears } from '../../lib/payroll'

export default function PayrollPage() {
  return (
    <PageShell
      title="Riverhead Payroll Explorer"
      subtitle={`A searchable, SeeThroughNY-style record of actual Town of Riverhead employee earnings ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]} — base pay, overtime, and total gross pay by employee, title, department, and union.`}
    >
      <PlainCallout
        tips={[
          { label: 'Two views', text: 'use the tabs below — "Actual Pay" is what employees were really paid (2018–2023); "Authorized Salary" is the base pay the Town Board set for 2025.' },
          { label: 'Base vs. actual', text: 'authorized salary is the base rate; actual gross pay adds overtime, longevity, and buy-outs — so actual often exceeds the authorized base.' },
          { label: 'Search & sort', text: 'search a name or title, filter by year/union/group, and click a column heading to sort. In Actual Pay, click a name to follow that person across years.' },
        ]}
      >
        This page shows <strong>what the Town pays its people</strong> — both what employees were actually paid and what
        the Board authorized — similar to the statewide SeeThroughNY payroll database, but focused on Riverhead.
      </PlainCallout>
      <PayrollTabs />
    </PageShell>
  )
}
