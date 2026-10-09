import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Term from '../../components/Term'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'
import { budgetTotals, fundYears, transferFunded, TENTATIVE_YEAR } from '../../lib/funds-2027'
import { subAccountIndex, townwideSubAccountTotals, townwideCategoryTotals } from '../../lib/subaccounts'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 13.5 } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': 'var(--rbl-series-blue)',
  'Employee Benefits': 'var(--rbl-series-indigo)',
  Contractual: 'var(--rbl-series-gold)',
  'Equipment & Capital Outlay': 'var(--rbl-series-teal)',
  'Interfund / Transfers': 'var(--rbl-series-violet)',
  Other: 'var(--rbl-series-slate)',
}

/** "up 4.2%", "down 3.2%", "no change", in words: an arrow glyph is not an icon here. */
function change(from: number, to: number): string {
  if (from === to) return 'no change'
  if (!from) return 'new'
  const pct = ((to - from) / from) * 100
  return `${to > from ? 'up' : 'down'} ${Math.abs(pct) < 0.05 ? '<0.1' : Math.abs(pct).toFixed(1)}%`
}
const changeColor = (from: number, to: number) => (to > from ? 'var(--inc)' : to < from ? 'var(--dec)' : 'var(--rbl-text-muted)')

export const metadata = {
  title: 'Funds Explorer — every fund, department & line item, 2026 and the 2027 Tentative',
  description:
    'Every Town of Riverhead operating fund, drilled down to departments, spending categories and 848 account lines, reconciled to the official 2026 adopted budget, beside what the 2027 Tentative Budget proposes for each.',
}

