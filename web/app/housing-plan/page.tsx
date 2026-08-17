import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import type { Confidence } from '../../lib/community-housing'
import {
  advisoryBoardSeats,
  argumentsAgainst,
  argumentsFor,
  cpfRevenueSinceHousingTax,
  estimateCaveats,
  forgoneByYear,
  forgoneHigh,
  forgoneLow,
  forgoneThroughYear,
  fourTownTotal,
  HOUSING_FUND_RATE,
  peerTowns,
  planSteps,
  plausibilityCheck,
  riverheadTimeline,
  shelterIsland,
  sources,
  statute,
} from '../../lib/community-housing'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const millions = (n: number) => `$${(n / 1e6).toFixed(2)}M`

export const metadata = {
  title: 'Community Housing Plan — the one Peconic Bay requirement Riverhead has not met',
  description:
    "State law lets the five Peconic Bay towns levy a 0.5% transfer tax for housing, but only after the town adopts a community housing plan by local law. Four towns did it in 2022–2023 — Shelter Island's plan came in 2023. Riverhead has neither the plan nor the fund. What that has cost, measured against Riverhead's own audited transfer-tax revenue.",
}

const confidenceBadge = (c: Confidence) => {
  const palette: Record<Confidence, { bg: string; fg: string }> = {
    VERIFIED: { bg: '#dcfce7', fg: '#166534' },
    REPORTED: { bg: '#fef3c7', fg: '#92400e' },
    STATUTE: { bg: '#e0e7ff', fg: '#3730a3' },
  }
  const { bg, fg } = palette[c]
  return (
    <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3, padding: '2px 7px', borderRadius: 999, background: bg, color: fg, whiteSpace: 'nowrap' }}>
      {c}
    </span>
  )
}

const toneColor = { neutral: '#94a3b8', gap: '#b91c1c', progress: '#15803d' } as const

