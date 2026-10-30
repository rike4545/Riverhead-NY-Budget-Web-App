import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetChangesDashboard from '../../components/BudgetChangesDashboard'
import { budgetChanges } from '../../lib/budget-changes'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const dollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const year = budgetChanges.year

export const metadata = {
  title: `Budget Changes, Live — every budget change the Town Board has passed in ${year}`,
  description:
    `A live dashboard of every resolution the Riverhead Town Board has adopted in ${year} that changes a Town budget: ${dollars(budgetChanges.added)} added by vote so far, by where the money came from — savings, borrowing, grants and aid, fees — with each vote linked to its meeting record. It updates on its own as new meeting records are published.`,
}

export default function BudgetChangesPage() {
  const c = budgetChanges.counts
  // A change passed this year that closes out the year before, named as the example.
  const priorYear = budgetChanges.changes.find((e) => e.title.startsWith(`${year - 1} Budget`) && e.number)
  return (
    <PageShell
      title="Budget Changes, Live"
      subtitle={`Every resolution the Town Board has adopted in ${year} that adds money to a Town budget or moves it between lines, totalled by where the money came from. Through the ${budgetChanges.latestMeeting ? longDate(budgetChanges.latestMeeting) : 'latest'} meeting, and it keeps itself current while it is open.`}
    >
      <PlainCallout
        tips={[
          { label: 'What counts', text: 'a resolution the Town identifies as changing a budget. It may add spending, move money between budget lines, or use savings. The dashboard follows the Town’s resolution titles and the financial-impact forms attached to each item.' },
          { label: 'Where the numbers come from', text: 'the financial-impact form attached to each resolution in the meeting packet. Amounts are read from the individual account lines. Savings are counted using the same method as the How Savings Were Used page.' },
          { label: 'Not every change is totalled', text: `${c.notTotalled} of the ${c.changes} changes do not provide amounts that can be reliably added—for example, a transfer table may show a revenue account instead of a spending account, or may omit dollar amounts. They remain listed separately; the site does not guess at a total.` },
          { label: 'Live', text: 'the site checks the Town’s meeting records twice a day. If this page stays open, it checks for updated figures every five minutes.' },
        ]}
      >
        The budget adopted in November is the Town’s starting spending plan. During the year, the Town Board can approve changes—for example, adding money from savings or grants, authorizing borrowing, or moving money from one budget line to another. This page tracks those approved changes and links each figure to the Board record.
      </PlainCallout>

      <BudgetChangesDashboard initial={budgetChanges} base={base} />

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>How to read it</h2>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>
            <strong>New spending authority</strong> is additional spending the Board approved, funded by savings, borrowing, grants, aid, donations, fees, or other revenue. Moving money between existing budget lines changes what the Town can spend it on, but does not increase the overall budget. Those transfers are shown separately.
          </li>
          <li>
            <strong>Fund balance (savings)</strong> is money a fund has carried over from earlier years. The General Fund’s pays for town-wide services; a
            water or sewer district’s belongs to its ratepayers. For what the General Fund’s draws leave in reserve, see{' '}
            <a href={`${base}/fund-balance-draws/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>How Savings Were Used</a>{' '}
            and <a href={`${base}/reserves/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Savings &amp; reserves</a>.
          </li>
          <li>
            <strong>Capital projects</strong> have budgets of their own, outside the {budgetChanges.adopted.appropriations.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}{' '}
            the {budgetChanges.adopted.title} appropriated for the year’s operations. Many changes here set or adjust a project’s budget, often from
            borrowing, grants or developer fees.
          </li>
          <li>
            A resolution adopted in {year} can settle {year - 1}’s books
            {priorYear ? <> — “{priorYear.title}” (Resolution {priorYear.number}), for one</> : null}. It is counted here
            because it was passed in {year}. A meeting held after {year} is not counted: its votes change the next
            year’s budgets.
          </li>
          <li>
            These are the Town’s own figures as its statements print them. A statement can misstate an amount, and the
            Board can amend a figure later; the meeting record holds the resolution itself. See also{' '}
            <a href={`${base}/fiscal-impact/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Cost of Board Decisions</a> for every
            resolution’s statement.
          </li>
        </ul>
      </section>
    </PageShell>
  )
}
