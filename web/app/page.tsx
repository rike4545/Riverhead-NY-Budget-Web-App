import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function Page() {
  return (
    <PageShell
      title="Where does Riverhead’s money go?"
      subtitle="This is the whole Town budget — payroll, every fund, Town Board votes, the retirement buyout, the tax cap — pulled out of dense PDFs and explained the way you’d want a knowledgeable neighbor to explain it. Poke around; nothing here needs a finance degree."
    >
      {/* Single "start here" banner — the 11-stop tour, with the plain-English
          glossary/guide as a secondary link (these used to be two separate CTAs). */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between',
        background: 'linear-gradient(100deg,#0f2942,var(--rbl-fill-accent))', color: 'white',
        borderRadius: 16, padding: '20px 24px', marginBottom: 18, boxShadow: '0 14px 34px var(--rbl-shadow)',
      }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9fd0ef' }}>New here? Start here</div>
          <div style={{ fontSize: 23, fontWeight: 900, margin: '4px 0 2px' }}>Explore the Riverhead Town Budget</div>
          <div style={{ color: '#cbdcec', fontSize: 14.5 }}>
            An 11-stop, plain-English walkthrough — from “what is the budget?” to the raw data. Prefer definitions first?{' '}
            <a href={`${base}/guide/`} style={{ color: '#9fd0ef', fontWeight: 800 }}>Open the plain-English guide →</a>
          </div>
        </div>
        <a href={`${base}/explore/`} style={{ background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', fontWeight: 900, padding: '12px 22px', borderRadius: 10, whiteSpace: 'nowrap', textDecoration: 'none' }}>Start the tour →</a>
      </div>
      <FiscalCommandCenter />
    </PageShell>
  )
}
