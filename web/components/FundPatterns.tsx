import { TrendingUp, Landmark, Calculator, ChartNoAxesCombined } from 'lucide-react'
import type { FundPattern } from '../lib/fund-patterns'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '78ch' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const h3 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 18, display: 'flex', gap: 8, alignItems: 'center' } as const
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--rbl-border)', fontWeight: 700, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' } as const
const td = { padding: '6px 8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
const num = { ...td, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const m = (n: number) => `$${(Math.abs(n) / 1e6).toFixed(Math.abs(n) >= 1e7 ? 1 : 2)} million`
const sgn = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`
const the = (n: string) => (/Fund|District|Agency/.test(n) ? `the ${n}` : n)
const listed = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const span = (ys: number[]) => (ys.length > 1 && ys[ys.length - 1] - ys[0] === ys.length - 1 ? `${ys[0]} to ${ys[ys.length - 1]}` : listed(ys.map(String)))

const FLAG_TEXT: Record<FundPattern['flags'][number], string> = {
  'revenue-low': 'Revenue estimates run low',
  'revenue-high': 'Revenue estimates run high',
  'spending-under': 'Spends well under budget',
  'fb-is-depreciation': 'Fund balance matches depreciation',
  'capital-off-budget': 'Capital paid by unplanned transfers',
  narrowing: 'Margin narrowing',
}

export default function FundPatterns({ patterns, firstYear, lastYear, base }: { patterns: FundPattern[]; firstYear: number; lastYear: number; base: string }) {
  const low = patterns.filter((p) => p.flags.includes('revenue-low'))
  const gf = patterns.find((p) => p.fund === 'A01')
  const cap = patterns.filter((p) => p.flags.includes('capital-off-budget')).sort((a, b) => b.capitalOffBudget.total - a.capitalOffBudget.total)
  const dep = patterns.filter((p) => p.flags.includes('fb-is-depreciation'))
  const narrow = patterns.filter((p) => p.flags.includes('narrowing'))
  const gfLast2 = gf ? gf.years.filter((y) => (y.fundBalance ?? 0) > 0).slice(-2) : []
  return (
    <section id="fund-patterns" aria-labelledby="fund-patterns-heading" data-fund-patterns style={{ marginBottom: 24 }}>
      <h2 id="fund-patterns-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 24 }}>Patterns across funds</h2>
      <p style={prose}>
        The lists above find single lines that moved. This section looks at each fund as a whole, every year from {firstYear} to {lastYear}: what it
        collected against its revenue estimate, what it spent against its budget, and a least-squares trend line through each. Four patterns repeat
        across funds. They are questions worth asking, not findings that anything was done wrong.
      </p>

      {gf && low.length > 0 && (
        <div style={card} data-pattern="revenue-low">
          <h3 style={h3}><TrendingUp size={20} aria-hidden /> Revenue estimates run low</h3>
          <p style={prose}>
            The General Fund collected more than it estimated in every year from {gf.revenueBeat.since} to {lastYear}, by {m(gf.revenueBeat.streakAverage)} a year on
            average over those {gf.revenueBeat.streak} years ({sgn(gf.revenueBeat.averagePct)} of the estimate over all {gf.revenueBeat.of} years since {firstYear + 1}). The largest gains were{' '}
            {listed(gf.topRevenueLines.map((l) => `${l.name.toLowerCase().replace(/^state aid, /, 'state aid for ')} (${usd(l.average)} a year)`))}.
            {gfLast2.length === 2 && <> The {gfLast2[0].year} and {gfLast2[1].year} budgets each planned to use savings ({m(gfLast2[0].fundBalance ?? 0)} and {m(gfLast2[1].fundBalance ?? 0)} of appropriated fund balance), yet on the Supplements’ figures the fund collected {m(gfLast2[0].result)} and {m(gfLast2[1].result)} more than it spent in those years ({m(gfLast2[0].result - gfLast2[0].capitalTransfers)} and {m(gfLast2[1].result - gfLast2[1].capitalTransfers)} after its transfers to capital projects).</>}
          </p>
          <p style={prose}>
            {listed(low.filter((p) => p.fund !== 'A01').map((p) => `${p.name} (${p.revenueBeat.years} of ${p.revenueBeat.of} years, ${sgn(p.revenueBeat.averagePct)})`))} also
            collected more than estimated in most years. Cautious revenue estimates are sound practice, but estimates that run low every year build
            a cushion the budget does not show, and can lead to taxes or rents set higher than needed. See <a href={`${base}/revenue/`} style={link}>Revenue</a> for each line.
          </p>
        </div>
      )}

      {cap.length > 0 && (
        <div style={card} data-pattern="capital-off-budget">
          <h3 style={h3}><Landmark size={20} aria-hidden /> Capital paid for with transfers the budget did not plan</h3>
          <p style={prose}>
            Money moved from operating funds to capital project funds (H01, and the districts’ project funds EW3, ES2, ES4 and ES6) almost never appears
            in the adopted budget. It is added during the year. Net of reversals, {listed(cap.map((p) => `${the(p.name)} sent ${m(p.capitalOffBudget.total)}`))} this way from {firstYear} to {lastYear}.
            The largest were {listed(cap.flatMap((p) => p.capitalOffBudget.years.filter((y) => y.amount - y.planned >= 1_000_000).map((y) => {
              const back = p.capitalOffBudget.years.find((x) => x.year > y.year && x.amount < 0)
              return `${m(y.amount)} from ${the(p.name)} in ${y.year}${back ? ` (${m(-back.amount)} of it returned in ${back.year})` : ''}`
            })))}.
          </p>
          <p style={prose}>
            Paying for capital in cash rather than borrowing saves interest. But when it is decided mid-year, the adopted budget understates what a fund
            will spend, and the decision gets less public review than the budget does. Planning these transfers in the budget, or in a multi-year
            capital plan, would show them in advance. See <a href={`${base}/capital-debt/`} style={link}>Capital and debt</a>.
          </p>
        </div>
      )}

      {dep.length > 0 && (
        <div style={card} data-pattern="fb-is-depreciation">
          <h3 style={h3}><Calculator size={20} aria-hidden /> In the utility districts, “fund balance” offsets depreciation</h3>
          <p style={prose}>
            In {listed(dep.map((p) => `${the(p.name)} (${span(p.fbMatchesDepreciation)})`))}, the appropriated fund balance in the adopted budget equals
            the depreciation budget to the dollar. These districts keep business-style books on the full accrual basis, so they record depreciation,
            the cost of their plant wearing out, as an expense. It uses no cash. A budget that lists the same amount as “appropriated fund balance” is
            balancing that non-cash expense, not drawing down savings.
          </p>
          <p style={prose}>
            With depreciation and other non-cash entries set aside, these districts collected more than they spent in most years:{' '}
            {listed(dep.map((p) => `${the(p.name)} in ${p.years.filter((y) => y.result > 0).length} of ${p.years.length}`))}. The records do not say why
            the two figures are set equal; the match in every year suggests it is the Town’s practice. A reader adding up “fund balance used” across
            funds should leave these out.
          </p>
        </div>
      )}

      {narrow.length > 0 && (
        <div style={card} data-pattern="narrowing">
          <h3 style={h3}><ChartNoAxesCombined size={20} aria-hidden /> Spending growing faster than collections</h3>
          {narrow.map((p) => (
            <p key={p.fund} style={prose}>
              In {the(p.name)}, spending has grown about {sgn(p.spentTrend.pct)} a year on its trend line, collections about {sgn(p.collectedTrend.pct)}. The
              fund went from collecting {usd(p.years[1].result)} more than it spent in {p.years[1].year} to {p.years[p.years.length - 1].result < 0 ? `spending ${usd(-p.years[p.years.length - 1].result)} more than it collected` : `a margin of ${usd(p.years[p.years.length - 1].result)}`} in {lastYear}
              {p.years.slice(-3).every((y) => y.result < 0) ? `, short in each of the last three years` : ''}.
              {p.fund === 'SM1' && <> Its budgets have also counted on ambulance billing the district has not collected; see <a href={`${base}/revenue/`} style={link}>Revenue</a>.</>}
            </p>
          ))}
        </div>
      )}

      <div style={card}>
        <h3 style={h3}>Every fund, {firstYear} to {lastYear}</h3>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <caption style={{ ...help, textAlign: 'left', paddingBottom: 6 }}>Trend: least-squares slope as a share of the fund’s average, per year. Against the estimate and budget: years and average share, {firstYear + 1} to {lastYear}.</caption>
            <thead>
              <tr>
                <th scope="col" style={th}>Fund</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Collections trend</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Spending trend</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Beat revenue estimate</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Under spending budget</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Collected less spent, {lastYear}</th>
                <th scope="col" style={th}>Patterns</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => {
                const ly = p.years[p.years.length - 1]
                return (
                  <tr key={p.fund}>
                    <th scope="row" style={{ ...td, fontWeight: 600 }}>{p.name} <span style={{ ...help, fontWeight: 400 }}>{p.fund}</span></th>
                    <td style={num}>{sgn(p.collectedTrend.pct)}</td>
                    <td style={num}>{sgn(p.spentTrend.pct)}</td>
                    <td style={num}>{p.revenueBeat.years} of {p.revenueBeat.of} ({sgn(p.revenueBeat.averagePct)})</td>
                    <td style={num}>{p.spendingUnder.years} of {p.spendingUnder.of} ({sgn(p.spendingUnder.averagePct)})</td>
                    <td style={num}>{ly.result < 0 ? `−${usd(-ly.result)}` : usd(ly.result)}</td>
                    <td style={td}>{p.flags.map((f) => FLAG_TEXT[f]).join('; ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          How this is computed. Collected is every revenue line but appropriated fund balance, transfers in from other funds included. Spent is every
          spending line less non-cash entries (depreciation, losses on disposing of assets, pension expense under GASB 68), less transfers to capital
          project funds (shown separately above), and less the 2025 Water District grant explained by Resolution 2026-640. Budgets are the original
          adopted ones; the Board amends them during the year. Funds spending under $200,000 and the Debt Service Fund, which only passes payments
          through, are left out. With eight years of data a trend line is a rough guide, and the Supplements’ figures can differ from the audited
          statements.
        </p>
      </div>
    </section>
  )
}
