import PageShell from '../../components/PageShell'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import ProvenanceLine from '../../components/ProvenanceLine'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure, personnelPolicyItems } from '../../lib/spending-reduction-2027'
import { builtFromDocuments } from '../../lib/built-from-documents'
import { acrossTheBoard2027 as atb } from '../../lib/across-the-board-2027'
import { capGap2027, firmRecurringTotal, retirementIncentive2027 as ri } from '../../lib/close-the-gap-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const OSC_FACTORS = 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/inflation-and-allowable-levy-growth-factors.pdf'
const OSC_FORMULA = 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/formula.pdf'
const RETIREMENT_SOURCE = 'https://riverheadlocal.com/2026/07/09/riverhead-approves-voluntary-retirement-incentives-for-53-eligible-town-employees/'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const KIND: Record<string, { color: string; bg: string }> = {
  budget: { color: 'var(--rbl-info-text)', bg: 'var(--rbl-info-bg)' },
  supplement: { color: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)' },
  afr: { color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' },
}

// The modeled retirement/refill line overlaps with the Town's retirement incentive.
// Net it out before combining the two so the page never double-counts the same mechanism.
const retirementRefillOverlap = personnelPolicyItems.find((i) => i.id === 'retirementRefill')?.amount ?? 0
const potentialPackage = (incentive: number) => incentive + firmRecurringTotal - retirementRefillOverlap
const potentialLow = potentialPackage(ri.projectedSavingsLow)
const potentialHigh = potentialPackage(ri.projectedSavingsHigh)
const coverageLow = Math.round((potentialLow / capGap2027.gap) * 100)
const coverageHigh = Math.round((potentialHigh / capGap2027.gap) * 100)
const residualLow = Math.max(0, capGap2027.gap - potentialHigh)
const residualHigh = Math.max(0, capGap2027.gap - potentialLow)

export const metadata = {
  title: '2027 Spending Reduction — a testable plan, not a promise',
  description:
    'A resident-facing 2027 Riverhead spending plan that separates the 2% tax-cap planning benchmark from the final legal levy limit, distinguishes projected savings from realized savings, and lets residents test recurring reduction candidates.',
}

export default function SpendingReduction2027Page() {
  return (
    <PageShell
      title="2027 spending plan — what can actually be reduced?"
      subtitle="Start with the planning benchmark, separate projected savings from realized savings, and test each recurring reduction before deciding whether reserves or an override are still needed."
    >
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-info-border)' }}>
        <div style={{ color: 'var(--rbl-info-text)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start with the right number</div>
        <h2 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)', fontSize: 22 }}>
          {usd(capGap2027.gap)} is the model&apos;s gap versus a 2% planning proxy — not Riverhead&apos;s final legal tax-cap shortfall.
        </h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.62, margin: 0 }}>
          The model currently projects levy growth of about <strong>{capGap2027.predictedLevyPct}%</strong>. OSC&apos;s 2027 table shows a <strong>3.13% inflation factor</strong> but an <strong>allowable levy growth factor of 1.0200</strong> for calendar-year local governments. Riverhead&apos;s final levy limit still depends on the full formula — tax-base growth, PILOT adjustments, carryover, transfers and exclusions — so this page uses {usd(capGap2027.gap)} as a transparent budget-planning target, not as a claim that the Town has already filed an above-cap levy.
        </p>
        <ProvenanceLine
          claimId="spending-2027-proxy-gap"
          status="calculated"
          source="2027 projection + NYS OSC tax-cap factor/formula guidance"
          sourceHref={OSC_FORMULA}
          asOf="September 7, 2026 planning view"
          calculation="Modeled levy minus the 2% allowable-growth planning proxy; final Riverhead levy limit not yet substituted"
          evidenceHref="/sources/#osc-guidance"
        />
      </section>

      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-warn)' }}>
        <div style={{ color: 'var(--rbl-warn)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status after the September 1 deadline</div>
        <h2 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)', fontSize: 20 }}>The retirement incentive is authorized. The savings are not yet booked.</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          The Board approved the three union incentives 5–0 and the election deadline was September 1. The Town&apos;s last quantified public projection in the sources indexed here remains <strong>{usd(ri.projectedSavingsLow)}–{usd(ri.projectedSavingsHigh)}</strong>, depending on participation and how vacated positions are refilled. Until the final participation/backfill results are incorporated, this page treats that range as <strong>projected</strong>, not realized recurring savings.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(185px,100%),1fr))', gap: 10, marginTop: 14 }}>
          <StatusTile label="Board authorization" value="Complete" note="Resolutions 2026-678/679/680 · unanimous" tone="good" />
          <StatusTile label="Election deadline" value="Passed" note={ri.electionDeadline} tone="warn" />
          <StatusTile label="Retire-by date" value={ri.retireBy} note="Participation outcomes determine the real 2027 effect" />
          <StatusTile label="Realized savings" value="Pending" note="Do not treat the $500K–$800K range as booked yet" tone="warn" />
        </div>
        <ProvenanceLine
          claimId="spending-2027-retirement-status"
          status="official"
          source="Riverhead retirement incentive terms and Town savings projection"
          sourceHref={RETIREMENT_SOURCE}
          asOf="September 7, 2026"
          evidenceHref="/meetings/?meeting=2026-07-07&q=2026-678"
        />
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ color: 'var(--rbl-badge)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Working package</div>
        <h2 style={{ margin: '4px 0 6px', color: 'var(--rbl-title)', fontSize: 20 }}>What the current evidence says could be available</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          This is a planning stack, not a declaration that the money has already been saved. Every component has to survive validation, implementation and budget adoption.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(190px,100%),1fr))', gap: 12, margin: '14px 0' }}>
          <Tile label="2% planning-proxy gap" value={usd(capGap2027.gap)} note="Benchmark only · final OSC filing can differ" />
          <Tile label="Identified recurring candidates" value={usd(firmRecurringTotal)} note="Requires validation, policy, staffing or budget action" green />
          <Tile label="Retirement projection" value={`${usd(ri.projectedSavingsLow)}–${usd(ri.projectedSavingsHigh)}`} note="Town projection · actual participation/backfill effect pending" green />
          <Tile label="Potential combined coverage" value={`${coverageLow}–${coverageHigh}%`} note={`After removing ${usd(retirementRefillOverlap)} of overlap`} accent />
        </div>
        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 11, padding: '11px 13px', color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55 }}>
          <strong>Residual versus the 2% proxy:</strong>{' '}
          {residualLow === 0 && residualHigh === 0
            ? 'the modeled package could cover the proxy gap, but only if the projected retirement savings and identified reductions actually materialize.'
            : `${usd(residualLow)}–${usd(residualHigh)} would still remain after the modeled package.`}
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ color: 'var(--rbl-badge)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sequence matters</div>
        <h2 style={{ margin: '4px 0 10px', color: 'var(--rbl-title)', fontSize: 21 }}>A defensible order of operations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 10 }}>
          <Step n="1" title="Publish the retirement result" text="Replace the $500K–$800K projection with the actual participant count, incentive cost, backfill plan and full-year 2027 savings." />
          <Step n="2" title="Validate the line-item candidates" text="Compare 2026 budget amounts against the latest actuals, contracts, project timing and service needs before reducing a line." />
          <Step n="3" title="Lock recurring savings first" text="Use staffing, policy and operating changes for recurring cost pressure. Avoid calling one-time fund balance a permanent fix." />
          <Step n="4" title="Decide the residual openly" text="Once the final tax-cap filing and recurring package are known, choose among other revenue, a limited one-time bridge, service changes or a deliberate override." />
        </div>
      </section>

      <h2 style={{ margin: '28px 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>Test the plan</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 8px' }}>Optional detail — start with zero assumptions and add only the reductions you think the evidence supports.</p>

      <Detail title="Build your own reduction package">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
          The builder now measures your selections against the <strong>{usd(capGap2027.gap)} 2% planning-proxy gap</strong>. It starts with nothing selected so appearing on this page is not mistaken for an endorsement.
        </p>
        <SpendingReductionToggleList />
      </Detail>

      <Detail title="What is driving the recurring pressure?">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The model contains about <strong>{usd(modeledAutomaticPayrollPressure)}</strong> of automatic payroll pressure from union and non-contract wage assumptions. That is a cost driver, not a separate legal tax-cap calculation. The reason to track it is structural: recurring payroll growth should be matched with recurring revenue or recurring savings rather than a one-time patch.
        </p>
      </Detail>

      <Detail title="The blunt alternative: an across-the-board 2.5% cut">
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 12px' }}>
          A flat directive sounds simple, but it treats controllable operating lines and legally/contractually constrained costs as though they were equally flexible. The table below shows the difference.
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
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Fund / department</th><th style={numTh}>2026 tentative</th><th style={numTh}>2.5% of all</th><th style={numTh}>2.5% of controllable</th></tr></thead>
            <tbody>{atb.byFund.map((f) => <tr key={f.fund} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}><td style={{ ...td, color: 'var(--rbl-title)', fontWeight: 700 }}>{f.fund}</td><td style={numTd}>{usd(f.tentative)}</td><td style={{ ...numTd, fontWeight: 700 }}>{usd(f.tentative * atb.cutPercent)}</td><td style={{ ...numTd, color: 'var(--rbl-success)', fontWeight: 700 }}>{f.controllable ? usd(f.controllable * atb.cutPercent) : '—'}</td></tr>)}</tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>{atb.takeaway}</p>
      </Detail>

      <Detail title="Tax-cap mechanics behind the planning benchmark">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          For 2027 calendar-year local governments, OSC reports a 3.13% inflation factor and a 1.0200 allowable levy growth factor. The allowable-growth factor is only one part of the statutory levy-limit formula. That is why this page calls {usd(capGap2027.gap)} a <strong>2% planning-proxy gap</strong>, not a final legal shortfall.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <a href={OSC_FACTORS} target="_blank" rel="noreferrer" style={sourceLink}>OSC inflation &amp; allowable-growth factors ↗</a>
          <a href={OSC_FORMULA} target="_blank" rel="noreferrer" style={sourceLink}>OSC formula ↗</a>
          <a href={`${base}/tax-cap/`} style={sourceLink}>Open Tax Cap →</a>
        </div>
      </Detail>

      <Detail title="Built from the Town's own documents">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {builtFromDocuments.map((doc) => {
            const k = KIND[doc.kind]
            return (
              <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: k.bg, color: k.color, border: `1px solid ${k.color}22`, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
                {doc.title} ↗
              </a>
            )
          })}
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Town budgets and supplements establish the line items; this site&apos;s reduction amounts are calculations or scenarios unless an official Town action says otherwise.
        </p>
      </Detail>
    </PageShell>
  )
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details style={{ ...card, padding: 0, marginTop: 12, overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{title}</span><span aria-hidden style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>Open ▾</span>
      </summary>
      <div style={{ padding: '0 18px 18px' }}>{children}</div>
    </details>
  )
}

