import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS } from '../../lib/audits'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { budgetConcepts, OSC_TOWN_GUIDE } from '../../lib/budget-concepts'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22, scrollMarginTop: 24 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55 } as const
const th = { textAlign: 'left', padding: '8px', fontSize: 13.5, color: 'var(--rbl-text-muted)', verticalAlign: 'bottom' } as const
const td = { padding: '8px', verticalAlign: 'top', lineHeight: 1.5 } as const

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const g = (id: string, label: string) => <a href={`${base}/glossary/#term-${id}`} style={link}>{label}</a>

const AUDIT_YEAR = 2025
const audit = AUDITED_GENERAL_FUND[AUDIT_YEAR]
const ops = AUDITED_OPERATIONS[AUDIT_YEAR]

const TIERS: { key: keyof typeof audit.classes; id: string; color: string; means: string }[] = [
  { key: 'Nonspendable', id: 'nonspendable', color: 'var(--rbl-series-slate)', means: 'Not cash: prepaid bills and similar items. It cannot be spent.' },
  { key: 'Restricted', id: 'restricted', color: 'var(--rbl-series-indigo)', means: 'Limited by law, a grant or a donor to one purpose.' },
  { key: 'Committed', id: 'committed', color: 'var(--rbl-series-violet)', means: 'Set aside by a formal Town Board action, which only another Board action can undo.' },
  { key: 'Assigned', id: 'assigned', color: 'var(--rbl-series-gold)', means: 'Earmarked by Town officials, such as savings planned for next year’s budget and open purchase orders.' },
  { key: 'Unassigned', id: 'unassigned', color: 'var(--rbl-series-blue)', means: 'Not set aside for anything. This is the cushion most measures of the Town’s savings use.' },
]

const funds = [...allOperatingFunds2026].sort((a, b) => b.appropriations2026 - a.appropriations2026)
const fundsTotal = funds.reduce((s, f) => s + f.appropriations2026, 0)
const generalFund = funds.find((f) => f.code === 'A01')!

const STEPS: { stage: string; what: React.ReactNode }[] = [
  { stage: 'Tentative budget', what: <>The Supervisor, as {g('budget-officer', 'budget officer')}, files a first full proposal by September 30.</> },
  { stage: 'Preliminary budget', what: <>The Town Board makes its changes and holds a {g('budget-hearing', 'public hearing')}.</> },
  { stage: 'Adopted budget', what: <>The Board adopts the budget by November 20. Each spending line becomes an {g('appropriations', 'appropriation')}: permission to spend up to that amount on that purpose.</> },
  { stage: 'Changes during the year', what: <>The Board can move money between lines with a {g('budget-transfer', 'budget transfer')} or add money with a budget amendment, each by resolution.</> },
  { stage: 'A purchase order', what: <>When the Town orders something, the cost is set aside against the line as an {g('encumbrance', 'encumbrance')}, so the same money is not promised twice.</> },
  { stage: 'The bill is paid', what: <>The encumbrance becomes an expenditure: money actually spent.</> },
  { stage: 'Year end', what: <>Unspent appropriations {g('lapse', 'lapse')}. Orders still open carry into the next year: the {AUDIT_YEAR} audit counts {usd(audit.assigned.purchasesOnOrder)} of them as assigned fund balance.</> },
  { stage: 'Reporting', what: <>The Town files its {g('afr', 'Annual Financial Report')} with the State Comptroller, and an independent auditor issues the {g('audited-statements', 'audited financial statements')}.</> },
]

