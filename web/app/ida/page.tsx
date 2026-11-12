import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { ABO_REVIEW, EXEMPTION_LABELS, IDA_FINANCES, hadBreaks, latestYear, totals, type ExemptionKey, type IdaData } from '../../lib/ida'
import data from '../../public/data/ida.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '75ch' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700, verticalAlign: 'bottom' } as const
const thr = { ...th, textAlign: 'right' } as const
const td = { padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
const tdr = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const millions = (n: number) => `$${(n / 1e6).toFixed(1)} million`
const num = (n: number) => Math.round(n).toLocaleString('en-US')
const date = (iso: string) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—')
const title = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bLlc\b/g, 'LLC').replace(/\bLp\b/g, 'LP').replace(/\bIi\b/g, 'II').replace(/\bIii\b/g, 'III').replace(/ (And|Of|The|For|At) /g, (m) => m.toLowerCase())

const d = data as unknown as IdaData
const t = totals(d)
const latest = latestYear(d)
const atlantis = d.projects.filter((p) => /atlantis/i.test(p.name)).reduce((s, p) => s + p.net, 0)
const top2 = d.projects.slice(0, 2)
const propertyRows: { key: ExemptionKey; pilot: number | null }[] = [
  { key: 'schoolProperty', pilot: t.pilotBy.school },
  { key: 'localProperty', pilot: t.pilotBy.local },
  { key: 'countyProperty', pilot: t.pilotBy.county },
  { key: 'localSales', pilot: null },
  { key: 'stateSales', pilot: null },
  { key: 'mortgageRecording', pilot: null },
]
const missedPromise = t.withBreaks - t.metPromise
/** The hospital's bond-only projects: their jobs are real but no tax break paid for them. */
const hospitalJobs = Math.max(...d.projects.filter((p) => !hadBreaks(p) && /hospital/i.test(p.name)).map((p) => p.jobsLatest))

export const metadata = {
  title: 'Industrial Development Agency tax breaks',
  description: `What the Riverhead Industrial Development Agency's ${t.projects} projects were spared in taxes, paid back in PILOTs and reported in jobs, ${t.firstYear} to ${t.lastYear}, from the agency's own reports to the State.`,
}

