import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Sparkline from '../../components/Sparkline'
import {
  accountsIn, byCategory, categoryLabel, collected, estimateRecord, estimated, FUND_LABELS, isOutside, material,
  midYear, neverCollected, requested, revenueActualYears, revenueAdoptedYears, revenueBudgetYear, revenueNote,
  revenueSupplementYears, tentative, underEstimated, type RevenueAccount,
} from '../../lib/revenue'
import { supplementSource } from '../../lib/supplement'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const millions = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`
const th = { padding: '8px 10px' } as const
const thr = { padding: '8px 10px', textAlign: 'right' } as const
const td = { padding: '8px 10px' } as const
const tdr = { padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' } as const
const headRow = { textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 } as const
const rowLine = { borderTop: '1px solid var(--rbl-border-subtle)' } as const

const YEAR = revenueBudgetYear
const LAST = revenueActualYears[revenueActualYears.length - 1]
const NOW = revenueAdoptedYears[revenueAdoptedYears.length - 1]

// The General Fund, split the way it is funded.
const gf = accountsIn('A01')
const gfOutside = gf.filter(isOutside)
const byCat = (ids: string[]) => gf.filter((a) => ids.includes(a.category))
const gfTotal = tentative(gf)
const parts = [
  { label: 'Property tax levy', amount: tentative(byCat(['property-tax'])), note: 'Set by the Board, within the tax cap' },
  { label: 'Outside revenue', amount: tentative(gfOutside), note: 'Fees, interest, state aid, sales and cannabis taxes, PILOTs and more' },
  { label: 'From other Town funds', amount: tentative(byCat(['interfund-revenue', 'other-sources'])), note: 'Charges and transfers from the Town’s own districts' },
  { label: 'Fund balance used', amount: tentative(byCat(['fund-balance'])), note: 'Savings from earlier years' },
]

const record = estimateRecord(gfOutside)
const overYears = record.filter((r) => r.difference > 0)
// The run of consecutive years, ending with the latest, that came in above the estimate.
const streak: typeof record = []
for (const r of [...record].reverse()) {
  if (r.difference <= 0 || (streak.length && streak[streak.length - 1].year !== r.year + 1)) break
  streak.push(r)
}
streak.reverse()
const streakTotal = streak.reduce((s, r) => s + r.difference, 0)
const maxBar = Math.max(...record.map((r) => Math.max(r.estimated, r.collected)))

const categoriesGF = byCategory('A01').filter((c) => !['property-tax', 'fund-balance', 'interfund-revenue', 'other-sources'].includes(c.id))

const OTHER_FUNDS = ['DA1', 'EW1', 'ES1', 'ES3', 'ES5', 'SR1', 'SM1', 'SL1', 'CM4', 'CM2', 'CM1', 'ST1', 'Z14', 'A06', 'A04']

export const metadata = {
  title: 'Where Revenue Comes From — every stream, estimate against result',
  description: `Every revenue stream in Riverhead's Budget Supplements, ${revenueActualYears[0]}–${YEAR}: what each source was estimated to bring in, what it did, what has come in so far in ${NOW}, and what the ${YEAR} Tentative expects.`,
}

