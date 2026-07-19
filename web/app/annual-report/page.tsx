import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Term from '../../components/Term'
import { dollars } from '../../lib/financial-data'
import { afr2025, generalFundAfr } from '../../lib/afr'
import { generalFund } from '../../lib/general-fund'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const

export const metadata = {
  title: '2025 Annual Report — actual year-end results',
  description:
    'What actually happened with Riverhead’s money in 2025: a $5.0M General Fund surplus, savings growth to $33.4M, plan-vs-actual, and results for all 14 funds.',
}

const CLASS_PLAIN: Record<string, string> = {
  Unassigned: 'The true "rainy-day" savings — money with no strings attached that the Town can use for any purpose.',
  Assigned: 'Savings the Town intends to use for a particular purpose but has not formally locked in.',
  Committed: 'Savings the Town Board has formally set aside for a specific use.',
  Restricted: 'Money that can only be spent on a legally required purpose.',
  Nonspendable: 'Money that is not available to spend (for example, prepaid items or inventory).',
}

export default function AnnualReportPage() {
  const gf = generalFundAfr
  const surplus = gf.surplus!['2025']
  const fb2025 = gf.fundBalance!['2025']
  const fb2024 = gf.fundBalance!['2024']
  const rev = gf.revenues!['2025']
  const exp = gf.expenditures!['2025']
  const adopted2025 = generalFund.rows.find((r) => r.year === 2025)?.appropriations ?? null

  return (
    <PageShell
      title="2025 Annual Financial Report"
      subtitle="What actually happened with the Town's money in 2025 — the year-end results filed with the New York State Comptroller, compared with the prior two years and with the 2025 budget plan."
    >
      <PlainCallout
        tips={[
          { label: 'Budget vs. actual', text: 'The budget is the plan made before the year starts. This report is the scorecard afterward — what was really collected and spent.' },
          { label: 'Surplus', text: 'When a fund takes in more than it spends in a year, the extra adds to its savings (fund balance). A deficit draws savings down.' },
          { label: 'All figures', text: 'come straight from the Town\'s official filing. Columns show 2025, 2024, and 2023 so you can see the direction of travel.' },
        ]}
      >
        This page shows the Town&apos;s <strong>actual 2025 results</strong>. The headline: the General Fund took in
        about <strong>${(surplus / 1_000_000).toFixed(1)} million more than it spent</strong>, growing its savings to
        {' '}<strong>{dollars(fb2025)}</strong>.
      </PlainCallout>

      {/* Headline stats */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label={<Term id="appropriations">Revenues + Sources</Term>} value={dollars(rev)} sub="money taken in" />
        <Stat label="Expenditures + Uses" value={dollars(exp)} sub="money spent" />
        <Stat label="2025 Surplus" value={dollars(surplus)} sub="added to savings" good accent />
        <Stat label={<Term id="fund-balance">Ending Fund Balance</Term>} value={dollars(fb2025)} sub={`up from ${dollars(fb2024)}`} />
      </section>

      {/* Budget vs actual */}
      {adopted2025 != null && (
        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>2025: Plan vs. Reality (General Fund)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <Compare label="Planned spending (adopted budget)" value={adopted2025} />
            <Compare label="Actual spending" value={exp} delta={exp - adopted2025} deltaLabel="vs. plan" />
            <Compare label="Actual money taken in" value={rev} delta={rev - adopted2025} deltaLabel="above planned spending" good />
          </div>
          <p style={{ color: '#475569', marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>
            The Town planned to spend {dollars(adopted2025)}. It actually spent {dollars(exp)} but took in {dollars(rev)},
            so revenues came in well above plan — which is what produced the {dollars(surplus)} surplus.
          </p>
        </section>
      )}

      {/* Revenue + expenditure categories */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16, marginBottom: 18 }}>
        <CategoryCard title="Where the money came from" subtitle="General Fund revenues, 2025" rows={gf.revenueCategories.map((c) => ({ name: c.category, v2025: c.values['2025'], v2024: c.values['2024'] }))} color="#0f766e" />
        <CategoryCard title="Where the money went" subtitle="General Fund spending, 2025" rows={gf.expenditureCategories.map((c) => ({ name: c.category, v2025: c.values['2025'], v2024: c.values['2024'] }))} color="#4a7297" />
      </section>

      {/* Fund balance breakdown */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>What&apos;s in the General Fund&apos;s ${(fb2025 / 1_000_000).toFixed(1)}M savings?</h2>
        <p style={{ color: '#475569', marginTop: 0 }}>Fund balance is split into categories by how freely it can be spent.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {gf.fundBalanceClasses.map((c) => {
            const v = c.values['2025']
            const pct = (v / fb2025) * 100
            return (
              <div key={c.class}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14.5 }}>
                  <strong style={{ color: '#284a69' }}>{c.class}</strong>
                  <strong>{dollars(v)} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({pct.toFixed(0)}%)</span></strong>
                </div>
                <div style={{ height: 9, background: '#f1f5f9', borderRadius: 9, marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9, background: c.class === 'Unassigned' ? '#15803d' : '#4a7297' }} />
                </div>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0', lineHeight: 1.4 }}>{CLASS_PLAIN[c.class]}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Per-fund table */}
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Every fund in 2025</h2>
        <p style={{ color: '#475569', marginTop: 0 }}>Actual money taken in, money spent, the resulting surplus or deficit, and year-end savings for each fund.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Fund</th>
                <th style={{ ...th, textAlign: 'right' }}>Money In</th>
                <th style={{ ...th, textAlign: 'right' }}>Money Out</th>
                <th style={{ ...th, textAlign: 'right' }}>Surplus / (Deficit)</th>
                <th style={{ ...th, textAlign: 'right' }}>Year-End Savings</th>
              </tr>
            </thead>
            <tbody>
              {afr2025.funds.filter((f) => f.revenues || f.expenditures).map((f) => {
                const s = f.surplus?.['2025'] ?? null
                return (
                  <tr key={f.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}><span style={{ color: '#94a3b8', fontWeight: 800, fontSize: 12 }}>{f.code}</span> {f.name}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.revenues ? dollars(f.revenues['2025']) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.expenditures ? dollars(f.expenditures['2025']) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: s == null ? '#94a3b8' : s >= 0 ? '#15803d' : '#b91c1c' }}>
                      {s == null ? '—' : s >= 0 ? dollars(s) : `(${dollars(Math.abs(s))})`}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.fundBalance ? dollars(f.fundBalance['2025']) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
          Source: {afr2025.source.title}. {afr2025.note} Enterprise funds (Water, Sewer) and some others report
          &quot;net position&quot; rather than fund balance, shown here as &quot;—&quot;.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, good }: { label: React.ReactNode; value: string; sub?: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? '#dcfce7' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: good ? '#15803d' : '#284a69' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Compare({ label, value, delta, deltaLabel, good }: { label: string; value: number; delta?: number; deltaLabel?: string; good?: boolean }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      <strong style={{ fontSize: 22, color: '#284a69' }}>{dollars(value)}</strong>
      {delta != null && (
        <div style={{ color: (good ?? delta < 0) ? '#15803d' : '#b45309', fontWeight: 800, fontSize: 13, marginTop: 2 }}>
          {delta >= 0 ? '+' : '−'}{dollars(Math.abs(delta))} {deltaLabel}
        </div>
      )}
    </div>
  )
}

function CategoryCard({ title, subtitle, rows, color }: { title: string; subtitle: string; rows: { name: string; v2025: number; v2024: number }[]; color: string }) {
  const sorted = [...rows].sort((a, b) => b.v2025 - a.v2025)
  const max = Math.max(...sorted.map((r) => r.v2025), 1)
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 2px' }}>{title}</h3>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>{subtitle}</div>
      <div style={{ display: 'grid', gap: 9 }}>
        {sorted.map((r) => {
          const change = r.v2024 ? ((r.v2025 - r.v2024) / r.v2024) * 100 : null
          return (
            <div key={r.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                <span style={{ color: '#334155' }}>{r.name}</span>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {dollars(r.v2025)}
                  {change != null && Math.abs(change) >= 0.5 && (
                    <span style={{ color: change > 0 ? '#b45309' : '#15803d', fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
                      {change > 0 ? '▲' : '▼'}{Math.abs(change).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 7, marginTop: 3 }}>
                <div style={{ width: `${(r.v2025 / max) * 100}%`, height: '100%', borderRadius: 7, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
