import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { buyout2026 as b } from '../../lib/buyout-2026'

const base = '/rike4545-riverhead-budget-live'
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: '2026 Early Retirement Buyout — final terms',
  description:
    'The Town of Riverhead’s 2026 Voluntary Retirement Incentive Program: the final CSEA, PBA, and SOA buyout terms, eligibility, deadlines, and what each retiree receives.',
}

export default function BuyoutPage() {
  return (
    <PageShell
      title="2026 Early Retirement Buyout"
      subtitle="The Town’s 2026 Voluntary Retirement Incentive Program — the final, executed terms offered to eligible CSEA, police (PBA), and superior-officer (SOA) employees who retire this year."
    >
      <PlainCallout
        tips={[
          { label: 'What a buyout is', text: 'a one-time payment the Town offers to encourage eligible longtime employees to retire now, so it can reshape or trim staffing and reduce future payroll cost.' },
          { label: 'This is final language', text: 'these are the actual executed union agreements (not a proposal or a model), transcribed from the Town Board agenda.' },
          { label: 'Two deadlines', text: 'an eligible employee must commit in writing by September 1, 2026 and retire by October 1, 2026.' },
        ]}
      >
        In 2026 the Town reached agreements with all three of its unions to offer a <strong>voluntary early-retirement
        buyout</strong>. This page lays out exactly who qualifies, the deadlines, and what each retiree is paid.
      </PlainCallout>

      {/* Status + timeline */}
      <section style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: 12.5, padding: '5px 12px', borderRadius: 999 }}>
          Status: {b.status}
        </div>
        <p style={{ color: '#475569', margin: '12px 0 14px', lineHeight: 1.55 }}>{b.agendaNote}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {b.timeline.map((t) => (
            <div key={t.date} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ color: '#1f5f8f', fontWeight: 900 }}>{t.date}</div>
              <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.45, marginTop: 4 }}>{t.event}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Per-union programs */}
      <h2 style={{ color: '#12385b' }}>What each retiree receives</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 18 }}>
        {b.programs.map((p) => (
          <article key={p.unit} style={{ ...card, borderTop: '5px solid #c99a2e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, color: '#12385b' }}>{p.unit}</h3>
              <a href={`${base}/meetings/`} title="Ratifying resolution" style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textDecoration: 'none' }}>{p.resolution} →</a>
            </div>
            <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2, lineHeight: 1.4 }}>{p.unitFull}</div>
            <div style={{ background: '#dcfce7', color: '#166534', fontWeight: 900, fontSize: 15, padding: '8px 12px', borderRadius: 10, margin: '12px 0' }}>{p.benefitSummary}</div>
            <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.5, paddingLeft: 18, margin: '0 0 10px' }}>
              {p.benefitDetail.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.45, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
              <strong>Retirement system:</strong> {p.retirementSystem}<br />
              {p.serviceRequirement}
            </div>
          </article>
        ))}
      </section>

      {/* Eligibility + terms */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 18 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Who is eligible</h3>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>An employee must meet all of these:</p>
          <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
            {b.commonEligibility.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>What they must do</h3>
          <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
            {b.commonTerms.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </section>

      {/* Why it matters */}
      <section style={{ ...card, marginBottom: 18, background: '#eef6ff', border: '1px solid #bcd9f5' }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>Why this matters for the budget</h3>
        <p style={{ color: '#1f3a52', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Personnel is the Town’s largest controllable cost. A buyout trades a one-time payment now for the chance to
          hold positions vacant, consolidate roles, or refill at lower cost — turning recurring payroll pressure into a
          near-term expense. Used well it can support tax stabilization and reserve health; used poorly it spends money
          without proving lasting savings. You can see the workforce it applies to in the{' '}
          <a href={`${base}/payroll/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>Payroll Explorer</a>, and the
          ratifying votes in the{' '}
          <a href={`${base}/meetings/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>Town Board Votes</a> record.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Important caveats</h3>
        <ul style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
          {b.caveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {b.source.title}. Transcribed from the official agenda packet. Verify against the executed agreements and
        the adopted resolutions before relying on these terms.
      </p>
    </PageShell>
  )
}
