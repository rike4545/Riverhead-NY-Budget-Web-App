'use client'

import { useMemo, useState } from 'react'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export type EligibleEmployee = {
  name: string; title: string; union: string; program: string
  hireYear: number; yearsService: number; base: number; estIncentive: number
}

export default function BuyoutEligible({ employees }: { employees: EligibleEmployee[] }) {
  const [q, setQ] = useState('')
  const [program, setProgram] = useState<'all' | 'CSEA' | 'Police'>('all')
  const query = q.trim().toLowerCase()

  const rows = useMemo(() => employees.filter((e) => {
    if (program !== 'all' && e.program !== program) return false
    if (query && !(`${e.name} ${e.title}`.toLowerCase().includes(query))) return false
    return true
  }), [employees, program, query])

  const counts = {
    CSEA: employees.filter((e) => e.program === 'CSEA').length,
    Police: employees.filter((e) => e.program === 'Police').length,
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'CSEA', 'Police'] as const).map((p) => (
            <button key={p} onClick={() => setProgram(p)} style={{
              padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
              borderColor: program === p ? '#4a7297' : '#cbd5e1', background: program === p ? '#4a7297' : 'white', color: program === p ? 'white' : '#334155',
            }}>{p === 'all' ? `All (${employees.length})` : p === 'CSEA' ? `CSEA (${counts.CSEA})` : `Police (${counts.Police})`}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or title…"
          style={{ flex: 1, minWidth: 200, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      <section style={card}>
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{rows.length} employees</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Employee</th>
                <th style={th}>Title</th>
                <th style={th}>Program</th>
                <th style={{ ...th, textAlign: 'right' }}>Hired</th>
                <th style={{ ...th, textAlign: 'right' }}>Years of service</th>
                <th style={{ ...th, textAlign: 'right' }}>Est. incentive</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={`${e.name}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#284a69' }}>{e.name}</td>
                  <td style={td}>{e.title || '—'}</td>
                  <td style={td}>
                    <span style={{ background: e.program === 'CSEA' ? '#dcfce7' : '#dbeafe', color: e.program === 'CSEA' ? '#166534' : '#1e3a8a', fontWeight: 800, fontSize: 11.5, padding: '2px 9px', borderRadius: 999 }}>{e.program} 2026</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{e.hireYear}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{e.yearsService}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(e.estIncentive)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td style={td} colSpan={6}>No matching employees.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const
