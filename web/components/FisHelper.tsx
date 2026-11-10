'use client'

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { CircleCheck, CircleAlert, CircleX, Copy, Plus, Printer, Trash2 } from 'lucide-react'
import {
  ACTIONS, MAX_ENTRIES, REVENUE_KIND_LABEL, checkDraft, formatMoney, fundBalanceRow, newAccountCode, reconcile, sectionG, statementTotal, tableEntries, writeStatement,
  type Draft, type Entry, type EntryAction, type HelperData, type Row,
} from '../lib/fis-helper'

// The interactive fiscal impact statement helper (lib/fis-helper.ts), modelled
// on the Town's form. Runs entirely in the browser: nothing typed here is sent
// or saved anywhere.

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const label = { display: 'grid', gap: 4, fontWeight: 700, color: 'var(--rbl-text-strong)', fontSize: 15 } as const
const input = { minHeight: 44, padding: '8px 10px', fontSize: 16, borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', width: '100%' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 400, lineHeight: 1.5 } as const
const btn = { minHeight: 44, padding: '6px 14px', borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 } as const
const h2 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 20 } as const
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** A select with its own label element, so the label alone names it (a select inside its label would add every option's text to its name). */
function SelectField({ text, hint, value, onChange, children, narrow }: { text: string; hint?: ReactNode; value: string; onChange: (v: string) => void; children: ReactNode; narrow?: boolean }) {
  const id = useId()
  return (
    <div style={label}>
      <label htmlFor={id}>{text}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...input, ...(narrow ? { maxWidth: 220 } : {}) }} aria-describedby={hint ? `${id}-hint` : undefined}>
        {children}
      </select>
      {hint && <span id={`${id}-hint`} style={help}>{hint}</span>}
    </div>
  )
}

type Option = { code: string; townName: string; label: string; detail: string }
type EntryState = { id: number; deptKey: string; action: EntryAction; from: Row[]; to: Row[]; wholeFund: boolean; allRevenue: boolean; assigned: boolean; tierPurpose: string }
type Impact = '' | 'none' | 'absorbed' | 'entries'

const blank = (): Row => ({ code: '', name: '', amount: 0 })
let nextId = 1
const newEntry = (deptKey: string, action: EntryAction = 'charge'): EntryState => ({ id: nextId++, deptKey, action, from: [blank()], to: [blank()], wholeFund: false, allRevenue: false, assigned: false, tierPurpose: '' })

