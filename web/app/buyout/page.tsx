import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BuyoutEligible, { type EligibleEmployee } from '../../components/BuyoutEligible'
import { buyout2026 as b } from '../../lib/buyout-2026'
import analysis from '../../public/data/buyout-analysis.json'

const base = '/rike4545-riverhead-budget-live'
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

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

      {/* Cost & savings analysis */}
      <h2 id="cost" style={{ color: '#12385b' }}>What it costs — and will the Town save money?</h2>
      <PlainCallout title="The short answer">
        <strong>It depends on what the Town does with the vacated jobs — but the math favors savings.</strong> The
        payment is small next to the salaries: about {usd(analysis.perRetiree.cseaIncentive)} per CSEA retiree and
        roughly {usd(analysis.perRetiree.policeAvgIncentive)} per police retiree, against average base salaries of
        {' '}{usd(analysis.perRetiree.cseaAvgBase)} (CSEA) and {usd(analysis.perRetiree.policeAvgBase)} (police). If jobs
        are refilled at a lower starting step, the Town recovers the payment in about{' '}
        {analysis.breakEvenYears_refill80.csea}–{analysis.breakEvenYears_refill80.police} years and saves after that.
        If jobs are held vacant, savings are immediate. Only if every job is refilled at the same cost is it a pure
        one-time expense.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 14 }}>
        <Stat label="Eligible (upper bound)" value={String(analysis.eligibility.totalCount)} sub={`${analysis.eligibility.csea.count} CSEA · ${analysis.eligibility.police.count} police`} />
        <Stat label="Their annual base salary" value={usd(analysis.eligibility.totalAnnualBase)} sub="reshapeable payroll" accent />
        <Stat label="Max one-time cost" value={usd(analysis.oneTimeCostMax)} sub="if everyone eligible takes it" />
        <Stat label="Break-even (refill at lower step)" value={`~${analysis.breakEvenYears_refill80.csea}–${analysis.breakEvenYears_refill80.police} yrs`} />
      </section>

      <section style={{ ...card, marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Cost and yearly savings by how many take the buyout</h3>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>Participation won&apos;t be known until the September 1, 2026 deadline. Yearly savings depend on whether each vacated job is refilled at the same cost, refilled cheaper (a new hire starts at a lower step), or held open.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>If this many take it</th>
                <th style={{ ...th, textAlign: 'right' }}>Retirees</th>
                <th style={{ ...th, textAlign: 'right' }}>One-time cost</th>
                <th style={{ ...th, textAlign: 'right' }}>Refill same cost</th>
                <th style={{ ...th, textAlign: 'right' }}>Refill cheaper (~20%)</th>
                <th style={{ ...th, textAlign: 'right' }}>Hold vacant</th>
              </tr>
            </thead>
            <tbody>
              {analysis.scenarios.map((s) => (
                <tr key={s.uptakePct} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}><strong>{s.uptakePct}% of eligible</strong></td>
                  <td style={{ ...td, textAlign: 'right' }}>{s.retirees}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{usd(s.oneTimeCost)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#94a3b8' }}>$0/yr</td>
                  <td style={{ ...td, textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{usd(s.annualSavings_refill80)}/yr</td>
                  <td style={{ ...td, textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{usd(s.annualSavings_holdVacant)}/yr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          &quot;Refill cheaper&quot; assumes a replacement hired at ~80% of the retiree&apos;s pay (a new employee near the
          bottom of the salary scale). Savings recur every year; the one-time cost is paid once.
        </p>
      </section>

      {analysis.realisticBackfill && (
        <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid #15803d' }}>
          <h3 style={{ marginTop: 0 }}>A more realistic backfill (using the actual salary steps)</h3>
          <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>
            The 20% figure above is a round number. Using the Town&apos;s actual salary schedule — where each job has a
            full ladder of steps from entry to top — the gap between a long-tenured retiree and a new hire is usually
            much larger. For the {analysis.realisticBackfill.matched} eligible positions where the schedule shows an
            entry step, refilling each at the bottom of the scale would cut their combined salary from
            {' '}<strong>{usd(analysis.realisticBackfill.currentBase)}</strong> to
            {' '}<strong>{usd(analysis.realisticBackfill.replacementAtEntryStep)}</strong> — an annual salary saving of
            {' '}<strong style={{ color: '#15803d' }}>{usd(analysis.realisticBackfill.annualSavings)}/yr</strong>
            {' '}(about {analysis.realisticBackfill.savedShare}% of their pay, not 20%).
          </p>
          <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
            The effect is largest for police: a top-step officer earns well over $110,000, while a new officer starts
            near <strong>{usd(analysis.realisticBackfill.policeOfficerEntryStep ?? 0)}</strong> — so replacing one with
            a rookie saves roughly <strong>$60,000 a year</strong>, every year. (This is a salary figure only;
            an academy-trained replacement also carries training costs, and the Town may choose to hold the post open
            instead.)
          </p>
        </section>
      )}

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>How this estimate was built &amp; its limits</h3>
        <ul style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
          {analysis.assumptions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </section>

      {/* Who appears eligible */}
      <h2 id="eligible" style={{ color: '#12385b' }}>Which employees appear eligible</h2>
      <PlainCallout title="Read this first">
        These are current employees whose <strong>hire date and union</strong> match the program&apos;s service
        requirements — an <strong>estimate, not a decision</strong>. Actual eligibility also depends on age and pension
        tier, which payroll doesn&apos;t show, and taking the buyout is entirely voluntary. Listing someone here does
        not mean they are retiring. Names and hire dates are already public payroll records.
      </PlainCallout>
      <BuyoutEligible employees={analysis.eligibleEmployees as EligibleEmployee[]} />

      {/* 2019 vs 2026 */}
      <h2 id="compare2019" style={{ color: '#12385b', marginTop: 26 }}>How this compares to the 2019 buyout</h2>
      <PlainCallout title="No one can be counted twice">
        {analysis.reconciliation}
      </PlainCallout>
      <section style={{ ...card, marginBottom: 18 }}>
        <p style={{ color: '#475569', marginTop: 0, fontSize: 14.5, lineHeight: 1.55 }}>{analysis.compare2019.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}></th>
                <th style={th}>2019 program</th>
                <th style={th}>2026 program</th>
              </tr>
            </thead>
            <tbody>
              {analysis.compare2019.rows.map((r) => (
                <tr key={r.item} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#12385b', whiteSpace: 'nowrap' }}>{r.item}</td>
                  <td style={{ ...td, color: '#475569', lineHeight: 1.5 }}>{r.y2019}</td>
                  <td style={{ ...td, color: '#334155', lineHeight: 1.5 }}>{r.y2026}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          Sources: {analysis.compare2019.sources.join(' · ')}
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Important caveats</h3>
        <ul style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, paddingLeft: 18, margin: 0 }}>
          {b.caveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {b.source.title}. Transcribed from the official agenda packet. Cost estimate built from the Town&apos;s
        2025 Gross Earnings report (active employees, hire dates). Verify against the executed agreements and
        the adopted resolutions before relying on these terms.
      </p>
    </PageShell>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: '#12385b' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
