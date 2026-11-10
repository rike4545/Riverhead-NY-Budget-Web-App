import Sparkline from './Sparkline'
import { CATEGORY_SOURCE, type CategoryResult } from '../lib/spending-categories'
import { plainAccountName } from '../lib/account-names'

// Recurring costs by category on /outliers/ (lib/spending-categories.ts;
// checked by scripts/verify-spending-categories.mjs). Server-rendered.

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const round10k = (n: number) => Math.round(n / 10_000) * 10_000
const pct = (n: number) => `${Math.abs(n * 100).toFixed(0)}%`
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { padding: '6px 8px', textAlign: 'right' as const, fontSize: 13, color: 'var(--rbl-text-muted)', verticalAlign: 'bottom' as const }
const td = { padding: '6px 8px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }

export default function SpendingCategories({ categories }: { categories: CategoryResult[] }) {
  const c0 = categories[0]
  const y = c0.lastActual
  const now = c0.thisYear
  return (
    <section id="by-category" data-spending-categories aria-labelledby="by-category-heading" style={{ marginBottom: 24, scrollMarginTop: 16 }}>
      <h2 id="by-category-heading" style={{ margin: '0 0 10px', color: 'var(--rbl-title)', fontSize: 24, lineHeight: 1.25 }}>Recurring costs by category</h2>
      <p style={{ margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' }}>
        The flags above follow funds, and <a href={`${base}/budget-accuracy/`} style={link}>budget accuracy</a> follows single lines. This
        puts the lines back together by the kind of cost they are, across every fund, so a flagged line can be read against its own
        history: a pattern, or a single event. Spending is from {c0.actualYears[0]}, budgets from {c0.years[0].year}, using the Town’s own
        account codes.
      </p>
      <div data-scroll-region style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>Every category at a glance</caption>
          <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>Category</th>
            <th scope="col" style={th}>{y} budget</th>
            <th scope="col" style={th}>{y} spent</th>
            <th scope="col" style={th}>{now} budget</th>
            <th scope="col" style={th}>Spent by {CATEGORY_SOURCE.ytdThrough}</th>
            <th scope="col" style={th}>{now + 1} Preliminary</th>
          </tr></thead>
          <tbody>
            {categories.map((c) => {
              const last = c.years[c.years.length - 1]
              return (
                <tr key={c.id} data-category={c.id} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}><a href={`#cat-${c.id}`} style={link}>{c.label}</a></th>
                  <td data-label={`${y} budget`} style={td}>{usd(last.budget)}</td>
                  <td data-label={`${y} spent`} style={td}>{usd(last.actual)}{last.actual !== last.usual ? '*' : ''}</td>
                  <td data-label={`${now} budget`} style={td}>{usd(c.budgetNow)}</td>
                  <td data-label={`Spent by ${CATEGORY_SOURCE.ytdThrough}`} style={td}>{usd(c.ytdNow)}</td>
                  <td data-label={`${now + 1} Preliminary`} style={td}>{usd(c.proposed)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {categories.some((c) => c.oneOffs.length > 0) && (
        <p style={{ margin: '-6px 0 14px', color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>* Includes a single entry far out of line with its budget, explained under the category.</p>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {categories.map((c) => <CategoryCard key={c.id} c={c} />)}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55, marginTop: 12 }}>
        Source: the Budget Supplements, latest the <a href={CATEGORY_SOURCE.url} style={link}>{CATEGORY_SOURCE.title}</a>. A category is the set
        of accounts with its object codes, in every fund. “Spent by {CATEGORY_SOURCE.ytdThrough}” is the Supplement’s year-to-date column.
        Projections for {now} are this site’s estimates: a range from the share of each recent year’s spending that came by{' '}
        {CATEGORY_SOURCE.ytdThrough}, and a single figure only where that share has held within 15 points. These are likely questions for residents, not findings.
      </p>
    </section>
  )
}

function CategoryCard({ c }: { c: CategoryResult }) {
  const last = c.years[c.years.length - 1]
  const first = c.years[0]
  const n = c.years.length
  const overPace = c.pace !== null && c.pace > c.budgetNow
  const cushionWord = c.avgCushion >= 0 ? 'below' : 'above'
  return (
    <details id={`cat-${c.id}`} data-category-card={c.id} style={{ ...card, padding: 0, scrollMarginTop: 16 }}>
      <summary style={{ cursor: 'pointer', padding: '14px 18px', minHeight: 44 }}>
        <strong style={{ color: 'var(--rbl-title)', fontSize: 17 }}>{c.label}</strong>
        <span style={{ display: 'block', color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 2 }}>
          {c.lastActual}: {usd(last.usual)} spent of {usd(last.budget)} budgeted
          {c.range ? <>; {c.thisYear} likely {usd(round10k(c.range.low))} to {usd(round10k(c.range.high))} against {usd(c.budgetNow)}</> : null}
          {c.range && c.range.low > c.budgetNow ? ', over budget' : ''}.
        </span>
      </summary>
      <div style={{ padding: '0 18px 18px' }}>
        <p style={{ margin: '0 0 8px', color: 'var(--rbl-text-muted)', fontSize: 14 }}>{c.what} {c.lines} accounts.</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6, display: 'grid', gap: 4, maxWidth: '75ch' }}>
          <li>
            Spending came in under the budget in <strong>{c.yearsUnder} of {n} years</strong> ({first.year}–{last.year}) and over it in {c.yearsOver}.
            Over the last five years it averaged {usd(Math.abs(c.avgCushion))} a year {cushionWord} budget.
          </li>
          {c.spendGrowth !== null && c.budgetGrowth !== null && (
            <li>
              Spending {c.spendGrowth >= 0 ? 'rose' : 'fell'} {pct(c.spendGrowth)} from {first.year} to {last.year}; the {c.thisYear} budget is{' '}
              {pct(c.budgetGrowth)} {c.budgetGrowth >= 0 ? 'above' : 'below'} {first.year}’s.
            </li>
          )}
          <li>
            {c.ytdNow === 0 && c.ytdThen === 0
              ? <>Nothing is recorded by {CATEGORY_SOURCE.ytdThrough} in either year: it is paid later in the year.</>
              : <>By {CATEGORY_SOURCE.ytdThrough}, {c.thisYear}: {usd(c.ytdNow)}{c.ytdChange !== null ? <>, {pct(c.ytdChange)} {c.ytdChange >= 0 ? 'more' : 'less'} than by the same date in {c.lastActual}</> : null}.{' '}
                {c.pace !== null
                  ? <>If the rest of the year follows {c.lastActual}’s timing, it ends near <strong>{usd(round10k(c.pace))}</strong>, {overPace ? `${usd(round10k(c.pace - c.budgetNow))} over` : 'within'} the {usd(c.budgetNow)} budget.</>
                  : <>The share spent by {CATEGORY_SOURCE.ytdThrough} varies too much from year to year for a single figure.</>}
                {c.range && <> Across the last {c.shares.length} years, {pct(c.range.minShare)} to {pct(c.range.maxShare)} of the year’s spending came by {CATEGORY_SOURCE.ytdThrough}, which puts {c.thisYear} between <strong>{usd(round10k(c.range.low))} and {usd(round10k(c.range.high))}</strong>{c.range.high > c.budgetNow ? (c.range.low > c.budgetNow ? ', all of it over budget' : ', the top of it over budget') : ', within budget'}.</>}
                {' '}These are this site’s estimates.</>}
          </li>
          <li>
            The {c.thisYear + 1} Preliminary budgets {usd(c.proposed)}, {usd(Math.abs(c.proposed - last.usual))} {c.proposed >= last.usual ? 'above' : 'below'} what was spent in {c.lastActual}.
          </li>
          {c.oneOffs.map((o) => (
            <li key={o.account + o.year} data-one-off={o.account}>
              <strong>One entry is left out of the figures above:</strong> “{o.name}” ({o.account}) recorded {usd(o.actual)} in {o.year} against
              a {usd(o.budget)} budget, on page {o.page} of the Supplement. The Supplement does not say what it was; ask the Town.
            </li>
          ))}
          {c.flagged.length > 0 && (
            <li>
              {c.flagged.length === 1 ? 'One account' : `${c.flagged.length} accounts`} in this category {c.flagged.length === 1 ? 'is' : 'are'} flagged on{' '}
              <a href={`${base}/budget-accuracy/`} style={link}>budget accuracy</a>.
            </li>
          )}
        </ul>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, maxWidth: 560 }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>{c.label}, year by year</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>Year</th>
              <th scope="col" style={th}>Budget</th>
              <th scope="col" style={th}>Spent</th>
              <th scope="col" style={th}>Difference</th>
            </tr></thead>
            <tbody>
              {c.years.map((r) => (
                <tr key={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}>{r.year}</th>
                  <td data-label="Budget" style={td}>{usd(r.budget)}</td>
                  <td data-label="Spent" style={td}>{usd(r.usual)}{r.usual !== r.actual ? '*' : ''}</td>
                  <td data-label="Difference" style={td}>{r.usual >= r.budget ? `${usd(r.usual - r.budget)} over` : `${usd(r.budget - r.usual)} under`}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{c.thisYear}, to {CATEGORY_SOURCE.ytdThrough}</th>
                <td data-label="Budget" style={td}>{usd(c.budgetNow)}</td>
                <td data-label="Spent" style={td}>{usd(c.ytdNow)}</td>
                <td data-label="Difference" style={td}>{c.range ? `${usd(round10k(c.range.low))} to ${usd(round10k(c.range.high))} for the year` : 'not yet'}</td>
              </tr>
              <tr>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{c.thisYear + 1} Preliminary</th>
                <td data-label="Budget" style={td}>{usd(c.proposed)}</td>
                <td data-label="Spent" style={td}>not yet</td>
                <td data-label="Difference" style={td}>not yet</td>
              </tr>
            </tbody>
          </table>
        </div>
        {c.oneOffs.length > 0 && <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13 }}>* Without the one-off entry described above.</p>}
        <p style={{ margin: '14px 0 6px', color: 'var(--rbl-text-strong)', fontWeight: 700, fontSize: 15 }}>Every account, with its history</p>
        <AccountList c={c} rows={c.all.slice(0, 6)} />
        {c.all.length > 6 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', minHeight: 32, color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14.5 }}>The other {c.all.length - 6} accounts</summary>
            <AccountList c={c} rows={c.all.slice(6)} />
          </details>
        )}
        {c.inactive > 0 && (
          <p style={{ margin: '8px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13 }}>
            {c.inactive} more {c.inactive === 1 ? 'account has' : 'accounts have'} no budget or spending in any year shown.
          </p>
        )}
      </div>
    </details>
  )
}

function AccountList({ c, rows }: { c: CategoryResult; rows: CategoryResult['all'] }) {
  const n = c.years.length
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
      {rows.map((t) => {
        const plain = plainAccountName(t.account, t.townName)
        return (
          <li key={t.account} data-category-line={t.account} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 8 }}>
            <span style={{ fontSize: 14.5, color: 'var(--rbl-text-body)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--rbl-title)' }}>{plain.name}</strong>
              <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
                {plain.known ? <>Town’s name: “{t.townName}”, </> : <>This site has not identified the abbreviation. </>}{t.account}, Supplement page {t.page}
              </span>
              <span style={{ display: 'block' }}>
                {c.lastActual}: {usd(t.last)} spent of {usd(t.budgetLast)}. {c.thisYear}: {usd(t.ytdNow)} by {CATEGORY_SOURCE.ytdThrough} of {usd(t.budgetNow)}. {c.thisYear + 1} Preliminary: {usd(t.proposed)}.
              </span>
              <span style={{ display: 'block', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
                {t.yearsBudgeted > 0
                  ? <>Budgeted in {t.yearsBudgeted} of {n} years ({c.years[0].year}–{c.lastActual}); spent more than the budget in {t.yearsOver === 0 ? 'none of them' : t.yearsOver === t.yearsBudgeted ? `all ${t.yearsOver}` : t.yearsOver}.</>
                  : <>No budget in any year from {c.years[0].year} to {c.lastActual}.</>}
                {t.yearsUnbudgeted > 0 && <> Spent money with no budget in {t.yearsUnbudgeted} {t.yearsUnbudgeted === 1 ? 'year' : 'years'}.</>}
              </span>
            </span>
            <span role="img" aria-label={`Spending ${c.actualYears[0]} to ${c.lastActual}: ${t.actuals.map((v) => (v === null ? 'none' : usd(v))).join(', ')}`}>
              <Sparkline values={t.actuals} width={110} height={30} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
