import { findings, debtFinding, findingsYears } from '../lib/supplement-findings'
import { supplementSource } from '../lib/supplement'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/** What the Tentative's line-by-line Supplement shows beyond its totals. */
export default function SupplementFindings() {
  if (findings.length === 0) return null
  return (
    <section style={{ ...card, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the line-by-line Supplement shows</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
        The Budget Supplement prints every line of the Tentative beside what it cost in {findingsYears.last}, the {findingsYears.adopted} budget,
        and spending through June 30, {findingsYears.adopted}. Read against the seven Supplements before it, it shows things the totals
        do not.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {findings.map((f) => (
          <div key={f.id} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px', background: 'var(--rbl-surface-2)' }}>
            <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{f.title}</strong>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '5px 0 0' }}>
              {f.body}
              {f.link && <> <a href={f.link.href} style={{ color: 'var(--rbl-link)', fontWeight: 700, whiteSpace: 'nowrap' }}>{f.link.label} →</a></>}
            </p>
            {f.id === 'debt' && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
                {debtFinding.actualByYear.map((r) => <span key={r.year}>{r.year}: {usd(r.amount)}</span>)}
                <span>{findingsYears.adopted} budget: {usd(debtFinding.adopted)}</span>
                <strong style={{ color: 'var(--rbl-title)' }}>{findingsYears.budget} Tentative: {usd(debtFinding.tentative)}</strong>
                <span>({debtFinding.account}{debtFinding.page ? `, p. ${debtFinding.page}` : ''})</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '10px 0 0' }}>
        Figures are the Town&apos;s own, from its Budget Supplements
        {supplementSource ? <> (<a href={supplementSource.url} style={{ color: 'var(--rbl-link)' }}>{supplementSource.title}</a>)</> : null}.
        Actual spending and collections are the Town&apos;s books before each year&apos;s audit.
      </p>
    </section>
  )
}
