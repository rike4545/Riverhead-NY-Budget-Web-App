import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetFlow from '../../components/BudgetFlow'
import { flow, flowSource, flowTotal, flowYear, revenueTotal, spendingTotal } from '../../lib/budget-flow'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number) => `${(v * 100).toFixed(1)}%`

export const metadata = {
  title: 'Budget flow — where the 2027 budget’s money comes from and goes',
  description: 'One picture of the Town of Riverhead’s 2027 Preliminary budget: every dollar from its kind of revenue, through the funds, to what it pays for.',
}

export default function BudgetFlowPage() {
  const col = (c: 0 | 1 | 2) => flow.nodes.filter((n) => n.column === c)
  const tax = col(0).find((n) => n.label === 'Property taxes')
  const transfersIn = col(0).find((n) => n.label === 'Transfers from other funds')?.value ?? 0
  const charges = col(0).find((n) => n.label === 'Charges to other funds, other income')?.value ?? 0
  const table = (c: 0 | 1 | 2, head: string) => (
    <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, marginBottom: 14 }}>
      <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
        <th scope="col" style={{ padding: '8px 10px', textAlign: 'left', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>{head}</th>
        <th scope="col" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>Amount</th>
        <th scope="col" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>Share</th>
      </tr></thead>
      <tbody>
        {col(c).map((n) => (
          <tr key={n.id} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
            <th scope="row" style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>{n.label}</th>
            <td data-label="Amount" style={{ padding: '7px 10px', textAlign: 'right' }}>{usd(n.value)}</td>
            <td data-label="Share" style={{ padding: '7px 10px', textAlign: 'right' }}>{pct(n.value / flowTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <PageShell
      title="Budget flow"
      subtitle={`One picture of the ${flowYear} Preliminary budget: every dollar from its kind of revenue, through the Town's funds, to what it pays for.`}
    >
      <PlainCallout
        tips={[
          { label: 'Left', text: 'where the money comes from, grouped by the State’s revenue codes.' },
          { label: 'Middle', text: 'the funds it goes into. Each fund is its own account; the General Fund is the largest.' },
          { label: 'Right', text: 'what it pays for, grouped by the State’s function codes.' },
        ]}
      >
        The {flowYear} Preliminary budget is <strong>{usd(flowTotal)}</strong> across all funds.{' '}
        {tax ? <>Property taxes bring in {usd(tax.value)}, {pct(tax.value / flowTotal)} of it. </> : null}
        Some money is counted twice because it moves between funds: {usd(transfersIn)} in transfers and up to {usd(charges)} in charges one fund
        pays another, which the State groups with other local income. Both appear as money in and money out.
      </PlainCallout>

      <section id="flow" aria-labelledby="flow-heading" style={card}>
        <h2 id="flow-heading" style={h2}>Where the money comes from and goes</h2>
        <p style={prose}>Each band&apos;s thickness is its dollars. Point at a band to read it; every figure is in the tables below.</p>
        <BudgetFlow nodes={flow.nodes} links={flow.links} total={flowTotal} />
        <p style={{ ...prose, fontSize: 14.5, marginTop: 8 }}>
          {flow.smallFunds.length} funds under $2 million are grouped: {flow.smallFunds.join(', ')}.
        </p>
      </section>

      <section id="tables" aria-labelledby="tables-heading" style={card}>
        <h2 id="tables-heading" style={h2}>Every figure</h2>
        {table(0, 'Where it comes from')}
        {table(1, 'Fund')}
        {table(2, 'What it pays for')}
        <p style={prose}>
          Revenue adds to {usd(revenueTotal)} and spending to {usd(spendingTotal)}, both equal to the book&apos;s total of {usd(flowTotal)}.
        </p>
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li>Every line of the <a href={flowSource.url} style={link}>{flowSource.title}</a>, as the site reads it for the{' '}
            <a href={`${base}/tentative-2027/`} style={link}>2027 budget pages</a>.</li>
          <li>Revenue is grouped by its account&apos;s source code and spending by its function code, following the State Comptroller&apos;s chart of
            accounts for towns. &ldquo;Employee benefits&rdquo; are the benefits budgeted centrally (codes 90 and 91); salaries are in each
            function.</li>
          <li>PILOTs are payments in lieu of taxes: what some businesses pay instead of property tax under agreements with the Town or
            its Industrial Development Agency.</li>
          <li>&ldquo;Savings&rdquo; is appropriated fund balance: money from past years the budget plans to spend. See{' '}
            <a href={`${base}/fund-balance-draws/`} style={link}>savings used</a>.</li>
        </ul>
      </section>
    </PageShell>
  )
}
