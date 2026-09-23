import PageShell from '../../components/PageShell'
import Budget2027Table from '../../components/Budget2027Table'
import ProvenanceLine from '../../components/ProvenanceLine'
import TentativeReleased from '../../components/TentativeReleased'
import { released2027, levySentence } from '../../lib/tentative-2027'
import p from '../../public/data/budget-2027-prediction.json'
import {
  boardOptions, leversAvailable, overlapCaveat, calendar, scorecard, release,
  levy2026, onePercent,
} from '../../lib/budget-2027-options'
import {
  drawCounts, recurringCostCounts, generalFundCommitments2026, committedTotal, openingSurplusAbovePolicy,
  remainingHeadroomCeiling, reductionPct, effectOnOptions, limits as commitmentLimits, corpus,
  headroomLedger, supersessions, documentedChangedTotalBy, committedDocumented, committedAtCeiling,
  otherTierGeneralFundDraws,
} from '../../lib/fiscal-commitments-2027'
import {
  whatTheFormOmits, appointmentTiming, retirementAnnualisation, linesWithRepeatedActions,
  bothDirections, limits as annualisationLimits,
} from '../../lib/annualization-2027'
import {
  units as laborUnits, openUnits, headline as laborHeadline,
  whyItMatters as laborWhyItMatters, limits as laborLimits,
  triborough, placeholderVsFloor,
} from '../../lib/labor-contracts-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const
const chip = { fontWeight: 850, fontSize: 12, padding: '4px 10px', borderRadius: 999 } as const

// Three kinds of certainty, so three badges. A two-way test here rendered every
// account-derived row as "Ceiling" — the opposite of what it is, and flatly
// contradicted by the copy under this table calling those figures the Town's
// own booked amounts. The ledger below already distinguished all three.
const certaintyTone: Record<string, { label: string; bg: string; color: string }> = {
  documented: { label: 'Documented', bg: 'var(--rbl-success-bg)', color: 'var(--rbl-success-strong)' },
  authorized: { label: 'Authorized', bg: 'var(--rbl-warn-bg)', color: 'var(--rbl-warn-strong)' },
  ceiling: { label: 'Ceiling', bg: 'var(--rbl-surface-2)', color: 'var(--rbl-text-muted)' },
}

const OSC_2027 = 'https://www.osc.ny.gov/press/releases/2026/07/dinapoli-tax-cap-remains-2-percent-2027'
const OSC_OVERRIDES = 'https://www.osc.ny.gov/press/releases/2026/08/dinapoli-growing-number-local-governments-reporting-plans-override-property-tax-cap'
const OSC_CAP = 'https://www.osc.ny.gov/local-government/property-tax-cap'
const RIVERHEAD_2026 = 'https://riverheadlocal.com/2025/11/20/riverhead-town-board-approves-2026-budget-nov-18-meeting-wrap-up/'

export const metadata = {
  title: '2027 Budget Projection — tax-cap scenarios, Board choices, and scorecard',
  description:
    'A resident-facing 2027 Riverhead budget projection that separates the 2% allowable levy growth factor from the final tax-cap formula, shows override context, Board choices, and the line-by-line model.',
}

const t = p.totals
const le = p.levyEstimate
const generalFund2027 = p.byFund.find((f) => f.fundCode === 'A01')?.v2027 ?? 0
const knownPensionExclusion = p.capGap.pensionExclusion?.totalEstimate ?? 0
const exclusionProxyLevy = p.capGap.allowedLevy + knownPensionExclusion
const exclusionProxyGap = Math.max(0, p.capGap.predictedLevy - exclusionProxyLevy)
const predictedPct = le.levyIncreasePct

