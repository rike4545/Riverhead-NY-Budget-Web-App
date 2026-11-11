'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, CircleX, Copy, Download, FileText, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react'
import {
  MAX_CLAUSES, MAX_ROWS, MEMBERS, TEMPLATES, checkDraft, compose, formatMoney, fromTemplate, toPlainText, toWordHtml,
  type BudgetRow, type Draft,
} from '../lib/resolution-builder'

export type AccountOption = { code: string; name: string }

const STORAGE = 'rbl-resolution-draft'
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 19 } as const
const help = { margin: '0 0 10px', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const label = { display: 'grid', gap: 6, color: 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 15 } as const
const input = { minHeight: 44, padding: '8px 10px', fontSize: 16, borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', width: '100%', boxSizing: 'border-box' } as const
const area = { ...input, minHeight: 88, lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' } as const
const btn = { minHeight: 44, padding: '6px 14px', borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 } as const
const iconBtn = { ...btn, minWidth: 44, padding: 6, justifyContent: 'center' } as const
const primary = { ...btn, background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', borderColor: 'var(--rbl-cta-bg)' } as const

const emptyRow = (): BudgetRow => ({ code: '', name: '', from: null, to: null })

function load(year: number): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    return Array.isArray(d.whereas) && Array.isArray(d.resolved) ? { ...d, year: d.year || year } : null
  } catch {
    return null
  }
}

export default function ResolutionBuilder({ year, accounts }: { year: number; accounts: AccountOption[] }) {
  const [draft, setDraft] = useState<Draft>(() => fromTemplate(TEMPLATES[1], year))
  const [templateId, setTemplateId] = useState(TEMPLATES[1].id)
  const [restored, setRestored] = useState(false)
  const [notice, setNotice] = useState('')
  const listId = useId()
  const byCode = useMemo(() => new Map(accounts.map((a) => [a.code, a.name])), [accounts])

  // A draft in progress comes back when the page is reopened in this browser.
  useEffect(() => {
    const saved = load(year)
    if (saved) { setDraft(saved); setNotice('Your last draft in this browser was restored.') }
    setRestored(true)
  }, [year])
  useEffect(() => {
    if (!restored) return
    try { localStorage.setItem(STORAGE, JSON.stringify(draft)) } catch { /* storage blocked: the draft lasts for this visit */ }
  }, [draft, restored])
  useEffect(() => {
    const off = () => document.documentElement.classList.remove('res-printing')
    window.addEventListener('afterprint', off)
    return () => window.removeEventListener('afterprint', off)
  }, [])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const composed = useMemo(() => compose(draft), [draft])
  const checks = useMemo(() => checkDraft(draft), [draft])
  const errors = checks.filter((c) => c.level === 'error').length

  const startTemplate = () => {
    const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0]
    setDraft((d) => ({ ...fromTemplate(t, year), mover: d.mover, seconder: d.seconder }))
    setNotice(`Started from “${t.label}”. Replace each part in square brackets.`)
  }
  const copyText = async () => {
    try { await navigator.clipboard.writeText(toPlainText(draft)); setNotice('The resolution was copied as text.') }
    catch { setNotice('This browser did not allow copying. Select the resolution below and copy it instead.') }
  }
  const download = () => {
    const blob = new Blob([toWordHtml(draft)], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `resolution-${draft.year}-${draft.number.trim() || 'draft'}.doc`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setNotice('The Word file was downloaded. Open it in Word and save it as .docx if the Town’s template asks for one.')
  }
  const print = () => { document.documentElement.classList.add('res-printing'); window.print() }
  const clearAll = () => { setDraft(fromTemplate(TEMPLATES[0], year)); setTemplateId(TEMPLATES[0].id); setNotice('The draft was cleared.') }

  return (
    <div>
      <datalist id={listId}>
        {accounts.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
      </datalist>

      <section className="res-noprint" style={card} aria-labelledby="res-start">
        <h2 id="res-start" style={h2}>1. Start</h2>
        <p style={help}>Each starting point follows an adopted 2026 resolution’s wording, with the particulars left as blanks in square brackets.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ ...label, flex: '1 1 280px' }}>Kind of resolution
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={input}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={startTemplate} style={btn}><FileText size={18} aria-hidden /> Use this starting point</button>
        </div>
        {TEMPLATES.find((t) => t.id === templateId)?.source && (
          <p style={{ ...help, margin: '8px 0 0' }}>Wording from Resolution {TEMPLATES.find((t) => t.id === templateId)!.source}.</p>
        )}
        <p aria-live="polite" style={{ ...help, margin: '8px 0 0', color: 'var(--rbl-text-body)' }}>{notice}</p>
      </section>

      <section className="res-noprint" style={card} aria-labelledby="res-head">
        <h2 id="res-head" style={h2}>2. Title and sponsors</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))' }}>
          <label style={{ ...label, gridColumn: '1 / -1' }}>Title
            <input value={draft.title} onChange={(e) => set('title', e.target.value)} style={input} autoComplete="off" placeholder="Accepts a Donation for the Recreation Department" />
            <span style={{ ...help, margin: 0, fontWeight: 400 }}>Printed in capitals. Most titles start with a verb: Accepts, Appoints, Authorizes, Ratifies, Amends.</span>
          </label>
          <label style={label}>Offered by
            <select value={draft.mover} onChange={(e) => set('mover', e.target.value)} style={input}>
              <option value="">Choose a Council Member</option>
              {MEMBERS.map((m) => <option key={m.key} value={m.key}>{m.title} {m.name}</option>)}
            </select>
          </label>
          <label style={label}>Seconded by
            <select value={draft.seconder} onChange={(e) => set('seconder', e.target.value)} style={input}>
              <option value="">Choose a Council Member</option>
              {MEMBERS.map((m) => <option key={m.key} value={m.key} disabled={m.key === draft.mover}>{m.title} {m.name}</option>)}
            </select>
          </label>
          <label style={label}>Resolution number (optional)
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600 }}>{draft.year}-</span>
              <input value={draft.number} onChange={(e) => set('number', e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 6))} style={input} inputMode="numeric" placeholder="____" />
            </span>
            <span style={{ ...help, margin: 0, fontWeight: 400 }}>The Town Clerk assigns it. Leave it blank for a draft.</span>
          </label>
        </div>
      </section>

      <ClauseList
        id="res-whereas" heading="3. Why: WHEREAS clauses" lead="WHEREAS,"
        hint="One reason per box. The builder adds “WHEREAS,” at the start, “; and” between clauses, and “Now, therefore, be it” after the last."
        items={draft.whereas} onChange={(v) => set('whereas', v)} add="Add a WHEREAS clause"
      />
      <ClauseList
        id="res-resolved" heading="4. What the Board decides: RESOLVED clauses" lead="RESOLVED, that"
        hint="One decision per box. The builder adds “RESOLVED, that” and “; and be it further”. The budget table, the copies and the Town Clerk clause are added after these."
        items={draft.resolved} onChange={(v) => set('resolved', v)} add="Add a RESOLVED clause"
      />

      <section className="res-noprint" style={card} aria-labelledby="res-budget">
        <h2 id="res-budget" style={h2}>5. Budget adjustment (if money moves)</h2>
        {!draft.budget ? (
          <>
            <p style={help}>Add a FROM / TO table when the resolution moves money between accounts, accepts revenue or uses fund balance.</p>
            <button type="button" onClick={() => set('budget', { verb: 'establish', rows: [emptyRow(), emptyRow()] })} style={btn}><Plus size={18} aria-hidden /> Add a budget table</button>
          </>
        ) : (
          <>
            <label style={{ ...label, marginBottom: 12 }}>The clause before the table
              <select value={draft.budget.verb} onChange={(e) => set('budget', { ...draft.budget!, verb: e.target.value as 'establish' | 'ratify' })} style={input}>
                <option value="establish">The Supervisor is authorized to establish the following budget adjustment</option>
                <option value="ratify">The Town Board is authorized to ratify the following budget adjustments (already made)</option>
              </select>
            </label>
            <p style={help}>Type or pick an account code; the name fills in from the 2027 Budget Supplement. Put the source of the money under FROM and where it goes under TO.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {draft.budget.rows.map((r, i) => (
                <fieldset key={i} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, margin: 0, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(min(160px,100%),1fr))', alignItems: 'end' }}>
                  <legend style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 14 }}>Line {i + 1}</legend>
                  <label style={{ ...label, gridColumn: 'span 2' }}>Account code
                    <input list={listId} value={r.code} onChange={(e) => {
                      const code = e.target.value.toUpperCase().trim()
                      const rows = draft.budget!.rows.slice(); rows[i] = { ...r, code, name: byCode.get(code) ?? r.name }; set('budget', { ...draft.budget!, rows })
                    }} style={{ ...input, fontFamily: 'ui-monospace, monospace' }} autoComplete="off" spellCheck={false} placeholder="A01-7-7310-450-000-00000" />
                  </label>
                  <label style={{ ...label, gridColumn: 'span 2' }}>Account name
                    <input value={r.name} onChange={(e) => { const rows = draft.budget!.rows.slice(); rows[i] = { ...r, name: e.target.value }; set('budget', { ...draft.budget!, rows }) }} style={input} autoComplete="off" />
                  </label>
                  <MoneyField text="FROM" value={r.from} onChange={(v) => { const rows = draft.budget!.rows.slice(); rows[i] = { ...r, from: v }; set('budget', { ...draft.budget!, rows }) }} />
                  <MoneyField text="TO" value={r.to} onChange={(v) => { const rows = draft.budget!.rows.slice(); rows[i] = { ...r, to: v }; set('budget', { ...draft.budget!, rows }) }} />
                  <button type="button" onClick={() => { const rows = draft.budget!.rows.filter((_, j) => j !== i); set('budget', rows.length ? { ...draft.budget!, rows } : null) }} style={iconBtn} aria-label={`Remove line ${i + 1}`}><Trash2 size={18} aria-hidden /></button>
                </fieldset>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              <button type="button" disabled={draft.budget.rows.length >= MAX_ROWS} onClick={() => set('budget', { ...draft.budget!, rows: [...draft.budget!.rows, emptyRow()] })} style={btn}><Plus size={18} aria-hidden /> Add a line</button>
              <button type="button" onClick={() => set('budget', null)} style={btn}><Trash2 size={18} aria-hidden /> Remove the table</button>
            </div>
          </>
        )}
      </section>

      <section className="res-noprint" style={card} aria-labelledby="res-copies">
        <h2 id="res-copies" style={h2}>6. Who gets a copy</h2>
        <p style={help}>Departments or offices the Town Clerk sends the resolution to, such as the Financial Administrator, payroll or the Office of the Town Attorney.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {draft.copies.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input aria-label={`Copy to, ${i + 1}`} value={c} onChange={(e) => { const v = draft.copies.slice(); v[i] = e.target.value; set('copies', v) }} style={input} autoComplete="off" />
              <button type="button" onClick={() => set('copies', draft.copies.filter((_, j) => j !== i))} style={iconBtn} aria-label={`Remove copy recipient ${i + 1}`}><Trash2 size={18} aria-hidden /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set('copies', [...draft.copies, ''])} style={{ ...btn, marginTop: 10 }}><Plus size={18} aria-hidden /> Add a recipient</button>
        <p style={{ ...help, margin: '10px 0 0' }}>The closing clause every resolution ends with, that Town Hall departments may get a copy from the Town Clerk, is always added.</p>
      </section>

      <section className="res-noprint" style={card} aria-labelledby="res-checks">
        <h2 id="res-checks" style={h2}>7. Checks</h2>
        <p aria-live="polite" style={{ margin: '0 0 8px', color: errors ? 'var(--rbl-warn-strong)' : 'var(--rbl-success-strong)', fontWeight: 700 }}>
          {errors ? `${errors} ${errors === 1 ? 'item needs' : 'items need'} attention before this is ready.` : 'Ready to print or copy.'}
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

      <section className="res-noprint" style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }} aria-label="Print, copy or download">
        <button type="button" onClick={print} style={primary}><Printer size={18} aria-hidden /> Print or save as PDF</button>
        <button type="button" onClick={copyText} style={btn}><Copy size={16} aria-hidden /> Copy as text</button>
        <button type="button" onClick={download} style={btn}><Download size={16} aria-hidden /> Download for Word</button>
        <button type="button" onClick={clearAll} style={btn}><RotateCcw size={16} aria-hidden /> Clear the draft</button>
        <p style={{ ...help, margin: 0, width: '100%' }}>The draft is kept in this browser so it is here when you come back; nothing is sent anywhere. Problems flagged above still print, so check them first.</p>
      </section>

      <h2 className="res-noprint" style={{ ...h2, margin: '8px 0 10px' }}>Preview</h2>
      <article id="res-sheet" aria-label="The resolution as it will print" style={{ ...card, padding: 'clamp(18px,4vw,40px)', maxWidth: 820, color: 'var(--rbl-text-strong)', fontSize: 16, lineHeight: 1.6 }}>
        <p style={{ textAlign: 'center', fontWeight: 700, margin: '0 0 10px' }}>{composed.town}</p>
        <p style={{ textAlign: 'center', margin: '0 0 10px' }}>{composed.numberLine}</p>
        <p style={{ textAlign: 'center', fontWeight: 700, margin: '0 0 18px' }}>{composed.title}</p>
        <p style={{ margin: '0 0 16px', maxWidth: 'none' }}>{composed.offered}</p>
        {composed.paragraphs.map((p, i) => p.kind === 'table' ? (
          <div key={i} style={{ margin: '0 0 14px' }}>
            <div data-scroll-region style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14.5 }}>
                <thead><tr><th scope="col" style={{ textAlign: 'left', padding: '4px 6px' }}>Account</th><th scope="col" style={{ textAlign: 'right', padding: '4px 6px' }}>FROM</th><th scope="col" style={{ textAlign: 'right', padding: '4px 6px' }}>TO</th></tr></thead>
                <tbody>
                  {p.rows.map((r, j) => (
                    <tr key={j}>
                      <td style={{ padding: '4px 6px' }}><code>{r.code || '[account]'}</code> – {r.name || '[name]'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.from ? formatMoney(r.from) : ''}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.to ? formatMoney(r.to) : ''}</td>
                    </tr>
                  ))}
                  <tr><th scope="row" style={{ textAlign: 'left', padding: '4px 6px' }}>Total</th><td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{formatMoney(p.fromTotal)}</td><td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{formatMoney(p.toTotal)}</td></tr>
                </tbody>
              </table>
            </div>
            {p.after && <p style={{ margin: '8px 0 0' }}>{p.after}</p>}
          </div>
        ) : (
          <p key={i} style={{ margin: '0 0 14px', textIndent: '2.5em', maxWidth: 'none' }}>{p.text}</p>
        ))}
        <p style={{ margin: '24px 0 0', fontSize: 12.5, color: 'var(--rbl-text-muted)', maxWidth: 'none' }}>
          Draft prepared with Riverhead Budget Live’s unofficial resolution builder. It is not a Town record. The Town Clerk assigns the number, and the Town Attorney’s and Accounting Department’s review comes first.
        </p>
      </article>
    </div>
  )
}

