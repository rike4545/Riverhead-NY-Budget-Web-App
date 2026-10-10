'use client'

import { useState } from 'react'
import BarRows from './charts/BarRows'
import type { ProgramSeries, SeriesProgram } from '../lib/programs'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const

const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
// Steps down through M / K / plain dollars so a small real number reads as
// itself rather than as "$0.00M".
const money = (n: number) => {
  const m = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (m >= 1e6) return `${sign}$${(m / 1e6).toFixed(m < 1e7 ? 2 : 1)}M`
  if (m >= 1e4) return `${sign}$${Math.round(m / 1e3).toLocaleString('en-US')}K`
  return usd(n)
}

/** "Up $4.4M (+4.5%) from 2025", in words, for the line under a figure. */
function changeWords(now: number, before: number, fmt: (n: number) => string, versus: string) {
  const d = now - before
  if (Math.abs(d) < 0.5) return `Same as ${versus}`
  const rel = before > 0 ? ` (${d > 0 ? '+' : '−'}${Math.abs((d / before) * 100).toFixed(1)}%)` : ''
  return `${d > 0 ? 'Up' : 'Down'} ${fmt(Math.abs(d))}${rel} from ${versus}`
}
const signed = (d: number) => (Math.abs(d) < 0.5 ? 'no change' : `${d > 0 ? '+' : '−'}${money(Math.abs(d))}`)
const relative = (now: number, before: number) => {
  if (!(before > 0) || Math.abs(now - before) < 0.5) return '—'
  const r = ((now - before) / before) * 100
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)}%`
}

// One hue per program, from the validated series palette, so a program reads
// as the same colour in the chart and on its own card.
const TONES: Record<string, string> = {
  '3': 'var(--rbl-series-blue)',
  '8': 'var(--rbl-series-teal)',
  '1': 'var(--rbl-series-indigo)',
  '5': 'var(--rbl-series-gold)',
  '7': 'var(--rbl-series-violet)',
  '4': 'var(--rbl-series-slate)',
  '6': 'var(--rbl-series-blue)',
}

type Measure = 'fullCost' | 'earned' | 'net'
const MEASURES: { key: Measure; label: string; lede: string }[] = [
  { key: 'fullCost', label: 'Full cost', lede: 'What each service costs once pension and health insurance are counted.' },
  { key: 'earned', label: 'Earned back', lede: 'What each service brings back in fees, charges and aid tied to it.' },
  { key: 'net', label: 'Not covered by fees', lede: 'What is left for taxes and general revenue once fees are counted.' },
]

export type People = { population: number; households: number; medianHouseholdIncome: number; censusTitle: string; censusDataset: string }

export default function ProgramExplorer({ series, people, base }: { series: ProgramSeries; people: People; base: string }) {
  const [year, setYear] = useState(series.current)
  const [compare, setCompare] = useState<number | null>(series.current > 0 ? series.current - 1 : null)
  const [measure, setMeasure] = useState<Measure>('fullCost')

  const y = series.years[year]
  const versus = compare === null ? null : series.years[compare].label
  const pick = (i: number) => { setYear(i); setCompare(i > 0 ? i - 1 : null) }
  const t = series.totals
  const change = (values: number[], fmt: (n: number) => string = money) =>
    compare === null ? undefined : changeWords(values[year], values[compare], fmt, versus!)

  return (
    <div>
      <section aria-labelledby="year-title" style={{ ...card, marginBottom: 18 }}>
        <h2 id="year-title" style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 22 }}>Choose a budget year</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, margin: '4px 0 12px' }}>
          Every budget from {series.years[0].label} to the {series.years[series.years.length - 1].label} budget, regrouped the same way. The figures below
          show the year you pick and how each one moved from the year you compare it with.
        </p>
        <div role="group" aria-label="Budget year" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {series.years.map((x, i) => (
            <button
              key={x.label}
              type="button"
              data-year={x.label}
              aria-pressed={i === year}
              onClick={() => pick(i)}
              style={{
                border: `1px solid ${i === year ? 'var(--rbl-accent)' : 'var(--rbl-border-strong)'}`,
                background: i === year ? 'var(--rbl-info-bg)' : 'var(--rbl-surface)',
                color: i === year ? 'var(--rbl-info-text)' : 'var(--rbl-title)',
                borderRadius: 999, padding: '7px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {x.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--rbl-text-body)', fontSize: 14.5 }}>
          Compared with
          <select
            value={compare === null ? '' : String(compare)}
            onChange={(e) => setCompare(e.target.value === '' ? null : Number(e.target.value))}
            style={{ padding: '6px 10px', border: '1px solid var(--rbl-border-strong)', borderRadius: 8, fontSize: 14.5, fontFamily: 'inherit' }}
          >
            <option value="">No comparison</option>
            {series.years.map((x, i) => (i === year ? null : <option key={x.label} value={i}>{x.label}</option>))}
          </select>
        </label>
        {y.stage === 'tentative' && (
          <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '10px 12px', marginTop: 12, color: 'var(--rbl-note-text)', fontSize: 14, lineHeight: 1.5 }}>
            {y.label} is the Supervisor’s Tentative Budget: a proposal the Town Board has not adopted and can still change.
          </div>
        )}
      </section>

      <section aria-live="polite" style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Cost of services" value={money(t.fullCost[year])} note={`${series.programs.length} programs, ${t.staff[year]} staff`} change={change(t.fullCost)} />
        <Stat label="Earned back in fees" value={money(t.earned[year])} note={`${((t.earned[year] / t.fullCost[year]) * 100).toFixed(0)}% recovery`} change={change(t.earned)} tone="teal" />
        <Stat label="Not covered by fees" value={money(t.net[year])} note="carried by taxes and general revenue" change={change(t.net)} tone="accent" />
        <Stat label="Per resident, services" value={usd(series.perResident.programs[year])} note={`${people.population.toLocaleString()} residents`} change={change(series.perResident.programs, usd)} />
        <Stat label="Per household, all in" value={usd(series.perHousehold.everything[year])} note={`${series.perHousehold.shareOfMedianIncome[year].toFixed(1)}% of median income`} change={change(series.perHousehold.everything, usd)} tone="gold" />
      </section>

      <YearTable series={series} year={year} measure={measure} setMeasure={setMeasure} />

      <section style={{ ...card, marginBottom: 18 }}>
        <BarRows
          title={`What each service costs in ${y.title}, once benefits are counted`}
          lede="Full cost: the department’s own appropriation plus the pension, health insurance and payroll taxes for the people who deliver it. Beside each bar, the share the service earns back from the people who use it."
          rows={series.programs.map((p) => ({
            label: p.name,
            value: p.fullCost[year],
            display: `${money(p.fullCost[year])} · earns ${p.recoveryPct[year].toFixed(0)}%`,
            note: `${usd(p.net[year] / people.population)} per resident after fees${compare === null ? '' : ` · ${signed(p.fullCost[year] - p.fullCost[compare])} from ${versus}`}`,
            color: TONES[p.key],
          }))}
          format={money}
          source={`Source: ${y.supplement ? y.supplement.title : 'Budget Supplement'}, every account line. Benefits allocated by the Town's own uniformed/non-uniformed account split.`}
        />
      </section>

      <div style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
        {series.programs.map((p) => (
          <ProgramCard key={p.key} p={p} year={year} compare={compare} series={series} people={people} />
        ))}
      </div>

      <PerPerson series={series} year={year} compare={compare} people={people} base={base} />
    </div>
  )
}

