'use client'

import { useMemo, useState } from 'react'
import { useFetchJson, LoadingCard } from './useFetchJson'
import {
  meetingsIndex, meetingUrl, MEMBERS_URL,
  type Meeting, type Resolution, type Vote, type MembersData, type MemberRecord, type VotedItem,
} from '../lib/meetings'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const VOTE_COLOR: Record<Vote, string> = { aye: '#15803d', nay: '#b91c1c', abstain: '#c99a2e', absent: '#cbd5e1' }
const VOTE_LABEL: Record<Vote, string> = { aye: 'Yes', nay: 'No', abstain: 'Abstained', absent: 'Absent' }

export default function MeetingVotes() {
  const meetings = meetingsIndex.meetings
  const [view, setView] = useState<'meetings' | 'members'>('meetings')
  const [slug, setSlug] = useState(meetings[0].slug)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'contested' | 'tabled'>('all')
  const query = q.trim().toLowerCase()

  const { data: meeting, error } = useFetchJson<Meeting>(meetingUrl(slug))

  const openMeeting = (s: string) => {
    setSlug(s)
    setFilter('contested')
    setQ('')
    setView('meetings')
  }

  const filtered = useMemo(() => {
    if (!meeting) return []
    return meeting.resolutions.filter((r) => {
      if (filter === 'contested' && !(r.tag === 'split' || r.tag === 'failed' || (r.naysCount ?? 0) > 0)) return false
      if (filter === 'tabled' && r.tag !== 'tabled') return false
      if (query && !(`${r.number ?? ''} ${r.title}`.toLowerCase().includes(query))) return false
      return true
    })
  }, [meeting, filter, query])

  const shortName = (last: string) => meeting?.memberTallies[last]?.name.split(' ').slice(-1)[0] ?? last
  const rosterOrder = meeting?.roster.map((r) => r.last) ?? []

  if (view === 'members') {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <ViewToggle view={view} setView={setView} />
        <MembersPanel openMeeting={openMeeting} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ViewToggle view={view} setView={setView} />

      {/* Meeting picker */}
      <section style={{ ...card, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, color: '#334155' }}>Meeting:</span>
        <select value={slug} onChange={(e) => { setSlug(e.target.value); setFilter('all'); setQ('') }}
          style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15, fontWeight: 700, maxWidth: '100%' }}>
          {meetings.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.date} — {m.type} ({m.total} votes{m.contested ? `, ${m.contested} contested` : ''})
            </option>
          ))}
        </select>
        <span style={{ color: '#64748b', fontSize: 13 }}>
          {meetingsIndex.totals.meetings} meetings · {meetingsIndex.totals.votes.toLocaleString()} votes on record
        </span>
      </section>

      {!meeting && !error && <LoadingCard label="Loading the meeting record…" />}
      {error && <LoadingCard label="Could not load this meeting — check your connection and reload." />}

      {meeting && (
        <>
          {/* Meeting header stats */}
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{meeting.type}</div>
                <h2 style={{ margin: '4px 0' }}>{meeting.date}</h2>
                <div style={{ color: '#64748b' }}>{meeting.calledToOrder ? `Called to order at ${meeting.calledToOrder}.` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginTop: 14 }}>
              <Stat label="Items Voted" value={String(meeting.stats.total)} />
              <Stat label="Unanimous" value={String(meeting.stats.unanimous)} />
              <Stat label="Contested" value={String(meeting.stats.contested)} amber />
              <Stat label="Failed" value={String(meeting.stats.failed)} red />
              <Stat label="Tabled" value={String(meeting.stats.tabled)} />
            </div>
          </section>

          {/* Member tallies */}
          <section style={card}>
            <h3 style={{ marginTop: 0 }}>How each member voted at this meeting</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={th}>Member</th>
                    <th style={{ ...th, textAlign: 'right' }}>Yes</th>
                    <th style={{ ...th, textAlign: 'right' }}>No</th>
                    <th style={{ ...th, textAlign: 'right' }}>Abstained</th>
                    <th style={{ ...th, textAlign: 'right' }}>Absent</th>
                    <th style={{ ...th, textAlign: 'right' }}>Moved</th>
                    <th style={{ ...th, textAlign: 'right' }}>Seconded</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterOrder.map((last) => {
                    const t = meeting.memberTallies[last]
                    if (!t) return null
                    return (
                      <tr key={last} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}><strong style={{ color: '#12385b' }}>{t.name}</strong> <span style={{ color: '#94a3b8', fontSize: 12.5 }}>{t.title}</span></td>
                        <td style={{ ...td, textAlign: 'right' }}>{t.aye}</td>
                        <td style={{ ...td, textAlign: 'right', color: t.nay ? '#b91c1c' : '#94a3b8', fontWeight: t.nay ? 800 : 400 }}>{t.nay}</td>
                        <td style={{ ...td, textAlign: 'right', color: t.abstain ? '#b45309' : '#94a3b8', fontWeight: t.abstain ? 800 : 400 }}>{t.abstain}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{t.absent}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{t.moved}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{t.seconded}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Filters + search */}
          <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'contested', 'tabled'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
                  borderColor: filter === f ? '#1f5f8f' : '#cbd5e1', background: filter === f ? '#1f5f8f' : 'white', color: filter === f ? 'white' : '#334155',
                }}>
                  {f === 'all' ? `All (${meeting.stats.total})` : f === 'contested' ? `Contested (${meeting.stats.contested})` : `Tabled (${meeting.stats.tabled})`}
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resolutions by number or topic…"
              style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
          </section>

          {/* Resolutions */}
          <section style={{ display: 'grid', gap: 10 }}>
            {filtered.map((r) => (
              <ResolutionRow key={r.seq} r={r} shortName={shortName} rosterOrder={rosterOrder} />
            ))}
            {filtered.length === 0 && <p style={{ color: '#64748b', padding: 12 }}>No matching resolutions.</p>}
          </section>

          <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
            Source: {meetingsIndex.source.title} — {meeting.date}. Extracted from the official meeting minutes; the full
            text of each resolution is in the Town&apos;s minutes. &quot;Tabled&quot; items were postponed, not defeated.
            New meetings are added as the Town publishes their minutes.
          </p>
        </>
      )}
    </div>
  )
}

