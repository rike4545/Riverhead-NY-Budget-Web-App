import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

export default function Page() {
  return (
    <PageShell
      title="Where does Riverhead’s money go?"
      subtitle="This is the whole Town budget — payroll, every fund, Town Board votes, the retirement buyout, the tax cap — pulled out of dense PDFs and explained the way you’d want a knowledgeable neighbor to explain it. Poke around; nothing here needs a finance degree."
    >
      <FiscalCommandCenter />
    </PageShell>
  )
}
