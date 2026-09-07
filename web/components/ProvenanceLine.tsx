import DataStatus from './DataStatus'

type Status = 'official' | 'calculated' | 'projected'

type Props = {
  status: Status
  source: string
  asOf: string
  calculation?: string
  sourceHref?: string
  evidenceHref?: string
  evidenceLabel?: string
  claimId?: string
}

function resolvedHref(href: string | undefined, base: string) {
  if (!href) return null
  if (href.startsWith('http')) return href
  if (base && (href === base || href.startsWith(`${base}/`) || href.startsWith(`${base}#`))) return href
  return `${base}${href}`
}

export default function ProvenanceLine({
  status,
  source,
  asOf,
  calculation,
  sourceHref,
  evidenceHref,
  evidenceLabel = 'Open evidence',
  claimId,
}: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const sourceUrl = resolvedHref(sourceHref, base)
  const evidenceUrl = resolvedHref(evidenceHref, base)

  return (
    <div
      id={claimId ? `claim-${claimId}` : undefined}
      data-provenance={claimId ? 'true' : 'summary'}
      data-provenance-status={status}
      data-claim-id={claimId}
      style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--rbl-border-subtle)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.4 }}
    >
      <DataStatus status={status} />
      <span>
        <strong style={{ color: 'var(--rbl-text-strong)' }}>Source:</strong>{' '}
        {sourceUrl ? <a href={sourceUrl} target={sourceUrl.startsWith('http') ? '_blank' : undefined} rel={sourceUrl.startsWith('http') ? 'noreferrer' : undefined} style={{ color: 'var(--rbl-link)', fontWeight: 800 }}>{source}</a> : source}
      </span>
      <span><strong style={{ color: 'var(--rbl-text-strong)' }}>As of:</strong> {asOf}</span>
      {calculation && <span><strong style={{ color: 'var(--rbl-text-strong)' }}>Calculation:</strong> {calculation}</span>}
      {evidenceUrl && <a href={evidenceUrl} target={evidenceUrl.startsWith('http') ? '_blank' : undefined} rel={evidenceUrl.startsWith('http') ? 'noreferrer' : undefined} style={{ color: 'var(--rbl-link)', fontWeight: 900, textDecoration: 'none' }}>{evidenceLabel} →</a>}
    </div>
  )
}
