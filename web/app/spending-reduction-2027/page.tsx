import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure } from '../../lib/spending-reduction-2027'
import { builtFromDocuments } from '../../lib/built-from-documents'
import { acrossTheBoard2027 as atb } from '../../lib/across-the-board-2027'
import { capGap2027, firmRecurringTotal, retirementIncentive2027 as ri, gapClosingPaths } from '../../lib/close-the-gap-2027'

const STANDING: Record<string, { label: string; color: string; bg: string }> = {
  'already agreed': { label: 'Already agreed · 5–0', color: '#166534', bg: '#dcfce7' },
  'low-friction': { label: 'Low partisan friction', color: '#166534', bg: '#dcfce7' },
  neutral: { label: 'Neutral · no service cut', color: '#1e40af', bg: '#dbeafe' },
  'one-time': { label: 'One-time · bridge only', color: '#92400e', bg: '#fef3c7' },
  deliberate: { label: 'Legal if done in the open', color: '#7c3aed', bg: '#f3e8ff' },
  blunt: { label: 'Blunt · overstated', color: '#b91c1c', bg: '#fee2e2' },
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const KIND: Record<string, { color: string; bg: string }> = {
  budget: { color: '#1e40af', bg: '#dbeafe' },
  supplement: { color: '#166534', bg: '#dcfce7' },
  afr: { color: '#92400e', bg: '#fef3c7' },
}

export const metadata = {
  title: '2027 Spending Reduction — a real, sourced savings package',
  description:
    'Every real, individually-sourced recurring spending-reduction candidate identified for the 2027 budget, toggleable so you can build your own package and see it against the modeled payroll-pressure gap.',
}

export default function SpendingReduction2027Page() {
  return (
    <PageShell
      title="2027 Spending Reduction"
      subtitle="A real, sourced recurring spending-reduction package for the 2027 budget — not a wishlist. Toggle items to build your own package and watch it move against the modeled payroll-pressure gap."
    >
      {/* 1 — Two different gaps: which one actually binds. */}
      <PlainCallout title="Two different “gaps” — and which one actually binds">
        You&apos;ll see two gap numbers in the 2027 views, and they measure different things. The{' '}
        <strong>payroll-pressure gap</strong> ({usd(modeledAutomaticPayrollPressure)}) is the recurring cost of
        standing still — the automatic wage growth the Town must cover to keep the same staff. The number that
        actually forces a decision is bigger: the projected 2027 levy overshoots New York&apos;s 2% property-tax cap
        by about <strong>{usd(capGap2027.gap)}</strong> (a ~{capGap2027.predictedLevyPct}% levy against a ~
        {capGap2027.capBasePct}% ceiling). That is the real overage to resolve — and the Town has only a handful of
        legal ways to do it. The package below is sized in real, individually-sourced recurring dollars so it can be
        measured against <em>either</em> gap. Toggle any item to build your own.
      </PlainCallout>

      {/* 1b — Resolving the real $2.62M cap gap, honestly. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #15803d' }}>
        <h2 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 17 }}>
          Closing the {usd(capGap2027.gap)} without piercing the cap
        </h2>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          The honest claim isn&apos;t that this is easy — it&apos;s that the overage can be closed with{' '}
          <strong>recurring, sourced measures</strong>, not a one-time reserve raid or an accidental cap breach. Two
          building blocks the Town has largely in hand already come to about the full gap:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, margin: '14px 0' }}>
          <Tile label="Retirement-incentive savings" value={`${usd(ri.projectedSavingsLow)}–${usd(ri.projectedSavingsHigh)}`} note="Town projection · already adopted 5–0" green />
          <Tile label="Firm-confidence sourced trims" value={usd(firmRecurringTotal)} note="Excludes volatile fuel/energy & capital-timing items" green />
          <Tile label="Combined vs. the cap gap" value={`${Math.round(((ri.projectedSavingsLow + firmRecurringTotal) / capGap2027.gap) * 100)}–${Math.round(((ri.projectedSavingsHigh + firmRecurringTotal) / capGap2027.gap) * 100)}%`} note={`of the ${usd(capGap2027.gap)} overage`} accent />
        </div>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          In other words, the unanimous retirement incentive plus only the <em>firmest</em> line trims — nothing
          volatile, no fund-balance appropriation, no override — already sum to roughly the entire {usd(capGap2027.gap)}{' '}
          gap. The full toggle package below ({usd(fullRecurringReductionPackage)}) leaves real headroom for the parts
          that depend on 2027 project timing or successor labor terms.
        </p>
      </section>

      {/* 2 — The interactive package (centerpiece). */}
      <div style={{ marginTop: 16 }}>
        <SpendingReductionToggleList />
      </div>

      {/* 2b — The retirement incentive as a gap-closing lever. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #15803d' }}>
        <h2 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 17 }}>
          The 2026 retirement incentive: {ri.eligibleTotal} eligible, savings the Town already put a number on
        </h2>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          On July 7, 2026 the Town Board unanimously approved three voluntary retirement incentives (resolutions{' '}
          {ri.resolutions}). The Town projects <strong>{usd(ri.projectedSavingsLow)}–{usd(ri.projectedSavingsHigh)}</strong>{' '}
          in savings over {ri.savingsWindow}. That saving is real because a top-of-scale departure refilled at a lower
          step — or not refilled — is recurring payroll relief, which is exactly the kind of pressure the gap above is
          made of.
        </p>
        <div style={{ display: 'grid', gap: 8, margin: '14px 0' }}>
          {ri.eligible.map((u) => (
            <div key={u.unit} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ color: '#284a69', fontWeight: 700, fontSize: 14 }}>
                {u.unit} <span style={{ color: '#64748b', fontWeight: 600 }}>· {u.count} eligible</span>
              </span>
              <span style={{ color: '#475569', fontSize: 13 }}>{u.benefit}</span>
            </div>
          ))}
        </div>
        <p style={{ color: '#334155', fontSize: 13.8, lineHeight: 1.6, margin: 0 }}>
          Eligible employees must elect by <strong>{ri.electionDeadline}</strong> and retire by{' '}
          <strong>{ri.retireBy}</strong>. A concrete example of the departures in this window: a 30-year Riverhead
          police officer (P.O. Michael Mowdy) retired in July 2026 — the Town did not state whether his retirement was
          under the incentive, but it is the kind of senior, top-of-scale exit whose refill cost drives the saving.
        </p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          {ri.note} Executed program terms: resolutions {ri.resolutions} (see the Town Board Votes record).
          Savings projection: RiverheadLOCAL, July 9, 2026.
        </p>
      </section>

      {/* 2c — The politically durable path. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #7c3aed' }}>
        <h2 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 17 }}>The best way forward through a split board</h2>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 4px' }}>
          Closing the gap isn&apos;t only arithmetic — it has to pass a divided Town Board. Riverhead&apos;s is a{' '}
          <strong>Democratic Supervisor with a four-member Republican Council majority</strong>. Under NY Town Law the
          Supervisor prepares the tentative budget and the Council adopts it, so a durable plan needs buy-in from both.
          The levers below are ordered by how well each survives that split — least partisan first.
        </p>
        <div style={{ display: 'grid', gap: 10, margin: '14px 0 0' }}>
          {gapClosingPaths.map((p, i) => {
            const s = STANDING[p.standing]
            return (
              <div key={p.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: '#6b7280', fontWeight: 900, fontSize: 13 }}>{i + 1}</span>
                  <span style={{ color: '#284a69', fontWeight: 800, fontSize: 14.5, flex: 1, minWidth: 180 }}>{p.name}</span>
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22`, borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                <div style={{ color: '#1f7a5c', fontWeight: 700, fontSize: 13, margin: '6px 0 4px' }}>Closes: {p.closes}</div>
                <div style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55 }}>{p.politics}</div>
              </div>
            )
          })}
        </div>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: '14px 0 0' }}>
          <strong>The pragmatic reading:</strong> start with what already carries bipartisan support (the 5–0 retirement
          incentive), stack the audit-driven trims and any non-tax revenue on top — none of which asks either side to
          hand the other a political win — and reserve one-time fund balance for the small residual. A cap override
          stays available, but as a deliberate, disclosed choice rather than a number the budget backs into.
        </p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Board composition from the November 2025 results; budget roles per NY Town Law §§104–106. Cap-override
          mechanics per General Municipal Law §3-c (a 60% vote of the governing body).
        </p>
      </section>

      {/* 3 — Inflation / buying-power lens. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #c99a2e' }}>
        <h2 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 17 }}>In real terms: the cost of standing still</h2>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          Most of that {usd(modeledAutomaticPayrollPressure)} gap isn&apos;t new programs — it&apos;s the automatic
          cost-of-living growth built into payroll (the model uses a 2.5% COLA). Meanwhile New York&apos;s tax cap
          limits the Town&apos;s levy growth to the <em>lesser</em> of 2% or inflation. So contracted costs are set to
          rise about as fast as — or faster than — the revenue the Town is allowed to raise.
        </p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: '10px 0 0' }}>
          That cuts both ways when reading a &ldquo;cut.&rdquo; Because prices keep rising, a line that merely holds
          flat in dollars is already a real cut in what it buys — and a savings target set in today&apos;s dollars
          buys a little less each year it slips. The honest way to read this package is in <strong>recurring, real
          terms</strong>: it&apos;s about keeping recurring costs within recurring revenue as both are pushed by
          inflation, not a one-time patch.
        </p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Inflation reference: U.S. Bureau of Labor Statistics, Consumer Price Index. Levy-growth limit: NY&apos;s
          2% property-tax cap (the lesser of 2% or CPI).
        </p>
      </section>

      {/* 4 — The blunter alternative: a flat 2.5% cut. */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 17 }}>The blunter alternative: a flat 2.5% cut</h2>
        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 12px' }}>
          Instead of the targeted lines above, a Supervisor could simply tell every department to cut 2.5%. Here&apos;s
          how that actually pencils out — and why the blunt version overstates what&apos;s really cuttable.
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {atb.bases.map((b) => (
            <div key={b.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: '#284a69', fontWeight: 700, fontSize: 14 }}>{b.label}</span>
                <span style={{ color: '#1f7a5c', fontWeight: 900, fontSize: 16, whiteSpace: 'nowrap' }}>{usd(b.base * atb.cutPercent)}</span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 12.5, marginTop: 2 }}>{b.note}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '6px 8px' }}>Fund / department</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2026 tentative</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of all</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of controllable</th>
              </tr>
            </thead>
            <tbody>
              {atb.byFund.map((f) => (
                <tr key={f.fund} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px', color: '#284a69', fontWeight: 700 }}>{f.fund}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{usd(f.tentative)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(f.tentative * atb.cutPercent)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1f7a5c', fontWeight: 700 }}>{f.controllable ? usd(f.controllable * atb.cutPercent) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>{atb.takeaway}</p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Computed from the 2026 Budget Supplement line totals. &ldquo;Controllable&rdquo; excludes personnel and
          mandated costs (pension, debt service, insurance, payroll taxes) a flat directive can&apos;t change. Measured
          against the {usd(atb.gapToClose)} modeled payroll-pressure gap.
        </p>
      </section>

      {/* 5 — Compact provenance strip. */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', color: '#284a69', fontSize: 15 }}>Built from the Town&apos;s own documents</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {builtFromDocuments.map((doc) => {
            const k = KIND[doc.kind]
            return (
              <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: k.bg, color: k.color,
                  border: `1px solid ${k.color}22`, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
                {doc.title} ↗
              </a>
            )
          })}
        </div>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Links open the Town&apos;s DocumentCenter (townofriverheadny.gov). Blue = budget, green = supplement, amber =
          financial report.
        </p>
      </section>
    </PageShell>
  )
}

function Tile({ label, value, note, green, accent }: { label: string; value: string; note?: string; green?: boolean; accent?: boolean }) {
  const bg = accent ? '#dbeafe' : green ? '#dcfce7' : '#f8fafc'
  const valueColor = accent ? '#1e40af' : green ? '#166534' : '#284a69'
  return (
    <div style={{ background: bg, border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <div style={{ color: '#475569', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: valueColor, margin: '2px 0' }}>{value}</div>
      {note && <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.4 }}>{note}</div>}
    </div>
  )
}
