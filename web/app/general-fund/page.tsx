import PageShell from '../../components/PageShell'
import LineChart, { ChartLegend, type Series } from '../../components/LineChart'
import PlainCallout from '../../components/PlainCallout'
import { generalFund } from '../../lib/general-fund'
import { dollars } from '../../lib/financial-data'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const COLORS = { appropriations: '#284a69', taxLevy: '#c99a2e', estimatedRevenues: '#0f766e', appropriatedFundBalance: '#7c3aed' }

export const metadata = {
  title: 'General Fund — 20-year history',
  description:
    'Two decades of the Town of Riverhead General Fund (2005–2025): appropriations, tax levy, and revenues charted year by year from the adopted budgets.',
}

export default function GeneralFundPage() {
  const rows = generalFund.rows
  const g = generalFund.growth

  const series: Series[] = [
    { label: 'Appropriations (spending)', color: COLORS.appropriations, points: rows.map((r) => ({ x: r.year, y: r.appropriations })) },
    { label: 'Tax Levy', color: COLORS.taxLevy, points: rows.map((r) => ({ x: r.year, y: r.taxLevy })) },
    { label: 'Estimated Revenues', color: COLORS.estimatedRevenues, points: rows.map((r) => ({ x: r.year, y: r.estimatedRevenues })) },
  ]

  return (
    <PageShell
      title="General Fund — 20-Year History"
      subtitle={`How the Town's principal operating fund has grown from ${g.firstYear} to ${g.lastYear}: appropriations, tax levy, estimated revenues, and reserve use, straight from the adopted budgets.`}
    >
      <PlainCallout
        tips={[
          { label: 'Appropriations', text: 'the dark line = total planned spending. Tax levy (gold) = the amount raised from property taxes. Revenues (green) = other income like fees and state aid.' },
          { label: 'Why it matters', text: 'when the tax-levy line rises faster than spending, more of the budget is being paid for by property taxes.' },
          { label: 'Adopted figures', text: 'these are the budgeted plans approved each year, not the final year-end actuals.' },
        ]}
      >
        This page shows <strong>20 years of the General Fund</strong> — the main town budget — so you can see how spending
        and the property-tax bill have changed over time.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label={`Appropriations ${g.firstYear}`} value={dollars(rows[0].appropriations ?? 0)} />
        <Stat label={`Appropriations ${g.lastYear}`} value={dollars(rows[rows.length - 1].appropriations ?? 0)} accent />
        <Stat label="Appropriations Growth" value={`+${g.appropriationsChangePct}%`} />
        <Stat label="Tax Levy Growth" value={`+${g.taxLevyChangePct}%`} good={false} />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>General Fund {g.firstYear}–{g.lastYear}</h2>
        <LineChart series={series} yLabel="Adopted dollars" />
        <ChartLegend series={series} />
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Year-by-year detail</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: 'right' }}>Appropriations</th>
                <th style={{ ...th, textAlign: 'right' }}>Estimated Revenues</th>
                <th style={{ ...th, textAlign: 'right' }}>Fund Balance Used</th>
                <th style={{ ...th, textAlign: 'right' }}>Tax Levy</th>
                <th style={{ ...th, textAlign: 'right' }}>Levy YoY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const prev = i > 0 ? rows[i - 1].taxLevy : null
                const levyChange = prev && r.taxLevy ? ((r.taxLevy - prev) / prev) * 100 : null
                return (
                  <tr key={r.year} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...td, fontWeight: 700 }}>{r.year}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.appropriations != null ? dollars(r.appropriations) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{r.estimatedRevenues != null ? dollars(r.estimatedRevenues) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{r.appropriatedFundBalance != null ? dollars(r.appropriatedFundBalance) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{r.taxLevy != null ? dollars(r.taxLevy) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: levyChange == null ? '#6b7280' : levyChange > 0 ? 'var(--inc)' : 'var(--dec)', fontWeight: 700 }}>
                      {levyChange == null ? '—' : `${levyChange > 0 ? '+' : ''}${levyChange.toFixed(1)}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginTop: 14 }}>
        Source: {generalFund.source.title}. {generalFund.note} These are adopted (budgeted) figures, not year-end actuals.
        Gap years had no parsed adopted budget available.
      </p>
    </PageShell>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const

function Stat({ label, value, accent, good }: { label: string; value: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good === false ? '#b91c1c' : '#284a69' }}>{value}</strong>
    </div>
  )
}
