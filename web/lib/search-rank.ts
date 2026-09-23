// Ranking for the site search, adapted from the retrieval design of OpenClaw's
// memory search (github.com/openclaw/openclaw, extensions/memory-core, MIT
// License): BM25 keyword relevance, exact matches first, a mild preference for
// recent records, and Maximal Marginal Relevance so near-duplicates do not
// crowd out everything else. The code is this site's own. BM25's k1 = 1.2 and
// b = 0.75 are the defaults OpenClaw inherits from SQLite FTS5 (a record's
// name, being short, gets a softer b), and MMR's lambda of 0.7 with Jaccard
// similarity over tokens is OpenClaw's setting.
//
// OpenClaw pairs this keyword leg with an embedding (vector) leg. This site is
// a static export with no server and no key of its own, so only the keyword leg
// runs here, which is also what OpenClaw does when no embedding provider is
// configured. Everything runs in the browser on the index already loaded.
//
// What changed from the scorer this replaces, and why:
//   - Every word used to count the same. "Police" is on thousands of records
//     and "Hegermiller" on a handful, so a rare word now weighs more (IDF).
//   - A long document page used to collect points just for being long. Field
//     length is normalised, and the record's name outweighs its context.
//   - Records matching more of the query rank ahead of those matching less,
//     with each word weighted by how rare it is: a question that names
//     "Petrocelli" among five common words is mostly about Petrocelli. An
//     exact name, resolution number or account code ranks first.
//   - The same person's pay for seven years, or seven near-identical budget
//     lines, could fill the first screen. MMR re-orders the top of the list so
//     a different record gets a turn; nothing is dropped.
//   - Among equally good matches, recent records edge ahead: at most 25% off
//     for age, half of that after three years, and none when the query names a
//     year, because then the reader has already said which year they want.
//   - The Town's budget lines abbreviate ("Police - Pers Svcs Uniform OT" is
//     the $1M police overtime line), so a short list of those abbreviations
//     matches the words they stand for, both ways.
//   - A query that asks for the highest, largest or top records ranks by
//     dollar value, since no record contains those words. When it is about
//     pay, budget lines or funds, the largest records of that kind lead even
//     if they share no other word with it: "highest paid employees" means the
//     top salaries, and none of those records says "paid" or "employees".
//   - Among equally good matches, larger dollar amounts edge ahead, as
//     OpenClaw's importance weight does: a record's value against others of
//     its type, log-scaled, moves its score at most 15% either way, and a
//     record with no value is neutral. "A01" then leads with the General
//     Fund's largest lines rather than whichever small ones happen to tie.

export type RankEntry = { t: string; n: string; x: string; v?: number | null }

const K1 = 1.2
const B_NAME = 0.3 // names are short; full normalisation over-rewards the shortest
const B_CTX = 0.75
const W_NAME = 3
const W_CTX = 1
const MMR_LAMBDA = 0.7
const RECENCY_WEIGHT = 0.25
const IMPORTANCE_WEIGHT = 0.3
const SUPERLATIVE_IMPORTANCE_WEIGHT = 1.8
const SUPERLATIVE = new Set(['highest', 'largest', 'biggest', 'top', 'most', 'costliest', 'priciest'])

// Abbreviations in the Town's own budget line names, taken from the index.
// Each side matches the other as a whole word.
const SYNONYMS: Record<string, string[]> = {
  overtime: ['ot'], ot: ['overtime'],
  personal: ['pers'], pers: ['personal'],
  services: ['svcs', 'svc'], service: ['svc', 'svcs'], svcs: ['services'], svc: ['service'],
  retirement: ['ret'], ret: ['retirement'],
  administration: ['adm', 'admin'], adm: ['administration'], admin: ['administration'],
  maintenance: ['maint'], maint: ['maintenance'],
  equipment: ['equip'], equip: ['equipment'],
  insurance: ['ins'], hospital: ['hosp'], hosp: ['hospital'],
  transfer: ['trf'], transfers: ['trf'], trf: ['transfer'],
  department: ['dept'], dept: ['department'],
}
const HALF_LIFE_YEARS = 3
const TYPE_PRIOR: Record<string, number> = { page: 0.55 }

