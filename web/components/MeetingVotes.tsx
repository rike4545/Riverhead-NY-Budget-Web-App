'use client'

import { useMemo, useState } from 'react'
import type { Meeting, Resolution, Vote } from '../lib/meetings'
import { MEMBER_ORDER } from '../lib/meetings'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const VOTE_COLOR: Record<Vote, string> = { aye: '#15803d', nay: '#b91c1c', abstain: '#c99a2e', absent: '#cbd5e1' }
const VOTE_LABEL: Record<Vote, string> = { aye: 'Yes', nay: 'No', abstain: 'Abstained', absent: 'Absent' }

export default function MeetingVotes({ meeting }: { meeting: Meeting }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'contested' | 'failed'>('all')
  const query = q.trim().toLowerCase()

  const shortName = (last: string) => meeting.memberTallies[last]?.name.split(' ').slice(-1)[0] ?? last

  const filtered = useMemo(() => {
    return meeting.resolutions.filter((r) => {
      if (filter === 'contested' && r.tag === 'unanimous') return false
      if (filter === 'failed' && r.adopted) return false
      if (query && !(`${r.number ?? ''} ${r.title}`.toLowerCase().includes(query))) return false
      return true
    })
  }, [meeting.resolutions, filter, query])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Controls */}
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'contested', 'failed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
              borderColor: filter === f ? '#1f5f8f' : '#cbd5e1', background: filter === f ? '#1f5f8f' : 'white', color: filter === f ? 'white' : '#334155',
            }}>
              {f === 'all' ? `All (${meeting.stats.total})` : f === 'contested' ? `Contested (${meeting.stats.contested})` : `Failed (${meeting.stats.failed})`}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resolutions by number or topic…"
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      {/* Resolutions */}
      <section style={{ display: 'grid', gap: 10 }}>
        {filtered.map((r) => (
          <ResolutionRow key={r.seq} r={r} shortName={shortName} />
        ))}
        {filtered.length === 0 && <p style={{ color: '#64748b', padding: 12 }}>No matching resolutions.</p>}
      </section>
    </div>
  )
}

function ResolutionRow({ r, shortName }: { r: Resolution; shortName: (l: string) => string }) {
  const badge = r.tag === 'failed'
    ? { bg: '#fee2e2', fg: '#991b1b', text: 'Failed' }
    : r.tag === 'split'
      ? { bg: '#fef3c7', fg: '#92400e', text: `Passed ${r.ayesCount}–${r.naysCount}` }
      : { bg: '#dcfce7', fg: '#166534', text: 'Passed unanimously' }

  return (
    <article style={{ ...card, borderLeft: `5px solid ${r.tag === 'failed' ? '#b91c1c' : r.tag === 'split' ? '#c99a2e' : '#15803d'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'start' }}>
        <div style={{ maxWidth: 780 }}>
          {r.number && <span style={{ color: '#2563eb', fontWeight: 900, fontSize: 12 }}>{r.number}</span>}
          <div style={{ fontWeight: 700, color: '#12385b', marginTop: 2, lineHeight: 1.4 }}>{r.title}</div>
          <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 4 }}>
            Moved by {r.mover || '—'} · seconded by {r.seconder || '—'}
          </div>
        </div>
        <span style={{ background: badge.bg, color: badge.fg, fontWeight: 800, fontSize: 12.5, padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{badge.text}</span>
      </div>

      {r.tag !== 'unanimous' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {MEMBER_ORDER.map((last) => {
            const v = r.votes[last]
            return (
              <span key={last} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 10px' }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, background: VOTE_COLOR[v] }} />
                {shortName(last)}: {VOTE_LABEL[v]}
              </span>
            )
          })}
        </div>
      )}
    </article>
  )
}
