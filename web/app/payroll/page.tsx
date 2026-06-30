import PageShell from '../../components/PageShell'
import PayrollExplorer from '../../components/PayrollExplorer'
import { payrollYears } from '../../lib/payroll'

export default function PayrollPage() {
  return (
    <PageShell
      title="Riverhead Payroll Explorer"
      subtitle={`A searchable, SeeThroughNY-style record of actual Town of Riverhead employee earnings ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]} — base pay, overtime, and total gross pay by employee, title, department, and union.`}
    >
      <PayrollExplorer />
    </PageShell>
  )
}
