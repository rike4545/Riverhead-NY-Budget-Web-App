'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, KeyRound, Square } from 'lucide-react'
import {
  type AnswersFile,
  type Entry,
  type EntryType,
  ASK_EXAMPLES,
  ASK_MODEL,
  CITATION_SOURCE,
  answerEntries,
  askRiverheadSearchAI,
  checkAnswer,
  citationNumbers,
  RiverheadAIError,
} from '../lib/riverheadSearchAI'
import { rankForQuestion, searchEntries } from '../lib/search-rank'
import { siteEntries } from '../lib/site-pages'
import { readPayrollLink } from '../lib/payroll-link'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const TYPE_META: Record<EntryType, { label: string; bg: string; fg: string }> = {
  answer: { label: 'Answer on this site', bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-title)' },
  site: { label: 'Page on this site', bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-accent)' },
  fund: { label: 'Fund', bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-info-text)' },
  'line-item': { label: 'Budget line', bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)' },
  payroll: { label: 'Payroll', bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn)' },
  salary: { label: 'Salary 2026', bg: 'var(--rbl-teal-bg)', fg: 'var(--rbl-teal-strong)' },
  resolution: { label: 'Board vote', bg: 'var(--rbl-violet-bg)', fg: 'var(--rbl-violet-strong)' },
  page: { label: 'Document', bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-strong)' },
}
const TYPE_ORDER: EntryType[] = ['fund', 'line-item', 'salary', 'payroll', 'resolution', 'page']
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const EXAMPLES = ['police overtime', 'Hegermiller', 'reserves', 'tax cap', 'Island Water Park', 'September 15']
const KEY_STORAGE = 'riverhead-openai-key'
const AI_RECORD_COUNT = 24
// Fewer structured matches than this and the document pages load too.
const FEW_RECORDS = 5

const kindChip = (t: EntryType) => ({ background: TYPE_META[t].bg, color: TYPE_META[t].fg, fontWeight: 600, fontSize: 13, padding: '2px 9px', borderRadius: 999 }) as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5, margin: 0 } as const
const linkButton = { background: 'none', border: 'none', padding: '6px 0', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, cursor: 'pointer' } as const

