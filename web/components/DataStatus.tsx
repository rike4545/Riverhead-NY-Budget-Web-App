type DataStatusProps = {
  status: 'official' | 'calculated' | 'projected'
  text?: string
}

const labels = {
  official: 'Official source',
  calculated: 'Calculated from source data',
  projected: 'Projection / scenario',
} as const

const descriptions = {
  official: 'Reported directly in a Town or other cited official record.',
  calculated: 'Computed by the site from cited source records; it is not a separate Town-reported figure.',
  projected: 'A forward-looking estimate or scenario based on stated assumptions.',
} as const

export default function DataStatus({ status, text }: DataStatusProps) {
  return (
    <span
      title={descriptions[status]}
      aria-label={`${labels[status]}. ${descriptions[status]}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 9px',
        borderRadius: 999,
        border: '1px solid var(--rbl-border-subtle)',
        background: 'var(--rbl-surface-2)',
        color: 'var(--rbl-text-strong)',
        fontSize: 11.5,
        fontWeight: 900,
        lineHeight: 1.2,
      }}
    >
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'official' ? 'var(--rbl-success)' : status === 'calculated' ? 'var(--rbl-accent)' : 'var(--rbl-warn)' }} />
      {text || labels[status]}
    </span>
  )
}
