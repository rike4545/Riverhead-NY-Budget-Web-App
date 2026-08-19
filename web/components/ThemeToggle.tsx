'use client'

import { useEffect, useState } from 'react'

// Light / Dark / System, stored in localStorage and applied as data-theme on
// <html>. "System" removes the attribute entirely rather than writing a value,
// which hands control back to the prefers-color-scheme media query in
// layout.tsx — so a reader on System follows their OS as it changes through
// the day, instead of being frozen at whatever it was when they last visited.
type Mode = 'light' | 'dark' | 'system'

const OPTIONS: { mode: Mode; label: string; glyph: string; title: string }[] = [
  { mode: 'light', label: 'Light', glyph: '☀', title: 'Always use the light theme' },
  { mode: 'dark', label: 'Dark', glyph: '☾', title: 'Always use the dark theme' },
  { mode: 'system', label: 'Auto', glyph: '◐', title: "Follow this device's appearance setting" },
]

export default function ThemeToggle() {
  // Render as "system" until mounted: the pre-paint script in layout.tsx has
  // already set the real theme, and guessing here would mismatch the server
  // HTML and trip a hydration warning.
  const [mode, setMode] = useState<Mode>('system')

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme')
    setMode(attr === 'dark' ? 'dark' : attr === 'light' ? 'light' : 'system')
  }, [])

  function choose(next: Mode) {
    setMode(next)
    const root = document.documentElement
    if (next === 'system') {
      root.removeAttribute('data-theme')
      try { localStorage.removeItem('theme') } catch { /* ignore */ }
    } else {
      root.setAttribute('data-theme', next)
      try { localStorage.setItem('theme', next) } catch { /* ignore */ }
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700 }}>Theme:</span>
      <div style={{ display: 'inline-flex', gap: 6 }}>
        {OPTIONS.map((o) => {
          const active = mode === o.mode
          return (
            <button
              key={o.mode}
              onClick={() => choose(o.mode)}
              aria-pressed={active}
              title={o.title}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)'}`,
                background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
                color: active ? '#ffffff' : 'var(--rbl-text-body)',
                fontWeight: 800, fontSize: 12.5, padding: '5px 10px', borderRadius: 8,
              }}
            >
              <span aria-hidden style={{ fontSize: 12 }}>{o.glyph}</span> {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
