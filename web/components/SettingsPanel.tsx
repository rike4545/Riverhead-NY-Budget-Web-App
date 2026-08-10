'use client'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type FontSize = '' | 'lg' | 'xl'

function getTheme(): Theme {
  try { return (localStorage.getItem('rbl-theme') as Theme) || 'light' } catch { return 'light' }
}
function getFont(): FontSize {
  try { return (localStorage.getItem('rbl-font') as FontSize) || '' } catch { return '' }
}
function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '')
  try { if (t === 'dark') localStorage.setItem('rbl-theme', 'dark'); else localStorage.removeItem('rbl-theme') } catch {}
}
function applyFont(f: FontSize) {
  document.documentElement.setAttribute('data-font', f)
  try { if (f) localStorage.setItem('rbl-font', f); else localStorage.removeItem('rbl-font') } catch {}
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [font, setFont] = useState<FontSize>('')
  useEffect(() => {
    setTheme(getTheme())
    setFont(getFont())
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }
  function setFontSize(f: FontSize) {
    setFont(f)
    applyFont(f)
  }

  const isDark = theme === 'dark'

  const btnBase: React.CSSProperties = {
    border: '1px solid var(--rbl-border)', borderRadius: 7, padding: '7px 14px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .12s',
    color: 'var(--rbl-text)',
  }
  const btnActive: React.CSSProperties = {
    background: 'var(--rbl-page-accent)', color: 'white', borderColor: 'var(--rbl-page-accent)',
  }
  const btnInactive: React.CSSProperties = { background: 'var(--rbl-surface)' }

  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 60,
        background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)',
        borderRadius: 12, boxShadow: '0 18px 40px var(--rbl-shadow)',
        padding: '18px 20px', minWidth: 240,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--rbl-title)' }}>Display settings</span>
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{ background: 'none', border: 'none', color: 'var(--rbl-text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 2px', fontWeight: 300 }}
        >×</button>
      </div>

      {/* Dark mode */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--rbl-text-muted)', marginBottom: 8 }}>Theme</div>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 9, border: '1px solid var(--rbl-border)',
            background: 'var(--rbl-surface)', color: 'var(--rbl-text)', cursor: 'pointer', fontWeight: 700, fontSize: 13,
          }}
        >
          <span>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</span>
          <span style={{
            width: 38, height: 22, borderRadius: 11, background: isDark ? 'var(--rbl-page-accent)' : '#d1d5db',
            position: 'relative', display: 'inline-block', transition: 'background .2s',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: isDark ? 18 : 3, width: 16, height: 16,
              borderRadius: '50%', background: 'white', transition: 'left .2s',
            }} />
          </span>
        </button>
      </div>

      {/* Font size */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--rbl-text-muted)', marginBottom: 8 }}>Text size</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['', 'Normal'], ['lg', 'Large'], ['xl', 'Larger']] as [FontSize, string][]).map(([val, label]) => (
            <button
              key={val || 'normal'}
              onClick={() => setFontSize(val)}
              style={{ ...btnBase, flex: 1, ...(font === val ? btnActive : btnInactive) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
