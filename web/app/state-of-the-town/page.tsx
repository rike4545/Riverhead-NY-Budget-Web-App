import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  addressCount, addressFormat, addressLaw, addressesAsOf, kindLabel, longDate, supervisors, termNote, yearMarks, yearsWithout,
  type AddressEvent,
} from '../../lib/supervisor-addresses'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const h3 = { margin: '14px 0 6px', color: 'var(--rbl-title)', fontSize: 18 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14 } as const

export const metadata = {
  title: 'State of the Town and inaugural addresses — what Riverhead’s Supervisors said',
  description: 'Why a Supervisor’s State of the Town and inaugural addresses matter, what the law does and does not require, and what each Riverhead Supervisor since 2010 did, with every source labelled.',
}

const marks = yearMarks()
const firstYear = marks[0].year
const lastYear = marks[marks.length - 1].year
const asOfLong = longDate(addressesAsOf)

function Sources({ e }: { e: AddressEvent }) {
  return (
    <ul style={{ margin: '6px 0 0', paddingLeft: 18, ...muted, lineHeight: 1.5 }}>
      {e.sources.map((s) => (
        <li key={s.url + s.title}>
          <span style={{ fontWeight: 600 }}>{kindLabel[s.kind]}:</span>{' '}
          <a href={s.url.startsWith('/') ? `${base}${s.url}` : s.url} style={link}>{s.title}</a>
        </li>
      ))}
    </ul>
  )
}

function Event({ label, e }: { label: string; e: AddressEvent }) {
  return (
    <div style={{ borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10, marginTop: 10 }}>
      <div style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>
        {label}: {longDate(e.date)}{e.where ? `, ${e.where}` : ''}
      </div>
      <p style={{ ...prose, margin: '4px 0 0' }}>{e.summary}</p>
      <Sources e={e} />
    </div>
  )
}