export default function IdaPage() {
  return (
    <PageShell
      title="Industrial Development Agency tax breaks"
      subtitle={`What the Riverhead IDA’s projects were spared in taxes, what they paid back, and the jobs they reported, ${t.firstYear} to ${t.lastYear}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Tax break', text: 'taxes a project did not have to pay because of its IDA deal: property tax, sales tax on construction and equipment, and mortgage recording tax.' },
          { label: 'PILOT', text: 'a “payment in lieu of taxes”: what a project pays instead of full property tax while its deal lasts.' },
          { label: 'Net tax break', text: 'the tax break minus the PILOTs paid. This is the part that went uncollected.' },
        ]}
      >
        The Riverhead Industrial Development Agency is a public benefit corporation, separate from the Town Board, that can give businesses tax
        breaks to build or expand here. Every year it reports each project to the State’s Authorities Budget Office: the taxes the project did not
        pay, the PILOTs it paid instead, and the jobs the company says it has. This page adds up those reports. The figures are the agency’s,
        not estimates of ours.
      </PlainCallout>

      <section style={card} aria-labelledby="totals">
        <h2 id="totals" style={h2}>Eight years in total</h2>
        <p style={prose}>
          From {t.firstYear} to {t.lastYear}, the agency reported {t.projects} projects. Together they were spared <strong>{millions(t.exemptions)}</strong> in
          taxes and paid <strong>{millions(t.pilots)}</strong> in PILOTs, so <strong>{millions(t.net)}</strong> went uncollected. In {latest.year} alone the
          net tax break was {millions(latest.net)}, across {latest.projectsWithBreaks} active projects.
        </p>
        <p style={prose}>
          Two projects account for {Math.round(((top2[0].net + top2[1].net) / t.net) * 100)}% of the total: {title(top2[0].name)} ({millions(top2[0].net)}) and {title(top2[1].name)} ({millions(top2[1].net)}).
          Projects named for Atlantis, the downtown aquarium and hotel, add up to {millions(atlantis)}.
        </p>
        <p style={{ ...help, margin: 0 }}>
          A tax break does not take money out of the Town’s budget. The Town sets its tax levy first, so property tax a project does not pay is spread
          across everyone else’s bills, or it is tax on a new building that might not exist without the deal. Which of the two applies is the
          question behind every IDA vote.
        </p>
      </section>

      <section style={card} aria-labelledby="who">
        <h2 id="who" style={h2}>Whose taxes, {t.firstYear} to {t.lastYear}</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 520 }}>
            <thead><tr><th scope="col" style={th}>Tax</th><th scope="col" style={thr}>Tax break</th><th scope="col" style={thr}>PILOTs paid back</th><th scope="col" style={thr}>Uncollected</th></tr></thead>
            <tbody>
              {propertyRows.map(({ key, pilot }) => (
                <tr key={key}>
                  <th scope="row" style={{ ...td, fontWeight: 600 }}>{EXEMPTION_LABELS[key]}</th>
                  <td style={tdr}>{usd(t.byType[key])}</td>
                  <td style={tdr}>{pilot === null ? <span style={help}>None</span> : usd(pilot)}</td>
                  <td style={tdr}>{usd(t.byType[key] - (pilot ?? 0))}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" style={{ ...td, fontWeight: 700 }}>Total</th>
                <td style={{ ...tdr, fontWeight: 700 }}>{usd(t.exemptions)}</td>
                <td style={{ ...tdr, fontWeight: 700 }}>{usd(t.pilots)}</td>
                <td style={{ ...tdr, fontWeight: 700 }}>{usd(t.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          The school districts carry the largest share: {millions(t.byType.schoolProperty - t.pilotBy.school)} of the {millions(t.net)}. The State’s data calls the
          Town’s share “local”. Sales and mortgage recording tax breaks are one-time savings on construction and financing, with no PILOT against them.
        </p>
      </section>

      <section style={card} aria-labelledby="net">
        <h2 id="net" style={h2}>Has it been a net gain or a net loss?</h2>
        <p style={prose}>
          The records cannot settle that, because the real question is what would have happened without each deal, and no record answers it. Here is
          what the records do show.
        </p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          <li>
            <strong>On the cost side:</strong> {millions(t.net)} in taxes went uncollected over eight years, about {millions(t.net / d.years.length)} a year.
            Just over half of it, {millions(t.byType.schoolProperty - t.pilotBy.school)}, was school tax.
          </li>
          <li>
            <strong>On the jobs side:</strong> the {t.withBreaks} projects that got tax breaks reported {num(t.jobsBefore)} jobs before their deals and {num(t.jobsLatest)} in
            their latest reports, a gain of {num(t.jobsLatest - t.jobsBefore)}. Together they had promised {num(t.jobsPromised)} new jobs.
          </li>
          <li>
            <strong>Promises:</strong> {t.metPromise} of the {t.withBreaks} reported reaching the number of new jobs they promised; {missedPromise} did not.
          </li>
          <li>
            <strong>{latest.year}:</strong> the active projects reported {num(latest.jobGain)} more jobs than before their deals, for a net tax break of
            {' '}{millions(latest.net)}{latest.netPerJob ? <>, about {usd(latest.netPerJob)} a year for each of those jobs</> : null}.
          </li>
        </ul>
        <p style={{ ...help, margin: 0 }}>
          Read the job figures with care. Each company reports its own count, and the State publishes it as reported, not audited. A job counted here
          may have moved from somewhere else on Long Island. The {t.bondOnly} projects with no tax break are left out of the job figures: for those, the
          agency only issued bonds. Peconic Bay Medical Center’s bonds alone came with {num(hospitalJobs)} reported jobs that no tax break paid for.
        </p>
      </section>

      <section style={card} aria-labelledby="years">
        <h2 id="years" style={h2}>Year by year</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 620 }}>
            <thead>
              <tr>
                <th scope="col" style={th}>Year</th><th scope="col" style={thr}>Projects with tax breaks</th><th scope="col" style={thr}>Tax break</th>
                <th scope="col" style={thr}>PILOTs paid</th><th scope="col" style={thr}>Uncollected</th><th scope="col" style={thr}>Jobs reported (before the deals)</th>
              </tr>
            </thead>
            <tbody>
              {d.years.map((y) => (
                <tr key={y.year}>
                  <th scope="row" style={{ ...td, fontWeight: 600 }}>{y.year}</th>
                  <td style={tdr}>{y.projectsWithBreaks}</td>
                  <td style={tdr}>{usd(y.exemptions)}</td>
                  <td style={tdr}>{usd(y.pilots)}</td>
                  <td style={tdr}>{usd(y.net)}</td>
                  <td style={tdr}>{num(y.ftesWithBreaks)} ({num(y.ftesBeforeWithBreaks)})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>Jobs are full-time equivalents at projects with tax breaks, as each company reported them that year.</p>
      </section>

      <section style={card} aria-labelledby="projects">
        <h2 id="projects" style={h2}>Every project in the State’s records</h2>
        <p style={prose}>
          All {t.projects} projects the agency reported from {t.firstYear} to {t.lastYear}, largest net tax break first. Amounts are the total over the years each
          project was reported.
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 900 }}>
            <thead>
              <tr>
                <th scope="col" style={th}>Project</th><th scope="col" style={th}>Approved</th><th scope="col" style={th}>Deal ends</th>
                <th scope="col" style={thr}>Tax break</th><th scope="col" style={thr}>PILOTs paid</th><th scope="col" style={thr}>Uncollected</th>
                <th scope="col" style={thr}>Jobs before</th><th scope="col" style={thr}>New jobs promised</th><th scope="col" style={thr}>Jobs, latest report</th>
              </tr>
            </thead>
            <tbody>
              {d.projects.map((p) => (
                <tr key={p.code}>
                  <th scope="row" style={{ ...td, fontWeight: 600 }}>
                    {title(p.name)}
                    <div style={{ ...help, fontSize: 13, fontWeight: 400 }}>{p.purpose}{hadBreaks(p) ? '' : `; bonds only (${usd(p.bondAmount)})`}. Reported {p.firstYear === p.lastYear ? p.firstYear : `${p.firstYear}–${p.lastYear}`}.</div>
                  </th>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{date(p.approved)}</td>
                  <td style={td}>{p.plannedEnd ?? '—'}</td>
                  <td style={tdr}>{usd(p.exemptions)}</td>
                  <td style={tdr}>{usd(p.pilots)}</td>
                  <td style={{ ...tdr, fontWeight: 700 }}>{usd(p.net)}</td>
                  <td style={tdr}>{num(p.jobsBefore)}</td>
                  <td style={tdr}>{num(p.jobsPromised)}</td>
                  <td style={tdr}>{num(p.jobsLatest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          Names are as the agency reported them. A deal can end before its last report or run past {t.lastYear}. Projects approved since {t.lastYear},
          including the pending application for the <a href={`${base}/town-square/`} style={link}>Town Square hotel</a>, are not in the State’s data yet.
          Older deals show only their years from {t.firstYear} on.
        </p>
      </section>

      <section style={card} aria-labelledby="agency">
        <h2 id="agency" style={h2}>The agency’s own money</h2>
        <p style={prose}>
          The IDA pays its way mostly with fees it charges when a project closes. Its audited statements show:
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 360, maxWidth: 520 }}>
            <thead><tr><th scope="col" style={th}>Year</th><th scope="col" style={thr}>Operating revenue</th><th scope="col" style={thr}>Operating expenses</th></tr></thead>
            <tbody>
              {IDA_FINANCES.years.map((y) => (
                <tr key={y.year}><th scope="row" style={{ ...td, fontWeight: 600 }}>{y.year}</th><td style={tdr}>{usd(y.revenue)}</td><td style={tdr}>{usd(y.expenses)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          In 2024, $251,489 of the revenue came from one project that closed that year. 2023 included a $135,875 transfer from the Riverhead IDA Economic
          Job Development Corporation, a related agency. Most of the spending is staff pay ($173,748 in 2024).
        </p>
      </section>

      <section style={card} aria-labelledby="oversight">
        <h2 id="oversight" style={h2}>Oversight</h2>
        <p style={prose}>
          In December 2024 the State’s Authorities Budget Office reviewed the agency’s website. RiverheadLOCAL reported that it found the website
          “does not meet the requirements of the State Public Authorities Law” and that committee meetings held by video had not followed the Open
          Meetings Law. The agency’s executive director answered that “almost all those corrective actions have been taken.” This is a news report:
          the review letter’s address on the State’s site no longer opens.
        </p>
      </section>

      <p style={{ ...help, margin: '0 0 16px' }}>
        Sources: <a href={d.source.url} style={link}>{d.source.title}</a>, {d.reports} project reports;{' '}
        <a href={IDA_FINANCES.source.url} style={link}>{IDA_FINANCES.source.title}</a>;{' '}
        <a href={ABO_REVIEW.url} style={link}>{ABO_REVIEW.title}</a>. Built by <code>etl/build_ida.py</code>.
      </p>
    </PageShell>
  )
}
