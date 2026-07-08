'use client'

import { useMemo, useState } from 'react'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export type FiscalResolution = {
  number: string; seq: number; title: string; category: string
  townFiscalImpact: 'Yes' | 'No'; townTreatment: string
  amount: number | null; note: string | null
  realistic: { verdict: string; reason: string; flag: string }
  vote: { adopted: boolean; tag: string; ayes: number | null; nays: number | null } | null
}

const FLAG_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  understated: { bg: '#fee2e2', fg: '#991b1b', label: 'Understated' },
  'reserve-draw': { bg: '#fef3c7', fg: '#92400e', label: 'Draws reserves' },
  neutral: { bg: '#dbeafe', fg: '#1e3a8a', label: 'Net-neutral' },
  saving: { bg: '#dcfce7', fg: '#166534', label: 'Saving' },
  positive: { bg: '#dcfce7', fg: '#166534', label: 'Revenue in' },
  fair: { bg: '#f1f5f9', fg: '#475569', label: 'No direct cost' },
}

export default function FiscalImpactTable({ resolutions }: { resolutions: FiscalResolution[] }) {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'all' | 'corrections' | 'money'>('all')
  const query = q.trim().toLowerCase()

  const rows = useMemo(() => resolutions.filter((r) => {
    if (view === 'corrections' && !(r.realistic.flag === 'understated' && r.townFiscalImpact === 'No')) return false
    if (view === 'money' && !r.amount) return false
    if (query && !(`${r.number} ${r.title} ${r.category}`.toLowerCase().includes(query))) return false
    return true
  }), [resolutions, view, query])

  const correctionCount = resolutions.filter((r) => r.realistic.flag === 'understated' && r.townFiscalImpact === 'No').length
  const moneyCount = resolutions.filter((r) => r.amount).length

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['all', `All 53`], ['corrections', `Corrections (${correctionCount})`], ['money', `Has a dollar figure (${moneyCount})`]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
              borderColor: view === v ? '#1f5f8f' : '#cbd5e1', background: view === v ? '#1f5f8f' : 'white', color: view === v ? 'white' : '#334155',
            }}>{label}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a resolution # or title…"
          style={{ flex: 1, minWidth: 200, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      <section style={card}>
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{rows.length} resolutions</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Res #</th>
                <th style={th}>What it does</th>
                <th style={{ ...th, textAlign: 'center' }}>Town says</th>
                <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                <th style={th}>Realistic read</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const fs = FLAG_STYLE[r.realistic.flag] || FLAG_STYLE.fair
                const townNo = r.townFiscalImpact === 'No'
                return (
                  <tr key={r.number} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#12385b' }}>{r.number}</div>
                      {r.vote && <div style={{ fontSize: 11, color: r.vote.tag === 'tabled' ? '#92400e' : '#64748b' }}>{r.vote.tag === 'tabled' ? 'tabled' : `adopted ${r.vote.ayes ?? ''}${r.vote.ayes != null ? '-' + (r.vote.nays ?? 0) : ''}`}</div>}
                    </td>
                    <td style={{ ...td, maxWidth: 360 }}>
                      <div style={{ color: '#334155', lineHeight: 1.4 }}>{r.title}</div>
                      <span style={{ display: 'inline-block', marginTop: 3, background: '#eef2f7', color: '#475569', fontSize: 10.5, fontWeight: 800, padding: '1px 7px', borderRadius: 999, textTransform: 'capitalize' }}>{r.category.replace('-', ' ')}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ background: townNo ? '#f1f5f9' : '#e0f2fe', color: townNo ? '#475569' : '#075985', fontWeight: 800, fontSize: 11.5, padding: '2px 9px', borderRadius: 999 }}>
                        {townNo ? 'No impact' : 'Impact'}
                      </span>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{r.townTreatment === 'absorbed' ? 'absorbed' : ''}</div>
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700, color: '#12385b' }}>
                      {r.amount ? usd(r.amount) : <span style={{ color: '#cbd5e1', fontWeight: 500 }}>—</span>}
                    </td>
                    <td style={{ ...td, maxWidth: 340 }}>
                      <span style={{ background: fs.bg, color: fs.fg, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{fs.label}</span>
                      <div style={{ color: '#64748b', fontSize: 12.3, lineHeight: 1.4, marginTop: 4 }}>{r.realistic.reason}</div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && <tr><td style={td} colSpan={5}>No matching resolutions.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '9px 9px' } as const
