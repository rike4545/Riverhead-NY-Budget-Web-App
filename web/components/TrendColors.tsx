'use client'

import { useEffect, useState } from 'react'

// A small control that lets a reader choose how increases are colored.
// Accountants read red as an increase (a cost going up); many people read
// green as "up." This flips a global CSS variable so every up/down number
// on the site follows the reader's choice.
export default function TrendColors() {
  const [mode, setMode] = useState<'red-up' | 'green-up'>('red-up')

  useEffect(() => {
    setMode(document.documentElement.getAttribute('data-tc') === 'green-up' ? 'green-up' : 'red-up')
  }, [])

  function choose(next: 'red-up' | 'green-up') {
    setMode(next)
    document.documentElement.setAttribute('data-tc', next)
    try { localStorage.setItem('tc', next) } catch { /* ignore */ }
  }

  const swatch = (m: 'red-up' | 'green-up', color: string) => {
    const active = mode === m
    return (
      <button
        onClick={() => choose(m)}
        aria-pressed={active}
        title={m === 'red-up' ? 'Show increases in red (accountant view)' : 'Show increases in green (up = green)'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          border: `1.5px solid ${active ? color : '#cbd5e1'}`, background: active ? color : 'white',
          color: active ? 'white' : '#475569', fontWeight: 800, fontSize: 12.5,
          padding: '5px 10px', borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 11 }}>▲</span> {m === 'red-up' ? 'Red' : 'Green'}
      </button>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700 }}>Color an increase:</span>
      <div style={{ display: 'inline-flex', gap: 6 }}>
        {swatch('red-up', '#b91c1c')}
        {swatch('green-up', '#15803d')}
      </div>
    </div>
  )
}
