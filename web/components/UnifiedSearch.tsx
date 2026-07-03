'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const base = '/rike4545-riverhead-budget-live'
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

type EntryType = 'line-item' | 'payroll' | 'salary' | 'resolution' | 'fund' | 'page'
type Entry = { t: EntryType; n: string; x: string; u: string; v?: number | null }

const TYPE_META: Record<EntryType, { label: string; bg: string; fg: string }> = {
  fund: { label: 'Fund', bg: '#dbeafe', fg: '#1e3a8a' },
  'line-item': { label: 'Budget line', bg: '#dcfce7', fg: '#166534' },
  payroll: { label: 'Payroll', bg: '#fef3c7', fg: '#92400e' },
  salary: { label: 'Salary 2026', bg: '#fce7f3', fg: '#9d174d' },
  resolution: { label: 'Board vote', bg: '#ede9fe', fg: '#5b21b6' },
  page: { label: 'Document', bg: '#f1f5f9', fg: '#334155' },
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function UnifiedSearch() {
  const [q, setQ] = useState('')
  const [types, setTypes] = useState<Set<EntryType>>(new Set())
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [limit, setLimit] = useState(50)
  const fetched = useRef(false)

  // Load the index the moment the user shows intent (focus or type).
  const ensureIndex = () => {
    if (fetched.current) return
    fetched.current = true
    setStatus('loading')
    fetch(`${base}/data/search/unified.json`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries as Entry[]); setStatus('ready') })
      .catch(() => { setStatus('error'); fetched.current = false })
  }

  useEffect(() => { if (q) ensureIndex() }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (!entries) return []
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
    if (terms.length === 0) return []
    const active = types.size > 0 ? types : null
    const scored: { e: Entry; score: number }[] = []
    for (const e of entries) {
      if (active && !active.has(e.t)) continue
      const name = e.n.toLowerCase()
      const ctx = e.x.toLowerCase()
      let score = 0
      let ok = true
      for (const t of terms) {
        if (name.includes(t)) score += name.startsWith(t) ? 3 : 2
        else if (ctx.includes(t)) score += 1
        else { ok = false; break }
      }
      if (!ok) continue
      // prefer structured data over raw document pages when scores tie
      if (e.t !== 'page') score += 0.5
      scored.push({ e, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.e)
  }, [entries, q, types])

  const toggleType = (t: EntryType) => {
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
    setLimit(50)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, borderTop: '5px solid #c99a2e' }}>
        <input
          value={q}
          onFocus={ensureIndex}
          onChange={(e) => { setQ(e.target.value); setLimit(50) }}
          placeholder="Try: police overtime · Hegermiller · sewer · Island Water Park · paving…"
          style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #b8c7d3', fontSize: 16, boxSizing: 'border-box' }}
          aria-label="Search all Riverhead budget data"
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {(Object.keys(TYPE_META) as EntryType[]).map((t) => {
            const on = types.has(t)
            const meta = TYPE_META[t]
            return (
              <button key={t} onClick={() => toggleType(t)} style={{
                padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                border: `1px solid ${on ? meta.fg : '#cbd5e1'}`, background: on ? meta.bg : 'white', color: on ? meta.fg : '#64748b',
              }}>{meta.label}</button>
            )
          })}
          {types.size > 0 && (
            <button onClick={() => setTypes(new Set())} style={{ padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', border: 'none', background: 'none', color: '#1f5f8f' }}>clear filters</button>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: 13, margin: '10px 0 0' }}>
          {status === 'loading' && 'Loading the search index…'}
          {status === 'error' && 'Could not load the search index — check your connection and try again.'}
          {status === 'ready' && q.trim().length < 2 && 'Type at least two letters to search budget lines, payroll, salaries, Board votes, funds, and documents.'}
          {status === 'ready' && q.trim().length >= 2 && `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'}`}
          {status === 'idle' && 'Searches everything on this site: budget line items, employee pay, authorized salaries, Town Board votes, funds, and 12,000+ document pages.'}
        </p>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        {results.slice(0, limit).map((e, i) => {
          const meta = TYPE_META[e.t]
          const external = e.u.startsWith('http')
          return (
            <a key={`${e.t}-${e.n}-${i}`} href={e.u || undefined} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}
              style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                  <span style={{ background: meta.bg, color: meta.fg, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label}</span>
                  <div style={{ fontWeight: 700, color: '#12385b', marginTop: 6, lineHeight: 1.35 }}>{e.n}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>{e.x}</div>
                </div>
                {e.v != null && <strong style={{ color: '#12385b', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}
              </div>
            </a>
          )
        })}
        {results.length > limit && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setLimit((l) => l + 100)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #1f5f8f', background: '#1f5f8f', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
              Show more ({(results.length - limit).toLocaleString()} remaining)
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
