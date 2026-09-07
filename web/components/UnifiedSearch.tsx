'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type Entry,
  type EntryType,
  scoreEntries,
  retrieveForQuestion,
  askRiverheadSearchAI,
  RiverheadAIError,
} from '../lib/riverheadSearchAI'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const TYPE_META: Record<EntryType, { label: string; bg: string; fg: string }> = {
  fund: { label: 'Fund', bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-info-text)' },
  'line-item': { label: 'Budget line', bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)' },
  payroll: { label: 'Payroll', bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn)' },
  salary: { label: 'Salary 2026', bg: '#fce7f3', fg: '#9d174d' },
  resolution: { label: 'Board vote', bg: 'var(--rbl-violet-bg)', fg: 'var(--rbl-violet-strong)' },
  page: { label: 'Document', bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-strong)' },
}
const TYPE_ORDER: EntryType[] = ['fund', 'line-item', 'salary', 'payroll', 'resolution', 'page']
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const EXAMPLES = ['police overtime', 'Hegermiller', 'sewer district', 'Island Water Park', 'paving', 'Petrocelli']
const AI_EXAMPLES = ['How much does the Town spend on police overtime?', 'What is the 2026 General Fund appropriation for the Highway department?', 'Which recent Town Board votes involved the Petrocelli project?', 'Who are the highest-paid employees on the payroll?']
const KEY_STORAGE = 'riverhead-openai-key'
const AI_RECORD_COUNT = 24

