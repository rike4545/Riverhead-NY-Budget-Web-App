'use client'

import { useState } from 'react'
import { lookup } from '../lib/glossary'

// An inline term with a plain-English definition. Tap or click to open a small
// popover; tap anywhere else to close. Works on touch and desktop.
//
// Inside a link, pass `plain`: HTML allows no button inside an <a>, so the term
// is drawn the same way but as text, with the definition as its tooltip.
export default function Term({ id, children, plain }: { id: string; children?: React.ReactNode; plain?: boolean }) {
  const [open, setOpen] = useState(false)
  const entry = lookup(id)
  if (!entry) return <>{children ?? id}</>
  const label = children ?? entry.term
  const mark = <sup style={{ color: 'var(--rbl-accent)', fontWeight: 900, fontSize: '0.7em', marginLeft: 1 }}>?</sup>

  if (plain) {
    return (
      <span title={entry.plain} style={{ display: 'inline-block', cursor: 'help', borderBottom: '1.5px dotted var(--rbl-accent-border)', lineHeight: 1.2 }}>
        {label}
        {mark}
      </span>
    )
  }

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'help', textAlign: 'inherit',
          color: 'inherit', borderBottom: '1.5px dotted var(--rbl-accent-border)', lineHeight: 1.2,
        }}
        title={entry.plain}
      >
        {label}
        {mark}
      </button>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <span
            role="tooltip"
            style={{
              position: 'absolute', zIndex: 50, top: '130%', left: 0, width: 'max-content', maxWidth: 300,
              background: '#0f2740', color: 'var(--rbl-surface-3)', padding: '10px 12px', borderRadius: 10,
              fontSize: 13.5, fontWeight: 500, lineHeight: 1.45,
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
