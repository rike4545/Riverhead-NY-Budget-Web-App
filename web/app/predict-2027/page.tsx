import PageShell from '../../components/PageShell'
import Budget2027Table from '../../components/Budget2027Table'
import ProvenanceLine from '../../components/ProvenanceLine'
import p from '../../public/data/budget-2027-prediction.json'
import {
  boardOptions, leversAvailable, overlapCaveat, calendar, scorecard, release,
  levy2026, onePercent,
} from '../../lib/budget-2027-options'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const
const chip = { fontWeight: 850, fontSize: 12, padding: '4px 10px', borderRadius: 999 } as const

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
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.7, lineHeight: 1.55, margin: '10px 0 0' }}>{overlapCaveat}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <a href={`${base}/spending-reduction-2027/`} style={pillLink}>Build a spending package →</a>
          <a href={`${base}/scenarios/`} style={pillLink}>Test scenarios →</a>
          <a href={`${base}/reserves/`} style={pillLink}>Review reserves →</a>
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
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55 }}>The right-hand side stays empty until the Town files its tentative budget. That prevents the model from being rewritten after the fact.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 13.3 }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Metric</th><th style={th}>Basis</th><th style={{ ...th, textAlign: 'right' }}>Projection</th><th style={{ ...th, textAlign: 'right' }}>As filed</th></tr></thead>
            <tbody>{scorecard.map((r) => <tr key={r.metric} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}><td style={{ ...td, fontWeight: 750, color: 'var(--rbl-title)' }}>{r.metric}</td><td style={{ ...td, color: 'var(--rbl-text-muted)' }}>{r.basis}</td><td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.ourEstimate !== null ? usd(r.ourEstimate) : (r.estimateLabel ?? '—')}</td><td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-faint)' }}>{r.actual !== null ? usd(r.actual) : 'Not yet filed'}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ margin: '0 0 5px', color: 'var(--rbl-title)', fontSize: 18 }}>What could still move the model</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {p.watchList.map((w) => (
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
