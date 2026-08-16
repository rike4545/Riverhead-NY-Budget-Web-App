'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'dark'
type Zoom = '100' | '115' | '130'

// Lets a reader switch to a dark palette and/or zoom the whole page's text
// larger. Both are applied pre-paint by the scripts in layout.tsx (so there's
// no flash of the wrong theme/size) and persisted so the choice sticks across
// visits. This component just mirrors that already-applied state into two
// button groups and updates it on click.
export default function DisplaySettings() {
  const [mode, setMode] = useState<Mode>('light')
  const [zoom, setZoom] = useState<Zoom>('100')

  useEffect(() => {
    setMode(document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light')
    const z = document.documentElement.getAttribute('data-zoom')
    setZoom(z === '115' || z === '130' ? z : '100')
  }, [])

  function chooseMode(next: Mode) {
    setMode(next)
    document.documentElement.setAttribute('data-mode', next)
    try { localStorage.setItem('rbl-mode', next) } catch { /* ignore */ }
  }

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
  const activeStyle = { background: '#c99a2e', border: '1px solid #c99a2e', color: '#284a69' }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div role="group" aria-label="Color theme" style={{ display: 'inline-flex', gap: 5 }}>
        <button
          type="button"
          onClick={() => chooseMode('light')}
          aria-pressed={mode === 'light'}
          title="Use the light theme"
          style={{ ...pillStyle, ...(mode === 'light' ? activeStyle : {}) }}
        >
          ☀ Light
        </button>
        <button
          type="button"
          onClick={() => chooseMode('dark')}
          aria-pressed={mode === 'dark'}
          title="Use the dark theme"
          style={{ ...pillStyle, ...(mode === 'dark' ? activeStyle : {}) }}
        >
          ☾ Dark
        </button>
      </div>
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
    </div>
  )
}
