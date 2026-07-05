import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

export default function Page() {
  return (
    <PageShell
      title="Readable budget intelligence for residents."
      subtitle="Plain-English insights, fund drilldowns, payroll and salary records, Town Board votes, reserve-use tracking, and automated source parsing for Town of Riverhead financial documents."
    >
      <FiscalCommandCenter />
    </PageShell>
  )
}
