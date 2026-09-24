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
//
// A second round, from a set of searches residents actually type:
//   - A record can carry "k", words it is found by but does not show: a
//     document page's full vocabulary, or a site page's keywords.
//   - Plurals match their singular ("salaries" finds "salary", "raises"
//     finds "raise"). Before, "raises" found nothing and "highways" one record.
//   - A misspelled word that matches nothing is read as the closest word in
//     the index, one letter off (two for long words), and the caller is told
//     so it can say "showing results for". "Hegermiler", "overtme" and
//     "assesor" found nothing.
//   - A word typed in full no longer matches the start of longer words as
//     strongly: "cost" put an officer named Costantini first for "how much
//     does the police department cost". A word that isn't in the index yet
//     ("polic", mid-typing) still does.
//   - A hyphenated name matches its parts: "Vail-Leavitt" and "Leavitt" both
//     find "Vail-Leavitt", not everyone named Vail.
//   - On pay and salary records the job title and department count nearly as
//     much as the person's name, so "highway superintendent" finds the
//     Superintendent of Highways and not only resolutions about a deputy.
//   - A date ("september 15", "9/15") finds that meeting's votes.
//   - "Highest paid" ranks the latest payroll year, not a retiree's final
//     year of pay.

export type RankEntry = { t: string; n: string; x: string; k?: string; v?: number | null }

const K1 = 1.2
const B_NAME = 0.3 // names are short; full normalisation over-rewards the shortest
const B_CTX = 0.75
const B_KW = 0.5
// Name, context and keyword weights. A person's title and department are in
// the context of pay and salary records; a site page's keywords are written
// to be searched.
const FIELD_W: Record<string, { name: number; ctx: number; kw: number }> = {
  payroll: { name: 3, ctx: 2, kw: 0 },
  salary: { name: 3, ctx: 2, kw: 0 },
  site: { name: 3, ctx: 1.2, kw: 1.5 },
}
const DEFAULT_W = { name: 3, ctx: 1, kw: 0.6 }
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
const TYPE_PRIOR: Record<string, number> = { page: 0.55, fund: 1.4 }