type SearchManifest = { version: number; shards: Partial<Record<EntryType, { url: string; count: number; bytes: number }>>; total: number }
// The page shard names each document once; each page points at its document.
type PageRow = { d: number; p: number; x: string; k?: string }
type PageShard = { docs: { n: string; u: string }[]; entries: PageRow[] }
const expandPages = (data: PageShard): Entry[] => data.entries.map((r) => {
  const doc = data.docs[r.d] ?? { n: 'Document', u: '' }
  return { t: 'page', n: `${doc.n} — p. ${r.p}`, x: r.x, k: r.k, u: doc.u }
})
type SearchDataset = { entries: Entry[]; source: 'sharded' | 'legacy'; loadedTypes: Set<EntryType> }
type Mode = 'find' | 'ask'
type AskState = 'idle' | 'finding' | 'writing' | 'done' | 'error'

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlight(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'ig')
  return text.split(re).map((part, i) => terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? <mark key={i} style={{ background: 'var(--rbl-mark)', color: 'inherit', padding: '0 1px', borderRadius: 3 }}>{part}</mark> : part)
}
function snippet(text: string, terms: string[]): string {
  if (text.length <= 200) return text
  const lower = text.toLowerCase(); let idx = -1
  for (const t of terms) { const i = lower.indexOf(t.toLowerCase()); if (i >= 0 && (idx < 0 || i < idx)) idx = i }
  if (idx < 0) return `${text.slice(0, 200)}…`
  const start = Math.max(0, idx - 70); const end = Math.min(text.length, idx + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}
/** Matched words a document page carries in its text but not in the snippet shown. */
function alsoOnPage(e: Entry, marks: string[]): string[] {
  if (!e.k) return []
  const words = new Set(e.k.split(' '))
  const shown = `${e.n} ${e.x}`.toLowerCase()
  return marks.filter((m) => words.has(m) && !shown.includes(m)).slice(0, 5)
}
/** Where a payroll or salary result goes, said on the result so a click is not a guess. */
function opensTo(e: Entry): string | null {
  if (e.t !== 'payroll' && e.t !== 'salary') return null
  const [path, query = ''] = e.u.split('?')
  const link = path === '/payroll/' ? readPayrollLink(query) : null
  if (!link) return null
  if (link.tab === 'raises') return 'See the 2025 → 2026 change'
  if (link.tab === 'authorized') return `See the ${link.year ?? 2025} authorized salary list`
  if (link.q) return e.y && e.y[0] !== e.y[1] ? `See pay for each year, ${e.y[0]}–${e.y[1]}` : 'See the pay breakdown'
  return 'See who was paid this overtime'
}
const hrefOf = (e: Entry) => (e.u ? (e.u.startsWith('http') ? e.u : `${base}${e.u}`) : undefined)

// ---- The answer, as text --------------------------------------------------

/** **Bold**, though the prompt asks for plain text. */
function withBold(text: string, key: string): ReactNode[] {
  return text.split(/\*\*([^*]+)\*\*/g).map((part, i) => (i % 2 ? <strong key={`${key}-${i}`}>{part}</strong> : part))
}

/** A citation, as a link to its record below. */
function Cite({ n }: { n: number }) {
  return (
    <a href={`#ai-src-${n}`} aria-label={`Source ${n}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 20, padding: '0 5px', margin: '0 2px', borderRadius: 6, background: 'var(--rbl-violet-bg)', color: 'var(--rbl-violet-strong)', fontSize: 12.5, fontWeight: 600, lineHeight: 1, textDecoration: 'none', verticalAlign: 'text-bottom' }}>{n}</a>
  )
}

/** One line of an answer. A citation of a record the model was not given stays as plain text. */
function AnswerLine({ text, count }: { text: string; count: number }) {
  const re = new RegExp(CITATION_SOURCE, 'g')
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    // A no-break space keeps a citation on the line of the word it follows.
    if (m.index > last) out.push(...withBold(text.slice(last, m.index).replace(/\s+$/, '\u00a0'), `t${last}`))
    for (const n of citationNumbers(m[1])) out.push(n >= 1 && n <= count ? <Cite key={`c${m.index}-${n}`} n={n} /> : <span key={`c${m.index}-${n}`}>[{n}]</span>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(...withBold(text.slice(last), `t${last}`))
  return <>{out}</>
}

const BULLET = /^\s*[-*•]\s+/
/** The answer's paragraphs and bullets, so a wrapped bullet keeps its indent. */
function AnswerText({ text, count }: { text: string; count: number }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = (key: string) => {
    if (!list.length) return
    const items = list
    blocks.push(<ul key={key} style={{ margin: '0 0 10px', paddingLeft: 22, display: 'grid', gap: 4 }}>{items.map((item, i) => <li key={i}><AnswerLine text={item} count={count} /></li>)}</ul>)
    list = []
  }
  text.split('\n').forEach((line, i) => {
    if (BULLET.test(line)) { list.push(line.replace(BULLET, '')); return }
    flush(`l${i}`)
    if (line.trim()) blocks.push(<p key={`p${i}`} style={{ margin: '0 0 10px' }}><AnswerLine text={line} count={count} /></p>)
  })
  flush('end')
  return <>{blocks}</>
}

/** A record the answer was given, numbered as the model saw it. */
function SourceCard({ e, n, terms }: { e: Entry; n: number; terms: string[] }) {
  const external = e.u.startsWith('http')
  return (
    <a id={`ai-src-${n}`} href={hrefOf(e)} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'flex', gap: 12, alignItems: 'start', scrollMarginTop: 16 }}>
      <span style={{ background: 'var(--rbl-violet-bg)', color: 'var(--rbl-violet-strong)', fontWeight: 600, fontSize: 13, minWidth: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={kindChip(e.t)}>{TYPE_META[e.t].label}</span>
        <div style={{ fontWeight: 700, color: 'var(--rbl-title)', marginTop: 6, lineHeight: 1.35 }}>{e.n}</div>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 3, lineHeight: 1.45 }}>{e.t === 'page' ? snippet(e.x, terms) : e.x}</div>
      </div>
      {e.v != null && <strong style={{ color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}
    </a>
  )
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export default function UnifiedSearch() {
  const [mode, setMode] = useState<Mode>('find')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [types, setTypes] = useState<Set<EntryType>>(new Set())
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [limit, setLimit] = useState(50)
  const datasetPromise = useRef<Promise<SearchDataset> | null>(null)
  const shardPromises = useRef<Partial<Record<EntryType, Promise<Entry[]>>>>({})
  const answersPromise = useRef<Promise<Entry[]> | null>(null)
  // The records a question is ranked over: the index plus the Resident
  // Answers, built once per state of the index so the ranker's own index of it
  // is reused from one question to the next.
  const askPools = useRef(new WeakMap<Entry[], Entry[]>())
  const [apiKey, setApiKey] = useState('')
  const [keyDraft, setKeyDraft] = useState('')
  const [showKeyPanel, setShowKeyPanel] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiSources, setAiSources] = useState<Entry[]>([])
  const [aiAsked, setAiAsked] = useState('')
  const [aiState, setAiState] = useState<AskState>('idle')
  const [aiError, setAiError] = useState('')
  const [aiCutOff, setAiCutOff] = useState(false)
  const [aiStopped, setAiStopped] = useState(false)
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
      return Array.isArray(data.docs) ? expandPages(data as PageShard) : (data.entries ?? []) as Entry[]
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
        const coreEntries = (siteEntries() as Entry[]).concat(arrays.flat())
        const result: SearchDataset = { entries: coreEntries, source: 'sharded', loadedTypes: new Set(coreTypes.filter((_, i) => arrays[i].length > 0)) }
        setEntries(coreEntries); setStatus('ready'); return result
      }
      const legacyRes = await fetch(`${base}/data/search/unified.json`)
      if (!legacyRes.ok) throw new Error(`Search index returned HTTP ${legacyRes.status}`)
      const legacy = await legacyRes.json(); const legacyEntries = (siteEntries() as Entry[]).concat((legacy.entries ?? []) as Entry[])
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

  /** The Resident Answers, which Ask AI ranks beside the records. Without them it still answers from the records. */
  const loadAnswers = useCallback((): Promise<Entry[]> => {
    if (!answersPromise.current) {
      answersPromise.current = fetch(`${base}/data/answers.json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: AnswersFile | null) => (data && Array.isArray(data.answers) ? answerEntries(data) : []))
        .catch(() => { answersPromise.current = null; return [] })
    }
    return answersPromise.current
  }, [])

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
  const outcome = useMemo(() => !entries || mode !== 'find' || terms.length === 0 ? null : searchEntries(entries, debounced), [entries, terms, debounced, mode])
  // The site's own pages are shown on their own, above the records.
  const allScored = useMemo(() => outcome ? outcome.results.filter((e) => e.t !== 'site') : [], [outcome])
  const sites = outcome?.sites ?? []
  const corrections = outcome?.corrections ?? []
  // Highlight what matched: "salaries" marks "salary", a corrected word its correction.
  const marks = useMemo(() => outcome?.highlight.length ? outcome.highlight : terms, [outcome, terms])
  useEffect(() => {
    if (mode !== 'find' || terms.length === 0 || !entries || status !== 'ready') return
    if (allScored.length >= FEW_RECORDS || entries.some((e) => e.t === 'page')) return
    loadPageShard().catch(() => {})
  }, [mode, terms, entries, status, allScored.length, loadPageShard])
  const typeCounts = useMemo(() => { const c = {} as Record<EntryType, number>; for (const e of allScored) c[e.t] = (c[e.t] ?? 0) + 1; return c }, [allScored])
  const results = useMemo(() => types.size > 0 ? allScored.filter((e) => types.has(e.t)) : allScored, [allScored, types])

  const toggleType = (t: EntryType) => { if (t === 'page' && !entries?.some((e) => e.t === 'page')) loadPageShard().catch(() => {}); setTypes((prev) => { const next = new Set(prev); if (next.has(t)) next.delete(t); else next.add(t); return next }); setLimit(50) }
  const saveKey = () => { const trimmed = keyDraft.trim(); if (!trimmed) return; try { localStorage.setItem(KEY_STORAGE, trimmed) } catch { /* ignore */ }; setApiKey(trimmed); setKeyDraft('') }
  const removeKey = () => { try { localStorage.removeItem(KEY_STORAGE) } catch { /* ignore */ }; setApiKey(''); setKeyDraft('') }

  const runAsk = useCallback(async (asked?: string) => {
    const question = (asked ?? q).trim()
    if (question.length < 3) return
    aiAbort.current?.abort()
    const controller = new AbortController(); aiAbort.current = controller
    setAiState('finding'); setAiError(''); setAiAsked(question); setAiAnswer(''); setAiSources([]); setAiCutOff(false); setAiStopped(false)
    let index: Entry[]
    let answers: Entry[]
    try { [index, answers] = await Promise.all([loadDataset().then((d) => d.entries), loadAnswers()]) }
    catch { if (!controller.signal.aborted) { setAiState('error'); setAiError('Could not load the search index. Check your connection and try again.') } return }
    const poolOf = (records: Entry[]) => {
      if (!answers.length) return records
      let pool = askPools.current.get(records)
      if (!pool) { pool = records.concat(answers); askPools.current.set(records, pool) }
      return pool
    }
    let records = rankForQuestion(poolOf(index), question, AI_RECORD_COUNT)
    if (records.length < 8 && !index.some((e) => e.t === 'page')) { try { index = await loadPageShard(); records = rankForQuestion(poolOf(index), question, AI_RECORD_COUNT) } catch { /* the core records still answer */ } }
    if (controller.signal.aborted) return
    setAiSources(records)
    if (!apiKey.trim()) { setAiState('done'); return }
    setAiState('writing')
    try {
      const result = await askRiverheadSearchAI({ question, records, apiKey, signal: controller.signal, onText: (text) => { if (!controller.signal.aborted) setAiAnswer(text) } })
      if (controller.signal.aborted) return
      setAiAnswer(result.text); setAiCutOff(result.cutOff); setAiState('done')
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      setAiState('error'); setAiError(e instanceof RiverheadAIError ? e.message : 'Something went wrong contacting the AI service.')
    }
  }, [q, apiKey, loadDataset, loadAnswers, loadPageShard])
  const stopAsk = () => { aiAbort.current?.abort(); setAiStopped(true); setAiState('done') }

  const check = useMemo(() => (aiAnswer ? checkAnswer(aiAnswer, aiSources) : null), [aiAnswer, aiSources])
  const citedSet = useMemo(() => new Set(check?.cited ?? []), [check])
  const askTerms = useMemo(() => aiAsked.toLowerCase().split(/\s+/).filter((t) => t.length >= 3), [aiAsked])

  const hasQuery = terms.length > 0; const searching = q !== debounced; const hasKey = apiKey.trim().length > 0; const documentsLoaded = entries?.some((e) => e.t === 'page') ?? false
  const busy = aiState === 'finding' || aiState === 'writing'
  const canAsk = q.trim().length >= 3
  const issues = aiState === 'done' && check ? [
    check.missing.length > 0 && `It cites ${check.missing.map((n) => `[${n}]`).join(', ')}, which ${plural(check.missing.length, 'is not one of', 'are not among')} the records it was given.`,
    check.unsupported.length > 0 && `${check.unsupported.join(', ')} ${plural(check.unsupported.length, 'does', 'do')} not appear in any of the records below, nor as a sum or difference of two of them. Find ${plural(check.unsupported.length, 'it', 'them')} in an official document before you quote ${plural(check.unsupported.length, 'it', 'them')}.`,
    check.uncited && 'It states a dollar figure but cites no record for it.',
    aiCutOff && !aiStopped && 'The answer stopped before it finished, so it may be missing something.',
  ].filter((x): x is string => typeof x === 'string') : []

  return (
    <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
      <section aria-label="Search" style={{ ...card, padding: 20 }}>
        <div role="group" aria-label="Search mode" style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10, background: 'var(--rbl-surface-3)', marginBottom: 14 }}>
          {(['find', 'ask'] as const).map((m) => {
            const on = mode === m
            return <button key={m} type="button" aria-pressed={on} onClick={() => setMode(m)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${on ? 'var(--rbl-border)' : 'transparent'}`, background: on ? 'var(--rbl-surface)' : 'transparent', color: on ? 'var(--rbl-title)' : 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{m === 'find' ? 'Find records' : 'Ask AI'}</button>
          })}
        </div>

        {mode === 'find' ? (
          <>
            <input value={q} onFocus={ensureIndex} onChange={(e) => { setQ(e.target.value); setLimit(50) }} placeholder="Try: police overtime · Hegermiller · sewer · Island Water Park" style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--rbl-border)', fontSize: 16, boxSizing: 'border-box' }} aria-label="Search all Riverhead budget data" />
            {status === 'ready' && hasQuery && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>{TYPE_ORDER.filter((t) => t === 'page' ? true : typeCounts[t]).map((t) => { const on = types.has(t); const count = typeCounts[t] ?? 0; const meta = TYPE_META[t]; return <button key={t} type="button" aria-pressed={on} onClick={() => toggleType(t)} style={{ padding: '6px 12px', borderRadius: 999, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', border: `1px solid ${on ? meta.fg : 'var(--rbl-border-strong)'}`, background: on ? meta.bg : 'var(--rbl-surface)', color: on ? meta.fg : 'var(--rbl-text-body)' }}>{meta.label} <span style={{ color: on ? meta.fg : 'var(--rbl-text-muted)', fontWeight: 400 }}>{count > 0 ? count.toLocaleString() : 'load'}</span></button> })}{types.size > 0 && <button type="button" onClick={() => setTypes(new Set())} style={{ ...linkButton, padding: '6px 4px', fontSize: 13.5 }}>Show all kinds</button>}</div>}
            <p role="status" style={{ ...muted, marginTop: 12 }}>{status === 'loading' && 'Loading the search index…'}{status === 'error' && 'Could not load the search index. Check your connection and try again.'}{status === 'idle' && 'Searches budget lines, employee pay, authorized salaries, Town Board votes, funds and document pages.'}{status === 'ready' && !hasQuery && 'Type at least two letters.'}{status === 'ready' && hasQuery && (searching ? 'Searching…' : `${results.length.toLocaleString()} ${plural(results.length, 'record', 'records')}${types.size > 0 ? ` in ${Array.from(types).map((t) => TYPE_META[t].label).join(', ')}` : ''}${documentsLoaded ? '' : '. Document pages load when you ask for them.'}`)}</p>
            {status === 'ready' && hasQuery && !searching && corrections.length > 0 && <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, margin: '6px 0 0' }}>Showing results for {corrections.map((c, i) => <span key={c.from}>{i > 0 ? ', ' : ''}<strong>{c.to}</strong></span>)} <span style={{ color: 'var(--rbl-text-muted)' }}>(nothing matched {corrections.map((c) => `“${c.from}”`).join(', ')})</span></p>}
          </>
        ) : (
          <>
            <textarea value={q} onFocus={() => { ensureIndex(); loadAnswers() }} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!busy) runAsk() } }} placeholder="Ask a question about Riverhead's budget, pay, debt or Town Board votes" rows={2} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--rbl-border)', fontSize: 16, lineHeight: 1.5, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} aria-label="Ask a question about the Town's finances" />
            <div style={{ display: 'flex', gap: '8px 16px', alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              {busy
                ? <button type="button" onClick={stopAsk} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-title)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}><Square size={14} strokeWidth={2.25} aria-hidden /> Stop</button>
                : <button type="button" onClick={() => runAsk()} disabled={!canAsk} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 15, cursor: canAsk ? 'pointer' : 'not-allowed', background: 'var(--rbl-fill-brand)', color: 'white', opacity: canAsk ? 1 : 0.45 }}>Ask AI</button>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: hasKey ? 'var(--rbl-success-strong)' : 'var(--rbl-text-muted)' }}>
                {hasKey ? <CircleCheck size={16} strokeWidth={2.25} aria-hidden /> : <KeyRound size={16} strokeWidth={2.25} aria-hidden />}
                {hasKey ? 'Your OpenAI key is saved in this browser' : 'Answers need your own OpenAI key'}
              </span>
              <button type="button" onClick={() => setShowKeyPanel((v) => !v)} aria-expanded={showKeyPanel} aria-controls="ai-key" style={linkButton}>{showKeyPanel ? 'Hide key setup' : hasKey ? 'Change key' : 'Set up a key'}</button>
            </div>
            {aiState === 'idle' && (
              <div style={{ borderTop: '1px solid var(--rbl-border-subtle)', marginTop: 16, paddingTop: 14 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--rbl-title)' }}>Try asking</h2>
                <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0 }}>
                  {ASK_EXAMPLES.map((ex) => <li key={ex}><button type="button" onClick={() => { setQ(ex); runAsk(ex) }} style={{ ...linkButton, fontSize: 15.5, textAlign: 'left' }}>{ex} →</button></li>)}
                </ul>
                <p style={muted}>Ask AI writes a short answer from the records that best match your question and the site&apos;s Resident Answers, and links each figure to the record it came from. Without a key, it shows you those records.</p>
              </div>
            )}
          </>
        )}
      </section>

      {mode === 'ask' && showKeyPanel && (
        <section id="ai-key" aria-labelledby="ai-key-title" style={card}>
          <h2 id="ai-key-title" style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--rbl-title)' }}>Your OpenAI key</h2>
          <p style={{ ...muted, color: 'var(--rbl-text-body)', marginBottom: 6 }}>This site has no server, so Ask AI uses your own OpenAI key. The key stays in this browser and goes only to OpenAI, with your question and the records it is answered from. OpenAI bills your account. Find records needs no key.</p>
          <p style={{ ...muted, marginBottom: 12 }}>Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>platform.openai.com/api-keys</a>.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveKey() }} placeholder={hasKey ? 'Paste a new key to replace the saved one' : 'sk-…'} autoComplete="off" style={{ flex: '1 1 260px', padding: 11, borderRadius: 9, border: '1px solid var(--rbl-border)', fontSize: 15, fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }} aria-label="OpenAI API key" />
            <button type="button" onClick={saveKey} disabled={!keyDraft.trim()} style={{ padding: '10px 16px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 14, cursor: keyDraft.trim() ? 'pointer' : 'not-allowed', background: 'var(--rbl-fill-brand)', color: 'white', opacity: keyDraft.trim() ? 1 : 0.45 }}>{hasKey ? 'Replace key' : 'Save key'}</button>
            {hasKey && <button type="button" onClick={removeKey} style={{ padding: '10px 16px', borderRadius: 9, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-danger)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Remove key</button>}
          </div>
          <p role="status" style={{ ...muted, fontSize: 13.5, marginTop: 10 }}>{hasKey ? 'A key is saved in this browser.' : 'No key saved yet.'}</p>
        </section>
      )}

      {mode === 'ask' && aiState !== 'idle' && (
        <section aria-labelledby="ai-question" style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...card, padding: 20, borderColor: aiState === 'error' ? 'var(--rbl-danger-border)' : 'var(--rbl-border-subtle)' }}>
            <h2 id="ai-question" style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--rbl-title)', lineHeight: 1.3 }}>{aiAsked}</h2>
            <p role="status" style={{ ...muted, fontSize: 13.5, marginTop: 4 }}>
              {aiState === 'finding' && 'Finding the records that match your question…'}
              {aiState === 'writing' && `Writing an answer from ${aiSources.length} records with ${ASK_MODEL}…`}
              {aiState === 'done' && aiAnswer && `Written by ${ASK_MODEL} from the records below${aiStopped ? '. You stopped it before it finished.' : '.'}`}
              {aiState === 'done' && !aiAnswer && (hasKey ? 'Stopped before the answer began.' : 'No answer yet: Ask AI needs your OpenAI key. These are the records it would read.')}
              {aiState === 'error' && 'Could not get an answer.'}
            </p>

            {aiState === 'error' && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: 'var(--rbl-danger-strong)', fontSize: 15, margin: '0 0 10px' }}>{aiError}</p>
                <button type="button" onClick={() => runAsk(aiAsked)} style={{ ...linkButton, padding: 0 }}>Try again</button>
              </div>
            )}

            {(aiAnswer || aiState === 'writing') && (
              <div aria-live="polite" aria-busy={aiState === 'writing'} style={{ color: 'var(--rbl-text)', fontSize: 16.5, lineHeight: 1.6, marginTop: 14, maxWidth: '72ch' }}>
                {aiAnswer ? <AnswerText text={aiAnswer} count={aiSources.length} /> : <p style={{ ...muted, fontSize: 15.5 }}>Reading the records…</p>}
              </div>
            )}

            {issues.length > 0 && (
              <div role="note" style={{ marginTop: 6, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--rbl-warn-strong)', fontSize: 14.5 }}><CircleAlert size={16} strokeWidth={2.25} aria-hidden /> Check before you use this answer</div>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: 'var(--rbl-warn-strong)', fontSize: 14, lineHeight: 1.5, display: 'grid', gap: 4 }}>{issues.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
            {aiState === 'done' && check && issues.length === 0 && check.figures > 0 && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--rbl-success-strong)', fontSize: 14, margin: '6px 0 0' }}><CircleCheck size={16} strokeWidth={2.25} aria-hidden /> Every dollar figure in this answer appears in the records it cites or was given.</p>
            )}

            {aiAnswer && <div style={{ ...muted, fontSize: 13.5, borderTop: '1px solid var(--rbl-border-subtle)', marginTop: 14, paddingTop: 10 }}>Unofficial and machine-written. It can misread a record, so check a figure against its source before you rely on it.</div>}
          </div>

          {aiSources.length > 0 && (() => {
            const numbered = aiSources.map((e, i) => ({ e, n: i + 1 }))
            const cited = (check?.cited ?? []).map((n) => numbered[n - 1]).filter(Boolean)
            const rest = numbered.filter(({ n }) => !citedSet.has(n))
            const list = (items: typeof numbered) => <div style={{ display: 'grid', gap: 8 }}>{items.map(({ e, n }) => <SourceCard key={n} e={e} n={n} terms={askTerms} />)}</div>
            if (!aiAnswer) return (
              <div style={{ display: 'grid', gap: 8 }}>
                <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--rbl-title)' }}>The records that best match your question</h3>
                {list(numbered)}
              </div>
            )
            return (
              <div style={{ display: 'grid', gap: 8 }}>
                {cited.length > 0 && <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--rbl-title)' }}>{plural(cited.length, 'The record the answer cites', `The ${cited.length} records the answer cites`)}</h3>}
                {cited.length > 0 && list(cited)}
                {rest.length > 0 && (
                  <details style={{ marginTop: cited.length ? 6 : 0 }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--rbl-accent)', fontWeight: 600, fontSize: 15, padding: '6px 0' }}>{cited.length ? `The other ${rest.length} records it was given` : `The ${rest.length} records it was given`}</summary>
                    <div style={{ marginTop: 8 }}>{list(rest)}</div>
                  </details>
                )}
              </div>
            )
          })()}
        </section>
      )}

      {mode === 'find' && status === 'ready' && hasQuery && !searching && allScored.length === 0 && !documentsLoaded && <section style={card}><h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--rbl-title)' }}>Searching document pages…</h2><p style={muted}>No structured record matched yet, so the document archive is being searched.</p></section>}
      {mode === 'find' && status === 'ready' && hasQuery && !searching && sites.length > 0 && types.size === 0 && <section aria-label="Pages on this site" style={{ ...card, padding: 16 }}><h2 style={{ margin: 0, color: 'var(--rbl-accent)', fontWeight: 700, fontSize: 14 }}>{plural(sites.length, 'Page on this site', 'Pages on this site')}</h2><div style={{ display: 'grid', gap: 10, marginTop: 8 }}>{sites.map((e) => <a key={e.u} href={`${base}${e.u}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}><div style={{ fontWeight: 700, color: 'var(--rbl-link)', lineHeight: 1.35 }}>{highlight(e.n, marks)} →</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 2, lineHeight: 1.45 }}>{highlight(e.x, marks)}</div></a>)}</div></section>}

      {mode === 'find' && status === 'ready' && hasQuery && !searching && allScored.length === 0 && documentsLoaded && sites.length === 0 && <section style={card}><h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--rbl-title)' }}>No matches for “{debounced}”</h2><p style={{ ...muted, margin: '0 0 10px' }}>None of those words appear anywhere in the indexed records. Try a single last name, a department or a project name, for example:</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{EXAMPLES.map((ex) => <button key={ex} type="button" onClick={() => { setQ(ex); setLimit(50) }} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{ex}</button>)}</div></section>}

      {mode === 'find' && results.length > 0 && <section aria-label="Results" style={{ display: 'grid', gap: 10 }}>{results.slice(0, limit).map((e, i) => { const external = e.u.startsWith('http'); const ctx = e.t === 'page' ? snippet(e.x, marks) : e.x; const also = e.t === 'page' ? alsoOnPage(e, marks) : []; const opens = opensTo(e); return <a key={`${e.t}-${e.n}-${i}`} href={hrefOf(e)} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} style={{ ...card, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}><div style={{ minWidth: 0, flex: '1 1 320px' }}><span style={kindChip(e.t)}>{TYPE_META[e.t].label}</span><div style={{ fontWeight: 700, color: 'var(--rbl-title)', marginTop: 6, lineHeight: 1.35 }}>{highlight(e.n, marks)}</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 3, lineHeight: 1.45 }}>{highlight(ctx, marks)}</div>{also.length > 0 && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, marginTop: 4 }}>Also on this page: {highlight(also.join(', '), marks)}</div>}{opens && <div style={{ color: 'var(--rbl-link)', fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>{opens} →</div>}</div>{e.v != null && <strong style={{ color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(e.v)}</strong>}</div></a> })}{results.length > limit && <div style={{ textAlign: 'center' }}><button type="button" onClick={() => setLimit((l) => l + 100)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-title)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Show {Math.min(100, results.length - limit).toLocaleString()} more <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 400 }}>of {(results.length - limit).toLocaleString()} left</span></button></div>}</section>}
    </div>
  )
}
