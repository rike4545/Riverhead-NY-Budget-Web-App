// Transparency in the budget document itself: what a budget officer puts in the
// Tentative, which is the part of the transparency record a Supervisor controls.
//
// Six checks, applied the same way to each Tentative from 2024 on, so the 2027
// Tentative -- Supervisor Halpin's first -- is read against the three before it.
// Where a Tentative's text can be read, every check comes from
// etl/parse_budget_stages.py. Where the opening letter is a scanned image, as
// the 2025 and 2026 letters are, its text cannot be searched, so the site's
// reading is recorded below by hand with the pages it came from. A 2027 letter
// that turns out to be a scan shows as waiting to be read, never as missing.
//
// Transparency is not a plank in either candidate's platform as Candidate Watch
// records them, and his campaign page uses "accountability" once, without a
// specific commitment. So these are not promise checks. They measure a practice
// both candidates would be expected to keep.

import { stageDoc } from './budget-stages'
import { PREPARED_UNDER } from './tentative-2027'
import requestsJson from '../public/data/budget-supplement/requests-by-year.json'

export const YEARS = [2024, 2025, 2026, 2027] as const
export const preparedUnder = (y: number) => PREPARED_UNDER[y] ?? null

/**
 * The letters that are scanned images, read from the Town's own PDFs. The
 * quotes are exact. Neither letter prints a date except where given, and
 * neither prints the levy limit.
 */
const READ_BY_HAND: Record<number, { pages: string; taxCap: string | null; dated: string | null }> = {
  2025: {
    pages: 'pp. 2–3',
    taxCap: 'The Town-wide 2025 Budget is 4.14% over the tax cap, due in large part to increases to insurance premiums and retirement systems contributions.',
    dated: null,
  },
  2026: {
    pages: 'pp. 2–3',
    taxCap: 'The 2026 town-wide budget is 4.63% over the tax cap.',
    dated: 'September 29, 2025',
  },
}

export type CheckState = 'yes' | 'no' | 'none' | 'pending'
export type Cell = { state: CheckState; text: string; quote?: string }
export type Check = { id: string; label: string; why: string; cells: Record<number, Cell> }

const supplementYears = new Set((requestsJson as unknown as { years: number[] }).years)
// A sentence that mentions the cap is not always one that says where the levy
// stands: 2022's first is history ("has increased taxes to the tax cap since its
// inception"). Only a sentence with position wording counts as stating it.
const POSITION = /\b(over|above|under|below|within|beneath|exceed\w*|pierc\w*|less than|more than)\b/i
const WAITING: Cell = { state: 'pending', text: 'Sept 24' }
const TO_READ: Cell = { state: 'pending', text: 'Scanned or blank pages, not read yet' }

function letter(year: number) {
  const t = stageDoc(year, 'tentative')
  if (!t) return null
  const m = t.message
  const readable = m?.readablePages ?? []
  const hand = READ_BY_HAND[year] ?? null
  return {
    t,
    readable: readable.length > 0,
    firstPage: readable[0] ?? null,
    hand,
    // No readable letter, but opening pages with no text at all: a scan or a
    // blank, which only a reader can tell apart.
    unread: readable.length === 0 && !hand && (m?.unreadablePages.length ?? 0) > 0,
    taxCap: readable.length ? m?.taxCapSentences.find((x) => POSITION.test(x)) ?? null : hand?.taxCap ?? null,
    mentionsCap: readable.length ? m?.taxCapSentences[0] ?? null : null,
    dated: readable.length ? m?.dated ?? null : hand?.dated ?? null,
    levyLimitPage: m?.levyLimitPage ?? null,
  }
}

const byYear = (f: (y: number) => Cell) => Object.fromEntries(YEARS.map((y) => [y, f(y)])) as Record<number, Cell>

