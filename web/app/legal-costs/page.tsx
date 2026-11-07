import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import PairedBars from '../../components/charts/PairedBars'
import ColumnChart from '../../components/charts/ColumnChart'
import {
  actions, budgetYear, claims, CODE_SETTLEMENTS, currentYear, electionLawCase, firstYear, groups, kindLabel, lastActualYear,
  legalAdopted, legalAllYears, legalProposed, legalTotal, legalYtd, OUTSIDE_COUNSEL, outsideAllYears, outsideByYear, outsideCurrent,
  outsideOverYears, proposalLabel, SELF_INSURANCE, years,
} from '../../lib/legal-costs'
import { supplementSource } from '../../lib/supplement'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
const num = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' } as const
const head = { ...cell, fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const usd2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
const money = (n: number | null) => (n == null ? '—' : usd(n))
const short = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1000)}K`)
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const counted = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n)

export const metadata = {
  title: 'Legal costs — what the Town spends on lawyers and claims',
  description: `What the Town of Riverhead spent on outside lawyers, its Town Attorney's office and claims against it, ${firstYear} to the ${budgetYear} ${proposalLabel} budget, from the Town's Budget Supplements.`,
}

export default function LegalCostsPage() {
  const last = lastActualYear
  const overShare = outsideByYear.length ? `${counted(outsideOverYears.length)} of the ${counted(outsideByYear.length)} years` : ''
  const lastRow = outsideByYear[outsideByYear.length - 1]
  const legalCols = years.map((y) => ({ label: String(y), value: legalTotal(y) }))
  const selfIns = claims.f
  const firstBudgetYear = outsideByYear[0]?.year

  return (
    <PageShell
      title="Legal costs"
      subtitle={`What the Town spends on lawyers, inside and outside the Town Attorney's office, and what it pays on claims against it, ${firstYear} to the ${budgetYear} ${proposalLabel} budget.`}
    >
      <PlainCallout
        tips={[
          { label: 'Where the figures come from', text: 'the Town’s own Budget Supplements, which print each account’s actual spending for past years, its adopted budget, and what it had spent by June 30 of the current year.' },
          { label: 'What is counted', text: 'the Town Attorney’s office and every account the Supplements label as legal professional services. Claims paid by the Town’s self-insurance fund are shown on their own, because they pay claimants, not lawyers.' },
          { label: 'What is not here', text: 'which firm was paid for which case. The Supplements show one line for all outside counsel; the invoices behind it are in the Town’s claims records.' },
        ]}
      >
        The Town Attorney&apos;s line for outside lawyers was budgeted at {usd(outsideCurrent.budget)} for {currentYear} and has cost more
        than its budget in {overShare} since {firstBudgetYear}. In {last} it cost <strong>{usd(lastRow.actual)}</strong> against a{' '}
        {usd(lastRow.budget)} budget. By June 30, {currentYear} it had already spent <strong>{usd(outsideCurrent.spentByJune30)}</strong>,
        more than the whole year&apos;s budget, and the {budgetYear} {proposalLabel} budgets {usd(outsideCurrent.proposed)} again.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }} aria-label="Key figures">
        <Stat label={`Legal services, ${last}`} value={usd(legalTotal(last))} sub="all four groups below" />
        <Stat label={`Outside lawyers, ${last}`} value={usd(lastRow.actual)} sub={`budget ${usd(lastRow.budget)}`} />
        <Stat label={`Outside lawyers by June 30, ${currentYear}`} value={usd(outsideCurrent.spentByJune30)} sub={`budget ${usd(outsideCurrent.budget)} for the year`} />
        <Stat label={`Outside lawyers, ${firstYear}–${last}`} value={usd(outsideAllYears)} sub={`${years.length} years`} />
      </section>

      <section id="outside-counsel" aria-labelledby="outside-counsel-heading" style={card}>
        <h2 id="outside-counsel-heading" style={h2}>Outside lawyers: budget against cost</h2>
        <p style={prose}>
          The Town Attorney&apos;s office hires law firms and special counsel for cases and work its own staff does not take on, such as
          tax certiorari cases, appeals and litigation with other governments. All of it is paid from one account, {OUTSIDE_COUNSEL}.
          The budget has stayed at {usd(outsideCurrent.budget)} since 2022 while the cost has not.
        </p>
        <PairedBars
          title={`Town Attorney, outside legal services, ${firstBudgetYear}–${currentYear}`}
          lede={`Each year's adopted budget beside what the line cost. For ${currentYear}, the second bar is spending by June 30 only.`}
          aLabel="Adopted budget"
          bLabel="Actual cost"
          format={short}
          rows={[
            ...outsideByYear.map((r) => ({ label: String(r.year), a: r.budget, b: r.actual })),
            { label: `${currentYear}`, a: outsideCurrent.budget, b: outsideCurrent.spentByJune30, note: 'by June 30' },
          ]}
          source={`${supplementSource?.title ?? 'Town of Riverhead Budget Supplements'}, account ${OUTSIDE_COUNSEL}.`}
        />
        <p style={{ ...prose, marginTop: 12 }}>
          One matter&apos;s cost has been reported separately: the Town&apos;s share of the even-year election lawsuit,{' '}
          {usd2(electionLawCase.paidDisclosed)} {electionLawCase.paidPeriod}, as reported by RiverheadLOCAL. The Supplement does not say
          which account paid it. <a href={`${base}/election-law-case/`} style={link}>Read about the election law case</a>.
        </p>
      </section>

      <section id="by-year" aria-labelledby="by-year-heading" style={card}>
        <h2 id="by-year-heading" style={h2}>All legal services, year by year</h2>
        <p style={prose}>
          The four groups together cost {usd(legalAllYears)} from {firstYear} through {last}. Staff pay is the Town Attorney&apos;s own
          lawyers and staff; outside lawyers are the firms it hires and those other departments hire.
        </p>
        <ColumnChart
          title={`Legal services, ${firstYear}–${last}`}
          lede="Actual spending each year, across the four groups in the table below."
          columns={legalCols.map((c, i) => ({ ...c, emphasis: i === legalCols.length - 1 }))}
          format={(n) => `$${(n / 1e6).toFixed(1)}M`}
          source="Town of Riverhead Budget Supplements, 2020 to 2027 editions."
        />
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13, padding: '0 0 6px' }}>
              Actual spending by year; {currentYear} shows the adopted budget and spending by June 30; {budgetYear} is the {proposalLabel} budget.
            </caption>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="col" style={{ ...head, textAlign: 'left', minWidth: 160 }}>Group</th>
                {years.map((y) => <th key={y} scope="col" style={{ ...head, textAlign: 'right' }}>{y}</th>)}
                <th scope="col" style={{ ...head, textAlign: 'right' }}>{currentYear} budget</th>
                <th scope="col" style={{ ...head, textAlign: 'right' }}>{currentYear} by June 30</th>
                <th scope="col" style={{ ...head, textAlign: 'right' }}>{budgetYear} {proposalLabel}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.key} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600, color: 'var(--rbl-text-strong)' }}>
                    {g.label}
                  </th>
                  {years.map((y) => <td key={y} data-label={String(y)} style={num}>{money(g.f.actual(y))}</td>)}
                  <td data-label={`${currentYear} budget`} style={num}>{money(g.f.adopted(currentYear))}</td>
                  <td data-label={`${currentYear} by June 30`} style={num}>{money(g.f.ytd(currentYear))}</td>
                  <td data-label={`${budgetYear} ${proposalLabel}`} style={num}>{money(g.f.proposed)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--rbl-border)' }}>
                <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)' }}>Total</th>
                {years.map((y) => <td key={y} data-label={String(y)} style={{ ...num, fontWeight: 700 }}>{usd(legalTotal(y))}</td>)}
                <td data-label={`${currentYear} budget`} style={{ ...num, fontWeight: 700 }}>{usd(legalAdopted(currentYear))}</td>
                <td data-label={`${currentYear} by June 30`} style={{ ...num, fontWeight: 700 }}>{usd(legalYtd(currentYear))}</td>
                <td data-label={`${budgetYear} ${proposalLabel}`} style={{ ...num, fontWeight: 700 }}>{usd(legalProposed)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>What each group covers, and its accounts</summary>
          <ul style={{ ...prose, marginTop: 8 }}>
            {groups.map((g) => <li key={g.key} style={{ marginBottom: 6 }}><strong>{g.label}:</strong> {g.plain} Accounts: {g.accounts.join(', ')}.</li>)}
          </ul>
        </details>
      </section>

      <section id="claims" aria-labelledby="claims-heading" style={card}>
        <h2 id="claims-heading" style={h2}>Claims against the Town</h2>
        <p style={prose}>
          The Town&apos;s Risk Retention fund makes what the Supplement calls &ldquo;Self Insurance Payments&rdquo; ({SELF_INSURANCE}),
          under function 1930, judgments and claims, in the State&apos;s chart of accounts. It paid {money(selfIns.actual(last))} in {last} against a{' '}
          {money(selfIns.adopted(last))} budget, and {money(selfIns.ytd(currentYear))} of its {money(selfIns.adopted(currentYear))}{' '}
          {currentYear} budget by June 30.
        </p>
        <PairedBars
          title={`Self-insurance payments on claims, ${firstBudgetYear}–${currentYear}`}
          lede={`Each year's budget beside what the fund paid. For ${currentYear}, spending by June 30 only.`}
          aLabel="Adopted budget"
          bLabel="Paid"
          format={short}
          rows={[
            ...years.filter((y) => selfIns.adopted(y) != null).map((y) => ({ label: String(y), a: selfIns.adopted(y) as number, b: selfIns.actual(y) })),
            { label: `${currentYear}`, a: selfIns.adopted(currentYear) ?? 0, b: selfIns.ytd(currentYear), note: 'by June 30' },
          ]}
          source={`Town of Riverhead Budget Supplements, account ${SELF_INSURANCE}.`}
        />
        <p style={{ ...prose, marginTop: 12 }}>
          On November 5, {currentYear}, the Board moved $225,000 to cover &ldquo;additional general liability insurance claims incurred
          during the current fiscal year&rdquo; (resolution 2026-970). Each operating fund also has a &ldquo;Gen Liab - Claim
          Payments&rdquo; line. Those are not added here: they may be what the funds pay into the same self-insurance arrangement, and
          adding both could count the same dollar twice.
        </p>
      </section>

      <section id="board-actions" aria-labelledby="board-actions-heading" style={card}>
        <h2 id="board-actions-heading" style={h2}>What the Board voted on</h2>
        <p style={prose}>
          Resolutions on lawyers, settlements and claims in the meeting records this site holds. The records are full for 2025 and{' '}
          {currentYear}, but hold one meeting each for 2022 to 2024, so earlier years are not complete. Resolutions rarely print a
          settlement&apos;s amount; where one does, it is quoted. The Board also settled {counted(CODE_SETTLEMENTS.length)} of its own
          code-enforcement cases against property owners in 2025 ({CODE_SETTLEMENTS.join(', ')}), not listed here.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {actions.map((a) => (
            <li key={a.number} style={{ padding: '10px 0', borderTop: '1px solid var(--rbl-border-subtle)', display: 'grid', gridTemplateColumns: 'minmax(120px, 160px) 1fr', gap: 12 }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 14 }}>
                {longDate(a.date)}
                <span style={{ display: 'block', fontSize: 13 }}>{kindLabel[a.kind]}</span>
              </span>
              <span style={{ color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55 }}>
                {a.text}{' '}
                <a href={`${base}/meetings/?meeting=${a.date}&q=${encodeURIComponent(a.number)}`} style={link}>Resolution {a.number}</a>
              </span>
            </li>
          ))}
        </ul>
        <p style={{ ...prose, marginTop: 12 }}>
          The regional Community Preservation Fund counsel the Board tabled on November 5 has its own page:{' '}
          <a href={`${base}/regional-cpf-counsel/`} style={link}>Regional CPF counsel and the home rule question</a>.
        </p>
      </section>

      <section id="questions" aria-labelledby="questions-heading" style={card}>
        <h2 id="questions-heading" style={h2}>Questions residents can ask</h2>
        <ul style={prose}>
          <li>Outside counsel has cost more than {usd(outsideCurrent.budget)} in most years. Why does the {budgetYear} {proposalLabel} budget it at {usd(outsideCurrent.proposed)} again, and which account pays when it runs over?</li>
          <li>Which firms were paid from the outside-counsel line in {last} and {currentYear}, for which matters, and how much each?</li>
          <li>What did each settlement cost, and was it paid from the self-insurance fund, an insurer or the General Fund?</li>
        </ul>
        <p style={prose}>
          Invoices the Town has paid are public records. <a href={`${base}/records/`} style={link}>Request records under the Freedom of Information Law</a>.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 24, fontWeight: 700, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{sub}</div>}
    </div>
  )
}
