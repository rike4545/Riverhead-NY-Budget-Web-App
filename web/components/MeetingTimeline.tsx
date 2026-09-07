'use client'

import { useEffect, useMemo, useState } from 'react'
import { meetingsIndex } from '../lib/meetings'
import scheduleJson from '../public/data/meetings/upcoming.json'

type TimelineMeeting = {
  slug: string
  date: string
  startDateTime: string
  type: string
  agendaPublished: boolean
  docket: { seq: number; number: string; title: string }[]
  hearings: string[]
}

type TimelineData = {
  generatedAt: string
  source: { title: string; url: string }
  recent?: TimelineMeeting[]
  meetings: TimelineMeeting[]
}

const schedule = scheduleJson as TimelineData
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const SEPT_1_VIDEO = 'https://videoplayer.telvue.com/player/BjiipOg61Ac-YpNM5RFZy8f49fIMR7Kq/playlists/10577/media/1043676'
const SEPT_1_EVENT = 'https://townofriverheadny.gov/Calendar.aspx?EID=1374'

function formatMeeting(iso: string) {
  const [d, t = ''] = iso.split('T')
  const day = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
  const m = t.match(/^(\d{2}):(\d{2})/)
  if (!m) return day
  let h = Number(m[1]); const min = m[2]; const suffix = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${day} · ${h}:${min} ${suffix}`
}

// Compare CivicClerk's Riverhead-local clock values against the current time in
// America/New_York without applying the misleading trailing-Z timezone shift.
function eventKey(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return Number.POSITIVE_INFINITY
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
}

function newYorkNowKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'))
}

function uniqueMeetings(rows: TimelineMeeting[]) {
  const seen = new Set<string>()
  return rows.filter((m) => !seen.has(m.slug) && !!seen.add(m.slug))
}

export default function MeetingTimeline() {
  const initialRecent = schedule.recent ?? []
  const [recent, setRecent] = useState(initialRecent)
  const [future, setFuture] = useState(schedule.meetings)

  useEffect(() => {
    const now = newYorkNowKey()
    const all = uniqueMeetings([...initialRecent, ...schedule.meetings]).sort((a, b) => eventKey(a.startDateTime) - eventKey(b.startDateTime))
    setRecent(all.filter((m) => eventKey(m.startDateTime) < now).reverse().slice(0, 6))
    setFuture(all.filter((m) => eventKey(m.startDateTime) >= now))
  }, [])

  const recorded = useMemo(() => new Set(meetingsIndex.meetings.map((m) => m.slug)), [])
  const pendingCompleted = recent.find((m) => !recorded.has(m.slug))
  const newestRecorded = meetingsIndex.meetings[0]
  const next = future[0]
  const later = future.slice(1, 5)

  return (
    <section aria-label="Meeting timeline" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: .8, textTransform: 'uppercase' }}>Meeting timeline</div>
          <h2 style={{ margin: '3px 0 0', color: 'var(--rbl-title)', fontSize: 23 }}>What just happened — and what comes next</h2>
        </div>
        <a href={schedule.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none' }}>Official meeting portal ↗</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 12 }}>
        {pendingCompleted ? (
          <article style={{ ...card, borderLeft: '5px solid var(--rbl-warn)' }}>
            <div style={{ color: 'var(--rbl-warn-strong)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .5 }}>Latest meeting · completed</div>
            <h3 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)', fontSize: 20 }}>{formatMeeting(pendingCompleted.startDateTime)}</h3>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              The meeting has ended. Its per-member vote record will move into the archive as soon as the Town Clerk&apos;s vote-bearing minutes are available and parsed.
            </p>
            {pendingCompleted.hearings.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase' }}>Public hearings held</div>
                <ul style={{ margin: '5px 0 0', paddingLeft: 18, color: 'var(--rbl-text-strong)', fontSize: 13, lineHeight: 1.45 }}>
                  {pendingCompleted.hearings.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {pendingCompleted.slug === '2026-09-01' && <a href={SEPT_1_VIDEO} target="_blank" rel="noreferrer" style={link}>Watch official recording ↗</a>}
              {pendingCompleted.slug === '2026-09-01' && <a href={SEPT_1_EVENT} target="_blank" rel="noreferrer" style={link}>Town meeting page ↗</a>}
            </div>
          </article>
        ) : newestRecorded ? (
          <article style={{ ...card, borderLeft: '5px solid var(--rbl-accent-border)' }}>
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .5 }}>Latest vote record</div>
            <h3 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)', fontSize: 20 }}>{newestRecorded.date}</h3>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, margin: 0 }}>{newestRecorded.preliminary ? 'Docket posted; detailed votes are still pending.' : `${newestRecorded.total} recorded vote${newestRecorded.total === 1 ? '' : 's'}${newestRecorded.contested ? ` · ${newestRecorded.contested} contested` : ''}.`}</p>
            <a href={`${base}/meetings/?meeting=${newestRecorded.slug}`} style={{ ...link, display: 'inline-block', marginTop: 12 }}>Open this meeting →</a>
          </article>
        ) : null}

        {next && (
          <article style={{ ...card, borderLeft: '5px solid var(--rbl-success)' }}>
            <div style={{ color: 'var(--rbl-success-strong)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .5 }}>Next Town Board meeting</div>
            <h3 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)', fontSize: 20 }}>{formatMeeting(next.startDateTime)}</h3>
            {next.hearings.length > 0 ? (
              <div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase' }}>Scheduled public hearings</div>
                <ul style={{ margin: '5px 0 0', paddingLeft: 18, color: 'var(--rbl-text-strong)', fontSize: 13, lineHeight: 1.45 }}>
                  {next.hearings.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            ) : (
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>Agenda details will appear here when the Town publishes them.</p>
            )}
            {next.agendaPublished && next.docket.length > 0 && <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13, marginBottom: 0 }}><strong>{next.docket.length}</strong> resolutions are currently indexed on the docket.</p>}
          </article>
        )}
      </div>

      {later.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9, alignItems: 'center' }}>
          <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase' }}>Later</span>
          {later.map((m) => <span key={m.slug} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '5px 10px', color: 'var(--rbl-text-muted)', fontSize: 12 }}>{formatMeeting(m.startDateTime)}</span>)}
        </div>
      )}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, margin: '8px 0 0' }}>Schedule checked {schedule.generatedAt}. A completed meeting and a published vote record are separate states; the site does not infer official votes before the Clerk&apos;s record is available.</p>
    </section>
  )
}

const link = { color: 'var(--rbl-link)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none' } as const
