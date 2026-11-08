import ChartCard from '../../components/infographics/ChartCard'
import BudgetVsActual from '../../components/infographics/BudgetVsActual'
import PageShell from '../../components/PageShell'
import ProposalLineStageNotice from '../../components/ProposalLineStageNotice'
import PlainCallout from '../../components/PlainCallout'
import BudgetAccuracyOutliers from '../../components/BudgetAccuracyOutliers'
import {
  curatedFlags, overBudget, chronicOverrun, noBudget,
  recoverablePool, outlierNote, outlierColumns, detectedCount, severityLabel,
  dueInBudgetYear, underBudgeted, chronicUnderBudget, chronicGap, unused, unusedTotal, unusedGeneralFund,
  renumbered, historyActualYears, historyBudgetYear, supplementCount,
  historyNote, underBudgetedShortfall, variance, flagYears, flagCorrections,
  proposalLabel, yearMatched, screenYears, midYear, GAP_FLOOR, SHORT_RATIO, OVER_SHARE, REVENUE_SHARE,
  type ScreenRow, type MidYearRow,
} from '../../lib/budget-accuracy'
import { fundNames } from '../../lib/outlier-watch'
import { supplementSource } from '../../lib/supplement'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const money = (n: number | null) => (n === null ? '—' : usd(n))
const th = { padding: '8px 10px' } as const
const thr = { padding: '8px 10px', textAlign: 'right' } as const
const td = { padding: '9px 10px' } as const
const tdr = { padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' } as const
const headRow = { textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13 } as const

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--rbl-danger)',
  high: 'var(--rbl-warn-border)',
  explain: 'var(--rbl-badge)',
}
// The border colours are too light for text, so labels use the darker step.
const SEV_TEXT: Record<string, string> = { high: 'var(--rbl-warn)' }

const FIRST = historyActualYears[0]
const LAST = historyActualYears[historyActualYears.length - 1]
const LAST3 = historyActualYears.slice(-3)

export const metadata = {
  title: 'Budget Accuracy — where the plan and the spending diverge',
  description:
    `Riverhead budget lines where the adopted amount and the money actually spent are far enough apart that the budget stops being a plan: ${curatedFlags.length} researched flags, ${chronicUnderBudget.length} lines over budget three years running, ${unused.length} lines never used, and every outlier in the ${historyBudgetYear} Budget Supplement.`,
}

