'use client'
import { useEffect, useState } from 'react'
import meta from '../public/data/meta.json'

const STORAGE_KEY = 'rbl-disclaimer-dismissed'

function freshness() {
  const when = new Date(meta.generatedAt).getTime()
  const ageDays = Math.max(0, (Date.now() - when) / 86_400_000)
  if (ageDays < 7) return { label: 'Current', detail: 'Data refresh is within the normal weekly window.', tone: 'var(--rbl-success-strong)' }
  if (ageDays < 14) return { label: 'Delayed', detail: 'The weekly refresh is overdue; figures may not reflect the latest records.', tone: 'var(--rbl-warn)' }
  return { label: 'Stale', detail: 'The refresh is more than two weeks old; verify important figures against official records.', tone: 'var(--rbl-danger)' }
}

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    setMounted(true)
  }, [])

  if (!mounted) return null

  const state = freshness()
  const status = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 9, marginTop: 10, flexWrap: 'wrap' }}>
      <span style={{ color: 'var(--rbl-note-sub)', fontSize: 12 }}>
        Unofficial · Last refreshed {meta.generatedAtDisplay}
      </span>
      <span style={{ color: state.tone, fontSize: 12, fontWeight: 900 }} title={state.detail}>
        ● Data status: {state.label}
      </span>
      {dismissed && (
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setDismissed(false) }}
          style={{ background: 'none', border: 'none', color: 'var(--rbl-note-sub)', fontSize: 12, cursor: 'pointer', padding: '2px 0' }}
        >
          Show site note
        </button>
      )}
    </div>
  )

  if (dismissed) return status

  return (
    <>
      <div style={{ marginTop: 18, background: 'var(--rbl-note-bg)', border: '1px solid var(--rbl-note-border)', color: 'var(--rbl-note-text)', padding: '12px 40px 12px 13px', borderRadius: 8, fontSize: 14, lineHeight: 1.45, position: 'relative' }}>
        A neighbor made this to make the Town&apos;s finances easier to follow. It isn&apos;t affiliated with or endorsed by the Town of Riverhead, and figures can carry parsing errors — so double-check anything important against the official documents before you rely on it.
        <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: 'var(--rbl-note-sub)' }}>
          {state.detail} New meeting minutes and financial-report documents are fetched and parsed automatically every week when the source material is available.
        </span>
        <button
          onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setDismissed(true) }}
          aria-label="Dismiss note"
          style={{ position: 'absolute', top: 9, right: 10, background: 'none', border: 'none', color: 'var(--rbl-note-sub)', fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1, fontWeight: 300 }}
        >×</button>
      </div>
      {status}
    </>
  )
}
