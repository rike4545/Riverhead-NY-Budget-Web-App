'use client'

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { CircleAlert, Printer, TrendingDown, TrendingUp, Ban } from 'lucide-react'
import QualityInputs from './QualityInputs'
import { GROUPS, SURVEY_SCALE, surveyKit, type Department, type SurveyQuestion } from '../lib/dept-efficiency'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 20 } as const
const h3 = { margin: '16px 0 6px', color: 'var(--rbl-title)', fontSize: 17 } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const input = { minHeight: 44, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontSize: 15, fontFamily: 'inherit', width: '100%' } as const
const btn = { minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' } as const
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--rbl-border)', fontWeight: 700, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' } as const
const td = { padding: '6px 8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
const num = { ...td, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const usd2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const pct = (n: number | null, signed = true) => (n === null ? '—' : `${signed ? (n >= 0 ? '+' : '−') : ''}${Math.abs(n).toFixed(1)}%`)

type SortKey = 'spending' | 'growth' | 'perResident' | 'variance' | 'over' | 'review'
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'spending', label: 'Spending, latest year' },
  { id: 'growth', label: 'Growth per year' },
  { id: 'perResident', label: 'Cost per resident' },
  { id: 'variance', label: 'Distance from budget' },
  { id: 'over', label: 'Years over budget' },
  { id: 'review', label: 'Lines to review' },
]
const sortValue = (d: Department, k: SortKey) =>
  k === 'spending' ? d.latestActual : k === 'growth' ? (d.growth?.perYear ?? -Infinity) : k === 'perResident' ? d.perResident
    : k === 'variance' ? (d.avgVariance ?? -Infinity) : k === 'over' ? d.yearsOver : d.review.length

function SelectField({ text, value, onChange, children }: { text: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  const id = useId()
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label htmlFor={id} style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', fontSize: 15 }}>{text}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={input}>{children}</select>
    </div>
  )
}

export default function DepartmentEfficiency({ departments, lastYear, currentYear, budgetYear, population, populationAsOf }: {
  departments: Department[]; lastYear: number; currentYear: number; budgetYear: number; population: number; populationAsOf: string
}) {
  const [group, setGroup] = useState('all')
  const [sort, setSort] = useState<SortKey>('spending')
  const [key, setKey] = useState(departments[0]?.key ?? '')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const off = () => document.documentElement.classList.remove('eff-printing')
    window.addEventListener('afterprint', off)
    return () => window.removeEventListener('afterprint', off)
  }, [])

  const rows = useMemo(() => departments.filter((d) => group === 'all' || d.group === group).sort((a, b) => sortValue(b, sort) - sortValue(a, sort)), [departments, group, sort])
  const shown = showAll ? rows : rows.slice(0, 15)
  const dept = departments.find((d) => d.key === key)
  const choose = (k: string) => {
    setKey(k)
    requestAnimationFrame(() => document.getElementById('eff-dept')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div>
      <section style={card} aria-labelledby="eff-compare">
        <h2 id="eff-compare" style={h2}>Compare departments</h2>
        <p style={prose}>
          {departments.length} departments and cost centers, each a fund and function in the Town’s accounts. Sort by any measure, then choose a
          department to see its record and a survey kit for it.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', marginBottom: 12 }}>
          <SelectField text="Kind of service" value={group} onChange={setGroup}>
            <option value="all">All departments</option>
            {Object.entries(GROUPS).filter(([g]) => departments.some((d) => d.group === g)).map(([g, label]) => <option key={g} value={g}>{label}</option>)}
          </SelectField>
          <SelectField text="Sort by" value={sort} onChange={(v) => setSort(v as SortKey)}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </SelectField>
        </div>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <caption style={{ ...help, textAlign: 'left', paddingBottom: 6 }}>Sorted by {SORTS.find((s) => s.id === sort)!.label.toLowerCase()}, highest first. Choose a name to open it below.</caption>
            <thead>
              <tr>
                <th scope="col" style={th}>Department</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Spent {lastYear}</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Growth per year</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Per resident</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>From budget</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Years over</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Lines to review</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.key} aria-current={d.key === key ? 'true' : undefined}>
                  <th scope="row" style={{ ...td, fontWeight: 400 }}>
                    <button type="button" onClick={() => choose(d.key)} style={{ background: 'none', border: 0, padding: '4px 0', minHeight: 24, color: 'var(--rbl-link)', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontSize: 'inherit', fontFamily: 'inherit', textDecoration: 'underline' }}>{d.name}</button>
                    <div style={{ ...help, fontSize: 12.5 }}>{d.fund}-{d.fn}, {d.fundName}{d.key === key ? ' · shown below' : ''}</div>
                  </th>
                  <td style={num}>{usd(d.latestActual)}</td>
                  <td style={num}>{d.growth?.perYear === null || !d.growth ? '—' : pct(d.growth.perYear)}</td>
                  <td style={num}>{usd2(d.perResident)}</td>
                  <td style={num}>{pct(d.avgVariance, false)}</td>
                  <td style={num}>{d.yearsCompared ? `${d.yearsOver} of ${d.yearsCompared}` : '—'}</td>
                  <td style={num}>{d.review.length || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 15 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} style={{ ...btn, marginTop: 10 }} aria-expanded={showAll}>
            {showAll ? 'Show the first 15' : `Show all ${rows.length}`}
          </button>
        )}
        <p style={{ ...help, margin: '10px 0 0' }}>
          Growth per year is the compound annual change in actual spending from the first year with spending to {lastYear}. Per resident divides {lastYear}{' '}
          spending by {population.toLocaleString('en-US')} residents (Census Bureau estimate, {populationAsOf}); districts serve only part of the Town, so their
          per-resident figures understate what each household served pays. From budget is how far spending landed from the adopted budget, on average,
          weighted by budget. Benefits are budgeted fund-wide and are not in any department’s figures.
        </p>
      </section>

      {dept && <DepartmentPanel d={dept} lastYear={lastYear} currentYear={currentYear} budgetYear={budgetYear} />}
      {dept && <QualityInputs d={dept} years={Object.keys(dept.actual).map(Number).sort((a, b) => a - b)} />}
      {dept && <SurveyKit d={dept} />}
    </div>
  )
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ ...help, fontSize: 13.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--rbl-text-strong)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {note && <div style={{ ...help, fontSize: 12.5 }}>{note}</div>}
    </div>
  )
}