const TOKEN = /[a-z0-9][a-z0-9'’-]*/g
const YEAR = /\b(20[0-3]\d)\b/g
export const tokensOf = (s: string): string[] => s.toLowerCase().match(TOKEN) ?? []

// Function words carry no signal in a keyword search. Dropped only when the
// query has other words, so a search for "the" alone still searches.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'how', 'what',
  'why', 'who', 'when', 'where', 'which', 'does', 'do', 'did', 'has', 'have', 'had', 'can', 'much', 'many',
  'this', 'that', 'it', 'its', 'be', 'as', 'at', 'by', 'with', 'from', 'about', 'me', 'my', 'we', 'our',
])

type Doc = {
  nameLen: number
  ctxLen: number
  nameLower: string
  /** A document page's title without its " — p. N", and the page number. */
  title: string | null
  page: number | null
  year: number | null
  importance: number | null
  /** Value against the largest of its type, linear: what "highest" asks for. */
  share: number | null
}
type Index = {
  docs: Doc[]
  // Which records carry each word, kept apart by field so a match in the name
  // can outweigh one in the context without re-reading every record per query.
  nameIdx: Map<string, number[]>
  ctxIdx: Map<string, number[]>
  vocab: string[]
  avgName: number
  avgCtx: number
  latestYear: number
}

const cache = new WeakMap<RankEntry[], Index>()
const PAGE_SUFFIX = /\s+—\s+p\.\s*(\d+)$/

function latestYearIn(text: string): number | null {
  let max: number | null = null
  for (const m of text.match(YEAR) ?? []) {
    const y = Number(m)
    if (max === null || y > max) max = y
  }
  return max
}

function post(map: Map<string, number[]>, tokens: string[], id: number) {
  new Set(tokens).forEach((tok) => {
    const ids = map.get(tok)
    if (ids) ids.push(id)
    else map.set(tok, [id])
  })
}

function indexOf(entries: RankEntry[]): Index {
  const hit = cache.get(entries)
  if (hit) return hit
  const docs: Doc[] = []
  const nameIdx = new Map<string, number[]>()
  const ctxIdx = new Map<string, number[]>()
  let nameLen = 0
  let ctxLen = 0
  let latestYear = 0
  const maxLog = new Map<string, number>()
  const maxV = new Map<string, number>()
  for (const e of entries) {
    if (e.v && e.v > 0) {
      maxLog.set(e.t, Math.max(maxLog.get(e.t) ?? 0, Math.log10(1 + e.v)))
      maxV.set(e.t, Math.max(maxV.get(e.t) ?? 0, e.v))
    }
  }
  entries.forEach((e, i) => {
    const name = tokensOf(e.n)
    const ctx = tokensOf(e.x)
    const year = latestYearIn(`${e.n} ${e.x}`)
    if (year && year > latestYear) latestYear = year
    const top = maxLog.get(e.t)
    const pageMatch = e.t === 'page' ? PAGE_SUFFIX.exec(e.n) : null
    docs.push({
      nameLen: name.length,
      ctxLen: ctx.length,
      nameLower: e.n.toLowerCase(),
      title: pageMatch ? e.n.slice(0, pageMatch.index).toLowerCase() : null,
      page: pageMatch ? Number(pageMatch[1]) : null,
      year,
      importance: e.v && e.v > 0 && top ? Math.log10(1 + e.v) / top : null,
      share: e.v && e.v > 0 && maxV.get(e.t) ? e.v / (maxV.get(e.t) as number) : null,
    })
    nameLen += name.length
    ctxLen += ctx.length
    post(nameIdx, name, i)
    post(ctxIdx, ctx, i)
  })
  const n = Math.max(1, entries.length)
  const vocab = Array.from(new Set(Array.from(nameIdx.keys()).concat(Array.from(ctxIdx.keys()))))
  const idx: Index = { docs, nameIdx, ctxIdx, vocab, avgName: nameLen / n || 1, avgCtx: ctxLen / n || 1, latestYear }
  cache.set(entries, idx)
  return idx
}

/**
 * How well one indexed token matches one query term. A whole word counts
 * fully; the start of a word counts by how much of it was typed, so "staff"
 * matches "staffing" and "Stafford" but below "staff"; a match inside a word
 * ("water" in "wastewater") counts least.
 */
function strength(token: string, term: string): number {
  if (token === term) return 1
  if (token.startsWith(term)) return 0.5 + 0.4 * (term.length / token.length)
  if (term.length >= 3 && token.includes(term)) return 0.3
  return 0
}

