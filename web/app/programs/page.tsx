import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ProgramExplorer from '../../components/ProgramExplorer'
import {
  censusDataset, censusSource, households, medianHouseholdIncome, method, notCovered,
  perResident, population, programSeries, programYears, yearsLeftOut,
} from '../../lib/programs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const

const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`

const first = programYears[0]
const last = programYears[programYears.length - 1]
const current = programYears[programSeries.current]

export const metadata = {
  title: 'Program Budget — what each Town service costs, what it earns back, and how that changes every year',
  description:
    `Riverhead’s budgets from ${first.label} to the ${last.label} budget, regrouped into the seven services the State’s account system says the Town performs: what each costs once pension and health insurance are counted, how much it earns back in fees, what is left for taxpayers, and how each figure moved from year to year.`,
}

export default function ProgramsPage() {
  return (
    <PageShell
      title="What the Town Does, and What It Costs"
      subtitle={`Every budget from ${first.label} to the ${last.label} budget, regrouped into services rather than funds — full cost including pension and health insurance, fees earned back, and what each one leaves for the tax levy. Pick a year and compare it with any other. In ${current.title}: ${usd(perResident.everything)} per resident, all in.`}
    >
      <PlainCallout
        tips={[
          { label: 'Full cost, not just the department line', text: 'pension and health insurance are pushed back onto the programs whose staff earned them, so Police costs what Police actually costs.' },
          { label: '"Earns back"', text: 'is fees paid by the people who use the service — permits, water bills, beach passes — not taxes.' },
          { label: 'Net is what general revenue covers', text: 'property and sales taxes, mortgage tax, PILOTs and state aid. A program with a high cost and high recovery may ask less of you than a cheaper one that charges nobody.' },
          { label: 'Every year, the same way', text: `each budget from ${first.label} on is regrouped by the same rules, so a change from one year to the next is a change in the budget, not in the method.` },
        ]}
      >
        A budget organized by <strong>fund</strong> answers an accountant&apos;s question. This page reorganizes the
        same dollars by <strong>what the Town does with them</strong> — and the classification isn&apos;t ours. New
        York&apos;s Uniform System of Accounts already assigns every municipal dollar to a function, and Riverhead
        codes to it on both the spending and the revenue side. We regrouped; we didn&apos;t reclassify.
      </PlainCallout>

      <ProgramExplorer
        series={programSeries}
        base={base}
        people={{ population, households, medianHouseholdIncome, censusTitle: censusSource.title, censusDataset }}
      />

      {/* The honest limit of the exercise. */}
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-note-text)' }}>{notCovered.title}</h3>
        <p style={{ color: 'var(--rbl-note-text)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{notCovered.body}</p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>How this was built</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
          Rearranging a budget is exactly where a transparency site can mislead without meaning to, so every
          decision that moved a dollar is written down here.
        </p>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {method.map((m) => (
            <li key={m.title} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{m.title}</strong>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 3 }}>{m.body}</div>
            </li>
          ))}
        </ol>

        <h3 style={{ color: 'var(--rbl-title)', fontSize: 17, margin: '18px 0 6px' }}>The arithmetic checks, every year</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 10px' }}>
          Services, debt service, money set aside and transfers between Town funds should add up to everything the
          budget appropriates across all its funds, as its own Summary page states. They do, to the dollar.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                {['Budget', 'Services', 'Debt service', 'Set aside', 'Transfers', 'Adds up to', 'Summary page', 'Difference'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programYears.map((y) => (
                <tr key={y.label} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--rbl-title)', fontWeight: 600, whiteSpace: 'nowrap' }}>{y.label}</th>
                  {[y.totals.fullCost, y.totals.debtService, y.totals.setAside, y.totals.interfundTransfers, y.reconciliation.computed, y.reconciliation.appropriations, y.reconciliation.variance].map((v, i) => (
                    <td key={i} style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: 'var(--rbl-text-strong)', fontWeight: i === 6 ? 700 : 400 }}>{usd(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ color: 'var(--rbl-title)', fontSize: 17, margin: '18px 0 6px' }}>Where each year comes from</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
          {programYears.map((y) => (
            <li key={y.label}>
              <strong style={{ color: 'var(--rbl-title)' }}>{y.label}</strong>: every line from the{' '}
              {y.supplement ? <a href={y.supplement.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{y.supplement.title}</a> : 'Budget Supplement'}
              , checked against the Summary page of the{' '}
              {y.summary ? <a href={y.summary.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{y.summary.title}</a> : `${y.year} budget`}.
              {' '}Staff from the {y.staffYear} payroll.
            </li>
          ))}
        </ul>
        {yearsLeftOut.length > 0 && (
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, margin: '10px 0 0' }}>
            Left out: {yearsLeftOut.map((y) => `${y.year}${y.stage === 'tentative' ? ' proposed' : ''} (${y.reason})`).join('; ')}.
          </p>
        )}
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
          <a href={`${base}/funds/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Browse the same dollars by fund</a>{' '}
          or read the{' '}
          <a href={`${base}/gfoa/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>GFOA standards page</a>{' '}
          for why a program view matters.
        </p>
      </section>
    </PageShell>
  )
}
