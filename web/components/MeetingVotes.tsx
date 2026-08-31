'use client'

import { useMemo, useState } from 'react'
import { useFetchJson, LoadingCard } from './useFetchJson'
import {
  meetingsIndex, meetingUrl, MEMBERS_URL,
  type Meeting, type Resolution, type Vote, type MembersData, type MemberRecord, type VotedItem,
} from '../lib/meetings'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const VOTE_COLOR: Record<Vote, string> = { aye: 'var(--rbl-success)', nay: 'var(--rbl-danger)', abstain: 'var(--rbl-series-gold)', absent: 'var(--rbl-border-strong)' }
const VOTE_LABEL: Record<Vote, string> = { aye: 'Yes', nay: 'No', abstain: 'Abstained', absent: 'Absent' }

export default function MeetingVotes() {
  const meetings = meetingsIndex.meetings
  const [view, setView] = useState<'meetings' | 'members'>('meetings')
  // Open on the newest meeting that actually has a vote record. The two most
  // recent are often preliminary — the Clerk has published a docket but not
  // yet the votes — and landing on one made a page called Town Board Votes
  // show no votes at all. Preliminary meetings stay selectable in the list.
  const [slug, setSlug] = useState(
    (meetings.find((m) => !m.preliminary) ?? meetings[0]).slug
  )
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

  const shortName = (last: string) => meeting?.memberTallies?.[last]?.name.split(' ').slice(-1)[0] ?? last
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
        <span style={{ fontWeight: 800, color: 'var(--rbl-text-strong)' }}>Meeting:</span>
        <select value={slug} onChange={(e) => { setSlug(e.target.value); setFilter('all'); setQ('') }}
          style={{ padding: '10px 12px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 15, fontWeight: 700, maxWidth: '100%' }}>
          {meetings.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.date} — {m.type} {m.preliminary
                ? `(preliminary — ${m.docketCount ?? 0} resolutions, votes pending)`
                : `(${m.total} votes${m.contested ? `, ${m.contested} contested` : ''})`}
            </option>
          ))}
        </select>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>
          {meetingsIndex.totals.meetings} meetings · {meetingsIndex.totals.votes.toLocaleString()} votes on record
        </span>
      </section>

      {!meeting && !error && <LoadingCard label="Loading the meeting record…" />}
      {error && <LoadingCard label="Could not load this meeting — check your connection and reload." />}

      {meeting && meeting.preliminary && <PreliminaryPanel meeting={meeting} />}

      {meeting && !meeting.preliminary && (
        <>
          {/* Meeting header stats */}
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'start' }}>
              <div>
                <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{meeting.type}</div>
                <h2 style={{ margin: '4px 0' }}>{meeting.date}</h2>
                <div style={{ color: 'var(--rbl-text-muted)' }}>{meeting.calledToOrder ? `Called to order at ${meeting.calledToOrder}.` : ''}</div>
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
                  <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
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
                    const t = meeting.memberTallies?.[last]
                    if (!t) return null
                    const party = meeting.roster.find((r) => r.last === last)?.party ?? null
                    return (
                      <tr key={last} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                        <td style={td}>
                          <strong style={{ color: 'var(--rbl-title)' }}>{t.name}</strong>{' '}
                          <PartyChip party={party} small />{' '}
                          <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{t.title}</span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>{t.aye}</td>
                        <td style={{ ...td, textAlign: 'right', color: t.nay ? 'var(--rbl-danger)' : 'var(--rbl-text-muted)', fontWeight: t.nay ? 800 : 400 }}>{t.nay}</td>
                        <td style={{ ...td, textAlign: 'right', color: t.abstain ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)', fontWeight: t.abstain ? 800 : 400 }}>{t.abstain}</td>
                        <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{t.absent}</td>
                        <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{t.moved}</td>
                        <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{t.seconded}</td>
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
                  borderColor: filter === f ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: filter === f ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: filter === f ? 'white' : 'var(--rbl-text-strong)',
                }}>
                  {f === 'all' ? `All (${meeting.stats.total})` : f === 'contested' ? `Contested (${meeting.stats.contested})` : `Tabled (${meeting.stats.tabled})`}
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resolutions by number or topic…"
              style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 15 }} />
          </section>

          {/* Resolutions */}
          <section style={{ display: 'grid', gap: 10 }}>
            {filtered.map((r) => (
              <ResolutionRow key={r.seq} r={r} shortName={shortName} rosterOrder={rosterOrder} />
            ))}
            {filtered.length === 0 && <p style={{ color: 'var(--rbl-text-muted)', padding: 12 }}>No matching resolutions.</p>}
          </section>

          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
            Source: {meetingsIndex.source.title} — {meeting.date}. Extracted from the official meeting minutes; the full
            text of each resolution is in the Town&apos;s minutes. &quot;Tabled&quot; items were postponed, not defeated.
            New meetings are added as the Town publishes their minutes.
          </p>
        </>
      )}
    </div>
  )
}