export default function BudgetAccuracyPage() {
  const critical = curatedFlags.filter((f) => f.severity === 'critical').length

  return (
    <PageShell
      title="Budget accuracy"
      subtitle={`A budget is a spending plan. This page highlights budget lines where the amount approved and the amount actually spent differ enough to deserve a closer look. It includes ${curatedFlags.length} lines reviewed individually, ${detectedCount} additional lines flagged automatically in the ${historyBudgetYear} Budget Supplement, and comparisons across ${supplementCount} years of budget supplements.`}
    >
      <ProposalLineStageNotice showAmendmentOverlay />
      <PlainCallout
        tips={[
          { label: 'Why it matters', text: 'if the Town repeatedly budgets too little for a cost, the original budget can understate what the service is likely to cost. The Town may have to move money from other accounts later.' },
          { label: 'Not the same as overspending', text: 'spending above a line’s budget does not automatically mean waste or misconduct. Costs may have risen, or the original estimate may have been too low. The records help identify which lines need an explanation.' },
          { label: 'What is excluded', text: 'required costs such as pensions, workers’ compensation, insurance, debt payments, and payroll taxes, along with revenue lines. These items are driven by legal obligations or timing and are not treated as ordinary discretionary spending.' },
        ]}
      >
        Of the {curatedFlags.length} researched lines below, <strong>{critical}</strong> ran over budget in both {flagYears.first} and{' '}
        {flagYears.second} and are budgeted below what they cost again in the {flagYears.tentative} {proposalLabel}. Across every fund,{' '}
        <strong>{chronicUnderBudget.length}</strong> lines were over budget in each of the last three years, and{' '}
        <strong>{unused.length}</strong> have been budgeted year after year with nothing spent. Separately, the {historyBudgetYear} Supplement
        budgets <strong>{usd(recoverablePool)}</strong> above the trailing run-rate on controllable lines.
      </PlainCallout>

      <h2 style={{ color: 'var(--rbl-title)' }}>The {historyActualYears.length}-year view</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{historyNote}</p>

      {chronicUnderBudget.length > 0 && (
        <section style={{ ...card, marginBottom: 14, borderColor: 'var(--rbl-danger-border)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Over budget three years running, and budgeted low again</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            These accounts had more spending than originally budgeted in each of {LAST3.join(', ')}. When that happens, the Town may need to approve transfers from other accounts during the year. The original adopted budget therefore does not show the full amount ultimately spent. The{' '}
            {historyBudgetYear} {proposalLabel} budgets them <strong>{usd(chronicGap)}</strong> below their three-year average.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  {LAST3.map((y) => <th key={y} style={thr}>{y}: spent / budget</th>)}
                  <th style={thr}>{historyBudgetYear} {proposalLabel}</th>
                </tr>
              </thead>
              <tbody>
                {chronicUnderBudget.map((r) => (
                  <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{r.account}{r.page ? ` · p. ${r.page}` : ''}</div>
                    </td>
                    {LAST3.map((y) => (
                      <td key={y} style={tdr}>
                        <strong style={{ color: 'var(--rbl-title)' }}>{usd(r.actual[String(y)])}</strong>
                        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{usd(r.adoptedByYear[String(y)])}</div>
                      </td>
                    ))}
                    <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-danger)' }}>{usd(r.proposed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ ...card, marginBottom: 14, borderColor: 'var(--rbl-warn-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Lines that go quiet, then cost real money</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          These sit at or near zero for years, so any single-year comparison reads them as dead. Then the bill arrives.
          Across {underBudgeted.length} such lines the {historyBudgetYear} {proposalLabel} is <strong>{usd(underBudgetedShortfall)}</strong> short
          of what they have actually cost in the years they happened.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={headRow}>
                <th style={th}>Line</th>
                <th style={th}>{FIRST}–{LAST} actuals</th>
                <th style={thr}>Costs when it happens</th>
                <th style={thr}>{historyBudgetYear} {proposalLabel}</th>
              </tr>
            </thead>
            <tbody>
              {underBudgeted.map((r) => (
                <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={td}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                      {r.account} · quiet in {r.quietYears} of {Object.keys(r.series).length} years
                    </div>
                  </td>
                  <td style={td}>
                    <Spark series={r.series} />
                  </td>
                  <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.averageWhenActive)}</td>
                  <td style={{ ...tdr, color: r.proposed === 0 ? 'var(--rbl-danger)' : 'var(--rbl-text-body)' }}>
                    {usd(r.proposed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {unused.length > 0 && (
        <section style={{ ...card, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Budgeted every year, never used</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            {unused.length} lines were budgeted in {historyBudgetYear - 2}, {historyBudgetYear - 1} and the {historyBudgetYear} {proposalLabel} with
            nothing spent in {LAST3.join(', ')} or the first half of {historyBudgetYear - 1}. They hold <strong>{usd(unusedTotal)}</strong> in the
            {proposalLabel}, {usd(unusedGeneralFund)} of it in the General Fund. Some are a cushion for a rare expense, such as severance, and the
            Board may want to keep those; it should know they have gone unused. Debt payments, reserves and contingencies are left out.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  <th style={thr}>{historyBudgetYear - 2} budget</th>
                  <th style={thr}>{historyBudgetYear - 1} budget</th>
                  <th style={thr}>{historyBudgetYear} {proposalLabel}</th>
                </tr>
              </thead>
              <tbody>
                {unused.map((r) => (
                  <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{r.account}{r.page ? ` · p. ${r.page}` : ''}</div>
                    </td>
                    <td style={tdr}>{usd(r.adoptedPrior)}</td>
                    <td style={tdr}>{usd(r.adopted)}</td>
                    <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.proposed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dueInBudgetYear.length > 0 && (
        <section style={{ ...card, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>On a cycle, and due again in {historyBudgetYear}</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            Spending here repeats on a regular interval rather than every year. The last spike and the interval say the
            next one lands in {historyBudgetYear}, the budget now before the Board.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {dueInBudgetYear.map((c) => (
              <div key={c.account} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', background: 'var(--rbl-warn-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{c.name}</strong>
                  <span style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 800 }}>
                    every {c.periodYears} years · last {c.spikeYears[c.spikeYears.length - 1]}
                  </span>
                </div>
                <div style={{ margin: '6px 0' }}><Spark series={c.series} /></div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>
                  Costs about <strong>{usd(c.spikeAverage)}</strong> when it lands. The {historyBudgetYear} {proposalLabel} carries{' '}
                  <strong style={{ color: c.proposed === 0 ? 'var(--rbl-danger)' : 'var(--rbl-title)' }}>{usd(c.proposed)}</strong>.
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {renumbered.length > 0 && (
        <section style={{ ...card, marginBottom: 22 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Renumbered, not abandoned</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            These accounts stopped and an identically-named one started. Nothing was cut and nothing appeared from
            nowhere — the money moved account numbers. They are listed so neither half gets read as a finding.
          </p>
          {renumbered.map((r) => (
            <div key={r.oldAccount} style={{ borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 9, marginTop: 9 }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{r.name}</strong>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, marginTop: 3, lineHeight: 1.5 }}>
                {r.oldAccount} through {r.lastYear} → {r.newAccount} from {r.firstYear}. Peak {usd(r.peak)}.
              </div>
            </div>
          ))}
        </section>
      )}

      <ChartCard>
        <BudgetVsActual />
      </ChartCard>

      <h2 style={{ color: 'var(--rbl-title)' }}>Researched flags</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0 }}>
        Each carries a specific question for the Finance Department, not just a number. The figures are read from the
        Town&apos;s Budget Supplements for each account named.
      </p>

      <section style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
        {curatedFlags.map((f) => (
          <div key={f.rank} style={{ ...card, borderColor: SEV_COLOR[f.severity] ?? 'var(--rbl-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 12 }}>#{f.rank}</span>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 16.5 }}>{f.title}</strong>
              <span style={{ marginLeft: 'auto', color: SEV_TEXT[f.severity] ?? SEV_COLOR[f.severity], fontWeight: 700, fontSize: 13.5 }}>
                {severityLabel[f.severity]}
              </span>
            </div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 3 }}>
              {f.accounts.length === 1 ? f.accounts[0] : `${f.accounts.length} accounts: ${f.accounts[0].split('-').slice(0, 3).join('-')}-…`}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 8, margin: '11px 0' }}>
              {f.years.map((y) => (
                <div key={y.year} style={{ display: 'contents' }}>
                  <Fig label={`${y.year} budget`} value={money(y.budget)} />
                  <Fig label={`${y.year} actual`} value={money(y.actual)} strong note={variance(y)} />
                </div>
              ))}
              <Fig label={`${flagYears.adopted} adopted`} value={money(f.adopted)} />
              <Fig label={`${flagYears.tentative} ${proposalLabel}`} value={money(f.proposed)} strong />
            </div>

            {f.plainEnglish && (
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{f.plainEnglish}</p>
            )}
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>{f.issue}</p>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
              Ask: {f.action}
            </p>
          </div>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 22, background: 'var(--rbl-info-bg)' }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 15.5 }}>Corrected</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{flagCorrections.note}</p>
      </section>

      <YearMatched />

      <h2 style={{ color: 'var(--rbl-title)' }}>Found automatically</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{outlierNote}</p>

      <BudgetAccuracyOutliers
        proposalLabel={proposalLabel}
        overBudget={overBudget}
        chronicOverrun={chronicOverrun}
        noBudget={noBudget}
        recoverablePool={recoverablePool}
        columns={outlierColumns}
      />

      <section style={{ ...card, marginTop: 18 }}>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Researched flags show each line&apos;s budget and actual for {flagYears.first} and {flagYears.second}, the {flagYears.adopted} adopted
          amount and the {flagYears.tentative} {proposalLabel}. The automatic set comes from the Town&apos;s {historyBudgetYear} Budget
          Supplement{supplementSource ? <> (<a href={supplementSource.url} style={{ color: 'var(--rbl-link)' }}>PDF</a>)</> : null}; the multi-year
          view stacks every Supplement since {historyActualYears[0] + 2}. Actuals are the Town&apos;s books before each year&apos;s audit. None of
          this is an allegation of waste — a line can miss because costs genuinely rose. The question each raises is whether the budgeted
          figure was ever realistic.
        </p>
      </section>
    </PageShell>
  )
}

const pctOf = (share: number) => `${Math.round(share * 100)}%`
const span = `${screenYears[0]} to ${screenYears[screenYears.length - 1]}`
const lineCell = (r: { name: string; fund: string; account: string }) => (
  <span style={{ textAlign: 'left' }}>
    {r.name}
    <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 400 }}>{fundNames[r.fund] ?? r.fund} · {r.account}</span>
  </span>
)
const pages = (rows: { page: number }[]) => {
  const p = Array.from(new Set(rows.map((r) => r.page))).sort((a, b) => a - b)
  return p.length === 1 ? `p. ${p[0]}` : `pp. ${p.join(', ')}`
}

/** Budget against cost, year by year: the four screens in lib/accuracy-screens.ts. */
function YearMatched() {
  const { shortOfCost, aboveCost, pastBudgetByMidYear, revenueBelowEstimate } = yearMatched
  const proposed = `${flagYears.tentative} ${proposalLabel}`
  // The General Fund's fuel line and the fuel it charges other funds move together, so they are read together,
  // and the sentence says "most" only while the revenue shortfall is at least half the spending room.
  const fuelSpend = aboveCost.find((r) => r.account === 'A01-1-1670-400-000-00000')
  const fuelCharge = revenueBelowEstimate.find((r) => r.account === 'A01-2801-904-00000-K')
  return (
    <section aria-labelledby="year-matched" style={{ marginBottom: 22 }}>
      <h2 id="year-matched" style={{ color: 'var(--rbl-title)' }}>Budget against cost, year by year</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, marginTop: 0, maxWidth: '75ch' }}>
        These four checks set each year&apos;s actual beside that same year&apos;s adopted budget, for {span}, and then ask whether
        the {proposed} repeats the pattern. Each gap shown is at least {usd(GAP_FLOOR)}. Lines already listed above, as never used or
        over budget three years running, are not repeated. Some also appear in the automatic list below, which compares the{' '}
        {proposed} with the recent run-rate instead. As elsewhere on this page, mandated costs, debt payments and transfers between funds
        are left out.
      </p>

      <ScreenTable
        id="short-of-cost"
        title={`Budgeted below what it costs (${shortOfCost.length})`}
        blurb={`Spending ran past the budget by at least ${pctOf(SHORT_RATIO - 1)} in at least two of the three years, including ${screenYears[screenYears.length - 1]}, and the ${proposed} is again below the ${screenYears[screenYears.length - 1]} cost. The difference has to be found during the year, usually by moving money from other lines.`}
        rows={shortOfCost}
        gapLabel={`${proposed} below ${screenYears[screenYears.length - 1]} cost`}
      />
      <ScreenTable
        id="above-cost"
        title={`Budgeted well above what it costs (${aboveCost.length})`}
        blurb={`Spending used no more than ${pctOf(OVER_SHARE)} of the budget in each of the three years, and the ${proposed} is at least half again the three years' average cost. Money budgeted and not spent usually ends the year as surplus, so a line like this can make the budget look tighter than it is.`}
        rows={aboveCost}
        gapLabel={`${proposed} above average cost`}
      />
      {fuelSpend && fuelCharge && fuelCharge.gap >= fuelSpend.gap / 2 && (
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '75ch' }}>
          Municipal fuel is read with the revenue below. The General Fund budgets {usd(fuelSpend.proposed)} for fuel and expects{' '}
          {usd(fuelCharge.proposed)} back from other funds for it (account {fuelCharge.account}). In {span} it spent between{' '}
          {usd(Math.min(...fuelSpend.years.map((y) => y.actual)))} and {usd(Math.max(...fuelSpend.years.map((y) => y.actual)))} a year
          and collected between {usd(Math.min(...fuelCharge.years.map((y) => y.actual)))} and{' '}
          {usd(Math.max(...fuelCharge.years.map((y) => y.actual)))}, so most of the room in the fuel line is matched by revenue that
          does not come in either.
        </p>
      )}
      <MidYearTable rows={pastBudgetByMidYear} proposed={proposed} />
      <ScreenTable
        id="revenue-below"
        title={`Revenue estimated above what comes in (${revenueBelowEstimate.length})`}
        blurb={`Collections came to no more than ${pctOf(REVENUE_SHARE)} of the estimate in each of the three years, and the ${proposed} again counts on more than the average. The opposite case, revenue the Town collects far more of than it estimates, is on the revenue page.`}
        rows={revenueBelowEstimate}
        gapLabel={`${proposed} above average collected`}
        revenue
      />
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: '75ch' }}>
        A gap is not a finding of waste. Equipment bought with a grant or borrowed money, or overtime charged to this line for work
        billed elsewhere, can look the same. Each line is a fair question for the Finance Department: is the budgeted figure meant to
        be realistic? <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/revenue/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Revenue</a>{' '}
        lists the revenue the Town collects far more of than it estimates.
      </p>
    </section>
  )
}

function ScreenTable({ id, title, blurb, rows, gapLabel, revenue }: { id: string; title: string; blurb: string; rows: ScreenRow[]; gapLabel: string; revenue?: boolean }) {
  if (rows.length === 0) return null
  const proposed = `${flagYears.tentative} ${proposalLabel}`
  return (
    <section aria-labelledby={id} style={{ ...card, marginBottom: 16 }}>
      <h3 id={id} style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18 }}>{title}</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px', maxWidth: '75ch' }}>{blurb}</p>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
        <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13, padding: '0 0 6px' }}>
          Each year shows {revenue ? 'what was collected against the estimate' : 'what was spent against the budget'}. {flagYears.tentative} Budget Supplement, {pages(rows)}; earlier years from the Supplements before it.
        </caption>
        <thead>
          <tr style={{ ...headRow, borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={th}>Line</th>
            {screenYears.map((y) => <th key={y} scope="col" style={thr}>{y}</th>)}
            <th scope="col" style={thr}>{proposed}</th>
            <th scope="col" style={thr}>{gapLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <td style={{ ...td, color: 'var(--rbl-text-strong)' }}>{lineCell(r)}</td>
              {r.years.map((y) => (
                <td key={y.year} data-label={y.year} style={tdr}>
                  {/* One box, so a phone's stacked row keeps both figures together on the right. */}
                  <span>
                    {usd(y.actual)}
                    <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>of {usd(y.budget)}</span>
                  </span>
                </td>
              ))}
              <td data-label={proposed} style={tdr}>{usd(r.proposed)}</td>
              <td data-label={gapLabel} style={{ ...tdr, fontWeight: 700, color: 'var(--rbl-title)' }}>{usd(r.gap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function MidYearTable({ rows, proposed }: { rows: MidYearRow[]; proposed: string }) {
  if (rows.length === 0) return null
  return (
    <section aria-labelledby="past-mid-year" style={{ ...card, marginBottom: 16 }}>
      <h3 id="past-mid-year" style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18 }}>Past the whole {midYear} budget by June 30 ({rows.length})</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px', maxWidth: '75ch' }}>
        By June 30, {midYear}, these lines had already spent more than their budget for the whole year. Some lines are paid once a year
        up front, but none of these can be explained that way: each is already past its full-year figure.
      </p>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
        <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13, padding: '0 0 6px' }}>
          {flagYears.tentative} Budget Supplement, {pages(rows)}.
        </caption>
        <thead>
          <tr style={{ ...headRow, borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={th}>Line</th>
            <th scope="col" style={thr}>{midYear} budget</th>
            <th scope="col" style={thr}>Spent by June 30</th>
            <th scope="col" style={thr}>Over the year&apos;s budget</th>
            <th scope="col" style={thr}>{proposed}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <td style={{ ...td, color: 'var(--rbl-text-strong)' }}>{lineCell(r)}</td>
              <td data-label={`${midYear} budget`} style={tdr}>{usd(r.budget)}</td>
              <td data-label="Spent by June 30" style={tdr}>{usd(r.spent)}</td>
              <td data-label="Over the year's budget" style={{ ...tdr, fontWeight: 700, color: 'var(--rbl-title)' }}>{usd(r.gap)}</td>
              <td data-label={proposed} style={tdr}>{usd(r.proposed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Fig({ label, value, strong, note }: { label: string; value: string; strong?: boolean; note?: string }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ color: strong ? 'var(--rbl-title)' : 'var(--rbl-text-body)', fontSize: 15, fontWeight: strong ? 800 : 600 }}>{value || '—'}</div>
      {note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 700 }}>{note}</div>}
    </div>
  )
}

function Spark({ series }: { series: Record<string, number> }) {
  const years = Object.keys(series).sort()
  const max = Math.max(...years.map((y) => Math.abs(series[y])), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }} aria-hidden>
      {years.map((y) => {
        const v = series[y]
        const h = Math.max(2, Math.round((Math.abs(v) / max) * 28))
        return (
          <div key={y} title={`${y}: ${v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`}
            style={{ width: 9, height: h, borderRadius: 2, background: v > 0 ? 'var(--rbl-series-blue)' : 'var(--rbl-border-subtle)' }} />
        )
      })}
    </div>
  )
}
