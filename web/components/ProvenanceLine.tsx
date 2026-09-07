import DataStatus from './DataStatus'

type Status = 'official' | 'calculated' | 'projected'

type Props = {
  status: Status
  source: string
  asOf: string
  calculation?: string
  sourceHref?: string
}

export default function ProvenanceLine({ status, source, asOf, calculation, sourceHref }: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const href = sourceHref ? (sourceHref.startsWith('http') ? sourceHref : `${base}${sourceHref}`) : null

  return (
    <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--rbl-border-subtle)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.4 }}>
      <DataStatus status={status} />
      <span><strong style={{ color: 'var(--rbl-text-strong)' }}>Source:</strong>{' '}{href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} style={{ color: 'var(--rbl-link)', fontWeight: 800 }}>{source}</a> : source}</span>
      <span><strong style={{ color: 'var(--rbl-text-strong)' }}>As of:</strong> {asOf}</span>
      {calculation && <span><strong style={{ color: 'var(--rbl-text-strong)' }}>Calculation:</strong> {calculation}</span>}
    </div>
  )
}
