import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function Page() {
  return (
    <PageShell
      title="Where does Riverhead’s money go?"
      subtitle="This is the whole Town budget — payroll, every fund, Town Board votes, the retirement buyout, the tax cap — pulled out of dense PDFs and explained the way you’d want a knowledgeable neighbor to explain it. Poke around; nothing here needs a finance degree."
    >
      {/* The front door is now the question layer, not the tour. Someone arriving
          cold has a question, not an appetite for a 13-stop walkthrough — so the
          tour stays one click away rather than being the only way in. */}
      <div style={{
        background: 'linear-gradient(100deg,#0f2942,var(--rbl-fill-accent))', color: 'white',
        borderRadius: 16, padding: '22px 24px', marginBottom: 18, boxShadow: '0 14px 34px var(--rbl-shadow)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9fd0ef' }}>Start with a question</div>
        <div style={{ fontSize: 25, fontWeight: 900, margin: '4px 0 6px' }}>What do you want to know about Riverhead&rsquo;s money?</div>
        <div style={{ color: '#cbdcec', fontSize: 14.8, lineHeight: 1.55, maxWidth: 720 }}>
          Why your taxes went up. What the Town spends. Who earns what. How much it owes. What happens next year.
          Every answer carries the real figure and a link to the page that proves it.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {[
            ['Why did my property taxes go up?', '/answers/#my-taxes'],
            ['Who is the highest-paid Town employee?', '/answers/#people'],
            ['How much does Riverhead owe?', '/answers/#debt'],
            ['Will my taxes go up again in 2027?', '/answers/#next-year'],
          ].map(([label, href]) => (
            <a key={href} href={`${base}${href}`} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.28)', color: 'white', fontWeight: 700, fontSize: 13.4, padding: '7px 13px', borderRadius: 999, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 16 }}>
          <a href={`${base}/answers/`} style={{ background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', fontWeight: 900, padding: '12px 22px', borderRadius: 10, whiteSpace: 'nowrap', textDecoration: 'none' }}>See all the questions &rarr;</a>
          <span style={{ color: '#cbdcec', fontSize: 13.8 }}>
            Prefer a walkthrough? <a href={`${base}/explore/`} style={{ color: '#9fd0ef', fontWeight: 800 }}>Take the 13-stop tour</a>
            {' '}&middot;{' '}
            <a href={`${base}/guide/`} style={{ color: '#9fd0ef', fontWeight: 800 }}>Plain-English guide</a>
          </span>
        </div>
      </div>
      <FiscalCommandCenter />
    </PageShell>
  )
}
