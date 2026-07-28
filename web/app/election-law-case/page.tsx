import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { electionLawCase as c } from '../../lib/election-law-case'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'The even-year election law case — what Riverhead spent',
  description:
    "What the Town of Riverhead paid outside counsel to fight New York's even-year election law before quietly withdrawing — the disclosed figures, the timeline, and what's still unknown.",
}

export default function ElectionLawCasePage() {
  return (
    <PageShell title={c.title} subtitle={c.subtitle}>
      <PlainCallout title="The number on the record">
        Riverhead has paid <strong>{usd(c.paidDisclosed)}</strong> to {c.firm} for {c.paidPeriod} — its{' '}
        one-<strong>{c.jointEntities}th</strong> share of the firm&apos;s <strong>{usd(c.jointTotal)}</strong> bill to a
        joint retainer of {c.jointEntities} Long Island governments. That is the <em>disclosed</em> amount for one
        stretch of the case; the Town&apos;s total cost has not been released.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Paid so far (disclosed)" value={usd(c.paidDisclosed)} sub={c.paidPeriod} accent />
        <Stat label="Firm's joint-retainer bill" value={usd(c.jointTotal)} sub={`split ${c.jointEntities} ways`} />
        <Stat label="Riverhead's total cost" value="Not released" sub="FOIL outstanding" red />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What the case was about</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{c.whatItWasAbout}</p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Timeline</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {c.timeline.map((t) => (
            <div key={t.date} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, alignItems: 'baseline' }}>
              <span style={{ color: '#4a7297', fontWeight: 800, fontSize: 13 }}>{t.date}</span>
              <span style={{ color: '#334155', fontSize: 14, lineHeight: 1.5 }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #c2410c' }}>
        <h3 style={{ marginTop: 0, color: '#7c2d12' }}>What&apos;s still unknown</h3>
        <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {c.unknowns.map((u) => <li key={u}>{u}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16, background: '#f8fafc' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Do the state travel rules apply here?</h3>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{c.travelRuleNote}</p>
        <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          For reference, the yardstick for any billed mileage would be the IRS standard rate, which the IRS set at{' '}
          <strong>{(c.irsMileageRate2026 * 100).toFixed(1)}¢ per mile for 2026</strong>, alongside the OSC Travel
          Manual&apos;s meal and lodging caps (both linked below). This page does not compute a recoverable amount —
          there are no itemized invoices on the record to test against these limits.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #4a7297' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Questions worth asking</h3>
        <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {c.questionsToAsk.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </section>

      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.6 }}>
        Sources:{' '}
        {c.sources.map((s, i) => (
          <span key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700 }}>{s.title}</a>
            {i < c.sources.length - 1 ? ' · ' : '.'}
          </span>
        ))}
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, red }: { label: string; value: string; sub: string; accent?: boolean; red?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? '#b91c1c' : '#284a69' }}>{value}</strong>
      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
