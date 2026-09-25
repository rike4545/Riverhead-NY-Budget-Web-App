import PageShell from '../../components/PageShell'
import TentativeReleased from '../../components/TentativeReleased'
import { released2027, statedLimitPct } from '../../lib/tentative-2027'
import { outcome } from '../../lib/buyout-2026'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure } from '../../lib/spending-reduction-2027'
import { builtFromDocuments } from '../../lib/built-from-documents'
import { acrossTheBoard2027 as atb } from '../../lib/across-the-board-2027'
import { capGap2027, firmRecurringTotal, retirementIncentive2027 as ri, gapClosingPaths } from '../../lib/close-the-gap-2027'
import { personnelPolicyItems } from '../../lib/spending-reduction-2027'
import { tentativeTrims as tt } from '../../lib/tentative-trims'
import { supplementSource } from '../../lib/supplement'

const STANDING: Record<string, { label: string; color: string; bg: string }> = {
  'already agreed': { label: 'Already agreed · 5–0', color: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)' },
  'low-friction': { label: 'Low partisan friction', color: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)' },
  neutral: { label: 'Neutral · no service cut', color: 'var(--rbl-info-text)', bg: 'var(--rbl-info-bg)' },
  'one-time': { label: 'One-time · bridge only', color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' },
  deliberate: { label: 'Legal if done in the open', color: 'var(--rbl-violet)', bg: 'var(--rbl-violet-bg)' },
  blunt: { label: 'Blunt · overstated', color: 'var(--rbl-danger)', bg: 'var(--rbl-danger-bg)' },
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const KIND: Record<string, { color: string; bg: string }> = {
  budget: { color: 'var(--rbl-info-text)', bg: 'var(--rbl-info-bg)' },
  supplement: { color: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)' },
  afr: { color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' },
}

// The firm package and the retirement incentive OVERLAP: firmRecurringTotal
// already contains a "targeted retirement + refill" line covering the same
// mechanism the incentive does. Adding them whole double-counted it and
// overstated coverage as 112–125%. Netting the overlap out first is the
// conservative reading, and the one this page shows.
const retirementRefillOverlap =
  personnelPolicyItems.find((i) => i.id === 'retirementRefill')?.amount ?? 0
const combined = (incentive: number) =>
  Math.round(((incentive + firmRecurringTotal - retirementRefillOverlap) / capGap2027.gap) * 100)
// Once the Tentative is out, the incentive is the saving it budgets, not the July range.
const budgeted = released2027 ? outcome.savings2027 : null
const comboLow = combined(budgeted ?? ri.projectedSavingsLow)
const comboHigh = combined(budgeted ?? ri.projectedSavingsHigh)

export const metadata = {
  title: '2027 Spending Reduction — how the Town can close the tax-cap gap',
  description: released2027
    ? `Before the Tentative, this site’s forecast had Riverhead’s 2027 levy about $${(capGap2027.gap / 1_000_000).toFixed(2)}M above a 2% increase. How the retirement incentive and sourced line trims could close that gap, with an interactive package, the politics, and the alternatives explained.`
    : `In plain terms: Riverhead’s 2027 budget is projected to pierce the tax cap by about $${(capGap2027.gap / 1_000_000).toFixed(2)}M. The retirement incentive plus sourced line trims close it — with an interactive package, the politics, and the alternatives explained.`,
}

export default function SpendingReduction2027Page() {
  return (
    <PageShell
      title="2027 Spending Reduction"
      subtitle={`${released2027 ? 'This site’s forecast had Riverhead’s 2027 budget piercing the state tax cap.' : 'Riverhead’s 2027 budget is on track to pierce the state tax cap.'} Here’s the plainest way to close the gap — start with the three-number plan, then dig in as far as you like.`}
    >
      <TentativeReleased>
        {released2027 && (statedLimitPct !== null
          ? <>So by the Town’s own account there is no cap gap left to close. The {usd(capGap2027.gap)} below is the forecast’s distance from a 2% increase, and the savings are measured against it.</>
          : released2027.levyVsReference > 0
            ? <>Against the same 2% line this page uses, that leaves {usd(released2027.levyVsReference)} to find, not the {usd(capGap2027.gap)} forecast below.</>
            : <>So it already holds the levy to a 2% increase or less. The savings below are measured against the forecast.</>)}
      </TentativeReleased>

      {/* THE PROBLEM — one clear framing, one number. */}
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ color: 'var(--rbl-danger)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>The problem</div>
        <h2 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)', fontSize: 21 }}>
          {released2027 ? `Before the Tentative, the forecast had the 2027 levy past a ${capGap2027.capBasePct}% increase by about` : 'The 2027 budget is on track to blow past the tax cap by about'} {usd(capGap2027.gap)}
        </h2>
        {released2027 ? (
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            On current trends the forecast had the tax levy rising about {capGap2027.predictedLevyPct}%. Holding it to a{' '}
            {capGap2027.capBasePct}% increase, the State&apos;s growth factor, meant finding roughly{' '}
            <strong>{usd(capGap2027.gap)}</strong>
            {statedLimitPct !== null && <>. The Supervisor has since put the Town&apos;s actual limit at {statedLimitPct}%, which leaves more room than {capGap2027.capBasePct}%</>}.
            The plan below shows the gap could be closed with real, recurring savings, with no reserve raid and no cap override.
          </p>
        ) : (
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            On current trends the tax levy would rise about {capGap2027.predictedLevyPct}% — but New York&apos;s cap
            allows only about {capGap2027.capBasePct}%. To stay under the cap, the Town has to find roughly{' '}
            <strong>{usd(capGap2027.gap)}</strong>. The good news: it can be done with real, recurring savings — no
            reserve raid, no cap override. Here&apos;s how.
          </p>
        )}
      </section>

      {/* THE ANSWER — the plan in three numbers. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-success)' }}>
        <h2 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 19 }}>The plan, in three numbers</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          Two things the Town has largely in hand already add up to the whole gap:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, margin: '14px 0' }}>
          <Tile
            label="1 · Retirement incentive"
            value={budgeted !== null ? usd(budgeted) : `${usd(ri.projectedSavingsLow)}–${usd(ri.projectedSavingsHigh)}`}
            note={budgeted !== null ? `Budgeted for 2027 · ${outcome.took.total} employees took it` : 'Town projection · already adopted 5–0'}
            green
          />
          <Tile label="2 · Sourced line trims" value={usd(firmRecurringTotal)} note="Only the firmest — no volatile fuel/energy or capital-timing items" green />
          <Tile label="Together" value={comboLow === comboHigh ? `${comboLow}%` : `${comboLow}–${comboHigh}%`} note={`of the ${usd(capGap2027.gap)} gap, after netting the overlap between the two`} accent />
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The unanimous retirement incentive plus only the <em>firmest</em> line trims cover essentially the entire
          gap. Everything below is the detail behind those two numbers — and the alternatives, for anyone who wants them.
        </p>
      </section>

      {/* WHAT THE TWO BUILDING BLOCKS ARE — two short cards. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 16, marginTop: 16 }}>
        <section style={{ ...card }}>
          <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16 }}>1 · The retirement incentive</h3>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: '0 0 10px' }}>
            On July 7, 2026 the Board unanimously approved three voluntary retirement incentives ({ri.eligibleTotal}{' '}
            eligible). The Town projected <strong>{usd(ri.projectedSavingsLow)}–{usd(ri.projectedSavingsHigh)}</strong>{' '}
            in savings over {ri.savingsWindow} — recurring payroll relief, exactly the kind of pressure the gap is made of.
            {budgeted !== null && (
              <>
                {' '}{['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][outcome.took.total] ?? outcome.took.total} employees took it ({outcome.took.csea} CSEA, {outcome.took.pba} PBA), and the 2027 Tentative
                budgets <strong>{usd(budgeted)}</strong> of General Fund savings from it, after higher retiree health insurance.
              </>
            )}
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            {ri.eligible.map((u) => (
              <div key={u.unit} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 8, padding: '7px 11px' }}>
                <span style={{ color: 'var(--rbl-title)', fontWeight: 700, fontSize: 13.5 }}>{u.unit} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600 }}>· {u.count}</span></span>
                <span style={{ color: 'var(--rbl-text-body)', fontSize: 12.5 }}>{u.benefit}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 10, marginBottom: 0 }}>
            Elect by {ri.electionDeadline}, retire by {ri.retireBy}. Resolutions {ri.resolutions}. Projection: RiverheadLOCAL, July 9, 2026.
            {budgeted !== null && <> Outcome: {outcome.source.title}.</>}
          </p>
        </section>

        <section style={{ ...card }}>
          <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16 }}>2 · The sourced line trims</h3>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: '0 0 10px' }}>
            About <strong>{usd(firmRecurringTotal)}</strong> in firm-confidence recurring trims — every one tied to a
            specific line the Town&apos;s own 2026 Budget Supplement budgets well above its trailing actuals (a line up
            800%, 1,563%, and so on). Not program cuts — accountability questions.
          </p>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            The full menu runs to <strong>{usd(fullRecurringReductionPackage)}</strong> once you add the softer,
            timing-dependent items. Want to see each line and build your own version? Open{' '}
            <strong>&ldquo;Build your own savings package&rdquo;</strong> below.
          </p>
        </section>
      </div>

      {/* THE SAME TEST ON THE NEW TENTATIVE — the package above predates it. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-info-border)' }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16 }}>The same test on the {tt.year} Tentative</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '0 0 10px' }}>
          The line trims above were found in the 2026 Tentative, before the {tt.year} budget existed. Run the same test on the{' '}
          {tt.year} Tentative&apos;s own lines — controllable lines budgeted more than 30% above what they have been running — and it
          finds <strong>{tt.items.length}</strong> lines holding <strong>{usd(tt.total)}</strong> more than recent spending supports:{' '}
          {usd(tt.byConfidence.firm)} firm, {usd(tt.byConfidence.moderate)} in capital or maintenance that fluctuates, and{' '}
          {usd(tt.byConfidence.volatile)} in fuel and energy. These are questions for the Board before it adopts the budget, not
          a replacement for the package above.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '6px 8px' }}>Line</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>{tt.columns.actual} actual</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Jan–Jun {tt.columns.ytd}</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>{tt.year} Tentative</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Above run-rate</th>
              </tr>
            </thead>
            <tbody>
              {tt.items.slice(0, 12).map((r) => (
                <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ padding: '7px 8px' }}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{r.fundName} · {r.confidence}{r.page ? ` · p. ${r.page}` : ''}</div>
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.actual ?? 0)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.ytd ?? 0)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.tentative ?? 0)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '10px 0 0' }}>
          {tt.items.length > 12 ? <>The twelve largest of {tt.items.length}; every one is listed on <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/budget-accuracy/`} style={{ color: 'var(--rbl-link)' }}>Budget Accuracy</a>. </> : null}
          {tt.method} Some lines are paid back by the departments that use them: the General Fund&apos;s central fuel account is
          charged back to every department, so trimming it moves the cost rather than removing it.
          {supplementSource ? <> Source: <a href={supplementSource.url} style={{ color: 'var(--rbl-link)' }}>{supplementSource.title}</a>.</> : null}
        </p>
      </section>

      {/* GO DEEPER — everything else, progressively disclosed. */}
      <h2 style={{ margin: '26px 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>Go deeper</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 8px' }}>Optional detail — open only what you want.</p>

      <Detail title="Build your own savings package (interactive)">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
          Every real, individually-sourced trim, toggleable. Turn items on and off to build a package and watch it move
          against the modeled payroll-pressure gap.
        </p>
        <SpendingReductionToggleList />
      </Detail>

      <Detail title="Will it pass a divided board? The politics">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '0 0 4px' }}>
          Closing the gap has to pass a <strong>Supervisor elected on the Democratic line, who is enrolled in no party, and a four-member Republican Council majority</strong>.
          Under NY Town Law the Supervisor prepares the budget and the Council adopts it, so a durable plan needs both.
          These levers are ordered by how well each survives that split — least partisan first.
        </p>
        <div style={{ display: 'grid', gap: 10, margin: '14px 0 0' }}>
          {gapClosingPaths.map((p, i) => {
            const s = STANDING[p.standing]
            return (
              <div key={p.name} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 13 }}>{i + 1}</span>
                  <span style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14.5, flex: 1, minWidth: 180 }}>{p.name}</span>
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22`, borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                <div style={{ color: 'var(--rbl-success)', fontWeight: 700, fontSize: 13, margin: '6px 0 4px' }}>Closes: {p.closes}</div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55 }}>{p.politics}</div>
              </div>
            )
          })}
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '14px 0 0' }}>
          <strong>The pragmatic reading:</strong> start with what already has bipartisan support (the 5–0 retirement
          incentive), stack the audit-driven trims and any non-tax revenue on top, and reserve one-time fund balance for
          the small residual. A cap override stays available, but as a deliberate, disclosed choice — not a number the
          budget backs into.
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Board composition from the November 2025 results; budget roles per NY Town Law §§104–106. Cap-override
          mechanics per General Municipal Law §3-c (a 60% vote).
        </p>
      </Detail>

      <Detail title="The blunt alternative: an across-the-board 2.5% cut">
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 12px' }}>
          Instead of the targeted lines, a Supervisor could tell every department to cut 2.5%. Here&apos;s how that
          actually pencils out — and why the blunt version overstates what&apos;s really cuttable.
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {atb.bases.map((b) => (
            <div key={b.label} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--rbl-title)', fontWeight: 700, fontSize: 14 }}>{b.label}</span>
                <span style={{ color: 'var(--rbl-success)', fontWeight: 900, fontSize: 16, whiteSpace: 'nowrap' }}>{usd(b.base * atb.cutPercent)}</span>
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 2 }}>{b.note}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={{ padding: '6px 8px' }}>Fund / department</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>{atb.year} Tentative</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of all</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of controllable</th>
              </tr>
            </thead>
            <tbody>
              {atb.byFund.map((f) => (
                <tr key={f.fund} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--rbl-title)', fontWeight: 700 }}>{f.fund}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{usd(f.tentative)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(f.tentative * atb.cutPercent)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--rbl-success)', fontWeight: 700 }}>{f.controllable ? usd(f.controllable * atb.cutPercent) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>{atb.takeaway}</p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          &ldquo;Controllable&rdquo; excludes personnel and mandated costs (pension, debt service, insurance) a flat
          directive can&apos;t change.
        </p>
      </Detail>

      <Detail title="Why you'll see two different “gap” numbers">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The number on this page is the <strong>cap-piercing gap</strong> ({usd(capGap2027.gap)}) — how far the forecast
          levy overshoots a 2% increase, and the one that forces a decision. You&apos;ll also see a smaller{' '}
          <strong>payroll-pressure gap</strong> ({usd(modeledAutomaticPayrollPressure)}) — just the automatic wage
          growth needed to keep the same staff. The interactive package is measured against that smaller one, which is
          why it can read &ldquo;fully covered&rdquo; there while the bigger cap gap is the real target.
        </p>
      </Detail>

      <Detail title="In real terms: inflation and buying power">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Most of the payroll-pressure gap isn&apos;t new programs — it&apos;s automatic cost-of-living growth (the model
          uses a 2.5% COLA). Meanwhile the tax cap&apos;s growth factor is the <em>lesser</em> of 2% or inflation, so
          contracted costs rise about as fast as the revenue the Town is allowed to raise. Because prices keep rising, a
          line that merely holds flat in dollars is already a real cut in what it buys — so read this package in
          recurring, real terms: keeping recurring costs within recurring revenue, not a one-time patch.
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Inflation: U.S. BLS Consumer Price Index. Levy limit: NY&apos;s 2% property-tax cap (lesser of 2% or CPI).
        </p>
      </Detail>

      <Detail title="Built from the Town's own documents">
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
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Links open the Town&apos;s DocumentCenter. Blue = budget, green = supplement, amber = financial report.
        </p>
      </Detail>
    </PageShell>
  )
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details style={{ ...card, padding: 0, marginTop: 12, overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{title}</span>
        <span aria-hidden style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>Open ▾</span>
      </summary>
      <div style={{ padding: '0 18px 18px' }}>{children}</div>
    </details>
  )
}

function Tile({ label, value, note, green, accent }: { label: string; value: string; note?: string; green?: boolean; accent?: boolean }) {
  const bg = accent ? 'var(--rbl-info-bg)' : green ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)'
  const valueColor = accent ? 'var(--rbl-info-text)' : green ? 'var(--rbl-success-strong)' : 'var(--rbl-title)'
  return (
    <div style={{ background: bg, border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
      <div style={{ color: 'var(--rbl-text-body)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: valueColor, margin: '2px 0' }}>{value}</div>
      {note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.4 }}>{note}</div>}
    </div>
  )
}