const REPORTS: { name: string; answers: string; basis: string; href: string; page: string }[] = [
  { name: 'Tentative, Preliminary and Adopted budgets', answers: 'What does the Town plan to spend and collect next year, line by line?', basis: 'Budgetary', href: '/tentative-2027/', page: 'The 2027 Tentative Budget' },
  { name: 'Budget transfers and amendments', answers: 'How did the Board change the plan during the year?', basis: 'Budgetary', href: '/budget-changes/', page: 'Budget changes the Board approved' },
  { name: 'Budget Supplement', answers: 'What did each revenue and spending line actually come to in past years?', basis: 'Budgetary', href: '/budget-accuracy/', page: 'Budget vs. actual spending' },
  { name: 'Annual Financial Report (AFR)', answers: 'What did the Town report to the State for the year, fund by fund? It is not audited.', basis: 'Modified accrual, in the State’s format', href: '/annual-report/', page: 'Annual financial report' },
  { name: 'Audited financial statements', answers: 'What does an independent auditor say the Town’s year-end position was?', basis: 'Modified accrual for the funds, full accrual for the Town as a whole', href: '/reserves/', page: 'Savings and reserves' },
  { name: 'Bond and note resolutions', answers: 'What is the Town borrowing for, and for how long?', basis: 'Legal authorizations, not accounting statements', href: '/capital-debt/', page: 'Projects and borrowing' },
]

export const metadata = {
  title: 'How the Town’s books work',
  description: 'A plain-English guide to the accounting behind Riverhead’s budget and audits: separate funds, three ways of counting, the five tiers of fund balance in the Town’s own audit, and the path a budget dollar takes.',
}