export default function FisHelper({ data }: { data: HelperData }) {
  const [deptKey, setDeptKey] = useState('')
  const [impact, setImpact] = useState<Impact>('')
  const [legislation, setLegislation] = useState('Resolution')
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [period, setPeriod] = useState('the 2026 fiscal year')
  const [entries, setEntries] = useState<EntryState[]>([])
  const [preparer, setPreparer] = useState('')
  const [date, setDate] = useState('')
  const [initials, setInitials] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const off = () => document.documentElement.classList.remove('fis-printing')
    window.addEventListener('afterprint', off)
    return () => window.removeEventListener('afterprint', off)
  }, [])

  const dept = data.departments.find((d) => d.key === deptKey)
  const deptOf = (key: string) => data.departments.find((d) => d.key === key)

  const draftEntries: Entry[] = entries.map((e) => {
    const fund = deptOf(e.deptKey)?.fund ?? ''
    const toTotal = e.to.reduce((s, r) => s + (r.amount || 0), 0)
    const from = e.action === 'fund-balance' && fund ? [fundBalanceRow(fund, toTotal, { assigned: e.assigned, purpose: e.tierPurpose })] : e.action === 'charge' ? [] : e.from
    return { action: e.action, from, to: e.to }
  })
  const draft: Draft = { legislation, title, purpose, period, noImpact: impact === 'none', absorbed: impact === 'absorbed', entries: draftEntries }
  const checks = impact ? checkDraft(draft) : []
  const out = impact ? writeStatement(draft) : null
  const problems = checks.filter((c) => c.level === 'error').length

  const setEntry = (id: number, patch: Partial<EntryState>) => setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  const chooseImpact = (v: Impact) => {
    setImpact(v)
    if (v === 'entries' && entries.length === 0 && deptKey) setEntries([newEntry(deptKey)])
  }

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
    } catch {
      setCopied(`${what}-failed`)
    }
  }

  const print = () => {
    document.documentElement.classList.add('fis-printing')
    window.print()
  }

  return (
    <div>
      <section className="fis-noprint" style={card} aria-labelledby="fis-dept">
        <h2 id="fis-dept" style={h2}>1. Your department</h2>
        <DeptSelect data={data} value={deptKey} onChange={(k) => { setDeptKey(k); setEntries((es) => (es.length ? es : es)) }} label="Department or fund-wide line" />
        {dept && (
          <div style={{ marginTop: 12, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>{dept.name}</strong>, {dept.fundName} ({dept.fund}), function {dept.key.split('-')[1]}: {dept.accounts.length} spending{' '}
              {dept.accounts.length === 1 ? 'line' : 'lines'} in the budget.
            </p>
            {dept.examples.length > 0 && (
              <p style={{ margin: 0, ...help, fontSize: 14 }}>
                Recent resolutions naming its accounts, to compare with:{' '}
                {dept.examples.map((x, i) => (
                  <span key={x.number}>{i > 0 ? '; ' : ''}<a href={`${base}/meetings/?meeting=${x.date}`} style={{ color: 'var(--rbl-link)' }}>{x.number}</a> ({longDate(x.date)}, {x.title})</span>
                ))}.
              </p>
            )}
          </div>
        )}
      </section>

      {dept && (
        <section className="fis-noprint" style={card} aria-labelledby="fis-ab">
          <h2 id="fis-ab" style={h2}>2. Sections A to F</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <SelectField text="A. Type of legislation" value={legislation} onChange={setLegislation} narrow>
              <option>Resolution</option>
              <option>Local Law</option>
            </SelectField>
            <label style={label}>B. Title of proposed legislation<input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="For example, Budget Adjustment for Replacement of HVAC System" /></label>
            <label style={label}>C. Purpose of proposed legislation<textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} style={{ ...input, minHeight: 80 }} placeholder="What the money buys, and why now" /></label>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <legend style={{ ...label, marginBottom: 6 }}>D and E. Will it have a fiscal impact, and how is it met?</legend>
              {([
                ['none', 'No fiscal impact', 'D: No. Sections E, F and G are left blank.'],
                ['absorbed', 'Yes, absorbed by the existing budget: E(a)', 'Routine, budgeted spending, such as goods or services the adopted budget already pays for. Initial E(a); skip F and G.'],
                ['entries', 'Yes, with accounts named: E(b)', 'Charge a budget line, add new money, use savings, or move money between lines, in one or more journal entries.'],
              ] as const).map(([v, t, d]) => (
                <label key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${impact === v ? 'var(--rbl-accent)' : 'var(--rbl-border-subtle)'}`, borderRadius: 12, padding: '10px 12px', cursor: 'pointer', minHeight: 44 }}>
                  <input type="radio" name="fis-impact" checked={impact === v} onChange={() => chooseImpact(v)} style={{ marginTop: 4, width: 20, height: 20 }} />
                  <span><strong style={{ color: 'var(--rbl-text-strong)' }}>{t}</strong><span style={{ display: 'block', ...help, fontSize: 14 }}>{d}</span></span>
                </label>
              ))}
            </fieldset>
            {impact === 'absorbed' && <label style={label}>E(a) initials<input value={initials} onChange={(e) => setInitials(e.target.value)} style={{ ...input, maxWidth: 160 }} /></label>}
            {impact === 'entries' && (
              <label style={label}>F. Total cost of funding over
                <input value={period} onChange={(e) => setPeriod(e.target.value)} style={input} />
                <span style={help}>The period the cost covers, such as a fiscal year or a contract term. The total comes from the entries below: {usd(statementTotal(draft))}.</span>
              </label>
            )}
          </div>
        </section>
      )}

      {dept && impact === 'entries' && (
        <section className="fis-noprint" style={card} aria-labelledby="fis-g">
          <h2 id="fis-g" style={h2}>3. Section G: the journal entries</h2>
          <p style={{ ...help, fontSize: 14.5, margin: '0 0 12px' }}>
            A resolution can carry one entry or up to {MAX_ENTRIES}, for example a donation and a draw on savings for the same purchase, or entries in two
            funds. Each entry balances on its own; the reconciliation below adds them all up.
          </p>
          {entries.map((e, i) => (
            <EntryEditor key={e.id} n={i + 1} count={entries.length} e={e} data={data} set={(patch) => setEntry(e.id, patch)} remove={() => setEntries((es) => es.filter((x) => x.id !== e.id))} />
          ))}
          {entries.length < MAX_ENTRIES
            ? <button type="button" onClick={() => setEntries((es) => (es.length < MAX_ENTRIES ? [...es, newEntry(deptKey)] : es))} style={btn}><Plus size={16} aria-hidden /> Add another journal entry ({entries.length} of up to {MAX_ENTRIES})</button>
            : <p style={{ ...help, margin: 0 }}>This statement has {MAX_ENTRIES} journal entries, the most this helper holds. A larger set of changes is usually an attachment, as the Town did in 2026-970 (“see attachment to this resolution”).</p>}
        </section>
      )}

      {dept && impact === 'entries' && entries.length > 0 && (
        <section className="fis-noprint" style={card} aria-labelledby="fis-recon" data-fis-reconciliation>
          <h2 id="fis-recon" style={h2}>4. Reconciliation</h2>
          <p style={{ ...help, fontSize: 14.5, margin: '0 0 12px' }}>
            Every entry added up, and what the whole resolution does to each account. An account named in more than one entry is netted, so this is
            the change the Accounting Department will post. In each fund, the rise in appropriations should equal the revenue and savings that pay for it.
          </p>
          <Reconciliation draft={draft} />
        </section>
      )}

      {dept && impact && (
        <section className="fis-noprint" style={card} aria-labelledby="fis-checks">
          <h2 id="fis-checks" style={h2}>5. Checks</h2>
          <p aria-live="polite" style={{ margin: '0 0 8px', color: problems ? 'var(--rbl-warn-strong)' : 'var(--rbl-success-strong)', fontWeight: 700 }}>
            {problems ? `${problems} ${problems === 1 ? 'item needs' : 'items need'} attention.` : 'Everything checked here is in order.'}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {checks.map((c, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14.5, lineHeight: 1.5, color: 'var(--rbl-text-body)' }}>
                {c.level === 'ok' ? <CircleCheck aria-label="Done" size={18} color="var(--rbl-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                  : c.level === 'warning' ? <CircleAlert aria-label="Note" size={18} color="var(--rbl-warn)" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <CircleX aria-label="Needs attention" size={18} color="var(--rbl-danger)" style={{ flexShrink: 0, marginTop: 2 }} />}
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dept && impact && out && (
        <>
          <section className="fis-noprint" style={card} aria-labelledby="fis-hj">
            <h2 id="fis-hj" style={h2}>6. Preparer</h2>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))' }}>
              <label style={label}>H. Typed name and title of preparer<input value={preparer} onChange={(e) => setPreparer(e.target.value)} style={input} autoComplete="off" /></label>
              <label style={label}>J. Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} /></label>
            </div>
            <p style={{ ...help, margin: '8px 0 0' }}>Optional. Signatures (I and L) and the Accounting Department’s sections (K to M) are left blank to complete on paper.</p>
          </section>

          <section className="fis-noprint" style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }} aria-label="Print or copy">
            <button type="button" onClick={print} style={{ ...btn, background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', borderColor: 'var(--rbl-cta-bg)' }}><Printer size={18} aria-hidden /> Print or save as PDF</button>
            <button type="button" onClick={() => copy('sections', out.sections)} style={btn}><Copy size={16} aria-hidden /> Copy sections A to G as text</button>
            {out.table && <button type="button" onClick={() => copy('table', out.table!)} style={btn}><Copy size={16} aria-hidden /> Copy the FROM/TO table</button>}
            <span aria-live="polite" style={help}>
              {copied === 'sections' ? 'Sections copied.' : copied === 'table' ? 'Table copied.' : copied.endsWith('-failed') ? 'This browser did not allow copying. Select the text on the form and copy it instead.' : ''}
            </span>
            <p style={{ ...help, margin: 0, width: '100%' }}>To save a PDF, choose “Save as PDF” as the printer in your browser’s print window. Problems flagged above still print, so check them first.</p>
          </section>

          <FormSheet draft={draft} initials={initials} preparer={preparer} date={date} />
        </>
      )}
    </div>
  )
}

function DeptSelect({ data, value, onChange, label: text }: { data: HelperData; value: string; onChange: (k: string) => void; label: string }) {
  return (
    <SelectField text={text} value={value} onChange={onChange} hint="Grouped by the fund that pays for it, from the 2027 Budget Supplement.">
        <option value="">Choose a department</option>
        {data.funds.map((f) => (
          <optgroup key={f.code} label={`${f.name} (${f.code})`}>
            {data.departments.filter((d) => d.fund === f.code).map((d) => (
              <option key={d.key} value={d.key}>{d.name}{d.fundWide ? ' (fund-wide)' : ''}</option>
            ))}
          </optgroup>
        ))}
    </SelectField>
  )
}

function EntryEditor({ n, count, e, data, set, remove }: { n: number; count: number; e: EntryState; data: HelperData; set: (p: Partial<EntryState>) => void; remove: () => void }) {
  const dept = data.departments.find((d) => d.key === e.deptKey)
  const fund = dept?.fund ?? ''
  const spending: Option[] = useMemo(() => {
    if (!dept) return []
    const pool = e.wholeFund ? data.departments.filter((d) => d.fund === dept.fund).flatMap((d) => d.accounts) : dept.accounts
    return pool.map((a) => ({ code: a.code, townName: a.townName, label: `${a.plain} — ${a.code}`, detail: `Town’s name “${a.townName}”. 2025 spent ${usd(a.actual)}; 2026 budget ${usd(a.budget)}; 2027 Preliminary ${usd(a.proposed)}.` }))
  }, [dept, e.wholeFund, data.departments])
  const revenue: Option[] = useMemo(() => {
    const pool = (data.revenue[fund] ?? []).filter((r) => r.kind !== 'savings')
    const fit = e.allRevenue ? pool : pool.filter((r) => r.kind === 'grant' || r.kind === 'donation' || r.kind === 'fees')
    return fit.map((r) => ({ code: r.code, townName: r.name, label: `${r.name} (${REVENUE_KIND_LABEL[r.kind]}) — ${r.code}`, detail: `2025 collected ${usd(r.actual)}; 2026 estimate ${usd(r.budget)}.` }))
  }, [fund, e.allRevenue, data.revenue])
  const toTotal = e.to.reduce((s, r) => s + (r.amount || 0), 0)
  return (
    <fieldset data-fis-entry={n} style={{ border: '1px solid var(--rbl-border)', borderRadius: 14, padding: 14, margin: '0 0 14px' }}>
      <legend style={{ fontWeight: 800, color: 'var(--rbl-title)', padding: '0 6px', fontSize: 16.5 }}>Journal entry {n}</legend>
      <div style={{ display: 'grid', gap: 12 }}>
        <DeptSelect data={data} value={e.deptKey} onChange={(k) => set({ deptKey: k, from: [blank()], to: [blank()] })} label="Department for this entry" />
        <SelectField text="What this entry does" value={e.action} onChange={(v) => set({ action: v as EntryAction, from: [blank()], to: [blank()] })} hint={ACTIONS.find((a) => a.id === e.action)?.plain}>
          {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </SelectField>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 32, fontSize: 14.5 }}>
          <input type="checkbox" checked={e.wholeFund} onChange={(ev) => set({ wholeFund: ev.target.checked })} style={{ width: 20, height: 20 }} />
          Show spending lines from every department in the {dept?.fundName ?? 'fund'}
        </label>
        {e.action === 'revenue' && (
          <>
            <Rows heading="FROM: where the new money comes from (revenue)" rows={e.from} setRows={(r) => set({ from: r })} options={revenue} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 32, fontSize: 14 }}>
              <input type="checkbox" checked={e.allRevenue} onChange={(ev) => set({ allRevenue: ev.target.checked })} style={{ width: 20, height: 20 }} />
              Show every revenue account in the fund, including taxes, transfers and borrowing
            </label>
          </>
        )}
        {e.action === 'fund-balance' && (
          <fieldset style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, margin: 0 }}>
            <legend style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', padding: '0 4px' }}>FROM: the fund’s savings ({fund}-9999-000-00000-0)</legend>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 32 }}>
              <input type="radio" name={`tier-${e.id}`} checked={!e.assigned} onChange={() => set({ assigned: false })} style={{ width: 20, height: 20 }} /> Unassigned: “Appropriated Fund Balance”
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 32 }}>
              <input type="radio" name={`tier-${e.id}`} checked={e.assigned} onChange={() => set({ assigned: true })} style={{ width: 20, height: 20 }} /> Assigned to a purpose
            </label>
            {e.assigned && (
              <label style={{ ...label, marginTop: 6 }}>The purpose the balance is held for
                <input value={e.tierPurpose} onChange={(ev) => set({ tierPurpose: ev.target.value })} style={input} placeholder="For example, CBF - Nextera Easement Phase 1" />
              </label>
            )}
            <p style={{ ...help, margin: '8px 0 0' }}>The amount is the total of the TO lines: {usd(toTotal)}. Name the tier: a draw on assigned balance does not reduce the unassigned cushion.</p>
          </fieldset>
        )}
        {e.action === 'transfer' && <Rows heading="FROM: the spending lines giving money up" rows={e.from} setRows={(r) => set({ from: r })} options={spending} />}
        <Rows heading={e.action === 'charge' ? 'The spending lines to be charged' : 'TO: the spending lines that receive the money'} rows={e.to} setRows={(r) => set({ to: r })} options={spending} builder={dept ? { fund: dept.fund, fn: dept.key.split('-')[1], objects: data.objects } : undefined} />
        {count > 1 && <button type="button" onClick={remove} style={{ ...btn, justifySelf: 'start' }}><Trash2 size={16} aria-hidden /> Remove entry {n}</button>}
      </div>
    </fieldset>
  )
}

type Builder = { fund: string; fn: string; objects: { code: string; name: string }[] }

function Rows({ heading, rows, setRows, options, builder }: { heading: string; rows: Row[]; setRows: (r: Row[]) => void; options: Option[]; builder?: Builder }) {
  const [building, setBuilding] = useState(false)
  const [obj, setObj] = useState('')
  const [sub, setSub] = useState('000')
  const [project, setProject] = useState('00000')
  const [newName, setNewName] = useState('')
  const draftCode = builder && obj ? newAccountCode(builder.fund, builder.fn, obj, sub, project) : ''
  const exists = options.some((o) => o.code === draftCode)
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const sum = rows.reduce((s, r) => s + (r.amount || 0), 0)
  return (
    <fieldset style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, margin: 0 }}>
      <legend style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', padding: '0 4px' }}>{heading}</legend>
      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((r, i) => {
          const opt = options.find((o) => o.code === r.code)
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(110px,160px) auto', gap: 8, alignItems: 'end' }}>
              {r.isNew ? (
                <div style={label}>
                  New account{rows.length > 1 ? ` ${i + 1}` : ''}
                  <span style={{ ...input, display: 'flex', alignItems: 'center', fontWeight: 400 }}>{r.code} {r.name}</span>
                </div>
              ) : (
              <SelectField text={`Account${rows.length > 1 ? ` ${i + 1}` : ''}`} value={r.code} onChange={(v) => {
                const o = options.find((x) => x.code === v)
                update(i, { code: v, name: o?.townName ?? '' })
              }}>
                <option value="">Choose an account</option>
                {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </SelectField>
              )}
              <label style={label}>
                Amount
                <input type="number" min={0} step="0.01" inputMode="decimal" value={r.amount || ''} onChange={(ev) => update(i, { amount: Number(ev.target.value) })} style={input} />
              </label>
              <button type="button" aria-label={`Remove account ${i + 1}`} onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [blank()])} style={{ ...btn, minWidth: 44, justifyContent: 'center', padding: 0 }}>
                <Trash2 size={18} aria-hidden />
              </button>
              {opt && <p style={{ ...help, gridColumn: '1 / -1', margin: 0 }}>{opt.detail}</p>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setRows([...rows, blank()])} style={btn}><Plus size={16} aria-hidden /> Add a line</button>
          {builder && <button type="button" aria-expanded={building} onClick={() => setBuilding(!building)} style={btn}><Plus size={16} aria-hidden /> A new account, not yet in the budget</button>}
        </span>
        <strong style={{ color: 'var(--rbl-text-strong)' }}>Total {usd(sum)}</strong>
      </div>
      {builder && building && (
        <div data-new-account-builder style={{ marginTop: 12, border: '1px dashed var(--rbl-border)', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
          <p style={{ ...help, margin: 0, fontSize: 14 }}>
            The number keeps this department’s fund and function ({builder.fund}, {builder.fn}). Pick what is bought (the object code), and use the
            last part for a sub-account or a capital project number. The Accounting Department assigns and creates the account, so treat this as
            the number to ask about.
          </p>
          <SelectField text="What is bought (object code)" value={obj} onChange={(v) => { setObj(v); setNewName(builder.objects.find((o) => o.code === v)?.name ?? '') }}>
            <option value="">Choose an object code</option>
            {builder.objects.map((o) => <option key={o.code} value={o.code}>{o.code}: {o.name}</option>)}
          </SelectField>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <label style={label}>Sub-object (3)<input value={sub} onChange={(ev) => setSub(ev.target.value)} maxLength={3} style={input} /></label>
            <label style={label}>Sub-account or project (5)<input value={project} onChange={(ev) => setProject(ev.target.value)} maxLength={5} inputMode="numeric" style={input} /></label>
          </div>
          <label style={label}>Account name<input value={newName} onChange={(ev) => setNewName(ev.target.value)} style={input} placeholder="As it should appear in the budget" /></label>
          {draftCode && <p style={{ margin: 0, fontSize: 15 }}>Account number: <strong>{draftCode}</strong>{exists ? ' already exists: choose it from the list instead.' : ''}</p>}
          <button type="button" disabled={!draftCode || exists || !newName.trim()} onClick={() => {
            setRows([...rows.filter((r) => r.code), { code: draftCode, name: newName.trim(), amount: 0, isNew: true }])
            setBuilding(false)
          }} style={{ ...btn, justifySelf: 'start', opacity: !draftCode || exists || !newName.trim() ? 0.6 : 1 }}>Add this new account</button>
        </div>
      )}
    </fieldset>
  )
}

// The Town's form, filled in. The wording of every section is the form's own,
// as printed in the agenda packets.
function FormSheet({ draft, initials, preparer, date }: { draft: Draft; initials: string; preparer: string; date: string }) {
  const g = sectionG(draft)
  const blocks = tableEntries(draft)
  const yes = !draft.noImpact
  const box = (on: boolean) => <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #222', marginRight: 6, verticalAlign: '-2px', textAlign: 'center', lineHeight: '12px', fontSize: 12 }}>{on ? 'X' : ''}</span>
  const rowsOf = (rs: Row[]) => (rs.length ? rs.map((r, i) => <div key={i}>{r.code} {r.name}{r.isNew ? ' (new account)' : ''} <span style={{ whiteSpace: 'nowrap' }}>{formatMoney(r.amount)}</span></div>) : <span style={{ color: '#777' }}>&nbsp;</span>)
  const field = { borderBottom: '1px solid #444', minHeight: 22, padding: '2px 4px' } as const
  const sec = { margin: '0 0 10px' } as const
  const fmtDate = date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-US') : ''
  return (
    <article id="fis-form" data-fis-form aria-label="The filled-in fiscal impact statement" style={{ background: '#fff', color: '#111', border: '1px solid var(--rbl-border)', borderRadius: 8, padding: '28px 32px', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.45, maxWidth: 820 }}>
      <header style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 0.2 }}>FISCAL IMPACT STATEMENT</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>OF PROPOSED RIVERHEAD TOWN BOARD LEGISLATION</div>
      </header>
      <div style={sec}><strong>A.</strong> Type of Legislation: <span style={field}>{draft.legislation}</span></div>
      <div style={sec}><strong>B.</strong> Title of Proposed Legislation: <span style={field}>{draft.title}</span></div>
      <div style={sec}><strong>C.</strong> Purpose of Proposed Legislation: <span style={field}>{draft.purpose}</span></div>
      <div style={sec}><strong>D.</strong> Will the Proposed Legislation have a Fiscal Impact: <span style={field}>{yes ? 'Yes' : 'No'}</span></div>
      <div style={sec}>
        <strong>E.</strong> If the answer above is &ldquo;yes&rdquo;, select (a) or (b) below and initial or detail as applicable
        <div style={{ margin: '6px 0 0 18px' }}>
          <div>{box(yes && draft.absorbed)}<strong>(a)</strong> The fiscal impact can be absorbed by Town/Department existing resources set forth in approved Town Annual Budget (example: routine and budgeted procurement of goods/services)*if selecting E (a), please initial then skip items F,G and complete H,I and J</div>
          <div style={{ margin: '4px 0 0 20px' }}>Detail/Initials: <span style={field}>{draft.absorbed ? initials : ''}</span></div>
          <div style={{ marginTop: 6 }}>{box(yes && !draft.absorbed)}<strong>(b)</strong> The description/explanation of fiscal impact is set forth as follows:</div>
        </div>
      </div>
      <div style={sec}>
        <strong>F.</strong> If the answer to E required description/explanation of fiscal impact (E(b)), please describe total Financial Cost of Funding over{' '}
        <span style={field}>{yes && !draft.absorbed ? draft.period : ''}</span>: <span style={field}>{yes && !draft.absorbed ? formatMoney(statementTotal(draft)) : ''}</span>
      </div>
      <div style={sec}>
        <strong>G.</strong> Proposed Source of Funding:
        <div style={{ margin: '6px 0 0 18px', display: 'grid', gap: 6 }}>
          <div>Appropriation Account to be Charged: <div style={field}>{rowsOf(g.charged)}</div></div>
          <div>Grant or other Revenue Source: <div style={field}>{rowsOf(g.revenue)}</div></div>
          <div>Appropriation Transfer (list account(s) and amount): <div style={field}>{rowsOf(g.transfer)}</div></div>
          {blocks.length > 0 && <div style={{ fontSize: 12.5 }}>See the attached budget table{blocks.length > 1 ? `, ${blocks.length} entries` : ''}.</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginTop: 14 }}>
        <div><strong>H.</strong> Typed Name &amp; Title of Preparer<div style={field}>{preparer}</div></div>
        <div><strong>K.</strong> Accounting Staff Name &amp; Title<div style={field} /></div>
        <div><strong>I.</strong> Signature of Preparer<div style={field} /></div>
        <div><strong>L.</strong> Signature of Accounting Staff<div style={field} /></div>
        <div><strong>J.</strong> Date<div style={field}>{fmtDate}</div></div>
        <div><strong>M.</strong> Date<div style={field} /></div>
      </div>
      {blocks.length > 0 && (
        <section className="fis-page-break" style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Attachment: budget table for the resolution</div>
          {blocks.map((b, i) => (
            <table key={i} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
              {blocks.length > 1 && <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0' }}>Entry {i + 1}</caption>}
              <thead><tr style={{ borderBottom: '1px solid #444' }}><th scope="col" style={{ textAlign: 'left', padding: 4 }}>Account</th><th scope="col" style={{ textAlign: 'right', padding: 4 }}>FROM</th><th scope="col" style={{ textAlign: 'right', padding: 4 }}>TO</th></tr></thead>
              <tbody>
                {b.from.map((r, j) => <tr key={`f${j}`}><td style={{ padding: 4 }}>{r.code} {r.name}{r.isNew ? ' (new account)' : ''}</td><td style={{ padding: 4, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatMoney(r.amount)}</td><td /></tr>)}
                {b.to.map((r, j) => <tr key={`t${j}`}><td style={{ padding: 4, paddingLeft: 24 }}>{r.code} {r.name}{r.isNew ? ' (new account)' : ''}</td><td /><td style={{ padding: 4, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatMoney(r.amount)}</td></tr>)}
              </tbody>
            </table>
          ))}
        </section>
      )}
      {blocks.length > 0 && (
        <section style={{ marginTop: 16 }} data-fis-print-reconciliation>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Reconciliation of all entries</div>
          <Reconciliation draft={draft} print />
        </section>
      )}
      <footer style={{ marginTop: 18, fontSize: 11, color: '#555', borderTop: '1px solid #ccc', paddingTop: 6 }}>
        Drafted with the unofficial fiscal impact statement helper at Riverhead Budget Live. The Town’s Accounting Department reviews every statement.
      </footer>
    </article>
  )
}

const ACTION_SHORT: Record<string, string> = { charge: 'Charge an existing line', revenue: 'Revenue', 'fund-balance': 'Fund balance', transfer: 'Transfer' }

function Reconciliation({ draft, print }: { draft: Draft; print?: boolean }) {
  const r = reconcile(draft)
  const ink = print ? '#111' : 'var(--rbl-text-body)'
  const line = print ? '#444' : 'var(--rbl-border)'
  const th = { textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${line}`, fontWeight: 700 } as const
  const td = { padding: '4px 6px', borderBottom: `1px solid ${print ? '#ddd' : 'var(--rbl-border-subtle)'}`, verticalAlign: 'top' } as const
  const num = { ...td, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const
  const signed = (n: number) => (n === 0 ? formatMoney(0) : `${n > 0 ? '+' : '−'}${formatMoney(Math.abs(n))}`)
  const status = (ok: boolean) => (print ? (ok ? 'Balances' : 'Does not balance')
    : <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', color: ok ? 'var(--rbl-success-strong)' : 'var(--rbl-warn-strong)', fontWeight: 700 }}>
        {ok ? <CircleCheck size={16} aria-hidden /> : <CircleX size={16} aria-hidden />}{ok ? 'Balances' : 'Does not balance'}
      </span>)
  const wrap = { overflowX: 'auto', marginBottom: 12 } as const
  const table = { width: '100%', borderCollapse: 'collapse', fontSize: print ? 12.5 : 14, color: ink } as const
  return (
    <div>
      <div style={wrap}>
        <table style={table}>
          <caption style={{ textAlign: 'left', fontWeight: 700, padding: '0 0 4px', color: ink }}>Entries</caption>
          <thead><tr><th scope="col" style={th}>Entry</th><th scope="col" style={th}>Kind</th><th scope="col" style={{ ...th, textAlign: 'right' }}>FROM</th><th scope="col" style={{ ...th, textAlign: 'right' }}>TO</th><th scope="col" style={th}>Result</th></tr></thead>
          <tbody>
            {r.entries.map((e) => (
              <tr key={e.n}>
                <th scope="row" style={{ ...td, fontWeight: 600 }}>{e.n}</th>
                <td style={td}>{ACTION_SHORT[e.action]}</td>
                <td style={num}>{e.action === 'charge' ? '' : formatMoney(e.from)}</td>
                <td style={num}>{formatMoney(e.to)}</td>
                <td style={td}>{e.action === 'charge' ? 'No budget change' : status(e.balanced)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ ...td, fontWeight: 700 }} colSpan={2}>All entries</th>
              <td style={{ ...num, fontWeight: 700 }}>{formatMoney(r.from)}</td>
              <td style={{ ...num, fontWeight: 700 }}>{formatMoney(r.to)}</td>
              <td style={td}>{status(r.balanced && r.from === r.to)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {r.accounts.length > 0 && (
        <div style={wrap}>
          <table style={table}>
            <caption style={{ textAlign: 'left', fontWeight: 700, padding: '0 0 4px', color: ink }}>Net change to each account</caption>
            <thead><tr><th scope="col" style={th}>Account</th><th scope="col" style={th}>Kind</th><th scope="col" style={th}>Entries</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Budget change</th></tr></thead>
            <tbody>
              {r.accounts.map((a) => (
                <tr key={a.code}>
                  <td style={td}><span style={{ fontVariantNumeric: 'tabular-nums' }}>{a.code}</span> {a.name}{a.isNew ? ' (new account)' : ''}</td>
                  <td style={td}>{a.side === 'appropriation' ? 'Spending line' : a.side === 'revenue' ? 'Estimated revenue' : 'Appropriated fund balance'}</td>
                  <td style={td}>{a.entries.join(', ')}</td>
                  <td style={num}>{a.change === 0 && a.charged > 0 ? `${formatMoney(a.charged)} charged` : signed(a.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.funds.length > 0 && (
        <div style={{ ...wrap, marginBottom: 0 }}>
          <table style={table}>
            <caption style={{ textAlign: 'left', fontWeight: 700, padding: '0 0 4px', color: ink }}>By fund</caption>
            <thead><tr><th scope="col" style={th}>Fund</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Appropriations</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Revenue</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Fund balance</th><th scope="col" style={th}>Result</th></tr></thead>
            <tbody>
              {r.funds.map((f) => (
                <tr key={f.fund}>
                  <th scope="row" style={{ ...td, fontWeight: 600 }}>{f.fund}</th>
                  <td style={num}>{signed(f.appropriations)}</td>
                  <td style={num}>{signed(f.revenue)}</td>
                  <td style={num}>{signed(f.fundBalance)}</td>
                  <td style={td}>{status(f.balanced)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.funds.some((f) => !f.balanced) && r.balanced && (
            <p style={{ fontSize: print ? 11.5 : 13.5, color: print ? '#333' : 'var(--rbl-text-muted)', margin: '6px 0 0' }}>
              Each entry balances, but money moves between funds, so one fund’s appropriations rise without its own revenue. That is expected for a capital project funded from another fund (as in 2026-843); otherwise it needs an interfund transfer.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
