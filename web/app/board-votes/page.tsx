import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/vote-agreement.json'

// How Town Board members voted when they did not all agree. Built by
// etl/build_vote_agreement.py from the site's voting record. Everything here is
// static: the grid, the counts and the list of contested resolutions.

type Member = { last: string; name: string; first: string; last_meeting: string; votes: { aye: number; nay: number; abstain: number; absent: number } }
type Pair = { a: string; b: string; both: number; same: number }
type Row = { date: string; number: string; title: string; result: string; adopted: boolean | null; votes: Record<string, string> }
const d = data as unknown as { from: string; to: string; meetings: number; resolutions: number; members: Member[]; pairs: Pair[]; contested: Row[] }

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const num = (n: number) => n.toLocaleString('en-US')
const pct = (v: number) => `${Math.round(v * 100)}%`
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const SEQ = ['var(--rbl-map-seq-1)', 'var(--rbl-map-seq-2)', 'var(--rbl-map-seq-3)', 'var(--rbl-map-seq-4)', 'var(--rbl-map-seq-5)']
const shade = (v: number) => SEQ[Math.min(4, Math.floor(v * 5))]
const VOTE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  aye: { label: 'Yes', bg: 'var(--rbl-surface-2)', fg: 'var(--rbl-text-body)' },
  nay: { label: 'No', bg: 'var(--rbl-map-other-4)', fg: 'var(--rbl-on-series)' },
  abstain: { label: 'Abstained', bg: 'var(--rbl-map-other-1)', fg: 'var(--rbl-text-strong)' },
  absent: { label: 'Absent', bg: 'var(--rbl-surface)', fg: 'var(--rbl-text-muted)' },
}

export const metadata = {
  title: 'Board votes — who votes with whom',
  description: 'How each Riverhead Town Board member voted on the resolutions where the Board did not agree, and how often each pair voted alike.',
}

export default function BoardVotesPage() {
  const members = d.members
  const pairOf = (a: string, b: string) => d.pairs.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a))
  const ranked = [...d.pairs].filter((p) => p.both >= 10).sort((x, y) => y.same / y.both - x.same / x.both)
  const most = ranked[0], least = ranked[ranked.length - 1]
  const nameOf = (last: string) => members.find((m) => m.last === last)?.name ?? last
  const cell = { padding: 6, textAlign: 'center', fontSize: 14, minWidth: 70 } as const

  return (
    <PageShell
      title="Board votes"
      subtitle="How each Town Board member voted when the Board did not agree, and how often each pair voted alike."
    >
      <PlainCallout
        tips={[
          { label: 'Contested', text: 'a resolution where the members present did not all cast the same vote: someone voted no or abstained while others voted yes.' },
          { label: 'Abstaining', text: 'a member may abstain because of a conflict, such as a vote on their own appointment or pay. An abstention is not always a disagreement.' },
          { label: 'Absences', text: 'are not counted as disagreement. They are in each member’s totals below.' },
        ]}
      >
        From {longDate(d.from)} to {longDate(d.to)} the Board voted on <strong>{num(d.resolutions)}</strong> resolutions at {d.meetings} meetings,
        and did not agree on <strong>{d.contested.length}</strong> of them. On those, {nameOf(most.a)} and {nameOf(most.b)} voted alike most
        often ({most.same} of {most.both}, {pct(most.same / most.both)}); {nameOf(least.a)} and {nameOf(least.b)} least often ({least.same} of{' '}
        {least.both}, {pct(least.same / least.both)}).
      </PlainCallout>

      <section id="grid" aria-labelledby="grid-heading" style={card}>
        <h2 id="grid-heading" style={h2}>How often each pair voted alike</h2>
        <p style={prose}>On the contested resolutions both members voted on. Darker means more often alike. Members who never served together have no figure.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 14 }}>
            <thead>
              <tr>
                <th scope="col"><span className="rbl-sr-only">Member</span></th>
                {members.map((m) => <th key={m.last} scope="col" style={{ ...cell, fontWeight: 600, color: 'var(--rbl-text-muted)' }}>{m.last}</th>)}
              </tr>
            </thead>
            <tbody>
              {members.map((r) => (
                <tr key={r.last}>
                  <th scope="row" style={{ textAlign: 'left', paddingRight: 8, fontWeight: 600, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>{r.name}</th>
                  {members.map((c) => {
                    if (r.last === c.last) return <td key={c.last} style={{ ...cell, color: 'var(--rbl-text-muted)' }}>—</td>
                    const p = pairOf(r.last, c.last)
                    if (!p || !p.both) return <td key={c.last} style={{ ...cell, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>did not serve together</td>
                    const v = p.same / p.both
                    return (
                      <td key={c.last} style={{ ...cell, background: shade(v), color: v >= 0.6 ? 'var(--rbl-on-series)' : 'var(--rbl-text-strong)', borderRadius: 6 }}>
                        <strong>{pct(v)}</strong>
                        <span style={{ display: 'block', fontSize: 12.5 }}>{p.same} of {p.both}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="members" aria-labelledby="members-heading" style={card}>
        <h2 id="members-heading" style={h2}>Each member&apos;s votes</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                {['Member', 'Served', 'Yes', 'No', 'Abstained', 'Absent'].map((h, i) => <th key={h} scope="col" style={{ padding: '8px 10px', textAlign: i > 1 ? 'right' : 'left', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.last} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>{m.name}</th>
                  <td data-label="Served" style={{ padding: '8px 10px' }}>{shortDate(m.first)} to {shortDate(m.last_meeting)}</td>
                  <td data-label="Yes" style={{ padding: '8px 10px', textAlign: 'right' }}>{num(m.votes.aye)}</td>
                  <td data-label="No" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.votes.nay}</td>
                  <td data-label="Abstained" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.votes.abstain}</td>
                  <td data-label="Absent" style={{ padding: '8px 10px', textAlign: 'right' }}>{m.votes.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="contested" aria-labelledby="contested-heading" style={card}>
        <h2 id="contested-heading" style={h2}>Every contested resolution</h2>
        <p style={prose}>Newest first. Each member&apos;s vote is shown; a blank means the member was not on the Board.</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[...d.contested].reverse().map((r) => (
            <li key={`${r.date}-${r.number}`} style={{ padding: '10px 0', borderTop: '1px solid var(--rbl-border-subtle)' }}>
              <div style={{ fontSize: 15.5, color: 'var(--rbl-text-body)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--rbl-text-muted)' }}>{shortDate(r.date)} · </span>
                <a href={`${base}/meetings/?meeting=${r.date}&q=${encodeURIComponent(r.number)}`} style={link}>{r.number}</a>{' '}
                {r.title}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {members.filter((m) => r.votes[m.last]).map((m) => {
                  const s = VOTE_STYLE[r.votes[m.last]] ?? VOTE_STYLE.absent
                  return <span key={m.last} style={{ fontSize: 13.5, padding: '3px 8px', borderRadius: 999, background: s.bg, color: s.fg, border: '1px solid var(--rbl-border)' }}>{m.last}: {s.label}</span>
                })}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <p style={prose}>
          The site&apos;s voting record, read from the Town&apos;s meeting minutes and agenda packets on CivicClerk; see{' '}
          <a href={`${base}/meetings/`} style={link}>Town Board meetings</a>. The site holds every meeting from {longDate(d.from)}; earlier
          years have only one meeting each, so they are left out. Built by <code>etl/build_vote_agreement.py</code>. Patterns in votes are
          not evidence of why a member voted as they did.
        </p>
      </section>
    </PageShell>
  )
}
