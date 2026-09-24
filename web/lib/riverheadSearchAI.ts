// Client-side, bring-your-own-key AI layer for the site search.
//
// The site is a static export on GitHub Pages with no backend, so there is no
// safe place to hold a shared API key — hardcoding one would publish it. This
// module therefore mirrors the iOS app's pattern (RiverheadAIService.swift):
// the user pastes their own OpenAI key, it stays in their browser only, and the
// browser calls the OpenAI Responses API directly.
//
// The answer is retrieval-augmented: we score the same unified search index the
// keyword search uses, take the most relevant records, and pass ONLY those to
// the model as grounding. The model is instructed to answer from those records
// and cite them by number, so every AI answer is traceable to a real record.

import { rankEntries } from './search-rank'
import { SITE_PAGES } from './site-pages'

export type EntryType = 'line-item' | 'payroll' | 'salary' | 'resolution' | 'fund' | 'page' | 'site'
/** `k` holds words a record is found by but does not show: a document page's text, a site page's keywords. */
export type Entry = { t: EntryType; n: string; x: string; u: string; k?: string; v?: number | null }

/** The site's own pages as search entries. */
export const siteEntries = (): Entry[] => SITE_PAGES.map((p) => ({ t: 'site', n: p.title, x: p.summary, k: p.keywords, u: p.path }))

const TYPE_LABEL: Record<EntryType, string> = {
  site: 'Page on this site',
  fund: 'Fund',
  'line-item': 'Budget line',
  payroll: 'Payroll (actual pay)',
  salary: 'Authorized salary 2026',
  resolution: 'Town Board vote',
  page: 'Document page',
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'were',
  'how', 'what', 'why', 'who', 'when', 'where', 'which', 'does', 'do', 'did', 'has', 'have',
  'had', 'can', 'could', 'would', 'should', 'much', 'many', 'this', 'that', 'these', 'those',
  'it', 'its', 'be', 'been', 'as', 'at', 'by', 'with', 'from', 'about', 'into', 'over', 'per',
  'me', 'my', 'i', 'we', 'our', 'you', 'your', 'they', 'them', 'their', 'town', 'riverhead',
])

// Ranking lives in search-rank.ts: BM25 with exact matches first, a mild
// recency and importance preference, and MMR diversity, adapted from
// OpenClaw's memory search. These two wrappers keep the names the search page
// and the AI layer already call.

/** Every matching record, best first. `terms` is kept for callers; the ranker tokenises `phrase` itself. */
export function scoreEntries(entries: Entry[], terms: string[], phrase: string): Entry[] {
  const query = phrase.trim() || terms.join(' ')
  return query ? rankEntries(entries, query) : []
}

/**
 * The records the AI answer is grounded on. Question words that carry no
 * signal ("how much does the Town...") are dropped first, and the diversity
 * pass runs over a pool several times larger than `k`, so the model gets k
 * different records rather than k copies of the same one.
 */
export function retrieveForQuestion(entries: Entry[], question: string, k: number): Entry[] {
  const words = question.toLowerCase().match(/[a-z0-9][a-z0-9'’-]*/g) ?? []
  const content = words.filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  const query = (content.length ? content : words.filter((t) => t.length >= 2)).join(' ')
  return query ? rankEntries(entries, query, Math.max(60, k * 5)).slice(0, k) : []
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function groundingBlock(records: Entry[]): string {
  return records.map((e, i) => {
    const val = e.v != null ? ` — ${usd(e.v)}` : ''
    return `[${i + 1}] (${TYPE_LABEL[e.t]}) ${e.n}${val}\n    ${e.x}`
  }).join('\n')
}

const INSTRUCTIONS = `You are the Riverhead Budget Search Assistant — an unofficial, in-app explainer for the Town of Riverhead, New York, built into a public budget-transparency website.

You are given a resident's question and a numbered list of RECORDS retrieved from the site's own search index (budget line items, employee payroll, Board-authorized salaries, Town Board votes, operating funds, and official document pages). Answer the question using those records.

Core rules:
- Ground every factual claim in the provided records. Cite the records you use by their bracket number, e.g. "Police personal services is $14.97M [2]."
- Lead with the direct answer in one or two sentences. If numbers matter, state the most relevant number plainly and cite it.
- If the records do not contain enough to answer, say so plainly and suggest what to search for or which document to check — do NOT invent figures, and never state a dollar amount that is not in a cited record.
- Do not claim you searched the live web or any source beyond the records shown.
- Distinguish budget terms from accounting terms: an appropriation is not an expense; a levy is not total revenue. When relevant, distinguish restricted / assigned / unassigned fund balance, and recurring vs. one-time money. Note that "Authorized salary" records are Board-set salaries while "Payroll" records are actual pay — they are not the same figure.
- If a claim rests on the app's modeling rather than an adopted Town policy, say "in the app's current model" or similar.
- For legal conclusions, exact official deadlines, or compliance determinations, remind the reader the app is unofficial and to verify with Town staff, official notices, or the adopted budget and audited statements.

Answer style:
- Concise and easy to scan: short paragraphs or flat bullets, jargon explained in plain English.
- Do not sound like formal legal or financial advice.
- When helpful, end with one practical follow-up question a resident could ask at a Town Board hearing.`

export class RiverheadAIError extends Error {}

type AskArgs = { question: string; records: Entry[]; apiKey: string; signal?: AbortSignal }

export async function askRiverheadSearchAI({ question, records, apiKey, signal }: AskArgs): Promise<string> {
  const key = apiKey.trim()
  if (!key) throw new RiverheadAIError('Add your OpenAI API key to use Ask AI.')
  const input = `Records retrieved for this question:\n\n${groundingBlock(records)}\n\nResident question:\n${question}\n\nAnswer using the records above and cite them by number.`
  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-5-mini', instructions: INSTRUCTIONS, input, max_output_tokens: 800 }), signal,
    })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new RiverheadAIError('Could not reach OpenAI. Check your connection and try again.')
  }
  if (!res.ok) {
    let message = `OpenAI returned HTTP ${res.status}.`
    try { const body = await res.json(); if (body?.error?.message) message = body.error.message as string } catch { /* keep default */ }
    if (res.status === 401) message = 'That OpenAI key was rejected (HTTP 401). Check the key and try again.'
    throw new RiverheadAIError(message)
  }
  const data = await res.json()
  const text = parseOutputText(data)?.trim()
  if (!text) throw new RiverheadAIError("The AI service returned a response we couldn't read.")
  return text
}

function parseOutputText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  if (typeof obj.output_text === 'string' && obj.output_text) return obj.output_text
  const output = obj.output
  if (!Array.isArray(output)) return null
  const parts: string[] = []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    if (rec.type !== 'message' || !Array.isArray(rec.content)) continue
    for (const block of rec.content) {
      if (block && typeof block === 'object') {
        const b = block as Record<string, unknown>
        if (b.type === 'output_text' && typeof b.text === 'string') parts.push(b.text)
      }
    }
  }
  return parts.length ? parts.join('\n\n') : null
}
