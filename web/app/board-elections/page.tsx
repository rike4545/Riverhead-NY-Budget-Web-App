import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/board-elections.json'

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

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`

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

      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 16 }}>{data.note}</p>
      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
        Sources: {data.sources.join(' · ')}
      </p>
    </PageShell>
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

