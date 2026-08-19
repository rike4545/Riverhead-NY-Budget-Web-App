'use client'

import { useState } from 'react'
import { lookup } from '../lib/glossary'

// An inline term with a plain-English definition. Tap or click to open a small
// popover; tap anywhere else to close. Works on touch and desktop.
export default function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const entry = lookup(id)
  if (!entry) return <>{children ?? id}</>
  const label = children ?? entry.term

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'help',
          color: 'inherit', borderBottom: '1.5px dotted var(--rbl-accent-border)', lineHeight: 1.2,
        }}
        title={entry.plain}
      >
        {label}
        <sup style={{ color: 'var(--rbl-accent)', fontWeight: 900, fontSize: '0.7em', marginLeft: 1 }}>?</sup>
      </button>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <span
            role="tooltip"
            style={{
              position: 'absolute', zIndex: 50, top: '130%', left: 0, width: 'max-content', maxWidth: 300,
              background: '#0f2740', color: 'var(--rbl-surface-3)', padding: '10px 12px', borderRadius: 10,
              boxShadow: '0 16px 40px var(--rbl-shadow)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.45,
              textTransform: 'none', letterSpacing: 0, whiteSpace: 'normal', textAlign: 'left',
            }}
          >
            <strong style={{ display: 'block', color: 'var(--rbl-surface)', marginBottom: 3 }}>{entry.term}</strong>
            {entry.plain}
          </span>
        </>
      )}
    </span>
  )
}