function ResolutionRow({ r, shortName, rosterOrder }: { r: Resolution; shortName: (l: string) => string; rosterOrder: string[] }) {
  const badge =
    r.tag === 'failed' ? { bg: '#fee2e2', fg: '#991b1b', text: 'Failed' }
    : r.tag === 'tabled' ? { bg: '#f1f5f9', fg: '#475569', text: 'Tabled' }
    : r.tag === 'split' ? { bg: '#fef3c7', fg: '#92400e', text: r.ayesCount != null && r.naysCount != null ? `Passed ${r.ayesCount}–${r.naysCount}` : 'Passed (split)' }
    : { bg: '#dcfce7', fg: '#166534', text: 'Passed unanimously' }
  const border = r.tag === 'failed' ? '#b91c1c' : r.tag === 'tabled' ? '#94a3b8' : r.tag === 'split' ? '#c99a2e' : '#15803d'
  const hasVotes = Object.keys(r.votes).length > 0

  return (
    <article style={{ ...card, borderLeft: `5px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'start' }}>
        <div style={{ maxWidth: 780 }}>
          {r.number && <span style={{ color: '#2563eb', fontWeight: 900, fontSize: 12 }}>{r.number}</span>}
          <div style={{ fontWeight: 700, color: '#12385b', marginTop: 2, lineHeight: 1.4 }}>{r.title}</div>
          <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 4 }}>
            {r.mover ? `Moved by ${r.mover}` : ''}{r.seconder ? ` · seconded by ${r.seconder}` : ''}
          </div>
        </div>
        <span style={{ background: badge.bg, color: badge.fg, fontWeight: 800, fontSize: 12.5, padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{badge.text}</span>
      </div>

      {r.tag !== 'unanimous' && hasVotes && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {rosterOrder.map((last) => {
            const v = r.votes[last]
            if (!v) return null
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

function ViewToggle({ view, setView }: { view: 'meetings' | 'members'; setView: (v: 'meetings' | 'members') => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {([['meetings', 'By meeting', 'Every vote, one meeting at a time'], ['members', 'By member', 'Each member’s career record, dissents & abstentions']] as const).map(([v, title, sub]) => (
        <button key={v} onClick={() => setView(v)} style={{
          flex: '1 1 240px', textAlign: 'left', cursor: 'pointer', borderRadius: 12, padding: '12px 16px',
          border: '1px solid', borderColor: view === v ? '#1f5f8f' : '#cbd5e1',
          background: view === v ? '#1f5f8f' : 'white', color: view === v ? 'white' : '#334155',
          boxShadow: view === v ? '0 10px 24px rgba(31,95,143,.22)' : 'none',
        }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 12.5, opacity: 0.85 }}>{sub}</div>
        </button>
      ))}
    </div>
  )
}

function MembersPanel({ openMeeting }: { openMeeting: (slug: string) => void }) {
  const { data, error } = useFetchJson<MembersData>(MEMBERS_URL)
  if (!data && !error) return <LoadingCard label="Loading member records…" />
  if (error || !data) return <LoadingCard label="Could not load member records — check your connection and reload." />

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {data.members.map((m) => (
        <MemberCard key={m.key} m={m} current={m.years.includes(data.latestYear)} openMeeting={openMeeting} />
      ))}
      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {data.source.title}. {data.note} A high &quot;votes yes&quot; share is normal — most municipal
        resolutions are routine and pass unanimously; the dissents and abstentions are where members distinguish themselves.
      </p>
    </div>
  )
}

function MemberCard({ m, current, openMeeting }: { m: MemberRecord; current: boolean; openMeeting: (slug: string) => void }) {
  const c = m.career
  return (
    <article style={{ ...card, borderLeft: `5px solid ${current ? '#1f5f8f' : '#cbd5e1'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, color: '#12385b' }}>{m.name}</h3>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            {m.titles[0] ?? 'Board member'} · on record {m.years.join(' & ')}{current ? '' : ' (former)'} · voted in {m.meetingsVoted} meetings
          </div>
        </div>
        {m.ayePct != null && (
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: 22, color: '#12385b' }}>{m.ayePct}%</strong>
            <div style={{ color: '#64748b', fontSize: 12 }}>votes yes</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <Chip label="Yes" value={c.aye ?? 0} color="#15803d" />
        <Chip label="No" value={c.nay ?? 0} color="#b91c1c" strong={(c.nay ?? 0) > 0} />
        <Chip label="Abstained" value={c.abstain ?? 0} color="#b45309" strong={(c.abstain ?? 0) > 0} />
        <Chip label="Absent" value={c.absent ?? 0} color="#64748b" />
        <Chip label="Moved" value={m.moved} color="#1f5f8f" />
        <Chip label="Seconded" value={m.seconded} color="#1f5f8f" />
      </div>

      {m.dissents.length > 0 && (
        <VotedList label={`Every “no” vote (${m.dissents.length})`} items={m.dissents} openMeeting={openMeeting} color="#b91c1c" />
      )}
      {m.abstentions.length > 0 && (
        <VotedList label={`Abstentions (${m.abstentions.length})`} items={m.abstentions} openMeeting={openMeeting} color="#b45309" />
      )}
      {m.dissents.length === 0 && m.abstentions.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 13.5, margin: '12px 0 0' }}>Never voted no or abstained in the period on record.</p>
      )}
    </article>
  )
}

function VotedList({ label, items, openMeeting, color }: { label: string; items: VotedItem[]; openMeeting: (slug: string) => void; color: string }) {
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800, color }}>{label}</summary>
      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
        {items.map((it, i) => (
          <button key={`${it.slug}-${it.number}-${i}`} onClick={() => openMeeting(it.slug)}
            title="Open this meeting's contested votes"
            style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' }}>
            <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: 12 }}>{it.date}{it.number ? ` · ${it.number}` : ''}</span>
            <span style={{ display: 'block', color: '#12385b', fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>{it.title}</span>
          </button>
        ))}
      </div>
    </details>
  )
}

function Chip({ label, value, color, strong }: { label: string; value: number; color: string; strong?: boolean }) {
  return (
    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: strong ? 900 : 700, color: strong ? color : '#334155' }}>
      <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: color, marginRight: 6 }} />
      {label}: {value.toLocaleString()}
    </span>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const

function Stat({ label, value, amber, red }: { label: string; value: string; amber?: boolean; red?: boolean }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? '#b91c1c' : amber ? '#b45309' : '#12385b' }}>{value}</strong>
    </div>
  )
}
