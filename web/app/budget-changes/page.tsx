import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetChangesDashboard from '../../components/BudgetChangesDashboard'
import { budgetChanges } from '../../lib/budget-changes'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const dollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export const metadata = {
  title: 'Budget Changes, Live — every budget change the Town Board has passed this year',
  description:
    `A live dashboard of every resolution the Riverhead Town Board has adopted in 2026 that changes a Town budget: ${dollars(budgetChanges.added)} added by vote so far, by where the money came from — savings, borrowing, grants and aid, fees — with each vote linked to its meeting record. It updates on its own as new meeting records are published.`,
}

export default function BudgetChangesPage() {
  const c = budgetChanges.counts
  return (
    <PageShell
      title="Budget Changes, Live"
      subtitle={`Every resolution the Town Board has adopted this year that adds money to a Town budget or moves it between lines, totalled by where the money came from. Through the ${budgetChanges.latestMeeting ? longDate(budgetChanges.latestMeeting) : 'latest'} meeting, and it keeps itself current while it is open.`}
    >
      <PlainCallout
        tips={[
          { label: 'What counts', text: 'an adopted resolution the Town itself marks as a budget change: its title says it adjusts, transfers, amends or adopts a budget, its fiscal impact statement fills in the Appropriation Transfer field, or it spends savings.' },
          { label: 'Where the numbers come from', text: 'each resolution’s fiscal impact statement in the agenda packet, read account by account. Savings are counted exactly as Where the Surplus Went counts them.' },
          { label: 'Not every change is totalled', text: `${c.notTotalled} of the ${c.changes} have tables that cannot be read plainly — a revenue line moved in a transfer field, or no amounts. They are listed with their own lines rather than netted by guesswork.` },
          { label: 'Live', text: 'the site checks the Town’s meeting records twice a day. This page re-reads the data every five minutes while open and updates when a meeting’s records arrive.' },
        ]}
      >
        The budget the Board adopts in November is a starting point. All year the Board passes resolutions that add
        money to a fund from its savings, from grants and borrowing, or move money from one line to another. This
        dashboard keeps the running total, and every figure opens the votes behind it.
      </PlainCallout>

      <BudgetChangesDashboard initial={budgetChanges} base={base} />

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>How to read it</h2>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>
            <strong>Added to budgets</strong> is new money the Board appropriated: savings, borrowing, grants, aid,
            donations, fees and other revenue. Money moved from one budget line or Town fund to another changes what a
            budget buys but not its size, so it is shown on its own and left out of that total.
          </li>
          <li>
            <strong>Savings</strong> is each fund’s own fund balance. The General Fund’s pays for town-wide services; a
            water or sewer district’s belongs to its ratepayers. For what the General Fund’s draws leave in reserve, see{' '}
            <a href={`${base}/fund-balance-draws/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Where the Surplus Went</a>{' '}
            and <a href={`${base}/reserves/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Reserves</a>.
          </li>
          <li>
            <strong>Capital projects</strong> have budgets of their own, outside the {budgetChanges.adopted.appropriations.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}{' '}
            the {budgetChanges.adopted.title} appropriated for the year’s operations. Many changes here set or adjust a project’s budget, often from
            borrowing, grants or developer fees.
          </li>
          <li>
            A resolution adopted this year can settle last year’s books — “2025 Budget Transfers”, for one. It is
            counted here because it was passed this year.
          </li>
          <li>
            These are the Town’s own figures as its statements print them. A statement can misstate an amount, and the
            Board can amend a figure later; the meeting record holds the resolution itself. See also{' '}
            <a href={`${base}/fiscal-impact/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Fiscal Impact</a> for every
            resolution’s statement.
          </li>
        </ul>
      </section>
    </PageShell>
  )
}
