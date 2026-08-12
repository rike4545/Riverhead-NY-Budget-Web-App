import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/board-elections.json'
import {
  electedRequirements, notRequired, termLimitNote, appointedStaff, disclaimer,
  elector, electedOffices, oddYearElections,
  sources as qualSources, type Requirement,
} from '../../lib/office-qualifications'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

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
type PriorElection = { year: number; turnoutNote: string; races: Race[] }

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`
const num = (n: number) => n.toLocaleString()

export default function BoardElectionsPage() {
  const { population, registeredVoters } = data.denominators
  const members = data.members as Member[]

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
          <section key={m.name} style={{ ...card, borderLeft: '6px solid #4a7297' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#284a69' }}>{m.name}</span>
                <span style={{ color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{m.office} · {m.party}</span>
              </div>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{m.electionLabel}</span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: '#284a69' }}>{m.votes.toLocaleString()}</span>
                <span style={{ color: '#64748b', fontWeight: 700 }}>votes won the seat</span>
              </div>
              <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.5, margin: '6px 0 10px' }}>
                That&apos;s <strong style={{ color: '#4a7297' }}>{pct(m.votes, registeredVoters)}</strong> of the town&apos;s{' '}
                {registeredVoters.toLocaleString()} registered voters — and <strong>{pct(m.votes, population)}</strong> of
                its {population.toLocaleString()} residents.
              </p>
              {/* Bar: votes as a share of registered voters (the meaningful yardstick). */}
              <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${(m.votes / registeredVoters) * 100}%`, height: '100%', background: '#4a7297', borderRadius: 999 }} />
              </div>
              <div style={{ color: '#6b7280', fontSize: 11.5, marginTop: 3, fontWeight: 700 }}>
                share of registered voters
              </div>
            </div>

            <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{m.result}</p>
          </section>
        ))}
      </div>

      <h2 style={{ color: '#284a69', marginTop: 28, marginBottom: 2 }}>Recent general elections</h2>
      <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.55, marginTop: 0 }}>{(data as { priorElectionsNote?: string }).priorElectionsNote}</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {(data.priorElections as PriorElection[]).map((el) => (
          <section key={el.year} style={{ ...card, borderLeft: '6px solid #94a3b8' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#284a69' }}>{el.year} General Election</span>
              <span style={{ color: '#6b7280', fontSize: 12.5, fontWeight: 700 }}>{el.turnoutNote}</span>
            </div>
            {el.races.map((race) => {
              const maxVotes = Math.max(...race.winners.map((c) => c.votes), ...race.runnersUp.map((c) => c.votes))
              return (
                <div key={race.office} style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>
                    {race.office} <span style={{ color: '#6b7280', fontWeight: 700 }}>· {race.seats === 1 ? '1 seat' : `${race.seats} seats`}</span>
                  </div>
                  {race.note && <div style={{ color: '#4a7297', fontSize: 12.5, fontWeight: 700, margin: '2px 0 4px' }}>{race.note}</div>}
                  <div style={{ display: 'grid', gap: 5, marginTop: 6 }}>
                    {[...race.winners.map((c) => ({ ...c, won: true })), ...race.runnersUp.map((c) => ({ ...c, won: false }))].map((c) => (
                      <div key={c.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                          <span style={{ color: c.won ? '#284a69' : '#64748b', fontWeight: c.won ? 800 : 600 }}>
                            {c.won ? '✓ ' : ''}{c.name} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({c.party})</span>
                          </span>
                          <span style={{ fontWeight: 800, color: c.won ? '#284a69' : '#6b7280', whiteSpace: 'nowrap' }}>{num(c.votes)}</span>
                        </div>
                        <div style={{ background: '#eef2f6', borderRadius: 999, height: 7, overflow: 'hidden', marginTop: 2 }}>
                          <div style={{ width: `${(c.votes / maxVotes) * 100}%`, height: '100%', background: c.won ? '#4a7297' : '#cbd5e1', borderRadius: 999 }} />
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

      {/* ---- What the job legally requires ---- */}
      <h2 style={{ color: '#284a69', fontSize: 25, margin: '30px 0 4px' }}>What the job legally requires</h2>
      <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 880 }}>
        The votes above put these people in office. This is what the law asked of them before they could stand for it —
        for the Supervisor and every Council member alike, since the qualifications are identical.
      </p>

      <section style={{ ...card, borderLeft: '6px solid #4a7297' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {electedRequirements.map((r) => <ReqRow key={r.label} r={r} />)}
        </div>
      </section>

      {/* What "elector" means — the phrase every residency rule hangs on */}
      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #0d9488', background: '#f0fdfa' }}>
        <h3 style={{ margin: '0 0 5px', color: '#0f766e', fontSize: 18 }}>{elector.title}</h3>
        <p style={{ color: '#134e4a', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 12px' }}>{elector.lede}</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {elector.tests.map((t) => (
            <div key={t.label} style={{ background: 'white', border: '1px solid #99f6e4', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ color: '#0f766e', fontWeight: 900, fontSize: 13.5, marginBottom: 3 }}>{t.label}</div>
              <div style={{ color: '#134e4a', fontSize: 14, lineHeight: 1.6 }}>{t.detail}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#134e4a', fontSize: 14, lineHeight: 1.6, margin: '11px 0 0' }}>{elector.disqualified}</p>
        <p style={{ color: '#115e59', fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 0' }}>{elector.note}</p>
        <div style={{ color: '#5eaaa4', fontSize: 12, fontWeight: 700, marginTop: 7 }}>{elector.sources}</div>
      </section>

      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #b45309', background: '#fffbeb' }}>
        <h3 style={{ margin: '0 0 8px', color: '#92400e', fontSize: 18 }}>{notRequired.title}</h3>
        <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
          {notRequired.items.map((i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: '#78350f', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: '#b45309', fontWeight: 900 }}>✕</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
        <p style={{ color: '#78350f', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{notRequired.closing}</p>
      </section>

      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #15803d' }}>
        <h3 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 18 }}>{termLimitNote.title}</h3>
        <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, marginBottom: 9 }}>
          Adopted {termLimitNote.adopted} · {termLimitNote.law}
        </div>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 9px' }}>{termLimitNote.intent}</p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 9px' }}>{termLimitNote.mechanics}</p>
        <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{termLimitNote.authority}</p>
      </section>

      {/* Which offices are elected, and the choices behind that */}
      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #4a7297' }}>
        <h3 style={{ margin: '0 0 5px', color: '#284a69', fontSize: 18 }}>{electedOffices.title}</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 11px' }}>{electedOffices.lede}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
          {electedOffices.offices.map((o) => (
            <span key={o} style={{ background: '#eef6ff', color: '#284a69', border: '1px solid #bcd9f5', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 800 }}>{o}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {electedOffices.decisions.map((d) => (
            <div key={d.what} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ color: '#284a69', fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{d.what}</div>
              <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>{d.detail}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginTop: 5 }}>{d.source}</div>
            </div>
          ))}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginTop: 9 }}>Offices listed at {electedOffices.source}</div>
      </section>

      {/* Odd-year local law vs. the upheld even-year state law */}
      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #b91c1c', background: '#fef2f2' }}>
        <h3 style={{ margin: '0 0 8px', color: '#b91c1c', fontSize: 18 }}>{oddYearElections.title}</h3>
        {oddYearElections.body.map((para, i) => (
          <p key={i} style={{ color: '#7f1d1d', fontSize: 14.5, lineHeight: 1.65, margin: i === 0 ? 0 : '10px 0 0' }}>{para}</p>
        ))}
        <a href={`${base}${oddYearElections.caseHref}`} style={{ display: 'inline-block', marginTop: 10, color: '#b91c1c', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
          What the Town spent on that case →
        </a>
      </section>

      <section style={{ ...card, marginTop: 14, borderLeft: '6px solid #5b21b6' }}>
        <h3 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 18 }}>{appointedStaff.title}</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 12px' }}>{appointedStaff.lede}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {appointedStaff.requirements.map((r) => <ReqRow key={r.label} r={r} />)}
        </div>
        <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '12px 0 0', paddingTop: 11, borderTop: '1px solid #e2e8f0' }}>
          {appointedStaff.officerVsEmployee}
        </p>
      </section>

      <section style={{ ...card, marginTop: 14 }}>
        <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 9px' }}>{disclaimer}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {qualSources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
              style={{ color: '#4a7297', textDecoration: 'none', border: '1px solid #d8e0e7', background: '#f8fafc', borderRadius: 999, padding: '5px 11px', fontWeight: 700, fontSize: 12.5 }}>
              {s.label} ↗
            </a>
          ))}
        </div>
      </section>

      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 16 }}>{data.note}</p>
      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
        Sources: {data.sources.join(' · ')}
      </p>
    </PageShell>
  )
}

function ReqRow({ r }: { r: Requirement }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 118 }}>
          {r.label}
        </span>
        <strong style={{ color: '#284a69', fontSize: 16 }}>{r.value}</strong>
      </div>
      <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginTop: 5 }}>{r.detail}</div>
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginTop: 5 }}>{r.source}</div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 28, color: accent ? '#4a7297' : '#284a69' }}>{value}</strong>
    </div>
  )
}

