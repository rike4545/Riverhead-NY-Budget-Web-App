import { supervisorResult2026 as r } from '../lib/election-results-2026'

// The November 3, 2026 Supervisor result, labelled unofficial, with its source and
// the time it was posted. Shown on the pages that discuss the race.
export default function UnofficialElectionResult() {
  return (
    <aside
      role="note"
      data-unofficial-result
      style={{ border: '1px solid var(--rbl-accent)', borderRadius: 12, background: 'var(--rbl-info-bg)', padding: '12px 15px', margin: '0 0 16px', color: 'var(--rbl-text)', lineHeight: 1.5 }}
    >
      <strong>Unofficial result of the {r.electionDate} {r.office} race</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        {r.candidates[0].name} leads {r.candidates[1].name}, {r.candidates[0].percent} to {r.candidates[1].percent}: {r.candidates[0].votes} votes to {r.candidates[1].votes}, a margin of {r.margin}.
        All {r.districtsReporting.of} election districts had reported. These numbers are unofficial and can change; the County Board of Elections certifies the final count.
      </p>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
        {r.note} Posted {r.source.posted}; updated {r.source.updated}.
      </p>
      <p style={{ margin: '7px 0 0', fontSize: 13 }}>
        <a href={r.source.url} target="_blank" rel="noreferrer">{r.source.title}</a>
        {' · '}
        <a href={r.countySource.url} target="_blank" rel="noreferrer">{r.countySource.title}</a>
      </p>
    </aside>
  )
}
