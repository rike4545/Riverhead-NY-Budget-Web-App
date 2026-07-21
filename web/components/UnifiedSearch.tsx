'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
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
// Structured data first, documents last — the order chips render in.
const TYPE_ORDER: EntryType[] = ['fund', 'line-item', 'salary', 'payroll', 'resolution', 'page']

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const EXAMPLES = ['police overtime', 'Hegermiller', 'sewer district', 'Island Water Park', 'paving', 'Petrocelli']

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Bold every matched term inside a string, case-insensitively.
function highlight(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'ig')
  const parts = text.split(re)
  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase())
      ? <mark key={i} style={{ background: '#fde68a', color: 'inherit', padding: '0 1px', borderRadius: 3 }}>{part}</mark>
      : part,
  )
}

// For long document text, show a ~180-char window around the first matched term
// rather than the page's opening words.
function snippet(text: string, terms: string[]): string {
  if (text.length <= 200) return text
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase())
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  if (idx < 0) return text.slice(0, 200) + '…'
  const start = Math.max(0, idx - 70)
  const end = Math.min(text.length, idx + 110)
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '')
}

export default function UnifiedSearch() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [types, setTypes] = useState<Set<EntryType>>(new Set())
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [limit, setLimit] = useState(50)
  const fetched = useRef(false)

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
  // Debounce so we don't rescore 16k entries on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 140)
    return () => clearTimeout(id)
  }, [q])

  const terms = useMemo(
    () => debounced.toLowerCase().split(/\s+/).filter((t) => t.length >= 2),
    [debounced],
  )

  // Score every entry that matches at least one term. Records matching MORE of
  // the terms rank far above records matching fewer (a big per-term-coverage
  // bonus), so "police overtime" surfaces records with both words first but
  // still returns police-only and overtime-only records instead of nothing.
  // Whole-word/prefix matches beat mid-word substrings; documents are
  // discounted so structured records win.
  const allScored = useMemo(() => {
    if (!entries || terms.length === 0) return []
    const scored: { e: Entry; score: number }[] = []
    for (const e of entries) {
      const name = e.n.toLowerCase()
      const ctx = e.x.toLowerCase()
      let score = 0
      let matched = 0
      for (const t of terms) {
        const wb = new RegExp(`\\b${escapeRe(t)}`, 'i')
        if (name.startsWith(t)) { score += 6; matched++ }
        else if (wb.test(name)) { score += 4; matched++ }
        else if (name.includes(t)) { score += 3; matched++ }
        else if (wb.test(ctx)) { score += 2; matched++ }
        else if (ctx.includes(t)) { score += 1; matched++ }
      }
      if (matched === 0) continue
      score += matched * 8 // coverage dominates: matching more terms always ranks higher
      if (debounced.length > 3 && name.includes(debounced.toLowerCase())) score += 6 // full-phrase bonus
      score *= e.t === 'page' ? 0.55 : 1 // let structured data win ties over raw doc pages
      scored.push({ e, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.e)
  }, [entries, terms, debounced])

  const typeCounts = useMemo(() => {
    const c = {} as Record<EntryType, number>
    for (const e of allScored) c[e.t] = (c[e.t] ?? 0) + 1
    return c
  }, [allScored])

  const results = useMemo(
    () => (types.size > 0 ? allScored.filter((e) => types.has(e.t)) : allScored),
    [allScored, types],
  )

  const toggleType = (t: EntryType) => {
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
    setLimit(50)
  }

  const hasQuery = terms.length > 0
  const searching = q !== debounced

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

        {/* Per-type result counts double as filters — the key to navigating 16k records. */}
        {status === 'ready' && hasQuery && allScored.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {TYPE_ORDER.filter((t) => typeCounts[t]).map((t) => {
              const on = types.has(t)
              const meta = TYPE_META[t]
              return (
                <button key={t} onClick={() => toggleType(t)} style={{
                  padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                  border: `1px solid ${on ? meta.fg : '#cbd5e1'}`, background: on ? meta.bg : 'white', color: on ? meta.fg : '#475569',
                }}>{meta.label} <span style={{ opacity: 0.7 }}>{typeCounts[t].toLocaleString()}</span></button>
              )
            })}
            {types.size > 0 && (
              <button onClick={() => setTypes(new Set())} style={{ padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', border: 'none', background: 'none', color: '#4a7297' }}>show all</button>
            )}
          </div>
        )}

        <p style={{ color: '#64748b', fontSize: 13, margin: '10px 0 0' }}>
          {status === 'loading' && 'Loading the search index…'}
          {status === 'error' && 'Could not load the search index — check your connection and try again.'}
          {status === 'idle' && 'Searches everything on this site: budget line items, employee pay, authorized salaries, Town Board votes, funds, and 12,000+ document pages.'}
          {status === 'ready' && !hasQuery && 'Type at least two letters to search budget lines, payroll, salaries, Board votes, funds, and documents.'}
          {status === 'ready' && hasQuery && (searching ? 'Searching…' : `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'}${types.size > 0 ? ` in ${Array.from(types).map((t) => TYPE_META[t].label).join(', ')}` : ''}`)}
        </p>
      </section>

      {/* Friendly empty state instead of a bare "0 results". */}
      {status === 'ready' && hasQuery && !searching && allScored.length === 0 && (
        <section style={{ ...card }}>
          <div style={{ fontWeight: 800, color: '#284a69', marginBottom: 6 }}>No matches for “{debounced}”.</div>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 10px' }}>
            None of those words appear anywhere in the indexed records. Try a single last name, a department, or a
            project name — for example:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => { setQ(ex); setLimit(50) }} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #cbd5e1', background: 'white', color: '#4a7297', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {ex}
              </button>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gap: 10 }}>
        {results.slice(0, limit).map((e, i) => {
          const meta = TYPE_META[e.t]
          const external = e.u.startsWith('http')
          const href = e.u ? (external ? e.u : `${base}${e.u}`) : undefined
          const ctx = e.t === 'page' ? snippet(e.x, terms) : e.x
          return (
            <a key={`${e.t}-${e.n}-${i}`} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}
              style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                  <span style={{ background: meta.bg, color: meta.fg, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label}</span>
                  <div style={{ fontWeight: 700, color: '#284a69', marginTop: 6, lineHeight: 1.35 }}>{highlight(e.n, terms)}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>{highlight(ctx, terms)}</div>
                </div>
                {e.v != null && <strong style={{ color: '#284a69', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}
              </div>
            </a>
          )
        })}
        {results.length > limit && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setLimit((l) => l + 100)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #4a7297', background: '#4a7297', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
              Show more ({(results.length - limit).toLocaleString()} remaining)
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
