import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import MeetingVotes from '../../components/MeetingVotes'
import { meetingsIndex } from '../../lib/meetings'

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

      <MeetingVotes />
    </PageShell>
  )
}

function Stat({ label, value, accent, amber, red }: { label: string; value: string; accent?: boolean; amber?: boolean; red?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? '#b91c1c' : amber ? '#b45309' : '#12385b' }}>{value}</strong>
    </div>
  )
}
