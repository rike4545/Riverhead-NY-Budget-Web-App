'use client'

import { useEffect, useId, useState } from 'react'
import { CircleCheck, CircleX, CircleAlert, Download, Plus, Printer, Trash2 } from 'lucide-react'
import { surveyKit, SURVEY_SCALE, type Department } from '../lib/dept-efficiency'
import {
  costPerUnit, tallyResult, standardResult, qualityCsv, SUGGESTED_MEASURES, SUGGESTED_STANDARDS, PLAN_STATUS,
  type OutputMeasure, type Standard, type Tally, type StrategicPlan, type PlanStatus,
} from '../lib/quality-inputs'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 20 } as const
const h3 = { margin: '18px 0 6px', color: 'var(--rbl-title)', fontSize: 17 } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const input = { minHeight: 44, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontSize: 15, fontFamily: 'inherit', width: '100%' } as const
const small = { ...input, width: 96, textAlign: 'right' } as const
const btn = { minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' } as const
const chip = { ...btn, minHeight: 36, fontWeight: 600, fontSize: 14, padding: '6px 10px' } as const
const sub = { border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, marginBottom: 10 } as const
const label = { display: 'grid', gap: 4, fontWeight: 700, color: 'var(--rbl-text-strong)', fontSize: 14.5 } as const
const th = { textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #444', fontWeight: 700 } as const
const td = { padding: '4px 6px', borderBottom: '1px solid #ddd', verticalAlign: 'top' } as const

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 100 ? 2 : 0 }).format(n)
const pct = (n: number) => `${n.toFixed(1)}%`
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`
const num = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v.replace(/,/g, ''))) || 0)
let seq = 0
const newId = () => `q${Date.now().toString(36)}${(seq++).toString(36)}`

const MAX_MEASURES = 5
const MAX_STANDARDS = 8

type Saved = { plan: StrategicPlan; measures: OutputMeasure[]; counts: Record<string, number[]>; population: number | null; standards: Standard[] }
const emptyPlan = (): StrategicPlan => ({ status: null, title: '', adopted: '', link: '', mission: '', goals: '' })
const empty = (): Saved => ({ plan: emptyPlan(), measures: [], counts: {}, population: null, standards: [] })
const storageKey = (key: string) => `rbl-quality-${key}`

export default function QualityInputs({ d, years }: { d: Department; years: number[] }) {
  const [s, setS] = useState<Saved>(empty)
  const [loaded, setLoaded] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [stored, setStored] = useState(true)

  useEffect(() => {
    let next = empty()
    try {
      const raw = localStorage.getItem(storageKey(d.key))
      if (raw) {
        const v = JSON.parse(raw)
        next = { ...empty(), ...v, plan: { ...emptyPlan(), ...(v.plan ?? {}) }, standards: (v.standards ?? []).map((x: Standard) => ({ ...x, source: x.source ?? '' })) }
      }
    } catch { setStored(false) }
    setS(next)
    setLoaded(d.key)
    setConfirmClear(false)
  }, [d.key])

  useEffect(() => {
    if (loaded !== d.key) return
    try { localStorage.setItem(storageKey(d.key), JSON.stringify(s)) } catch { setStored(false) }
  }, [s, loaded, d.key])

  useEffect(() => {
    const off = () => document.documentElement.classList.remove('eff-quality-printing')
    window.addEventListener('afterprint', off)
    return () => window.removeEventListener('afterprint', off)
  }, [])

  const kit = surveyKit(d)
  const scaleAnswers = SURVEY_SCALE.split(', ').map((a) => a.replace(/^./, (c) => c.toUpperCase()))
  const toTally = (q: (typeof kit.resident)[number]): Tally | null =>
    q.kind === 'open' ? null : { question: q.text, kind: q.kind, answers: q.kind === 'scale' ? scaleAnswers : q.kind === 'yesno' ? ['Yes', 'No', 'Not sure'] : q.choices ?? [], counts: s.counts[q.text] ?? [] }
  const residentTallies = kit.resident.map(toTally).filter((t): t is Tally => t !== null)
  const staffTallies = kit.staff.map(toTally).filter((t): t is Tally => t !== null)
  const allTallies = [...residentTallies, ...staffTallies]

  const set = (patch: Partial<Saved>) => setS((x) => ({ ...x, ...patch }))
  const setMeasure = (id: string, patch: Partial<OutputMeasure>) => set({ measures: s.measures.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const setStandard = (id: string, patch: Partial<Standard>) => set({ standards: s.standards.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const setCount = (q: string, i: number, n: number | null, len: number) => {
    const c = Array.from({ length: len }, (_, k) => s.counts[q]?.[k] ?? 0)
    c[i] = n ?? 0
    set({ counts: { ...s.counts, [q]: c } })
  }

  const download = () => {
    const csv = qualityCsv(d.name, d.actual, s.measures, allTallies, s.population, s.standards, s.plan)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `quality-${d.key}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const print = () => {
    document.documentElement.classList.add('eff-quality-printing')
    window.print()
  }
  const setPlan = (patch: Partial<StrategicPlan>) => set({ plan: { ...s.plan, ...patch } })
  const hasAny = s.plan.status !== null || s.measures.length > 0 || s.standards.length > 0 || Object.values(s.counts).some((c) => c.some((x) => x > 0))
  const suggestedM = (SUGGESTED_MEASURES[d.group] ?? SUGGESTED_MEASURES['1']).filter((x) => !s.measures.some((m) => m.name === x.name))
  const suggestedS = (SUGGESTED_STANDARDS[d.group] ?? SUGGESTED_STANDARDS['1']).filter((x) => !s.standards.some((m) => m.name === x))

  return (
    <section style={card} aria-labelledby="eff-quality" data-eff-quality>
      <h2 id="eff-quality" style={h2}>Quality inputs for {d.name}</h2>
      <p style={prose}>
        The budget records show what a department costs, not what it delivers. Enter what it produces, what the survey answers were, and how often
        it meets its service standards, and this works out cost per unit, satisfaction and results against each standard.
      </p>
      <p style={{ ...help, margin: '0 0 12px' }}>
        {stored
          ? 'What you enter stays in this browser, saved for this department on this device only. Nothing is sent anywhere. Download a spreadsheet or print a report to share it.'
          : 'This browser is not letting the page save, so entries will be lost when you leave. Download a spreadsheet or print a report before you go.'}
      </p>

      <h3 style={h3}>1. Strategic plan or mission statement</h3>
      <p style={{ ...help, margin: '0 0 8px' }}>Measures mean most against goals the department has set. Has {d.name} adopted a strategic plan or mission statement?</p>
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 10px' }}>
        <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Has {d.name} adopted a strategic plan or mission statement?</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PLAN_STATUS.map((o) => (
            <label key={o.id} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', minHeight: 44, padding: '6px 12px', borderRadius: 10, border: `1px solid ${s.plan.status === o.id ? 'var(--rbl-link)' : 'var(--rbl-border)'}`, color: 'var(--rbl-text-strong)', fontSize: 15, cursor: 'pointer' }}>
              <input type="radio" name={`plan-${d.key}`} checked={s.plan.status === o.id} onChange={() => setPlan({ status: o.id as PlanStatus })} style={{ width: 18, height: 18 }} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      {(s.plan.status === 'yes' || s.plan.status === 'in-progress') && (
        <div style={{ ...sub, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))' }}>
          <label style={label}>Title<input value={s.plan.title} onChange={(e) => setPlan({ title: e.target.value })} style={input} autoComplete="off" /></label>
          <label style={label}>Adopted or last updated<input value={s.plan.adopted} onChange={(e) => setPlan({ adopted: e.target.value })} style={input} autoComplete="off" /></label>
          <label style={label}>Where to find it (web page or document)<input value={s.plan.link} onChange={(e) => setPlan({ link: e.target.value })} style={input} autoComplete="off" /></label>
          <label style={{ ...label, gridColumn: '1 / -1' }}>Mission statement, in the department’s words<textarea value={s.plan.mission} onChange={(e) => setPlan({ mission: e.target.value })} rows={3} style={{ ...input, minHeight: 80 }} /></label>
          <label style={{ ...label, gridColumn: '1 / -1' }}>Goals, one per line<textarea value={s.plan.goals} onChange={(e) => setPlan({ goals: e.target.value })} rows={3} style={{ ...input, minHeight: 80 }} /></label>
        </div>
      )}
      {s.plan.status === 'no' && <p style={{ ...prose, fontSize: 15 }}>Without a plan, the measures below have no goal to be read against. A short mission statement and two or three goals with published service targets is a common place to start.</p>}

      <h3 style={h3}>2. What the department produces</h3>
      <p style={{ ...help, margin: '0 0 8px' }}>Enter a count for each year you have. Cost per unit divides that year’s actual spending ({usd(d.latestActual)} in {years[years.length - 1]}) by the count.</p>
      {s.measures.map((m) => {
        const r = costPerUnit(d.actual, m)
        return (
          <div key={m.id} style={sub} data-measure>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', alignItems: 'end' }}>
              <label style={label}>Measure<input value={m.name} onChange={(e) => setMeasure(m.id, { name: e.target.value })} style={input} autoComplete="off" /></label>
              <label style={label}>Unit<input value={m.unit} onChange={(e) => setMeasure(m.id, { unit: e.target.value })} style={input} autoComplete="off" /></label>
              <button type="button" onClick={() => set({ measures: s.measures.filter((x) => x.id !== m.id) })} style={{ ...btn, justifySelf: 'start' }}><Trash2 size={16} aria-hidden /> Remove measure</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {years.map((y) => (
                <label key={y} style={{ ...label, fontWeight: 600, fontSize: 13.5 }}>
                  {y}
                  <input inputMode="numeric" aria-label={`${m.name || 'Measure'}, ${m.unit || 'units'} in ${y}`} value={m.values[y] ?? ''} onChange={(e) => setMeasure(m.id, { values: { ...m.values, [y]: num(e.target.value) } })} style={small} />
                </label>
              ))}
            </div>
            {r.rows.length > 0 && (
              <p aria-live="polite" style={{ ...prose, margin: '10px 0 0', fontSize: 15 }}>
                Cost per {m.unit.replace(/s$/, '') || 'unit'}: {r.rows.map((x) => `${usd(x.cost)} in ${x.year}`).join(', ')}.
                {r.change !== null && <> From {r.rows[0].year} to {r.rows[r.rows.length - 1].year} that is {signed(r.change)}{r.perYear !== null ? ` (${signed(r.perYear)} a year)` : ''}.</>}
              </p>
            )}
          </div>
        )
      })}
      {s.measures.length < MAX_MEASURES && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestedM.map((x) => (
            <button key={x.name} type="button" style={chip} onClick={() => set({ measures: [...s.measures, { id: newId(), name: x.name, unit: x.unit, values: {} }] })}><Plus size={14} aria-hidden /> {x.name}</button>
          ))}
          <button type="button" style={chip} onClick={() => set({ measures: [...s.measures, { id: newId(), name: '', unit: '', values: {} }] })}><Plus size={14} aria-hidden /> Another measure</button>
        </div>
      )}

      <h3 style={h3}>3. Survey results</h3>
      <p style={{ ...help, margin: '0 0 8px' }}>
        Enter how many people chose each answer on the printed surveys below. The share satisfied comes with a margin of error: the range that would
        likely hold if everyone served had answered. Fewer than 30 answers is too few to read much into.
      </p>
      <label style={{ ...label, maxWidth: 360, marginBottom: 10 }}>
        Number of people served in the period (optional)
        <input inputMode="numeric" value={s.population ?? ''} onChange={(e) => set({ population: num(e.target.value) })} style={input} />
        <span style={{ ...help, fontWeight: 400, fontSize: 13 }}>Narrows the margin of error when a large share of them answered.</span>
      </label>
      <TallyGroup title="Resident survey" tallies={residentTallies} population={s.population} setCount={setCount} />
      <TallyGroup title="Staff survey" tallies={staffTallies} population={s.population} setCount={setCount} />

      <h3 style={h3}>4. Service standards</h3>
      <p style={{ ...help, margin: '0 0 8px' }}>
        A standard is a promise with a target, such as a permit issued within a set number of days, a set share of the time. Use the department’s own
        targets, as published on its page of the Town’s website or in a plan or policy it has adopted, and say where. This site suggests no targets:
        without the department’s own, the page reports the rate but not whether the standard was met.
      </p>
      {s.standards.map((x) => {
        const r = standardResult(x)
        return (
          <div key={x.id} style={sub} data-standard>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', alignItems: 'end' }}>
              <label style={label}>Standard<input value={x.name} onChange={(e) => setStandard(x.id, { name: e.target.value })} style={input} autoComplete="off" /></label>
              <label style={label}>Promise<input value={x.promise} onChange={(e) => setStandard(x.id, { promise: e.target.value })} style={input} autoComplete="off" /></label>
              <label style={label}>Department’s target, % of cases<input inputMode="numeric" value={x.target ?? ''} onChange={(e) => { const v = num(e.target.value); setStandard(x.id, { target: v === null ? null : Math.min(100, v) }) }} style={input} /></label>
              <label style={label}>Where the target is defined<input value={x.source} onChange={(e) => setStandard(x.id, { source: e.target.value })} style={input} autoComplete="off" /></label>
              <label style={label}>Cases that met it<input inputMode="numeric" value={x.met ?? ''} onChange={(e) => setStandard(x.id, { met: num(e.target.value) })} style={input} /></label>
              <label style={label}>Total cases<input inputMode="numeric" value={x.total ?? ''} onChange={(e) => setStandard(x.id, { total: num(e.target.value) })} style={input} /></label>
              <button type="button" onClick={() => set({ standards: s.standards.filter((y) => y.id !== x.id) })} style={{ ...btn, justifySelf: 'start' }}><Trash2 size={16} aria-hidden /> Remove</button>
            </div>
            <p aria-live="polite" style={{ ...prose, margin: '10px 0 0', fontSize: 15, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              {r.rate === null
                ? (x.met !== null && x.total !== null && x.met > (x.total ?? 0) ? <><CircleAlert size={18} aria-hidden color="var(--rbl-warn)" /> Cases that met it cannot be more than the total.</> : <span style={help}>Enter both counts to see the result.</span>)
                : r.met === null
                  ? <><CircleAlert size={18} aria-hidden color="var(--rbl-warn)" /> {pct(r.rate)} of cases. Add the department’s own target, and where it is defined, to see whether the standard was met.</>
                  : r.met
                  ? <><CircleCheck size={18} aria-hidden color="var(--rbl-success)" /> Met: {pct(r.rate)} of cases against the department’s target of {x.target}%{x.source ? ` (${x.source})` : ''}.</>
                  : <><CircleX size={18} aria-hidden color="var(--rbl-danger)" /> Not met: {pct(r.rate)} of cases against the department’s target of {x.target}%{x.source ? ` (${x.source})` : ''}, {Math.abs(r.gap ?? 0).toFixed(1)} points short.</>}
            </p>
          </div>
        )
      })}
      {s.standards.length < MAX_STANDARDS && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestedS.map((x) => (
            <button key={x} type="button" style={chip} onClick={() => set({ standards: [...s.standards, { id: newId(), name: x, promise: '', target: null, source: '', met: null, total: null }] })}><Plus size={14} aria-hidden /> {x}</button>
          ))}
          <button type="button" style={chip} onClick={() => set({ standards: [...s.standards, { id: newId(), name: '', promise: '', target: null, source: '', met: null, total: null }] })}><Plus size={14} aria-hidden /> Another standard</button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18, alignItems: 'center' }}>
        <button type="button" onClick={download} disabled={!hasAny} style={{ ...btn, opacity: hasAny ? 1 : 0.6 }}><Download size={16} aria-hidden /> Download as a spreadsheet</button>
        <button type="button" onClick={print} disabled={!hasAny} style={{ ...btn, background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', borderColor: 'var(--rbl-cta-bg)', opacity: hasAny ? 1 : 0.6 }}><Printer size={16} aria-hidden /> Print or save the report as a PDF</button>
        {hasAny && (confirmClear
          ? <button type="button" onClick={() => { set(empty()); setConfirmClear(false) }} style={{ ...btn, color: 'var(--rbl-danger)' }}><Trash2 size={16} aria-hidden /> Yes, clear everything for {d.name}</button>
          : <button type="button" onClick={() => setConfirmClear(true)} style={btn}><Trash2 size={16} aria-hidden /> Clear this department’s entries</button>)}
      </div>

      {hasAny && <Report d={d} s={s} tallies={allTallies} />}
    </section>
  )
}

function TallyGroup({ title, tallies, population, setCount }: { title: string; tallies: Tally[]; population: number | null; setCount: (q: string, i: number, n: number | null, len: number) => void }) {
  const id = useId()
  return (
    <fieldset style={{ ...sub, margin: '0 0 10px' }} aria-describedby={id}>
      <legend style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', padding: '0 4px' }}>{title}</legend>
      <span id={id} style={{ ...help, fontSize: 13 }}>Open-ended questions are read, not counted, so they are not listed here.</span>
      {tallies.map((t) => {
        const r = tallyResult(t, population)
        return (
          <div key={t.question} style={{ padding: '10px 0', borderTop: '1px solid var(--rbl-border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--rbl-text-strong)', fontSize: 15 }}>{t.question}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {t.answers.map((a, i) => (
                <label key={a} style={{ ...label, fontWeight: 500, fontSize: 13.5 }}>
                  {a}
                  <input inputMode="numeric" aria-label={`${t.question} ${a}: number of answers`} value={t.counts[i] || ''} onChange={(e) => setCount(t.question, i, num(e.target.value), t.answers.length)} style={{ ...small, width: 84 }} />
                </label>
              ))}
            </div>
            {r.n > 0 && (
              <p aria-live="polite" style={{ ...prose, margin: '6px 0 0', fontSize: 14.5 }}>
                {r.n} {r.n === 1 ? 'answer' : 'answers'}.{r.mean !== null && <> Average {r.mean.toFixed(2)} of {t.answers.length}.</>} {pct(r.share ?? 0)} {r.shareLabel}, give or take {(r.margin ?? 0).toFixed(1)} points.
                {r.tooFew && <span style={{ color: 'var(--rbl-warn-strong)', fontWeight: 700 }}> Fewer than 30 answers: too few to rely on.</span>}
              </p>
            )}
          </div>
        )
      })}
    </fieldset>
  )
}

function Report({ d, s, tallies }: { d: Department; s: Saved; tallies: Tally[] }) {
  const answered = tallies.map((t) => ({ t, r: tallyResult(t, s.population) })).filter((x) => x.r.n > 0)
  return (
    <article id="eff-quality-report" aria-label={`Quality report for ${d.name}`} style={{ marginTop: 18, background: '#fff', color: '#111', border: '1px solid var(--rbl-border)', borderRadius: 8, padding: '20px 24px', fontSize: 13.5, lineHeight: 1.45 }}>
      <div style={{ fontWeight: 800, fontSize: 17 }}>Quality report: {d.name}</div>
      <div style={{ color: '#444', marginBottom: 10 }}>{d.fundName} ({d.fund}), function {d.fn}. Spending from the Town’s Budget Supplements; counts, survey answers and standards as entered by the department.</div>
      {s.plan.status !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Strategic plan or mission statement: {PLAN_STATUS.find((x) => x.id === s.plan.status)?.label}</div>
          {s.plan.title && <div>{s.plan.title}{s.plan.adopted ? `, ${s.plan.adopted}` : ''}{s.plan.link ? `. ${s.plan.link}` : ''}</div>}
          {s.plan.mission && <div style={{ marginTop: 4 }}><strong>Mission:</strong> {s.plan.mission}</div>}
          {s.plan.goals && <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>{s.plan.goals.split('\n').filter((g) => g.trim()).map((g, i) => <li key={i}>{g.trim()}</li>)}</ul>}
        </div>
      )}
      {s.measures.some((m) => costPerUnit(d.actual, m).rows.length) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0' }}>Cost per unit of service</caption>
          <thead><tr><th scope="col" style={th}>Measure</th><th scope="col" style={th}>Year</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Units</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Spending</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Per unit</th></tr></thead>
          <tbody>
            {s.measures.flatMap((m) => costPerUnit(d.actual, m).rows.map((r) => (
              <tr key={`${m.id}${r.year}`}><td style={td}>{m.name}</td><td style={td}>{r.year}</td><td style={{ ...td, textAlign: 'right' }}>{r.units.toLocaleString('en-US')} {m.unit}</td><td style={{ ...td, textAlign: 'right' }}>{usd(r.spending)}</td><td style={{ ...td, textAlign: 'right' }}>{usd(r.cost)}</td></tr>
            )))}
          </tbody>
        </table>
      )}
      {answered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0' }}>Survey results{s.population ? `, ${s.population.toLocaleString('en-US')} served` : ''}</caption>
          <thead><tr><th scope="col" style={th}>Question</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Answers</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Average</th><th scope="col" style={th}>Share (± margin)</th></tr></thead>
          <tbody>
            {answered.map(({ t, r }) => (
              <tr key={t.question}><td style={td}>{t.question}</td><td style={{ ...td, textAlign: 'right' }}>{r.n}{r.tooFew ? ' (too few)' : ''}</td><td style={{ ...td, textAlign: 'right' }}>{r.mean === null ? '' : r.mean.toFixed(2)}</td><td style={td}>{pct(r.share ?? 0)} {r.shareLabel} (± {(r.margin ?? 0).toFixed(1)})</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {s.standards.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0' }}>Service standards</caption>
          <thead><tr><th scope="col" style={th}>Standard</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Target</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Actual</th><th scope="col" style={th}>Result</th></tr></thead>
          <tbody>
            {s.standards.map((x) => {
              const r = standardResult(x)
              return <tr key={x.id}><td style={td}>{x.name}{x.promise ? `: ${x.promise}` : ''}</td><td style={{ ...td, textAlign: 'right' }}>{x.target === null ? 'None entered' : `${x.target}%`}{x.source ? <div style={{ fontSize: 11.5, color: '#444' }}>{x.source}</div> : null}</td><td style={{ ...td, textAlign: 'right' }}>{r.rate === null ? '' : `${pct(r.rate)} (${x.met} of ${x.total})`}</td><td style={td}>{r.rate === null ? 'Not entered' : r.met === null ? 'No department target' : r.met ? 'Met' : 'Not met'}</td></tr>
            })}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: '#555', borderTop: '1px solid #ccc', paddingTop: 6 }}>Prepared with the unofficial department efficiency view at Riverhead Budget Live. Counts and survey answers are the department’s own and are not checked by the site.</div>
    </article>
  )
}
