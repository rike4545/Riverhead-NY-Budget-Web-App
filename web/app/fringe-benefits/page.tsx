import { Fragment } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  ALLOWANCE, LATEST, FIRST, ESTIMATE_2026, RECIPIENTS_2025, TIMELINE, RECREATION_2026, QUESTIONS, LIMITS,
  TOWN_BOARD_2025, COUNCIL_SALARY_FLAT, CONTRACT_2009, JUSTICE_SICK_BUYBACK_2025, PAYROLL_SOURCE, CPI_SOURCE,
  allowanceTotal, allowanceTotalAllYears, amountFor, contract2009Carried, ruleRaise,
  townBoardPayrollLessBuyouts, townBoardWithoutAllowance,
} from '../../lib/fringe-benefits'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const usd0 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${(n * 100).toFixed(2)}%`
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '9px 10px' } as const
const body = { color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 } as const
const small = { color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55 } as const
const quoteStyle = { margin: '8px 0 0', padding: '8px 12px', borderLeft: '3px solid var(--rbl-accent-border)', background: 'var(--rbl-surface-2)', borderRadius: 8, fontSize: 13.6, lineHeight: 1.5, color: 'var(--rbl-text-body)' } as const

const latestTotal = allowanceTotal(LATEST)
const elected = RECIPIENTS_2025.filter((r) => r.group !== 'manager')
const managers = RECIPIENTS_2025.filter((r) => r.group === 'manager')
const salaryRise = LATEST.elected / FIRST.elected - 1

export const metadata = {
  title: 'Fringe benefits: the Town-paid deferred comp, annuity and life insurance allowance — Riverhead',
  description:
    `Every Riverhead elected official, and a few appointed managers, gets a yearly allowance on top of salary for a Roth or regular deferred comp account, a life insurance policy or an annuity: ${usd(LATEST.elected)} each in ${LATEST.year}, ${usd(LATEST.supervisor)} for the Supervisor. It rises with New York-area inflation and has no budget line of its own.`,
}

export default function FringeBenefitsPage() {
  return (
    <PageShell
      title="Fringe benefits: the deferred comp, annuity and life insurance allowance"
      subtitle="Every elected official in Riverhead, and a handful of appointed managers, is paid a yearly sum on top of salary to put toward retirement savings, a life insurance policy or an annuity. It rises with inflation every year, and no budget line shows it."
    >
      <PlainCallout
        tips={[
          { label: 'Deferred compensation', text: 'a retirement savings account (a “457” plan). Riverhead uses the New York State Deferred Compensation Plan.' },
          { label: 'Roth 457', text: 'the after-tax version: tax is paid now, and withdrawals in retirement are tax-free. The Town opted in by Resolution 2017-495.' },
          { label: 'Annuity', text: 'an insurance contract that pays out later, often for life.' },
        ]}
      >
        In {LATEST.year} the Town paid <strong>{usd(LATEST.elected)}</strong> to each of {LATEST.electedPaid} elected
        officials, <strong>{usd(LATEST.supervisor)}</strong> to the Supervisor, and <strong>{usd(LATEST.manager)}</strong>{' '}
        to each of {LATEST.managersPaid} appointed managers: <strong>{usd(latestTotal)}</strong> in all. Each person
        chooses where it goes: a deferred compensation account (Roth or regular), an insurance policy, or an
        annuity. The amount goes up every year by the previous year&apos;s New York-area inflation,
        whether or not salaries do.
      </PlainCallout>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: `Paid in ${LATEST.year}`, value: usd0(latestTotal), note: `${LATEST.electedPaid + 1 + LATEST.managersPaid} people` },
          { label: `Paid ${FIRST.year}–${LATEST.year}`, value: usd0(allowanceTotalAllYears), note: 'at least; see the limits below' },
          { label: `Each elected official, ${LATEST.year}`, value: usd(LATEST.elected), note: `up ${(salaryRise * 100).toFixed(1)}% since ${FIRST.year}` },
          { label: `If the rule holds, ${ESTIMATE_2026.year}`, value: usd(ESTIMATE_2026.elected), note: `+${pct(ESTIMATE_2026.raise)}; Supervisor ${usd(ESTIMATE_2026.supervisor)}` },
        ].map((t) => (
          <div key={t.label} style={{ ...card, padding: 16 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, fontWeight: 700 }}>{t.label}</div>
            <div style={{ color: 'var(--rbl-title)', fontSize: 24, fontWeight: 900, margin: '4px 0 2px' }}>{t.value}</div>
            <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12.4 }}>{t.note}</div>
          </div>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Who was paid it in {LATEST.year}</h3>
        <p style={{ ...body, marginTop: 0 }}>
          All {elected.length} of Riverhead&apos;s elected officials, and {managers.length} appointed managers paid the
          sum the managers&apos; contracts set. The amounts are from the Town&apos;s own payroll report.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.6 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Name</th>
                <th style={th}>Office</th>
                <th style={{ ...th, textAlign: 'right' }}>{LATEST.year} allowance</th>
              </tr>
            </thead>
            <tbody>
              {([['Elected officials', elected], ['Appointed managers', managers]] as const).map(([label, rows]) => (
                <Fragment key={label}>
                  <tr>
                    <td colSpan={3} style={{ ...td, paddingTop: 14, fontWeight: 800, color: 'var(--rbl-title)' }}>{label}</td>
                  </tr>
                  {rows.map((r) => (
                    <tr key={r.name} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                      <td style={td}>
                        <strong>{r.name}</strong>
                        {r.note && <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12.2 }}>{r.note}</div>}
                      </td>
                      <td style={td}>{r.office}</td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700 }}>{usd(amountFor(r))}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr>
                <td style={{ ...td, fontWeight: 800 }} colSpan={2}>Total</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900 }}>{usd(latestTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...small, margin: '10px 0 0' }}>
          The Supervisor&apos;s allowance was one and two-thirds times the others&apos; in every year from {FIRST.year}{' '}
          to {LATEST.year}. For a Council Member, paid $48,955 or $50,558 in {LATEST.year}, it added{' '}
          {((LATEST.elected / 50558) * 100).toFixed(0)}–{((LATEST.elected / 48955) * 100).toFixed(0)}% on top.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How the amount is set: inflation, every year</h3>
        <p style={{ ...body, marginTop: 0 }}>
          The contracts that carry the benefit say how it grows. The Police Chief&apos;s, approved in December 2023:
        </p>
        <blockquote style={quoteStyle}>
          &ldquo;The cost of these policies to the Town may not exceed $2,500.00. [&hellip;] The cost will be adjusted
          annually based on the Consumer Price Index for New York and Northeastern New Jersey area for all Urban
          Consumers [&hellip;] The Base Year to be used will be 1989.&rdquo;
        </blockquote>
        <p style={body}>
          The payroll follows that rule to within a cent. Each year&apos;s allowance is the year before&apos;s, raised by
          how much New York-area prices rose in the year before that, rounded to a hundredth of a percent. The
          elected officials&apos; allowance, the Supervisor&apos;s and the managers&apos; all move together:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.4 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: 'right' }}>Each elected official</th>
                <th style={{ ...th, textAlign: 'right' }}>Supervisor</th>
                <th style={{ ...th, textAlign: 'right' }}>Each manager</th>
                <th style={{ ...th, textAlign: 'right' }}>Raise</th>
                <th style={{ ...th, textAlign: 'right' }}>NY-area inflation, year before</th>
                <th style={{ ...th, textAlign: 'right' }}>Paid in full</th>
              </tr>
            </thead>
            <tbody>
              {ALLOWANCE.map((y, i) => (
                <tr key={y.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{y.year}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.elected)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.supervisor)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.manager)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{i === 0 ? '—' : pct(y.elected / ALLOWANCE[i - 1].elected - 1)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{pct(ruleRaise(y.year))}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {y.electedPaid + 1 + y.managersPaid} people · {usd0(allowanceTotal(y))}
                  </td>
                </tr>
              ))}
              <tr style={{ color: 'var(--rbl-text-muted)', fontStyle: 'italic' }}>
                <td style={td}>{ESTIMATE_2026.year} (rule)</td>
                <td style={{ ...td, textAlign: 'right' }}>{usd(ESTIMATE_2026.elected)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{usd(ESTIMATE_2026.supervisor)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{usd(ESTIMATE_2026.manager)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{pct(ESTIMATE_2026.raise)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{pct(ESTIMATE_2026.raise)}</td>
                <td style={{ ...td, textAlign: 'right' }}>not yet reported</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...body, marginBottom: 0 }}>
          Salaries did not move the same way. A Council Member was paid {usd0(COUNCIL_SALARY_FLAT.salary)} in{' '}
          {COUNCIL_SALARY_FLAT.from} and still {usd0(COUNCIL_SALARY_FLAT.salary)} in {COUNCIL_SALARY_FLAT.to}; the
          allowance on top rose from {usd(FIRST.elected)} to {usd(ALLOWANCE.find((y) => y.year === COUNCIL_SALARY_FLAT.to)!.elected)}{' '}
          over the same years. A resident made the point to the Board in 2012, and the Supervisor agreed (see
          November 20, 2012 below).
        </p>
        <p style={{ ...small, margin: '10px 0 0' }}>
          The managers&apos; amount is the contracts&apos; own. Two contracts adopted in January 2010 state &ldquo;The
          cost of these policies to the Town for 2009 was {usd(CONTRACT_2009)}.&rdquo; Carried forward by the same
          rule, that is {usd(contract2009Carried)} for {FIRST.year}; the payroll paid {usd(FIRST.manager)}. Inflation
          figures: <a href={CPI_SOURCE.url} style={link}>{CPI_SOURCE.label}</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Where it is in the budget: inside the salary lines</h3>
        <p style={{ ...body, marginTop: 0 }}>
          No budget line is called deferred compensation, annuity or life insurance. The allowance is paid through
          payroll, so it is charged to each office&apos;s salary line (&ldquo;Personal Services&rdquo;), and the
          published salary schedule shows only base salaries.
        </p>
        <p style={body}>
          The Town Board&apos;s own line shows it. In {LATEST.year} the Board&apos;s Personal Services line (
          {TOWN_BOARD_2025.account}) spent <strong>{usd(TOWN_BOARD_2025.personalServicesActual)}</strong>. The
          Board&apos;s payroll that year, less health-insurance buyouts (which have their own line), was{' '}
          <strong>{usd(townBoardPayrollLessBuyouts)}</strong> with the four Council Members&apos; allowances in it,
          and {usd(townBoardWithoutAllowance)} without them. Only the first matches.
        </p>
        <p style={{ ...small, margin: 0 }}>
          In 2010 a resident asked why the judges&apos; annuities appeared to be budgeted as &ldquo;sick pay buy
          back&rdquo; (see November 3, 2010 below). In {LATEST.year} the Justice Court&apos;s sick-buyback line spent{' '}
          {usd(JUSTICE_SICK_BUYBACK_2025)}, less than even one judge&apos;s allowance.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the Deputy Supervisor and Chief of Staff records establish</h3>
        <p style={{ ...body, marginTop: 0 }}>
          The individual employment agreements and later appointment resolutions are not interchangeable evidence.
          A contract can describe insurance or allow an employee to open a deferred-compensation account without
          expressly promising the separate Town-funded allowance tracked on this page. Conversely, a later Town
          Board resolution can authorize a position-level benefit even when a particular contract does not restate
          it in the same words.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <strong style={{ color: 'var(--rbl-title)' }}>Deputy Supervisor — historical authorization (2010)</strong>
            <p style={{ ...body, margin: '4px 0 0' }}>
              Resolution 2010-15, setting Jill Lewis&apos;s terms effective January 1, 2010, says the Town would offer
              universal life insurance, disability insurance and/or participation in the New York State deferred
              compensation program. It records the Town&apos;s cost for 2009 as <strong>$4,692.59</strong>, permits
              employee payroll deductions for additional cost, and says the cost would be adjusted annually using
              the specified New York-area CPI. A separate general-provisions clause says the Town shall establish
              a deferred-compensation plan for Lewis. This is evidence of a historical contractual benefit—not, by
              itself, proof that the same benefit automatically transferred to later incumbents.
            </p>
            <div style={{ ...small, marginTop: 5 }}>
                <a href="https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=2661,plainText=false)" style={link}>January 5, 2010 Town Board packet, including Resolution 2010-15</a>
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--rbl-title)' }}>Devon Higgins — later terms</strong>
            <p style={{ ...body, margin: '4px 0 0' }}>
              The supplied text of Resolution 2020-130 does not expressly restate a separate Town-funded
              deferred-compensation, annuity or life-insurance allowance. The 2026 appointment resolution,
              however, acknowledges that Higgins serves under terms previously adopted, including the 2020 terms
              and subsequent Resolutions 2023-606 and 2024-36. Therefore the 2020 agreement alone is not enough
              to determine the full current contractual position; those amendments must be reviewed before drawing
              a conclusion about authorization.
            </p>
          </div>
          <div>
            <strong style={{ color: 'var(--rbl-title)' }}>Chief of Staff — express position-level authorization</strong>
            <p style={{ ...body, margin: '4px 0 0' }}>
              Resolution 2019-37 expressly says the “deferred comp., annuity, life insurance benefit” is extended
              to the Chief of Staff, and its fiscal-impact statement marks the resolution as having a fiscal impact.
              The supplied text of Debi Burkowsky&apos;s 2022 contract separately provides for life insurance and
              permits her to establish a deferred-compensation plan, but does not state a specific Town-funded
              allowance amount. The January 2026 appointment resolution reappoints Burkowsky under previously
              adopted terms. Taken together, the records support an express authorization for the Chief of Staff
              position; they do not, on their own, establish the exact amount paid to Burkowsky in a particular year.
            </p>
            <div style={{ ...small, marginTop: 5 }}>
                <a href="https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=2591,plainText=false)" style={link}>January 3, 2019 Town Board packet, Resolution 2019-37</a>
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--rbl-title)' }}>John Marafino — Executive Assistant to the Supervisor</strong>
            <p style={{ ...body, margin: '4px 0 0' }}>
              The supplied 2018 agreement provides life insurance and permits a deferred-compensation plan, but
              does not expressly state the separate Town-funded allowance. A permission to establish a plan is
              not the same thing as a promise to contribute a specified Town-funded amount.
            </p>
          </div>
        </div>
        <p style={{ ...small, marginBottom: 0 }}>
          <strong>What remains unverified:</strong> the current payment amount and payment status for any named
          individual must be checked against the relevant later resolutions, current contract terms and payroll
          records. The payroll-based table above shows who was paid the allowance in 2025; it is not a substitute
          for determining the legal authorization or the terms in effect in 2026.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>July 2026: left out of the newest contract</h3>
        <p style={{ ...body, marginTop: 0 }}>
          The draft contract for the new {RECREATION_2026.office}, {RECREATION_2026.appointee}, in the July 16, 2026
          work session packet carried the clause as its item 6, letting the Town &ldquo;contribute to an independent
          life insurance policy, disability insurance policy, annuity or deferred compensation program of the
          employee&rsquo;s choice.&rdquo; The contract attached to{' '}
          <strong>Resolution {RECREATION_2026.resolution}</strong>, adopted {RECREATION_2026.vote} on{' '}
          {RECREATION_2026.adoptedOn} ({RECREATION_2026.ayes.join(', ')}), goes from item 5 straight to Article IX
          without it. Raymond Coyne, the Superintendent of Recreation in the {LATEST.year} payroll, was paid the
          managers&apos; allowance.
        </p>
        <p style={{ ...small, margin: 0 }}>
          <a href={RECREATION_2026.draftSource.url} style={link}>{RECREATION_2026.draftSource.label}</a> ·{' '}
          <a href={RECREATION_2026.adoptedSource.url} style={link}>{RECREATION_2026.adoptedSource.label}</a>
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How it got here</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          {TIMELINE.map((t) => (
            <div key={t.date + t.heading} style={{ borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 12 }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, fontWeight: 800 }}>{t.date}</div>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{t.heading}</strong>
              <p style={{ ...body, fontSize: 14, margin: '4px 0 0' }}>{t.body}</p>
              {t.quotes.map((q) => <blockquote key={q} style={quoteStyle}>&ldquo;{q}&rdquo;</blockquote>)}
              <div style={{ ...small, marginTop: 6 }}><a href={t.source.url} style={link}>{t.source.label}</a></div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Questions worth asking</h3>
        <ul style={{ ...body, fontSize: 14, paddingLeft: 18, margin: 0 }}>
          {QUESTIONS.map((q, i) => <li key={i} style={{ marginBottom: 6 }}>{q}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this page cannot tell you</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {LIMITS.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Sources: <a href={PAYROLL_SOURCE.url} style={link}>{PAYROLL_SOURCE.label}</a> (the same reports as the{' '}
        <a href={`${base}/payroll/`} style={link}>Payroll Explorer</a>); the Town Board records linked above; the {LATEST.year} actuals
        in the Town&apos;s 2027 Budget Supplement; <a href={CPI_SOURCE.url} style={link}>{CPI_SOURCE.label}</a>. Related:{' '}
        <a href={`${base}/management-compensation/`} style={link}>Management Pay</a>.
      </p>
    </PageShell>
  )
}
