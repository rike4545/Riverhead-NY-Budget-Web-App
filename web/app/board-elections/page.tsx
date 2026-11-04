import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/board-elections.json'
import {
  electedRequirements, notRequired, termLimitNote, appointedStaff, disclaimer,
  elector, electedOffices, oddYearElections,
  sources as qualSources, type Requirement,
} from '../../lib/office-qualifications'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const

export const metadata = {
  title: 'How the current Town Board was elected',
  description:
    "The actual vote count that put each current Riverhead Town Board member in office, compared to the town's total population and registered voters.",
}

type Member = {
  name: string
  office: string
  party: string
  electionLabel: string
  votes: number
  result: string
}

type Candidate = { name: string; party: string; votes: number }
type Race = { office: string; seats: number; note?: string; winners: Candidate[]; runnersUp: Candidate[] }
type PriorElection = { year: number; status?: string; turnoutNote: string; turnout?: { ballots: number; registered: number }; races: Race[] }

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`
const num = (n: number) => n.toLocaleString()

export default function BoardElectionsPage() {
  const { population, registeredVoters } = data.denominators
  const members = data.members as Member[]
  const supervisorComparisons = (data.priorElections as PriorElection[]).flatMap((el) => {
    const race = el.races.find((item) => item.office.toLowerCase() === 'supervisor')
    const winner = race?.winners[0]
    const runnerUp = race?.runnersUp[0]
    if (!winner || !runnerUp) return []
    const total = winner.votes + runnerUp.votes
    return [{
      year: el.year, winner, runnerUp, margin: winner.votes - runnerUp.votes,
      winnerShare: (winner.votes / total) * 100,
      marginShare: ((winner.votes - runnerUp.votes) / total) * 100,
      turnout: el.turnout ? (el.turnout.ballots / el.turnout.registered) * 100 : null,
      status: el.status,
    }]
  }).sort((a, b) => a.year - b.year)
  const closestRace = supervisorComparisons.reduce((best, item) => item.margin < best.margin ? item : best)
  const widestRace = supervisorComparisons.reduce((best, item) => item.margin > best.margin ? item : best)
  const latestRace = supervisorComparisons[supervisorComparisons.length - 1]

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Town population (2020 Census)" value={population.toLocaleString()} />
        <Stat label="Registered voters (Nov 2025)" value={registeredVoters.toLocaleString()} accent />
      </section>

      <PlainCallout title="How to read this">
        Each card leads with the raw votes that won the seat, then measures them two ways: against the{' '}
        <strong>registered voters</strong> (people who could have voted) and against the <strong>whole population</strong>{' '}
        (which also counts kids and others who can&apos;t vote). Neither is a turnout rate — together they just show how
        small a slice of the town actually chose the people who now control its budget. Low shares are normal for off-year
        local elections.
      </PlainCallout>

      <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
        {members.map((m) => (
          <section key={m.name} style={{ ...card }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--rbl-title)' }}>{m.name}</span>
                <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 700, marginLeft: 8 }}>{m.office} · {m.party}</span>
              </div>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>{m.electionLabel}</span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: 'var(--rbl-title)' }}>{m.votes.toLocaleString()}</span>
                <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 700 }}>votes won the seat</span>
              </div>
              <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.5, margin: '6px 0 10px' }}>
                That&apos;s <strong style={{ color: 'var(--rbl-accent)' }}>{pct(m.votes, registeredVoters)}</strong> of the town&apos;s{' '}
                {registeredVoters.toLocaleString()} registered voters — and <strong>{pct(m.votes, population)}</strong> of
                its {population.toLocaleString()} residents.
              </p>
              {/* Bar: votes as a share of registered voters (the meaningful yardstick). */}
              <div style={{ background: 'var(--rbl-track)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${(m.votes / registeredVoters) * 100}%`, height: '100%', background: 'var(--rbl-fill-accent)', borderRadius: 999 }} />
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 3, fontWeight: 700 }}>
                share of registered voters
              </div>
            </div>

            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{m.result}</p>
          </section>
        ))}
      </div>

      <h2 style={{ color: 'var(--rbl-title)', marginTop: 28, marginBottom: 2 }}>Recent general elections</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55, marginTop: 0 }}>{(data as { priorElectionsNote?: string }).priorElectionsNote}</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {(data.priorElections as PriorElection[]).map((el) => (
          <section key={el.year} style={{ ...card }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--rbl-title)' }}>{el.year} General Election{el.status && <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 800, color: 'var(--rbl-accent)' }}>({el.status})</span>}</span>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700 }}>{el.turnoutNote}</span>
            </div>
            {el.races.map((race) => {
              const maxVotes = Math.max(...race.winners.map((c) => c.votes), ...race.runnersUp.map((c) => c.votes))
              return (
                <div key={race.office} style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 14.5 }}>
                    {race.office} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 700 }}>· {race.seats === 1 ? '1 seat' : `${race.seats} seats`}</span>
                  </div>
                  {race.note && <div style={{ color: 'var(--rbl-accent)', fontSize: 12.5, fontWeight: 700, margin: '2px 0 4px' }}>{race.note}</div>}
                  <div style={{ display: 'grid', gap: 5, marginTop: 6 }}>
                    {[...race.winners.map((c) => ({ ...c, won: true })), ...race.runnersUp.map((c) => ({ ...c, won: false }))].map((c) => (
                      <div key={c.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                          <span style={{ color: c.won ? 'var(--rbl-title)' : 'var(--rbl-text-muted)', fontWeight: c.won ? 800 : 600 }}>
                            {c.won ? '✓ ' : ''}{c.name} <span style={{ color: 'var(--rbl-text-faint)', fontWeight: 600 }}>({c.party})</span>
                          </span>
                          <span style={{ fontWeight: 800, color: c.won ? 'var(--rbl-title)' : 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{num(c.votes)}</span>
                        </div>
                        <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 999, height: 7, overflow: 'hidden', marginTop: 2 }}>
                          <div style={{ width: `${(c.votes / maxVotes) * 100}%`, height: '100%', background: c.won ? 'var(--rbl-fill-accent)' : 'var(--rbl-track-strong)', borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        ))}
      </div>

      {/* Supervisor-race comparison across cycles */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ color: 'var(--rbl-title)', margin: '0 0 5px', fontSize: 21 }}>How competitive have Riverhead's supervisor races been?</h2>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 13px' }}>
          A six-election comparison of the winning margin, the winner's share of the two leading candidates' combined votes, and historical turnout.
          The 2026 result is an unofficial election-night count; its turnout is not yet comparable with certified years.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9, marginBottom: 16 }}>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 700 }}>Closest race</div>
            <strong style={{ color: 'var(--rbl-title)', fontSize: 24 }}>{num(closestRace.margin)}</strong>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{closestRace.year} · votes</div>
          </div>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 700 }}>Widest race</div>
            <strong style={{ color: 'var(--rbl-title)', fontSize: 24 }}>{num(widestRace.margin)}</strong>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{widestRace.year} · votes</div>
          </div>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 700 }}>Latest reported margin</div>
            <strong style={{ color: 'var(--rbl-title)', fontSize: 24 }}>{num(latestRace.margin)}</strong>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{latestRace.year} · {latestRace.status ? 'unofficial' : 'certified'}</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650, fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border)' }}>
                {['Year','Winner','Runner-up','Margin','Winner share*','Turnout'].map((label) => <th key={label} style={{ padding: '9px 7px', fontWeight: 800 }}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {supervisorComparisons.map((item) => (
                <tr key={item.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ padding: '10px 7px', fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{item.year}{item.status && <div style={{ color: 'var(--rbl-accent)', fontSize: 10.5 }}>Unofficial</div>}</td>
                  <td style={{ padding: '10px 7px', color: 'var(--rbl-text-strong)' }}>{item.winner.name}<div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{num(item.winner.votes)} votes</div></td>
                  <td style={{ padding: '10px 7px', color: 'var(--rbl-text-muted)' }}>{item.runnerUp.name}<div style={{ fontSize: 11.5 }}>{num(item.runnerUp.votes)} votes</div></td>
                  <td style={{ padding: '10px 7px', fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{num(item.margin)}</td>
                  <td style={{ padding: '10px 7px', color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>{item.winnerShare.toFixed(2)}%</td>
                  <td style={{ padding: '10px 7px', color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{item.turnout === null ? 'Not final' : `${item.turnout.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.55, margin: '10px 0 0' }}>
          *Winner share is calculated from the winner and runner-up totals only; write-ins and any other candidates are excluded. Turnout is ballots cast divided by registered voters for that year's supervisor race. The 2026 figure is deliberately withheld until the Board of Elections completes its canvass.
        </p>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.5, lineHeight: 1.6, margin: '10px 0 0' }}>
          The 2025 contest was the narrowest in this comparison: Halpin won by 37 votes. His 2026 lead over Rothwell is 627 votes in the unofficial count—about 16.9 times that prior margin. The widest margin shown is Hubbard's 1,635-vote win in 2023.
        </p>
      </section>

      {/* ---- What the job legally requires ---- */}
      <h2 style={{ color: 'var(--rbl-title)', fontSize: 25, margin: '30px 0 4px' }}>What the job legally requires</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 880 }}>
        The votes above put these people in office. This is what the law asked of them before they could stand for it —
        for the Supervisor and every Council member alike, since the qualifications are identical.
      </p>

      <section style={{ ...card }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {electedRequirements.map((r) => <ReqRow key={r.label} r={r} />)}
        </div>
      </section>

      {/* What "elector" means — the phrase every residency rule hangs on */}
      <section style={{ ...card, marginTop: 14, background: 'var(--rbl-teal-bg)' }}>
        <h3 style={{ margin: '0 0 5px', color: 'var(--rbl-teal)', fontSize: 18 }}>{elector.title}</h3>
        <p style={{ color: 'var(--rbl-teal-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 12px' }}>{elector.lede}</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {elector.tests.map((t) => (
            <div key={t.label} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ color: 'var(--rbl-teal)', fontWeight: 900, fontSize: 13.5, marginBottom: 3 }}>{t.label}</div>
              <div style={{ color: 'var(--rbl-teal-strong)', fontSize: 14, lineHeight: 1.6 }}>{t.detail}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-teal-strong)', fontSize: 14, lineHeight: 1.6, margin: '11px 0 0' }}>{elector.disqualified}</p>
        <p style={{ color: 'var(--rbl-teal-strong)', fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 0' }}>{elector.note}</p>
        <div style={{ color: 'var(--rbl-teal)', fontSize: 12, fontWeight: 700, marginTop: 7 }}>{elector.sources}</div>
      </section>

      <section style={{ ...card, marginTop: 14, borderColor: 'var(--rbl-warn-border)', background: 'var(--rbl-warn-bg)' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--rbl-warn)', fontSize: 18 }}>{notRequired.title}</h3>
        <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
          {notRequired.items.map((i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: 'var(--rbl-warn)', fontWeight: 900 }}>✕</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
        <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{notRequired.closing}</p>
      </section>

      <section style={{ ...card, marginTop: 14, borderColor: 'var(--rbl-success-border)' }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>{termLimitNote.title}</h3>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700, marginBottom: 9 }}>
          Adopted {termLimitNote.adopted} · {termLimitNote.law}
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 9px' }}>{termLimitNote.intent}</p>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 9px' }}>{termLimitNote.mechanics}</p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{termLimitNote.authority}</p>
      </section>

      {/* Which offices are elected, and the choices behind that */}
      <section style={{ ...card, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 5px', color: 'var(--rbl-title)', fontSize: 18 }}>{electedOffices.title}</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 11px' }}>{electedOffices.lede}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
          {electedOffices.offices.map((o) => (
            <span key={o} style={{ background: 'var(--rbl-info-bg)', color: 'var(--rbl-title)', border: '1px solid var(--rbl-info-border)', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 800 }}>{o}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {electedOffices.decisions.map((d) => (
            <div key={d.what} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ color: 'var(--rbl-title)', fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{d.what}</div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>{d.detail}</div>
              <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12, fontWeight: 700, marginTop: 5 }}>{d.source}</div>
            </div>
          ))}
        </div>
        <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12, fontWeight: 700, marginTop: 9 }}>Offices listed at {electedOffices.source}</div>
      </section>

      {/* Odd-year local law vs. the upheld even-year state law */}
      <section style={{ ...card, marginTop: 14, borderColor: 'var(--rbl-danger-border)', background: 'var(--rbl-danger-bg)' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--rbl-danger)', fontSize: 18 }}>{oddYearElections.title}</h3>
        {oddYearElections.body.map((para, i) => (
          <p key={i} style={{ color: 'var(--rbl-danger-strong)', fontSize: 14.5, lineHeight: 1.65, margin: i === 0 ? 0 : '10px 0 0' }}>{para}</p>
        ))}
        <a href={`${base}${oddYearElections.caseHref}`} style={{ display: 'inline-block', marginTop: 10, color: 'var(--rbl-danger)', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
          What the Town spent on that case →
        </a>
      </section>

      <section style={{ ...card, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18 }}>{appointedStaff.title}</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 12px' }}>{appointedStaff.lede}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {appointedStaff.requirements.map((r) => <ReqRow key={r.label} r={r} />)}
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6, margin: '12px 0 0', paddingTop: 11, borderTop: '1px solid var(--rbl-border-subtle)' }}>
          {appointedStaff.officerVsEmployee}
        </p>
      </section>

      <section style={{ ...card, marginTop: 14 }}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 9px' }}>{disclaimer}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {qualSources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
              style={{ color: 'var(--rbl-accent)', textDecoration: 'none', border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface-2)', borderRadius: 999, padding: '5px 11px', fontWeight: 700, fontSize: 12.5 }}>
              {s.label} ↗
            </a>
          ))}
        </div>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginTop: 16 }}>{data.note}</p>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginTop: 8, overflowWrap: 'anywhere' }}>
        Sources: {data.sources.join(' · ')}
      </p>
    </PageShell>
  )
}

function ReqRow({ r }: { r: Requirement }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 700, minWidth: 118 }}>
          {r.label}
        </span>
        <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>{r.value}</strong>
      </div>
      <div style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, marginTop: 5 }}>{r.detail}</div>
      <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12, fontWeight: 700, marginTop: 5 }}>{r.source}</div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 700 }}>{label}</div>
      <strong style={{ fontSize: 28, color: accent ? 'var(--rbl-accent)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}