type SearchManifest = { version: number; shards: Partial<Record<EntryType, { url: string; count: number; bytes: number }>>; total: number }
type SearchDataset = { entries: Entry[]; source: 'sharded' | 'legacy'; loadedTypes: Set<EntryType> }

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlight(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'ig')
  return text.split(re).map((part, i) => terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? <mark key={i} style={{ background: '#fde68a', color: 'inherit', padding: '0 1px', borderRadius: 3 }}>{part}</mark> : part)
}
function snippet(text: string, terms: string[]): string {
  if (text.length <= 200) return text
  const lower = text.toLowerCase(); let idx = -1
  for (const t of terms) { const i = lower.indexOf(t.toLowerCase()); if (i >= 0 && (idx < 0 || i < idx)) idx = i }
  if (idx < 0) return `${text.slice(0, 200)}…`
  const start = Math.max(0, idx - 70); const end = Math.min(text.length, idx + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}
function renderAnswer(text: string): React.ReactNode {
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((part, i) => { const m = part.match(/^\[(\d+)\]$/); return m ? <a key={i} href={`#ai-src-${m[1]}`} style={{ display: 'inline-block', background: 'var(--rbl-violet-bg)', color: 'var(--rbl-violet-strong)', fontWeight: 800, fontSize: 11, padding: '0 6px', borderRadius: 6, textDecoration: 'none', verticalAlign: 'baseline', margin: '0 1px' }}>{m[1]}</a> : part })
}

export default function UnifiedSearch() {
  const [mode, setMode] = useState<'find' | 'ask'>('find')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [types, setTypes] = useState<Set<EntryType>>(new Set())
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [limit, setLimit] = useState(50)
  const datasetPromise = useRef<Promise<SearchDataset> | null>(null)
  const shardPromises = useRef<Partial<Record<EntryType, Promise<Entry[]>>>>({})
  const [apiKey, setApiKey] = useState('')
  const [keyDraft, setKeyDraft] = useState('')
  const [showKeyPanel, setShowKeyPanel] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiSources, setAiSources] = useState<Entry[]>([])
  const [aiAsked, setAiAsked] = useState('')
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'done' | 'error'>('idle')
  const [aiError, setAiError] = useState('')
  const aiAbort = useRef<AbortController | null>(null)
  const skipFirstUrlWrite = useRef(true)

  const mergeEntries = useCallback((current: Entry[] | null, additions: Entry[]) => {
    const seen = new Set((current ?? []).map((e) => `${e.t}|${e.n}|${e.u}`))
    return [...(current ?? []), ...additions.filter((e) => { const key = `${e.t}|${e.n}|${e.u}`; if (seen.has(key)) return false; seen.add(key); return true })]
  }, [])

  const loadShard = useCallback(async (type: EntryType, manifest?: SearchManifest): Promise<Entry[]> => {
    if (shardPromises.current[type]) return shardPromises.current[type]!
    const promise = (async () => {
      const shard = manifest?.shards?.[type]
      if (!shard) return []
      const res = await fetch(`${base}/data/search/${shard.url}`)
      if (!res.ok) throw new Error(`Search shard ${type} returned HTTP ${res.status}`)
      const data = await res.json()
      return (data.entries ?? []) as Entry[]
    })().catch((err) => { delete shardPromises.current[type]; throw err })
    shardPromises.current[type] = promise
    return promise
  }, [])

  const loadDataset = useCallback(async (): Promise<SearchDataset> => {
    if (datasetPromise.current) return datasetPromise.current
    setStatus('loading')
    const promise = (async () => {
      const manifestRes = await fetch(`${base}/data/search/manifest.json`)
      if (manifestRes.ok) {
        const manifest = await manifestRes.json() as SearchManifest
        const coreTypes: EntryType[] = ['line-item', 'payroll', 'salary', 'resolution', 'fund']
        const arrays = await Promise.all(coreTypes.map((type) => loadShard(type, manifest)))
        const coreEntries = arrays.flat()
        const result: SearchDataset = { entries: coreEntries, source: 'sharded', loadedTypes: new Set(coreTypes.filter((_, i) => arrays[i].length > 0)) }
        setEntries(coreEntries); setStatus('ready'); return result
      }
      const legacyRes = await fetch(`${base}/data/search/unified.json`)
      if (!legacyRes.ok) throw new Error(`Search index returned HTTP ${legacyRes.status}`)
      const legacy = await legacyRes.json(); const legacyEntries = (legacy.entries ?? []) as Entry[]
      const result: SearchDataset = { entries: legacyEntries, source: 'legacy', loadedTypes: new Set(TYPE_ORDER) }
      setEntries(legacyEntries); setStatus('ready'); return result
    })().catch((err) => { setStatus('error'); datasetPromise.current = null; throw err })
    datasetPromise.current = promise
    return promise
  }, [loadShard])

  const loadPageShard = useCallback(async (): Promise<Entry[]> => {
    const dataset = await loadDataset()
    if (dataset.source === 'legacy' || dataset.loadedTypes.has('page')) return dataset.entries
    const manifestRes = await fetch(`${base}/data/search/manifest.json`)
    if (!manifestRes.ok) return dataset.entries
    const manifest = await manifestRes.json() as SearchManifest
    const pages = await loadShard('page', manifest)
    const merged = mergeEntries(dataset.entries, pages)
    dataset.entries = merged; dataset.loadedTypes.add('page'); setEntries(merged); return merged
  }, [loadDataset, loadShard, mergeEntries])

  const ensureIndex = useCallback(() => { loadDataset().catch(() => {}) }, [loadDataset])
  useEffect(() => { try { setApiKey(localStorage.getItem(KEY_STORAGE) ?? '') } catch { /* ignore */ } }, [])
  useEffect(() => {
    try { const params = new URLSearchParams(window.location.search); if (params.get('mode') === 'ask') setMode('ask'); const qp = params.get('q') ?? ''; if (qp) { setQ(qp); setDebounced(qp); ensureIndex() } } catch { /* ignore */ }
  }, [ensureIndex])
  useEffect(() => {
    if (skipFirstUrlWrite.current) { skipFirstUrlWrite.current = false; return }
    try { const params = new URLSearchParams(window.location.search); if (debounced) params.set('q', debounced); else params.delete('q'); if (mode === 'ask') params.set('mode', 'ask'); else params.delete('mode'); const qs = params.toString(); window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname) } catch { /* ignore */ }
  }, [debounced, mode])
  useEffect(() => { if (mode === 'find' && q) ensureIndex() }, [q, mode, ensureIndex])
  useEffect(() => { const id = setTimeout(() => setDebounced(q), 140); return () => clearTimeout(id) }, [q])

  const terms = useMemo(() => debounced.toLowerCase().split(/\s+/).filter((t) => t.length >= 2), [debounced])
  const allScored = useMemo(() => !entries || mode !== 'find' || terms.length === 0 ? [] : scoreEntries(entries, terms, debounced.toLowerCase()), [entries, terms, debounced, mode])
  useEffect(() => {
    if (mode !== 'find' || terms.length === 0 || !entries || status !== 'ready') return
    if (allScored.length > 0 || entries.some((e) => e.t === 'page')) return
    loadPageShard().catch(() => {})
  }, [mode, terms, entries, status, allScored.length, loadPageShard])
  const typeCounts = useMemo(() => { const c = {} as Record<EntryType, number>; for (const e of allScored) c[e.t] = (c[e.t] ?? 0) + 1; return c }, [allScored])
  const results = useMemo(() => types.size > 0 ? allScored.filter((e) => types.has(e.t)) : allScored, [allScored, types])

  const toggleType = (t: EntryType) => { if (t === 'page' && !entries?.some((e) => e.t === 'page')) loadPageShard().catch(() => {}); setTypes((prev) => { const next = new Set(prev); if (next.has(t)) next.delete(t); else next.add(t); return next }); setLimit(50) }
  const saveKey = () => { const trimmed = keyDraft.trim(); if (!trimmed) return; try { localStorage.setItem(KEY_STORAGE, trimmed) } catch { /* ignore */ }; setApiKey(trimmed); setKeyDraft('') }
  const removeKey = () => { try { localStorage.removeItem(KEY_STORAGE) } catch { /* ignore */ }; setApiKey(''); setKeyDraft('') }

  const runAsk = useCallback(async () => {
    const question = q.trim(); if (question.length < 3 || aiState === 'thinking') return
    aiAbort.current?.abort(); const controller = new AbortController(); aiAbort.current = controller
    setAiState('thinking'); setAiError(''); setAiAsked(question); setAiAnswer('')
    let index: Entry[]
    try { index = (await loadDataset()).entries } catch { setAiState('error'); setAiError('Could not load the search index — check your connection and try again.'); return }
    let records = retrieveForQuestion(index, question, AI_RECORD_COUNT)
    if (records.length < 8 && !index.some((e) => e.t === 'page')) { try { index = await loadPageShard(); records = retrieveForQuestion(index, question, AI_RECORD_COUNT) } catch { /* core records remain usable */ } }
    setAiSources(records)
    if (!apiKey.trim()) { setAiState('done'); setAiAnswer(''); setShowKeyPanel(true); return }
    try { const answer = await askRiverheadSearchAI({ question, records, apiKey, signal: controller.signal }); if (controller.signal.aborted) return; setAiAnswer(answer); setAiState('done') }
    catch (e) { if ((e as { name?: string }).name === 'AbortError') return; setAiState('error'); setAiError(e instanceof RiverheadAIError ? e.message : 'Something went wrong contacting the AI service.') }
  }, [q, apiKey, aiState, loadDataset, loadPageShard])

  const hasQuery = terms.length > 0; const searching = q !== debounced; const hasKey = apiKey.trim().length > 0; const documentsLoaded = entries?.some((e) => e.t === 'page') ?? false

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6, background: 'var(--rbl-surface-2)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {(['find', 'ask'] as const).map((m) => <button key={m} onClick={() => setMode(m)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13.5, background: mode === m ? 'var(--rbl-surface)' : 'transparent', color: mode === m ? 'var(--rbl-title)' : 'var(--rbl-text-muted)', boxShadow: mode === m ? '0 1px 3px rgba(15,23,42,.12)' : 'none' }}>{m === 'find' ? 'Find records' : 'Ask AI'}</button>)}
      </div>

      <section style={{ ...card, borderTop: '5px solid var(--rbl-gold-border)' }}>
        {mode === 'find' ? <input value={q} onFocus={ensureIndex} onChange={(e) => { setQ(e.target.value); setLimit(50) }} placeholder="Try: police overtime · Hegermiller · sewer · Island Water Park · paving…" style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--rbl-border)', fontSize: 16, boxSizing: 'border-box' }} aria-label="Search all Riverhead budget data" /> : <div style={{ display: 'grid', gap: 10 }}><textarea value={q} onFocus={ensureIndex} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAsk() } }} placeholder="Ask a question about Riverhead's budget, pay, funds, or Town Board votes…" rows={2} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--rbl-border)', fontSize: 16, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} aria-label="Ask the Riverhead budget AI a question" /><div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={runAsk} disabled={q.trim().length < 3 || aiState === 'thinking'} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 14, cursor: q.trim().length < 3 || aiState === 'thinking' ? 'default' : 'pointer', background: q.trim().length < 3 || aiState === 'thinking' ? 'var(--rbl-text-faint)' : 'var(--rbl-fill-accent)', color: 'white' }}>{aiState === 'thinking' ? 'Thinking…' : 'Ask AI'}</button><span style={{ color: hasKey ? 'var(--rbl-success-strong)' : 'var(--rbl-warn)', fontSize: 12.5, fontWeight: 700 }}>{hasKey ? '● Live AI ready (your key)' : '○ Add your OpenAI key to enable AI answers'}</span><button onClick={() => setShowKeyPanel((v) => !v)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>{showKeyPanel ? 'Hide key setup' : hasKey ? 'Manage key' : 'Set up AI'}</button></div></div>}
        {mode === 'find' && status === 'ready' && hasQuery && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>{TYPE_ORDER.filter((t) => t === 'page' ? true : typeCounts[t]).map((t) => { const on = types.has(t); const count = typeCounts[t] ?? 0; const meta = TYPE_META[t]; return <button key={t} onClick={() => toggleType(t)} style={{ padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', border: `1px solid ${on ? meta.fg : 'var(--rbl-border-strong)'}`, background: on ? meta.bg : 'var(--rbl-surface)', color: on ? meta.fg : 'var(--rbl-text-body)', opacity: t === 'page' && !documentsLoaded ? 0.85 : 1 }}>{meta.label} {count > 0 ? <span style={{ opacity: 0.7 }}>{count.toLocaleString()}</span> : <span style={{ opacity: 0.7 }}>load</span>}</button> })}{types.size > 0 && <button onClick={() => setTypes(new Set())} style={{ padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', border: 'none', background: 'none', color: 'var(--rbl-accent)' }}>show all</button>}</div>}
        {mode === 'find' && <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '10px 0 0' }}>{status === 'loading' && 'Loading the structured search index…'}{status === 'error' && 'Could not load the search index — check your connection and try again.'}{status === 'idle' && 'Searches everything on this site: budget line items, employee pay, authorized salaries, Town Board votes, funds, and document pages.'}{status === 'ready' && !hasQuery && 'Type at least two letters to search budget lines, payroll, salaries, Board votes, funds, and documents.'}{status === 'ready' && hasQuery && (searching ? 'Searching…' : `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'}${types.size > 0 ? ` in ${Array.from(types).map((t) => TYPE_META[t].label).join(', ')}` : ''}${documentsLoaded ? '' : ' · documents load on demand'}`)}</p>}
        {mode === 'ask' && aiState === 'idle' && <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '10px 0 0' }}>AI reads the same 16,000+ records the search covers, answers in plain language, and cites the exact records it used. Always verify against official Town documents.</p>}
      </section>

      {mode === 'ask' && showKeyPanel && <section style={card}><div style={{ fontWeight: 800, color: 'var(--rbl-title)', marginBottom: 4 }}>Live AI setup — your OpenAI key</div><p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 6px' }}>This site is static and has no server, so AI answers use <strong>your own</strong> OpenAI key. It is stored only in this browser (localStorage) and sent directly to OpenAI when you ask — never to this site or anyone else. This is a power-user feature; the keyword search needs no key.</p><p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, margin: '0 0 12px' }}>Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>platform.openai.com/api-keys</a>. Usage is billed by OpenAI to your account.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder={hasKey ? 'Enter a new key to replace the saved one' : 'sk-…'} autoComplete="off" style={{ flex: '1 1 260px', padding: 11, borderRadius: 9, border: '1px solid var(--rbl-border)', fontSize: 14, fontFamily: 'monospace', boxSizing: 'border-box' }} aria-label="OpenAI API key" /><button onClick={saveKey} disabled={!keyDraft.trim()} style={{ padding: '10px 16px', borderRadius: 9, border: 'none', fontWeight: 800, fontSize: 13, cursor: keyDraft.trim() ? 'pointer' : 'default', background: keyDraft.trim() ? 'var(--rbl-fill-brand)' : 'var(--rbl-text-faint)', color: 'white' }}>{hasKey ? 'Update key' : 'Save key'}</button>{hasKey && <button onClick={removeKey} style={{ padding: '10px 16px', borderRadius: 9, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-danger)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Remove key</button>}</div><p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, margin: '10px 0 0' }}>{hasKey ? 'A saved key is active in this browser.' : 'No key saved yet.'}</p></section>}

      {mode === 'ask' && aiState !== 'idle' && <section style={{ display: 'grid', gap: 12 }}>{aiAsked && <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 15 }}>“{aiAsked}”</div>}{aiState === 'thinking' && <div style={{ ...card, color: 'var(--rbl-text-muted)', fontSize: 14 }}>Reading the budget records and drafting an answer…</div>}{aiState === 'error' && <div style={{ ...card, borderLeft: '5px solid var(--rbl-danger)' }}><div style={{ fontWeight: 800, color: 'var(--rbl-danger)', marginBottom: 4 }}>Couldn&apos;t get an AI answer</div><p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, margin: 0 }}>{aiError}</p></div>}{aiState === 'done' && aiAnswer && <div style={{ ...card, borderLeft: '5px solid var(--rbl-accent-border)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ background: 'var(--rbl-violet-bg)', color: 'var(--rbl-violet-strong)', fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>AI answer</span><span style={{ color: 'var(--rbl-text-faint)', fontSize: 12 }}>gpt-5-mini · grounded on the records below</span></div><div style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{renderAnswer(aiAnswer)}</div><p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, margin: '12px 0 0', borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>Unofficial AI explainer — numbers can be misread. Verify against the cited records and official Town documents.</p></div>}{aiState === 'done' && !aiAnswer && <div style={{ ...card, borderLeft: '5px solid var(--rbl-gold-border)' }}><div style={{ fontWeight: 800, color: 'var(--rbl-warn)', marginBottom: 4 }}>Add your OpenAI key to get an AI answer</div><p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>Here are the most relevant records for your question. To have the AI read them and answer in plain language, add your OpenAI key in the setup panel above.</p></div>}{aiSources.length > 0 && <div style={{ display: 'grid', gap: 8 }}><div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{aiAnswer ? 'Sources the answer used' : 'Most relevant records'}</div>{aiSources.map((e, i) => { const meta = TYPE_META[e.t]; const external = e.u.startsWith('http'); const href = e.u ? (external ? e.u : `${base}${e.u}`) : undefined; return <a key={`${e.t}-${e.n}-${i}`} id={`ai-src-${i + 1}`} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'flex', gap: 12, alignItems: 'start' }}><span style={{ background: 'var(--rbl-violet-bg)', color: 'var(--rbl-violet-strong)', fontWeight: 800, fontSize: 12, minWidth: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span><div style={{ minWidth: 0, flex: 1 }}><span style={{ background: meta.bg, color: meta.fg, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label}</span><div style={{ fontWeight: 700, color: 'var(--rbl-title)', marginTop: 6, lineHeight: 1.35 }}>{e.n}</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>{e.t === 'page' ? snippet(e.x, aiAsked.toLowerCase().split(/\s+/)) : e.x}</div></div>{e.v != null && <strong style={{ color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}</a> })}</div>}</section>}

      {mode === 'ask' && aiState === 'idle' && <section style={card}><div style={{ fontWeight: 800, color: 'var(--rbl-title)', marginBottom: 8 }}>Try asking</div><div style={{ display: 'grid', gap: 8 }}>{AI_EXAMPLES.map((ex) => <button key={ex} onClick={() => setQ(ex)} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--rbl-border-subtle)', background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-strong)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{ex}</button>)}</div></section>}

      {mode === 'find' && status === 'ready' && hasQuery && !searching && allScored.length === 0 && !documentsLoaded && <section style={card}><div style={{ fontWeight: 800, color: 'var(--rbl-title)', marginBottom: 6 }}>Searching document pages…</div><p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, margin: 0 }}>No structured record matched yet, so the document archive is being searched.</p></section>}
      {mode === 'find' && status === 'ready' && hasQuery && !searching && allScored.length === 0 && documentsLoaded && <section style={card}><div style={{ fontWeight: 800, color: 'var(--rbl-title)', marginBottom: 6 }}>No matches for “{debounced}”.</div><p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, margin: '0 0 10px' }}>None of those words appear anywhere in the indexed records. Try a single last name, a department, or a project name — for example:</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{EXAMPLES.map((ex) => <button key={ex} onClick={() => { setQ(ex); setLimit(50) }} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{ex}</button>)}</div></section>}

      {mode === 'find' && <section style={{ display: 'grid', gap: 10 }}>{results.slice(0, limit).map((e, i) => { const meta = TYPE_META[e.t]; const external = e.u.startsWith('http'); const href = e.u ? (external ? e.u : `${base}${e.u}`) : undefined; const ctx = e.t === 'page' ? snippet(e.x, terms) : e.x; return <a key={`${e.t}-${e.n}-${i}`} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}><div style={{ minWidth: 0, flex: '1 1 320px' }}><span style={{ background: meta.bg, color: meta.fg, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label}</span><div style={{ fontWeight: 700, color: 'var(--rbl-title)', marginTop: 6, lineHeight: 1.35 }}>{highlight(e.n, terms)}</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>{highlight(ctx, terms)}</div></div>{e.v != null && <strong style={{ color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}</div></a> })}{results.length > limit && <div style={{ textAlign: 'center' }}><button onClick={() => setLimit((l) => l + 100)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--rbl-accent-border)', background: 'var(--rbl-fill-accent)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Show more ({(results.length - limit).toLocaleString()} remaining)</button></div>}</section>}
    </div>
  )
}