function YearTable({ series, year, measure, setMeasure }: { series: ProgramSeries; year: number; measure: Measure; setMeasure: (m: Measure) => void }) {
  const years = series.years
  const last = years.length - 1
  const m = MEASURES.find((x) => x.key === measure)!
  const total = series.totals[measure]
  const th = { padding: '8px 10px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontWeight: 600 }
  const cell = (i: number) => ({ padding: '8px 10px', textAlign: 'right' as const, verticalAlign: 'top' as const, background: i === year ? 'var(--rbl-info-bg)' : undefined })
  const Row = ({ name, values, strong }: { name: string; values: number[]; strong?: boolean }) => (
    <tr style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
      <th scope="row" style={{ padding: '8px 10px', textAlign: 'left', fontWeight: strong ? 700 : 600, color: 'var(--rbl-title)', minWidth: 150 }}>{name}</th>
      {values.map((v, i) => (
        <td key={years[i].label} style={cell(i)}>
          <div style={{ fontWeight: strong || i === year ? 700 : 400, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{money(v)}</div>
          {i > 0 && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{relative(v, values[i - 1])}</div>}
        </td>
      ))}
      <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', fontVariantNumeric: 'tabular-nums' }}>{signed(values[last] - values[0])}</div>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{relative(values[last], values[0])}</div>
      </td>
    </tr>
  )
  return (
    <section aria-labelledby="by-year-title" id="by-year" style={{ ...card, marginBottom: 18 }}>
      <h2 id="by-year-title" style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 22 }}>Year by year</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, margin: '4px 0 12px' }}>
        {m.lede} Under each figure is its change from the year before; the last column is the change across the whole span. The year
        you picked above is shaded.
      </p>
      <div role="group" aria-label="What to compare" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {MEASURES.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={x.key === measure}
            onClick={() => setMeasure(x.key)}
            style={{
              border: `1px solid ${x.key === measure ? 'var(--rbl-title)' : 'var(--rbl-border-strong)'}`,
              background: x.key === measure ? 'var(--rbl-surface-2)' : 'var(--rbl-surface)',
              color: 'var(--rbl-title)', borderRadius: 8, padding: '6px 12px', fontSize: 14, fontWeight: x.key === measure ? 700 : 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={{ ...th, textAlign: 'left' }}>Service</th>
              {years.map((x, i) => <th key={x.label} style={{ ...th, background: i === year ? 'var(--rbl-info-bg)' : undefined }}>{x.label}</th>)}
              <th style={th}>Change, {years[0].label} to {years[last].label}</th>
            </tr>
          </thead>
          <tbody>
            {series.programs.map((p) => <Row key={p.key} name={p.name} values={p[measure]} />)}
            <Row name="All services" values={total} strong />
            {measure === 'fullCost' && (
              <>
                <Row name="Debt service" values={series.totals.debtService} />
                <Row name="Set aside to savings" values={series.totals.setAside} />
                <Row name="Transfers between Town funds" values={series.totals.interfundTransfers} />
                <Row name="Everything budgeted" values={series.totals.appropriations} strong />
              </>
            )}
          </tbody>
        </table>
      </div>
      {measure === 'fullCost' && (
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0 0' }}>
          Services, debt service, money set aside and transfers between Town funds add up to everything each budget appropriates, to the dollar.
        </p>
      )}
    </section>
  )
}

function ProgramCard({ p, year, compare, series, people }: { p: SeriesProgram; year: number; compare: number | null; series: ProgramSeries; people: People }) {
  const tone = TONES[p.key]
  const y = series.years[year]
  const versus = compare === null ? null : series.years[compare].label
  const change = (values: number[]) => (compare === null ? undefined : changeWords(values[year], values[compare], money, versus!))
  const recovery = p.recoveryPct[year]
  const net = p.net[year]
  const pieces = p.departments.filter((d) => d.amounts[year] > 0).sort((a, b) => b.amounts[year] - a.amounts[year])
  const charges = p.revenues.filter((r) => r.amounts[year] > 0).sort((a, b) => b.amounts[year] - a.amounts[year]).slice(0, 6)
  const moved = compare === null ? [] : p.departments
    .map((d) => ({ d, delta: d.amounts[year] - d.amounts[compare] }))
    .filter((x) => Math.abs(x.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5)

  return (
    <section style={{ ...card, borderColor: tone }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 23 }}>{p.name}</h2>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 600 }}>
          NY function {p.key}000s · {pieces.length} departments in {y.label}
        </span>
      </div>
      <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15.5, lineHeight: 1.5, margin: '6px 0 0', fontWeight: 600 }}>{p.plain}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, margin: '14px 0' }}>
        <Stat label="Full cost" value={money(p.fullCost[year])} note={`${money(p.direct[year])} + ${money(p.benefits[year])} benefits`} change={change(p.fullCost)} />
        <Stat label="Earns back" value={money(p.earned[year])} note={`${recovery.toFixed(0)}% of cost`} change={change(p.earned)} tone="teal" />
        <Stat label="Not covered by fees" value={money(net)} note={net < 0 ? 'fees exceed the cost' : undefined} change={change(p.net)} tone="accent" />
        <Stat label="Per resident" value={usd(net / people.population)} note="after fees" />
        <Stat label="Per household" value={usd(net / people.households)} note="after fees" />
        <Stat label="Staff" value={p.staff[year] > 0 ? String(p.staff[year]) : '—'} note={p.staff[year] > 0 ? `${y.staffYear} payroll` : 'contracted out'} />
      </div>

      {/* Cost-recovery meter: how much of the bar the users pay for. */}
      <div>
        <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, recovery))}%`, background: tone, transition: 'width .45s ease' }} />
          <div style={{ flex: 1, background: 'var(--rbl-track)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>
          {recovery >= 100 ? (
            <>
              <span>Fees cover all of it in {y.label}</span>
              <span>{money(-net)} more than it costs</span>
            </>
          ) : (
            <>
              <span>{recovery.toFixed(0)}% paid by the people who use it</span>
              <span style={{ marginLeft: 'auto' }}>{(100 - recovery).toFixed(0)}% carried by taxes and general revenue</span>
            </>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.8, lineHeight: 1.62, margin: '14px 0 0' }}>{p.narrative[year]}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 14, marginTop: 14, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 14 }}>
        <div>
          <h3 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>What it buys</h3>
          <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
            {p.buys.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div>
          <h3 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>Biggest pieces in {y.label}</h3>
          <AmountList
            rows={pieces.slice(0, 5).map((d) => ({ key: `${d.fund}-${d.code}`, name: d.name, sub: `${d.fund} ${d.code}`, amount: d.amounts[year], delta: compare === null ? null : d.amounts[year] - d.amounts[compare] }))}
          />
        </div>
        <div>
          <h3 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>{charges.length > 0 ? 'What it charges for' : 'It charges for nothing'}</h3>
          {charges.length > 0 ? (
            <AmountList
              teal
              rows={charges.map((r) => ({ key: r.name, name: r.name, amount: r.amounts[year], delta: compare === null ? null : r.amounts[year] - r.amounts[compare] }))}
            />
          ) : (
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              No fee revenue is coded to this function, so the tax levy carries all of it.
            </p>
          )}
        </div>
        {compare !== null && (
          <div>
            <h3 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>Biggest changes from {versus}</h3>
            {moved.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
                {moved.map(({ d, delta }) => (
                  <li key={`${d.fund}-${d.code}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--rbl-text-body)' }}>
                    <span>
                      {d.name} <span style={{ color: 'var(--rbl-text-faint)', fontSize: 11.5 }}>{d.fund} {d.code}</span>
                      {d.amounts[compare] === 0 && <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}> · new</span>}
                      {d.amounts[year] === 0 && <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}> · none in {y.label}</span>}
                    </span>
                    <strong style={{ color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap', fontWeight: 600 }}>{signed(delta)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: 0 }}>No department changed.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function AmountList({ rows, teal }: { rows: { key: string; name: string; sub?: string; amount: number; delta: number | null }[]; teal?: boolean }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
      {rows.map((r) => (
        <li key={r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--rbl-text-body)' }}>
          <span>{r.name}{r.sub && <> <span style={{ color: 'var(--rbl-text-faint)', fontSize: 11.5 }}>{r.sub}</span></>}</span>
          <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <strong style={{ color: teal ? 'var(--rbl-teal-strong)' : 'var(--rbl-text-strong)', fontWeight: 700 }}>{money(r.amount)}</strong>
            {r.delta !== null && <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{signed(r.delta)}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function PerPerson({ series, year, compare, people, base }: { series: ProgramSeries; year: number; compare: number | null; people: People; base: string }) {
  const y = series.years[year]
  const versus = compare === null ? null : series.years[compare].label
  const change = (values: number[]) => (compare === null ? undefined : changeWords(values[year], values[compare], usd, versus!))
  return (
    <section style={{ ...card, marginBottom: 18 }}>
      <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>What {y.title} costs per person, and per household</h2>
      <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
        Riverhead has <strong>{people.population.toLocaleString()}</strong> residents living in{' '}
        <strong>{people.households.toLocaleString()}</strong> households, with a median household income of{' '}
        <strong>{usd(people.medianHouseholdIncome)}</strong>. Spread the Town&apos;s net cost across them and you get the
        scale of Town government relative to the people in it. The same counts divide every year, so a change here is the
        budget&apos;s change and nothing else.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, margin: '14px 0' }}>
        <Stat label="Services, per resident" value={usd(series.perResident.programs[year])} change={change(series.perResident.programs)} />
        <Stat label="Services, per household" value={usd(series.perHousehold.programs[year])} change={change(series.perHousehold.programs)} tone="accent" />
        <Stat label="Debt service, per household" value={usd(series.perHousehold.debtService[year])} change={change(series.perHousehold.debtService)} />
        <Stat label="All in, per household" value={usd(series.perHousehold.everything[year])} tone="gold" note={`${series.perHousehold.shareOfMedianIncome[year].toFixed(1)}% of median household income`} change={change(series.perHousehold.everything)} />
      </div>
      <div style={{ background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '12px 14px' }}>
        <strong style={{ color: 'var(--rbl-danger-strong)' }}>This is not your tax bill.</strong>{' '}
        <span style={{ color: 'var(--rbl-danger-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
          Commercial and industrial property carries a large share of the levy, fees carry another, and some of
          this cost never touches a household directly. What you actually owe depends on your assessment —{' '}
          <a href={`${base}/tax-bill/`} style={{ color: 'var(--rbl-danger-strong)', fontWeight: 600 }}>work it out on the tax bill page</a>.
        </span>
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>
        Source: {people.censusTitle} — {people.censusDataset}. Household count carries a margin of error, so treat
        per-household figures as approximate. “All in” adds debt service and money set aside to the services&apos; net cost.
      </p>
    </section>
  )
}

function Stat({ label, value, note, change, tone }: { label: string; value: string; note?: string; change?: string; tone?: 'accent' | 'teal' | 'gold' }) {
  return (
    <div style={{ background: tone === 'accent' ? 'var(--rbl-info-bg)' : tone === 'gold' ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: 21, color: tone === 'teal' ? 'var(--rbl-teal-strong)' : tone === 'gold' ? 'var(--rbl-note-text)' : 'var(--rbl-title)', display: 'block', lineHeight: 1.2, fontWeight: 700 }}>{value}</strong>
      {note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.35, marginTop: 2 }}>{note}</div>}
      {change && <div style={{ color: 'var(--rbl-text-body)', fontSize: 12, lineHeight: 1.35, marginTop: 4 }}>{change}</div>}
    </div>
  )
}