export default function AccountingBasicsPage() {
  const max = Math.max(...TIERS.map((t) => audit.classes[t.key]))
  const net = ops.revenues - ops.expenditures + ops.transfersIn - ops.transfersOut
  return (
    <PageShell
      title="How the Town’s books work"
      subtitle="The accounting ideas behind Riverhead’s budget, its audit and its savings, explained with the Town’s own figures."
    >
      <PlainCallout
        tips={[
          { label: 'Funds', text: 'the Town keeps its money in separate accounts, each with its own budget and savings.' },
          { label: 'Bases of accounting', text: 'the budget, the State report and the audit count some things at different times, so their totals can differ.' },
          { label: 'Fund balance', text: 'what a fund has left after its bills, sorted into five tiers by how freely it can be spent.' },
        ]}
      >
        A household has one bank balance. A town has many, and the law decides how each one is counted and spent. This page explains how
        Riverhead keeps its books, using its {AUDIT_YEAR} audit and its 2026 budget. For any single word, see the{' '}
        <a href={`${base}/glossary/`} style={link}>glossary</a>.
      </PlainCallout>

      <nav aria-label="On this page" style={{ ...card, padding: '14px 20px' }}>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 15.5 }}>
          <li><a href="#funds" style={link}>Separate funds</a></li>
          <li><a href="#bases" style={link}>Three ways of counting</a></li>
          <li><a href="#fund-balance" style={link}>The five tiers of fund balance</a></li>
          <li><a href="#year" style={link}>How a year changes fund balance</a></li>
          <li><a href="#dollar" style={link}>The path of a budget dollar</a></li>
          <li><a href="#reports" style={link}>Which report answers which question</a></li>
          <li><a href="#concepts" style={link}>Bigger ideas, in more depth</a></li>
        </ol>
      </nav>

      <section aria-labelledby="funds" style={card}>
        <h2 id="funds" style={h2}>Separate funds</h2>
        <p style={prose}>
          A {g('fund', 'fund')} is a separate set of accounts for one purpose. Money raised for one fund generally stays in it: a sewer district’s
          charges pay for that district’s sewers, not for the Police. That is why the budget lists a {g('tax-levy', 'tax levy')} and a{' '}
          {g('fund-balance', 'fund balance')} for each fund rather than one total.
        </p>
        <p style={prose}>
          Riverhead’s 2026 budget has {funds.length} operating funds with {usd(fundsTotal)} of appropriations. The General Fund is{' '}
          {Math.round((generalFund.appropriations2026 / fundsTotal) * 100)} percent of that. Many of the rest are{' '}
          {g('special-district', 'special districts')}, which tax or charge only the properties they serve.
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>Operating funds in the 2026 Adopted Budget, largest first</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Fund</th>
              <th scope="col" style={th}>What it pays for</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>2026 appropriations</th>
            </tr></thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}><a href={`${base}/funds/${f.code}/`} style={link}>{f.name}</a></th>
                  <td data-label="What it pays for" className="rbl-stack-prose" style={{ ...td, color: 'var(--rbl-text-body)' }}>{f.description}</td>
                  <td data-label="2026 appropriations" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(f.appropriations2026)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, margin: '10px 0 0' }}>Source: Town of Riverhead 2026 Adopted Budget Summary, p. 3. Capital project funds, which hold borrowed money for construction, are authorized project by project and are not in this table.</p>
      </section>

      <section aria-labelledby="bases" style={card}>
        <h2 id="bases" style={h2}>Three ways of counting</h2>
        <p style={prose}>
          The same year can be counted three ways. Each answers a different question, so a figure from the budget, the State report and the
          audit can disagree without any of them being wrong. Ask which basis a number uses before comparing it with another.
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>The three bases of accounting</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Basis</th>
              <th scope="col" style={th}>Where you see it</th>
              <th scope="col" style={th}>What it counts</th>
              <th scope="col" style={th}>What it leaves out</th>
            </tr></thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{g('budgetary-basis', 'Budgetary')}</th>
                <td data-label="Where you see it" className="rbl-stack-prose" style={td}>The budget, budget transfers and budget-to-actual reports.</td>
                <td data-label="What it counts" className="rbl-stack-prose" style={td}>Spending against each appropriation, including orders placed but not yet paid.</td>
                <td data-label="What it leaves out" className="rbl-stack-prose" style={td}>Long-term debts and the value of Town property.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{g('modified-accrual', 'Modified accrual')}</th>
                <td data-label="Where you see it" className="rbl-stack-prose" style={td}>The fund statements in the audit and in the Annual Financial Report.</td>
                <td data-label="What it counts" className="rbl-stack-prose" style={td}>Revenue once it is measurable and collected soon enough to pay this year’s bills; spending when the bill is owed.</td>
                <td data-label="What it leaves out" className="rbl-stack-prose" style={td}>Bonds, pensions and retiree health owed in later years. Buying a truck counts as spending the whole cost at once.</td>
              </tr>
              <tr>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{g('full-accrual', 'Full accrual')}</th>
                <td data-label="Where you see it" className="rbl-stack-prose" style={td}>The audit’s Town-wide statements, which report {g('net-position', 'net position')}.</td>
                <td data-label="What it counts" className="rbl-stack-prose" style={td}>Everything owned and owed, like a business: buildings and roads, wearing out over time, and every long-term debt.</td>
                <td data-label="What it leaves out" className="rbl-stack-prose" style={td}>The split into funds. It shows the Town as one whole.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, margin: '10px 0 0' }}>
          The rules come from {g('gasb', 'GASB')}, which sets {g('gaap', 'generally accepted accounting principles')} for state and local
          governments, and from the State Comptroller’s accounting manual for towns. That is why the audit shows large liabilities such as{' '}
          {g('net-pension-liability', 'pensions')} and {g('opeb', 'retiree health')} that never appear in the budget.
        </p>
      </section>

      <section aria-labelledby="fund-balance" style={card}>
        <h2 id="fund-balance" style={h2}>The five tiers of fund balance</h2>
        <p style={prose}>
          GASB Statement No. 54 sorts a fund’s balance into five tiers, from least to most freely spendable. Riverhead’s {AUDIT_YEAR} audit
          reports a General Fund balance of <strong>{usd(audit.total)}</strong> at year end, in these tiers:
        </p>
        <div role="img" aria-label={TIERS.map((t) => `${t.key}: ${usd(audit.classes[t.key])}`).join('; ')} style={{ display: 'grid', gap: 6, margin: '6px 0 14px' }}>
          {TIERS.map((t) => (
            <div key={t.key} style={{ display: 'grid', gridTemplateColumns: '108px minmax(0, 1fr) 104px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{t.key}</span>
              <div style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 14 }}>
                <div style={{ width: `${Math.max((audit.classes[t.key] / max) * 100, audit.classes[t.key] > 0 ? 0.6 : 0)}%`, height: '100%', borderRadius: 4, background: t.color }} />
              </div>
              <span style={{ fontSize: 14, textAlign: 'right', color: 'var(--rbl-text-strong)' }}>{usd(audit.classes[t.key])}</span>
            </div>
          ))}
        </div>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>General Fund balance at December 31, {AUDIT_YEAR}, by tier</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Tier</th>
              <th scope="col" style={th}>What it means</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Amount</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Share</th>
            </tr></thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.key} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}>{g(t.id, t.key)}</th>
                  <td data-label="What it means" className="rbl-stack-prose" style={td}>{t.means}</td>
                  <td data-label="Amount" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(audit.classes[t.key])}</td>
                  <td data-label="Share" style={{ ...td, textAlign: 'right' }}>{((audit.classes[t.key] / audit.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>Total</th>
                <td data-label="What it means" className="rbl-stack-prose" style={td}>All five tiers.</td>
                <td data-label="Amount" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(audit.total)}</td>
                <td data-label="Share" style={{ ...td, textAlign: 'right' }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...prose, margin: '12px 0 8px' }}>
          The assigned tier is the easiest to misread. The audit breaks its {usd(audit.classes.Assigned)} into three parts:
        </p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 4 }}>
          <li><strong>{usd(audit.assigned.subsequentYearsBudget)}</strong> for the next year’s budget. This is the {g('appropriated-fund-balance', 'appropriated fund balance')} the 2026 budget uses to lower the tax levy.</li>
          <li><strong>{usd(audit.assigned.purchasesOnOrder)}</strong> for purchases on order: {g('encumbrance', 'encumbrances')} carried into the new year.</li>
          <li><strong>{usd(audit.assigned.miscellaneousDesignations)}</strong> of other designations.</li>
        </ul>
        <p style={{ ...muted, margin: 0 }}>
          Source: <a href={audit.source.url} style={link}>{audit.source.title}</a>, page {audit.source.page}
          {audit.source.printedPage ? ` (statement page ${audit.source.printedPage})` : ''}. For how this compares with the Town’s policy and other
          years, see <a href={`${base}/reserves/`} style={link}>Savings and reserves</a>.
        </p>
      </section>

      <section aria-labelledby="year" style={card}>
        <h2 id="year" style={h2}>How a year changes fund balance</h2>
        <p style={prose}>
          Fund balance at the end of a year is the balance at the start, plus what came in, less what went out. Money moved between funds is
          counted separately, as {g('transfers', 'transfers')}. Here is the General Fund in {AUDIT_YEAR}, from the audit:
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, maxWidth: 560 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>General Fund, {AUDIT_YEAR}</caption>
            <tbody>
              {([
                ['Fund balance, January 1', ops.beginning, ''],
                ['Revenues', ops.revenues, '+'],
                ['Expenditures', ops.expenditures, '−'],
                ['Transfers in from other funds', ops.transfersIn, '+'],
                ['Transfers out to other funds', ops.transfersOut, '−'],
              ] as const).map(([label, v, sign]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{label}</th>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{sign} {usd(v)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>Fund balance, December 31</th>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{usd(ops.ending)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...prose, margin: '12px 0 8px' }}>
          The year added {usd(net)}. A surplus like this usually means revenue came in above the budget, spending came in below it, or both.
          Whether it repeats depends on whether the causes were {g('one-time-revenue', 'one-time')} or recurring.
        </p>
        <p style={{ ...muted, margin: 0 }}>Source: the same audit, page {ops.page} (Statement of Revenues, Expenditures and Changes in Fund Balances).</p>
      </section>

      <section aria-labelledby="dollar" style={card}>
        <h2 id="dollar" style={h2}>The path of a budget dollar</h2>
        <p style={prose}>From a department’s request to the audit, a dollar of Town spending goes through these steps:</p>
        <ol style={{ ...prose, paddingLeft: 22, display: 'grid', gap: 8 }}>
          {STEPS.map((s) => <li key={s.stage}><strong>{s.stage}.</strong> {s.what}</li>)}
        </ol>
        <p style={{ ...muted, margin: 0 }}>
          Deadlines are the general ones for towns in Town Law §§104–109, as summarized in the State Comptroller’s{' '}
          <a href={OSC_TOWN_GUIDE.url} style={link}>{OSC_TOWN_GUIDE.label}</a>. If the Board does not adopt a budget by November 20, the
          Preliminary Budget takes effect. See <a href={`${base}/budget-adoption/`} style={link}>how the Board adopts the budget</a>.
        </p>
      </section>

      <section aria-labelledby="reports" style={card}>
        <h2 id="reports" style={h2}>Which report answers which question</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>The Town’s financial documents</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Document</th>
              <th scope="col" style={th}>The question it answers</th>
              <th scope="col" style={th}>Basis</th>
              <th scope="col" style={th}>On this site</th>
            </tr></thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.name} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}>{r.name}</th>
                  <td data-label="The question it answers" className="rbl-stack-prose" style={td}>{r.answers}</td>
                  <td data-label="Basis" style={td}>{r.basis}</td>
                  <td data-label="On this site" style={td}><a href={`${base}${r.href}`} style={link}>{r.page}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, margin: '10px 0 0' }}>
          The originals are listed on <a href={`${base}/sources/`} style={link}>Original documents</a>. To check a figure against one, see{' '}
          <a href={`${base}/evidence/`} style={link}>How to check a figure</a>.
        </p>
      </section>

      <section aria-labelledby="concepts" style={{ marginBottom: 16 }}>
        <h2 id="concepts" style={h2}>Bigger ideas, in more depth</h2>
        <p style={prose}>Each topic explains one idea, shows where it appears in Riverhead’s numbers, and suggests a question to ask. Open the ones you want.</p>
        {budgetConcepts.map((c) => (
          <details key={c.id} id={c.id} style={{ ...card, padding: 0, marginBottom: 10, overflow: 'hidden', scrollMarginTop: 24 }}>
            <summary style={{ cursor: 'pointer', padding: '14px 18px', fontWeight: 700, color: 'var(--rbl-title)', fontSize: 16.5, minHeight: 44 }}>
              {c.title}
            </summary>
            <div style={{ padding: '0 18px 18px' }}>
              <p style={{ ...prose, fontSize: 15.5 }}>{c.plain}</p>
              {c.riverhead && (
                <div style={{ background: 'var(--rbl-teal-bg)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '12px 14px', margin: '10px 0' }}>
                  <strong style={{ color: 'var(--rbl-teal-strong)', fontSize: 14 }}>In Riverhead’s numbers:</strong>{' '}
                  <span style={{ color: 'var(--rbl-teal-strong)', fontSize: 15, lineHeight: 1.6 }}>{c.riverhead}</span>
                </div>
              )}
              <p style={{ ...prose, fontSize: 15.5, margin: 0 }}><strong style={{ color: 'var(--rbl-title)' }}>Question to ask:</strong> {c.ask}</p>
              {c.cite && <p style={{ ...muted, margin: '10px 0 0', paddingTop: 10, borderTop: '1px solid var(--rbl-border-subtle)' }}>Authority: {c.cite}</p>}
            </div>
          </details>
        ))}
      </section>

      <p style={{ ...muted, maxWidth: '75ch' }}>
        This page explains accounting practice in plain English for residents. It is not an audit or a legal opinion. Every Riverhead figure on
        it comes from the source named beside it.
      </p>
    </PageShell>
  )
}