/**
 * A query's words. A hyphenated word with no digits ("highest-paid") is its
 * parts; one with digits is an identifier -- a resolution number such as
 * "2026-642" or an account code -- and stays whole.
 */
function queryWords(raw: string): string[] {
  return tokensOf(raw).flatMap((t) => (t.includes('-') && !/\d/.test(t) ? t.split('-') : [t]))
}

/** The query as the ranker sees it: its words, minus function words and superlatives when others remain. */
export function queryTerms(raw: string): string[] {
  const all = Array.from(new Set(queryWords(raw).filter((t) => t.length >= 2)))
  const content = all.filter((t) => !STOP.has(t) && !SUPERLATIVE.has(t))
  return content.length ? content : all
}

function termStrength(token: string, term: string): number {
  let s = strength(token, term)
  if (s < 1) for (const syn of SYNONYMS[term] ?? []) if (token === syn) s = Math.max(s, 0.9)
  return s
}

type Scored<T extends RankEntry> = { e: T; score: number }
type TermHits = { name: Map<number, number>; ctx: Map<number, number>; idf: number; exact: Set<number> | null }

/**
 * BM25 over the best-matching word in each field (a record's name is a few
 * words, and its context saturates quickly at BM25's k1 anyway), then the
 * adjustments described at the top of this file. Best first.
 */
