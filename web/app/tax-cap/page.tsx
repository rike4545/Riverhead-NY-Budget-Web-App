import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ProvenanceLine from '../../components/ProvenanceLine'
import ColumnChart from '../../components/charts/ColumnChart'
import StatusStrip from '../../components/charts/StatusStrip'
import data from '../../public/data/tax-cap.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const OSC_CAP = 'https://www.osc.ny.gov/local-government/property-tax-cap'
const OSC_FORMULA = 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/formula.pdf'
const OSC_2027 = 'https://www.osc.ny.gov/press/releases/2026/07/dinapoli-tax-cap-remains-2-percent-2027'
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'The tax cap & Riverhead’s overrides',
  description: 'How New York’s local-government property-tax levy limit is actually calculated, what an override does, and what Riverhead’s audited record shows.',
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  'over-no-law': { bg: 'var(--rbl-danger-bg)', fg: 'var(--rbl-danger-strong)', dot: 'var(--rbl-danger)' },
  'over-with-law': { bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)', dot: 'var(--rbl-success)' },
  proposed: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn)', dot: 'var(--rbl-warn)' },
}

const STATUS_TONES: Record<string, { label: string; color: string; bg: string; glyph: string }> = {
  'over-no-law': { label: 'Above levy limit, no override law', color: 'var(--rbl-danger)', bg: 'var(--rbl-danger-bg)', glyph: '✕' },
  'over-with-law': { label: 'Above levy limit, override adopted', color: 'var(--rbl-success)', bg: 'var(--rbl-success-bg)', glyph: '✓' },
  proposed: { label: 'Proposed', color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)', glyph: '•' },
}

const formulaSteps = [
  ['1', 'Start with the prior-year levy', 'OSC begins with the prior fiscal year levy, with specified reserve/tort adjustments where applicable.'],
  ['2', 'Apply tax-base growth', 'The Tax Department’s tax-base-growth factor reflects quantity change such as new construction or newly taxable property.'],
  ['3', 'Apply PILOT and growth-factor inputs', 'Prior-year and coming-year PILOT receivables enter the formula, together with the allowable levy growth factor.'],
  ['4', 'Add available carryover', 'Unused levy-limit capacity from the prior year can carry forward, subject to the statutory limit.'],
  ['5', 'Apply transfers and exclusions', 'Transfers of function and qualifying retirement or tort exclusions can change the final adjusted levy limit.'],
] as const

