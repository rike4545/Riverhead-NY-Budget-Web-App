// The dollar figures a resolution's own text states, each quoted as printed and
// labelled by its wording (etl/parse_fiscal_impact.py, stated_amounts). They
// sit beside the Fiscal Impact Statement, not in place of it: the statement is
// the Town's answer about money, and this is what the resolution says.

export type StatedAmount = {
  amount: number
  role: 'cost' | 'rate' | 'fee' | 'revenue' | 'fund-balance' | 'budget-line' | 'debt' | 'security' | 'context' | 'petty-cash' | 'other'
  clause: 'whereas' | 'resolved' | 'table' | 'heading'
  quote: string
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 100 ? 2 : 0 }).format(n)

export const ROLE_LABEL: Record<StatedAmount['role'], string> = {
  cost: 'cost',
  rate: 'pay or unit rate',
  fee: 'fee',
  revenue: 'money in',
  'fund-balance': 'fund balance',
  'budget-line': 'budget line',
  debt: 'borrowing',
  security: 'developer security',
  context: 'background',
  'petty-cash': 'petty cash',
  other: 'other',
}

// Costs first, then what else moves money, then background.
const ORDER: StatedAmount['role'][] = ['cost', 'budget-line', 'fund-balance', 'debt', 'rate', 'revenue', 'fee', 'security', 'petty-cash', 'other', 'context']

export default function StatedAmounts({ amounts }: { amounts?: StatedAmount[] | null }) {
  if (!amounts?.length) return null
  const sorted = [...amounts].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role) || b.amount - a.amount)
  const shown = sorted.slice(0, 3)
  return (
    <details style={{ marginTop: 6, fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--rbl-text-body)', fontWeight: 700 }}>
        The resolution states:{' '}
        {shown.map((a, i) => (
          <span key={i} style={{ fontWeight: 600 }}>
            {i > 0 ? ' · ' : ''}{usd(a.amount)} <span style={{ color: 'var(--rbl-text-muted)' }}>{ROLE_LABEL[a.role]}</span>
          </span>
        ))}
        {sorted.length > shown.length && <span style={{ color: 'var(--rbl-text-muted)' }}> · {sorted.length - shown.length} more</span>}
      </summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--rbl-text-muted)', lineHeight: 1.45 }}>
        {sorted.map((a, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            <strong style={{ color: 'var(--rbl-text-strong)' }}>{usd(a.amount)}</strong> — {ROLE_LABEL[a.role]}
            {a.clause === 'resolved' ? ', in what the Board resolves' : a.clause === 'table' ? ', in the budget table' : ''}:{' '}
            <q>{a.quote}</q>
          </li>
        ))}
      </ul>
    </details>
  )
}