function DepartmentPanel({ d, lastYear, currentYear, budgetYear }: { d: Department; lastYear: number; currentYear: number; budgetYear: number }) {
  const mixTotal = d.mix.personal + d.mix.equipment + d.mix.contractual + d.mix.other
  const mix = [
    { label: 'Personal services (wages, overtime)', v: d.mix.personal, color: 'var(--rbl-series-blue, #2a6fdb)' },
    { label: 'Equipment', v: d.mix.equipment, color: 'var(--rbl-series-teal, #0f8b8d)' },
    { label: 'Contractual (supplies, services, utilities)', v: d.mix.contractual, color: 'var(--rbl-series-gold, #b7791f)' },
    { label: 'Other', v: d.mix.other, color: 'var(--rbl-series-slate, #64748b)' },
  ].filter((m) => m.v > 0)
  const questions = reviewQuestions(d, lastYear)
  return (
    <section id="eff-dept" style={{ ...card, scrollMarginTop: 80 }} aria-labelledby="eff-dept-h" data-eff-department={d.key}>
      <h2 id="eff-dept-h" style={h2}>{d.name}</h2>
      <p style={{ ...help, margin: '0 0 12px' }}>{d.fundName} ({d.fund}), function {d.fn}, {GROUPS[d.group]?.toLowerCase()}. {d.lines} budget lines.</p>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(min(170px,100%),1fr))' }}>
        <Tile label={`Spent in ${lastYear}`} value={usd(d.latestActual)} note={`Budget ${usd(d.latestBudget)}`} />
        <Tile label={`${currentYear} budget`} value={usd(d.currentBudget)} note={d.proposed ? `${budgetYear} Preliminary ${usd(d.proposed)}` : undefined} />
        <Tile label="Growth per year" value={d.growth?.perYear == null ? '—' : pct(d.growth.perYear)} note={d.growth ? `${usd(d.growth.from)} in ${d.growth.first} to ${usd(d.growth.to)} in ${d.growth.last}` : undefined} />
        <Tile label="From budget, on average" value={pct(d.avgVariance, false)} note={d.yearsCompared ? `Over budget ${d.yearsOver} of ${d.yearsCompared} years` : undefined} />
        <Tile label="Overtime share of pay" value={pct(d.overtimeShare, false)} note={d.overtimeShare === null ? 'No payroll lines here' : `${lastYear}`} />
      </div>

      <h3 style={h3}>Budget and spending by year</h3>
      <div data-scroll-region style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
          <thead><tr><th scope="col" style={th}>Year</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Adopted budget</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Actual</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Actual ÷ budget</th></tr></thead>
          <tbody>
            {d.execution.map((e) => (
              <tr key={e.year}>
                <th scope="row" style={{ ...td, fontWeight: 600 }}>{e.year}</th>
                <td style={num}>{usd(e.budget)}</td>
                <td style={num}>{usd(e.actual)}</td>
                <td style={{ ...num, color: e.ratio !== null && e.ratio > 1 ? 'var(--rbl-warn-strong)' : undefined, fontWeight: e.ratio !== null && e.ratio > 1 ? 700 : undefined }}>{e.ratio === null ? '—' : `${(e.ratio * 100).toFixed(0)}%`}</td>
              </tr>
            ))}
            <tr><th scope="row" style={{ ...td, fontWeight: 600 }}>{currentYear}</th><td style={num}>{usd(d.currentBudget)}</td><td style={{ ...td, ...help }} colSpan={2}>Year in progress</td></tr>
            {d.proposed > 0 && <tr><th scope="row" style={{ ...td, fontWeight: 600 }}>{budgetYear}</th><td style={num}>{usd(d.proposed)}</td><td style={{ ...td, ...help }} colSpan={2}>Preliminary budget</td></tr>}
          </tbody>
        </table>
      </div>
      <p style={{ ...help, margin: '6px 0 0' }}>These are original adopted budgets. The Board amends budgets during the year, so a year over its original budget may have been covered by a transfer; see <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/budget-changes/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Budget changes the Board approved</a>.</p>

      {mix.length > 0 && (
        <>
          <h3 style={h3}>What the {lastYear} spending paid for</h3>
          <div role="img" aria-label={mix.map((m) => `${m.label} ${Math.round((m.v / mixTotal) * 100)}%`).join(', ')} style={{ display: 'flex', height: 18, borderRadius: 4, overflow: 'hidden', gap: 2, background: 'var(--rbl-surface)' }}>
            {mix.map((m) => <div key={m.label} style={{ width: `${(m.v / mixTotal) * 100}%`, background: m.color }} />)}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 4 }}>
            {mix.map((m) => (
              <li key={m.label} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14.5, color: 'var(--rbl-text-body)' }}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                <span>{m.label}: {usd(m.v)} ({Math.round((m.v / mixTotal) * 100)}%)</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 style={h3}>Lines a review would start with</h3>
      {d.review.length === 0
        ? <p style={prose}>No line with a budget of $5,000 or more was over budget, well under it or unused in four of the last five years.</p>
        : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {d.review.map((r) => (
              <li key={r.account} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14.5, lineHeight: 1.5, color: 'var(--rbl-text-body)' }}>
                {r.why === 'over' ? <TrendingUp size={18} aria-label="Over budget" color="var(--rbl-warn)" style={{ flexShrink: 0, marginTop: 2 }} />
                  : r.why === 'unused' ? <Ban size={18} aria-label="Unused" color="var(--rbl-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <TrendingDown size={18} aria-label="Under budget" color="var(--rbl-accent)" style={{ flexShrink: 0, marginTop: 2 }} />}
                <span><strong>{r.name}</strong> <span style={{ ...help, fontSize: 13 }}>{r.account}</span><br />{r.detail}. {currentYear} budget {usd(r.budget)}.</span>
              </li>
            ))}
          </ul>
        )}

      <h3 style={h3}>Questions for a review</h3>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.55 }}>
        {questions.map((q, i) => <li key={i}>{q}</li>)}
      </ul>
      <p style={{ ...help, margin: '10px 0 0', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <CircleAlert size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
        These measures come from the Town’s budget records. They point to questions worth asking, not conclusions: a line can run over for good reasons (a storm, a new mandate) and run under because a position sat vacant.
      </p>
    </section>
  )
}

