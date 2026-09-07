'use client'

import { useEffect, useState } from 'react'

type Zoom = '100' | '115' | '130'

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

  const options: [Zoom, string][] = [['100', 'Default'], ['115', 'Larger'], ['130', 'Largest']]

  return (
    <details style={{ position: 'relative' }}>
      <summary aria-label="Display settings" title="Display settings" style={{ listStyle: 'none', cursor: 'pointer', color: 'white', border: '1px solid rgba(255,255,255,.20)', borderRadius: 8, padding: '8px 10px', fontWeight: 900, fontSize: 13, lineHeight: 1, background: 'rgba(255,255,255,.08)', userSelect: 'none' }}>Aa</summary>
      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 9px)', width: 180, background: 'var(--rbl-surface)', color: 'var(--rbl-text)', border: '1px solid var(--rbl-border)', borderRadius: 12, boxShadow: '0 18px 44px rgba(15,35,55,.18)', padding: 10, zIndex: 60 }}>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .7, padding: '2px 4px 7px' }}>Text size</div>
        <div role="group" aria-label="Text size" style={{ display: 'grid', gap: 4 }}>
          {options.map(([value, label]) => <button key={value} type="button" onClick={() => chooseZoom(value)} aria-pressed={zoom === value} style={{ textAlign: 'left', border: 0, borderRadius: 8, padding: '9px 10px', cursor: 'pointer', background: zoom === value ? 'var(--rbl-info-bg)' : 'transparent', color: 'var(--rbl-text-strong)', fontWeight: zoom === value ? 900 : 700 }}>{label}{zoom === value ? ' ✓' : ''}</button>)}
        </div>
      </div>
      <style>{`summary::-webkit-details-marker{display:none}`}</style>
    </details>
  )
}