function Tile({ label, value, note, green, accent }: { label: string; value: string; note?: string; green?: boolean; accent?: boolean }) {
  const bg = accent ? 'var(--rbl-info-bg)' : green ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)'
  const valueColor = accent ? 'var(--rbl-info-text)' : green ? 'var(--rbl-success-strong)' : 'var(--rbl-title)'
  return <div style={{ background: bg, border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}><div style={{ color: 'var(--rbl-text-body)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 900, color: valueColor, margin: '2px 0' }}>{value}</div>{note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.4 }}>{note}</div>}</div>
}

function StatusTile({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'good' | 'warn' }) {
  const color = tone === 'good' ? 'var(--rbl-success-strong)' : tone === 'warn' ? 'var(--rbl-warn)' : 'var(--rbl-title)'
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 11, padding: 12 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</div><div style={{ color, fontWeight: 900, fontSize: 18, margin: '2px 0' }}>{value}</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.7, lineHeight: 1.4 }}>{note}</div></div>
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <article style={{ ...card, padding: 14, boxShadow: 'none' }}><div style={{ width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'var(--rbl-fill-brand)', color: 'white', fontWeight: 900, fontSize: 12 }}>{n}</div><h3 style={{ margin: '8px 0 5px', color: 'var(--rbl-title)', fontSize: 15 }}>{title}</h3><p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5 }}>{text}</p></article>
}

const th = { padding: '7px 8px' } as const
const td = { padding: '7px 8px' } as const
const numTh = { ...th, textAlign: 'right' as const }
const numTd = { ...td, textAlign: 'right' as const }
const sourceLink = { background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 11px', color: 'var(--rbl-link)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none' } as const
