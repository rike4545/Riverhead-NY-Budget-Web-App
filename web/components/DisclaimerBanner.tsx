'use client'
import { useEffect, useState } from 'react'
import meta from '../public/data/meta.json'

const STORAGE_KEY = 'rbl-disclaimer-dismissed'

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true)  // start hidden to avoid flash
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (dismissed) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setDismissed(false) }}
          style={{ background: 'none', border: 'none', color: 'var(--rbl-note-sub)', fontSize: 12, cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <span style={{ fontSize: 14 }}>ℹ</span> Show site note
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 18, background: 'var(--rbl-note-bg)', border: '1px solid var(--rbl-note-border)', color: 'var(--rbl-note-text)', padding: '12px 40px 12px 13px', borderRadius: 8, fontSize: 14, lineHeight: 1.45, position: 'relative' }}>
      A neighbor made this to make the Town&apos;s finances easier to follow. It isn&apos;t affiliated with or endorsed by the Town of Riverhead, and figures can carry parsing errors — so double-check anything important against the official documents before you rely on it.
      <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: 'var(--rbl-note-sub)' }}>
        Last refreshed {meta.generatedAtDisplay} · new meeting minutes and financial-report documents are fetched and parsed automatically every week.
      </span>
      <button
        onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setDismissed(true) }}
        aria-label="Dismiss note"
        style={{ position: 'absolute', top: 9, right: 10, background: 'none', border: 'none', color: 'var(--rbl-note-sub)', fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1, fontWeight: 300 }}
      >
        ×
      </button>
    </div>
  )
}
