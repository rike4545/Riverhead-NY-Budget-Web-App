import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import MeetingVotes from '../../components/MeetingVotes'
import { meetingsIndex } from '../../lib/meetings'
import consentCalendar from '../../public/data/consent-calendar.json'
import upcoming from '../../public/data/meetings/upcoming.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

type UpcomingMeeting = {
  date: string; startDateTime: string; type: string; agendaPublished: boolean
  docket: { seq: number; number: string; title: string }[]; hearings: string[]
}

// Format "2026-08-04T14:00:00Z" as "Tuesday, August 4, 2026 · 2:00 PM" using the
// clock time as written (no timezone conversion — these are local meeting times).
function formatMeeting(iso: string): string {
  const [d, t = ''] = iso.split('T')
  const day = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const m = t.match(/^(\d{2}):(\d{2})/)
  if (!m) return day
  let h = parseInt(m[1], 10); const min = m[2]; const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${day} · ${h}:${min} ${ampm}`
}

export const metadata = {
  title: 'Town Board Votes — who voted for what',
  description:
    'The Riverhead Town Board voting record across every meeting: each resolution, its result, who moved and seconded it, and how each member voted — with contested, failed, and tabled votes highlighted.',
}

export default function MeetingsPage() {
  const t = meetingsIndex.totals
  const newest = meetingsIndex.meetings[0]
  const oldest = meetingsIndex.meetings[meetingsIndex.meetings.length - 1]

  return (
    <PageShell
      title="Town Board Votes"
      subtitle={`How the Town Board voted, resolution by resolution — ${t.votes.toLocaleString()} votes across ${t.meetings} meetings from ${oldest.date} through ${newest.date}, with every contested, failed, and tabled item flagged.`}
    >
      <PlainCallout
        tips={[
          { label: 'Pick a meeting', text: 'use the dropdown to open any meeting on record; each shows its votes, who moved and seconded, and per-member tallies.' },
          { label: 'Most votes are unanimous', text: 'so the interesting ones are "contested" (someone voted no or abstained) — use the filter to jump straight to them.' },
          { label: '"Tabled"', text: 'means the Board postponed the item without deciding it — it neither passed nor failed.' },
        ]}
      >
        This page is the Town Board&apos;s <strong>voting record</strong>. It shows exactly what the Board decided at each
        meeting and where members disagreed — a plain-language accountability record.
      </PlainCallout>

      {/* Coming up — the forward-looking companion to the voting record. */}
      {(() => {
        const meetings = (upcoming.meetings as UpcomingMeeting[]) ?? []
        if (meetings.length === 0) return null
        const [next, ...rest] = meetings
        return (
          <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid #15803d', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, color: '#14532d' }}>Coming up</h2>
              <span style={{ color: '#166534', fontWeight: 700, fontSize: 13 }}>show up before the vote, not after</span>
            </div>

            <div style={{ marginTop: 12, background: 'white', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ color: '#166534', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>Next meeting</div>
              <div style={{ color: '#14532d', fontWeight: 900, fontSize: 19, margin: '2px 0 4px' }}>{formatMeeting(next.startDateTime)}</div>
              {next.hearings.length > 0 && (
                <div style={{ color: '#334155', fontSize: 13.5, marginBottom: 6 }}>
                  <strong>Public hearings:</strong> {next.hearings.join(' · ')}
                </div>
              )}
              {next.agendaPublished && next.docket.length > 0 ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ color: '#166534', fontWeight: 800, fontSize: 13 }}>{next.docket.length} resolutions on the docket:</div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#334155', fontSize: 13.5, lineHeight: 1.5, display: 'grid', gap: 3 }}>
                    {next.docket.slice(0, 12).map((r) => (
                      <li key={r.number}><span style={{ color: '#2563eb', fontWeight: 800 }}>{r.number}</span> {r.title}</li>
                    ))}
                    {next.docket.length > 12 && <li style={{ color: '#64748b' }}>…and {next.docket.length - 12} more</li>}
                  </ul>
                </div>
              ) : (
                <div style={{ color: '#475569', fontSize: 13.5 }}>
                  The agenda for this meeting hasn&apos;t been posted yet — the Town usually publishes it a few days
                  beforehand. The resolutions on the docket and any public hearings will appear here automatically once it does.
                </div>
              )}
              <a href="https://www.townofriverheadny.gov/129/Agendas-Minutes" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, color: '#15803d', fontWeight: 800, fontSize: 13.5 }}>
                Official agendas &amp; meeting info ↗
              </a>
            </div>

            {rest.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#166534', fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>Also scheduled</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {rest.slice(0, 8).map((m) => (
                    <span key={m.startDateTime} style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 700, color: '#14532d' }}>
                      {formatMeeting(m.startDateTime)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Schedule from the Town&apos;s CivicClerk portal, refreshed weekly. Times are as posted.
            </p>
          </section>
        )
      })()}

      {/* Archive totals */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Meetings on Record" value={String(t.meetings)} />
        <Stat label="Total Votes" value={t.votes.toLocaleString()} accent />
        <Stat label="Contested" value={String(t.contested)} amber />
        <Stat label="Failed" value={String(t.failed)} red />
        <Stat label="Tabled" value={String(t.tabled)} />
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid #7c3aed' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>{consentCalendar.title}</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{consentCalendar.intro}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, margin: '4px 0 14px' }}>
          <Stat label="Resolutions unanimous" value={`${consentCalendar.riverheadPattern.unanimousPct}%`} accent />
          <Stat label="Total resolutions" value={consentCalendar.riverheadPattern.totalResolutions.toLocaleString()} />
          <Stat label="Meetings with a mover rotation" value={`${consentCalendar.riverheadPattern.rotationMeetingsPct}%`} amber />
        </div>

        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6 }}>{consentCalendar.riverheadPattern.rotationFinding}</p>

        <div style={{ display: 'grid', gap: 10, margin: '14px 0' }}>
          {consentCalendar.whatMakesItEffective.map((item) => (
            <div key={item.title} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 14px' }}>
              <strong style={{ color: '#284a69', fontSize: 14.5 }}>{item.title}</strong>
              <div style={{ color: '#475569', fontSize: 13.8, lineHeight: 1.5, marginTop: 3 }}>{item.text}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: '#6b21a8' }}>The verdict:</strong>{' '}
          <span style={{ color: '#4c1d55', fontSize: 14.5, lineHeight: 1.55 }}>{consentCalendar.verdict}</span>
        </div>

        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 12, marginBottom: 0 }}>Sources: {consentCalendar.sources.join(' · ')}</p>
      </section>

      <section style={{ ...card, marginBottom: 18, background: '#eef6ff', border: '1px solid #bcd9f5' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>New: what each resolution actually costs</h3>
        <p style={{ color: '#1f3a52', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          A vote tells you <em>whether</em> the Board acted; it doesn&apos;t tell you the price. Our{' '}
          <a href={`${base}/fiscal-impact/`} style={{ color: '#4a7297', fontWeight: 800 }}>Fiscal Impact, corrected</a>{' '}
          page takes the Town&apos;s own “Fiscal Impact Statement” for every July 7 resolution and flags where it marks
          “no fiscal impact” on items that plainly move money — a $227,683 well closure, three union stipulations, new
          recurring salaries, and more.
        </p>
      </section>

      <MeetingVotes />
    </PageShell>
  )
}

function Stat({ label, value, accent, amber, red }: { label: string; value: string; accent?: boolean; amber?: boolean; red?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? '#b91c1c' : amber ? '#b45309' : '#284a69' }}>{value}</strong>
    </div>
  )
}
