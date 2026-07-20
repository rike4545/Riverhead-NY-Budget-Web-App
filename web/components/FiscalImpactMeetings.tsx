'use client'

import { useState } from 'react'
import FiscalImpactTable, { type FiscalResolution } from './FiscalImpactTable'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export type FiscalMeeting = {
  slug: string
  meetingDate: string
  source: { title: string; url: string }
  method: string
  summary: {
    total: number
    markedNo: number
    markedYes: number
    understated: number
    understatedMarkedNo: number
    identifiedDollarsAtStake: number
    largestUnderstatedMarkedNo: [number, string, string] | null
  }
  resolutions: FiscalResolution[]
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function FiscalImpactMeetings({ meetings }: { meetings: FiscalMeeting[] }) {
  const [date, setDate] = useState(meetings[0]?.meetingDate ?? '')
  const m = meetings.find((x) => x.meetingDate === date) ?? meetings[0]
  if (!m) return null
  const s = m.summary
  const corrections = m.resolutions.filter((r) => r.realistic.flag === 'understated' && r.townFiscalImpact === 'No')
  const lu = s.largestUnderstatedMarkedNo

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label htmlFor="meeting" style={{ fontWeight: 800, color: '#284a69' }}>Meeting:</label>
        <select
          id="meeting"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15, fontWeight: 700, color: '#284a69' }}
        >
          {meetings.map((x) => (
            <option key={x.meetingDate} value={x.meetingDate}>{fmtDate(x.meetingDate)}</option>
          ))}
        </select>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        <Stat label="Resolutions" value={String(s.total)} sub={`on ${fmtDate(m.meetingDate)}`} />
        <Stat label="Marked “no fiscal impact”" value={String(s.markedNo)} sub={`of ${s.total}`} />
        <Stat label="…that plainly move money" value={String(s.understatedMarkedNo)} sub="the clearest corrections" accent />
        {s.identifiedDollarsAtStake > 0 && (
          <Stat label="Identified dollars in play" value={usd(s.identifiedDollarsAtStake)} sub="cost items we could price" />
        )}
      </section>

      {lu && (
        <section style={{ ...card, borderLeft: '6px solid #dc2626' }}>
          <h3 style={{ marginTop: 0 }}>The clearest example</h3>
          <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Resolution <strong>{lu[1]}</strong> — “{lu[2]}” — carries a fiscal-impact statement checked{' '}
            <strong>“No,”</strong> yet commits <strong style={{ color: '#b91c1c' }}>{usd(lu[0])}</strong>. A six-figure
            action is exactly the kind of item a fiscal-impact statement exists to flag.
          </p>
        </section>
      )}

      {corrections.length > 0 && (
        <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
          Of the <strong>{s.total}</strong> resolutions, the Town marked <strong>{s.markedNo}</strong> as having{' '}
          <strong>no fiscal impact</strong> — yet at least <strong>{corrections.length}</strong> of those commit or
          change real money on a realistic read.
        </p>
      )}

      <FiscalImpactTable resolutions={m.resolutions} />

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {m.source.title}. {m.method} This is an independent read, not the Town’s official position — verify
        against the agenda packet.
      </p>
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#fee2e2' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: accent ? '#991b1b' : '#284a69' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
