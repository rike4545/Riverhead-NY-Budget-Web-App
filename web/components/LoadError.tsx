// A failed live fetch, said in full: what happened, why if known, what is still
// on the page, and a way to try again. See lib/fetch-errors.ts.

import { explainFailure } from '../lib/fetch-errors'

export default function LoadError({
  what,
  still,
  error,
  onRetry,
  retryLabel = 'Try again',
}: {
  /** What did not happen, as a sentence: "We couldn’t refresh the figures from New York’s open data." */
  what: string
  /** What the reader still has: "The figures below are the stored copy." */
  still: string
  error: unknown
  onRetry: () => void
  retryLabel?: string
}) {
  const { why, detail } = explainFailure(error)
  return (
    <div
      role="alert"
      style={{ marginTop: 12, marginBottom: 12, color: 'var(--rbl-danger-strong)', background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.5 }}
    >
      <strong>{what}</strong> {why} {still}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onRetry}
          style={{ font: 'inherit', fontWeight: 700, minHeight: 32, padding: '4px 12px', borderRadius: 8, border: '1px solid var(--rbl-danger-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-danger-strong)', cursor: 'pointer' }}
        >
          {retryLabel}
        </button>
        {detail && <span style={{ fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>Details: {detail}</span>}
      </div>
    </div>
  )
}
