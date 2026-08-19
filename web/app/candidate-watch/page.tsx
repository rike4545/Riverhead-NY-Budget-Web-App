import PageShell from '../../components/PageShell'
import data from '../../public/data/candidate-watch.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

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
  D: { name: 'Democrat', color: 'var(--rbl-info-text)', tint: 'var(--rbl-info-bg)' },
  R: { name: 'Republican', color: 'var(--rbl-danger)', tint: 'var(--rbl-danger-bg)' },
  'R/C': { name: 'Republican · Conservative', color: 'var(--rbl-danger)', tint: 'var(--rbl-danger-bg)' },
  C: { name: 'Conservative', color: 'var(--rbl-warn-strong)', tint: 'var(--rbl-warn-bg)' },
}

export default function CandidateWatchPage() {
  const cal = data.electionCalendar
  const races = data.races as { office: string; candidates: Candidate[] }[]

  return (
    <PageShell
      title="2026 Candidate Watch"
      subtitle="Who's on the ballot for Riverhead Town office this November — with each candidate's campaign links and, in their own words, what they're running on."
    >
      <div style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-teal)', background: 'var(--rbl-teal-bg)' }}>
        <strong style={{ color: 'var(--rbl-teal)' }}>Want the numbers behind the promises?</strong>{' '}
        <span style={{ color: 'var(--rbl-teal-strong)', fontSize: 14.5, lineHeight: 1.6 }}>
          This page is each candidate in their own words. For an even-handed cost–benefit look at every plank — plus a
          non-partisan fiscal view of the Town&apos;s repeated tax increases — see{' '}
          <a href={`${base}/candidate-cost-benefit/`} style={{ color: 'var(--rbl-teal)', fontWeight: 800 }}>Candidate Proposals: Cost &amp; Benefit</a>.
        </span>
      </div>

      {races.map((race) => (
        <section key={race.office} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 style={{ color: 'var(--rbl-title)', margin: 0 }}>{race.office}</h2>
            <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 700, fontSize: 14 }}>
              1 seat · {race.candidates.length} candidates · Election Nov 3, 2026
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, alignItems: 'start' }}>
            {race.candidates.map((c) => {
              const p = PARTY[c.party] ?? { name: c.party, color: 'var(--rbl-text-muted)', tint: 'var(--rbl-surface-3)' }
              return (
                <article key={c.name} style={{ ...card, borderTop: `6px solid ${p.color}`, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px 14px' }}>
                    <div style={{ fontSize: 21, fontWeight: 900, color: 'var(--rbl-title)', lineHeight: 1.2 }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ background: c.incumbent ? 'var(--rbl-fill-brand)' : 'var(--rbl-surface-2)', color: c.incumbent ? 'white' : 'var(--rbl-title)', border: '1px solid var(--rbl-fill-brand)', fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                        {c.incumbent ? 'Incumbent' : 'Challenger'}
                      </span>
                      <span style={{ background: p.tint, color: p.color, fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                        {p.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <a href={c.website} target="_blank" rel="noreferrer" style={{ background: 'var(--rbl-fill-brand)', color: 'white', padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        Campaign site ↗
                      </a>
                      {c.socialMedia.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ background: 'var(--rbl-surface)', color: 'var(--rbl-title)', border: '1px solid var(--rbl-border-strong)', padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                          {s.platform} ↗
                        </a>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '0 20px 16px' }}>
                    <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>{c.background}</p>
                    <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>What they say they'll do</div>
                    <ul style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.5, margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                      {c.platform.map((pl) => (
                        <li key={pl}>{pl}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ padding: '10px 20px', borderTop: '1px solid var(--rbl-border-subtle)', background: 'var(--rbl-surface-2)' }}>
                    <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>Sources: {c.sources.join(' · ')}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Key dates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <DateItem label="Primary (held)" value={cal.primary} />
          <DateItem label="General election" value={cal.generalElection} highlight />
          <DateItem label="Filing — major parties" value={cal.filingDeadlineMajorParties} />
          <DateItem label="Filing — independents" value={cal.filingDeadlineIndependents} />
          <DateItem label="Filing — other parties" value={cal.filingDeadlineOtherParties} />
        </div>
      </section>

      <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-warn)', borderRadius: 12, padding: '14px 16px', color: 'var(--rbl-warn-strong)', fontSize: 14, lineHeight: 1.6 }}>
        <strong>Only the Supervisor seat is on this ballot.</strong> {data.noRaceNote}
      </div>
    </PageShell>
  )
}

function DateItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? 'var(--rbl-surface-2)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontWeight: 800, marginTop: 3 }}>{value}</div>
    </div>
  )
}
