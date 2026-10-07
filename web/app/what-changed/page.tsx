import PageShell from '../../components/PageShell'
import DataStatus from '../../components/DataStatus'
import RecordTrail from '../../components/RecordTrail'
import { dollars, townWideComparison2026, adoptedBudget2026Summary } from '../../lib/financial-data'
import { stageDoc } from '../../lib/budget-stages'
import { released2027, adoptedPrior, levySentence, spendingSentence, stability, unchangedYears, PRIOR, YEAR } from '../../lib/tentative-2027'
import { READ_BY_HAND } from '../../lib/tentative-letters'

// The budget on the table: the 2027 Tentative against the 2026 adopted budget.
// Every figure is the Summary's own, read by etl/parse_budget_stages.py and
// framed by lib/tentative-2027.ts, so this page and /tentative-2027/ cannot
// disagree. Until the Tentative is parsed, the page says so.
//
// Each "See the evidence" link opens a page that prints the figures on its
// card, and the last adopted change (2025 -> 2026) keeps a section of its own,
// #adopted-2025-2026, because the Financial Health page's 2026 figures and
// growth signals link to it. web/scripts/verify-build.mjs checks both.

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pct = (n: number | null) => (n === null ? '' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`)
const delta = (n: number) => `${n >= 0 ? '+' : ''}${dollars(n)}`
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 18 }
const title = `What Changed: ${PRIOR} → ${YEAR} Tentative`
const subtitle = `The resident version of the year-over-year story: what the Supervisor’s ${YEAR} Tentative Budget changes from the ${PRIOR} adopted budget, with a direct path to the underlying records.`

export default function WhatChangedPage() {
  const h = released2027
  const tw = h?.townWide
  const gf = h?.generalFund
  const gfPrior = adoptedPrior?.funds.A01?.appropriations ?? null
  if (!h || !tw || !gf || gfPrior === null) {
    return (
      <PageShell title={title} subtitle={subtitle}>
        <div style={{ display: 'grid', gap: 16 }}>
          <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>The {YEAR} Tentative Budget has not been read yet. <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>See where it stands →</a></p>
          <AdoptedChange />
        </div>
      </PageShell>
    )
  }

  const gfChange = gf.appropriations - gfPrior
  // How far past Tentatives moved before adoption, so the figures read as a proposal.
  const biggest = stability.reduce((a, b) => (Math.abs(b.appropriationsDelta) > Math.abs(a.appropriationsDelta) ? b : a), stability[0])

  const metrics = [
    { label: 'Town-wide appropriations', value: dollars(tw.appropriations), change: `${delta(tw.appropriations - tw.priorAppropriations)} · ${pct(tw.appropriationsPct)}`, href: '/tentative-2027/', note: `General Fund, Highway and Street Lighting, the Tentative’s own “Total Town Wide” row. ${PRIOR} adopted: ${dollars(tw.priorAppropriations)}.` },
    { label: 'Town-wide tax levy', value: dollars(tw.levy), change: `${delta(tw.levy - tw.priorLevy)} · ${pct(tw.levyPct)}`, href: '/tentative-2027/', note: `The property tax those three funds raise on every parcel. With the special districts, the levy is ${dollars(h.levy)}.` },
    { label: 'Town-wide rate', value: `$${tw.rate.toFixed(3)} / $1,000`, change: `${tw.rate >= tw.priorRate ? '+' : ''}${(tw.rate - tw.priorRate).toFixed(3)} · ${pct(tw.ratePct)}`, href: '/tentative-2027/', note: 'The Town rate per $1,000 of assessed value, not the full school, county, fire and library bill.' },
    { label: 'General Fund', value: dollars(gf.appropriations), change: `${delta(gfChange)} · ${pct((gfChange / gfPrior) * 100)}`, href: '/general-fund/', note: 'The main operating fund for Town services.' },
    { label: 'Appropriated fund balance', value: dollars(h.fundBalance), change: h.fundBalancePrior !== null ? `${delta(h.fundBalance - h.fundBalancePrior)} vs ${PRIOR}` : `${YEAR} Tentative`, href: '/tentative-2027/', note: `One-time reserves used to balance the budget, across all funds. The General Fund’s share is ${dollars(gf.fundBalance ?? 0)}, against ${dollars(gf.fundBalancePrior ?? 0)} in ${PRIOR}.` },
  ]

  return (
    <PageShell title={title} subtitle={subtitle}>
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 }}>
          <DataStatus status="calculated" text={`Calculated from the ${YEAR} Tentative and ${PRIOR} Adopted budgets`} />
          <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-sub)', lineHeight: 1.6, maxWidth: 930 }}>This page answers the first resident question — <strong>what is about to move?</strong> — for the budget now on the table, then lets you drill into the underlying records. The Tentative is the Supervisor’s proposal. The Town Board can change it before adopting a budget, which it must do by November 20.</p>
        </section>

        <section aria-label={`${PRIOR} to ${YEAR} Tentative changes`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {metrics.map(m => <a key={m.label} href={`${base}${m.href}`} style={{ color: 'inherit', textDecoration: 'none', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 17 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 25, fontWeight: 950, marginTop: 6 }}>{m.value}</div>
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 900, fontSize: 13, marginTop: 4 }}>{m.change}</div>
            <div style={{ color: 'var(--rbl-text-sub)', fontSize: 13, lineHeight: 1.45, marginTop: 8 }}>{m.note}</div>
            <div style={{ color: 'var(--rbl-accent)', fontSize: 12.5, fontWeight: 800, marginTop: 11 }}>See the evidence →</div>
          </a>)}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
          <article style={card}>
            <h2 style={{ margin: 0, fontSize: 20 }}>What changes most?</h2>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>The Tentative raises town-wide appropriations <strong>{dollars(tw.appropriations - tw.priorAppropriations)}</strong> ({pct(tw.appropriationsPct)}) and the town-wide property-tax levy <strong>{dollars(tw.levy - tw.priorLevy)}</strong> ({pct(tw.levyPct)}).</p>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>{spendingSentence(h)}</p>
            <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>See every fund in the Tentative →</a>
          </article>
          <article style={card}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Is it within the tax cap?</h2>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>{levySentence(h)}</p>
            <a href={`${base}/tax-cap/`} style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>How the tax cap works →</a>
          </article>
          <article style={card}>
            <h2 style={{ margin: 0, fontSize: 20 }}>What should I be careful not to confuse?</h2>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>A Tentative is a proposal, not the budget. In {unchangedYears.length} of the last {stability.length} years the adopted budget matched it fund for fund; the most it moved was {dollars(Math.abs(biggest.appropriationsDelta))} of appropriations, in {biggest.year}.</p>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6, marginBottom: 0 }}>Appropriations are spending authority, not proof that cash was spent. The Town levy is only the Town&apos;s property-tax share. And the Town rate shown here is not your complete property-tax bill.</p>
          </article>
        </section>

        <AdoptedChange />

        <section style={{ background: 'var(--rbl-surface-2)', borderRadius: 14, padding: 18 }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>Where the story goes next</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {[['The 2027 Tentative in full', '/tentative-2027/'], ['How the tax cap works', '/tax-cap/'], ['How this site’s forecast compared', '/predict-2027/'], ['Why did my taxes change?', '/tax-bill/'], ['What changed line by line, 2025 → 2026', '/compare/'], ['How the Board voted', '/meetings/']].map(([label, href]) => <a key={href} href={`${base}${href}`} style={{ textDecoration: 'none', color: 'var(--rbl-title)', border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, fontSize: 13 }}>{label} →</a>)}
          </div>
        </section>

        <RecordTrail title="Primary records" items={[
          { label: `${YEAR} Tentative Budget`, text: `${h.source.title}: the Summary’s fund totals and its “Total Town Wide” rows.`, href: '/tentative-2027/' },
          { label: `${PRIOR} Adopted Budget`, text: 'The same Summary rows as adopted, for the comparison.', href: '/compare/' },
          { label: 'Supervisor’s budget letter', text: `${READ_BY_HAND[YEAR]?.dated ? `Dated ${READ_BY_HAND[YEAR]?.dated}; it` : 'It'} gives the tax cap limit${h.statedLimitPct !== null ? ` of ${h.statedLimitPct}%` : ''}.`, href: '/tentative-2027/' },
        ]} />
      </div>
    </PageShell>
  )
}

// The last adopted change. Its town-wide rows are the 2026 Adopted Budget's own
// Summary columns, which print 2025 beside 2026 (as townWideComparison2026 and
// the Financial Health signals use them); the all-funds and General Fund rows
// set the 2026 Adopted Budget against the 2025 one.
function AdoptedChange() {
  const c = townWideComparison2026
  const a25 = stageDoc(2025, 'adopted')
  const total = adoptedBudget2026Summary.find((r) => r.fundCode === 'TOTAL')!
  const general = adoptedBudget2026Summary.find((r) => r.fundCode === 'A01')!
  const change = (before: number | null | undefined, after: number) =>
    before ? `${delta(after - before)} (${pct(((after - before) / before) * 100)})` : '—'
  const rows: [string, string, string, string][] = [
    ['Town-wide appropriations', dollars(c.appropriations2025), dollars(c.appropriations2026), `${delta(c.dollarChange)} (${pct(c.percentChange)})`],
    ['Town-wide tax levy', dollars(c.taxLevy2025), dollars(c.taxLevy2026), `${delta(c.taxLevyDollarChange)} (${pct(c.taxLevyPercentChange)})`],
    ['Town-wide rate per $1,000', `$${c.rate2025.toFixed(3)}`, `$${c.rate2026.toFixed(3)}`, `+$${c.rateDollarChange.toFixed(3)} (${pct(c.ratePercentChange)})`],
    ['Appropriations, all funds', a25 ? dollars(a25.totals.appropriations) : '—', dollars(total.appropriations2026), change(a25?.totals.appropriations, total.appropriations2026)],
    ['Appropriated fund balance, all funds', a25 ? dollars(a25.totals.fundBalance) : '—', dollars(total.appropriatedFundBalance2026), change(a25?.totals.fundBalance, total.appropriatedFundBalance2026)],
    ['General Fund appropriations', a25?.funds.A01 ? dollars(a25.funds.A01.appropriations) : '—', dollars(general.appropriations2026), change(a25?.funds.A01?.appropriations, general.appropriations2026)],
  ]
  // News reports of the 2026 rate increase quoted the Tentative's rate. The
  // adopted budget raised the same levy at a slightly higher rate, so the two
  // percentages differ; say which is which rather than leave a reader to guess.
  const t26 = stageDoc(2026, 'tentative')?.townWide
  const rateNote = t26?.rate && t26.priorRate && t26.rate !== c.rate2026
    ? `News reports of a ${((t26.rate / t26.priorRate - 1) * 100).toFixed(2)}% rise quoted the 2026 Tentative’s $${t26.rate.toFixed(3)}; the adopted budget raised the same levy at $${c.rate2026.toFixed(3)}, a rate figured on a slightly smaller assessed value. `
    : ''
  const cell = { padding: '7px 9px', borderBottom: '1px solid var(--rbl-border-subtle)', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
  return (
    // minWidth 0: a grid item otherwise grows to the table's width and the page scrolls sideways on a phone.
    <section id="adopted-2025-2026" style={{ ...card, scrollMarginTop: 80, minWidth: 0 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>The last adopted change: 2025 → 2026</h2>
      <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>What the Board adopted for 2026 against what it adopted for 2025. The Financial Health page measures its growth signals from these figures.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['', '2025 adopted', '2026 adopted', 'Change'].map((h) => <th key={h} style={{ ...cell, textAlign: h ? 'right' : 'left', color: 'var(--rbl-text-muted)', fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, before, after, chg]) => (
              <tr key={label}>
                <td style={{ ...cell, textAlign: 'left', whiteSpace: 'normal' }}>{label}</td>
                <td style={cell}>{before}</td>
                <td style={{ ...cell, fontWeight: 800 }}>{after}</td>
                <td style={{ ...cell, color: 'var(--rbl-accent)', fontWeight: 800 }}>{chg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 0 }}>
        {rateNote}Sources: the <a href={c.source.url} style={{ color: 'var(--rbl-accent)' }}>2026 Adopted Budget</a>, {c.source.page}, which prints each town-wide figure beside 2025’s; the all-funds and General Fund rows set it against the {a25 ? <a href={a25.source.url} style={{ color: 'var(--rbl-accent)' }}>2025 Adopted Budget</a> : '2025 Adopted Budget'}.
      </p>
    </section>
  )
}
