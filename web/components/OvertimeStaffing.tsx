'use client'

import { useState } from 'react'

// Mirrors the serializable shapes exported by lib/overtime-staffing.ts. That lib
// reads the full payroll record set at build time and is server-only, so the
// computed summary arrives here as props rather than being imported.
export type RankYearProp = {
  year: number
  headcount: number
  totalBase: number
  totalOvertime: number
  avgBase: number
  otShareOfBase: number
  fteCovered: number
}
export type RankTrendProp = {
  union: string
  title: string
  years: RankYearProp[]
  latest: RankYearProp
  meanFte: number
  persistent: boolean
}
export type FillCostProp = {
  path: 'external hire' | 'promotion + backfill'
  cost: { low: number; mid: number; high: number }
  promotionDifferential?: number
  backfillBase?: number
}
export type CostComparisonProp = {
  union: string
  title: string
  avgBase: number
  entryBase: number
  isEntryRank: boolean
  overtimeCost: number
  fill: FillCostProp
  hireAtAverage: { low: number; mid: number; high: number }
  savingAtEntryMid: number
  rankAnnualOpportunityMid: number
}
export type IndividualCheckProp = {
  threshold: number
  recordsChecked: number
  countOverThreshold: number
  countOverHalfBase: number
  highestRatio: number
  highestRatioYear: number
  highestRatioTitle: string
}

