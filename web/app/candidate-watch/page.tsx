import PageShell from '../../components/PageShell'
import data from '../../public/data/candidate-watch.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: '2026 Town Campaign Candidate Watch',
  description:
    "Who's running for Riverhead Town office in the November 2026 general election, their campaign links, and their stated platforms.",
}

type Candidate = {
  name: string
  party: string
  incumbent: boolean
  active: boolean
  website: string
  socialMedia: { platform: string; url: string }[]
  background: string
  platform: string[]
  sources: string[]
}

// Spell out the party codes and give each a color, so a reader never has to
// decode "R/C" or a bare letter.
const PARTY: Record<string, { name: string; color: string; tint: string }> = {
  D: { name: 'Democrat', color: '#1e40af', tint: '#dbeafe' },
  R: { name: 'Republican', color: '#b91c1c', tint: '#fee2e2' },
  'R/C': { name: 'Republican · Conservative', color: '#b91c1c', tint: '#fee2e2' },
  C: { name: 'Conservative', color: '#9a3412', tint: '#ffedd5' },
}

export default function CandidateWatchPage() {
  const cal = data.electionCalendar
  const races = data.races as { office: string; candidates: Candidate[] }[]

  return (
    <PageShell
      title="2026 Candidate Watch"
      subtitle="Who's on the ballot for Riverhead Town office this November — with each candidate's campaign links and, in their own words, what they're running on."
    >
      {races.map((race) => (
        <section key={race.office} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 style={{ color: '#284a69', margin: 0 }}>{race.office}</h2>
            <span style={{ color: '#64748b', fontWeight: 700, fontSize: 14 }}>
              1 seat · {race.candidates.length} candidates · Election Nov 3, 2026
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, alignItems: 'start' }}>
            {race.candidates.map((c) => {
              const p = PARTY[c.party] ?? { name: c.party, color: '#64748b', tint: '#f1f5f9' }
              return (
                <article key={c.name} style={{ ...card, borderTop: `6px solid ${p.color}`, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px 14px' }}>
                    <div style={{ fontSize: 21, fontWeight: 900, color: '#284a69', lineHeight: 1.2 }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ background: c.incumbent ? '#284a69' : '#eef3f8', color: c.incumbent ? 'white' : '#284a69', border: '1px solid #284a69', fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                        {c.incumbent ? 'Incumbent' : 'Challenger'}
                      </span>
                      <span style={{ background: p.tint, color: p.color, fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                        {p.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <a href={c.website} target="_blank" rel="noreferrer" style={{ background: '#284a69', color: 'white', padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        Campaign site ↗
                      </a>
                      {c.socialMedia.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ background: 'white', color: '#284a69', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                          {s.platform} ↗
                        </a>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '0 20px 16px' }}>
                    <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>{c.background}</p>
                    <div style={{ color: '#284a69', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>What they say they'll do</div>
                    <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.5, margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                      {c.platform.map((pl) => (
                        <li key={pl}>{pl}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Sources: {c.sources.join(' · ')}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Key dates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <DateItem label="Primary" value={cal.primary} highlight />
          <DateItem label="General election" value={cal.generalElection} highlight />
          <DateItem label="Filing — major parties" value={cal.filingDeadlineMajorParties} />
          <DateItem label="Filing — independents" value={cal.filingDeadlineIndependents} />
          <DateItem label="Filing — other parties" value={cal.filingDeadlineOtherParties} />
        </div>
      </section>

      <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderLeft: '6px solid #c2410c', borderRadius: 12, padding: '14px 16px', color: '#7c2d12', fontSize: 14, lineHeight: 1.6 }}>
        <strong>Only the Supervisor seat is on this ballot.</strong> {data.noRaceNote}
      </div>
    </PageShell>
  )
}

function DateItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? '#eef3f8' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: '#284a69', fontWeight: 800, marginTop: 3 }}>{value}</div>
    </div>
  )
}
