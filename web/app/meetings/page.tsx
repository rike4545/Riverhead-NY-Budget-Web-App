import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import MeetingVotes from '../../components/MeetingVotes'
import { latestMeeting, meetingsIndex, MEMBER_ORDER } from '../../lib/meetings'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function MeetingsPage() {
  const m = latestMeeting

  return (
    <PageShell
      title="Town Board Votes"
      subtitle={`How the Town Board voted, resolution by resolution. Every item, the result, who moved and seconded it, and how each member voted — starting with the ${m.type} of ${m.date}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Resolution', text: 'a formal item the Board votes on — approving a contract, setting a fee, authorizing spending, and so on.' },
          { label: 'Most pass unanimously', text: 'so the interesting ones are the "contested" and "failed" votes — use the filter buttons to jump to them.' },
          { label: 'Mover / seconder', text: 'the member who formally proposes a resolution ("moves" it) and the one who supports putting it to a vote ("seconds").' },
        ]}
      >
        This page is the Town Board&apos;s <strong>voting record</strong>. It shows exactly what the Board decided at each
        meeting and where members disagreed — a plain-language accountability record.
      </PlainCallout>

      {/* Meeting header */}
      <section style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'start' }}>
          <div>
            <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{m.type}</div>
            <h2 style={{ margin: '4px 0' }}>{m.date}</h2>
            <div style={{ color: '#64748b' }}>{m.calledToOrder ? `Called to order at ${m.calledToOrder}. ` : ''}All five members present.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
          <Stat label="Items Voted" value={String(m.stats.total)} />
          <Stat label="Unanimous" value={String(m.stats.unanimous)} />
          <Stat label="Contested" value={String(m.stats.contested)} amber />
          <Stat label="Failed" value={String(m.stats.failed)} red />
        </div>
      </section>

      {/* Member tallies */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>How each member voted</h2>
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
              {MEMBER_ORDER.map((last) => {
                const t = m.memberTallies[last]
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
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          &quot;No&quot; and &quot;Abstained&quot; are the votes worth a closer look — they mark where a member broke from the rest of the Board.
        </p>
      </section>

      <h2 style={{ color: '#12385b' }}>Every resolution</h2>
      <MeetingVotes meeting={m} />

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        Source: {meetingsIndex.source.title} — {m.date}. Extracted from the official meeting minutes. This is the
        summary voting record; the full text and &quot;whereas&quot; language of each resolution is in the Town&apos;s minutes.
        More meetings will be added as their minutes are published.
      </p>
    </PageShell>
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
