import PageShell from '../../components/PageShell'
import PayrollExplorer from '../../components/PayrollExplorer'
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
          { label: 'Base pay', text: 'is the regular salary or wage. Overtime is extra pay for hours beyond the normal schedule. Gross pay is everything added together for the year.' },
          { label: 'Search a name', text: 'or filter by year, union (bargaining group), or department. Click a column heading to sort; click a name to see that person across years.' },
          { label: 'Good to know', text: 'these are amounts actually paid out, so gross pay can include stipends, longevity, and buy-outs on top of base pay and overtime.' },
        ]}
      >
        This page shows <strong>what the Town actually paid each employee</strong> each year — similar to the statewide
        SeeThroughNY payroll database, but focused on Riverhead.
      </PlainCallout>
      <PayrollExplorer />
    </PageShell>
  )
}
