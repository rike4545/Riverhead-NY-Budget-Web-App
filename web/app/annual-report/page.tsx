import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Term from '../../components/Term'
import { dollars } from '../../lib/financial-data'
import { afr2025, generalFundAfr } from '../../lib/afr'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS, AUDIT_2025, auditedGrowth, auditVsReport, deficitHistory } from '../../lib/audits'
import { generalFund } from '../../lib/general-fund'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const

const audited = AUDITED_OPERATIONS[2025]
const m = (n: number) => `$${(n / 1e6).toFixed(1)}M`

export const metadata = {
  title: '2025 Annual Report — actual year-end results',
  description:
    `What actually happened with Riverhead’s money in 2025: the audited General Fund result (${m(audited.netChange)} added, ${m(audited.ending)} at year-end), the Town’s own unaudited report beside it, plan-vs-actual, and results for all 14 funds.`,
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
  const rev = gf.revenues!['2025']
  const exp = gf.expenditures!['2025']
  const adopted2025 = generalFund.rows.find((r) => r.year === 2025)?.appropriations ?? null

  const a25 = AUDITED_GENERAL_FUND[2025]
  const revenueGrowth = auditedGrowth(2025, 'revenues')!
  const spendingGrowth = auditedGrowth(2025, 'expenditures')!
  const taxGrowth = auditedGrowth(2025, 'realPropertyTaxes')!
  const benefitsGrowth = auditedGrowth(2025, 'employeeBenefits')!
  const netTransfersOut = audited.transfersOut - audited.transfersIn
  const reportOf = (year: number) =>
    auditVsReport(year, Object.fromEntries([
      ...gf.fundBalanceClasses.map((c) => [c.class, c.values[String(year)]]),
      ['Total', gf.fundBalance?.[String(year)] ?? 0],
    ]))
  const vs2025 = reportOf(2025)!
  const vs2024 = reportOf(2024)
  const unassigned = (v: NonNullable<ReturnType<typeof reportOf>>) => v.rows.find((r) => r.name === 'Unassigned')!
  const deficits = deficitHistory[deficitHistory.length - 1]
  const pct1 = (n: number) => `${n.toFixed(1)}%`

  return (
    <PageShell
      title="2025 Annual Financial Report"
      subtitle="What actually happened with the Town's money in 2025 — the independent audit's General Fund result, and the year-end results for every fund filed with the New York State Comptroller, compared with the prior two years and with the 2025 budget plan."
    >
      <PlainCallout
        tips={[
          { label: 'Budget vs. actual', text: 'The budget is the plan made before the year starts. This report is the scorecard afterward — what was really collected and spent.' },
          { label: 'Surplus', text: 'When a fund takes in more than it spends in a year, the extra adds to its savings (fund balance). A deficit draws savings down.' },
          { label: 'Two sources', text: 'The General Fund figures at the top are the independent audit\'s. Everything else comes from the Town\'s own Annual Financial Report, which is not audited. Columns show 2025, 2024, and 2023 so you can see the direction of travel.' },
        ]}
      >
        This page shows the Town&apos;s <strong>actual 2025 results</strong>. The headline, from the independent audit
        the Town Board accepted on {AUDIT_2025.accepted.date}: the General Fund added{' '}
        <strong>{dollars(audited.netChange)}</strong> to its savings, which reached <strong>{dollars(audited.ending)}</strong>.
        Revenue grew {pct1(revenueGrowth.pct)} on 2024 and spending {pct1(spendingGrowth.pct)}.
      </PlainCallout>

      {/* Headline stats: the audit */}
      <section data-audited-result style={{ ...card, marginBottom: 18 }}>
        <div style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
          General Fund, audited
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
          <Stat label="Revenues" value={dollars(audited.revenues)} sub={`up ${pct1(revenueGrowth.pct)} from ${dollars(revenueGrowth.before)} in 2024`} />
          <Stat label="Expenditures" value={dollars(audited.expenditures)} sub={`up ${pct1(spendingGrowth.pct)} from ${dollars(spendingGrowth.before)} in 2024`} />
          <Stat label="Added to savings" value={dollars(audited.netChange)} sub={`after ${dollars(netTransfersOut)} of net transfers to other funds`} good accent />
          <Stat label={<Term id="fund-balance">Ending Fund Balance</Term>} value={dollars(audited.ending)} sub={`up from ${dollars(audited.beginning)}`} />
        </div>
        <p style={{ color: 'var(--rbl-text-body)', marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>
          Property taxes supplied most of the revenue growth, up {dollars(taxGrowth.change)} to {dollars(taxGrowth.now)}.
          Employee benefits were most of the spending growth, up {dollars(benefitsGrowth.change)} to{' '}
          {dollars(benefitsGrowth.now)}. Source:{' '}
          <a href={AUDIT_2025.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)' }}>
            {AUDIT_2025.source.title}
          </a>
          , packet p. {audited.page} (statement of revenues, expenditures and changes in fund balances); the 2024 figures
          are from the 2024 audit, p. {AUDITED_OPERATIONS[2024].page}. The audit is not on the Town&apos;s Financial Reports
          page yet.
        </p>
      </section>

      {/* The audit against the Town's own report */}
      <section data-audit-vs-report style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>The audit and the Town&apos;s own report</h2>
        <p style={{ color: 'var(--rbl-text-body)', marginTop: 0, lineHeight: 1.55 }}>
          The Town files its Annual Financial Report with the State Comptroller each spring, before the audit is done, and
          the report is not audited. For 2025 the two end the General Fund&apos;s year {dollars(Math.abs(vs2025.rows.find((r) => r.name === 'Total')!.difference))}{' '}
          apart, and they sort the balance into its five tiers differently. The report counts less as Assigned, so its
          unassigned balance, the figure every reserve test measures, runs higher. The site uses the audit&apos;s wherever
          there is one.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>December 31, 2025</th>
                <th style={{ ...th, textAlign: 'right' }}>Town&apos;s report (unaudited)</th>
                <th style={{ ...th, textAlign: 'right' }}>Audit</th>
                <th style={{ ...th, textAlign: 'right' }}>Difference</th>
              </tr>
            </thead>
            <tbody>
              {vs2025.rows.map((r) => (
                <tr key={r.name} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', fontWeight: r.name === 'Total' || r.name === 'Unassigned' ? 800 : 400 }}>
                  <td style={td}>{r.name === 'Total' ? 'Total fund balance' : r.name}</td>
                  <td data-label="Town’s report" style={{ ...td, textAlign: 'right' }}>{dollars(r.reported)}</td>
                  <td data-label="Audit" style={{ ...td, textAlign: 'right' }}>{dollars(r.audited)}</td>
                  <td data-label="Difference" style={{ ...td, textAlign: 'right', color: r.difference === 0 ? 'var(--rbl-text-muted)' : 'var(--rbl-text-strong)' }}>
                    {r.difference === 0 ? '—' : `${r.difference > 0 ? '+' : '−'}${dollars(Math.abs(r.difference))}`}
                  </td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={td}>Added during 2025</td>
                <td data-label="Town’s report" style={{ ...td, textAlign: 'right' }}>{dollars(surplus)}</td>
                <td data-label="Audit" style={{ ...td, textAlign: 'right' }}>{dollars(audited.netChange)}</td>
                <td data-label="Difference" style={{ ...td, textAlign: 'right' }}>−{dollars(Math.round(surplus) - audited.netChange)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, marginBottom: 0 }}>
          What the audit counts as Assigned: {dollars(a25.assigned.subsequentYearsBudget)} to help balance the next
          year&apos;s budget, {dollars(a25.assigned.purchasesOnOrder)} of purchase orders still open at year-end, and{' '}
          {dollars(a25.assigned.miscellaneousDesignations)} of designations, most of it for{' '}
          {AUDIT_2025.designations.map((d, i) => (
            <span key={d.purpose}>
              {i > 0 ? (i === AUDIT_2025.designations.length - 1 ? ' and ' : ', ') : ''}
              {d.purpose} ({dollars(d.amount)})
            </span>
          ))}
          . The report has {dollars(vs2025.rows.find((r) => r.name === 'Assigned')!.reported)} in that tier.
          {vs2024 ? (
            <>
              {' '}It is not a one-year quirk: for 2024 the report&apos;s unassigned balance was{' '}
              {dollars(unassigned(vs2024).reported)} and the audit&apos;s {dollars(unassigned(vs2024).audited)}.
            </>
          ) : null}{' '}
          The General Fund&apos;s balance is also net of year-end deficits in two programs reported inside it: the{' '}
          <a href={`${base}/funds/A06/`} style={{ color: 'var(--rbl-link)' }}>Recreation Program Fund</a> ({dollars(deficits.recreationProgram)}) and the{' '}
          <a href={`${base}/funds/A04/`} style={{ color: 'var(--rbl-link)' }}>Police Athletic League</a> ({dollars(deficits.pal)}).
        </p>
      </section>

      {/* Budget vs actual */}
      {adopted2025 != null && (
        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>2025: Plan vs. Reality (General Fund, Town&apos;s report)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <Compare label="Planned spending (adopted budget)" value={adopted2025} />
            <Compare label="Actual spending" value={exp} delta={exp - adopted2025} deltaLabel="vs. plan" />
            <Compare label="Actual money taken in" value={rev} delta={rev - adopted2025} deltaLabel="above planned spending" good />
          </div>
          <p style={{ color: 'var(--rbl-text-body)', marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>
            The Town planned to spend {dollars(adopted2025)}. By its own report it actually spent {dollars(exp)} but took
            in {dollars(rev)}, so revenues came in well above plan — which is what produced the report&apos;s{' '}
            {dollars(surplus)} surplus. These totals include transfers between funds and are counted differently from the
            audit&apos;s, which is why they run higher than the audited figures above.
          </p>
        </section>
      )}

      {/* Revenue + expenditure categories */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 16, marginBottom: 18 }}>
        <CategoryCard title="Where the money came from" subtitle="General Fund revenues, 2025 (Town’s report)" rows={gf.revenueCategories.map((c) => ({ name: c.category, v2025: c.values['2025'], v2024: c.values['2024'] }))} color="var(--rbl-series-teal)" />
        <CategoryCard title="Where the money went" subtitle="General Fund spending, 2025 (Town’s report)" rows={gf.expenditureCategories.map((c) => ({ name: c.category, v2025: c.values['2025'], v2024: c.values['2024'] }))} color="var(--rbl-series-blue)" />
      </section>

      {/* Fund balance breakdown */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>What&apos;s in the General Fund&apos;s {m(a25.total)} savings?</h2>
        <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>
          Fund balance is split into categories by how freely it can be spent. These are the audit&apos;s; the Town&apos;s
          unaudited report is shown under each.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {vs2025.rows.filter((r) => r.name !== 'Total').map((r) => {
            const v = r.audited
            const pct = (v / a25.total) * 100
            return (
              <div key={r.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14.5 }}>
                  <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                  <strong>{dollars(v)} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600 }}>({pct.toFixed(0)}%)</span></strong>
                </div>
                <div style={{ height: 9, background: 'var(--rbl-surface-3)', borderRadius: 9, marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9, background: r.name === 'Unassigned' ? 'var(--rbl-fill-success)' : 'var(--rbl-fill-accent)' }} />
                </div>
                <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '4px 0 0', lineHeight: 1.4 }}>
                  {CLASS_PLAIN[r.name]}
                  {r.difference !== 0 ? ` Town’s unaudited report: ${dollars(r.reported)}.` : ''}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Per-fund table */}
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Every fund in 2025</h2>
        <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>Actual money taken in, money spent, the resulting surplus or deficit, and year-end savings for each fund.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
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
                  <tr key={f.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}><span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800, fontSize: 12 }}>{f.code}</span> {f.name}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.revenues ? dollars(f.revenues['2025']) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.expenditures ? dollars(f.expenditures['2025']) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: s == null ? 'var(--rbl-text-muted)' : s >= 0 ? 'var(--rbl-success)' : 'var(--rbl-danger)' }}>
                      {s == null ? '—' : s >= 0 ? dollars(s) : `(${dollars(Math.abs(s))})`}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{f.fundBalance ? dollars(f.fundBalance['2025']) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
          Source: {afr2025.source.title}, which is not audited; for the General Fund the audited figures are at the top
          of this page. {afr2025.note} Enterprise funds (Water, Sewer) and some others report
          &quot;net position&quot; rather than fund balance, shown here as &quot;—&quot;.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, good }: { label: React.ReactNode; value: string; sub?: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: good ? 'var(--rbl-success)' : 'var(--rbl-title)' }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Compare({ label, value, delta, deltaLabel, good }: { label: string; value: number; delta?: number; deltaLabel?: string; good?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      <strong style={{ fontSize: 22, color: 'var(--rbl-title)' }}>{dollars(value)}</strong>
      {delta != null && (
        <div style={{ color: (good ?? delta < 0) ? 'var(--rbl-success)' : 'var(--rbl-warn)', fontWeight: 800, fontSize: 13, marginTop: 2 }}>
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
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginBottom: 12 }}>{subtitle}</div>
      <div style={{ display: 'grid', gap: 9 }}>
        {sorted.map((r) => {
          const change = r.v2024 ? ((r.v2025 - r.v2024) / r.v2024) * 100 : null
          return (
            <div key={r.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                <span style={{ color: 'var(--rbl-text-strong)' }}>{r.name}</span>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {dollars(r.v2025)}
                  {change != null && Math.abs(change) >= 0.5 && (
                    <span style={{ color: change > 0 ? 'var(--rbl-warn)' : 'var(--rbl-success)', fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
                      {change > 0 ? '▲' : '▼'}{Math.abs(change).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              <div style={{ height: 7, background: 'var(--rbl-surface-3)', borderRadius: 7, marginTop: 3 }}>
                <div style={{ width: `${(r.v2025 / max) * 100}%`, height: '100%', borderRadius: 7, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