/** Questions the department's own numbers raise. */
function reviewQuestions(d: Department, lastYear: number): string[] {
  const q: string[] = []
  if (d.growth?.perYear != null && d.growth.perYear >= 5) q.push(`Spending grew about ${d.growth.perYear.toFixed(1)}% a year from ${d.growth.first} to ${d.growth.last}. What drove it: more service, higher prices, new duties, or more staff?`)
  if (d.yearsCompared && d.yearsOver >= Math.ceil(d.yearsCompared / 2)) q.push(`Spending ran over the original budget in ${d.yearsOver} of ${d.yearsCompared} years. Is the budget set too low, or is the overrun something to manage?`)
  if (d.avgVariance !== null && d.avgVariance >= 15) q.push(`Spending landed ${d.avgVariance.toFixed(0)}% from budget on average. Could budgeting this department be more precise, freeing money for other uses?`)
  if (d.overtimeShare !== null && d.overtimeShare >= 8) q.push(`Overtime was ${d.overtimeShare.toFixed(1)}% of pay in ${lastYear}. How much is weather or emergencies, and how much is covering vacancies that hiring would cost less to fill?`)
  if (d.review.some((r) => r.why === 'under')) q.push('Some lines are budgeted well above what they spend year after year. Could those budgets be reduced, or the money moved to where it is needed?')
  if (d.review.some((r) => r.why === 'unused')) q.push('Some lines are budgeted but not used. Are they still needed?')
  if (d.mix.contractual > d.mix.personal && d.mix.contractual > 0) q.push('Most spending is contractual. When were the largest contracts last bid, and could they be shared with another department or town?')
  q.push('Has the department adopted a strategic plan or mission statement, with goals and published service targets? Without them there is nothing to measure performance against.')
  q.push('What does this department produce each year (permits issued, calls answered, miles paved, participants served), and is that number tracked? Cost per unit of service is the measure the budget records cannot give.')
  q.push('Which tasks are repeated, done on paper, or entered twice, and could they be moved online or combined with another department’s?')
  return q
}

