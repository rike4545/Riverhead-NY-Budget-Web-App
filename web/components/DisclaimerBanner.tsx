'use client'
import meta from '../public/data/meta.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

function freshness() {
  const when = new Date(meta.generatedAt).getTime()
  const ageDays = Math.max(0, (Date.now() - when) / 86_400_000)
  if (ageDays < 7) return { label: 'Current', tone: 'var(--rbl-success-strong)' }
  if (ageDays < 14) return { label: 'Delayed', tone: 'var(--rbl-warn)' }
  return { label: 'Stale', tone: 'var(--rbl-danger)' }
}

export default function DisclaimerBanner() {
  const state = freshness()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px 10px', marginTop: 14, flexWrap: 'wrap', color: 'var(--rbl-text-muted)', fontSize: 14 }}>
      <span>Independent project</span>
      <span aria-hidden="true">·</span>
      <span>Updated {meta.generatedAtDisplay}</span>
      <span aria-hidden="true">·</span>
      <span style={{ color: state.tone, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: 'currentColor' }} />{state.label}</span>
      <span aria-hidden="true">·</span>
      <a href={`${base}/data-quality/`} style={{ color: 'var(--rbl-link)', fontWeight: 600, textDecoration: 'none' }}>Check data freshness →</a>
    </div>
  )
}
