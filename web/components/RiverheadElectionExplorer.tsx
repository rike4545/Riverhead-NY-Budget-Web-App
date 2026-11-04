'use client'

import { useMemo, useState } from 'react'
import data from '../public/data/board-elections.json'

type Candidate = { name: string; party: string; votes: number }
type Race = { office: string; seats: number; note?: string; winners: Candidate[]; runnersUp: Candidate[] }
type Election = { year: number; status?: string; turnoutNote: string; turnout?: { ballots: number; registered: number }; races: Race[] }

const elections = data.priorElections as Election[]
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const number = (value: number) => value.toLocaleString()

export default function RiverheadElectionExplorer() {
  const [year, setYear] = useState(String(elections[0]?.year ?? 2026))
  const election = elections.find(item => String(item.year) === year) ?? elections[0]
  const [office, setOffice] = useState(election?.races[0]?.office ?? '')
  const race = election?.races.find(item => item.office === office) ?? election?.races[0]
  const candidates = useMemo(() => race ? [
    ...race.winners.map(candidate => ({ ...candidate, elected: true })),
    ...race.runnersUp.map(candidate => ({ ...candidate, elected: false })),
  ] : [], [race])
  const maxVotes = Math.max(1, ...candidates.map(candidate => candidate.votes))
  const listedVotes = candidates.reduce((total, candidate) => total + candidate.votes, 0)
  const singleSeatShare = race?.seats === 1

  function changeYear(nextYear: string) {
    setYear(nextYear)
    const nextElection = elections.find(item => String(item.year) === nextYear)
    setOffice(nextElection?.races[0]?.office ?? '')
  }

  if (!election || !race) return null

  return (
    <section aria-labelledby="riverhead-election-explorer-title" style={{ ...card, margin: '14px 0 18px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ color: 'var(--rbl-accent)', fontSize: 11, fontWeight: 850, letterSpacing: '.08em', textTransform: 'uppercase' }}>Riverhead-only results</div>
          <h2 id="riverhead-election-explorer-title" style={{ color: 'var(--rbl-title)', fontSize: 22, margin: '4px 0' }}>Explore Riverhead elections</h2>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: 0 }}>Compare candidates and races using the Town of Riverhead results in this dataset.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4, color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 750 }}>
            Election year
            <select value={year} onChange={event => changeYear(event.target.value)} style={{ minHeight: 42, minWidth: 132, padding: '8px 10px', borderRadius: 9, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-strong)', font: 'inherit' }}>
              {elections.map(item => <option key={item.year} value={item.year}>{item.year}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 750 }}>
            Riverhead office
            <select value={race.office} onChange={event => setOffice(event.target.value)} style={{ minHeight: 42, minWidth: 160, padding: '8px 10px', borderRadius: 9, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-strong)', font: 'inherit' }}>
              {election.races.map(item => <option key={item.office} value={item.office}>{item.office}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '14px 0 8px' }}>
        <strong style={{ color: 'var(--rbl-title)', fontSize: 17 }}>{election.year} · {race.office}</strong>
        <span style={{ borderRadius: 999, padding: '4px 9px', fontSize: 11.5, fontWeight: 850, background: election.status ? 'var(--rbl-warn-bg)' : 'var(--rbl-info-bg)', color: election.status ? 'var(--rbl-warn)' : 'var(--rbl-text-strong)' }}>{election.status ?? 'Historical results'}</span>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{race.seats === 1 ? '1 seat' : race.seats + ' seats'}</span>
      </div>
      {race.note && <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, margin: '0 0 10px' }}>{race.note}</p>}

      <div style={{ display: 'grid', gap: 11, marginTop: 12 }}>
        {candidates.map(candidate => {
          const share = singleSeatShare && listedVotes ? candidate.votes / listedVotes * 100 : null
          return <div key={candidate.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: candidate.elected ? 'var(--rbl-title)' : 'var(--rbl-text-muted)', fontWeight: candidate.elected ? 850 : 650, fontSize: 14 }}>
                {candidate.elected ? '✓ ' : ''}{candidate.name} <span style={{ fontWeight: 550, fontSize: 12, color: 'var(--rbl-text-faint)' }}>({candidate.party})</span>
              </span>
              <span style={{ color: 'var(--rbl-title)', fontWeight: 850, fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{number(candidate.votes)}{share !== null ? ' · ' + share.toFixed(1) + '%' : ''}</span>
            </div>
            <div role="img" aria-label={candidate.name + ': ' + number(candidate.votes) + ' votes'} style={{ height: 9, borderRadius: 999, background: 'var(--rbl-track)', overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: (candidate.votes / maxVotes * 100) + '%', borderRadius: 999, background: candidate.elected ? 'var(--rbl-fill-accent)' : 'var(--rbl-track-strong)' }} />
            </div>
          </div>
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 9, marginTop: 16 }}>
        <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 10, padding: 11 }}>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 750 }}>Candidates shown</div>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 21 }}>{candidates.length}</strong>
        </div>
        {election.turnout && <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 10, padding: 11 }}>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 750 }}>Supervisor-race turnout</div>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 21 }}>{number(election.turnout.ballots)} / {number(election.turnout.registered)}</strong>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{(election.turnout.ballots / election.turnout.registered * 100).toFixed(1)}% of registered voters</div>
        </div>}
      </div>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.55, margin: '12px 0 0' }}>
        {election.turnoutNote} {election.status ? 'This election-night count is unofficial and is not a certified turnout figure.' : 'Turnout shown is for the supervisor race and is not necessarily identical to ballots cast in every other contest.'}
        {singleSeatShare ? ' Candidate percentages are calculated only from the listed winner and runner-up totals; write-ins and other candidates may be excluded.' : ' This is a multi-seat contest; bars compare individual candidate vote totals and are not percentages of ballots or seats.'}
      </p>
    </section>
  )
}