function PreliminaryPanel({ meeting }: { meeting: Meeting }) {
  const docket = meeting.docket ?? []
  return (
    <>
      <section style={card}>
        <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{meeting.type}</div>
        <h2 style={{ margin: '4px 0' }}>{meeting.date}</h2>
        <div style={{ color: 'var(--rbl-text-muted)' }}>{meeting.calledToOrder ? `Called to order at ${meeting.calledToOrder}.` : ''}</div>
      </section>

      <section style={{ ...card, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-warn)' }}>
        <div style={{ color: 'var(--rbl-warn-strong)', fontWeight: 900, fontSize: 15, marginBottom: 6 }}>
          Vote results not posted yet
        </div>
        <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The Town Clerk has published this meeting&apos;s preliminary minutes — the {docket.length} resolutions on
          the docket are listed below — but the roll-call vote results are usually posted a few days later in a
          revised set of minutes. This page will fill in each member&apos;s vote automatically once the Town posts them.
        </p>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Resolutions on the docket ({docket.length})</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {docket.map((d) => (
            <div key={d.number + d.seq} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
              <span style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12 }}>{d.number}</span>
              <div style={{ fontWeight: 600, color: 'var(--rbl-title)', marginTop: 2, lineHeight: 1.4, fontSize: 14 }}>{d.title}</div>
            </div>
          ))}
          {docket.length === 0 && <p style={{ color: 'var(--rbl-text-muted)' }}>No resolutions were listed in the preliminary minutes.</p>}
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 14 }}>
          Source: {meetingsIndex.source.title} — {meeting.date} (preliminary minutes). Resolution numbers and titles are
          the Town&apos;s own; vote outcomes are pending the revised minutes.
        </p>
      </section>
    </>
  )
}