export default function FundsPage() {
  const indexByCode = new Map(subAccountIndex.funds.map((f) => [f.code, f]))
  const categories = townwideCategoryTotals()
  const catTotal = categories.reduce((s, c) => s + c.adopted2026, 0)
  const t = budgetTotals

  return (
    <PageShell
      title="Funds Explorer"
      subtitle={`Every operating fund, drilled down to departments, spending categories and individual account lines: the 2026 adopted budget, reconciled to the dollar, beside what the ${TENTATIVE_YEAR} Tentative Budget proposes.`}
    >
      <PlainCallout
        tips={[
          { label: 'A fund', text: 'is a separate pot of money for a purpose: General (most services), Highway, Water, Sewer and so on. Each has its own balanced budget.' },
          { label: 'Open any fund', text: `to see the departments and individual spending lines inside it, with what each was budgeted for 2025 and 2026 and what the ${TENTATIVE_YEAR} Tentative proposes.` },
          { label: 'Tentative', text: `the Supervisor’s proposal for ${TENTATIVE_YEAR}. The Town Board can change it before it adopts a budget by November 20.` },
          { label: 'Reconciled', text: 'our line totals add up exactly to the Town’s official published numbers.' },
        ]}
      >
        This page shows <strong>where the Town plans to spend money</strong>, organized into separate pots called funds.
        The biggest is the General Fund, which pays for most town-wide services.
      </PlainCallout>

      {t && (
        <section aria-labelledby="proposal" style={{ ...card, marginBottom: 18 }}>
          <h2 id="proposal" style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--rbl-title)' }}>What the {TENTATIVE_YEAR} Tentative proposes</h2>
          <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, margin: '0 0 14px' }}>
            {t.operatingAdopted !== null && t.operatingTentative !== null ? (
              <>
                Not counting the Debt Service, Workers’ Compensation and Risk Retention funds, which the other funds pay for,
                spending would go from <strong>{dollars(t.operatingAdopted)}</strong> to{' '}
                <strong>{dollars(t.operatingTentative)}</strong>, {change(t.operatingAdopted, t.operatingTentative)}.{' '}
              </>
            ) : null}
            The property tax levy across all funds would go from <strong>{dollars(t.levyAdopted)}</strong> to{' '}
            <strong>{dollars(t.levyTentative)}</strong>, {change(t.levyAdopted, t.levyTentative)}. It is a proposal: the Town
            Board can change it before it adopts a budget by November 20.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <Pair label={<Term id="appropriations">Appropriations, all 19 funds</Term>} adopted={t.adopted} proposed={t.tentative} />
            <Pair label={<Term id="tax-levy">Tax levy</Term>} adopted={t.levyAdopted} proposed={t.levyTentative} />
            <Pair label={<Term id="appropriated-fund-balance">Savings used</Term>} adopted={t.fundBalanceAdopted} proposed={t.fundBalanceTentative} />
          </div>
          <p style={{ ...muted, margin: '12px 0 0', lineHeight: 1.5 }}>
            Totals of all 19 funds count the transfer-funded funds’ dollars twice. Sources: the 2026 Adopted Budget and the{' '}
            <a href={t.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{t.source.title}</a>{' '}
            Summaries. Line by line: <a href={`${base}/compare/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Budget Compare</a> and{' '}
            <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>the {TENTATIVE_YEAR} Tentative against this site’s forecast</a>.
          </p>
        </section>
      )}

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Operating funds" value={String(subAccountIndex.fundCount)} />
        <Stat label="Departments" value={String(townwideSubAccountTotals.departments)} />
        <Stat label="Account lines, 2026" value={townwideSubAccountTotals.lineItems.toLocaleString()} />
        <Stat label={<Term id="appropriations">Appropriations, 2026</Term>} value={dollars(townwideSubAccountTotals.expenditure2026)} />
        <Stat label={<Term id="reconciled">Funds reconciled</Term>} value={`${townwideSubAccountTotals.reconciledFunds} of ${subAccountIndex.fundCount}`} good />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--rbl-title)' }}>Town-wide spending by category, 2026</h2>
        <p style={{ color: 'var(--rbl-text-body)', margin: '0 0 14px' }}>How every account line across all funds adds up by spending category in the adopted budget.</p>
        <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
          {categories.map((c) => (
            <div key={c.category} title={`${c.category}: ${dollars(c.adopted2026)}`} style={{ width: `${(c.adopted2026 / catTotal) * 100}%`, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
          {categories.map((c) => (
            <span key={c.category} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--rbl-text-strong)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 10, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)', marginRight: 6 }} />
              {c.category}: {dollars(c.adopted2026)} ({((c.adopted2026 / catTotal) * 100).toFixed(1)}%)
            </span>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 14 }}>
        {allOperatingFunds2026.map((fund) => {
          const detail = indexByCode.get(fund.code)
          const { tentative } = fundYears(fund.code)
          return (
            <a key={fund.code} href={`${base}/funds/${fund.code}/`} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                  <h2 style={{ margin: 0, fontSize: 21, color: 'var(--rbl-title)' }}>{fund.name} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 15 }}>{fund.code}</span></h2>
                  <p style={{ color: 'var(--rbl-text-body)', margin: '6px 0 0' }}>{fund.description}</p>
                  {transferFunded(fund.code) && <p style={{ ...muted, margin: '6px 0 0' }}>Paid for by transfers from the other funds, so its dollars also appear in theirs.</p>}
                </div>
                <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                  <div style={muted}>Appropriations, 2026</div>
                  <strong style={{ fontSize: 22, color: 'var(--rbl-title)' }}>{dollars(fund.appropriations2026)}</strong>
                  {tentative && (
                    <div style={{ fontSize: 14, marginTop: 2 }}>
                      <span style={{ color: 'var(--rbl-text-body)' }}>{TENTATIVE_YEAR} proposed: <strong>{dollars(tentative.appropriations)}</strong></span>{' '}
                      <span style={{ color: changeColor(fund.appropriations2026, tentative.appropriations), fontWeight: 600 }}>{change(fund.appropriations2026, tentative.appropriations)}</span>
                    </div>
                  )}
                  {detail && (
                    <div style={{ color: detail.reconciled ? 'var(--rbl-success-strong)' : 'var(--rbl-danger)', fontWeight: 600, fontSize: 13, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {detail.reconciled ? <><Check size={14} strokeWidth={2.25} aria-hidden /> 2026 lines reconciled</> : `2026 lines off by ${dollars(Math.abs(detail.reconciliationVariance2026 ?? 0))}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
                <Pair label={<Term id="estimated-revenues">Estimated revenues</Term>} adopted={fund.estimatedRevenues2026} proposed={tentative?.revenues} />
                <Pair label={<Term id="appropriated-fund-balance">Savings used</Term>} adopted={fund.appropriatedFundBalance2026} proposed={tentative?.fundBalance} />
                <Pair label={<Term id="tax-levy">Tax levy</Term>} adopted={fund.taxLevy2026} proposed={tentative?.levy} />
                <Mini label="Departments and lines" value={detail ? `${detail.departmentCount} and ${detail.lineItemCount}` : '—'} />
              </div>

              <div style={{ marginTop: 14, color: 'var(--rbl-link)', fontWeight: 600 }}>
                See departments and account lines →
              </div>
            </a>
          )
        })}
      </section>
    </PageShell>
  )
}

/** One figure in 2026 and as the 2027 Tentative proposes it. */
function Pair({ label, adopted, proposed }: { label: ReactNode; adopted: number; proposed?: number | null }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: 19, color: 'var(--rbl-title)' }}>{dollars(adopted)}</strong> <span style={muted}>2026</span>
      {proposed != null && (
        <div style={{ fontSize: 13.5, marginTop: 2, color: 'var(--rbl-text-body)' }}>
          {dollars(proposed)} {TENTATIVE_YEAR} proposed{' '}
          <span style={{ color: changeColor(adopted, proposed), fontWeight: 600 }}>({change(adopted, proposed)})</span>
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: 19, color: 'var(--rbl-title)' }}>{value}</strong> <span style={muted}>2026</span>
    </div>
  )
}

function Stat({ label, value, good }: { label: ReactNode; value: string; good?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: 20, color: good ? 'var(--rbl-success-strong)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
