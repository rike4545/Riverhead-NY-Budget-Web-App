import PageShell from '../../components/PageShell'
import Budget2027Table from '../../components/Budget2027Table'
import p from '../../public/data/budget-2027-prediction.json'
import {
  boardOptions, leversAvailable, overlapCaveat, calendar, scorecard, release, accountability,
  sources as optionSources, levy2026, onePercent,
} from '../../lib/budget-2027-options'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const
const chip = { fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' } as const
const eyebrow = { fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 } as const

type Reach = 'covered' | 'tight' | 'short' | 'none'
const reachColor = (r: Reach) => r === 'covered' ? 'var(--rbl-success)' : r === 'tight' ? 'var(--rbl-warn)' : r === 'short' ? 'var(--rbl-danger)' : 'var(--rbl-text-muted)'
const reachBg = (r: Reach) => r === 'covered' ? 'var(--rbl-success-bg)' : r === 'tight' ? 'var(--rbl-warn-bg)' : r === 'short' ? 'var(--rbl-danger-bg)' : 'var(--rbl-surface-2)'
const reachBorder = (r: Reach) => r === 'covered' ? 'var(--rbl-success-border)' : r === 'tight' ? 'var(--rbl-warn-border)' : r === 'short' ? 'var(--rbl-danger-border)' : 'var(--rbl-border-subtle)'
const reachLabel = (r: Reach) => r === 'covered' ? 'Reachable' : r === 'tight' ? 'Only just' : r === 'short' ? 'Not on identified savings' : 'Not a savings question'

export const metadata = {
  title: '2027 Budget — the projection, the Board’s options, and the scorecard',
  description:
    'An independent, line-by-line projection of the Town of Riverhead 2027 budget; the four real choices in front of the Town Board — a zero year, a decrease, an increase inside the cap, or above it — with what each would cost; and a scorecard that fills in when the tentative budget is filed. A model to test, not the Town’s budget.',
}

const t = p.totals
const le = p.levyEstimate

export default function Predict2027Page() {
  return (
    <PageShell
      title="A 2027 budget prediction — line by line"
      subtitle="What next year’s budget looks like if current trends hold — then the four real choices in front of the Town Board, what each would cost, and a scorecard that fills in the day the tentative budget is filed. This is a model, not the Town’s budget."
    >
      <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid #ea580c', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
        <strong>Read this first — it’s a prediction, not a fact.</strong> {p.disclaimer}
      </div>

      <nav aria-label="On this page" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'The Board’s options', href: '#the-choice' },
          { label: 'The statutory clock', href: '#the-clock' },
          { label: 'Scorecard', href: '#scorecard' },
          { label: 'Go deeper', href: '#go-deeper' },
        ].map((j) => (
          <a key={j.href} href={j.href} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.2, textDecoration: 'none' }}>
            {j.label} ↓
          </a>
        ))}
      </nav>

      {/* Headline numbers — the answer. */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="2026 adopted (appropriations)" value={usd(t.appropriations2026)} />
        <Stat label="2027 predicted" value={usd(t.appropriations2027)} accent />
        <Stat label="Predicted change" value={`+${usd(t.delta)}`} sub={`+${t.pct}% on ${t.lineItems.toLocaleString()} line items`} />
        <Stat label="Implied levy increase" value={`+${le.levyIncreasePct}%`} sub={`${usd(le.levy2026)} → ${usd(le.levy2027)}`} amber />
      </section>

      {/* The headline finding: pierces the cap. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)' }}>Does the 2027 budget pierce the tax cap?</h2>
          <span style={{ background: 'var(--rbl-danger-bg)', color: 'var(--rbl-danger-strong)', fontWeight: 900, fontSize: 14, padding: '5px 14px', borderRadius: 999 }}>
            Yes — by about {usd(p.capGap.gap)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, margin: '14px 0' }}>
          <Stat label={`Cap allows (~${p.capGap.capBasePct}%)`} value={usd(p.capGap.allowedLevy)} />
          <Stat label="Predicted levy" value={usd(p.capGap.predictedLevy)} amber />
          <Stat label="Over the cap by" value={usd(p.capGap.gap)} />
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{p.capGap.summary}</p>

        <div style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-success-strong)' }}>How the gap gets closed →</strong>{' '}
          <span style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55 }}>
            The <a href={`${base}/spending-reduction-2027/`} style={{ color: 'var(--rbl-success)', fontWeight: 800 }}>2027 Spending Reduction</a> page
            lays out the plan — the retirement incentive plus sourced trims cover essentially the whole gap. Prefer to try the
            trade-offs yourself? Use the <a href={`${base}/scenarios/`} style={{ color: 'var(--rbl-success)', fontWeight: 800 }}>What-if scenarios</a> tool.
          </span>
        </div>

        <Detail title="Or stay under it another way — the full menu of levers">
          <div style={{ display: 'grid', gap: 8 }}>
            {p.capGap.levers.map((l, i) => (
              <div key={i} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 14px' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{l.lever}</strong>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.5, marginTop: 3 }}>{l.detail}</div>
              </div>
            ))}
          </div>
        </Detail>
      </section>


      {/* ============ THE DECISION ============ */}
      <h2 id="the-choice" style={{ margin: '30px 0 4px', color: 'var(--rbl-title)', fontSize: 22, scrollMarginTop: 16 }}>
        The choice in front of the Town Board
      </h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 760 }}>
        The projection above says what happens if nothing changes. That isn&apos;t a decision. The Board has four
        real options — hold the levy flat, cut it, raise it inside the cap, or raise it above the cap — plus the
        hybrid that most budgets actually are. Each has a levy number, a dollar amount it has to find, and a
        different legal requirement. <strong>None of them is the &ldquo;right&rdquo; one.</strong> This lays out what
        each costs and what each requires, and links to the work behind it.
      </p>

      {/* Comparison strip — the whole decision at a glance. */}
      <section style={{ ...card, marginBottom: 14, overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13.8 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Option</th>
              <th style={{ ...th, textAlign: 'right' }}>2027 levy</th>
              <th style={{ ...th, textAlign: 'right' }}>vs 2026</th>
              <th style={{ ...th, textAlign: 'right' }}>Must find</th>
              <th style={th}>Override vote?</th>
            </tr>
          </thead>
          <tbody>
            {boardOptions.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>
                  <a href={`#opt-${o.id}`} style={{ color: 'var(--rbl-link)', textDecoration: 'none' }}>{o.shortName}</a>
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(o.levy)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: o.changePct > 0 ? 'var(--inc)' : o.changePct < 0 ? 'var(--dec)' : 'var(--rbl-text-muted)' }}>
                  {o.changePct > 0 ? '+' : ''}{o.changePct}%
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: o.mustFind > 0 ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)' }}>
                  {o.mustFind > 0 ? usd(o.mustFind) : '—'}
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  {o.legalTone === 'override'
                    ? <span style={{ ...chip, background: 'var(--rbl-danger-bg)', color: 'var(--rbl-danger-strong)', border: '1px solid var(--rbl-danger-border)' }}>Yes — 3 of 5</span>
                    : <span style={{ ...chip, background: 'var(--rbl-success-bg)', color: 'var(--rbl-success-strong)', border: '1px solid var(--rbl-success-border)' }}>No</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '10px 0 0' }}>
          &ldquo;Must find&rdquo; is the distance from that option&apos;s levy to the projected {usd(p.levyEstimate.levy2027)} —
          the savings, new revenue or fund balance the Board would have to produce. Every 1% of levy is about {usd(onePercent)}.
          The base is the 2026 levy of {usd(levy2026)}.
        </p>
      </section>

      {/* The five options in full. */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        {boardOptions.map((o) => (
          <section key={o.id} id={`opt-${o.id}`} style={{ ...card, scrollMarginTop: 16, borderLeft: `6px solid ${reachColor(o.reach)}` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 17.5 }}>{o.name}</h3>
              <span style={{ ...chip, background: 'var(--rbl-surface-2)', color: 'var(--rbl-title)', border: '1px solid var(--rbl-border-subtle)', fontSize: 13 }}>
                {usd(o.levy)} · {o.changePct > 0 ? '+' : ''}{o.changePct}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, margin: '12px 0' }}>
              <Stat label="2027 levy under this option" value={usd(o.levy)} />
              <Stat label="Change from 2026" value={`${o.changePct > 0 ? '+' : ''}${o.changePct}%`} />
              <Stat label="Must be found" value={o.mustFind > 0 ? usd(o.mustFind) : 'Nothing'} amber={o.mustFind > 0} />
            </div>

            <Row label="What it takes">{o.whatItTakes}</Row>
            <div style={{ background: reachBg(o.reach), border: `1px solid ${reachBorder(o.reach)}`, borderRadius: 10, padding: '11px 14px', margin: '10px 0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>Can the identified levers get there?</strong>
                <span style={{ ...chip, background: 'var(--rbl-surface)', color: reachColor(o.reach), border: `1px solid ${reachBorder(o.reach)}` }}>{reachLabel(o.reach)}</span>
              </div>
              <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.8, lineHeight: 1.55 }}>{o.canWeGetThere}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 4 }}>
              <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ ...eyebrow, color: 'var(--rbl-success-strong)' }}>The case for it</div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.55 }}>{o.theCase}</div>
              </div>
              <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ ...eyebrow, color: 'var(--rbl-warn-strong)' }}>What it costs</div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.55 }}>{o.theCost}</div>
              </div>
            </div>

            <div style={{ background: o.legalTone === 'override' ? 'var(--rbl-danger-bg)' : 'var(--rbl-surface-2)', border: `1px solid ${o.legalTone === 'override' ? 'var(--rbl-danger-border)' : 'var(--rbl-border-subtle)'}`, borderRadius: 10, padding: '10px 13px', marginTop: 10 }}>
              <span style={{ ...eyebrow, color: o.legalTone === 'override' ? 'var(--rbl-danger-strong)' : 'var(--rbl-text-muted)', display: 'inline' }}>Legal requirement · </span>
              <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.55 }}>{o.legal}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {o.ourWork.map((w) => (
                <a key={w.href} href={w.href} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.2, textDecoration: 'none' }}>
                  {w.label} →
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* The levers, once, with the overlap caveat stated plainly. */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--rbl-title)', fontSize: 16.5 }}>The levers those options draw on</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <Stat label="Full savings catalogue" value={usd(leversAvailable.package)} sub="Every catalogued item, all confidence levels" />
          <Stat label="Firm items only" value={usd(leversAvailable.firm)} sub="Rated firm — the defensible subtotal" />
          <Stat label="Retirement incentive" value={`${usd(leversAvailable.incentiveLow)}–${usd(leversAvailable.incentiveHigh)}`} sub="Town’s own projection; already adopted" />
          <Stat label="Surplus above policy" value={usd(leversAvailable.surplusAbovePolicy)} sub="One-time money, not recurring" amber />
        </div>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 14px', marginTop: 12, color: 'var(--rbl-warn-strong)', fontSize: 13.5, lineHeight: 1.55 }}>
          <strong>These don&apos;t simply add up.</strong> {overlapCaveat}
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, margin: '10px 0 0' }}>{leversAvailable.note}</p>
      </section>

      {/* ============ THE CLOCK ============ */}
      <section id="the-clock" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-violet-border)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>{calendar.headline}</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>
          New York Town Law fixes when each step has to happen. The Board can choose the number; it cannot choose the dates.
        </p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {calendar.steps.map((st) => (
            <li key={st.when} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 3, background: st.law ? 'var(--rbl-surface-2)' : 'var(--rbl-violet-bg)', border: `1px solid ${st.law ? 'var(--rbl-border-subtle)' : 'var(--rbl-violet-border)'}`, borderRadius: 10, padding: '10px 13px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ color: st.law ? 'var(--rbl-title)' : 'var(--rbl-violet-strong)', fontSize: 14 }}>{st.when}</strong>
                {st.law && <span style={{ ...chip, background: 'var(--rbl-surface)', color: 'var(--rbl-text-muted)', border: '1px solid var(--rbl-border-subtle)' }}>{st.law}</span>}
              </div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.5 }}>{st.what}</div>
            </li>
          ))}
        </ol>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '11px 14px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 14 }}>Why the order matters this year</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 0' }}>{calendar.theCollision}</p>
        </div>
        <div style={{ background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '11px 14px', marginTop: 10 }}>
          <strong style={{ color: 'var(--rbl-danger-strong)', fontSize: 14 }}>The override has to come first</strong>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 0' }}>{calendar.overrideNote}</p>
        </div>
      </section>

      {/* ============ THE SCORECARD ============ */}
      <section id="scorecard" style={{ ...card, marginBottom: 16, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-teal-border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 18 }}>Scorecard — projected vs. options vs. filed</h2>
          <span style={{ ...chip, background: release.status === 'awaiting' ? 'var(--rbl-warn-bg)' : 'var(--rbl-success-bg)', color: release.status === 'awaiting' ? 'var(--rbl-warn-strong)' : 'var(--rbl-success-strong)', border: `1px solid ${release.status === 'awaiting' ? 'var(--rbl-warn-border)' : 'var(--rbl-success-border)'}`, fontSize: 12.5, whiteSpace: 'normal' }}>
            {release.status === 'awaiting' ? `Awaiting the tentative budget — due ${release.dueBy}` : 'Tentative budget filed'}
          </span>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '10px 0 12px', maxWidth: 780 }}>
          When the tentative budget is filed, this table fills in. The right-hand column is deliberately empty until
          then — <strong>we are not guessing what will be proposed</strong>, and an empty cell is more honest than a
          placeholder. What we can publish in advance is our own projection, so the comparison can&apos;t be
          reverse-engineered after the fact.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 13.6 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Metric</th>
                <th style={th}>Basis</th>
                <th style={{ ...th, textAlign: 'right' }}>Our projection</th>
                <th style={{ ...th, textAlign: 'right' }}>As filed</th>
                <th style={{ ...th, textAlign: 'right' }}>Difference</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((r) => (
                <tr key={r.metric} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>
                    {r.metric}
                    <div style={{ color: 'var(--rbl-text-muted)', fontWeight: 500, fontSize: 12.6, lineHeight: 1.45, marginTop: 3, maxWidth: 340 }}>{r.note}</div>
                  </td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{r.basis}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', color: r.ourEstimate === null && !r.estimateLabel ? 'var(--rbl-text-faint)' : 'var(--rbl-title)' }}>
                    {r.ourEstimate !== null ? usd(r.ourEstimate) : (r.estimateLabel ?? '—')}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-faint)', whiteSpace: 'nowrap' }}>
                    {r.actual !== null ? usd(r.actual) : 'Not yet filed'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-faint)', whiteSpace: 'nowrap' }}>
                    {r.actual !== null && r.ourEstimate !== null ? usd(r.actual - r.ourEstimate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--rbl-teal-bg)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-teal-strong)', fontSize: 14 }}>What to look for the day it drops</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.6 }}>
            {release.whatToLookFor.map((w, i) => (<li key={i} style={{ marginBottom: 4 }}>{w}</li>))}
          </ul>
        </div>

        <Detail title={accountability.headline}>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.2, lineHeight: 1.6, marginTop: 0 }}>{accountability.fair}</p>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>{accountability.method}</p>
          <div style={{ background: 'var(--rbl-note-bg)', border: '1px solid var(--rbl-note-border)', borderRadius: 10, padding: '11px 14px' }}>
            <strong style={{ color: 'var(--rbl-note-text)', fontSize: 13.8 }}>Limits</strong>
            <p style={{ color: 'var(--rbl-note-text)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 0' }}>{accountability.limits}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <a href={`${base}/candidate-watch/`} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.2, textDecoration: 'none' }}>Candidate Watch — the stated positions →</a>
            <a href={`${base}/candidate-cost-benefit/`} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.2, textDecoration: 'none' }}>Every plank, costed →</a>
          </div>
        </Detail>

        <Detail title="Sources for the calendar and the legal requirements">
          <div style={{ display: 'grid', gap: 8 }}>
            {optionSources.map((sc) => (
              <div key={sc.url} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
                <a href={sc.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13.8, textDecoration: 'none' }}>{sc.title} ↗</a>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.5, marginTop: 3 }}>{sc.covers}</div>
              </div>
            ))}
          </div>
        </Detail>
      </section>

      {/* Things known to be moving that the line-by-line model can't carry. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>What to watch — and what this model can&apos;t see</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '0 0 12px' }}>
          A line-by-line projection grows what the Town already budgets. It cannot see a decision that
          hasn&apos;t been made yet, or a document that hasn&apos;t been filed. These four are known to be moving.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {p.watchList.map((w) => (
            <div key={w.item} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.8 }}>{w.item}</strong>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 900, letterSpacing: 0.3, textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 5,
                  background: 'var(--rbl-warn-bg)', color: 'var(--rbl-warn-strong)', border: '1px solid var(--rbl-warn-border)',
                }}>{w.effect}</span>
              </div>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: '5px 0 0' }}>{w.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GO DEEPER — the method and the big tables, progressively disclosed. */}
      <h2 id="go-deeper" style={{ margin: '26px 0 4px', color: 'var(--rbl-title)', fontSize: 18, scrollMarginTop: 16 }}>Go deeper</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 8px' }}>The full model — open only what you want.</p>

      <Detail title="How this projection works — and the assumptions you can argue with">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>
          The spending side is projected <strong>line by line</strong>: each 2026 amount grows by the rate for its
          category. Add it up and 2027 spending lands near <strong>{usd(t.appropriations2027)}</strong>, up{' '}
          <strong>{t.pct}%</strong>. The tax-levy figure is a separate, illustrative estimate — {le.note.charAt(0).toLowerCase() + le.note.slice(1)}
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>{p.method}</p>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 14 }}>Debt service is scheduled, not forecast</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 8px' }}>{p.debtSchedule.note}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <MiniStat label="Principal 2026 → 2027" value={`${usd(p.debtSchedule.principal2026)} → ${usd(p.debtSchedule.principal2027)}`} pct={p.debtSchedule.principalRatePct} />
            <MiniStat label="Interest 2026 → 2027" value={`${usd(p.debtSchedule.interest2026)} → ${usd(p.debtSchedule.interest2027)}`} pct={p.debtSchedule.interestRatePct} />
          </div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8 }}>{p.debtSchedule.source}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 growth used</th>
                <th style={th}>Recent trend</th>
                <th style={th}>Why</th>
              </tr>
            </thead>
            <tbody>
              {p.assumptions.map((a) => (
                <tr key={a.category} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{a.category}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>+{a.ratePct}%/yr</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>{a.recentTrend}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)', lineHeight: 1.45 }}>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title="How the Personal Services rate is built (CSEA/PBA/SOA breakdown)">
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>{p.unionBreakdown.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Union</th>
                <th style={{ ...th, textAlign: 'right' }}>Share of payroll</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 rate used</th>
                <th style={th}>Contract</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {p.unionBreakdown.groups.map((g) => (
                <tr key={g.union} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{g.union}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{g.payrollSharePct}%</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>
                    +{g.ratePct}%{!g.known2027 && <span style={{ color: 'var(--rbl-warn)', fontWeight: 700 }}> (est.)</span>}
                  </td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)' }}>{g.term ?? '—'}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.4 }}>{g.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          &quot;(est.)&quot; means that union&apos;s contract expires 12/31/2026 with no successor yet public — the rate
          shown is that union&apos;s own trailing average annual raise from its just-completed contract, used as a
          placeholder.
        </p>
      </Detail>

      <Detail title="Where the increase comes from (by category)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>Lines</th>
                <th style={{ ...th, textAlign: 'right' }}>2026</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 predicted</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.byCategory.map((c) => (
                <tr key={c.category} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{c.category}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{c.count}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(c.v2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(c.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(c.delta)} ({c.pct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title="The 10 biggest single-line increases">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Line item</th>
                <th style={th}>Fund / Dept</th>
                <th style={{ ...th, textAlign: 'right' }}>2026 → 2027</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.topMovers.slice(0, 10).map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{m.name}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)' }}>{m.fund} · {m.dept}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(m.v2026)} → {usd(m.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(m.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title={`Every line, projected (all ${t.lineItems.toLocaleString()} lines)`}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>
          Filter by fund or category, search a department, or sort by the biggest movers.
        </p>
        <Budget2027Table />
      </Detail>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        {p.source} {le.recentLevyIncreases} A prediction is only as good as its assumptions — they’re laid out in
        &ldquo;How this projection works&rdquo; precisely so you can change them in your head and see which way the answer moves.
      </p>
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

function MiniStat({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-info-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 13.5, fontWeight: 800 }}>{value}</div>
      <div style={{ color: 'var(--dec)', fontSize: 13, fontWeight: 900 }}>{pct}%</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ ...eyebrow, color: 'var(--rbl-text-muted)' }}>{label}</div>
      <div style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function Stat({ label, value, sub, accent, amber }: { label: string; value: string; sub?: string; accent?: boolean; amber?: boolean }) {
  return (
    <div style={{ background: amber ? 'var(--rbl-warn-bg)' : accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: amber ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