const TOKEN = /[a-z0-9][a-z0-9'’-]*/g
const YEAR = /\b(20[0-3]\d)\b/g
export const tokensOf = (s: string): string[] => s.toLowerCase().match(TOKEN) ?? []

/** Index tokens: a hyphenated word without digits also counts as its parts. */
function indexTokens(s: string): string[] {
  const out: string[] = []
  for (const raw of tokensOf(s)) {
    const t = raw.replace(/['’]s$/, '')
    out.push(t)
    if (t.includes('-') && !/\d/.test(t)) for (const part of t.split('-')) if (part.length >= 2) out.push(part)
  }
  return out
}

/** Plural to singular, and nothing else: "salaries" → "salary", "taxes" → "tax". */
export function stem(t: string): string {
  if (t.length <= 3 || /\d/.test(t)) return t
  if (t.endsWith('ies') && t.length > 4) return `${t.slice(0, -3)}y`
  if (/(ss|us|is)$/.test(t)) return t
  if (/(ches|shes|sses|xes|zes)$/.test(t)) return t.slice(0, -2)
  if (t.endsWith('s')) return t.slice(0, -1)
  return t
}

/** Damerau–Levenshtein distance, stopping early once it passes `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)]
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1)
      row.push(v)
      if (v < best) best = v
    }
    if (best > max) return max + 1
    rows.push(row)
  }
  return rows[a.length][b.length]
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_DAY = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s+(20\d\d))?/
const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(20\d\d))?\b/

/**
 * A meeting date in the query, as the vote records print it ("September 15,"
 * plus the year when given), and the words it used up.
 */
function queryDate(raw: string): { text: string; year: string | null; used: string[] } | null {
  const q = raw.toLowerCase()
  const named = MONTH_DAY.exec(q)
  if (named) {
    const month = MONTHS.find((m) => m.startsWith(named[1].slice(0, 3)))
    const day = Number(named[2])
    if (month && day >= 1 && day <= 31) return { text: `${month} ${day},`, year: named[3] ?? null, used: [named[2], named[3] ?? ''].filter(Boolean) }
  }
  const numeric = NUMERIC_DATE.exec(q)
  if (numeric) {
    const month = MONTHS[Number(numeric[1]) - 1]
    const day = Number(numeric[2])
    if (month && day >= 1 && day <= 31) return { text: `${month} ${day},`, year: numeric[3] ?? null, used: [] }
  }
  return null
}

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
  kwLen: number
  nameLower: string
  /** Name and context, lower-cased, for the date match. */
  textLower: string
  /** A pay or salary record's job title, as singular words. */
  role: Set<string> | null
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
  kwIdx: Map<string, number[]>
  vocab: string[]
  /** Each vocab word's singular form, by position. */
  vocabStems: string[]
  /** How many records carry each word, in any field. */
  df: Map<string, number>
  /** Words by their singular form. */
  byStem: Map<string, string[]>
  avgName: number
  avgCtx: number
  avgKw: number
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
  const kwIdx = new Map<string, number[]>()
  let nameLen = 0
  let ctxLen = 0
  let kwLen = 0
  let kwDocs = 0
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
    const name = indexTokens(e.n)
    const ctx = indexTokens(e.x)
    const kw = e.k ? indexTokens(e.k) : []
    const year = latestYearIn(`${e.n} ${e.x}`)
    if (year && year > latestYear) latestYear = year
    const top = maxLog.get(e.t)
    const pageMatch = e.t === 'page' ? PAGE_SUFFIX.exec(e.n) : null
    docs.push({
      nameLen: name.length,
      ctxLen: ctx.length,
      kwLen: kw.length,
      nameLower: e.n.toLowerCase(),
      textLower: `${e.n} ${e.x}`.toLowerCase(),
      role: e.t === 'payroll' || e.t === 'salary' ? new Set(indexTokens(e.x.split(' · ')[0]).map(stem)) : null,
      title: pageMatch ? e.n.slice(0, pageMatch.index).toLowerCase() : null,
      page: pageMatch ? Number(pageMatch[1]) : null,
      year,
      importance: e.v && e.v > 0 && top ? Math.log10(1 + e.v) / top : null,
      share: e.v && e.v > 0 && maxV.get(e.t) ? e.v / (maxV.get(e.t) as number) : null,
    })
    nameLen += name.length
    ctxLen += ctx.length
    if (kw.length) { kwLen += kw.length; kwDocs++ }
    post(nameIdx, name, i)
    post(ctxIdx, ctx, i)
    post(kwIdx, kw, i)
  })
  const n = Math.max(1, entries.length)
  const vocab = Array.from(new Set(Array.from(nameIdx.keys()).concat(Array.from(ctxIdx.keys()), Array.from(kwIdx.keys()))))
  const df = new Map<string, number>()
  const byStem = new Map<string, string[]>()
  for (const tok of vocab) {
    const ids = new Set([...(nameIdx.get(tok) ?? []), ...(ctxIdx.get(tok) ?? []), ...(kwIdx.get(tok) ?? [])])
    df.set(tok, ids.size)
    const st = stem(tok)
    const list = byStem.get(st)
    if (list) list.push(tok)
    else byStem.set(st, [tok])
  }
  const vocabStems = vocab.map(stem)
  const idx: Index = {
    docs, nameIdx, ctxIdx, kwIdx, vocab, vocabStems, df, byStem,
    avgName: nameLen / n || 1, avgCtx: ctxLen / n || 1, avgKw: kwDocs ? kwLen / kwDocs : 1, latestYear,
  }
  cache.set(entries, idx)
  return idx
}

/**
 * How well one indexed token matches one query term. A whole word counts
 * fully, and its plural or singular nearly so; the start of a word counts by
 * how much of it was typed, so "staff" matches "staffing" and "Stafford" but
 * below "staff"; a fragment inside a word counts least. When the term is
 * itself a word in the index, the reader typed the word they meant: longer
 * words that start with it count for little, and words containing it not at all.
 */