function ResolutionRow({ r, shortName, rosterOrder }: { r: Resolution; shortName: (l: string) => string; rosterOrder: string[] }) {
  const badge =
    r.tag === 'failed' ? { bg: 'var(--rbl-danger-bg)', fg: 'var(--rbl-danger-strong)', text: 'Failed' }
    : r.tag === 'tabled' ? { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-body)', text: 'Tabled' }
    : r.tag === 'split' ? { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn)', text: r.ayesCount != null && r.naysCount != null ? `Passed ${r.ayesCount}–${r.naysCount}` : 'Passed (split)' }
    : { bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)', text: 'Passed unanimously' }
  const border = r.tag === 'failed' ? 'var(--rbl-danger)' : r.tag === 'tabled' ? 'var(--rbl-text-muted)' : r.tag === 'split' ? 'var(--rbl-series-gold)' : 'var(--rbl-success)'
  const hasVotes = Object.keys(r.votes).length > 0

  return (
    <article style={{ ...card, borderLeft: `5px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'start' }}>
        <div style={{ maxWidth: 780 }}>
          {r.number && <span style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12 }}>{r.number}</span>}
          <div style={{ fontWeight: 700, color: 'var(--rbl-title)', marginTop: 2, lineHeight: 1.4 }}>{r.title}</div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 4 }}>
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
              <span key={last} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--rbl-text-strong)', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '4px 10px' }}>
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
          border: '1px solid', borderColor: view === v ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)',
          background: view === v ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: view === v ? 'white' : 'var(--rbl-text-strong)',
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
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
        Source: {data.source.title}. {data.note} {data.partySource} A high &quot;votes yes&quot; share is normal — most municipal
        resolutions are routine and pass unanimously; the dissents and abstentions are where members distinguish themselves.
      </p>
    </div>
  )
}

function MemberCard({ m, current, openMeeting }: { m: MemberRecord; current: boolean; openMeeting: (slug: string) => void }) {
  const c = m.career
  return (
    <article style={{ ...card, borderLeft: `5px solid ${current ? partyColor(m.party) : 'var(--rbl-border-strong)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 20, color: 'var(--rbl-title)' }}>{m.name}</h3>
            <PartyChip party={m.party} />
            {!current && <span style={{ background: 'var(--rbl-surface-3)', color: 'var(--rbl-text-body)', fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>Former member</span>}
          </div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 2 }}>
            {m.titles[0] ?? 'Board member'} · on record {m.years.join(' & ')} · voted in {m.meetingsVoted} meetings
          </div>
        </div>
        {m.ayePct != null && (
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: 22, color: 'var(--rbl-title)' }}>{m.ayePct}%</strong>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>votes yes</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <Chip label="Yes" value={c.aye ?? 0} color="var(--rbl-success)" />
        <Chip label="No" value={c.nay ?? 0} color="var(--rbl-danger)" strong={(c.nay ?? 0) > 0} />
        <Chip label="Abstained" value={c.abstain ?? 0} color="#b45309" strong={(c.abstain ?? 0) > 0} />
        <Chip label="Absent" value={c.absent ?? 0} color="var(--rbl-series-slate)" />
        <Chip label="Moved" value={m.moved} color="var(--rbl-series-blue)" />
        <Chip label="Seconded" value={m.seconded} color="var(--rbl-series-blue)" />
      </div>

      {m.dissents.length > 0 && (
        <VotedList label={`Every “no” vote (${m.dissents.length})`} items={m.dissents} openMeeting={openMeeting} color="var(--rbl-danger)" />
      )}
      {m.abstentions.length > 0 && (
        <VotedList label={`Abstentions (${m.abstentions.length})`} items={m.abstentions} openMeeting={openMeeting} color="#b45309" />
      )}
      {m.dissents.length === 0 && m.abstentions.length === 0 && (
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '12px 0 0' }}>Never voted no or abstained in the period on record.</p>
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
            style={{ textAlign: 'left', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' }}>
            <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800, fontSize: 12 }}>{it.date}{it.number ? ` · ${it.number}` : ''}</span>
            <span style={{ display: 'block', color: 'var(--rbl-title)', fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>{it.title}</span>
          </button>
        ))}
      </div>
    </details>
  )
}

function Chip({ label, value, color, strong }: { label: string; value: number; color: string; strong?: boolean }) {
  return (
    <span style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: strong ? 900 : 700, color: strong ? color : 'var(--rbl-text-strong)' }}>
      <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: color, marginRight: 6 }} />
      {label}: {value.toLocaleString()}
    </span>
  )
}

function partyColor(party: string | null) {
  return party === 'Democrat' ? '#1d4ed8' : party === 'Republican' ? 'var(--rbl-danger)' : 'var(--rbl-series-slate)'
}

function PartyChip({ party, small }: { party: string | null; small?: boolean }) {
  if (!party) return null
  const c = partyColor(party)
  const label = small ? party[0] : party
  return (
    <span title={party} style={{
      display: 'inline-block', background: party === 'Democrat' ? 'var(--rbl-info-bg)' : 'var(--rbl-danger-bg)', color: c,
      fontWeight: 800, fontSize: small ? 10.5 : 12, padding: small ? '1px 7px' : '2px 9px', borderRadius: 999,
      verticalAlign: 'middle', letterSpacing: 0.3,
    }}>{label}</span>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const

function Stat({ label, value, amber, red }: { label: string; value: string; amber?: boolean; red?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? 'var(--rbl-danger)' : amber ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
