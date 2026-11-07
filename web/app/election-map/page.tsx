import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ElectionMap, { type MapContest, type MapPreset } from '../../components/ElectionMap'
import ColumnChart from '../../components/charts/ColumnChart'
import {
  boundarySource, boundaryUpdated, certified, comparisons, contestByKey, displayName, districts, elections, fetchedOn, finalSource, historyName,
  historyParty, leader, ledCount, MAP_H, MAP_W, resultsSource, shift, supervisorHistory, turnoutHistory,
} from '../../lib/election-map'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const num = (n: number) => n.toLocaleString('en-US')
const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const counted = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n)

export const metadata = {
  title: 'Election map — how each Riverhead district voted',
  description: "Riverhead's 22 election districts, colored by how each voted from 2013 to 2026, from Supervisor to President, with any two candidates compared district by district, and turnout since 2013.",
}

const HALPIN = 'Jerome Halpin'
const ROTHWELL = 'Kenneth T Rothwell'
const HUBBARD = 'Timothy C Hubbard'
const HARRIS = 'Kamala D Harris AND Tim Walz'
const TRUMP = 'Donald J Trump AND JD Vance'
const JENS_SMITH = 'Laura M Jens-Smith'

export default function ElectionMapPage() {
  const sup26 = contestByKey.get('supervisor-2026')!
  const sup25 = contestByKey.get('supervisor-2025')!
  const gov26 = contestByKey.get('governor-2026')!
  const v = (c: typeof sup26, name: string) => c.candidates.find((x) => x.name === name)?.votes ?? 0
  const [vs2025, vsHochul, vsHarris] = comparisons
  const pres24 = contestByKey.get('president-2024')!
  const trumpLed = ledCount(pres24, TRUMP), harrisLed = ledCount(pres24, HARRIS)
  const aheadOfHarris = districts.filter((d) => shift(vsHarris, d.ed) > 0).length
  const sup17 = contestByKey.get('supervisor-2017')!
  const sup17Share = v(sup17, JENS_SMITH) / sup17.total
  const share = (c: typeof sup26, ed: string, name: string) => (c.districts[ed].total ? (c.districts[ed].votes[name] ?? 0) / c.districts[ed].total : 0)
  const halpinOverJS = districts.filter((d) => share(sup26, d.ed, HALPIN) > share(sup17, d.ed, JENS_SMITH)).length
  const halpinLed26 = ledCount(sup26, HALPIN), rothwellLed26 = ledCount(sup26, ROTHWELL)
  const halpinLed25 = ledCount(sup25, HALPIN), hubbardLed25 = ledCount(sup25, HUBBARD)
  const aheadOfHochul = districts.filter((d) => shift(vsHochul, d.ed) > 0).length
  const rose = districts.filter((d) => shift(vs2025, d.ed) > 0).length
  const hochulShare = v(gov26, vsHochul.from.candidate) / gov26.total
  const govWinner = [...gov26.candidates].sort((a, b) => b.votes - a.votes)[0]
  const strongest = (name: string, c: typeof sup26) => [...districts].filter((d) => leader(c, d.ed).name === name).sort((a, b) => leader(c, b.ed).margin - leader(c, a.ed).margin)[0]
  const rothBest = strongest(ROTHWELL, sup26), halpinBest = strongest(HALPIN, sup26)

  const contests: MapContest[] = elections.flatMap((e) => e.contests.map((c) => ({
    key: c.key,
    name: c.name.replace(', Town of Riverhead', '').replace('Council member', 'Town Council').replace('Superintendent of Highways', 'Highway Superintendent'),
    election: e.label,
    official: e.official,
    voteFor: c.voteFor,
    url: c.url,
    total: c.total,
    candidates: c.candidates.map((x) => ({ name: x.name, display: displayName(x.name), party: x.party, votes: x.votes })),
    districts: Object.fromEntries(Object.entries(c.districts).map(([ed, d]) => [ed, { total: d.total, votes: d.votes }])),
  })))
  // Ready-made comparisons for the Compare view; a reader can pick any two candidates and years.
  const presets: MapPreset[] = [
    { key: 'halpin-jens-smith', label: 'Halpin 2026 against Jens-Smith 2017', a: { contest: 'supervisor-2026', candidate: HALPIN }, b: { contest: 'supervisor-2017', candidate: JENS_SMITH } },
    ...comparisons.map((c) => ({ key: c.key, label: c.label, a: c.to, b: c.from })),
  ]
  const e26 = elections[0], e25 = elections[1], e24 = elections.find((e) => e.id === 'GE2024')!
  const past = elections.filter((e) => ['GE2013', 'GE2015', 'GE2017'].includes(e.id))

  return (
    <PageShell
      title="Election map"
      subtitle="How each of Riverhead's 22 election districts voted, from the 2013 Supervisor race to 2026, with any two candidates compared district by district."
    >
      <PlainCallout
        tips={[
          { label: 'Election districts', text: 'the County Board of Elections divides the Town into 22 districts. Each votes at an assigned polling place, and the Board counts each one separately.' },
          { label: 'Which counts', text: `2026 and 2025 are the counts on the Board's results site, which it labels unofficial; for 2025 that is the election-night count, and the certified totals are below. 2024 and the 2013, 2015 and 2017 Supervisor races are final counts, district by district.` },
          { label: 'Votes, not turnout', text: 'the results site does not give registered voters by district, so the map shows votes cast, not the share of voters who turned out.' },
        ]}
      >
        On November 3, 2026, Jerry Halpin led in <strong>{counted(halpinLed26)}</strong> of the 22 districts and Ken Rothwell in{' '}
        <strong>{counted(rothwellLed26)}</strong>. Halpin took {pct(v(sup26, HALPIN) / sup26.total)} of the Supervisor vote while
        Governor Hochul took {pct(hochulShare)} of the vote for Governor on the same ballots: Halpin ran ahead of her in{' '}
        <strong>{counted(aheadOfHochul)}</strong> of the 22 districts.
      </PlainCallout>

      <section id="map" aria-labelledby="map-heading" style={card}>
        <h2 id="map-heading" style={h2}>The map</h2>
        <ElectionMap districts={districts} contests={contests} presets={presets} width={MAP_W} height={MAP_H} />
      </section>

      <section id="findings" aria-labelledby="findings-heading" style={card}>
        <h2 id="findings-heading" style={h2}>What the districts show</h2>
        <ul style={prose}>
          <li style={{ marginBottom: 8 }}>
            <strong>2026 Supervisor.</strong> Halpin {num(v(sup26, HALPIN))}, Rothwell {num(v(sup26, ROTHWELL))}. Rothwell&apos;s widest lead
            was in district {rothBest.label}{rothBest.area ? ` (${rothBest.area})` : ''}, {num(sup26.districts[rothBest.ed].votes[ROTHWELL])} to{' '}
            {num(sup26.districts[rothBest.ed].votes[HALPIN])}. Halpin&apos;s was in district {halpinBest.label}{halpinBest.area ? ` (${halpinBest.area})` : ''},{' '}
            {num(sup26.districts[halpinBest.ed].votes[HALPIN])} to {num(sup26.districts[halpinBest.ed].votes[ROTHWELL])}.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Split tickets.</strong> {displayName(govWinner.name)} carried Riverhead for Governor, {num(govWinner.votes)} to {num(v(gov26, vsHochul.from.candidate))}, yet Halpin won the Town for Supervisor. Choose
            &ldquo;Compare&rdquo; and &ldquo;{vsHochul.label}&rdquo; on the map to see where his vote ran ahead of hers.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>2024 President.</strong> {displayName(TRUMP)} carried Riverhead {num(v(pres24, TRUMP))} to {num(v(pres24, HARRIS))}, leading in{' '}
            {counted(trumpLed)} districts to {counted(harrisLed)} for {displayName(HARRIS)}. Two years later Halpin ran ahead of Harris&apos;s share in{' '}
            {counted(aheadOfHarris)} of the 22 districts: choose &ldquo;Compare&rdquo; and &ldquo;{vsHarris.label}&rdquo;.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Two Democratic wins, nine years apart.</strong> Laura Jens-Smith won in 2017 with {pct(sup17Share)} of the vote; Halpin
            won in 2026 with {pct(v(sup26, HALPIN) / sup26.total)}. Halpin&apos;s share was higher in {counted(halpinOverJS)} of the 22 districts.
            In Compare, choose any two candidates and years, back to 2013.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>2025 to 2026.</strong> In the 2025 election-night count Halpin led Tim Hubbard {num(v(sup25, HALPIN))} to {num(v(sup25, HUBBARD))},
            ahead in {counted(halpinLed25)} districts to Hubbard&apos;s {counted(hubbardLed25)}. His share rose in {counted(rose)} of the 22 districts in 2026.
            About {num(sup26.total - sup25.total)} more votes were cast for Supervisor in 2026, a year with a race for Governor on the ballot.
          </li>
        </ul>
      </section>

      <section id="turnout" aria-labelledby="turnout-heading" style={card}>
        <h2 id="turnout-heading" style={h2}>Turnout, year by year</h2>
        <p style={prose}>
          The share of Riverhead&apos;s registered voters who voted in each November election the County has a final Town page for.
          {(() => {
            const last = turnoutHistory[turnoutHistory.length - 1]
            const lows = [...turnoutHistory].sort((a, b) => a.votesCast / a.registered - b.votesCast / b.registered)
            const odd = turnoutHistory.filter((t) => t.year % 2 === 1)
            const even = turnoutHistory.filter((t) => t.year % 2 === 0)
            const range = (xs: typeof turnoutHistory) => `${pct(Math.min(...xs.map((t) => t.votesCast / t.registered)))} and ${pct(Math.max(...xs.map((t) => t.votesCast / t.registered)))}`
            return (
              <>
                {' '}In the odd years, when only local offices are on the ballot, between {range(odd)} voted; with a President on the ballot,{' '}
                {range(even)}. {last.year}&apos;s {pct(last.votesCast / last.registered)}
                {lows[0].year === last.year ? <>, {num(last.votesCast)} of {num(last.registered)}, was the lowest since {turnoutHistory[0].year}.</> : '.'}
              </>
            )
          })()}
        </p>
        <ColumnChart
          title={`Turnout in Riverhead, ${turnoutHistory[0].year}–${turnoutHistory[turnoutHistory.length - 1].year}`}
          lede="Votes cast in the Town-wide race that drew the most votes, out of the Town's registered voters."
          columns={turnoutHistory.map((t) => ({ label: String(t.year), value: t.votesCast / t.registered, display: `${Math.round((t.votesCast / t.registered) * 100)}%`, emphasis: t.year === turnoutHistory[turnoutHistory.length - 1].year }))}
          format={(n) => `${Math.round(n * 100)}%`}
          source={`Suffolk County Board of Elections, final results for each year (${turnoutHistory.map((t) => t.year).join(', ')}).`}
        />
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>Each year&apos;s figures</summary>
          <ul style={{ ...prose, marginTop: 8 }}>
            {turnoutHistory.map((t) => (
              <li key={t.year}><a href={t.url} style={link}>{t.year}</a>: {num(t.votesCast)} votes for {t.race.replace(', Town of Riverhead', '')}, of {num(t.registered)} registered ({pct(t.votesCast / t.registered)}).</li>
            ))}
          </ul>
        </details>
        <p style={{ ...prose, marginTop: 10, fontSize: 15 }}>
          2014, 2018 and 2022 had no Town race, so the County has no Riverhead page for them. In the presidential years the measure is the
          Town Justice race; in 2024 the race for President drew more, {num(pres24.total)} votes ({pct(pres24.total / (turnoutHistory.find((t) => t.year === 2024)?.registered ?? pres24.total))}).
          For 2026, {num(gov26.total)} votes were counted for Governor in Riverhead, but the County has not yet published the Town&apos;s
          registered voters or its final 2026 page; this chart adds 2026 when it does. The County&apos;s results site does not give
          registered voters by district, so there is no turnout map; the map&apos;s &ldquo;Votes cast&rdquo; view shows where the votes
          came from. For turnout by county across the State, see{' '}
          <a href="https://nysfocus.com/interactives/2026-election-results/turnout/" style={link}>New York Focus&apos;s 2026 turnout map</a>.
        </p>
      </section>

      <section id="supervisor-history" aria-labelledby="supervisor-history-heading" style={card}>
        <h2 id="supervisor-history-heading" style={h2}>Every Supervisor race since 2013</h2>
        <p style={prose}>
          The Town&apos;s results for each race, from the County Board of Elections&apos; final results pages. The 2013, 2015, 2017, 2025 and
          2026 races are also on the map, district by district. No source publishes 2019, 2021 or 2023 by district, so those three are here
          only. Turnout is votes cast for Supervisor out of the Town&apos;s registered voters.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                {['Year', 'Winner', 'Ran against', 'Margin', 'Turnout', 'Split of the vote'].map((h, i) => (
                  <th key={h} scope="col" style={{ padding: '8px 10px', textAlign: i === 3 || i === 4 ? 'right' : 'left', fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...supervisorHistory.map((r) => ({
                year: String(r.year), url: r.url, note: '',
                cands: r.candidates.map((c) => ({ name: historyName(c.name), party: historyParty(c), votes: c.votes })),
                cast: r.votesCast, registered: r.registered as number | null,
              })), {
                year: '2026', url: e26.url, note: 'unofficial',
                cands: sup26.candidates.filter((c) => c.name !== 'Write-in').map((c) => ({ name: c.name === HALPIN ? 'Jerome Halpin' : c.name === ROTHWELL ? 'Kenneth T Rothwell' : c.name, party: c.party === 'DEM' ? 'DEM' : c.party === 'REP' ? 'REP' : 'other', votes: c.votes })),
                cast: sup26.total, registered: null as number | null,
              }].reverse().map((r) => {
                const [w, ...rest] = r.cands
                const margin = w.votes - (rest[0]?.votes ?? 0)
                return (
                  <tr key={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <th scope="row" style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>
                      <a href={r.url} style={link}>{r.year}</a>{r.note ? <span style={{ display: 'block', fontWeight: 400, fontSize: 13, color: 'var(--rbl-text-muted)' }}>{r.note}</span> : null}
                    </th>
                    <td data-label="Winner" style={{ padding: '8px 10px' }}>{w.name} <span style={{ color: 'var(--rbl-text-muted)' }}>({partyWord(w.party)}), {num(w.votes)}</span></td>
                    <td data-label="Ran against" style={{ padding: '8px 10px' }}>{rest.map((c) => <span key={c.name} style={{ display: 'block' }}>{c.name} <span style={{ color: 'var(--rbl-text-muted)' }}>({partyWord(c.party)}), {num(c.votes)}</span></span>)}</td>
                    <td data-label="Margin" style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{num(margin)} <span style={{ color: 'var(--rbl-text-muted)' }}>({pct(margin / r.cast)})</span></td>
                    <td data-label="Turnout" style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.registered ? `${pct(r.cast / r.registered)}` : '—'}<span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 13 }}>{num(r.cast)} votes</span></td>
                    <td data-label="Split of the vote" style={{ padding: '8px 10px', minWidth: 140 }}>
                      <span role="img" aria-label={r.cands.map((c) => `${c.name} ${pct(c.votes / r.cast)}`).join(', ')} style={{ display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', gap: 2, background: 'var(--rbl-surface)' }}>
                        {[...r.cands].sort((a, b) => order(a.party) - order(b.party)).map((c) => (
                          <span key={c.name} style={{ width: `${(c.votes / r.cast) * 100}%`, background: c.party === 'DEM' ? 'var(--rbl-map-dem-3)' : c.party === 'REP' ? 'var(--rbl-map-rep-3)' : 'var(--rbl-map-other-3)' }} />
                        ))}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ ...prose, marginTop: 10, fontSize: 14.5 }}>
          Each candidate&apos;s party lines are combined. In 2015 Sean Walter ran only on the Conservative line after losing the Republican
          primary. In the bar, Democrats are blue, Republicans red and others gold. Source:{' '}
          <a href={finalSource.url} style={link}>{finalSource.title}</a>; 2026 from the Board&apos;s results site, not yet certified.
        </p>
      </section>

      <section id="certified" aria-labelledby="certified-heading" style={card}>
        <h2 id="certified-heading" style={h2}>The certified 2025 totals</h2>
        <p style={prose}>
          The map&apos;s 2025 figures are the results site&apos;s count as of {longDate(e25.asOf ?? e25.date ?? "")}, which it still labels unofficial.
          The Board&apos;s certified totals, after absentee ballots and a full manual recount, were higher:
        </p>
        <ul style={prose}>
          {certified.supervisor && (
            <li>Supervisor: {certified.supervisor.winners.map((w) => `${w.name} ${num(w.votes)}`).join(', ')}, {certified.supervisor.runnersUp.map((w) => `${w.name} ${num(w.votes)}`).join(', ')}, a margin of {num(certified.supervisor.winners[0].votes - certified.supervisor.runnersUp[0].votes)} votes.</li>
          )}
          {certified.council && (
            <li>Town Council (two seats): {[...certified.council.winners, ...certified.council.runnersUp].map((w) => `${w.name} ${num(w.votes)}`).join(', ')}.</li>
          )}
        </ul>
        <p style={prose}>
          The certified count is not published by district, so the map cannot show it. The full record is on{' '}
          <a href={`${base}/board-elections/`} style={link}>Board elections</a>.
        </p>
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li>
            Results: <a href={resultsSource.url} style={link}>{resultsSource.title}</a>, each contest&apos;s &ldquo;results by election
            district&rdquo;: the <a href={e26.url} style={link}>{e26.label}</a> as of {longDate(e26.asOf ?? e26.date ?? "")}, and the{' '}
            <a href={e25.url} style={link}>{e25.label}</a> as of {longDate(e25.asOf ?? e25.date ?? "")}. A candidate on more than one party line is counted once.
          </li>
          <li>
            2024 by district: <a href={e24.districtSource!.url} style={link}>{e24.districtSource!.title}</a>, compiled from the State and County
            boards of elections. Its Suffolk totals for President and the 1st Congressional District equal the County Board&apos;s{' '}
            <a href={e24.url} style={link}>final 2024 results</a> exactly, and its 2024 districts match today&apos;s to{' '}
            {(e24.districtSource!.boundaryOverlap * 100).toFixed(1)}% or better.
          </li>
          <li>
            2013, 2015 and 2017 Supervisor races by district: <a href={past[0].districtSource!.url.replace(/\/blob\/.*$/, '')} style={link}>OpenElections</a>,
            transcribed from the County&apos;s precinct returns. Each candidate&apos;s Town total equals the County&apos;s final results page
            exactly. No County map of those years&apos; districts is published, so the lines are checked against the Census Bureau&apos;s 2010
            and 2020 voting-district maps, which match today&apos;s to {(past[0].districtSource!.boundaryOverlap * 100).toFixed(1)}% or better
            (the Census draws districts 4 and 14 as one).
          </li>
          <li>
            Boundaries: <a href={boundarySource.url} style={link}>{boundarySource.title}</a>{boundaryUpdated ? `, last updated ${longDate(boundaryUpdated)}` : ''}.
            The results site draws 2025 and 2026 on the same district map, and the 2024 districts match it, so every year&apos;s figures fit these lines. The place name beside each
            district is the County&apos;s.
          </li>
          <li>Refreshed by <code>etl/build_election_map.py</code>{fetchedOn ? `; data last changed ${longDate(fetchedOn)}` : ''}. The map is drawn from the County&apos;s boundaries; no outside map service is used.</li>
          <li>
            The idea follows the <a href="https://www.electionatlas.nyc/maps.html" style={link}>NYC Election Atlas</a> from the CUNY Graduate
            Center&apos;s Center for Urban Research, which maps New York City&apos;s results by election district.
          </li>
        </ul>
        <p style={prose}>
          More on the 2026 race: <a href={`${base}/campaign-finance/`} style={link}>Campaign finance</a> and{' '}
          <a href={`${base}/board-elections/`} style={link}>Board elections</a>.
        </p>
      </section>
    </PageShell>
  )
}

function partyWord(p: string) {
  return p === 'DEM' ? 'D' : p === 'REP' ? 'R' : p === 'CON' ? 'C' : 'other'
}
function order(p: string) {
  return p === 'DEM' ? 0 : p === 'REP' ? 2 : 1
}
