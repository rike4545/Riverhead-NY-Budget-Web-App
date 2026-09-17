import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import RecordTrail from '../../components/RecordTrail'
import {
  resolution, officers, costHistory, perOfficer, positions,
  fundingPaths, theBind, whatWouldSettleIt, sources, notLawYet, unenactedPaths, whoElseHasThisArgument,
  countyProgram, nobodyPublishesTheMoney,
} from '../../lib/school-resource-officers'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '9px 10px' } as const

export const metadata = {
  title: 'Who pays for the school resource officers — Riverhead',
  description:
    'The Town Board tabled the renewal of Riverhead’s school resource officer agreement over who pays. Every funding route proposed — two state bills, federal school-safety money, and the COPS Hiring Program — laid out by who each one actually pays.',
}

export default function SchoolResourceOfficersPage() {
  const latest = costHistory[costHistory.length - 1]
  const first = costHistory[0]
  const paysTown = fundingPaths.filter((p) => p.paysTheTown)

  return (
    <PageShell
      title="Who pays for the school resource officers"
      subtitle="Two police officers work in Riverhead Central School District buildings. On September 15 the Town Board tabled the agreement that renews them — not because anyone wants the program to end, but because nobody can agree whose taxpayers should carry it."
    >
      <PlainCallout
        tips={[
          { label: 'What an SRO is', text: 'a sworn Riverhead police officer assigned to work inside school buildings. They are Town employees on the Town payroll, not school district staff.' },
          { label: 'What was tabled', text: 'a one-year renewal through June 30, 2027. Tabling it does not end the program — the officers are still working — it declines to sign this version of the deal.' },
          { label: 'Why it is hard', text: 'the officers are paid out of the Police department, so no budget line anywhere shows what the program costs or what the district pays back.' },
          { label: 'Where the numbers come from', text: 'press reporting of the Board’s own discussion. The Town publishes no SRO line and does not publish the agreement, so these are the only figures in the public record.' },
        ]}
      >
        The program runs about <strong>{usd(costHistory[1].total)}</strong> a year for <strong>{officers}</strong> officers —
        roughly <strong>{usd(perOfficer)}</strong> each. The school district’s share has gone from{' '}
        <strong>{Math.round((first.district / first.total) * 100)}%</strong> to a proposed{' '}
        <strong>{Math.round((latest.district / latest.total) * 100)}%</strong>, and the argument is about the rest.
      </PlainCallout>

      {/* The record */}
      {resolution && (
        <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-warn)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the record shows</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px' }}>
            Resolution <strong>{resolution.number}</strong>, {resolution.meetingDate}:{' '}
            <em>{resolution.title}</em>
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <Chip label={`Vote: ${resolution.tag ?? (resolution.adopted ? 'adopted' : 'not adopted')}`} tone="warn" />
            <Chip label={`Town says: fiscal impact ${resolution.townFiscalImpact}`} tone="info" />
            <Chip label={`Treatment: ${resolution.townTreatment}`} tone="plain" />
          </div>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.2, lineHeight: 1.55, margin: 0 }}>
            The Town answered <strong>Yes</strong> on its own fiscal-impact statement and called the cost{' '}
            <strong>absorbed by the existing budget</strong>. Absorbed is doing a lot of work there: the money comes out of
            the Police department, which is the largest single department in the General Fund, and the statement names no
            figure at all.
          </p>
        </section>
      )}

      {/* The split */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How the split has moved</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>School year</th>
                <th style={{ ...th, textAlign: 'right' }}>Program cost</th>
                <th style={{ ...th, textAlign: 'right' }}>School district</th>
                <th style={{ ...th, textAlign: 'right' }}>Town</th>
                <th style={{ ...th, textAlign: 'right' }}>Town share</th>
              </tr>
            </thead>
            <tbody>
              {costHistory.map((y) => (
                <tr key={y.schoolYear} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>
                    {y.schoolYear}
                    <div style={{ fontSize: 11.5, color: 'var(--rbl-text-muted)', fontWeight: 500, maxWidth: 260 }}>{y.note}</div>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.total)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(y.district)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(y.town)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: y.town / y.total > 0.5 ? 'var(--rbl-warn)' : 'var(--rbl-text-body)' }}>
                    {Math.round((y.town / y.total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '12px 0 0' }}>
          Figures as reported, and approximate. For scale, a top-step Riverhead police officer is authorized at{' '}
          <a href={`${base}/payroll/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>$152,901</a> for 2026 —
          so {usd(perOfficer)} an officer is roughly salary plus the benefits and overtime that ride on it.
        </p>
      </section>

      {/* Positions */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the Board said</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {positions.map((p) => (
            <div key={p.who} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 13.5 }}>{p.who}</div>
              <blockquote style={{ margin: '5px 0', color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.55, fontStyle: 'italic' }}>
                “{p.quote}”
              </blockquote>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.5 }}>on {p.on}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The funding paths — the part that decides it */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Every funding route, and who it actually pays</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
          Four sources came up in the debate. <strong>{paysTown.length} of the {fundingPaths.length}</strong> would pay the
          Town, and <strong>{unenactedPaths.length}</strong> are not law at all. Those two facts explain most of the
          disagreement, and both are checkable against the bills themselves.
        </p>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.6 }}>Neither state bill is law</strong>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.3, lineHeight: 1.6, margin: '4px 0 0' }}>{notLawYet}</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {fundingPaths.map((f) => (
            <article key={f.name} style={{
              border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '13px 15px',
              borderLeft: `5px solid ${f.paysTheTown ? 'var(--rbl-success-strong)' : 'var(--rbl-border-strong)'}`,
              background: 'var(--rbl-surface-2)',
            }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 4 }}>
                <a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 14.5, textDecoration: 'none' }}>
                  {f.name} ↗
                </a>
                <Chip label={f.paysTheTown ? 'Pays the Town' : `Pays the ${f.paysWhom}`} tone={f.paysTheTown ? 'good' : 'plain'} />
                {!f.enacted && <Chip label="Not law" tone="warn" />}
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginBottom: 6 }}>
                {f.authority} · {f.status}
              </div>
              <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.6, margin: '0 0 6px' }}>{f.what}</p>
              <p style={{ color: f.paysTheTown ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)', fontSize: 13.2, lineHeight: 1.6, margin: 0, fontWeight: f.paysTheTown ? 600 : 500 }}>
                {f.catch}
              </p>
            </article>
          ))}
        </div>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>The bind</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.8, lineHeight: 1.65, margin: '5px 0 0' }}>{theBind}</p>
        </div>
      </section>

      {/* Who else has this argument at all */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How other districts handle it — and why most of the county can’t</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 14px' }}>
          Most of Suffolk does not have this argument, because most of Suffolk has no town police department to argue
          about. The county split in 1960 and it still decides who sits at the table.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14 }}>Policed by the county</div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, margin: '3px 0 7px' }}>
              {whoElseHasThisArgument.countyPoliced.towns.join(', ')}
            </div>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.3, lineHeight: 1.6, margin: '0 0 7px' }}>{whoElseHasThisArgument.countyPoliced.how}</p>
            <p style={{ color: 'var(--rbl-warn)', fontSize: 13.2, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{whoElseHasThisArgument.countyPoliced.allocation}</p>
          </div>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-accent-border)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14 }}>Towns that police themselves</div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, margin: '3px 0 7px' }}>
              {whoElseHasThisArgument.ownForce.towns.join(', ')}
            </div>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.3, lineHeight: 1.6, margin: '0 0 7px' }}>{whoElseHasThisArgument.ownForce.how}</p>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '0 0 7px' }}>{whoElseHasThisArgument.ownForce.allocation}</p>
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.55, margin: 0 }}>{whoElseHasThisArgument.ownForce.southampton}</p>
          </div>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.9, lineHeight: 1.6, margin: '14px 0 0' }}>
          <strong>What this page cannot tell you yet.</strong> {whoElseHasThisArgument.whatIsNotSourced}
        </p>
      </section>

      {/* The county runs one — and publishes no money */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The county runs its own program, and stops at the district line</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 12px' }}>
          Suffolk&apos;s Community Relations Bureau publishes an SRO roster. The department, in its own words,{' '}
          <a href={countyProgram.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, textDecoration: 'none' }}>
            “{countyProgram.quote}” ↗
          </a>{' '}
          — the police district, which is the five western towns. Riverhead is not in it. That is why the Town cannot
          simply be served by county SROs the way a Brookhaven or Islip district can, and why it is negotiating over its
          own officers at all.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10, marginBottom: 12 }}>
          <Figure label="County SROs" value={String(countyProgram.total)} sub={`${countyProgram.precinctTotal} across ${countyProgram.precincts.length} precincts · ${countyProgram.countywide} countywide`} />
          <Figure label="Population they cover" value={countyProgram.districtPopulation ? countyProgram.districtPopulation.toLocaleString() : '—'} sub="residents of the police district" />
          <Figure label="Riverhead SROs" value={String(officers)} sub="for a town of 35,826" />
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '0 0 12px' }}>{countyProgram.scaleCaveat}</p>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 13.8 }}>What the county does count</strong>
          <div style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th style={th}>Period</th>
                  <th style={{ ...th, textAlign: 'right' }}>SRO arrests</th>
                  <th style={{ ...th, textAlign: 'right' }}>All SCPD arrests</th>
                  <th style={{ ...th, textAlign: 'right' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {countyProgram.reformReport.arrests.map((a) => (
                  <tr key={a.period} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>{a.period}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{a.sro}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{a.allScpd.toLocaleString()}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{((a.sro / a.allScpd) * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: 0 }}>{countyProgram.reformReport.reading}</p>
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 13.8 }}>What the county put in writing — and what it left out</strong>
          <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.3, lineHeight: 1.6, margin: '5px 0 6px' }}>
            {countyProgram.jobDescription.what} <strong>{countyProgram.jobDescription.notAnMou}</strong> Its first duty is that an
            officer “{countyProgram.jobDescription.topDuty}”.
          </p>
          <p style={{ color: 'var(--rbl-warn)', fontSize: 13.2, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            Silent on: {countyProgram.jobDescription.silentOn} And a COPS Hiring Program award requires a <em>signed
            memorandum of understanding</em> with the school partner — which both parties have said this document is not.
          </p>
        </div>

        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>Nobody publishes the money</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.8, lineHeight: 1.65, margin: '5px 0 0' }}>{nobodyPublishesTheMoney}</p>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What would settle it</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65, paddingLeft: 20, margin: 0 }}>
          {whatWouldSettleIt.map((w, i) => <li key={i} style={{ marginBottom: 7 }}>{w}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {sources.map((s) => (
            <div key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.4, textDecoration: 'none' }}>{s.title} ↗</a>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.5 }}>{s.covers}</div>
            </div>
          ))}
        </div>
      </section>

      <RecordTrail
        title="Follow this into the budget"
        intro="The officers are paid out of the Police department, so the SRO question is a General Fund question."
        items={[
          { href: '/police-crime/', label: 'Police Spending & Crime', text: 'What the department costs and what it reports, next to the East End towns that also police themselves.' },
          { href: '/funds/A01/', label: 'General Fund detail', text: 'Every Police line item in the adopted budget — none of which is labeled SRO.' },
          { href: '/meetings/?meeting=2026-09-15', label: 'Town Board Record', text: 'The September 15 meeting where the renewal was tabled.' },
          { href: '/predict-2027/', label: '2027 Prediction', text: 'How police payroll lands on next year’s levy.' },
        ]}
      />
    </PageShell>
  )
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: 'var(--rbl-title)' }}>{value}</strong>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.2, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Chip({ label, tone }: { label: string; tone: 'good' | 'warn' | 'info' | 'plain' }) {
  const map = {
    good: { bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)' },
    warn: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn-strong)' },
    info: { bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-info-text)' },
    plain: { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-body)' },
  }[tone]
  return (
    <span style={{ background: map.bg, color: map.fg, fontWeight: 800, fontSize: 11.5, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
