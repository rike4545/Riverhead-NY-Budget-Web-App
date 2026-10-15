import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Term from '../../components/Term'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'
import { budgetTotals, fundYears, transferFunded, TENTATIVE_YEAR } from '../../lib/funds-2027'
import { cpfDebtTransfer } from '../../lib/outlier-watch'
import { districtHoldings, generalFundLetter, generalFundResults, savings, tentativeFundBalances } from '../../lib/savings-used'
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
/** "up $75,000 (3.5%)", "down $300,000 (24.0%)", "no change". */
function changeBy(from: number, to: number): string {
  if (from === to) return 'no change'
  if (!from) return 'new'
  return `${to > from ? 'up' : 'down'} ${dollars(Math.abs(to - from))} (${change(from, to).split(' ')[1]})`
}
const pctText = (n: number) => `${n.toFixed(1)}%`
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { padding: '8px 10px', fontWeight: 600, fontSize: 13.5 } as const
const td = { padding: '9px 10px', verticalAlign: 'top' } as const
const caption = { textAlign: 'left', color: 'var(--rbl-text-body)', fontWeight: 600, fontSize: 15, padding: '0 0 8px' } as const

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
          { label: 'Savings used', text: 'money left over from earlier years that a fund counts as income to balance its budget. A section below shows which funds use it and how much.' },
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
                Leaving out the Debt Service, Workers’ Compensation and Risk Retention funds, which the other funds pay for,
                spending would go from <strong>{dollars(t.operatingAdopted)}</strong> in 2026 to{' '}
                <strong>{dollars(t.operatingTentative)}</strong>, {changeBy(t.operatingAdopted, t.operatingTentative)}.{' '}
              </>
            ) : null}
            The property tax levy across all funds would go from <strong>{dollars(t.levyAdopted)}</strong> to{' '}
            <strong>{dollars(t.levyTentative)}</strong>, {changeBy(t.levyAdopted, t.levyTentative)}. It is a proposal: the Town
            Board can change it before it adopts a budget by November 20.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <Pair label={<Term id="appropriations">Appropriations, all 19 funds</Term>} adopted={t.adopted} proposed={t.tentative} />
            <Pair label={<Term id="tax-levy">Property tax levy</Term>} adopted={t.levyAdopted} proposed={t.levyTentative} />
            <Pair
              label={<Term id="appropriated-fund-balance">Savings used to balance the budget</Term>}
              adopted={t.fundBalanceAdopted}
              proposed={t.fundBalanceTentative}
              note={savings ? <a href="#savings" style={{ ...link, fontSize: 13.5, display: 'inline-block', marginTop: 6 }}>Which funds use it, and how</a> : null}
            />
          </div>
          <p style={{ ...muted, margin: '12px 0 0', lineHeight: 1.5 }}>
            The all-funds total counts some dollars twice: the Debt Service, Workers’ Compensation and Risk Retention funds
            are paid for by transfers from the other funds, so their spending also appears in those funds’ budgets. That is
            why the paragraph above leaves them out. Sources: the Summary pages of the 2026 Adopted Budget and the{' '}
            <a href={t.source.url} target="_blank" rel="noreferrer" style={link}>{t.source.title}</a>. Line by line:{' '}
            <a href={`${base}/compare/`} style={link}>Budget Compare</a> and{' '}
            <a href={`${base}/tentative-2027/`} style={link}>the {TENTATIVE_YEAR} Tentative against this site’s forecast</a>.
          </p>
        </section>
      )}

      <SavingsSection />

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
                  <div style={muted}><Term id="appropriations" plain>Appropriations</Term>, 2026 adopted</div>
                  <strong style={{ fontSize: 22, color: 'var(--rbl-title)' }}>{dollars(fund.appropriations2026)}</strong>
                  {tentative && (
                    <div style={{ fontSize: 14, marginTop: 2 }}>
                      <span style={{ color: 'var(--rbl-text-body)' }}>{TENTATIVE_YEAR} proposed: <strong>{dollars(tentative.appropriations)}</strong></span>{' '}
                      <span style={{ color: changeColor(fund.appropriations2026, tentative.appropriations), fontWeight: 600 }}>{changeBy(fund.appropriations2026, tentative.appropriations)}</span>
                    </div>
                  )}
                  {detail && (
                    <div style={{ color: detail.reconciled ? 'var(--rbl-success-strong)' : 'var(--rbl-danger)', fontWeight: 600, fontSize: 13, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {detail.reconciled ? <><Check size={14} strokeWidth={2.25} aria-hidden /> 2026 lines reconciled</> : `2026 lines off by ${dollars(Math.abs(detail.reconciliationVariance2026 ?? 0))}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
                <Pair label={<Term id="estimated-revenues" plain>Other revenues</Term>} adopted={fund.estimatedRevenues2026} proposed={tentative?.revenues} />
                <Pair
                  label={<Term id="appropriated-fund-balance" plain>Savings used</Term>}
                  adopted={fund.appropriatedFundBalance2026}
                  proposed={tentative?.fundBalance}
                  note={setAsideNote(fund.code)}
                />
                <Pair label={<Term id="tax-levy" plain>Property tax levy</Term>} adopted={fund.taxLevy2026} proposed={tentative?.levy} />
                <Size departments={detail?.departmentCount} lines={detail?.lineItemCount} />
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

const tile = { background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 } as const
const tileLabel = { color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600, marginBottom: 4 } as const
const figure = { margin: 0, textAlign: 'right', fontWeight: 700, fontSize: 17, color: 'var(--rbl-title)' } as const

/** One figure as the 2026 budget adopted it and as the 2027 Tentative proposes it, each on its own labelled row. */
function Pair({ label, adopted, proposed, note }: { label: ReactNode; adopted: number; proposed?: number | null; note?: ReactNode }) {
  const none = adopted === 0 && !proposed
  return (
    <div style={tile}>
      <div style={tileLabel}>{label}</div>
      {none ? (
        <strong style={{ fontSize: 17, color: 'var(--rbl-text-body)' }}>None{proposed != null ? ' in either year' : ' in 2026'}</strong>
      ) : (
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 10, rowGap: 2, alignItems: 'baseline' }}>
          <dt style={muted}>2026 adopted</dt>
          <dd style={figure}>{dollars(adopted)}</dd>
          {proposed != null && (
            <>
              <dt style={muted}>{TENTATIVE_YEAR} proposed</dt>
              <dd style={figure}>{dollars(proposed)}</dd>
            </>
          )}
        </dl>
      )}
      {!none && proposed != null && (
        <div style={{ fontSize: 13.5, marginTop: 4, textAlign: 'right', color: changeColor(adopted, proposed), fontWeight: 600 }}>{changeBy(adopted, proposed)}</div>
      )}
      {note}
    </div>
  )
}

/** How many departments and account lines a fund's 2026 budget has. */
function Size({ departments, lines }: { departments?: number; lines?: number }) {
  return (
    <div style={tile}>
      <div style={tileLabel}>In the 2026 budget</div>
      {departments == null || lines == null ? (
        <strong style={{ fontSize: 17, color: 'var(--rbl-text-body)' }}>No line detail</strong>
      ) : (
        <div style={{ color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.5 }}>
          <strong style={{ fontSize: 17, color: 'var(--rbl-title)' }}>{departments}</strong> {departments === 1 ? 'department' : 'departments'}
          <br />
          <strong style={{ fontSize: 17, color: 'var(--rbl-title)' }}>{lines}</strong> account lines
        </div>
      )}
    </div>
  )
}

/** A fund card's line on the money its budget sets aside into savings, if any. */
function setAsideNote(code: string) {
  const own = savings?.setAsides.filter((x) => x.code === code) ?? []
  if (!own.length) return null
  const adopted = own.reduce((sum, x) => sum + x.adopted, 0)
  const proposed = own.reduce((sum, x) => sum + x.proposed, 0)
  return (
    <div style={{ ...muted, marginTop: 6, lineHeight: 1.45 }}>
      Also sets money aside: {dollars(adopted)} in 2026, {dollars(proposed)} proposed for {TENTATIVE_YEAR}.
    </div>
  )
}

const signedUsd = (n: number) => (n === 0 ? 'no change' : `${n > 0 ? '+' : '−'}${dollars(Math.abs(n))}`)
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const count = (n: number) => NUMBER_WORDS[n] ?? String(n)
const Count = (n: number) => { const w = count(n); return w[0].toUpperCase() + w.slice(1) }
const headRow = { textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border)' } as const
const bodyRow = { borderBottom: '1px solid var(--rbl-border-subtle)' } as const
const totalRow = { borderTop: '2px solid var(--rbl-border)' } as const
const h3 = { margin: '22px 0 6px', fontSize: 17.5, color: 'var(--rbl-title)' } as const
const prose = { color: 'var(--rbl-text-body)', lineHeight: 1.6, margin: '0 0 12px', maxWidth: '72ch' } as const
const words = (items: string[]) => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/**
 * What the "savings used" line pays for, fund by fund, and what the budget
 * sets aside. Figures from lib/savings-used.ts; scripts/verify-funds-savings.mjs
 * holds the built page to the same records.
 */
function SavingsSection() {
  if (!savings) return null
  const { rows, setAsides, totals, supplement, funds, actualYearBlank } = savings
  const cite = (page: number | null) =>
    page && supplement ? <a href={`${supplement.url}#page=${page}`} target="_blank" rel="noreferrer" style={link}>p. {page}</a> : '—'
  const utility = rows.filter((r) => /^E[SW]/.test(r.code))
  const utilityTotal = utility.reduce((sum, r) => sum + r.proposed, 0)
  const leaning = [...rows].sort((a, b) => b.sharePct - a.sharePct)
  const longRun = utility.length > 0 && utility.every((r) => r.since !== null && r.since === utility[0].since && r.since < TENTATIVE_YEAR - 1) ? utility[0].since : null
  const gf = rows.find((r) => r.code === 'A01')
  const both = rows.filter((r) => r.proposed > 0 && r.setAside && r.setAside.proposed > 0)
  const adding = setAsides.filter((x) => x.proposed > 0)
  const cpf = cpfDebtTransfer && cpfDebtTransfer.transfer.to === 0 && cpfDebtTransfer.contribution.from === 0 && cpfDebtTransfer.contribution.to === cpfDebtTransfer.transfer.from
    ? cpfDebtTransfer.contribution.to
    : null
  const recreation = setAsides.find((x) => x.code === 'A06' && x.proposed > 0)

  return (
    <section id="savings" aria-labelledby="savings-title" style={{ ...card, marginBottom: 18 }}>
      <h2 id="savings-title" style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--rbl-title)' }}>How savings help balance the budget</h2>
      <p style={prose}>
        The {TENTATIVE_YEAR} Tentative plans to use <strong>{dollars(totals.proposed)}</strong> of savings,{' '}
        {changeBy(totals.adopted, totals.proposed)} from the <strong>{dollars(totals.adopted)}</strong> in the 2026 budget.
        That money is not spent on any one thing. Each fund’s budget lists its share as income, under the name
        “appropriated fund balance”: money left over from earlier years that pays part of this year’s bills, so less has
        to come from taxes and charges. {Count(rows.length)} of the {funds} funds use it, and each uses only its own savings: a
        sewer district’s cannot pay for General Fund services.
      </p>

      <div role="region" tabIndex={0} aria-labelledby="savings-used-caption" style={{ overflowX: 'auto' }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <caption id="savings-used-caption" style={caption}>Savings used, by fund</caption>
          <thead>
            <tr style={headRow}>
              <th scope="col" style={th}>Fund</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>2026 adopted</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>{TENTATIVE_YEAR} proposed</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Change</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Share of its {TENTATIVE_YEAR} spending</th>
              <th scope="col" style={th}>Budget Supplement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} style={bodyRow}>
                <td style={{ ...td, fontWeight: 700 }}>
                  <a href={`${base}/funds/${r.code}/`} style={{ color: 'var(--rbl-title)' }}>{r.name}</a>{' '}
                  <span style={{ ...muted, fontWeight: 400 }}>{r.code}</span>
                </td>
                <td data-label="2026 adopted" style={{ ...td, textAlign: 'right' }}>{dollars(r.adopted)}</td>
                <td data-label={`${TENTATIVE_YEAR} proposed`} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(r.proposed)}</td>
                <td data-label="Change" style={{ ...td, textAlign: 'right', fontWeight: 600, color: changeColor(r.adopted, r.proposed) }}>{signedUsd(r.proposed - r.adopted)}</td>
                <td data-label={`Share of its ${TENTATIVE_YEAR} spending`} style={{ ...td, textAlign: 'right' }}>{pctText(r.sharePct)}</td>
                <td data-label="Budget Supplement" style={td}>{cite(r.page)}</td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...td, fontWeight: 700 }}>All funds</td>
              <td data-label="2026 adopted" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(totals.adopted)}</td>
              <td data-label={`${TENTATIVE_YEAR} proposed`} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(totals.proposed)}</td>
              <td data-label="Change" style={{ ...td, textAlign: 'right', fontWeight: 600, color: changeColor(totals.adopted, totals.proposed) }}>{signedUsd(totals.proposed - totals.adopted)}</td>
              <td style={td} aria-hidden />
              <td style={td} aria-hidden />
            </tr>
          </tbody>
        </table>
      </div>

      <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8, margin: '14px 0 0' }}>
        {utilityTotal * 2 > totals.proposed && (
          <li>
            <strong>Most of it is in the water and sewer districts:</strong> {dollars(utilityTotal)} of the{' '}
            {dollars(totals.proposed)}, or {pctText((utilityTotal / totals.proposed) * 100)}. Each district is paid for by the people it
            serves, through its own charges and taxes, so its savings belong to them.
          </li>
        )}
        {leaning.length >= 2 && (
          <li>
            <strong>The {leaning[0].name} leans on savings most.</strong> Savings would pay {pctText(leaning[0].sharePct)} of its
            proposed spending, about {dollars(Math.round(leaning[0].sharePct))} of every $100. The {leaning[1].name}’s share is{' '}
            {pctText(leaning[1].sharePct)}{leaning[2] ? <>, the {leaning[2].name}’s {pctText(leaning[2].sharePct)}</> : null}.
          </li>
        )}
        {longRun !== null && (
          <li>
            <strong>It happens every year.</strong> Every budget from {longRun} through the {TENTATIVE_YEAR} Tentative plans to use
            savings in the {words(utility.map((r) => r.name))}.
          </li>
        )}
        {gf && (
          <li>
            <strong>The General Fund would use {dollars(gf.proposed)}</strong>, {changeBy(gf.adopted, gf.proposed)}, which is{' '}
            {pctText(gf.sharePct)} of its spending.
            {generalFundLetter && (
              <> The Supervisor’s letter: “{generalFundLetter.quote}”</>
            )}
            {generalFundResults.length > 0 && (
              <> Its budgets planned {words([...generalFundResults.map((r) => `${dollars(r.planned)} for ${r.year}`), `${dollars(gf.adopted)} for ${TENTATIVE_YEAR - 1}`])}.</>
            )}
          </li>
        )}
      </ul>

      {adding.length > 0 && (
        <>
          <h3 style={h3}>Some funds put money back</h3>
          <p style={prose}>
            The same budget sets money aside in {count(adding.length)} funds, <strong>{dollars(totals.setAsideProposed)}</strong> in all
            ({dollars(totals.setAsideAdopted)} in 2026). It does this with lines most often named <Term id="fund-balance-contribution">“Fund Balance Contribution”</Term>: they
            are listed with the spending, but the money is meant to stay in the fund’s savings. Only the Budget Supplement shows
            them; the Summary counts them as appropriations.
          </p>
          <div role="region" tabIndex={0} aria-labelledby="set-aside-caption" style={{ overflowX: 'auto' }}>
            <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <caption id="set-aside-caption" style={caption}>Money set aside into savings, by fund</caption>
              <thead>
                <tr style={headRow}>
                  <th scope="col" style={th}>Fund</th>
                  <th scope="col" style={th}>Budget line</th>
                  <th scope="col" style={{ ...th, textAlign: 'right' }}>2026 adopted</th>
                  <th scope="col" style={{ ...th, textAlign: 'right' }}>{TENTATIVE_YEAR} proposed</th>
                  <th scope="col" style={th}>Budget Supplement</th>
                </tr>
              </thead>
              <tbody>
                {setAsides.map((x) => (
                  <tr key={`${x.code}-${x.line}`} style={bodyRow}>
                    <td style={{ ...td, fontWeight: 700 }}>
                      <a href={`${base}/funds/${x.code}/`} style={{ color: 'var(--rbl-title)' }}>{x.fundName}</a>{' '}
                      <span style={{ ...muted, fontWeight: 400 }}>{x.code}</span>
                    </td>
                    <td data-label="Budget line" style={td}>{x.line}</td>
                    <td data-label="2026 adopted" style={{ ...td, textAlign: 'right' }}>{dollars(x.adopted)}</td>
                    <td data-label={`${TENTATIVE_YEAR} proposed`} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(x.proposed)}</td>
                    <td data-label="Budget Supplement" style={td}>{cite(x.page)}</td>
                  </tr>
                ))}
                <tr style={totalRow}>
                  <td style={{ ...td, fontWeight: 700 }}>All funds</td>
                  <td style={td} aria-hidden />
                  <td data-label="2026 adopted" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(totals.setAsideAdopted)}</td>
                  <td data-label={`${TENTATIVE_YEAR} proposed`} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{dollars(totals.setAsideProposed)}</td>
                  <td style={td} aria-hidden />
                </tr>
              </tbody>
            </table>
          </div>
          <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8, margin: '14px 0 0' }}>
            {cpf !== null && (
              <li>
                The Community Preservation Fund’s {dollars(cpf)} takes the place of the same amount it sent to the Debt Service
                Fund in 2026, so it is not new money. <a href={`${base}/outliers/`} style={link}>Outlier Watch</a> explains the
                change.
              </li>
            )}
            {both.map((r) => (
              <li key={r.code}>
                The {r.name} both uses savings and sets money aside: {dollars(r.proposed)} used and {dollars(r.setAside!.proposed)} set
                aside, a net draw of {dollars(r.proposed - r.setAside!.proposed)}.
              </li>
            ))}
            {recreation && (
              <li>
                The <a href={`${base}/funds/A06/`} style={link}>Recreation Program Fund</a>, which has ended every audited year in
                deficit, would set aside {dollars(recreation.proposed)}.
              </li>
            )}
          </ul>
        </>
      )}

      <h3 style={h3}>A plan, not a result</h3>
      <p style={prose}>
        The savings figure in a budget is a plan.
        {actualYearBlank !== null && (
          <> The Budget Supplement’s {actualYearBlank} actual column shows $0 on every one of these lines: savings are never
          received the way a fee is, and money set aside is never paid out.</>
        )}{' '}
        Whether a fund really drew on its savings shows only in its year-end results.
        {generalFundResults.length > 0 && (generalFundResults.every((r) => r.actual > 0)
          ? <> For the General Fund, the audits show it ending each of these years with more savings, not less:</>
          : <> For the General Fund, this is what the audits found:</>)}
      </p>
      {generalFundResults.length > 0 && (
        <div role="region" tabIndex={0} aria-labelledby="gf-results-caption" style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption id="gf-results-caption" style={caption}>General Fund: savings the budget planned to use, and what the audit found</caption>
            <thead>
              <tr style={headRow}>
                <th scope="col" style={th}>Year</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Budget planned to use</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Savings actually changed by</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Savings at year-end</th>
                <th scope="col" style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {generalFundResults.map((r) => (
                <tr key={r.year} style={bodyRow}>
                  <td style={{ ...td, fontWeight: 700 }}>{r.year}</td>
                  <td data-label="Budget planned to use" style={{ ...td, textAlign: 'right' }}>{dollars(r.planned)}</td>
                  <td data-label="Savings actually changed by" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{signedUsd(r.actual)}</td>
                  <td data-label="Savings at year-end" style={{ ...td, textAlign: 'right' }}>{dollars(r.ending)}</td>
                  <td data-label="Source" style={td}>
                    <a href={r.source.url} target="_blank" rel="noreferrer" style={link}>{r.year} audit, {r.source.page}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ ...prose, marginTop: 12 }}>
        During the year the Board can also vote to use savings for a named purpose, beyond what the budget planned. Those votes
        are listed on <a href={`${base}/fund-balance-draws/`} style={link}>Where the surplus went</a>.
      </p>

      {districtHoldings && <DistrictHoldings />}

      <h3 style={h3}>What residents could ask</h3>
      <p style={{ ...prose, marginBottom: 0 }}>
        Using some savings is common. The concern comes when a fund plans to pay a large share of its spending from savings
        year after year: it is planning to spend more than it takes in, which works only while the savings last.
        {districtHoldings ? (
          <> Residents could ask how many more years the sewer funds can draw on savings at this pace, what would happen to
          sewer rents and taxes when they cannot, and whether the Tentative’s Fund Balances page should subtract the 2026
          budget’s planned uses.</>
        ) : leaning.length >= 2 ? (
          <> Residents could ask how much the {leaning[0].name} and the {leaning[1].name} have left, how many more years of draws
          that covers, and what would happen to their charges and taxes when it runs low.</>
        ) : null}
      </p>
    </section>
  )
}

/**
 * What the sewer and water funds held at the end of 2025, as the audit
 * reports them, beside the savings their budgets plan to use; and the
 * Tentative's own estimate of their balances.
 */
function DistrictHoldings() {
  if (!districtHoldings) return null
  const { source, funds } = districtHoldings
  const sewer = funds.find((f) => f.key === 'sewer')!
  const tfb = tentativeFundBalances
  const stale = tfb && tfb.matches2025 && !tfb.matches2026 && tfb.generalFund.application === 0 && tfb.generalFundPlanned2026 > 0
  const cite = `${source.title}, pp. ${source.page}–${source.changePage}`
  const rows: { label: string; value: (f: (typeof funds)[number]) => string }[] = [
    { label: 'Cash at the end of 2025', value: (f) => dollars(f.cash) },
    { label: 'Unrestricted net position', value: (f) => (f.unrestricted < 0 ? `−${dollars(-f.unrestricted)}` : dollars(f.unrestricted)) },
    { label: 'Total net position, which the Tentative prints as fund balance', value: (f) => dollars(f.total) },
    { label: 'Change in net position during 2025', value: (f) => signedUsd(f.change) },
    { label: 'Savings the 2026 budget uses', value: (f) => dollars(f.draws.adopted) },
    { label: `Savings the ${TENTATIVE_YEAR} Tentative uses`, value: (f) => dollars(f.draws.proposed) },
  ]
  return (
    <>
      <h3 style={h3}>What the water and sewer funds hold</h3>
      <p style={prose}>
        {tfb && (
          <>
            The Tentative’s own Fund Balances page (<a href={`${tfb.source.url}#page=${tfb.source.pdfPage}`} target="_blank" rel="noreferrer" style={link}>p. {tfb.source.printedPage}</a>)
            lists the three sewer funds together at {dollars(tfb.sewer.audited)} and the Water District at {dollars(tfb.water.audited)},
            as audited at the end of 2025.{' '}
          </>
        )}
        Those figures are the audit’s total net position, and most of it is capital: pipes and plants, net of the debt that paid for
        them. What is left after capital and restricted money is unrestricted net position. For the sewer funds it was a deficit of{' '}
        {dollars(-sewer.unrestricted)}, because it also counts long-term obligations such as the {dollars(sewer.opeb)} they owe in
        retiree health benefits. In cash, they held {dollars(sewer.cash)} at the end of 2025, and {dollars(sewer.restrictedCash)} more
        that is restricted.
      </p>
      <div role="region" tabIndex={0} aria-labelledby="district-holdings-caption" style={{ overflowX: 'auto' }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <caption id="district-holdings-caption" style={caption}>The sewer and water funds at the end of 2025, and the savings their budgets use</caption>
          <thead>
            <tr style={headRow}>
              <th scope="col" style={th}>Measure</th>
              {funds.map((f) => <th key={f.key} scope="col" style={{ ...th, textAlign: 'right' }}>{f.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} style={bodyRow}>
                <td style={{ ...td, fontWeight: 600 }}>{r.label}</td>
                {funds.map((f) => <td key={f.key} data-label={f.name} style={{ ...td, textAlign: 'right' }}>{r.value(f)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ ...muted, margin: '8px 0 12px', lineHeight: 1.5 }}>
        Sources: <a href={source.url} target="_blank" rel="noreferrer" style={link}>{cite}</a> (statements pp. {source.printedPage}–{source.printedPage + 1});
        the budgets’ Summary pages. The audit reports the three sewer funds as one.
      </p>
      <p style={prose}>
        The sewer funds’ 2026 and {TENTATIVE_YEAR} budgets together plan to use {dollars(sewer.draws.adopted + sewer.draws.proposed)} of
        savings, against {dollars(sewer.cash)} of cash at the end of 2025, and their net position fell by {dollars(-sewer.change)} in 2025.
        {stale && tfb && (
          <>
            {' '}The Tentative’s page estimates each fund’s balance at the end of 2026 by subtracting a column labelled
            “{tfb.applicationLabel}”, {dollars(tfb.totals.application)} in all. Outside the General Fund, those are the 2025 budget’s
            planned uses, not 2026’s: Calverton Sewer’s is {dollars(tfb.calverton.column)}, where the 2026 budget plans{' '}
            {dollars(tfb.calverton.planned2026)}. It subtracts nothing from the General Fund, whose 2026 budget plans to use{' '}
            {dollars(tfb.generalFundPlanned2026)}, and leaves that fund at its audited {dollars(tfb.generalFund.audited)}.
          </>
        )}
      </p>
    </>
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