function strength(token: string, tokenStem: string, term: string, termStem: string, known: boolean): number {
  if (token === term) return 1
  if (tokenStem === termStem) return 0.95
  if (token.startsWith(term)) return known ? 0.2 : 0.5 + 0.4 * (term.length / token.length)
  // Inside a word, a real word is almost always an accident: "ice" in
  // "police", "service" and "justice". A fragment still matches.
  if (term.length >= 3 && !known && token.includes(term)) return 0.3
  return 0
}

/**
 * A query's words. A hyphenated word with no digits ("highest-paid") is its
 * parts; one with digits is an identifier -- a resolution number such as
 * "2026-642" or an account code -- and stays whole.
 */
function queryWords(raw: string): string[] {
  return tokensOf(raw)
    .map((t) => t.replace(/['’]s$/, ''))
    .flatMap((t) => (t.includes('-') && !/\d/.test(t) ? t.split('-') : [t]))
}

/** The query as the ranker sees it: its words, minus function words and superlatives when others remain. */
export function queryTerms(raw: string): string[] {
  const all = Array.from(new Set(queryWords(raw).filter((t) => t.length >= 2)))
  const content = all.filter((t) => !STOP.has(t) && !SUPERLATIVE.has(t))
  return content.length ? content : all
}

function termStrength(token: string, tokenStem: string, term: string, termStem: string, known: boolean): number {
  let s = strength(token, tokenStem, term, termStem, known)
  if (s < 0.9) for (const syn of SYNONYMS[term] ?? SYNONYMS[termStem] ?? []) if (token === syn) s = Math.max(s, 0.9)
  return s
}

type Scored<T extends RankEntry> = { e: T; score: number; coverage: number }
type TermHits = { name: Map<number, number>; ctx: Map<number, number>; kw: Map<number, number>; idf: number; exact: Set<number> | null }
export type Correction = { from: string; to: string }
type Scoring<T extends RankEntry> = { scored: Scored<T>[]; highlight: string[]; corrections: Correction[] }

const FUZZY_STRENGTH = 0.8
const HIGHLIGHT_PER_TERM = 8

/**
 * BM25 over the best-matching word in each field (a record's name is a few
 * words, and its context saturates quickly at BM25's k1 anyway), then the
 * adjustments described at the top of this file. Best first.
 */
function score<T extends RankEntry>(entries: T[], raw: string): Scoring<T> {
  const date = queryDate(raw)
  const used = new Set(date?.used ?? [])
  const terms = queryTerms(raw).filter((t) => !used.has(t))
  if (!terms.length && !date) return { scored: [], highlight: [], corrections: [] }
  const idx = indexOf(entries)
  const N = entries.length
  const phrase = raw.toLowerCase().trim().replace(/\s+/g, ' ')
  const queryYear = terms.some((t) => /^20[0-3]\d$/.test(t)) || !!date?.year
  const superlative = queryWords(raw).some((t) => SUPERLATIVE.has(t))
  const importanceWeight = superlative ? SUPERLATIVE_IMPORTANCE_WEIGHT : IMPORTANCE_WEIGHT
  const highlight = new Set<string>()
  const corrections: Correction[] = []

  const idfOf = (df: number) => Math.log(1 + (N - df + 0.5) / (df + 0.5))
  const collect = (name: Map<number, number>, ctx: Map<number, number>, kw: Map<number, number>, tok: string, s: number) => {
    for (const id of idx.nameIdx.get(tok) ?? []) if (s > (name.get(id) ?? 0)) name.set(id, s)
    for (const id of idx.ctxIdx.get(tok) ?? []) if (s > (ctx.get(id) ?? 0)) ctx.set(id, s)
    for (const id of idx.kwIdx.get(tok) ?? []) if (s > (kw.get(id) ?? 0)) kw.set(id, s)
  }

  const hits: TermHits[] = terms.map((term) => {
    const name = new Map<number, number>()
    const ctx = new Map<number, number>()
    const kw = new Map<number, number>()
    const termStem = stem(term)
    const known = idx.df.has(term) || idx.byStem.has(termStem)
    const shown: [string, number][] = []
    idx.vocab.forEach((tok, i) => {
      const s = termStrength(tok, idx.vocabStems[i], term, termStem, known)
      if (!s) return
      collect(name, ctx, kw, tok, s)
      if (s >= 0.5) shown.push([tok, idx.df.get(tok) ?? 0])
    })
    // Nothing matched at all: read a misspelling as the closest indexed word.
    if (!name.size && !ctx.size && !kw.size && term.length >= 4 && !/\d/.test(term)) {
      const max = term.length >= 8 ? 2 : 1
      let best = max + 1
      let found: string[] = []
      for (const tok of idx.vocab) {
        if (tok[0] !== term[0] || Math.abs(tok.length - term.length) > max) continue
        const d = editDistance(tok, term, max)
        if (d < best) { best = d; found = [tok] }
        else if (d === best && d <= max) found.push(tok)
      }
      if (best <= max) {
        found.sort((a, b) => (idx.df.get(b) ?? 0) - (idx.df.get(a) ?? 0))
        for (const tok of found.slice(0, 3)) { collect(name, ctx, kw, tok, FUZZY_STRENGTH); shown.push([tok, idx.df.get(tok) ?? 0]) }
        corrections.push({ from: term, to: found[0] })
      }
    }
    shown.sort((a, b) => b[1] - a[1]).slice(0, HIGHLIGHT_PER_TERM).forEach(([tok]) => highlight.add(tok))
    const all = new Set<number>(Array.from(name.keys()).concat(Array.from(ctx.keys()), Array.from(kw.keys())))
    // A resolution number, account code or fund code typed exactly.
    const exact = /\d/.test(term) ? new Set([...(idx.nameIdx.get(term) ?? []), ...(idx.ctxIdx.get(term) ?? [])]) : null
    return { name, ctx, kw, idf: idfOf(all.size), exact }
  })

  const roleStems = terms.map((t) => stem(corrections.find((c) => c.from === t)?.to ?? t))
  // A date works as one more term, matched against the date a vote record prints.
  if (date) {
    const ctx = new Map<number, number>()
    idx.docs.forEach((d, id) => { if (d.textLower.includes(date.text) && (!date.year || d.textLower.includes(date.year))) ctx.set(id, 1) })
    if (ctx.size) hits.push({ name: new Map(), ctx, kw: new Map(), idf: idfOf(ctx.size) * 2, exact: null })
  }

  const candidates = new Set<number>()
  for (const h of hits) for (const m of [h.name, h.ctx, h.kw]) m.forEach((_, id) => candidates.add(id))

  const idfTotal = hits.reduce((sum, h) => sum + h.idf, 0) || 1
  const out: Scored<T>[] = []
  for (const id of Array.from(candidates)) {
    const d = idx.docs[id]
    const fw = FIELD_W[entries[id].t] ?? DEFAULT_W
    let s = 0
    let matchedIdf = 0
    let exactId = false
    for (const h of hits) {
      const tfName = h.name.get(id) ?? 0
      const tfCtx = h.ctx.get(id) ?? 0
      const tfKw = h.kw.get(id) ?? 0
      if (!tfName && !tfCtx && !tfKw) continue
      matchedIdf += h.idf * Math.max(tfName, tfCtx, tfKw)
      if (h.exact?.has(id)) exactId = true
      const w =
        (fw.name * tfName) / (1 - B_NAME + (B_NAME * d.nameLen) / idx.avgName) +
        (fw.ctx * tfCtx) / (1 - B_CTX + (B_CTX * d.ctxLen) / idx.avgCtx) +
        (tfKw && d.kwLen ? (fw.kw * tfKw) / (1 - B_KW + (B_KW * d.kwLen) / idx.avgKw) : 0)
      s += h.idf * ((w * (K1 + 1)) / (w + K1))
    }
    // How much of the query this record answers, each word weighted by rarity
    // and by how well it matched: a word found only as the start of a longer
    // one answers less of the query than the word itself.
    const coverage = matchedIdf / idfTotal
    s *= coverage
    // Exact matches first, as OpenClaw ranks an exact path ahead of a partial
    // one: the whole name, then a name that starts with the query. A document
    // whose title starts with the query leads with its first page.
    if (d.title !== null) {
      if (phrase.length >= 3 && d.title.startsWith(phrase)) s *= d.page === 1 ? 4 : 1.2
    } else if (d.nameLower === phrase) s *= 3
    else if (phrase.length >= 3 && d.nameLower.startsWith(phrase)) s *= 1.6
    else if (terms.length > 1 && d.nameLower.includes(phrase)) s *= 1.3
    if (exactId) s *= 2
    // Every word of a multi-word query in a person's job title (not the
    // department): the query names a role, and the person holding it is
    // what it asks for.
    if (d.role && terms.length > 1 && roleStems.every((st) => d.role?.has(st))) s *= 1.6
    s *= TYPE_PRIOR[entries[id].t] ?? 1
    const weight = superlative ? d.share : d.importance
    if (weight !== null) s *= Math.max(0.05, 1 + importanceWeight * (weight - 0.5))
    if (!queryYear && d.year && idx.latestYear) {
      const decay = Math.pow(0.5, (idx.latestYear - d.year) / HALF_LIFE_YEARS)
      s *= 1 - RECENCY_WEIGHT + RECENCY_WEIGHT * decay
    }
    out.push({ e: entries[id], score: s, coverage })
  }
  out.sort((a, b) => b.score - a.score)
  return { scored: out, highlight: Array.from(highlight), corrections }
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
  const pool = entries.filter((e) => topic.types.includes(e.t) && e.v && e.v > 0 && !topic.exclude?.test(e.n))
  // A pay record is each person's latest year, so a retiree's final year of
  // pay would otherwise outrank this year's. "Highest paid" means now.
  let payYear = 0
  for (const e of pool) if (e.t === 'payroll') payYear = Math.max(payYear, latestYearIn(e.x) ?? 0)
  return pool
    .filter((e) => e.t !== 'payroll' || latestYearIn(e.x) === payYear)
    .sort((a, b) => (b.v as number) - (a.v as number))
    .slice(0, SUPERLATIVE_LEAD)
}

export type SearchOutcome<T extends RankEntry> = {
  /** Every match, best first, with the top of the list diversified. */
  results: T[]
  /** Up to three of the site's own pages that answer most of the query, best first. */
  sites: T[]
  /** Indexed words that matched, for highlighting: plurals, corrections and the rest. */
  highlight: string[]
  /** Words that matched nothing and were read as the closest indexed word. */
  corrections: Correction[]
  /** How much of the query each result answers, 0 to 1, weighted by how rare each word is. */
  coverage: Map<T, number>
}

const SITE_TYPE = 'site'
const SITE_MIN_COVERAGE = 0.6
const SITE_MIN_SHARE = 0.3
const SITE_LIMIT = 3

export function searchEntries<T extends RankEntry>(entries: T[], raw: string, pool = 60): SearchOutcome<T> {
  const { scored, highlight, corrections } = score(entries, raw)
  const coverage = new Map(scored.map((r) => [r.e, r.coverage] as [T, number]))
  // A site page is offered only when it answers most of the query and stands
  // near the best page offered; a page matching one common word is not an answer.
  const pages = scored.filter((r) => r.e.t === SITE_TYPE && r.coverage >= SITE_MIN_COVERAGE)
  const sites = pages.filter((r) => r.score >= SITE_MIN_SHARE * (pages[0]?.score ?? 0)).slice(0, SITE_LIMIT).map((r) => r.e)
  const ranked = mmr(scored, pool).map((r) => r.e)
  const lead = superlativeLead(entries, raw)
  if (!lead.length) return { results: ranked, sites, highlight, corrections, coverage }
  const first = new Set(lead)
  return { results: [...lead, ...ranked.filter((e) => !first.has(e))], sites, highlight, corrections, coverage }
}

/** Every match, best first, with the top of the list diversified. */
export function rankEntries<T extends RankEntry>(entries: T[], raw: string, pool = 60): T[] {
  return searchEntries(entries, raw, pool).results
}