export default function Predict2027Page() {
  return (
    <PageShell
      title="2027 budget outlook — what the model says, and what the tax cap really means"
      subtitle="A line-by-line projection of Riverhead’s next budget, separated from the legal tax-cap calculation and the Town Board choices that follow from it. This is an independent model, not the Town’s tentative budget."
    >
      <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-warn)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
        <strong>Read the levy number as a baseline, not a filed tax-cap calculation.</strong>{' '}
        {p.disclaimer} The 2027 allowable levy growth factor for calendar-year local governments is officially 2%, but Riverhead’s final legal levy limit also depends on the full State Comptroller formula.
      </div>

      <TentativeReleased>
        The forecast on this page is left as it was before the Tentative came out, so the two can be compared; the{' '}
        <a href="#scorecard" style={{ color: 'var(--rbl-link)', fontWeight: 800 }}>scorecard</a> lines them up.
      </TentativeReleased>

      <nav aria-label="On this page" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {[
          ['Tax-cap reality', '#cap-reality'],
          ['State context', '#state-context'],
          ['Board choices', '#board-choices'],
          ['Budget clock', '#budget-clock'],
          ['Scorecard', '#scorecard'],
          ['Model detail', '#model-detail'],
        ].map(([label, href]) => (
          <a key={href} href={href} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-link)', fontWeight: 750, fontSize: 13, textDecoration: 'none' }}>{label} ↓</a>
        ))}
      </nav>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 12, marginBottom: 4 }}>
        <Stat label="2026 adopted · all operating funds" value={usd(t.appropriations2026)} sub="All 19 operating funds" />
        <Stat label="2027 model · all operating funds" value={usd(t.appropriations2027)} sub={`General Fund: ${usd(generalFund2027)}`} accent />
        <Stat label="Modeled spending growth" value={`+${t.pct}%`} sub={`+${usd(t.delta)} across ${t.lineItems.toLocaleString()} lines`} />
        <Stat label="Modeled levy growth" value={`+${predictedPct}%`} sub={`${usd(le.levy2026)} → ${usd(le.levy2027)}`} amber />
      </section>
      <div style={{ ...card, padding: '0 14px 12px', marginBottom: 16, borderTop: 0, boxShadow: 'none' }}>
        <ProvenanceLine
          claimId="2027-model-headline"
          status="projected"
          source="2027 line-item projection built from the adopted 2026 budget"
          asOf="2026 adopted-budget baseline"
          calculation={`${t.lineItems.toLocaleString()} indexed line items projected by category assumptions`}
          evidenceHref={`${base}/sources/`}
        />
      </div>

      <section id="cap-reality" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--rbl-danger-strong)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .5 }}>The tax-cap question</div>
            <h2 style={{ margin: '4px 0 0', color: 'var(--rbl-title)', fontSize: 20 }}>The model is above the 2% planning proxy — but the final legal limit is not simply “last year × 1.02.”</h2>
          </div>
          <span style={{ ...chip, background: 'var(--rbl-danger-bg)', color: 'var(--rbl-danger-strong)', border: '1px solid var(--rbl-danger-border)', fontSize: 13 }}>
            Model gap vs. 2% proxy: {usd(p.capGap.gap)}
          </span>
        </div>

        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '12px 0' }}>
          The State Comptroller set the <strong>2027 allowable levy growth factor at 2%</strong> for calendar-year local governments because the inflation factor was 3.13%. That 2% factor is one input to the tax-cap formula. Riverhead’s filed limit can also reflect tax-base growth, available carryover, PILOT adjustments and statutory exclusions. So this page uses the flat 2% number as a transparent planning benchmark, not as a claim that the final OSC filing has already been calculated.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 660, borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Scenario</th>
                <th style={{ ...th, textAlign: 'right' }}>Levy</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
                <th style={{ ...th, textAlign: 'right' }}>Gap vs. model</th>
                <th style={th}>What it means</th>
              </tr>
            </thead>
            <tbody>
              <CapRow label="Hold 2026 levy flat" levy={levy2026} pct={0} gap={le.levy2027 - levy2026} note="A true zero-levy-growth year. Requires the largest offsetting package." />
              <CapRow label="2% allowable-growth planning proxy" levy={p.capGap.allowedLevy} pct={2} gap={p.capGap.gap} note="Useful benchmark. Not the final Riverhead-specific OSC limit." />
              <CapRow label="2% proxy + known PFRS exclusion estimate" levy={exclusionProxyLevy} pct={Number((((exclusionProxyLevy / levy2026) - 1) * 100).toFixed(2))} gap={exclusionProxyGap} note={`Adds this model’s ${usd(knownPensionExclusion)} estimate for the known PFRS exclusion only; tax-base growth and other formula items remain unfilled.`} />
              <CapRow label="Current model baseline" levy={le.levy2027} pct={predictedPct} gap={0} note="What the levy could look like if modeled spending and non-levy revenue assumptions hold without offsetting action." danger />
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(245px,100%),1fr))', gap: 10, marginTop: 14 }}>
          <Callout title="Known today" text="The statewide 2027 allowable levy growth factor is 2%. The model also identifies a PFRS exclusion estimate tied to retirement-rate growth above the statutory threshold." />
          <Callout title="Not known yet" text="Riverhead’s final filed tax-cap limit, including its tax-base-growth factor, carryover, PILOT adjustments and final exclusion amounts." />
          <Callout title="Decision point" text="If the adopted levy exceeds the final legal limit, the Board can still do so lawfully by enacting an override local law with at least 60% of its voting power before budget adoption." />
        </div>

        <ProvenanceLine
          claimId="2027-growth-factor"
          status="official"
          source="NYS OSC — 2027 allowable levy growth factor"
          sourceHref={OSC_2027}
          asOf="July 15, 2026"
          evidenceHref={`${base}/sources/#osc-guidance`}
        />
      </section>

      <section id="state-context" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <div style={{ color: 'var(--rbl-warn)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .5 }}>Why this matters now</div>
        <h2 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)', fontSize: 20 }}>Overrides are becoming more common as local costs outpace the cap.</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 12px' }}>
          The statewide trend highlighted in recent reporting is real: the State Comptroller says <strong>28.6% of towns</strong> reported plans to override for fiscal year 2026, up from <strong>16.6% in 2022</strong>. Villages were at 35.5% and cities at 45%. OSC ties the trend to rising costs and slower recurring-revenue growth.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(190px,100%),1fr))', gap: 10 }}>
          <Stat label="Towns planning override · 2022" value="16.6%" />
          <Stat label="Towns planning override · 2026" value="28.6%" amber />
          <Stat label="Riverhead adopted levy increase · 2026" value="7.74%" sub="Override local law and budget both adopted unanimously" amber />
        </div>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '11px 14px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-info-text)' }}>Important distinction:</strong>{' '}
          <span style={{ color: 'var(--rbl-info-text)', fontSize: 13.8, lineHeight: 1.55 }}>
            A municipality reporting that it <em>plans</em> to override does not mean it ultimately adopts a levy above the cap. An override can be adopted as procedural protection while officials continue to reduce the budget. For Riverhead, the useful question is therefore not “are overrides unusual?” but “what level of levy is justified, what alternatives were tested, and was any override deliberate and transparent?”
          </span>
        </div>
        <ProvenanceLine
          claimId="override-trend"
          status="official"
          source="NYS OSC — planned tax-cap overrides"
          sourceHref={OSC_OVERRIDES}
          asOf="August 20, 2026"
          evidenceHref={`${base}/sources/#osc-guidance`}
        />
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0 0' }}>Riverhead 2026 budget context: <a href={RIVERHEAD_2026} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 750 }}>adopted-budget reporting ↗</a></p>
      </section>

      <section id="board-choices" style={{ marginBottom: 16, scrollMarginTop: 16 }}>
        <h2 style={{ margin: '26px 0 5px', color: 'var(--rbl-title)', fontSize: 21 }}>The Board’s practical choices</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 12px', maxWidth: 820 }}>
          The model is a baseline, not destiny. The Board can hold the levy flat, target a conservative 2% benchmark, combine recurring savings with one-time resources, or adopt a higher levy with a lawful override. The comparison below keeps the arithmetic visible without pretending one option is automatically correct.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {boardOptions.map((o) => {
            const proxy = o.id === 'at-cap' || o.id === 'hybrid'
            return (
              <article key={o.id} style={{ ...card, padding: 16, borderLeft: `5px solid ${o.legalTone === 'override' ? 'var(--rbl-danger)' : proxy ? 'var(--rbl-warn)' : 'var(--rbl-accent-border)'}` }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>{proxy && o.id === 'at-cap' ? 'A 2% planning-proxy increase' : o.name}</strong>
                  <span style={{ ...chip, background: o.legalTone === 'override' ? 'var(--rbl-danger-bg)' : 'var(--rbl-surface-2)', color: o.legalTone === 'override' ? 'var(--rbl-danger-strong)' : 'var(--rbl-title)', border: '1px solid var(--rbl-border-subtle)' }}>
                    {usd(o.levy)} · {o.changePct > 0 ? '+' : ''}{o.changePct}%
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(170px,100%),1fr))', gap: 8, marginTop: 10 }}>
                  <MiniStat label="Offset needed vs. model" value={o.mustFind > 0 ? usd(o.mustFind) : 'None'} />
                  <MiniStat label="Override required" value={o.legalTone === 'override' ? 'Yes · 3 of 5' : proxy ? 'Depends on final filed limit' : 'No'} />
                  <MiniStat label="Identified-lever read" value={o.reach === 'covered' ? 'Reachable' : o.reach === 'tight' ? 'Tight' : o.reach === 'short' ? 'Short' : 'Not applicable'} />
                </div>
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, margin: '10px 0 0' }}>{o.whatItTakes}</p>
                {proxy && <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 12.8, lineHeight: 1.5, margin: '7px 0 0' }}><strong>Cap note:</strong> this option uses the model’s 2% planning proxy. Compare it with Riverhead’s final filed tax-cap limit before treating it as the legal ceiling.</p>}
              </article>
            )
          })}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 18 }}>What can close the modeled gap?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10 }}>
          <Stat label="Full savings catalogue" value={usd(leversAvailable.package)} />
          <Stat label="Firm items only" value={usd(leversAvailable.firm)} />
          <Stat label="Retirement incentive" value={`${usd(leversAvailable.incentiveLow)}–${usd(leversAvailable.incentiveHigh)}`} />
          <Stat label="Every 1% of 2026 levy" value={usd(onePercent)} />
          <Stat label="Surplus above policy, net of 2026 draws" value={usd(remainingHeadroomCeiling)} sub={`${usd(openingSurplusAbovePolicy)} audited, less ${usd(committedTotal)} committed`} />
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.7, lineHeight: 1.55, margin: '10px 0 0' }}>{overlapCaveat}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <a href={`${base}/spending-reduction-2027/`} style={pillLink}>Build a spending package →</a>
          <a href={`${base}/scenarios/`} style={pillLink}>Test scenarios →</a>
          <a href={`${base}/reserves/`} style={pillLink}>Review reserves →</a>
          <a href="#committed" style={pillLink}>What&apos;s already committed →</a>
        </div>
      </section>

      {/* ============ WHAT IS ALREADY SPENT ============
          The surplus these options lean on is an AUDITED OPENING BALANCE. The Board
          has been spending against it all year, and a dollar already voted cannot
          fund a suggested action as well. Netting the documented draws moves the
          figure by about a third, so presenting the opening balance alone overstated
          what is available. */}
      <section id="committed" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-danger)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 19 }}>
          What the Board has already committed from fund balance
        </h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 800 }}>
          The surplus these options draw on is the audited position at <strong>December 31, 2025</strong>. The Board
          has been spending against it all through 2026. Every adopted resolution that draws on fund balance reduces
          what is left for the choices above — so the number to plan against is the netted one, not the opening balance.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(190px,100%),1fr))', gap: 10, marginBottom: 14 }}>
          <Stat label="Audited surplus above policy" value={usd(openingSurplusAbovePolicy)} sub="December 31, 2025" />
          <Stat label="Documented 2026 commitments" value={`− ${usd(committedTotal)}`} sub={`${generalFundCommitments2026.length} General Fund draws on the record`} />
          <Stat label="Ceiling on what remains" value={usd(remainingHeadroomCeiling)} sub={`${reductionPct.toFixed(0)}% below the opening figure`} />
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13.6 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={{ padding: '8px 10px' }}>What</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '8px 10px' }}>Certainty</th>
              </tr>
            </thead>
            <tbody>
              {generalFundCommitments2026.map((c) => (
                <tr key={c.label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 800, color: 'var(--rbl-title)' }}>
                    {c.label}
                    <div style={{ color: 'var(--rbl-text-muted)', fontWeight: 500, fontSize: 12.6, lineHeight: 1.45, marginTop: 3, maxWidth: 460 }}>{c.note}</div>
                    <div style={{ color: 'var(--rbl-text-faint)', fontWeight: 600, fontSize: 12, marginTop: 3 }}>{c.source}</div>
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: 'var(--rbl-warn)' }}>{usd(c.amount)}</td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', background: certaintyTone[c.certainty].bg, color: certaintyTone[c.certainty].color, border: '1px solid var(--rbl-border-subtle)' }}>
                      {certaintyTone[c.certainty].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The running ledger — what each vote left behind */}
        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-strong)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>
            What each vote left behind
          </strong>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6, margin: '4px 0 10px' }}>
            A pair of totals says the surplus fell. This says which votes spent it. Every row is a General Fund draw,
            largest first, against the audited opening position — and <strong>{usd(committedDocumented)}</strong> of it is
            now the Town&apos;s own figure, booked against its A01-9999 Appropriated Fund Balance account rather than read
            from prose or bounded by this site.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                  <th style={th}>Draw</th>
                  <th style={{ ...th, textAlign: 'center' }}>Basis</th>
                  <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...th, textAlign: 'right' }}>Left above policy</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }} colSpan={3}>
                    Audited position at December 31, 2025
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: 'var(--rbl-title)' }}>{usd(headroomLedger.opening)}</td>
                </tr>
                {headroomLedger.rows.map((r) => (
                  <tr key={r.label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                    <td style={td}>
                      <div style={{ color: 'var(--rbl-text-strong)' }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--rbl-text-faint)' }}>{r.source}</div>
                    </td>
                    <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        ...chip,
                        fontSize: 10.5,
                        background: r.certainty === 'documented' ? 'var(--rbl-success-bg)' : r.certainty === 'ceiling' ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-3)',
                        color: r.certainty === 'documented' ? 'var(--rbl-success-strong)' : r.certainty === 'ceiling' ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-body)',
                      }}>{r.certainty}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>− {usd(r.amount)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{usd(r.remainingAfter)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }} colSpan={3}>
                    Ceiling on what remains
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: 'var(--rbl-warn)' }}>{usd(headroomLedger.closing)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {supersessions.map((sup) => (
            <p key={sup.label} style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '10px 0 0' }}>
              <strong>Reading the account codes changed this figure.</strong> “{sup.label}” was carried here at{' '}
              <strong>{usd(sup.was)}</strong> — a ceiling, because the resolution that authorized it stated no amount, so
              the most it could have been was the whole balance outstanding. The Town later booked{' '}
              <strong>{usd(sup.by)}</strong> against its own Appropriated Fund Balance account for that paydown. The
              ceiling overstated the draw by <strong>{usd(Math.abs(sup.by - sup.was))}</strong>, and the documented figure
              replaces it.
            </p>
          ))}
          {otherTierGeneralFundDraws.length > 0 && (
            <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '11px 14px', margin: '10px 0 0' }}>
              <strong style={{ color: 'var(--rbl-info-text)', fontSize: 13.5 }}>
                Drawn from the General Fund, but not from the cushion this page measures
              </strong>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '4px 0 0' }}>
                Every figure above is measured against <strong>unassigned</strong> fund balance, which is one of the{' '}
                <a href={`${base}/reserves/`} style={{ color: 'var(--rbl-link)' }}>five GASB classifications</a>. These
                votes draw on a different tier, so they are shown but never netted against the headroom — subtracting
                them would report the cushion shrinking when the cushion has not moved.
              </p>
              <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.55, margin: '6px 0 0', paddingLeft: 18 }}>
                {otherTierGeneralFundDraws.map((d) => (
                  <li key={d.number ?? d.title}>
                    <strong>{usd(d.amount)}</strong> — {d.title} (resolution {d.number ?? '—'};{' '}
                    {d.tiers.join(', ')} fund balance, per the account&apos;s own description).
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '8px 0 0' }}>
            Net of that correction and of the draws the account codes surfaced for the first time, the committed total
            moved by {documentedChangedTotalBy < 0 ? '−' : '+'}{usd(Math.abs(documentedChangedTotalBy))} on the
            supersession alone. {committedAtCeiling === 0
              ? 'No row in this table is now a ceiling: every dollar is either the Town’s own booked figure or an amount a resolution stated.'
              : `${usd(committedAtCeiling)} of the total is still carried at a ceiling.`}
          </p>
        </div>

        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 14 }}>
            And {drawCounts.unpriced} more adopted draws carry no published amount
          </strong>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 0' }}>
            Across {corpus.resolutions.toLocaleString()} resolutions in {corpus.meetings} meetings, this site reads{' '}
            <strong>{drawCounts.adopted}</strong> adopted capital or debt resolutions as drawing on fund balance. Only{' '}
            <strong>{drawCounts.priced}</strong> state a dollar figure. The Town&apos;s Fiscal Impact Statements answer
            Yes/No and &ldquo;absorbed by existing budget&rdquo;; the amounts sit in backup tables that don&apos;t tie
            cleanly to a single resolution, so this site leaves them blank rather than guessing. The total above is
            therefore a <strong>floor</strong>, and the remaining headroom a <strong>ceiling</strong>.
          </p>
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>
            A separate {recurringCostCounts.adopted} adopted resolutions commit recurring money
          </strong>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '4px 0 0' }}>
            Salaries and appointments ({recurringCostCounts.byCategory.personnel ?? 0}), contracts
            ({recurringCostCounts.byCategory.contract ?? 0}), fee changes ({recurringCostCounts.byCategory.fees ?? 0})
            and labour agreements ({recurringCostCounts.byCategory['labor-contract'] ?? 0}). These are a real budget
            pressure and they land in the <em>levy</em>, not in accumulated surplus — so they are counted here but
            never netted against the headroom above. Mixing the two would overstate the draw on reserves roughly
            threefold, which is exactly what an earlier version of this page did.
          </p>
        </div>

        {/* Which unions have a signed 2027 rate and which do not */}
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 14 }}>
            Two of the three union contracts run out before the year this page is about
          </strong>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.6, margin: '4px 0 10px' }}>{laborHeadline}</p>

          <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
            {laborUnits.map((u) => (
              <div key={u.unit} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 9, padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>{u.unit}</strong>
                  <span style={{
                    ...chip,
                    background: u.contractual2027 ? 'var(--rbl-success-bg)' : 'var(--rbl-warn-bg)',
                    color: u.contractual2027 ? 'var(--rbl-success-strong)' : 'var(--rbl-warn-strong)',
                  }}>
                    {u.contractual2027 ? '2027 rate is contractual' : '2027 rate is a placeholder'}
                  </span>
                  <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3 }}>{u.contractTerm}</span>
                </div>
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.55, margin: '5px 0 0' }}>{u.finding}</p>
                {u.candidates.length > 0 && (
                  <div style={{ marginTop: 6, color: 'var(--rbl-text-muted)', fontSize: 12.2, lineHeight: 1.5 }}>
                    {u.candidates.length} agreement{u.candidates.length === 1 ? '' : 's'} before the Board this year, most recently{' '}
                    <strong>{u.candidates[u.candidates.length - 1].number ?? '—'}</strong> on{' '}
                    {u.candidates[u.candidates.length - 1].meetingDate}.
                  </div>
                )}
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.6, margin: '0 0 8px' }}>{laborWhyItMatters}</p>

          {/* An expired contract is not a pay freeze */}
          <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, padding: '11px 13px', margin: '0 0 10px' }}>
            <strong style={{ color: 'var(--rbl-title)', fontSize: 13.8 }}>
              An expired contract is not a pay freeze — it costs {usd(triborough.stepCost2027)} in 2027
            </strong>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '5px 0 8px' }}>
              New York&apos;s Taylor Law makes it an improper practice for a public employer{' '}
              <a href={triborough.statuteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, textDecoration: 'none' }}>
                &ldquo;{triborough.statuteQuote}&rdquo;
              </a>{' '}
              — the Triborough Amendment, {triborough.statute}. {triborough.reading}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <th style={th}>Officers moving up a rung</th>
                    <th style={{ ...th, textAlign: 'right' }}>Each</th>
                    <th style={{ ...th, textAlign: 'right' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {triborough.rungs.map((r) => (
                    <tr key={r.from} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                      <td style={td}>
                        <strong>{r.officers}</strong> · {r.from} → {r.to}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>{usd(r.perOfficer)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(r.cost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, color: 'var(--rbl-text-muted)' }}>
                      <strong>{triborough.officersAtTopStep}</strong> already at top step — no movement, no cost
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-faint)' }}>—</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-faint)' }}>—</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--rbl-border-subtle)' }}>
                    <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>
                      {triborough.scope}, {triborough.officersCounted} officers
                    </td>
                    <td style={td} />
                    <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: 'var(--rbl-title)' }}>{usd(triborough.stepCost2027)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '8px 0 0' }}>{placeholderVsFloor}</p>
            <ul style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, lineHeight: 1.5, paddingLeft: 18, margin: '8px 0 0' }}>
              {triborough.caveats.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <ul style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.5, paddingLeft: 18, margin: 0 }}>
            {laborLimits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>

        {/* Part-year 2026 becomes full-year 2027, in both directions */}
        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>{bothDirections.headline}</strong>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '4px 0 10px' }}>{bothDirections.body}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 10, marginBottom: 10 }}>
            <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .4 }}>Retirement saving 2027 carries and 2026 does not</div>
              <strong style={{ fontSize: 19, color: 'var(--rbl-success-strong)' }}>
                {usd(retirementAnnualisation.increment2027Low)}–{usd(retirementAnnualisation.increment2027High)}
              </strong>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginTop: 2 }}>
                of {usd(retirementAnnualisation.fullYearSaving)} a year from {retirementAnnualisation.swornCount} sworn retirements
              </div>
            </div>
            <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .4 }}>Appointments made in the second half of 2026</div>
              <strong style={{ fontSize: 19, color: 'var(--rbl-title)' }}>{appointmentTiming.secondHalf}</strong>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginTop: 2 }}>
                of {appointmentTiming.total} — {Math.round(appointmentTiming.firstHalfShare * 100)}% of the year&apos;s hiring was done by June
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.6, margin: '0 0 10px' }}>
            {appointmentTiming.reading} {retirementAnnualisation.counterweight}
          </p>

          <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 9, padding: '10px 12px', marginBottom: 10 }}>
            <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.4 }}>
              The form names the budget line and never the salary
            </strong>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.3, lineHeight: 1.55, margin: '4px 0 0' }}>
              Of <strong>{whatTheFormOmits.personnelResolutions}</strong> personnel resolutions in the 2026 record,{' '}
              <strong>{whatTheFormOmits.namingAnAccount}</strong> name the appropriation account to be charged and{' '}
              <strong>{whatTheFormOmits.namingAnAmount}</strong> carry a dollar figure of any kind — <strong>{whatTheFormOmits.namingBoth}</strong>{' '}
              state an amount against the account they name. A resident can see which line a new hire lands on and not what
              the line now owes, which is precisely the number that carries into next year. That is why the hire side here
              is counted in people rather than dollars: pricing it would mean inventing a figure.
            </p>
          </div>

          <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.3, lineHeight: 1.6 }}>
            <strong>Where turnover concentrates.</strong> {linesWithRepeatedActions.length} payroll sub-accounts are named
            by more than one 2026 personnel resolution. A seat vacated and refilled inside one year can charge the same
            line for two people&apos;s part-years, so that year&apos;s spending on it is a poor guide to what the next year
            needs.
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <th style={th}>Budget line</th>
                    <th style={th}>Department</th>
                    <th style={{ ...th, textAlign: 'right' }}>2026 actions</th>
                    <th style={{ ...th, textAlign: 'right' }}>Adopted 2026</th>
                  </tr>
                </thead>
                <tbody>
                  {linesWithRepeatedActions.slice(0, 6).map((l) => (
                    <tr key={l.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                      <td style={td}>
                        {l.line ?? l.code}
                        <div style={{ fontSize: 10.5, color: 'var(--rbl-text-faint)', fontFamily: 'ui-monospace, monospace' }}>{l.code}</div>
                      </td>
                      <td style={td}>{l.department ?? '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{l.actions}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{l.adopted2026 != null ? usd(l.adopted2026) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.5, paddingLeft: 18, margin: '10px 0 0' }}>
            {annualisationLimits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>

        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 14 }}>{effectOnOptions.headline}</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.8, lineHeight: 1.6, margin: '5px 0 8px' }}>{effectOnOptions.body}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'baseline' }}>
            <div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>Freeze covered, opening figure</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--rbl-text-muted)', textDecoration: 'line-through' }}>{effectOnOptions.coverageBefore.toFixed(1)}×</div>
            </div>
            <div style={{ fontSize: 20, color: 'var(--rbl-text-muted)' }}>→</div>
            <div>
              <div style={{ color: 'var(--rbl-warn-strong)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>After netting the draws</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--rbl-warn)' }}>{effectOnOptions.coverageAfter.toFixed(1)}×</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>This cuts both ways</strong>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '4px 0 0' }}>{effectOnOptions.caution}</p>
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>{commitmentLimits.headline}</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6 }}>
            {commitmentLimits.points.map((pt, i) => (<li key={i} style={{ marginBottom: 5 }}>{pt}</li>))}
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <a href={`${base}/fiscal-impact/`} style={pillLink}>Every resolution, with its fiscal-impact answer →</a>
            <a href={`${base}/reserves/`} style={pillLink}>Reserves &amp; the policy range →</a>
          </div>
        </div>
      </section>

      <section id="budget-clock" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-violet-border)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>{calendar.headline}</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>The projection becomes testable as the Town moves through the statutory budget calendar.</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {calendar.steps.map((step) => (
            <li key={step.when} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 13.8 }}>{step.when}</strong>
              {step.law && <span style={{ marginLeft: 8, color: 'var(--rbl-text-muted)', fontSize: 12 }}>{step.law}</span>}
              {step.done && (
                <a href={`${base}/tentative-2027/`} data-step-done style={{ ...chip, marginLeft: 8, background: 'var(--rbl-success-bg)', color: 'var(--rbl-success-strong)', textDecoration: 'none', fontSize: 11 }}>Done: the Tentative is out →</a>
              )}
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.5, marginTop: 3 }}>{step.what}</div>
            </li>
          ))}
        </ol>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '10px 0 0' }}>{calendar.overrideNote}</p>
      </section>

      <section id="scorecard" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-teal-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 18 }}>Scorecard — projection vs. what the Town actually files</h2>
          <span style={{ ...chip, background: release.status === 'awaiting' ? 'var(--rbl-warn-bg)' : 'var(--rbl-success-bg)', color: release.status === 'awaiting' ? 'var(--rbl-warn-strong)' : 'var(--rbl-success-strong)', border: '1px solid var(--rbl-border-subtle)' }}>
            {release.status === 'awaiting' ? `Tentative budget due ${release.dueBy}` : 'Tentative budget filed'}
          </span>
        </div>
        {release.status === 'awaiting' ? (
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55 }}>The right-hand side stays empty until the Town files its tentative budget. That prevents the model from being rewritten after the fact.</p>
        ) : (
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55 }}>
            The right-hand side is read from the Tentative the Town published. The projection beside it is the one made before, unchanged,
            so the model is not rewritten after the fact. <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-link)', fontWeight: 800 }}>Fund by fund →</a>
          </p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 13.3 }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Metric</th><th style={th}>Basis</th><th style={{ ...th, textAlign: 'right' }}>Projection</th><th style={{ ...th, textAlign: 'right' }}>As filed</th></tr></thead>
            <tbody>{scorecard.map((r) => <tr key={r.metric} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}><td style={{ ...td, fontWeight: 750, color: 'var(--rbl-title)' }}>{r.metric}</td><td style={{ ...td, color: 'var(--rbl-text-muted)' }}>{r.basis}</td><td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.ourEstimate !== null ? usd(r.ourEstimate) : (r.estimateLabel ?? '—')}</td><td data-filed style={{ ...td, textAlign: 'right', ...(r.actual !== null || r.actualLabel ? { fontWeight: 700, color: 'var(--rbl-title)' } : { color: 'var(--rbl-text-faint)' }) }}>{r.actual !== null ? usd(r.actual) : (r.actualLabel ?? 'Not yet filed')}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ margin: '0 0 5px', color: 'var(--rbl-title)', fontSize: 18 }}>What could still move the model</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {p.watchList.map((w) => (w.id === 'tentative' && released2027 ? {
            item: 'The Town’s own 2027 Tentative Budget is out',
            effect: 'now the number to measure',
            detail: `${levySentence(released2027)} This projection is left as it was, as the yardstick for it.`,
          } : w)).map((w) => (
            <div key={w.item} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}><strong style={{ color: 'var(--rbl-title)' }}>{w.item}</strong><span style={{ color: 'var(--rbl-warn)', fontSize: 11.5, fontWeight: 850 }}>{w.effect}</span></div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.3, lineHeight: 1.5, marginTop: 3 }}>{w.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="model-detail" style={{ scrollMarginTop: 16 }}>
        <h2 style={{ margin: '24px 0 4px', color: 'var(--rbl-title)', fontSize: 19 }}>The model underneath the headline</h2>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 10px' }}>{p.method}</p>

        <Detail title="Growth assumptions by spending category">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: 13.3 }}>
              <thead><tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Category</th><th style={{ ...th, textAlign: 'right' }}>Rate used</th><th style={th}>Recent trend</th><th style={th}>Why</th></tr></thead>
              <tbody>{p.assumptions.map((a) => <tr key={a.category} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}><td style={{ ...td, fontWeight: 750, color: 'var(--rbl-title)' }}>{a.category}</td><td style={{ ...td, textAlign: 'right', fontWeight: 750 }}>+{a.ratePct}%</td><td style={{ ...td, color: 'var(--rbl-text-muted)' }}>{a.recentTrend}</td><td style={{ ...td, color: 'var(--rbl-text-body)', lineHeight: 1.45 }}>{a.why}</td></tr>)}</tbody>
            </table>
          </div>
        </Detail>

        <Detail title="Where the modeled increase comes from">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(210px,100%),1fr))', gap: 8 }}>
            {p.byCategory.map((c) => <MiniStat key={c.category} label={c.category} value={`${usd(c.v2026)} → ${usd(c.v2027)} (${c.pct > 0 ? '+' : ''}${c.pct}%)`} />)}
          </div>
        </Detail>

        <Detail title={`Every projected line item (${t.lineItems.toLocaleString()})`}>
          <Budget2027Table />
        </Detail>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, marginTop: 16 }}>
        {p.source} {le.recentLevyIncreases} The tax-cap scenario table is intentionally separated from the spending forecast so a simplified levy benchmark cannot be mistaken for Riverhead’s final filed tax-cap calculation.
      </p>
    </PageShell>
  )
}