/** Years grouped by Supervisor: a filled square for a year with an address, a dashed one for none, and a ring under a year with a swearing-in. The groups wrap on a phone; the table below lists every year. */
function Timeline() {
  const groups: { name: string; years: typeof marks }[] = []
  for (const m of marks) {
    const last = groups[groups.length - 1]
    if (last && last.name === m.supervisor) last.years.push(m)
    else groups.push({ name: m.supervisor, years: [m] })
  }
  const surname = (n: string) => n.split(' ').slice(-1)[0]
  const box = { width: 26, height: 26, borderRadius: 4, boxSizing: 'border-box' } as const
  return (
    <div>
      <div role="img" aria-label={`Years ${firstYear} to ${lastYear}: a State of the Town address in ${addressCount} of ${marks.length} years. The table below lists each year.`}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.name} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '6px 4px 4px', background: 'var(--rbl-info-bg)' }}>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: 'var(--rbl-text-strong)', marginBottom: 6 }}>{surname(g.name)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 6 }}>
              {g.years.map((m) => (
                <div key={m.year} title={`${m.year}: ${m.address ? 'State of the Town address' : 'no address found'}${m.inaugural ? '; sworn in' : ''}`}
                  style={{ width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={m.address ? { ...box, background: 'var(--rbl-title)' } : { ...box, border: '1.5px dashed var(--rbl-text-muted)' }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', boxSizing: 'border-box', border: m.inaugural ? '3px solid var(--rbl-link)' : 'none' }} />
                  <span style={{ fontSize: 13, color: 'var(--rbl-text-body)' }}>{m.year}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', ...muted, marginTop: 10 }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: 'var(--rbl-title)', verticalAlign: '-2px' }} /> State of the Town address</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, border: '1.5px dashed var(--rbl-text-muted)', boxSizing: 'border-box', verticalAlign: '-2px' }} /> No address found</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '3px solid var(--rbl-link)', boxSizing: 'border-box', verticalAlign: '-2px' }} /> Sworn in (where this site found coverage)</span>
      </div>
    </div>
  )
}

export default function StateOfTheTownPage() {
  return (
    <PageShell
      title="State of the Town and inaugural addresses"
      subtitle={`Why these speeches matter, what the law asks of a Supervisor, and what each Riverhead Supervisor did from ${firstYear} to ${asOfLong}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Inaugural address', text: 'the remarks a Supervisor gives when sworn in, usually on January 1, setting out what they mean to do.' },
          { label: 'State of the Town', text: 'a yearly speech in which the Supervisor reports how the Town is doing and what comes next.' },
          { label: 'Annual financial report', text: 'the report on the Town’s money that State law does require the Supervisor to file each year.' },
        ]}
      >
        Riverhead had a State of the Town address in <strong>{addressCount} of the {marks.length} years</strong> from {firstYear} to{' '}
        {lastYear}. No State law requires one, or an inaugural speech: both are customs. This site found no address in{' '}
        {yearsWithout.join(', ')}. For {lastYear}, that is as of {asOfLong}.
      </PlainCallout>

      <section aria-labelledby="why-heading" style={card}>
        <h2 id="why-heading" style={h2}>Why these speeches matter</h2>
        <p style={prose}>
          An inaugural address is a Supervisor’s first public statement of goals. A State of the Town address is the moment, once a year,
          when the Supervisor tells residents in one place how the Town is doing and what they plan to do next. Together they give residents
          something to measure later votes and budgets against.
        </p>
        <p style={prose}>
          Neither speech is a financial statement, and neither is checked by anyone before it is given. A claim in a speech is a claim; the
          budget, the audited statements and the Town Board’s resolutions are the record. This site’s{' '}
          <a href={`${base}/supervisor-promises/`} style={link}>Supervisor’s Promises</a> page checks the current Supervisor’s claims that way.
        </p>
      </section>

      <section aria-labelledby="law-heading" style={card}>
        <h2 id="law-heading" style={h2}>What the law requires, and what it does not</h2>
        <h3 style={h3}>The Governor must give one</h3>
        <blockquote style={{ ...prose, borderLeft: '2px solid var(--rbl-border)', paddingLeft: 12, marginLeft: 0 }}>“{addressLaw.governor.text}”</blockquote>
        <p style={muted}><a href={addressLaw.governor.url} style={link}>{addressLaw.governor.cite}</a></p>
        <h3 style={h3}>A town supervisor must file a report, not give a speech</h3>
        <p style={prose}>{addressLaw.townReport.text}</p>
        <p style={muted}><a href={addressLaw.townReport.url} style={link}>{addressLaw.townReport.cite}</a>. The Town’s report is on this site’s{' '}
          <a href={`${base}/annual-report/`} style={link}>Annual Report</a> page.</p>
        <p style={{ ...prose, marginTop: 12 }}>{addressLaw.finding}</p>
      </section>

      <section aria-labelledby="tradition-heading" style={card}>
        <h2 id="tradition-heading" style={h2}>How the custom changed</h2>
        <p style={prose}>{addressFormat.before2018}</p>
        <p style={prose}>{addressFormat.change2018}</p>
        <p style={muted}>{kindLabel[addressFormat.source.kind]}: <a href={addressFormat.source.url} style={link}>{addressFormat.source.title}</a></p>
      </section>

      <section aria-labelledby="timeline-heading" style={card}>
        <h2 id="timeline-heading" style={h2}>Each year, {firstYear} to {lastYear}</h2>
        <p style={prose}>{termNote}</p>
        <Timeline />
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption style={{ textAlign: 'left', ...muted, paddingBottom: 6 }}>The same years as a table.</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              {['Year', 'Supervisor', 'State of the Town', 'Sworn in'].map((h) => (
                <th key={h} scope="col" style={{ padding: '6px 10px', textAlign: 'left', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600 }}>{m.year}</th>
                  <td style={{ padding: '5px 10px' }}>{m.supervisor}</td>
                  <td style={{ padding: '5px 10px' }}>{m.address ? 'Yes' : 'None found'}</td>
                  <td style={{ padding: '5px 10px' }}>{m.inaugural ? 'Yes' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 style={{ ...h2, margin: '24px 0 12px' }}>What each Supervisor did</h2>
      {[...supervisors].reverse().map((s) => (
        <section key={s.name} aria-labelledby={`sup-${s.inauguration.date}`} style={card}>
          <h3 id={`sup-${s.inauguration.date}`} style={{ ...h2, fontSize: 20 }}>{s.name} ({s.party}), {s.term}</h3>
          <Event label="Sworn in" e={s.inauguration} />
          {s.addresses.map((a) => <Event key={a.date} label="State of the Town" e={a} />)}
          {s.gaps.length ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--rbl-text-body)', lineHeight: 1.5 }}>
              {s.gaps.map((g) => <li key={g}>{g}</li>)}
            </ul>
          ) : null}
        </section>
      ))}

      <section aria-labelledby="concerns-heading" style={card}>
        <h2 id="concerns-heading" style={h2}>Likely concerns for residents</h2>
        <ul style={{ ...prose, paddingLeft: 18 }}>
          <li>No State of the Town address was found for {yearsWithout.filter((y) => y >= 2024).join(' or ')}. Residents have had no yearly
            account from the Supervisor in one place since April 2024. This site may have missed one; it would add any it is shown.</li>
          <li>The Town does not publish the text of these speeches. Most of what is known about them comes from news coverage, which is not a
            Town record, and from meeting video and machine transcripts, which can mishear words.</li>
          <li>A speech is not checked before it is given. Compare what a Supervisor says with the{' '}
            <a href={`${base}/budget-flow/`} style={link}>budget</a>, the <a href={`${base}/annual-report/`} style={link}>annual report</a>{' '}
            and the <a href={`${base}/board-votes/`} style={link}>Board’s votes</a>.</li>
        </ul>
        <p style={muted}>
          See also <a href={`${base}/town-history/`} style={link}>Supervisors and Council history</a> and{' '}
          <a href={`${base}/officials/`} style={link}>Elected officials and pensions</a>.
        </p>
      </section>
    </PageShell>
  )
}
