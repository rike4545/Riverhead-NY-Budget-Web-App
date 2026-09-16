import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import RecordTrail from '../../components/RecordTrail'
import LineChart from '../../components/charts/LineChart'
import BarRows from '../../components/charts/BarRows'
import {
  agency, crime, spending, joined, indexed, sinceBase, BASE_YEAR, latest,
  composition, peersComparable, peersPartial, adoptedBeyondCrimeData, completeYears, longRun,
  method, sources, dataLimits, workSession, caution, peersHavePopulation,
  rateComparison, rateCaveat, perResident, whyOwnDepartment, policeDistrict,
} from '../../lib/police-crime'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const num = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
const pct = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(0)}%`)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const SPEND = 'var(--rbl-series-blue)'
const CRIME = 'var(--rbl-series-gold)'

export const metadata = {
  title: 'Police spending and reported crime — Riverhead',
  description:
    'What the Town of Riverhead appropriates for its Police Department, next to the Index Crime its department reports to New York State — two public series, shown separately and compared on a common base.',
}

export default function PoliceCrimePage() {
  const years = joined.map((j) => String(j.year))
  const longCrime = completeYears

  return (
    <PageShell
      title="Police spending and reported crime"
      subtitle="What the Town appropriates for its Police Department, next to the Index Crime the department reports to New York State — shown as two series, not one line arguing with itself."
    >
      <PlainCallout
        tips={[
          { label: 'Index Crime', text: 'the FBI’s seven-offence definition — murder, rape, robbery, aggravated assault, burglary, larceny, motor-vehicle theft. It is what New York State publishes by agency, and it is far from everything a police department does.' },
          { label: 'Self-reported', text: 'the counts come from the department itself. A change in how incidents are recorded moves the line without anything changing on the street.' },
          { label: 'Adopted, not spent', text: 'the dollars are adopted appropriations. Police overtime in particular routinely runs above the adopted line.' },
          { label: 'Why no single chart', text: 'dollars and crime counts have nothing to do with each other numerically. Drawing them on one axis with two scales is the oldest way to make two unrelated lines look related, so this page does not.' },
        ]}
      >
        Between <strong>{BASE_YEAR}</strong> and <strong>{latest?.year}</strong>, Riverhead’s Police appropriation rose{' '}
        <strong>{pct(sinceBase.spendingPct)}</strong> and the Index Crime the department reported rose{' '}
        <strong>{pct(sinceBase.crimePct)}</strong> — almost all of it property crime, and almost all of that larceny.
        Violent crime over the same years moved <strong>{pct(sinceBase.violentPct)}</strong>.
        {longRun && (
          <>
            {' '}That is the short view, and on its own it misleads. Over the full series the direction is the other way:
            Riverhead recorded <strong>{num(longRun.peakTotal)}</strong> index crimes in <strong>{longRun.peakYear}</strong> and{' '}
            <strong>{num(longRun.latestTotal)}</strong> in <strong>{longRun.latestYear}</strong> —{' '}
            <strong>{Math.round(longRun.shareOfPeak * 100)}%</strong> of the peak. Today&apos;s count is a recovery from a
            pandemic trough inside a long decline, not a break from it.
          </>
        )}
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-warn)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Read this before the charts</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{caution}</p>
      </section>

      {/* Indexed comparison — the only honest way to put them on one axis */}
      <section style={{ ...card, marginBottom: 18 }}>
        <LineChart
          title={`Both series rebased to ${BASE_YEAR} = 100`}
          lede={`The only defensible way to show dollars and crime counts on a single axis is to stop showing dollars and crime counts — index each to its own starting value and compare the growth. The base is ${BASE_YEAR}, not 2020: Riverhead recorded ${num(joined[0]?.totalIndexCrimes ?? 0)} index crimes in the pandemic year, far below every year around it, and anchoring to that would manufacture a crime surge out of a return to normal. 2020 is still plotted below in the raw charts.`}
          source={`${sources[0].title}; Town of Riverhead adopted budgets`}
          categories={indexed.map((i) => String(i.year))}
          series={[
            { label: 'Police appropriation', color: SPEND, values: indexed.map((i) => i.spending) },
            { label: 'Reported Index Crime', color: CRIME, values: indexed.map((i) => i.crime) },
          ]}
          format={(n) => n.toFixed(0)}
        />
      </section>

      {/* The raw series, each on its own axis, which is the honest version */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(420px,100%),1fr))', gap: 16, marginBottom: 18 }}>
        <section style={card}>
          <LineChart
            title="Police appropriation, adopted budget"
            lede="Summed from every account-level line item in the Police department of the General Fund."
            source="Town of Riverhead adopted budgets, account-level detail"
            categories={spending.map((s) => String(s.year))}
            series={[{ label: 'Appropriation', color: SPEND, values: spending.map((s) => s.appropriation), area: true }]}
            format={(n) => `$${(n / 1_000_000).toFixed(1)}M`}
          />
          {adoptedBeyondCrimeData && (
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '10px 0 0' }}>
              The budget runs ahead of the crime data. {adoptedBeyondCrimeData.year} is adopted at{' '}
              <strong>{usd(adoptedBeyondCrimeData.appropriation)}</strong>; the State’s series ends at {latest?.year}, so the
              last {adoptedBeyondCrimeData.year - (latest?.year ?? 0)} budget years have no crime figure to sit beside yet.
            </p>
          )}
        </section>

        <section style={card}>
          <LineChart
            title={`Reported Index Crime, ${agency}`}
            lede={`Every complete annual count the State publishes for this agency, ${longRun?.firstYear ?? ''} to ${longRun?.latestYear ?? ''}. The State only began recording a months-reported figure in ${longRun?.monthsReportedFrom ?? 2002}; before that the column is empty for every agency, which means the column was not kept, not that the year was partial.`}
            source={sources[0].title}
            categories={longCrime.map((c) => String(c.year))}
            series={[{ label: 'Index crimes', color: CRIME, values: longCrime.map((c) => c.total), area: true }]}
            format={(n) => num(n)}
          />
          {composition && (
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '10px 0 0' }}>
              In {composition.year}, <strong>{num(composition.larceny ?? 0)}</strong> of the{' '}
              <strong>{num(composition.total)}</strong> index crimes were larceny —{' '}
              {Math.round((composition.larcenyShare ?? 0) * 100)}% of the total. Violent offences were{' '}
              <strong>{num(composition.violent ?? 0)}</strong>. When this total moves, larceny is usually what moved.
            </p>
          )}
        </section>
      </div>

      {/* Why Riverhead has a police budget line at all */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Why Riverhead has a police budget at all</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 10px' }}>
          Riverhead polices itself because it declined to hand the job to the county. After New York passed the{' '}
          <strong>{whyOwnDepartment.enablingLegislation}</strong> legislation creating Suffolk&apos;s county-executive
          government, a referendum put a county police force to the towns. The five western towns —{' '}
          {whyOwnDepartment.joinedCountyDistrict.join(', ')} — voted to join. The five eastern towns —{' '}
          {whyOwnDepartment.keptOwnDepartment.join(', ')} — kept their own. The Suffolk County Police Department began
          operating on <strong>{whyOwnDepartment.countyDepartmentBegan}</strong>, and the split has held ever since.
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65, margin: '0 0 10px' }}>
          {whyOwnDepartment.whyItMatters}
        </p>
        {policeDistrict && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10, margin: '0 0 12px' }}>
            <Figure label="Policed by the county" value={`${(policeDistrict.countyPolicedShare * 100).toFixed(1)}%`} sub={`${num(policeDistrict.countyPolicedPopulation)} of ${num(policeDistrict.countyPopulation)} residents`} />
            <Figure label="In a town that polices itself" value={num(policeDistrict.eastEndPopulation)} sub={`${policeDistrict.townsCounted.length} East End towns, Shelter Island included`} />
            <Figure label="Riverhead's share of that" value={`${((perResident?.population ?? 0) / policeDistrict.eastEndPopulation * 100).toFixed(0)}%`} sub={`${num(perResident?.population ?? 0)} residents`} />
          </div>
        )}
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '0 0 8px' }}>
          {whyOwnDepartment.sourcing}
        </p>
        <div style={{ display: 'grid', gap: 4 }}>
          {whyOwnDepartment.sources.map((src) => (
            <a key={src.url} href={src.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 12.8, textDecoration: 'none' }}>
              {src.title} ↗
              <span style={{ marginLeft: 6, color: 'var(--rbl-text-faint)', fontWeight: 600 }}>
                {src.kind === 'secondary' ? 'secondary' : 'primary, not published machine-readably'}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Peers */}
      <section style={{ ...card, marginBottom: 18 }}>
        {rateComparison && (
          <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 14 }}>
              Riverhead reports {rateComparison.multipleOfNearest.toFixed(1)}× the rate of the next East End town
            </strong>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 13.6, lineHeight: 1.6, margin: '5px 0 0' }}>
              In {rateComparison.year} Riverhead recorded <strong>{rateComparison.riverheadPer10k} index crimes per
              10,000 residents</strong>, against {rateComparison.nearestPer10k} for{' '}
              {rateComparison.nearestAgency.replace(' Town PD', '').replace(' PD', '')} and a peer average of{' '}
              {rateComparison.peerMean.toFixed(1)}. Counts alone hide this: Southampton has close to double Riverhead&apos;s
              population and reports half the index crime.
            </p>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '8px 0 0' }}>{rateCaveat}</p>
          </div>
        )}
        <BarRows
          title={`Reported Index Crime across the East End, ${peersComparable[0]?.year ?? ''}`}
          lede={`Every other town police department in Suffolk County — not a selection of nearby ones, the complete set, because the western towns have no town police department to compare. Only agencies reporting a full twelve months are shown: a partial year is not a smaller number, it is an incomplete one.${peersHavePopulation ? '' : ' These are raw counts, not rates.'}`}
          source={sources[0].title}
          rows={peersComparable.map((p) => ({
            label: p.agency.replace(' Town PD', '').replace(' PD', ''),
            value: (peersHavePopulation ? p.per10k : p.total) ?? 0,
            display: peersHavePopulation && p.per10k != null ? `${p.per10k} per 10k` : num(p.total ?? 0),
            note: peersHavePopulation && p.population
              ? `${num(p.total ?? 0)} crimes · ${num(p.population)} residents`
              : `${num(p.violent ?? 0)} violent · ${num(p.property ?? 0)} property`,
            highlight: p.isRiverhead,
          }))}
          format={(n) => num(n)}
        />
        {perResident && (
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '12px 0 0' }}>
            For scale on the other series: the {perResident.year} adopted Police appropriation of{' '}
            <strong>{usd(perResident.appropriation)}</strong> across <strong>{num(perResident.population)}</strong> residents
            is <strong>{usd(perResident.dollarsPerResident)}</strong> per resident per year. Peer police budgets are not
            published in a comparable machine-readable form, so that figure stands alone rather than in a league table.
          </p>
        )}
        {!peersHavePopulation && (
          <p style={{ color: 'var(--rbl-warn)', fontSize: 12.8, lineHeight: 1.55, margin: '12px 0 0', fontWeight: 600 }}>
            Read these as counts, not as risk. The East End towns differ substantially in size, and a bar that is twice as
            long can mean twice the crime, twice the people, or twice the reporting. Turning counts into a rate per 10,000
            residents needs Census population, which this build did not have — the parser computes it automatically the
            moment the key is available, rather than this page carrying a population figure typed in by hand.
          </p>
        )}
        {peersPartial.length > 0 && (
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '12px 0 0' }}>
            Left out for incomplete reporting:{' '}
            {peersPartial.map((p) => `${p.agency} (${p.monthsReported} months)`).join(', ')}. Their totals are real but not
            comparable to a full year, and scaling them up would be inventing data.
          </p>
        )}
      </section>

      {/* The ratio, framed hard */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Dollars per reported index crime</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
          This is arithmetic, not a performance measure, and it is included because someone will work it out anyway — better
          with the caveat attached than without. A department that prevents a crime records fewer of them, which moves this
          number the wrong way. It says nothing about whether the Town is getting value.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: 'right' }}>Appropriation</th>
                <th style={{ ...th, textAlign: 'right' }}>Index crimes</th>
                <th style={{ ...th, textAlign: 'right' }}>Violent</th>
                <th style={{ ...th, textAlign: 'right' }}>Per reported crime</th>
              </tr>
            </thead>
            <tbody>
              {joined.map((j) => (
                <tr key={j.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{j.year}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(j.appropriation)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{num(j.totalIndexCrimes ?? 0)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{num(j.violent ?? 0)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>
                    {j.dollarsPerReportedIndexCrime ? usd(j.dollarsPerReportedIndexCrime) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The monthly report the Board actually sees */}
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the Board sees, and in what form</h3>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{workSession.note}</p>
        <a href={workSession.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
          {workSession.title} ↗
        </a>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this cannot tell you</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
          {dataLimits.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, margin: '12px 0 0' }}>{method}</p>
        <div style={{ marginTop: 10, display: 'grid', gap: 5 }}>
          {sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              {s.title} ↗
            </a>
          ))}
          {sources[0].dashboard && (
            <a href={sources[0].dashboard} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              New York State’s own Index Crimes dashboard ↗
            </a>
          )}
        </div>
      </section>

      <RecordTrail
        title="Follow this into the budget"
        intro="Police is the largest single department in the General Fund, so what happens here moves the levy more than anything else on this site."
        items={[
          { href: '/funds/A01/', label: 'General Fund detail', text: 'Every Police line item in the adopted budget, account by account.' },
          { href: '/payroll/', label: 'Payroll', text: 'What the department’s people are actually paid, by name and title.' },
          { href: '/buyout/', label: '2026 Buyout', text: 'Seven sworn retirements accepted since July, and what refilling those seats costs.' },
          { href: '/predict-2027/', label: '2027 Prediction', text: 'How police payroll and contractual steps land on next year’s levy.' },
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

const th = { padding: '8px 10px' } as const
const td = { padding: '9px 10px' } as const