export default function HousingPlanPage() {
  const adopting = peerTowns.filter((t) => t.adoptedFund)
  const riverhead = peerTowns.find((t) => !t.adoptedFund)!

  return (
    <PageShell
      title="The Community Housing Plan Riverhead never wrote"
      subtitle="State law gives the five Peconic Bay towns the same tool: a half-percent transfer tax dedicated to housing, unlocked only after the town adopts a community housing plan by local law. Shelter Island adopted its plan in 2023. So did the other three. Riverhead has neither the plan nor the fund — and this page puts a number on that, using the Town's own audited transfer-tax record."
    >
      <PlainCallout
        tips={[
          { label: 'What the law offers', text: `a ${(HOUSING_FUND_RATE * 100).toFixed(1)}% real-estate transfer tax on top of the CPF's 2%, dedicated to community housing — but a town may not spend a dollar of it until it adopts a community housing plan by local law.` },
          { label: 'Where Riverhead stands', text: 'it is the only one of the five Peconic Bay towns with no plan and no fund. The Town Board declined to put the question on the 2022 ballot, so Riverhead residents never voted on it — the other four towns’ residents did, and all four said yes.' },
          { label: 'What this page is', text: 'a gap analysis, not an accusation. The board made a policy choice it was entitled to make and gave its reasons — they are laid out here alongside the case for revisiting it, and the dollar estimate is shown with the assumptions that would move it.' },
        ]}
      >
        Since collections began {statute.collectionsBegan}, the four participating towns have raised about{' '}
        <strong>{millions(fourTownTotal.amount)}</strong> for housing. Riverhead has raised{' '}
        <strong>$0</strong> — and on the Town&apos;s own audited transfer-tax revenue, the same tax here would have
        brought in roughly <strong>{millions(forgoneLow)}–{millions(forgoneHigh)}</strong> through {forgoneThroughYear}.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Peconic Bay towns with a plan + fund" value={`${adopting.length} of ${peerTowns.length}`} sub="Riverhead is the exception" />
        <Stat label="Raised by those towns" value={millions(fourTownTotal.amount)} sub={`since ${statute.collectionsBegan}`} />
        <Stat label="Raised by Riverhead" value="$0" sub="no fund exists to raise it" accent />
        <Stat label="Estimated forgone here" value={`${millions(forgoneLow)}–${millions(forgoneHigh)}`} sub={`through ${forgoneThroughYear}, from Riverhead's own CPF revenue`} accent />
        <Stat label="Buyer's transfer tax" value="2.0%" sub="2.5% in the other four towns" />
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '8px solid #4a7297' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What the law actually requires</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          The {statute.name} ({statute.citation}, enacted {statute.enactedYear} and amended {statute.amendedYear})
          names {statute.towns.join(', ')} — all five Peconic Bay towns, Riverhead included. It is not a Hamptons-only
          statute. Six steps stand between a town and a spendable housing fund, and only one of them belongs to the
          voters:
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {planSteps.map((s) => (
            <div
              key={s.step}
              style={{
                border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
                background: s.votersDecide ? '#fdf6e3' : '#f8fafc',
                borderLeft: s.votersDecide ? '5px solid #c99a2e' : '5px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: '#284a69', color: 'white', width: 22, height: 22, borderRadius: 999, display: 'inline-grid', placeItems: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{s.step}</span>
                <strong style={{ color: '#284a69', fontSize: 15 }}>{s.title}</strong>
                {confidenceBadge(s.confidence)}
                {s.votersDecide && (
                  <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3, padding: '2px 7px', borderRadius: 999, background: '#c99a2e', color: '#3b2c05' }}>
                    VOTERS DECIDE
                  </span>
                )}
              </div>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, margin: '6px 0 0' }}>{s.detail}</p>
              {s.quote && (
                <blockquote style={{ margin: '8px 0 0', padding: '8px 12px', borderLeft: '3px solid #94a3b8', background: 'white', color: '#334155', fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.55 }}>
                  &ldquo;{s.quote}&rdquo;
                  <span style={{ display: 'block', fontStyle: 'normal', color: '#64748b', fontSize: 12, marginTop: 4 }}>— {statute.citation}</span>
                </blockquote>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          <strong style={{ color: '#284a69', fontSize: 14 }}>Who sits on the advisory board that reviews the plan</strong>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 8px' }}>
            The statute specifies the seats — a town cannot staff it with insiders alone:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
            {advisoryBoardSeats.map((seat) => <li key={seat}>{seat}</li>)}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What the other four towns did — and Shelter Island in particular</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          Every figure in this table is <strong>reported</strong> — from coverage of the annual East End transfer-tax
          tallies and the towns&apos; own housing pages — not from audited statements this site parses. Riverhead&apos;s
          row is the exception: there is no fund, so there is nothing to report.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={th}>Town</th>
                <th style={th}>Referendum</th>
                <th style={{ ...th, textAlign: 'right' }}>Collected</th>
                <th style={th}>Plan status</th>
              </tr>
            </thead>
            <tbody>
              {peerTowns.map((t) => (
                <tr key={t.town} style={{ borderTop: '1px solid #e2e8f0', background: t.adoptedFund ? 'transparent' : '#fef2f2' }}>
                  <td style={{ ...td, fontWeight: 800, color: t.adoptedFund ? '#284a69' : '#b91c1c' }}>{t.town}</td>
                  <td style={td}>{t.referendum}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {t.collected != null ? usd(t.collected) : '—'}
                    <div style={{ fontWeight: 500, color: '#64748b', fontSize: 12 }}>{t.collectedAsOf ?? 'not separately reported'}</div>
                  </td>
                  <td style={td}>{t.planStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {peerTowns.filter((t) => t.adoptedFund).map((t) => (
            <div key={t.town} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
              <strong style={{ color: '#284a69', fontSize: 14 }}>{t.town}</strong>
              {confidenceBadge(t.confidence)}
              <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55, margin: '4px 0 0' }}>{t.spending}</p>
            </div>
          ))}
        </div>
        <p style={{ color: '#6b7280', fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
          Four-town total: {fourTownTotal.attribution}. {confidenceBadge(fourTownTotal.confidence)}
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderLeft: '8px solid #0284c7' }}>
        <h3 style={{ marginTop: 0, color: '#075985' }}>The Shelter Island model, step by step</h3>
        <p style={{ color: '#0c4a6e', fontSize: 14.5, lineHeight: 1.65, marginTop: 0 }}>
          Shelter Island is the smallest of the five towns by population, and it still ran the full sequence — a
          reminder that the work scales down. Its fund law came first ({shelterIsland.fundLocalLaw}), the voters approved it
          ({shelterIsland.referendum}), the town widened the board that would write the plan
          ({shelterIsland.boardExpanded}), and the plan followed in {shelterIsland.planYear}.
        </p>
        <p style={{ color: '#0c4a6e', fontSize: 14.5, lineHeight: 1.65 }}>{shelterIsland.planStatus}</p>
        <p style={{ color: '#0c4a6e', fontSize: 13.5, lineHeight: 1.6, marginBottom: 0, background: 'white', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 12px' }}>
          <strong>Sourcing gap, stated plainly:</strong> {shelterIsland.gap} {confidenceBadge(shelterIsland.confidence)}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>How Riverhead got here</h3>
        <div style={{ display: 'grid', gap: 0 }}>
          {riverheadTimeline.map((e, i) => (
            <div key={e.date + e.what} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, alignItems: 'start' }}>
              <div style={{ color: '#64748b', fontSize: 13, fontWeight: 800, paddingTop: 10, textAlign: 'right' }}>{e.date}</div>
              <div style={{ borderLeft: `3px solid ${toneColor[e.tone]}`, paddingLeft: 14, paddingTop: 10, paddingBottom: i === riverheadTimeline.length - 1 ? 0 : 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#284a69', fontSize: 14.5 }}>{e.what}</strong>
                  {confidenceBadge(e.confidence)}
                </div>
                <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '4px 0 0' }}>{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '8px solid #c99a2e' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What the same tax would have raised in Riverhead</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          This is the one part of the page built from Riverhead&apos;s own audited numbers rather than news coverage.
          The Town&apos;s CPF financial statements report exactly what a 2% transfer tax collected each year. A 0.5%
          tax is one quarter of that rate on the same conveyances, so the sizing is division, not modeling.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: 'right' }}>Riverhead CPF revenue (2%)</th>
                <th style={{ ...th, textAlign: 'right' }}>Housing fund at 0.5%</th>
              </tr>
            </thead>
            <tbody>
              {forgoneByYear.map((y) => (
                <tr key={y.year} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#284a69' }}>
                    {y.year}
                    {y.partialYear && <span style={{ color: '#92400e', fontWeight: 600, fontSize: 12, display: 'block' }}>tax began April 1 — {statute.firstYearMonths} months, not 12</span>}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.cpfRevenue)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#b45309' }}>{usd(y.quarterShare)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #cbd5e1', background: '#fffbeb' }}>
                <td style={{ ...td, fontWeight: 900, color: '#284a69' }}>Through {forgoneThroughYear}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900 }}>{usd(cpfRevenueSinceHousingTax)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: '#b45309' }}>
                  {usd(forgoneLow)} – {usd(forgoneHigh)}
                  <div style={{ fontWeight: 500, color: '#92400e', fontSize: 12 }}>low end prorates the first year to 9 months</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {estimateCaveats.map((c) => (
            <div key={c.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
              <strong style={{ color: '#284a69', fontSize: 13.5 }}>{c.label}</strong>
              <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55, margin: '3px 0 0' }}>{c.text}</p>
            </div>
          ))}
        </div>
        <p style={{ color: '#334155', fontSize: 13.5, lineHeight: 1.6, marginTop: 12, marginBottom: 0, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
          <strong>Does the number pass a smell test?</strong> {plausibilityCheck}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>The argument, both directions</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          The 2022 decision had reasons behind it, and they are not frivolous. Here they are next to the case for
          taking the question back up — so a resident can weigh both rather than be handed one.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          <div>
            <h4 style={{ color: '#b91c1c', fontSize: 15, margin: '0 0 8px' }}>Reasons the Town gave, and real costs</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {argumentsAgainst.map((a) => (
                <div key={a.point} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#991b1b', fontSize: 13.5 }}>{a.point}</strong>
                    {confidenceBadge(a.confidence)}
                  </div>
                  <p style={{ color: '#7f1d1d', fontSize: 13, lineHeight: 1.55, margin: '4px 0 0' }}>{a.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#15803d', fontSize: 15, margin: '0 0 8px' }}>Reasons to take it back up</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {argumentsFor.map((a) => (
                <div key={a.point} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#14532d', fontSize: 13.5 }}>{a.point}</strong>
                    {confidenceBadge(a.confidence)}
                  </div>
                  <p style={{ color: '#166534', fontSize: 13, lineHeight: 1.55, margin: '4px 0 0' }}>{a.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16, background: '#f8fafc' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Questions a resident can actually ask</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          The Town Board takes public comment at every meeting, and the{' '}
          <a href={`${base}/meetings/`} style={{ color: '#4a7297', fontWeight: 800 }}>vote record</a> shows who votes
          how. Four questions this page supports with sourced numbers:
        </p>
        <ol style={{ color: '#334155', fontSize: 14, lineHeight: 1.75, margin: 0, paddingLeft: 20 }}>
          <li>The 2024 Comprehensive Plan Update carries housing recommendations. What dedicated revenue is attached to them?</li>
          <li>{statute.citation} still lists Riverhead. What has changed since 2022 in the board&apos;s reading of whether it fits the town?</li>
          <li>If the tax would be decided by voters at a mandatory referendum, what is the case for not letting them decide?</li>
          <li>Would the Town publish its own estimate of what a 0.5% housing tax would raise here, net of the higher exemption floors that come with it?</li>
        </ol>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Sources</h3>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0, lineHeight: 1.6 }}>
          The statutory text, town records, and news coverage below were not directly retrievable from this build
          environment, so each claim on the page carries a confidence badge instead of an implied guarantee:{' '}
          {confidenceBadge('STATUTE')} statutory substance,{' '}
          {confidenceBadge('REPORTED')} news coverage or a town&apos;s own pages,{' '}
          {confidenceBadge('VERIFIED')} traceable to a document this site parses. Riverhead&apos;s transfer-tax
          revenue — the basis of the dollar estimate — comes from the Town&apos;s audited CPF financial statements via
          this site&apos;s own{' '}
          <a href={`${base}/community-preservation-fund/`} style={{ color: '#4a7297', fontWeight: 800 }}>
            Community Preservation Fund
          </a>{' '}
          page.
        </p>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {sources.map((s) => (
            <li key={s.url} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700, fontSize: 14 }}>
                {s.title}
              </a>
              <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{s.covers}</div>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>
        Riverhead&apos;s row in every table above reads the same way: {riverhead.planStatus.toLowerCase()}, and{' '}
        {riverhead.referendum.toLowerCase()}. That is a description of the statute and the Town&apos;s record — not a
        claim about anyone&apos;s motives.
      </p>
    </PageShell>
  )
}

const th = { padding: '10px 12px', fontSize: 12.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 0.3 }
const td = { padding: '10px 12px', color: '#334155', verticalAlign: 'top' as const, lineHeight: 1.5 }

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: accent ? '#b91c1c' : '#284a69', fontSize: 26, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: '#6b7280', fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}
