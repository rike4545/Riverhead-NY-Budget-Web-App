'use client'

import { useState } from 'react'
import { fetchEmployeeDonorMatches, type EmployeeDonorMatch } from '../lib/employee-donors'
import type { CampaignOfficial } from '../lib/campaign-finance'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const th = { padding: '8px 10px', fontWeight: 800, fontSize: 12 } as const
const td = { padding: '8px 10px' } as const

export default function EmployeeDonorWatch({ officials, startYear, endYear }: { officials: CampaignOfficial[]; startYear: number; endYear: number }) {
  const [matches, setMatches] = useState<EmployeeDonorMatch[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function check() {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const result = await fetchEmployeeDonorMatches(officials, startYear, endYear)
      setMatches(result)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Check failed.')
    }
  }

  const total = matches?.reduce((s, m) => s + m.amount, 0) ?? 0
  const distinctEmployees = matches ? new Set(matches.map((m) => m.employeeName)).size : 0

  const byYear = new Map<string, EmployeeDonorMatch[]>()
  for (const m of matches ?? []) {
    const key = m.electionYear || 'Unlabeled year'
    const list = byYear.get(key)
    if (list) list.push(m)
    else byYear.set(key, [m])
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#284a69' }}>Town Employee Donors</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13, maxWidth: 560, lineHeight: 1.5 }}>
            Cross-references Town payroll employees against individual campaign donors to the committees above. Matched by
            name only — this is disclosure context, not an accusation. Modest personal donations from Town employees to
            sitting or former officials are common and legal.
          </p>
        </div>
        <button
          onClick={check}
          disabled={status === 'loading'}
          style={{
            background: status === 'loading' ? '#93c5fd' : '#4a7297', color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 16px', fontWeight: 800, cursor: status === 'loading' ? 'default' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Checking…' : 'Check for employee donors'}
        </button>
      </div>

      {status === 'error' && (
        <div style={{ marginTop: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, fontSize: 13 }}>
          Check failed: {errorMessage}
        </div>
      )}

      {matches && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14 }}>
            <Stat label="Matched contributions" value={matches.length.toLocaleString()} />
            <Stat label="Distinct employees" value={distinctEmployees.toLocaleString()} />
            <Stat label="Total matched dollars" value={usd(total)} />
          </div>

          {matches.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>No name matches found between payroll and campaign donors in this window.</div>
          ) : (
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              {years.map((year) => {
                const yearMatches = byYear.get(year)!
                const yearTotal = yearMatches.reduce((s, m) => s + m.amount, 0)
                const yearDistinctEmployees = new Set(yearMatches.map((m) => m.employeeName)).size
                return (
                  <details key={year} open={years.length === 1}>
                    <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <strong style={{ color: '#284a69' }}>{year}</strong>
                      <span style={{ color: '#64748b', fontSize: 12.5 }}>
                        {yearMatches.length} {yearMatches.length === 1 ? 'contribution' : 'contributions'} · {yearDistinctEmployees} employee{yearDistinctEmployees === 1 ? '' : 's'} ·{' '}
                        <strong style={{ color: '#9b6b12' }}>{usd(yearTotal)}</strong>
                      </span>
                    </summary>
                    <div style={{ overflowX: 'auto', marginTop: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={th}>Employee</th>
                            <th style={th}>Donated to</th>
                            <th style={th}>Filing</th>
                            <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                            <th style={th}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearMatches.map((m, i) => (
                            <tr key={`${m.employeeName}-${m.officialName}-${m.electionYear}-${m.filingDesc}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ ...td, fontWeight: 700, color: '#284a69' }}>
                                {m.employeeName}
                                {(m.department || m.title) && (
                                  <div style={{ fontWeight: 500, color: '#6b7280', fontSize: 11.5 }}>
                                    {[m.title, m.department].filter(Boolean).join(', ')} ({m.mostRecentPayrollYear})
                                  </div>
                                )}
                              </td>
                              <td style={td}>{m.officialName}<div style={{ color: '#6b7280', fontSize: 11.5 }}>{m.committeeName}</div></td>
                              <td style={td}>{m.electionYear} {m.filingDesc}</td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(m.amount)}</td>
                              <td style={td}>{m.date ? m.date.slice(0, 10) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: '#284a69' }}>{value}</div>
    </div>
  )
}