export const checks: Check[] = [
  {
    id: 'message',
    label: 'Starts with a letter explaining the budget',
    why: 'The only place a budget proposal explains its choices in plain words.',
    cells: byYear((y) => {
      const l = letter(y)
      if (!l) return WAITING
      if (l.readable) return { state: 'yes', text: `Yes, from p. ${l.firstPage}` }
      if (l.hand) return { state: 'yes', text: `Yes, a scanned letter (${l.hand.pages})` }
      if (l.unread) return TO_READ
      return { state: 'no', text: 'No' }
    }),
  },
  {
    id: 'tax-cap',
    label: 'Says how the tax increase compares with the tax cap',
    why: 'The number residents most need. Outside the letter, the budget documents don’t say it.',
    cells: byYear((y) => {
      const l = letter(y)
      if (!l) return WAITING
      if (l.unread) return TO_READ
      if (l.taxCap) return { state: 'yes', text: 'Yes', quote: l.taxCap }
      if (l.mentionsCap) return { state: 'no', text: 'Mentions the cap, but not where taxes stand against it', quote: l.mentionsCap }
      return { state: 'no', text: l.readable || l.hand ? 'Not in the letter' : 'No letter' }
    }),
  },
  {
    id: 'levy-limit',
    label: 'Prints the legal tax limit itself',
    why: 'The dollar figure the Town files with the State Comptroller. Without it, readers can’t check a claim about the cap.',
    cells: byYear((y) => {
      const l = letter(y)
      if (!l) return WAITING
      return l.levyLimitPage ? { state: 'yes', text: `Yes, p. ${l.levyLimitPage}` } : { state: 'no', text: 'No' }
    }),
  },
  {
    id: 'searchable',
    label: 'The letter is searchable text',
    why: 'A scanned page can’t be searched or read aloud by a screen reader.',
    cells: byYear((y) => {
      const l = letter(y)
      if (!l) return WAITING
      if (l.readable) return { state: 'yes', text: 'Yes' }
      if (l.hand) return { state: 'no', text: 'No, scanned images' }
      if (l.unread) return { state: 'no', text: 'No readable text' }
      return { state: 'none', text: 'No letter' }
    }),
  },
  {
    id: 'requests',
    label: 'Publishes what departments asked for',
    why: 'The Budget Supplement is the only public record of what departments requested, and what the proposal cut or raised.',
    cells: byYear((y) => {
      if (supplementYears.has(y)) return { state: 'yes', text: 'Yes' }
      return letter(y) ? { state: 'no', text: 'Not yet published' } : WAITING
    }),
  },
  {
    id: 'dated',
    label: 'The letter is dated by the September 30 deadline',
    why: 'State law (Town Law §106(2)) requires the proposal to be filed with the Town Clerk by September 30.',
    cells: byYear((y) => {
      const l = letter(y)
      if (!l) return WAITING
      if (l.unread) return TO_READ
      if (!l.readable && !l.hand) return { state: 'none', text: 'No letter' }
      if (!l.dated) return { state: 'none', text: 'Undated' }
      const onTime = new Date(l.dated) <= new Date(`September 30, ${y - 1}`)
      return { state: onTime ? 'yes' : 'no', text: onTime ? `Yes, ${l.dated}` : `No, ${l.dated}` }
    }),
  },
]

/** When this site first found the 2027 Tentative on the Town's website, within one run. */
export const firstFound2027 = (() => {
  const at = stageDoc(2027, 'tentative')?.source.parsedAt
  return at ? new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : null
})()

/** Outside the budget document, and not the budget officer's alone. */
export const beyondTheDocument = [
  'Fiscal impact forms. The three July resolutions that approved the retirement incentive were filed as having no fiscal impact. The Financial Administrator said they were added to the agenda late and never updated with her savings estimate (RiverheadLOCAL, July 9, 2026).',
  'Meeting minutes. When the minutes leave out how members voted, that’s the Town Clerk’s record, and the Town Clerk is elected separately. The Meetings page tracks each gap and fills in the votes from the official agenda packet.',
]
