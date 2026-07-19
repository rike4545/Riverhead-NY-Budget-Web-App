import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import MeetingVotes from '../../components/MeetingVotes'
import { meetingsIndex } from '../../lib/meetings'
import consentCalendar from '../../public/data/consent-calendar.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

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

        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 12, marginBottom: 0 }}>Sources: {consentCalendar.sources.join(' · ')}</p>
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
