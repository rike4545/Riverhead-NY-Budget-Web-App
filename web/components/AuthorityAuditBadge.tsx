import { authorityAuditById } from '../lib/authority-audit'

export default function AuthorityAuditBadge({ id }: { id: string }) {
  const audit = authorityAuditById[id]
  if (!audit) return null
  const checked = new Date(`${audit.checkedAt}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  const fingerprint = audit.mode === 'sha256'
    ? audit.expectedSha256 ? `SHA-256 ${audit.expectedSha256.slice(0, 12)}…` : 'SHA-256 baseline pending CI review'
    : 'Availability monitored'

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', color: 'var(--rbl-text-muted)', fontSize: 11.2, lineHeight: 1.4 }}>
      <span style={{ border: '1px solid var(--rbl-border)', borderRadius: 999, padding: '3px 8px', background: 'var(--rbl-surface)', fontWeight: 850 }}>Checked {checked}</span>
      <span>{fingerprint}</span>
    </div>
  )
}
