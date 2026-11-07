import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ElectionMap, { type MapComparison, type MapContest } from '../../components/ElectionMap'
import {
  boundarySource, boundaryUpdated, certified, comparisons, contestByKey, displayName, districts, elections, fetchedOn, leader, ledCount,
  MAP_H, MAP_W, resultsSource, shift,
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
  description: "Riverhead's 22 election districts, colored by how each voted in the 2026 and 2025 general elections: Supervisor, Town Council, Governor, Congress and the State Legislature, from the Suffolk County Board of Elections.",
}

const HALPIN = 'Jerome Halpin'
const ROTHWELL = 'Kenneth T Rothwell'
const HUBBARD = 'Timothy C Hubbard'

export default function ElectionMapPage() {
  const sup26 = contestByKey.get('supervisor-2026')!
  const sup25 = contestByKey.get('supervisor-2025')!
  const gov26 = contestByKey.get('governor-2026')!
  const v = (c: typeof sup26, name: string) => c.candidates.find((x) => x.name === name)?.votes ?? 0
  const [vsHochul, vs2025] = [comparisons[1], comparisons[0]]
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
  const cmps: MapComparison[] = comparisons.map((c) => ({
    key: c.key, label: c.label, higher: c.higher, lower: c.lower, explain: c.explain,
    values: Object.fromEntries(districts.map((d) => [d.ed, shift(c, d.ed)])),
  }))
  const e26 = elections[0], e25 = elections[1]

  return (
    <PageShell
      title="Election map"
      subtitle="How each of Riverhead's 22 election districts voted in the 2026 and 2025 general elections, from the Suffolk County Board of Elections' own district counts."
    >
      <PlainCallout
        tips={[
          { label: 'Election districts', text: 'the County Board of Elections divides the Town into 22 districts. Each votes at an assigned polling place, and the Board counts each one separately.' },
          { label: 'Unofficial counts', text: `both years are the counts on the Board's results site, which it labels unofficial. For 2025 that is the election-night count, before absentee ballots and the recount; the certified totals are below.` },
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
        <ElectionMap districts={districts} contests={contests} comparisons={cmps} width={MAP_W} height={MAP_H} />
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
            <strong>2025 to 2026.</strong> In the 2025 election-night count Halpin led Tim Hubbard {num(v(sup25, HALPIN))} to {num(v(sup25, HUBBARD))},
            ahead in {counted(halpinLed25)} districts to Hubbard&apos;s {counted(hubbardLed25)}. His share rose in {counted(rose)} of the 22 districts in 2026.
            About {num(sup26.total - sup25.total)} more votes were cast for Supervisor in 2026, a year with a race for Governor on the ballot.
          </li>
        </ul>
      </section>

      <section id="certified" aria-labelledby="certified-heading" style={card}>
        <h2 id="certified-heading" style={h2}>The certified 2025 totals</h2>
        <p style={prose}>
          The map&apos;s 2025 figures are the results site&apos;s count as of {longDate(e25.asOf)}, which it still labels unofficial.
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
            district&rdquo;: the <a href={e26.url} style={link}>{e26.label}</a> as of {longDate(e26.asOf)}, and the{' '}
            <a href={e25.url} style={link}>{e25.label}</a> as of {longDate(e25.asOf)}. A candidate on more than one party line is counted once.
          </li>
          <li>
            Boundaries: <a href={boundarySource.url} style={link}>{boundarySource.title}</a>{boundaryUpdated ? `, last updated ${longDate(boundaryUpdated)}` : ''}.
            The results site draws both years on the same district map, so the 2025 figures fit these lines. The place name beside each
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
