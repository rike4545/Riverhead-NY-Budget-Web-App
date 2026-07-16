import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

const base = '/Riverhead-NY-Budget-Web-App'

export default function Page() {
  return (
    <PageShell
      title="Where does Riverhead’s money go?"
      subtitle="This is the whole Town budget — payroll, every fund, Town Board votes, the retirement buyout, the tax cap — pulled out of dense PDFs and explained the way you’d want a knowledgeable neighbor to explain it. Poke around; nothing here needs a finance degree."
    >
      <a href={`${base}/explore/`} style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between',
        textDecoration: 'none', background: 'linear-gradient(100deg,#0f2942,#1f5f8f)', color: 'white',
        borderRadius: 16, padding: '20px 24px', marginBottom: 18, boxShadow: '0 14px 34px rgba(15,23,42,.14)',
      }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9fd0ef' }}>New here? Take the tour</div>
          <div style={{ fontSize: 23, fontWeight: 900, margin: '4px 0 2px' }}>Explore the Riverhead Town Budget</div>
          <div style={{ color: '#cbdcec', fontSize: 14.5 }}>A 10-stop, plain-English walkthrough — from “what is the budget?” to the raw data.</div>
        </div>
        <span style={{ background: '#38bdf8', color: '#08263c', fontWeight: 900, padding: '12px 22px', borderRadius: 10, whiteSpace: 'nowrap' }}>Start the tour →</span>
      </a>
      <FiscalCommandCenter />
    </PageShell>
  )
}
