import type { ReactNode } from 'react'
import { released2027, levySentence, YEAR } from '../lib/tentative-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

// For pages built on the 2027 projection. Until the Town's own Tentative is
// parsed this renders nothing, and the page shows its projection alone. Once it
// is, the page says what the Tentative actually proposes, in the words every
// other such page uses, and leaves its own figures as they were: they are the
// yardstick the proposal is measured against, not a description of it.
export default function TentativeReleased({ children }: { children?: ReactNode }) {
  if (!released2027) return null
  return (
    <aside
      data-tentative-released
      style={{
        background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderLeft: '6px solid var(--rbl-success)',
        borderRadius: 14, padding: '14px 18px', marginBottom: 18, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.55,
      }}
    >
      <strong style={{ color: 'var(--rbl-title)' }}>The Town’s {YEAR} Tentative Budget is out.</strong>{' '}
      {levySentence(released2027)}
      {children && <> {children}</>}{' '}
      <a href={`${base}/tentative-${YEAR}/`} style={{ color: 'var(--rbl-link)', fontWeight: 800, whiteSpace: 'nowrap' }}>
        See how it compares →
      </a>
    </aside>
  )
}
