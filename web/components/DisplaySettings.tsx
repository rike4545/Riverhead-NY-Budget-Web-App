'use client'

import { useEffect, useState } from 'react'

type Zoom = '100' | '115' | '130'

// Lets a reader scale the whole page's text up. The choice is applied pre-paint
// by the script in layout.tsx (so the page doesn't visibly resize on load) and
// persisted so it sticks across visits. This component just mirrors that
// already-applied state into a button group and updates it on click.
export default function DisplaySettings() {
  const [zoom, setZoom] = useState<Zoom>('100')

  useEffect(() => {
    const z = document.documentElement.getAttribute('data-zoom')
    setZoom(z === '115' || z === '130' ? z : '100')
  }, [])

  function chooseZoom(next: Zoom) {
    setZoom(next)
    document.documentElement.setAttribute('data-zoom', next)
    try { localStorage.setItem('rbl-zoom', next) } catch { /* ignore */ }
  }

  const pillStyle = {
    color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,.28)', borderRadius: 6,
    padding: '9px 11px', fontWeight: 800, background: 'rgba(12,43,72,.35)', fontSize: 13.5, cursor: 'pointer',
    lineHeight: 1,
  }
  const activeStyle = {
    background: 'var(--rbl-fill-gold)', border: '1px solid var(--rbl-gold-border)', color: 'var(--rbl-on-gold)',
  }

  return (
    <div role="group" aria-label="Text size" style={{ display: 'inline-flex', gap: 5 }}>
      <button
        type="button"
        onClick={() => chooseZoom('100')}
        aria-pressed={zoom === '100'}
        title="Default text size"
        style={{ ...pillStyle, ...(zoom === '100' ? activeStyle : {}) }}
      >
        A
      </button>
      <button
        type="button"
        onClick={() => chooseZoom('115')}
        aria-pressed={zoom === '115'}
        title="Larger text"
        style={{ ...pillStyle, ...(zoom === '115' ? activeStyle : {}), fontSize: 15.5 }}
      >
        A+
      </button>
      <button
        type="button"
        onClick={() => chooseZoom('130')}
        aria-pressed={zoom === '130'}
        title="Largest text"
        style={{ ...pillStyle, ...(zoom === '130' ? activeStyle : {}), fontSize: 17.5 }}
      >
        A++
      </button>
    </div>
  )
}
