import PageShell from '../../components/PageShell'
import CompareExplorer from '../../components/CompareExplorer'
import PlainCallout from '../../components/PlainCallout'
import RecordTrail from '../../components/RecordTrail'
import { budgetHistory, budgetColumns, proposalColumn, columnTotal, columnOperating } from '../../lib/budget-history'
import { LETTER_2027 } from '../../lib/tentative-letters'

export const metadata = {
  title: 'What Changed in Riverhead’s Budget? — Budget Compare',
  description:
    'See what changed in Riverhead’s budget, which funds moved the most, and how the 2027 Tentative compares with the 2026 adopted budget.',
}

export default function ComparePage() {
  const years = budgetHistory.years
  const lastAdopted = budgetColumns.find((c) => c.key === String(years[years.length - 1]))!
  const priorAdopted = budgetColumns.find((c) => c.key === String(years[years.length - 2]))!
  // While next year's budget is only a proposal, it is the comparison residents are asking about.
  const from = proposalColumn ? lastAdopted : priorAdopted
  const to = proposalColumn ?? lastAdopted
  const opFrom = columnOperating(from)
  const opTo = columnOperating(to)
  const allFrom = columnTotal(from)
  const allTo = columnTotal(to)
  const opChange = opFrom != null && opTo != null ? opTo - opFrom : null
  const opPct = opFrom && opChange != null ? (opChange / opFrom) * 100 : null
  const allChange = allTo - allFrom
  const debt = (c: typeof from) => c.appropriations.V01 ?? null
  const debtChange = debt(to) != null && debt(from) != null ? debt(to)! - debt(from)! : null
  // The Supervisor's letter counts the same way; say so only where its two figures match this page's.
  const matchesLetter = to.year === LETTER_2027.year && to.stage === 'tentative' && opTo === LETTER_2027.operating.total && opChange === LETTER_2027.operating.growth

  return (
    <PageShell
      title="What Changed in Riverhead’s Budget?"
      subtitle={`Start with the big picture, then see which funds changed the most. Compare adopted appropriations from ${years[0]} through ${years[years.length - 1]}${proposalColumn ? `, and the ${proposalColumn.label} as proposed,` : ''} and follow the evidence into the underlying records.`}
    >
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(22px,2.6vw,27px)', fontWeight: 700, lineHeight: 1.25, color: 'var(--rbl-title)', maxWidth: '40ch' }}>
          {opChange != null
            ? <>{to.stage === 'adopted' ? `Planned spending ${opChange >= 0 ? 'rose' : 'fell'} ${usd(Math.abs(opChange))} from ${from.label} to ${to.label}` : `The ${to.label} proposes ${usd(opTo!)} of spending, ${usd(Math.abs(opChange))} ${opChange >= 0 ? 'more' : 'less'} than ${from.label}’s adopted budget`} ({opPct! >= 0 ? '+' : ''}{opPct!.toFixed(1)}%).</>
            : <>Planned spending changed {usd(allChange)} from {from.label} to {to.label}.</>}
        </h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-strong)', fontSize: 17, lineHeight: 1.6 }}>
          {opChange != null && <>That leaves out the three funds the others pay for: debt service, workers’ compensation and risk retention. </>}
          {opChange != null && <>Counting every fund, as the budget’s Summary page does, the total goes from {usd(allFrom)} to {usd(allTo)}, {allChange >= 0 ? 'up' : 'down'} {usd(Math.abs(allChange))}{debtChange != null && Math.abs(debtChange) > Math.abs(allChange) ? `, because debt service ${debtChange < 0 ? 'falls' : 'rises'} ${usd(Math.abs(debtChange))}` : ''}. </>}
          {matchesLetter && <>The Supervisor’s letter gives the same figure: “{LETTER_2027.operating.quote}” </>}
          The comparison below ranks the funds responsible for the largest moves.
        </p>
      </section>

      <PlainCallout
        tips={[
          { label: 'Appropriations', text: 'means planned spending. An appropriation increase does not automatically equal the same increase in your property-tax bill.' },
          { label: 'Start here', text: 'use “Biggest $ change” to find the largest budget movements; use “Biggest % change” to spot smaller funds with unusually large swings.' },
          { label: 'Follow the evidence', text: 'click a fund name to move from the comparison into that fund’s detailed records and multi-year history.' },
        ]}
      >
        This page turns a large budget into a simpler question: <strong>what changed, where did it change, and how much?</strong>
      </PlainCallout>

      <RecordTrail
        title="From a budget change to the bigger picture"
        intro="Use the same change as a starting point, then check taxes, payroll, funds, borrowing, decisions, and source documents before drawing a conclusion."
        items={[
          { href: '/tax-bill/', label: 'My Taxes', text: 'See the Town tax-rate change separately from planned spending.' },
          { href: '/payroll/', label: 'People & Pay', text: 'Check actual earnings, authorized salaries, raises, and overtime.' },
          { href: '/funds/', label: 'Funds & Accounts', text: 'Drill from a fund into departments and individual budget lines.' },
          { href: '/capital-debt/', label: 'Debt & Capital', text: 'Check capital financing, outstanding debt, and borrowing pressure.' },
          { href: '/meetings/', label: 'Town Board Votes', text: 'Follow the civic record behind budget and policy decisions.' },
          { href: '/sources/', label: 'Source Library', text: 'Return to the underlying official documents and source trail.' },
        ]}
      />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '16px 0' }}>
        <QuickLink href="/tax-bill/" title="My Taxes" text="See the Town tax-rate change separately from spending." />
        <QuickLink href="/payroll/" title="People & Pay" text="See actual pay, authorized salaries, raises and overtime." />
        <QuickLink href="/funds/" title="Funds" text="Open fund-level details and current-year information." />
        <QuickLink href="/capital-debt/" title="Debt & Capital" text="See major capital projects and outstanding debt." />
      </section>

      <CompareExplorer />
    </PageShell>
  )
}

function QuickLink({ href, title, text }: { href: string; title: string; text: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <a href={`${base}${href}`} style={{ display: 'block', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 13, textDecoration: 'none' }}>
      <div style={{ color: 'var(--rbl-title)', fontWeight: 850, fontSize: 14 }}>{title}</div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.4, marginTop: 3 }}>{text}</div>
    </a>
  )
}

function usd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
