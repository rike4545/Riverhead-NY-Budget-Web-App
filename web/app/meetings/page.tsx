import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import MeetingTimeline from '../../components/MeetingTimeline'
import BudgetProcessMeetingForecast from '../../components/BudgetProcessMeetingForecast'
import MeetingRecordExplorer from '../../components/MeetingRecordExplorer'
import {
  boardRulesSource, executiveSessionTopics, meetingSchedule, orderOfBusiness,
  speakingRules, specialMeetings, votingRules,
} from '../../lib/board-rules'
import { meetingsIndex } from '../../lib/meetings'
import consentCalendar from '../../public/data/consent-calendar.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const panel = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const

export const metadata = {
  title: 'Town Board Minutes & Votes — decisions, votes and fiscal impact',
  description: 'Read Riverhead Town Board meetings as a decision record: resolutions, outcomes, individual votes, official-record status and matched fiscal-impact statements.',
}

export default function MeetingsPage() {
  const t = meetingsIndex.totals
  const newest = meetingsIndex.meetings[0]
  const oldest = meetingsIndex.meetings[meetingsIndex.meetings.length - 1]

  return (
    <PageShell
      title="Town Board Minutes & Votes"
      subtitle={`Read what the Board decided, who disagreed, and what the action may mean financially. The archive currently contains ${t.votes.toLocaleString()} recorded votes across ${t.meetings} meetings from ${oldest.date} through ${newest.date}; newly completed meetings appear while official vote-bearing minutes are still pending.`}
    >
      <PlainCallout tips={[
        { label: 'Decision first', text: 'each resolution leads with what happened — passed, split, failed or tabled — before procedural details.' },
        { label: 'Fiscal impact', text: 'where a Town fiscal-impact statement is available, it appears with the resolution and links to the deeper corrected analysis.' },
        { label: 'Evidence state', text: 'a completed meeting can appear before final vote-bearing minutes; the page says exactly which record is available instead of guessing.' },
      ]}>
        <strong>Completed is not the same as fully archived.</strong> Minutes should answer a resident&apos;s question, not reproduce a filing cabinet. Start with the decision, see the vote, inspect the fiscal treatment, then follow the official record when you need the underlying evidence.
      </PlainCallout>

      <MeetingTimeline />
      <BudgetProcessMeetingForecast />

      <section style={{ margin: '30px 0 12px' }}>
        <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: .8, textTransform: 'uppercase' }}>The decision record</div>
        <h2 style={{ margin: '4px 0 6px', color: 'var(--rbl-title)', fontSize: 27 }}>What happened, who voted how, and what did it cost?</h2>
        <p style={{ color: 'var(--rbl-text-muted)', margin: 0, maxWidth: 820, lineHeight: 1.55 }}>Open a meeting and inspect the votes, then follow the money. Filter disagreement, failed and tabled items, search by topic, and see matched fiscal-impact statements directly beside the vote.</p>
      </section>

      <MeetingRecordExplorer />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 12, marginTop: 30 }}>
        <details style={panel}>
          <summary style={summaryStyle}>How to speak before the Board</summary>
          <p style={body}>The Board&apos;s adopted rules determine when residents may speak, how the meeting is ordered, and when an executive session may exclude the public.</p>

          <h3 style={subhead}>When you can speak</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {speakingRules.map((r) => <div key={r.rule} style={mini}><strong>{r.rule}</strong><div style={{ marginTop: 3, color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.45 }}>{r.detail}</div></div>)}
          </div>

          <h3 style={subhead}>Where public comment falls</h3>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 3 }}>
            {orderOfBusiness.map((o) => <li key={o.n} style={{ padding: '6px 8px', borderRadius: 7, fontSize: 13, background: o.publicSpeaks ? 'var(--rbl-warn-bg)' : 'transparent', color: o.publicSpeaks ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-body)', fontWeight: o.publicSpeaks ? 800 : 400 }}><span style={{ color: 'var(--rbl-text-muted)', marginRight: 8 }}>{o.n}</span>{o.item}{o.publicSpeaks ? ' · YOU CAN SPEAK' : ''}</li>)}
          </ol>

          <h3 style={subhead}>Meeting schedule</h3>
          <p style={body}>{meetingSchedule.regular} {meetingSchedule.workSessions} {meetingSchedule.quorum}</p>
          <ul style={list}>{meetingSchedule.exceptions.map((e) => <li key={e}>{e}</li>)}</ul>

          <h3 style={subhead}>Executive sessions</h3>
          <p style={body}>The public may be excluded only for permitted subjects:</p>
          <ul style={list}>{executiveSessionTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul>

          <h3 style={subhead}>Special meetings & voting</h3>
          <p style={body}>Called by {specialMeetings.calledBy.toLowerCase()} {specialMeetings.notice} {specialMeetings.limit}</p>
          <ul style={list}>{votingRules.map((v) => <li key={v}>{v}</li>)}</ul>

          <p style={{ ...body, fontSize: 12 }}>Source: {boardRulesSource.title}. {boardRulesSource.note} The adopted rules govern.</p>
        </details>

        <details style={panel}>
          <summary style={summaryStyle}>Why are so many votes unanimous?</summary>
          <p style={body}>{consentCalendar.intro}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, margin: '12px 0' }}>
            <MiniStat label="Unanimous" value={`${consentCalendar.riverheadPattern.unanimousPct}%`} />
            <MiniStat label="Resolutions studied" value={consentCalendar.riverheadPattern.totalResolutions.toLocaleString()} />
          </div>
          <p style={body}>{consentCalendar.riverheadPattern.rotationFinding}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {consentCalendar.whatMakesItEffective.map((item) => <div key={item.title} style={mini}><strong>{item.title}</strong><div style={{ marginTop: 3, color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.45 }}>{item.text}</div></div>)}
          </div>
          <p style={{ ...body, marginTop: 12 }}><strong>Bottom line:</strong> {consentCalendar.verdict}</p>
          <p style={{ ...body, fontSize: 12 }}>Sources: {consentCalendar.sources.join(' · ')}</p>
        </details>
      </section>

      <section style={{ ...panel, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ color: 'var(--rbl-title)' }}>Need the full fiscal-impact audit?</strong>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 3 }}>The meeting record shows the matched fiscal read in context; the Fiscal Impact page compares the Town&apos;s forms across meetings and explains every correction.</div>
        </div>
        <a href={`${base}/fiscal-impact/`} style={{ color: 'var(--rbl-link)', fontWeight: 850, textDecoration: 'none' }}>Open Fiscal Impact →</a>
      </section>
    </PageShell>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 10 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</div><strong style={{ color: 'var(--rbl-title)', fontSize: 20 }}>{value}</strong></div>
}

const summaryStyle = { cursor: 'pointer', color: 'var(--rbl-title)', fontWeight: 900, fontSize: 17, listStylePosition: 'outside' as const }
const subhead = { color: 'var(--rbl-title)', fontSize: 14, margin: '18px 0 7px' } as const
const body = { color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55 } as const
const list = { color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.5, paddingLeft: 18 } as const
const mini = { background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 9, padding: '9px 11px', color: 'var(--rbl-title)', fontSize: 13.5 } as const