function ClauseList({ id, heading, hint, lead, items, onChange, add }: { id: string; heading: string; hint: string; lead: string; items: string[]; onChange: (v: string[]) => void; add: string }) {
  const move = (i: number, by: number) => { const v = items.slice(); const [x] = v.splice(i, 1); v.splice(i + by, 0, x); onChange(v) }
  return (
    <section className="res-noprint" style={card} aria-labelledby={id}>
      <h2 id={id} style={h2}>{heading}</h2>
      <p style={help}>{hint}</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: 'grid', gap: 6 }}>
            <label style={label}>{lead} … ({i + 1})
              <textarea value={t} onChange={(e) => { const v = items.slice(); v[i] = e.target.value; onChange(v) }} style={area} rows={3} />
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} style={iconBtn} aria-label={`Move clause ${i + 1} up`}><ArrowUp size={18} aria-hidden /></button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} style={iconBtn} aria-label={`Move clause ${i + 1} down`}><ArrowDown size={18} aria-hidden /></button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} style={iconBtn} aria-label={`Remove clause ${i + 1}`}><Trash2 size={18} aria-hidden /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" disabled={items.length >= MAX_CLAUSES} onClick={() => onChange([...items, ''])} style={{ ...btn, marginTop: 10 }}><Plus size={18} aria-hidden /> {add}</button>
    </section>
  )
}

function MoneyField({ text, value, onChange }: { text: string; value: number | null; onChange: (v: number | null) => void }) {
  const [raw, setRaw] = useState(value ? String(value) : '')
  useEffect(() => { setRaw((r) => (Number(r.replace(/[$,]/g, '')) === (value ?? 0) ? r : value ? String(value) : '')) }, [value])
  return (
    <label style={label}>{text}
      <input value={raw} inputMode="decimal" onChange={(e) => {
        setRaw(e.target.value)
        const n = Number(e.target.value.replace(/[$,\s]/g, ''))
        onChange(e.target.value.trim() && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null)
      }} style={{ ...input, textAlign: 'right' }} placeholder="0.00" autoComplete="off" />
    </label>
  )
}