export default function RevenuePage() {
  return (
    <PageShell
      title="Where revenue comes from"
      subtitle={`Every revenue stream in the Town's Budget Supplements, ${revenueActualYears[0]} through ${YEAR}: what each source was estimated to bring in, what it did, what has come in so far this year, and what the ${YEAR} Tentative expects.`}
    >
      <PlainCallout
        tips={[
          { label: 'Why it matters', text: 'every dollar of revenue the budget does not count has to be raised by the tax levy instead. When estimates run low year after year, the difference lands in fund balance.' },
          { label: 'Estimated, not set', text: 'the levy and planned use of fund balance are decisions, not forecasts, and money moved between the Town’s own funds is bookkeeping. They are kept apart from “outside revenue” throughout.' },
          { label: 'Before the audit', text: 'collections are the Town’s books as the Supplements print them, before each year’s audit.' },
        ]}
      >
        {streak.length > 1
          ? <>The General Fund estimated its outside revenue below what came in for <strong>{streak.length} years running</strong>,{' '}
            {streak[0].year}–{streak[streak.length - 1].year}, by <strong>{usd(streakTotal)}</strong> in all.</>
          : <>The General Fund&apos;s outside revenue came in above its estimate in {overYears.length} of the {record.length} years on file.</>}{' '}
        The {YEAR} Tentative expects{' '}
        <strong>{usd(tentative(gfOutside))}</strong> from those sources, against {usd(collected(gfOutside, LAST))} collected in {LAST}.
      </PlainCallout>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(210px,100%),1fr))', gap: 12, margin: '16px 0' }}>
        {parts.map((p) => (
          <div key={p.label} style={{ ...card, padding: 16 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>{p.label}</div>
            <div style={{ color: 'var(--rbl-title)', fontSize: 24, fontWeight: 900, margin: '4px 0' }}>{millions(p.amount)}</div>
            <div style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>{Math.round((p.amount / gfTotal) * 100)}% of the {YEAR} General Fund · {p.note}</div>
          </div>
        ))}
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>General Fund: estimate against result</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Outside revenue only: everything but the tax levy, fund balance, and money from the Town&apos;s own funds. In{' '}
          {overYears.length} of the {record.length} years on file, more came in than the budget counted on.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={headRow}>
                <th style={th}>Year</th>
                <th style={thr}>Estimated</th>
                <th style={thr}>Collected</th>
                <th style={thr}>Difference</th>
                <th style={{ ...th, width: '34%' }}></th>
              </tr>
            </thead>
            <tbody>
              {record.map((r) => (
                <tr key={r.year} style={rowLine}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{r.year}</td>
                  <td style={tdr}>{usd(r.estimated)}</td>
                  <td style={tdr}>{usd(r.collected)}</td>
                  <td style={{ ...tdr, fontWeight: 800, color: r.difference >= 0 ? 'var(--rbl-success-strong)' : 'var(--rbl-danger)' }}>{signed(r.difference)}</td>
                  <td style={td}>
                    <Bar value={r.estimated} max={maxBar} color="var(--rbl-border-subtle)" />
                    <Bar value={r.collected} max={maxBar} color="var(--rbl-series-blue)" />
                  </td>
                </tr>
              ))}
              <tr style={rowLine}>
                <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{NOW}</td>
                <td style={tdr}>{usd(estimated(gfOutside, NOW))}</td>
                <td style={tdr} colSpan={3}>
                  <span style={{ color: 'var(--rbl-text-muted)' }}>
                    {usd(midYear(gfOutside, NOW))} through June 30, against {usd(midYear(gfOutside, NOW - 1))} at the same point in {NOW - 1}
                  </span>
                </td>
              </tr>
              <tr style={rowLine}>
                <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{YEAR}</td>
                <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(tentative(gfOutside))}</td>
                <td style={tdr} colSpan={3}><span style={{ color: 'var(--rbl-text-muted)' }}>the Tentative&apos;s estimate{requested(gfOutside) === tentative(gfOutside) ? ', the same as the departments requested' : ` (departments asked for ${usd(requested(gfOutside))})`}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '10px 0 0' }}>
          Grey bars are the estimate, blue what came in. Mid-year figures are not half a year: property-tax items, state aid and
          transfers arrive on their own schedules.
        </p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>General Fund, by source</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 760 }}>
            <thead>
              <tr style={headRow}>
                <th style={th}>Source</th>
                <th style={thr}>{LAST} estimate</th>
                <th style={thr}>{LAST} collected</th>
                <th style={thr}>{NOW} estimate</th>
                <th style={thr}>Jan–Jun {NOW}</th>
                <th style={thr}>Jan–Jun {NOW - 1}</th>
                <th style={thr}>{YEAR} Tentative</th>
              </tr>
            </thead>
            <tbody>
              {categoriesGF.map((c) => (
                <tr key={c.id} style={rowLine}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{c.label}</td>
                  <td style={tdr}>{usd(c.estimatedLast)}</td>
                  <td style={{ ...tdr, fontWeight: 800, color: c.collectedLast >= c.estimatedLast ? 'var(--rbl-success-strong)' : 'var(--rbl-danger)' }}>{usd(c.collectedLast)}</td>
                  <td style={tdr}>{usd(c.estimatedNow)}</td>
                  <td style={tdr}>{usd(c.midYearNow)}</td>
                  <td style={{ ...tdr, color: 'var(--rbl-text-muted)' }}>{usd(c.midYearPrior)}</td>
                  <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(c.tentative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {underEstimated.length > 0 && (
        <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-warn-border)' }}>
          <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Estimated low, year after year</h2>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            Every fund. Each of these brought in at least a quarter more than its estimate in each of{' '}
            {revenueActualYears.slice(-3).join(', ')}, and the {YEAR} Tentative estimates it below what it has averaged. Interest
            appears in almost every fund: most districts budget a few hundred dollars and earn tens or hundreds of thousands.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 700 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  {revenueActualYears.slice(-3).map((y) => <th key={y} style={thr}>{y}: in / estimate</th>)}
                  <th style={thr}>{YEAR} Tentative</th>
                </tr>
              </thead>
              <tbody>
                {underEstimated.map((r) => (
                  <tr key={r.account} style={rowLine}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{FUND_LABELS[r.fund] ?? r.fund} · {r.account}</div>
                    </td>
                    {revenueActualYears.slice(-3).map((y) => (
                      <td key={y} style={tdr}>
                        <strong style={{ color: 'var(--rbl-title)' }}>{usd(r.collected[String(y)])}</strong>
                        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{usd(r.estimated[String(y)])}</div>
                      </td>
                    ))}
                    <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.tentative ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '10px 0 0' }}>
            The Community Preservation Fund&apos;s “Other Non Property Taxes” is the 2% Peconic Bay land-transfer tax. State law limits
            it to community preservation — open space, farmland, historic places and, in part, water quality — so money it collects
            above its estimate cannot lower the tax levy.
          </p>
        </section>
      )}

      {neverCollected.length > 0 && (
        <section style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Estimated, never collected</h2>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            Counted in each of {revenueActualYears.slice(-3).join(', ')}, with nothing recorded at mid-year or year-end.{' '}
            {neverCollected.every((r) => !r.tentative)
              ? `The ${YEAR} Tentative carries none of them. The question is about the budgets that did: where, if anywhere, this money was recorded.`
              : `Some are still in the ${YEAR} Tentative.`}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  {revenueActualYears.slice(-3).map((y) => <th key={y} style={thr}>{y} estimate</th>)}
                  <th style={thr}>{YEAR} Tentative</th>
                </tr>
              </thead>
              <tbody>
                {neverCollected.map((r) => (
                  <tr key={r.account} style={rowLine}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{FUND_LABELS[r.fund] ?? r.fund} · {r.account}</div>
                    </td>
                    {revenueActualYears.slice(-3).map((y) => <td key={y} style={tdr}>{usd(r.estimated[String(y)])}</td>)}
                    <td style={{ ...tdr, fontWeight: 800 }}>{usd(r.tentative ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <h2 style={{ color: 'var(--rbl-title)' }}>Every General Fund revenue line</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>
        Grouped by source. The line shows collections {revenueActualYears[0]}–{LAST}; lines under $1,000 in every year are left out.
      </p>
      <section style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {byCategory('A01').map((c) => (
          <StreamGroup key={c.id} title={c.label} accounts={c.accounts.filter(material)} />
        ))}
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>The other funds</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Each district and special fund, with its outside revenue estimate against result for {LAST}. Open a fund to see its lines.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={headRow}>
                <th style={th}>Fund</th>
                <th style={thr}>{YEAR} revenue (Tentative)</th>
                <th style={thr}>of it, tax levy</th>
                <th style={thr}>{LAST} outside: estimate</th>
                <th style={thr}>{LAST} outside: collected</th>
              </tr>
            </thead>
            <tbody>
              {OTHER_FUNDS.map((f) => {
                const acc = accountsIn(f)
                const out = acc.filter(isOutside)
                return (
                  <tr key={f} style={rowLine}>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{FUND_LABELS[f] ?? f}</td>
                    <td style={tdr}>{usd(tentative(acc))}</td>
                    <td style={tdr}>{usd(tentative(acc.filter((a) => a.category === 'property-tax')))}</td>
                    <td style={tdr}>{usd(estimated(out, LAST))}</td>
                    <td style={{ ...tdr, fontWeight: 800 }}>{usd(collected(out, LAST))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {OTHER_FUNDS.map((f) => (
          <StreamGroup key={f} title={FUND_LABELS[f] ?? f} accounts={accountsIn(f).filter(material)} />
        ))}
      </section>

      <section style={{ ...card, marginTop: 18 }}>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          {revenueNote} Built from the {revenueSupplementYears.length} Supplements, {revenueSupplementYears[0]}–{YEAR}
          {supplementSource ? <>; the newest is the <a href={supplementSource.url} style={{ color: 'var(--rbl-link)' }}>{supplementSource.title}</a></> : null}.
          Categories follow New York&apos;s uniform revenue codes. The 2021 and 2022 Supplements print no department request for revenue.
        </p>
      </section>
    </PageShell>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div style={{ height: 7, width: `${Math.max(2, (value / max) * 100)}%`, background: color, borderRadius: 4, margin: '2px 0' }} />
}

function StreamGroup({ title, accounts }: { title: string; accounts: RevenueAccount[] }) {
  if (accounts.length === 0) return null
  return (
    <details style={{ ...card, padding: '12px 16px' }}>
      <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ color: 'var(--rbl-title)' }}>{title}</strong>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>
          {accounts.length} line{accounts.length === 1 ? '' : 's'} · {YEAR} Tentative {usd(tentative(accounts))}
        </span>
      </summary>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Line</th>
              <th style={th}>{revenueActualYears[0]}–{LAST}</th>
              <th style={thr}>{LAST}: in / estimate</th>
              <th style={thr}>{NOW} estimate</th>
              <th style={thr}>Jan–Jun {NOW}</th>
              <th style={thr}>{YEAR} Tentative</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.account} style={rowLine}>
                <td style={td}>
                  <span style={{ color: 'var(--rbl-title)', fontWeight: 700 }}>{a.name}</span>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11 }}>{a.account} · {categoryLabel(a.category)}{a.page ? ` · p. ${a.page}` : ''}</div>
                </td>
                <td style={td}><Sparkline values={revenueActualYears.map((y) => a.actual[String(y)] ?? null)} width={110} height={26} /></td>
                <td style={tdr}>
                  <strong>{usd(a.actual[String(LAST)] ?? 0)}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11 }}>{usd(a.adopted[String(LAST)] ?? 0)}</div>
                </td>
                <td style={tdr}>{usd(a.adopted[String(NOW)] ?? 0)}</td>
                <td style={tdr}>{usd(a.ytd[String(NOW)] ?? 0)}</td>
                <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(a.tentative ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
