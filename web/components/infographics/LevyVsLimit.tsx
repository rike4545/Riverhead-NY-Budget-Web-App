import ColumnChart from '../charts/ColumnChart'
import { stageDoc } from '../../lib/budget-stages'
import { statedLimitPct } from '../../lib/tentative-2027'
import { pct2 } from './format'

// Town-wide levy growth at each 2027 stage against the limit the Supervisor's
// Tentative letter states. The limit is the Town's own statement, not this
// site's calculation of the statutory formula, and the chart says so.
export default function LevyVsLimit() {
  const tent = stageDoc(2027, 'tentative')?.townWide
  const prelim = stageDoc(2027, 'preliminary')?.townWide
  if (!tent || statedLimitPct === null) return null
  const limit: number = statedLimitPct
  const growth = (t: { levy: number; priorLevy: number }) => (t.levy / t.priorLevy - 1) * 100
  const cols = [{ label: 'Tentative', g: growth(tent) }, ...(prelim ? [{ label: 'Preliminary', g: growth(prelim) }] : [])]
  const room = prelim ? ((limit - growth(prelim)) / 100) * tent.priorLevy : null
  return (
    <ColumnChart
      title="Town-wide levy growth against the stated limit"
      lede={room !== null && room > 0
        ? `The Preliminary leaves about $${Math.round(room).toLocaleString('en-US')} of room under the limit the Supervisor’s letter states (${statedLimitPct}%). That room is calculated here from the stated figure, not published by the Town.`
        : `The Supervisor’s Tentative letter states a limit of ${statedLimitPct}%.`}
      source="Source: Town of Riverhead 2027 Tentative Budget (Supervisor’s letter) and Summary pages, 2027 Preliminary Budget Summary. Growth is the “Total Town Wide” levy against the year before."
      columns={cols.map((c) => ({ label: c.label, value: Number(c.g.toFixed(2)), display: `+${pct2(c.g)}`, color: c.g >= limit - 0.005 ? 'var(--rbl-warn)' : 'var(--rbl-series-blue)' }))}
      format={pct2}
      threshold={{ value: limit, label: `Stated limit ${limit}%` }}
      height={200}
    />
  )
}