export default function TaxCapPage() {
  const d = data

  return (
    <PageShell
      title="The tax cap — the formula, the override, and Riverhead’s record"
      subtitle="The familiar 2% figure is only one input. This page separates New York’s actual levy-limit formula from Riverhead’s historical compliance record and from simple levy-growth comparisons."
    >
      <PlainCallout
        tips={[
          { label: 'Levy, not tax rate', text: 'the law limits the covered property-tax levy — not the percentage change on an individual tax bill.' },
          { label: '2% is one factor', text: 'the allowable levy growth factor is the lesser of inflation or 2%; it is not, by itself, Riverhead’s final legal levy limit.' },
          { label: 'Override means authority', text: 'a 60% local-law vote lets the Board adopt above the calculated limit, but does not require it to do so.' },
        ]}
      >
        For calendar-year local governments, OSC set the <strong>2027 allowable levy growth factor at 2%</strong>. Riverhead’s final 2027 levy limit still depends on the rest of the statutory formula and should be updated here when the Town files it.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-info-border)' }}>
        <div style={{ color: 'var(--rbl-info-text)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .6 }}>What the law actually calculates</div>
        <h2 style={{ margin: '5px 0 8px', color: 'var(--rbl-title)', fontSize: 21 }}>The levy limit is a formula, not “last year × 1.02.”</h2>
        <p style={{ color: 'var(--rbl-text-strong)', lineHeight: 1.65, marginTop: 0 }}>{d.capBasics.limit}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(210px,100%),1fr))', gap: 10, marginTop: 14 }}>
          {formulaSteps.map(([number, title, text]) => (
            <article key={number} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 13 }}>
              <div style={{ color: 'var(--rbl-badge)', fontWeight: 950, fontSize: 11 }}>STEP {number}</div>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{title}</strong>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, marginBottom: 0 }}>{text}</p>
            </article>
          ))}
        </div>
        <ProvenanceLine
          claimId="tax-cap-formula"
          status="official"
          source="NYS OSC local-government property-tax-cap formula"
          sourceHref={OSC_FORMULA}
          asOf="current OSC guidance; 2027 growth factor announced July 15, 2026"
          evidenceHref={`${base}/sources/#osc-guidance`}
        />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>What an override does — and does not do</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{d.capBasics.override}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 10 }}>
          <Fact title="Required vote" text="At least 60% of the governing body’s voting power. On a five-member Town Board, that is three votes." />
          <Fact title="Timing" text="The override local law must be enacted before adoption of a budget whose levy exceeds the calculated limit." />
          <Fact title="Not a mandate to exceed" text="The Board can authorize an override and still adopt a final levy at or below the calculated limit." />
        </div>
        <ProvenanceLine claimId="override-rule" status="official" source="NYS OSC tax-cap guidance" sourceHref={OSC_CAP} asOf="current guidance" evidenceHref={`${base}/sources/#osc-guidance`} />
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ color: 'var(--rbl-danger-strong)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .6 }}>Riverhead historical finding</div>
        <h2 style={{ margin: '5px 0 8px', color: 'var(--rbl-title)', fontSize: 20 }}>The auditor reported a multi-year compliance failure.</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{d.finding.headline} {d.finding.cause}</p>
        <blockquote style={{ margin: '0 0 12px', padding: '12px 16px', background: 'var(--rbl-danger-bg)', borderLeft: '4px solid var(--rbl-danger-border)', borderRadius: 8, color: 'var(--rbl-danger-strong)', fontSize: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
          “{d.finding.auditQuote}”
          <span style={{ display: 'block', fontStyle: 'normal', fontSize: 12, color: 'var(--rbl-warn)', marginTop: 6 }}>— Town of Riverhead 2022 Audited Basic Financial Statements</span>
        </blockquote>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}><strong>Later treatment.</strong> {d.finding.correction}</p>
        <ProvenanceLine claimId="riverhead-cap-history" status="official" source="Town of Riverhead audited financial statements and adopted override local laws" asOf="2018–2026 historical record" evidenceHref={`${base}/sources/`} />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <StatusStrip
          title="Nine budget years of override/compliance status"
          lede="This timeline describes whether the record shows an above-limit levy and whether the required override local law was used. It is not derived from the General Fund chart below."
          years={d.capStatus.map((c) => ({ year: c.year, status: c.status, detail: `${c.year}: ${c.label}` }))}
          tones={STATUS_TONES}
          source="Town audited financial statements and adopted override local laws."
        />
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {d.capStatus.map((c) => {
            const st = STATUS_STYLE[c.status]
            return <div key={c.year} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 10, background: st.bg }}><span style={{ width: 10, height: 10, borderRadius: 999, background: st.dot, flexShrink: 0 }} /><span style={{ fontWeight: 900, color: 'var(--rbl-title)', minWidth: 46 }}>{c.year}</span><span style={{ color: st.fg, fontWeight: 700, fontSize: 14 }}>{c.label}</span></div>
          })}
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>What this means for residents</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(250px,100%),1fr))', gap: 14, marginBottom: 16 }}>
        {d.implications.map((im) => <article key={im.title} style={{ ...card, borderTop: '5px solid var(--rbl-accent-border)' }}><h3 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 16 }}>{im.title}</h3><p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{im.text}</p></article>)}
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <ColumnChart
          title="General Fund levy growth vs. a 2% reference line"
          lede="This is a directional spending/tax-pressure chart, not a tax-cap compliance test. A bar above 2% only means this General Fund series grew faster than that reference."
          columns={d.levyContext.rows.map((r) => ({ label: String(r.year), value: r.pct, display: `${r.pct > 0 ? '+' : ''}${r.pct.toFixed(1)}%`, emphasis: r.pct > 2, color: r.pct > 2 ? 'var(--rbl-danger)' : 'var(--rbl-series-slate)' }))}
          format={(n) => `${n.toFixed(1)}%`}
          threshold={{ value: 2, label: '2% growth reference' }}
          legend={[{ label: 'Above 2% reference', color: 'var(--rbl-danger)' }, { label: 'At/below reference', color: 'var(--rbl-series-slate)' }]}
          source="General Fund levy only; not the statutory town-wide tax-cap measure."
        />
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>{d.levyContext.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Year</th><th style={{ ...th, textAlign: 'right' }}>General Fund levy</th><th style={{ ...th, textAlign: 'right' }}>Change</th></tr></thead>
            <tbody>{d.levyContext.rows.map((r) => <tr key={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}><td style={{ ...td, fontWeight: 700 }}>{r.year}</td><td style={{ ...td, textAlign: 'right' }}>{usd(r.levy)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.pct > 0 ? '+' : ''}{r.pct.toFixed(2)}%</td></tr>)}</tbody>
          </table>
        </div>
        <ProvenanceLine claimId="general-fund-growth-context" status="calculated" source="Published General Fund levy series" asOf="latest indexed historical series" calculation="Year-over-year General Fund levy change; not the statutory levy-limit calculation" evidenceHref={`${base}/sources/`} />
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>2027: what is known now</h2>
        <p style={{ color: 'var(--rbl-text-strong)', lineHeight: 1.6 }}>OSC set the 2027 allowable levy growth factor at <strong>2%</strong> for calendar-year local governments because its inflation factor was 3.13%. That does not determine Riverhead’s final filed limit on its own.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}><a href={`${base}/predict-2027/`} style={pillLink}>Open 2027 scenarios →</a><a href={OSC_2027} target="_blank" rel="noreferrer" style={pillLink}>OSC 2027 announcement ↗</a><a href={`${base}/sources/#osc-guidance`} style={pillLink}>Authority sources →</a></div>
        <ProvenanceLine claimId="2027-growth-factor" status="official" source="NYS OSC — 2027 allowable levy growth factor" sourceHref={OSC_2027} asOf="July 15, 2026" evidenceHref={`${base}/sources/#osc-guidance`} />
      </section>
    </PageShell>
  )
}

function Fact({ title, text }: { title: string; text: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 12 }}><strong style={{ color: 'var(--rbl-title)', fontSize: 13.5 }}>{title}</strong><div style={{ color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, marginTop: 3 }}>{text}</div></div>
}

const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const
const pillLink = { background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '7px 12px', color: 'var(--rbl-link)', fontWeight: 800, fontSize: 12.8, textDecoration: 'none' } as const