function score<T extends RankEntry>(entries: T[], raw: string): Scored<T>[] {
  const terms = queryTerms(raw)
  if (!terms.length) return []
  const idx = indexOf(entries)
  const N = entries.length
  const phrase = raw.toLowerCase().trim().replace(/\s+/g, ' ')
  const queryYear = terms.some((t) => /^20[0-3]\d$/.test(t))
  const superlative = queryWords(raw).some((t) => SUPERLATIVE.has(t))
  const importanceWeight = superlative ? SUPERLATIVE_IMPORTANCE_WEIGHT : IMPORTANCE_WEIGHT

  const hits: TermHits[] = terms.map((term) => {
    const name = new Map<number, number>()
    const ctx = new Map<number, number>()
    for (const tok of idx.vocab) {
      const s = termStrength(tok, term)
      if (!s) continue
      for (const id of idx.nameIdx.get(tok) ?? []) if (s > (name.get(id) ?? 0)) name.set(id, s)
      for (const id of idx.ctxIdx.get(tok) ?? []) if (s > (ctx.get(id) ?? 0)) ctx.set(id, s)
    }
    const all = new Set<number>()
    name.forEach((_, id) => all.add(id))
    ctx.forEach((_, id) => all.add(id))
    const df = all.size
    // A resolution number, account code or fund code typed exactly.
    const exact = /\d/.test(term) ? new Set([...(idx.nameIdx.get(term) ?? []), ...(idx.ctxIdx.get(term) ?? [])]) : null
    return { name, ctx, idf: Math.log(1 + (N - df + 0.5) / (df + 0.5)), exact }
  })

  const candidates = new Set<number>()
  for (const h of hits) {
    h.name.forEach((_, id) => candidates.add(id))
    h.ctx.forEach((_, id) => candidates.add(id))
  }

  const idfTotal = hits.reduce((sum, h) => sum + h.idf, 0) || 1
  const out: Scored<T>[] = []
  for (const id of Array.from(candidates)) {
    const d = idx.docs[id]
    let s = 0
    let matchedIdf = 0
    let exactId = false
    for (const h of hits) {
      const tfName = h.name.get(id) ?? 0
      const tfCtx = h.ctx.get(id) ?? 0
      if (!tfName && !tfCtx) continue
      matchedIdf += h.idf
      if (h.exact?.has(id)) exactId = true
      const w =
        (W_NAME * tfName) / (1 - B_NAME + (B_NAME * d.nameLen) / idx.avgName) +
        (W_CTX * tfCtx) / (1 - B_CTX + (B_CTX * d.ctxLen) / idx.avgCtx)
      s += h.idf * ((w * (K1 + 1)) / (w + K1))
    }
    // How much of the query this record answers, each word weighted by rarity.
    s *= matchedIdf / idfTotal
    // Exact matches first, as OpenClaw ranks an exact path ahead of a partial
    // one: the whole name, then a name that starts with the query. A document
    // whose title starts with the query leads with its first page.
    if (d.title !== null) {
      if (phrase.length >= 3 && d.title.startsWith(phrase)) s *= d.page === 1 ? 4 : 1.2
    } else if (d.nameLower === phrase) s *= 3
    else if (phrase.length >= 3 && d.nameLower.startsWith(phrase)) s *= 1.6
    else if (terms.length > 1 && d.nameLower.includes(phrase)) s *= 1.3
    if (exactId) s *= 2
    s *= TYPE_PRIOR[entries[id].t] ?? 1
    const weight = superlative ? d.share : d.importance
    if (weight !== null) s *= Math.max(0.05, 1 + importanceWeight * (weight - 0.5))
    if (!queryYear && d.year && idx.latestYear) {
      const decay = Math.pow(0.5, (idx.latestYear - d.year) / HALF_LIFE_YEARS)
      s *= 1 - RECENCY_WEIGHT + RECENCY_WEIGHT * decay
    }
    out.push({ e: entries[id], score: s })
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1
  if (!a.size || !b.size) return 0
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  let inter = 0
  small.forEach((t) => { if (large.has(t)) inter++ })
  return inter / (a.size + b.size - inter)
}

/**
 * Maximal Marginal Relevance over the first `pool` results: each pick
 * maximises lambda * relevance - (1 - lambda) * similarity to what is already
 * picked. Relevance is the score normalised to 0-1 across the pool. Results
 * past the pool keep their order. Nothing is removed.
 */
function mmr<T extends RankEntry>(ranked: Scored<T>[], pool: number): Scored<T>[] {
  const head = ranked.slice(0, pool)
  if (head.length <= 2) return ranked
  const max = head[0].score
  const min = head[head.length - 1].score
  const range = max - min
  const items = head.map((r) => ({ r, tokens: new Set(tokensOf(`${r.e.n} ${r.e.x}`)), rel: range ? (r.score - min) / range : 1, maxSim: 0 }))
  const picked: Scored<T>[] = []
  const remaining = new Set(items)
  while (remaining.size) {
    let best: (typeof items)[number] | null = null
    let bestScore = -Infinity
    for (const c of Array.from(remaining)) {
      const m = MMR_LAMBDA * c.rel - (1 - MMR_LAMBDA) * c.maxSim
      if (m > bestScore || (m === bestScore && best && c.r.score > best.r.score)) {
        best = c
        bestScore = m
      }
    }
    if (!best) break
    picked.push(best.r)
    remaining.delete(best)
    for (const c of Array.from(remaining)) {
      const sim = jaccard(c.tokens, best.tokens)
      if (sim > c.maxSim) c.maxSim = sim
    }
  }
  return [...picked, ...ranked.slice(pool)]
}

// What a superlative query is about, by the kind of record that answers it.
// Totals such as "Overtime — all departments" are payroll records too, and
// are left to the keyword ranking rather than listed as employees.
const SUPERLATIVE_TOPICS: { words: RegExp; types: string[]; exclude?: RegExp }[] = [
  { words: /\b(paid|pay|salar(y|ies)|earn\w*|payroll|compensation|wages?)\b/, types: ['salary', 'payroll'], exclude: /^Overtime —/ },
  { words: /\bfunds?\b/, types: ['fund'] },
  { words: /\b(budget|lines?|spend\w*|appropriation\w*|expens\w*|costs?)\b/, types: ['line-item'] },
]
const SUPERLATIVE_LEAD = 30

function superlativeLead<T extends RankEntry>(entries: T[], raw: string): T[] {
  const q = raw.toLowerCase()
  if (!queryWords(q).some((t) => SUPERLATIVE.has(t))) return []
  const topic = SUPERLATIVE_TOPICS.find((x) => x.words.test(q))
  if (!topic) return []
  return entries
    .filter((e) => topic.types.includes(e.t) && e.v && e.v > 0 && !topic.exclude?.test(e.n))
    .sort((a, b) => (b.v as number) - (a.v as number))
    .slice(0, SUPERLATIVE_LEAD)
}

/** Every match, best first, with the top of the list diversified. */
export function rankEntries<T extends RankEntry>(entries: T[], raw: string, pool = 60): T[] {
  const ranked = mmr(score(entries, raw), pool).map((s) => s.e)
  const lead = superlativeLead(entries, raw)
  if (!lead.length) return ranked
  const first = new Set(lead)
  return [...lead, ...ranked.filter((e) => !first.has(e))]
}