function CapRow({ label, levy, pct, gap, note, danger }: { label: string; levy: number; pct: number; gap: number; note: string; danger?: boolean }) {
  return <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)', background: danger ? 'var(--rbl-danger-bg)' : undefined }}><td style={{ ...td, fontWeight: 750, color: 'var(--rbl-title)' }}>{label}</td><td style={{ ...td, textAlign: 'right', fontWeight: 750 }}>{usd(levy)}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{pct > 0 ? '+' : ''}{pct}%</td><td style={{ ...td, textAlign: 'right', fontWeight: 750 }}>{gap > 0 ? usd(gap) : '—'}</td><td style={{ ...td, color: 'var(--rbl-text-body)', lineHeight: 1.45 }}>{note}</td></tr>
}

function Callout({ title, text }: { title: string; text: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px' }}><strong style={{ color: 'var(--rbl-title)', fontSize: 13.5 }}>{title}</strong><div style={{ color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, marginTop: 3 }}>{text}</div></div>
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return <details style={{ ...card, padding: 0, marginTop: 10, overflow: 'hidden' }}><summary style={{ cursor: 'pointer', padding: '14px 16px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 14.5 }}>{title}</summary><div style={{ padding: '0 16px 16px' }}>{children}</div></details>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 10 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .35 }}>{label}</div><div style={{ color: 'var(--rbl-title)', fontSize: 13.5, fontWeight: 800, marginTop: 2 }}>{value}</div></div>
}

function Stat({ label, value, sub, accent, amber }: { label: string; value: string; sub?: string; accent?: boolean; amber?: boolean }) {
  return <div style={{ background: amber ? 'var(--rbl-warn-bg)' : accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.2, textTransform: 'uppercase', fontWeight: 900, letterSpacing: .4 }}>{label}</div><strong style={{ fontSize: 20, color: amber ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>{sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginTop: 2 }}>{sub}</div>}</div>
}

const pillLink = { background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 12px', color: 'var(--rbl-link)', fontWeight: 750, fontSize: 12.8, textDecoration: 'none' } as const
