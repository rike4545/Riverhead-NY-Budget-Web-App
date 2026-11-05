import Link from 'next/link'
import { supervisorResult2026 as r } from '../lib/election-results-2026'

// Supervisor contests from board-elections.json, newest first: the winning margin and the
// votes cast in the race. The 2026 row is the unofficial count above.
const history = [
  { year: 2026, margin: r.margin, votes: r.total, note: 'unofficial' },
  { year: 2025, margin: 37, votes: 7879, note: 'full manual recount' },
  { year: 2023, margin: 1635, votes: 8753, note: '' },
  { year: 2021, margin: 1528, votes: 9142, note: '' },
  { year: 2019, margin: 707, votes: 8587, note: '' },
  { year: 2017, margin: 649, votes: 9011, note: '' },
] as const

const n = (v: number) => v.toLocaleString('en-US')

// The November 3, 2026 Supervisor result, labelled unofficial, with its source, the
// time it was posted and how it compares with earlier Supervisor races.
export default function UnofficialElectionResult() {
  const [h, k] = r.candidates
  const earlier = history.slice(1)
  const closer = earlier.filter((e) => e.margin < r.margin)
  const mostEarlier = Math.max(...earlier.map((e) => e.votes))
  return (
    <aside
      role="note"
      data-unofficial-result
      style={{ border: '1px solid var(--rbl-accent)', borderRadius: 12, background: 'var(--rbl-info-bg)', padding: '12px 15px', margin: '0 0 16px', color: 'var(--rbl-text)', lineHeight: 1.5 }}
    >
      <strong>Unofficial result of the {r.electionDate} {r.office} race</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        {h.name} leads {k.name}, {h.percent} to {k.percent}: {n(h.votes)} votes to {n(k.votes)}, a margin of {n(r.margin)} votes.
        {' '}{h.lines} for Halpin; {k.lines} for Rothwell. {n(r.candidates[2].votes)} write-in votes. {n(r.total)} votes in the race.
        These numbers are unofficial and can change; the County Board of Elections certifies the final count.
      </p>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        Compared with earlier Supervisor races: of the five earlier races shown, {closer.length === 1 ? `only ${closer[0].year} (${n(closer[0].margin)} votes)` : `${closer.length}`} was closer than this {n(r.margin)}-vote margin.
        The 2017 and 2019 races were decided by 649 and 707 votes; 2021 and 2023 by more than 1,500. Votes in this race are up
        {' '}{n(r.total - mostEarlier)} from the highest of the earlier five ({n(mostEarlier)} in 2021).
      </p>
      <details style={{ margin: '7px 0 0', fontSize: 13 }}>
        <summary style={{ cursor: 'pointer', minHeight: 24 }}>Margins and votes in Supervisor races, 2017 to 2026</summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, margin: '6px 0' }}>
            <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', paddingBottom: 4 }}>Winning margin and votes cast in the Supervisor race. Source: Suffolk County Board of Elections, as listed on <Link href="/board-elections/">Board of Elections</Link>.</caption>
            <thead><tr><th scope="col" style={{ textAlign: 'left', padding: '3px 10px 3px 0' }}>Year</th><th scope="col" style={{ textAlign: 'right', padding: '3px 10px' }}>Margin</th><th scope="col" style={{ textAlign: 'right', padding: '3px 10px' }}>Votes</th><th scope="col" style={{ textAlign: 'left', padding: '3px 0 3px 10px' }}>Note</th></tr></thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.year}><th scope="row" style={{ textAlign: 'left', padding: '3px 10px 3px 0', fontWeight: 600 }}>{e.year}</th><td style={{ textAlign: 'right', padding: '3px 10px' }}>{n(e.margin)}</td><td style={{ textAlign: 'right', padding: '3px 10px' }}>{n(e.votes)}</td><td style={{ padding: '3px 0 3px 10px', color: 'var(--rbl-text-muted)' }}>{e.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details style={{ margin: '7px 0 0', fontSize: 13 }}>
        <summary style={{ cursor: 'pointer', minHeight: 24 }}>Results by election district (all 22)</summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, margin: '6px 0' }}>
            <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', paddingBottom: 4 }}>Votes by party line, as of {r.asOf}. Halpin: Democratic and Taxpayers First. Rothwell: Republican and Conservative.</caption>
            <thead><tr>
              <th scope="col" style={{ textAlign: 'left', padding: '3px 10px 3px 0' }}>District</th>
              <th scope="col" style={{ textAlign: 'right', padding: '3px 10px' }}>Halpin</th>
              <th scope="col" style={{ textAlign: 'right', padding: '3px 10px' }}>Rothwell</th>
              <th scope="col" style={{ textAlign: 'right', padding: '3px 10px' }}>Write-in</th>
              <th scope="col" style={{ textAlign: 'right', padding: '3px 0 3px 10px' }}>Total</th>
            </tr></thead>
            <tbody>
              {r.districts.map((d) => (
                <tr key={d.ed}>
                  <th scope="row" style={{ textAlign: 'left', padding: '3px 10px 3px 0', fontWeight: 600 }}>{d.ed}</th>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{n(d.halpinDem + d.halpinTpf)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{n(d.rothwellRep + d.rothwellCon)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{d.writeIn}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0 3px 10px' }}>{n(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
        {r.countyStatus} As of {r.asOf}. {r.secondary.note}
      </p>
      <p style={{ margin: '7px 0 0', fontSize: 13 }}>
        <a href={r.source.url} target="_blank" rel="noreferrer">{r.source.title}</a>
        {' · '}
        <a href={r.secondary.url} target="_blank" rel="noreferrer">{r.secondary.title}</a>
      </p>
    </aside>
  )
}
