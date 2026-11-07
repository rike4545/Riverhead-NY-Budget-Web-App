import ColumnChart from '../charts/ColumnChart'
import DivergingBars from '../charts/DivergingBars'
import { supervisorResult2026 as r } from '../../lib/election-results-2026'
import { pct1 } from './format'

// Winning margins in Supervisor races, and how each election district voted in
// the unofficial 2026 count. Prior-year margins are the County's, as listed in
// board-elections.json and on /board-elections.
const margins = [
  { year: '2017', v: 649 }, { year: '2019', v: 707 }, { year: '2021', v: 1528 },
  { year: '2023', v: 1635 }, { year: '2025', v: 37 }, { year: '2026', v: r.margin },
]

export default function ElectionPictures() {
  const rows = r.districts
    .map((d) => ({ ed: d.ed, h: d.halpinDem + d.halpinTpf, k: d.rothwellRep + d.rothwellCon, total: d.total }))
    .map((d) => ({ ...d, m: d.h - d.k }))
    .sort((a, b) => b.m - a.m)
  const halpinWins = rows.filter((d) => d.m > 0).length
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <ColumnChart
        title="Winning margin in Supervisor races"
        lede="Votes between the winner and the runner-up. The 2026 margin is unofficial."
        source="Source: Suffolk County Board of Elections, as listed on this page; 2026 from its election-night results page."
        columns={margins.map((m) => ({ label: m.year, value: m.v, display: m.v.toLocaleString('en-US'), emphasis: m.year === '2026', color: m.year === '2026' ? 'var(--rbl-series-gold)' : 'var(--rbl-series-blue)' }))}
        format={(n) => n.toLocaleString('en-US')}
        height={200}
      />
      <DivergingBars
        title="How each election district voted, 2026 (unofficial)"
        lede={`Halpin led in ${halpinWins} of 22 election districts and Rothwell in ${22 - halpinWins}. Each bar is the vote margin in that district, so a large district with a small margin is not drawn large.`}
        source={`Source: Suffolk County Board of Elections, election-night results, ${r.asOf}. Margin is Halpin’s party-line votes minus Rothwell’s. Districts sorted by margin.`}
        rows={rows.map((d) => ({
          label: d.ed,
          value: d.m,
          display: `${d.m >= 0 ? 'Halpin' : 'Rothwell'} +${Math.abs(d.m)}`,
        }))}
        positive={{ label: 'Halpin ahead', color: 'var(--rbl-series-blue)' }}
        negative={{ label: 'Rothwell ahead', color: 'var(--rbl-series-gold)' }}
      />
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>
        Halpin carried {pct1((halpinWins / 22) * 100)} of districts and {pct1((r.candidates[0].votes / r.total) * 100)} of the votes.
      </p>
    </div>
  )
}
