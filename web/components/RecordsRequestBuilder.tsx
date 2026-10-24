'use client'

// Builds a FOIL letter and counts its deadlines, entirely in the browser.
// Nothing typed here is stored or sent anywhere.

import { useEffect, useMemo, useState } from 'react'
import { DEADLINE_DAYS, RECORD_REQUESTS, addBusinessDays, addCalendarDays, buildLetter } from '../lib/records-requests'

const field = { font: 'inherit', fontSize: 15, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', width: '100%' } as const
const label = { display: 'grid', gap: 4, color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 } as const
const button = { font: 'inherit', fontSize: 14, fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-title)', cursor: 'pointer' } as const

const today = () => new Date().toISOString().slice(0, 10)
const long = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

export default function RecordsRequestBuilder() {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [custom, setCustom] = useState('')
  const [fields, setFields] = useState({ name: '', email: '', address: '', date: '' })
  const [copied, setCopied] = useState(false)
  // Set after load: the page is built ahead of time, so the build date would be wrong.
  const [sent, setSent] = useState('')
  useEffect(() => setSent(today()), [])
  const [ack, setAck] = useState('')
  const [denied, setDenied] = useState('')

  const selected = RECORD_REQUESTS.filter((r) => picked.has(r.id))
  const letter = useMemo(() => buildLetter(selected, custom, { ...fields, date: fields.date ? long(fields.date) : '' }), [selected, custom, fields])
  const hasItems = selected.length > 0 || custom.trim().length > 0

  const toggle = (id: string) => setPicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const copy = async () => { try { await navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) } }
  const download = () => {
    const url = URL.createObjectURL(new Blob([letter], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'foil-request-riverhead.txt'; a.click(); URL.revokeObjectURL(url)
  }
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        <legend style={{ fontWeight: 700, color: 'var(--rbl-title)', marginBottom: 8 }}>1. Choose the records</legend>
        {RECORD_REQUESTS.map((r) => (
          <label key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: 'var(--rbl-text-strong)', cursor: 'pointer' }}>
            <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} style={{ marginTop: 4 }} />
            <span><strong>{r.title}</strong> <span style={{ color: 'var(--rbl-text-muted)' }}>({r.department})</span></span>
          </label>
        ))}
        <label style={label}>
          Or describe another record: name the document, the office that holds it and the dates it covers
          <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={3} maxLength={2000} style={{ ...field, resize: 'vertical' }} />
        </label>
      </fieldset>

      <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, alignItems: 'end', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))' }}>
        <legend style={{ fontWeight: 700, color: 'var(--rbl-title)', marginBottom: 8 }}>2. Your details (optional; they stay on this page)</legend>
        <label style={label}>Name<input value={fields.name} onChange={set('name')} autoComplete="name" style={field} /></label>
        <label style={label}>Email for the reply<input type="email" value={fields.email} onChange={set('email')} autoComplete="email" style={field} /></label>
        <label style={label}>Mailing address<textarea value={fields.address} onChange={set('address')} autoComplete="street-address" rows={2} maxLength={300} style={{ ...field, resize: 'vertical' }} /></label>
        <label style={label}>Date<input type="date" value={fields.date} onChange={set('date')} style={field} /></label>
      </fieldset>

      <section aria-labelledby="letter-h" style={{ display: 'grid', gap: 8 }}>
        <h3 id="letter-h" style={{ margin: 0, fontSize: 16, color: 'var(--rbl-title)' }}>3. Your letter</h3>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '14px 16px', color: hasItems ? 'var(--rbl-text-strong)' : 'var(--rbl-text-muted)' }}>
          {hasItems ? letter : 'Choose at least one record above.'}
        </pre>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={copy} disabled={!hasItems} style={button}>{copied ? 'Copied' : 'Copy the letter'}</button>
          <button type="button" onClick={download} disabled={!hasItems} style={button}>Download as text</button>
        </div>
      </section>

      <section aria-labelledby="dates-h" style={{ display: 'grid', gap: 10 }}>
        <h3 id="dates-h" style={{ margin: 0, fontSize: 16, color: 'var(--rbl-title)' }}>4. Your deadlines</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))' }}>
          <label style={label}>The Town received it on<input type="date" value={sent} onChange={(e) => setSent(e.target.value)} style={field} /></label>
          <label style={label}>It acknowledged it on (if it did)<input type="date" value={ack} onChange={(e) => setAck(e.target.value)} style={field} /></label>
          <label style={label}>It denied it on (if it did)<input type="date" value={denied} onChange={(e) => setDenied(e.target.value)} style={field} /></label>
        </div>
        {sent && (
          <ul aria-live="polite" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 15, color: 'var(--rbl-text-strong)', lineHeight: 1.5 }}>
            <li>The Town must respond by <strong>{long(addBusinessDays(sent, DEADLINE_DAYS.respond))}</strong>, {DEADLINE_DAYS.respond} business days after receipt. No response by then counts as a denial you can appeal.</li>
            {ack && <li>Having acknowledged it, the Town should grant or deny it by <strong>{long(addBusinessDays(ack, DEADLINE_DAYS.outer))}</strong>, {DEADLINE_DAYS.outer} business days after the acknowledgment, unless it gives a reason in writing and a date certain.</li>}
            {denied && <li>Appeal by <strong>{long(addCalendarDays(denied, DEADLINE_DAYS.appealCalendar))}</strong>, {DEADLINE_DAYS.appealCalendar} days after the denial. State law gives the Town {DEADLINE_DAYS.appealDecision} business days from receiving your appeal to decide it.</li>}
          </ul>
        )}
        <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
          Business days skip weekends and New York’s public holidays. The Town may close on other days too, so allow a day of margin.
        </p>
      </section>
    </div>
  )
}