function SurveyKit({ d }: { d: Department }) {
  const kit = surveyKit(d)
  const print = () => {
    document.documentElement.classList.add('eff-printing')
    window.print()
  }
  return (
    <section style={card} aria-labelledby="eff-survey">
      <h2 id="eff-survey" style={h2}>Survey kit for {d.name}</h2>
      <p style={prose}>
        Two short questionnaires, one for residents who use the service and one for the staff who provide it. Print them, or copy the questions into
        a form tool the Town already uses. This site does not collect any answers.
      </p>
      <ul style={{ ...prose, paddingLeft: 20 }}>
        <li>Ask everyone who used the service in a set period (for example every permit applicant in a month), not only those who volunteer, so the results are not tilted toward the happiest or angriest.</li>
        <li>Keep staff answers anonymous and report them only in groups large enough that no one can be identified.</li>
        <li>Ask the same questions each year, so the answers can be compared with the spending above.</li>
      </ul>
      <button type="button" onClick={print} style={{ ...btn, background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', borderColor: 'var(--rbl-cta-bg)', marginBottom: 14 }}>
        <Printer size={18} aria-hidden /> Print or save the survey kit as a PDF
      </button>
      <article id="eff-survey-kit" aria-label={`Survey kit for ${d.name}`} style={{ background: '#fff', color: '#111', border: '1px solid var(--rbl-border)', borderRadius: 8, padding: '24px 28px', fontSize: 14, lineHeight: 1.5 }}>
        <Questionnaire title={`Resident survey: ${d.name}`} intro={`The Town of Riverhead wants to know how well ${d.name} serves you. Your answers are anonymous and take about five minutes.`} qs={kit.resident} />
        <div className="eff-page-break" style={{ marginTop: 24 }}>
          <Questionnaire title={`Staff survey: ${d.name}`} intro="This survey asks how the work gets done and where time or money could be saved. Answers are anonymous and reported only in groups." qs={kit.staff} />
        </div>
        <footer style={{ marginTop: 18, fontSize: 11, color: '#555', borderTop: '1px solid #ccc', paddingTop: 6 }}>
          Drafted with the unofficial department efficiency view at Riverhead Budget Live. Adapt the questions before use.
        </footer>
      </article>
    </section>
  )
}

function Questionnaire({ title, intro, qs }: { title: string; intro: string; qs: SurveyQuestion[] }) {
  const options = (q: SurveyQuestion) => (q.kind === 'scale' ? SURVEY_SCALE.split(', ').map((s) => s.replace(/^./, (c) => c.toUpperCase())) : q.kind === 'yesno' ? ['Yes', 'No', 'Not sure'] : q.choices ?? [])
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{title}</div>
      <p style={{ margin: '0 0 12px', color: '#333' }}>{intro}</p>
      <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 12 }}>
        {qs.map((q, i) => (
          <li key={i} style={{ breakInside: 'avoid' }}>
            <div style={{ fontWeight: 600 }}>{q.text}</div>
            {q.kind === 'open'
              ? <div aria-hidden style={{ borderBottom: '1px solid #888', height: 22, marginTop: 4 }}><div style={{ borderBottom: '1px solid #888', height: 44 }} /></div>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 4 }}>{options(q).map((o) => <span key={o}><span aria-hidden style={{ display: 'inline-block', width: 12, height: 12, border: '1.5px solid #222', borderRadius: 2, marginRight: 5, verticalAlign: '-1px' }} />{o}</span>)}</div>}
          </li>
        ))}
      </ol>
    </div>
  )
}
