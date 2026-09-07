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
  itemsSource?: 'published-agenda' | 'official-calendar' | 'published-agenda+official-calendar' | null
  docket: { seq: number; number: string; title: string }[]
  hearings: string[]
}

type TimelineData = {
  generatedAt: string
  source: { title: string; url: string }
  scheduleSource?: { title: string; url: string }
  officialScheduleDates?: string[]
  recent?: TimelineMeeting[]
  meetings: TimelineMeeting[]
}

const schedule = scheduleJson as TimelineData
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const SEPT_1_VIDEO = 'https://videoplayer.telvue.com/player/BjiipOg61Ac-YpNM5RFZy8f49fIMR7Kq/playlists/10577/media/1043676'
const SEPT_1_EVENT = 'https://townofriverheadny.gov/Calendar.aspx?EID=1374'
const PENDING_GRACE_DAYS = 7

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

function daysSince(slug: string, nowKey: number) {
  const m = slug.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return 0
  const meetingDay = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Math.floor((nowKey - meetingDay) / 86_400_000)
}

function uniqueMeetings(rows: TimelineMeeting[]) {
  const seen = new Set<string>()
  return rows.filter((m) => !seen.has(m.slug) && !!seen.add(m.slug))
}

function itemSourceLabel(source: TimelineMeeting['itemsSource']) {
  if (source === 'published-agenda+official-calendar') return 'Published agenda + official hearing notices'
  if (source === 'published-agenda') return 'Published Town agenda'
  if (source === 'official-calendar') return 'Official Town hearing notices'
  return null
}

export default function MeetingTimeline() {
  const initialRecent = schedule.recent ?? []
  const [recent, setRecent] = useState(initialRecent)
  const [future, setFuture] = useState(schedule.meetings)
  const [nowKey, setNowKey] = useState(0)

  useEffect(() => {
    const now = newYorkNowKey()
    setNowKey(now)
    const all = uniqueMeetings([...initialRecent, ...schedule.meetings]).sort((a, b) => eventKey(a.startDateTime) - eventKey(b.startDateTime))
    setRecent(all.filter((m) => eventKey(m.startDateTime) < now).reverse().slice(0, 6))
    setFuture(all.filter((m) => eventKey(m.startDateTime) >= now))
  }, [])

  const recorded = useMemo(() => new Set(meetingsIndex.meetings.map((m) => m.slug)), [])
  const pendingCompleted = recent.find((m) => !recorded.has(m.slug))
  const newestRecorded = meetingsIndex.meetings[0]
  const newestRecordedIsOldOmission = Boolean(newestRecorded?.preliminary && nowKey && daysSince(newestRecorded.slug, nowKey) > PENDING_GRACE_DAYS)
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
              The meeting has ended. The site has not yet received an official source that states the individual vote results. It will not infer those votes from the agenda, resolution titles, or video.
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
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .5 }}>Latest meeting record</div>
            <h3 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)', fontSize: 20 }}>{newestRecorded.date}</h3>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, margin: 0 }}>
              {newestRecorded.preliminary
                ? newestRecordedIsOldOmission
                  ? 'Official minutes are published, but they omit individual vote results. The resolutions are listed; the site does not label their outcomes without an official vote source.'
                  : 'Official minutes/docket are published; an individual vote record is not yet available.'
                : `${newestRecorded.total} recorded vote${newestRecorded.total === 1 ? '' : 's'}${newestRecorded.contested ? ` · ${newestRecorded.contested} contested` : ''}.`}
            </p>
            <a href={`${base}/meetings/?meeting=${newestRecorded.slug}`} style={{ ...link, display: 'inline-block', marginTop: 12 }}>Open this meeting →</a>
          </article>
        ) : null}

        {next && (
          <article style={{ ...card, borderLeft: '5px solid var(--rbl-success)' }}>
            <div style={{ color: 'var(--rbl-success-strong)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .5 }}>Next Town Board meeting</div>
            <h3 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)', fontSize: 20 }}>{formatMeeting(next.startDateTime)}</h3>

            {next.hearings.length > 0 && (
              <div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase' }}>Officially noticed public hearings</div>
                <ul style={{ margin: '5px 0 0', paddingLeft: 18, color: 'var(--rbl-text-strong)', fontSize: 13, lineHeight: 1.45 }}>
                  {next.hearings.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            )}

            {next.docket.length > 0 && (
              <details style={{ marginTop: 11 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--rbl-title)', fontWeight: 900, fontSize: 13 }}>
                  {next.docket.length} published resolution item{next.docket.length === 1 ? '' : 's'}
                </summary>
                <ol style={{ margin: '7px 0 0', paddingLeft: 22, color: 'var(--rbl-text-strong)', fontSize: 12.5, lineHeight: 1.45 }}>
                  {next.docket.map((d) => <li key={d.number}><strong>{d.number}</strong> — {d.title}</li>)}
                </ol>
              </details>
            )}

            {next.hearings.length === 0 && next.docket.length === 0 && (
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                No agenda items are currently published in the indexed Town sources. The site does not fill this space with inferred or expected items.
              </p>
            )}

            {itemSourceLabel(next.itemsSource) && (
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 10 }}>
                Item source: {itemSourceLabel(next.itemsSource)}.
              </div>
            )}
          </article>
        )}
      </div>

      {later.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9, alignItems: 'center' }}>
          <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase' }}>Later official dates</span>
          {later.map((m) => {
            const itemCount = m.docket.length + m.hearings.length
            return <span key={m.slug} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '5px 10px', color: 'var(--rbl-text-muted)', fontSize: 12 }}>{formatMeeting(m.startDateTime)}{itemCount ? ` · ${itemCount} published item${itemCount === 1 ? '' : 's'}` : ''}</span>
          })}
        </div>
      )}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, margin: '8px 0 0' }}>
        Schedule checked {schedule.generatedAt}. A completed meeting, published minutes, and a published individual vote record are separate states. Regular meeting dates are reconciled to the Town&apos;s published Board schedule. Listed items come only from a published agenda/agenda packet or an official Town public-hearing notice; the site does not infer agenda items.
        {schedule.scheduleSource?.url && <> <a href={schedule.scheduleSource.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, textDecoration: 'none' }}>Official schedule ↗</a></>}
      </p>
    </section>
  )
}

const link = { color: 'var(--rbl-link)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none' } as const