export type OvertimeStaffingProps = {
  trends: RankTrendProp[]
  flagged: RankTrendProp[]
  comparisons: CostComparisonProp[]
  individual: IndividualCheckProp
  totalOpportunityMid: number
  benefitLoad: { low: number; mid: number; high: number }
  benefitBasis: { low: string; mid: string; high: string }
  benefitExplainer: string
  benefitSource: { title: string; detail: string; url: string }
  otPremium: number
  latestYear: number
  caveats: string[]
  sourceNote: string
  unionLabels: Record<string, string>
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function OvertimeStaffing(p: OvertimeStaffingProps) {
  const [load, setLoad] = useState<'low' | 'mid' | 'high'>('mid')

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* How to read this */}
      <section style={{ background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #4a7297', borderRadius: 14, padding: '16px 18px' }}>
        <strong style={{ color: '#284a69', fontSize: 16 }}>The question this answers</strong>
        <p style={{ color: '#1f3a52', fontSize: 14.5, lineHeight: 1.6, margin: '6px 0 0' }}>
          Overtime is paid at <strong>{p.otPremium}×</strong> the normal rate. So {usd(150_000)} of overtime buys about{' '}
          {usd(100_000)} worth of actual labor hours — roughly one more officer&apos;s worth of coverage. When one rank
          runs a full position or more of overtime <em>year after year</em>, the Town is staffing that rank by premium
          instead of by headcount, and it is worth costing out whether a hire would be cheaper.
        </p>
      </section>

      {/* The individual test that finds nothing — stated first, on purpose */}
      <section style={{ ...card, borderLeft: '6px solid #15803d', background: '#f0fdf4' }}>
        <h3 style={{ margin: '0 0 6px', color: '#166534', fontSize: 17 }}>
          First, what this is <em>not</em>: there is no runaway-individual overtime problem
        </h3>
        <p style={{ color: '#14532d', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>
          The obvious test is to flag any officer whose overtime exceeds{' '}
          <strong>{p.individual.threshold}× their base salary</strong>. Across all{' '}
          {p.individual.recordsChecked.toLocaleString()} sworn pay records on file, that test flags{' '}
          <strong>{p.individual.countOverThreshold}</strong> people. The highest individual ratio ever recorded is{' '}
          <strong>{pct(p.individual.highestRatio)}</strong> of base ({p.individual.highestRatioTitle || 'sworn officer'},{' '}
          {p.individual.highestRatioYear}), and only {p.individual.countOverHalfBase} record
          {p.individual.countOverHalfBase === 1 ? ' has' : 's have'} ever exceeded even half of base pay. Whatever is
          happening in Riverhead&apos;s overtime line, it is not a handful of people running up enormous individual
          totals. The pattern is structural, and it shows up by rank.
        </p>
      </section>

      {/* Flagged ranks */}
      <section>
        <h3 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 20 }}>
          Ranks running a full position or more of overtime
        </h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px', maxWidth: 880 }}>
          A rank is flagged when its overtime covers at least one full position&apos;s worth of straight-time hours in{' '}
          {p.latestYear} <em>and</em> did so in most years on record — a sustained pattern, not a single bad year.
        </p>

        {p.flagged.length === 0 ? (
          <div style={{ ...card }}>
            <p style={{ margin: 0, color: '#475569' }}>No rank currently meets both conditions.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {p.flagged.map((t) => {
              const c = p.comparisons.find((x) => x.union === t.union && x.title === t.title)
              return <RankCard key={`${t.union}|${t.title}`} t={t} c={c} load={load} unionLabels={p.unionLabels} benefitLoad={p.benefitLoad} />
            })}
          </div>
        )}
      </section>

      {/* Benefit-load control */}
      <section style={{ ...card, borderLeft: '6px solid #92400e', background: '#fffbeb' }}>
        <h3 style={{ margin: '0 0 6px', color: '#92400e', fontSize: 16 }}>
          What a hire costs beyond salary — from Riverhead&apos;s own filing
        </h3>
        <p style={{ color: '#78350f', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px' }}>{p.benefitExplainer}</p>
        <p style={{ color: '#78350f', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 12px' }}>
          So the range below is not doubt about the Town&apos;s numbers. It is one methodological choice, shown rather
          than hidden: split health insurance per person and the load lands near{' '}
          <strong>{Math.round(p.benefitLoad.low * 100)}%</strong>; split it per dollar of wages and it reaches{' '}
          <strong>{Math.round(p.benefitLoad.high * 100)}%</strong>.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['low', 'mid', 'high'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setLoad(k)}
              title={p.benefitBasis[k]}
              style={{
                cursor: 'pointer', borderRadius: 999, padding: '7px 15px', fontWeight: 800, fontSize: 13.5, textAlign: 'left',
                border: '1px solid', borderColor: load === k ? '#92400e' : '#fde68a',
                background: load === k ? '#92400e' : 'white', color: load === k ? 'white' : '#92400e',
              }}
            >
              +{Math.round(p.benefitLoad[k] * 100)}%
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{p.benefitBasis[k]}</span>
            </button>
          ))}
        </div>
        <div style={{ color: '#92400e', fontSize: 12.5, marginTop: 10 }}>
          Source: {p.benefitSource.title} — {p.benefitSource.detail}.
        </div>
        {p.totalOpportunityMid > 0 && load === 'mid' && (
          <p style={{ color: '#78350f', fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 0' }}>
            At this load, covering the flagged ranks&apos; overtime hours with entry-step hires instead models out to
            roughly <strong>{usd(p.totalOpportunityMid)} a year</strong> — before the caveats below, every one of which
            matters.
          </p>
        )}
      </section>

      {/* Caveats */}
      <section style={{ ...card }}>
        <h3 style={{ margin: '0 0 10px', color: '#284a69', fontSize: 17 }}>Why this is a question to cost out, not a conclusion</h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {p.caveats.map((c, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: '#475569', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: '#94a3b8', fontWeight: 900 }}>›</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: '14px 0 0', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          {p.sourceNote}
        </p>
      </section>
    </div>
  )
}

function RankCard({
  t, c, load, unionLabels, benefitLoad,
}: {
  t: RankTrendProp
  c?: CostComparisonProp
  load: 'low' | 'mid' | 'high'
  unionLabels: Record<string, string>
  benefitLoad: { low: number; mid: number; high: number }
}) {
  const maxFte = Math.max(...t.years.map((y) => y.fteCovered), 1)
  const hire = c ? c.fill.cost[load] : 0
  const saving = c ? c.overtimeCost - hire : 0

  return (
    <section style={{ ...card, borderLeft: '6px solid #b45309' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, color: '#284a69', fontSize: 18 }}>{t.title}</h4>
        <span style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 800 }}>
          {unionLabels[t.union] ?? t.union}
        </span>
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>
          {t.latest.headcount} on the payroll in {t.latest.year}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '14px 0' }}>
        <Stat label={`Positions' worth of hours on overtime, ${t.latest.year}`} value={t.latest.fteCovered.toFixed(1)} accent />
        <Stat label="Overtime paid" value={usd(t.latest.totalOvertime)} />
        <Stat label="Overtime as a share of base pay" value={pct(t.latest.otShareOfBase)} />
        <Stat label={`Average base, ${t.latest.year}`} value={usd(t.latest.avgBase)} />
      </div>

      {/* Year-by-year bars */}
      <div style={{ margin: '0 0 14px' }}>
        <div style={{ color: '#64748b', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7 }}>
          Positions&apos; worth of overtime hours, by year
        </div>
        <div style={{ display: 'grid', gap: 5 }}>
          {t.years.map((y) => (
            <div key={y.year} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, width: 38 }}>{y.year}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 5, height: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (y.fteCovered / maxFte) * 100)}%`, background: '#b45309', height: '100%', borderRadius: 5 }} />
              </div>
              <span style={{ color: '#1f2933', fontSize: 12.5, fontWeight: 800, width: 62, textAlign: 'right' }}>
                {y.fteCovered.toFixed(1)} FTE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost comparison */}
      {c && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ color: '#284a69', fontWeight: 900, fontSize: 14, marginBottom: 10 }}>
            Covering one position&apos;s hours: overtime vs. a hire
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
            <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ color: '#b91c1c', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>With overtime</div>
              <div style={{ color: '#b91c1c', fontSize: 21, fontWeight: 950, margin: '3px 0' }}>{usd(c.overtimeCost)}</div>
              <div style={{ color: '#7f1d1d', fontSize: 12.5 }}>Average base {usd(c.avgBase)} × 1.5</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ color: '#166534', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {c.isEntryRank ? 'With an entry-step hire' : 'With a promotion + backfill'}
              </div>
              <div style={{ color: '#166534', fontSize: 21, fontWeight: 950, margin: '3px 0' }}>{usd(hire)}</div>
              <div style={{ color: '#14532d', fontSize: 12.5, lineHeight: 1.45 }}>
                {c.isEntryRank ? (
                  <>Entry base {usd(c.entryBase)} + {Math.round(benefitLoad[load] * 100)}% benefits</>
                ) : (
                  <>
                    This rank is promotional — it can&apos;t be hired into. Promoting an officer costs{' '}
                    {usd(c.fill.promotionDifferential ?? 0)} more than their current pay, and backfilling the vacancy
                    costs an entry officer at {usd(c.fill.backfillBase ?? 0)}. Both loaded at{' '}
                    {Math.round(benefitLoad[load] * 100)}% benefits.
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 11, fontSize: 14.5, lineHeight: 1.6, color: saving > 0 ? '#166534' : '#92400e', fontWeight: 700 }}>
            {saving > 0
              ? `Filling the post is about ${usd(saving)} a year cheaper than covering it with overtime — roughly ${usd(saving * t.latest.fteCovered)} across the ${t.latest.fteCovered.toFixed(1)} positions' worth this rank actually runs.`
              : `At this benefit load, filling the post costs about ${usd(Math.abs(saving))} a year more than the overtime it would replace — the case for adding headcount here rests on coverage and fatigue, not savings.`}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>
            Backfilling at the rank&apos;s <em>average</em> base instead of the bottom of the schedule costs{' '}
            {usd(c.hireAtAverage[load])} — the saving depends entirely on hiring at the bottom of the ladder, not at
            the top of it.
          </div>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#fff7ed' : '#f8fafc', border: `1px solid ${accent ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 13px' }}>
      <div style={{ color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.35 }}>{label}</div>
      <div style={{ color: accent ? '#b45309' : '#284a69', fontSize: 21, fontWeight: 950, marginTop: 3 }}>{value}</div>
    </div>
  )
}
