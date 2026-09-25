// How each budget got from the Supervisor's Tentative to the one the Town ran on,
// 2005 onward.
//
// Two sources, kept apart:
//   - What changed, and by how much, is read from the stage columns printed in
//     each budget book (etl/parse_budget_adoption.py). Nothing here restates it.
//   - What the Board did -- when it changed the Tentative, whether it voted to
//     adopt the result, and what members said -- is read from the Town's own
//     minutes, one CivicClerk file per meeting, and recorded below with that
//     file. Seven of those files are scanned images and were read page by page;
//     they are marked. A date or vote that could not be read from a minutes file
//     is left out rather than filled in.
//
// Party labels appear only where a source gives them. The site has no sourced
// party for the council members who served before 2010, so none is shown.

import adoptionJson from '../public/data/history/budget-adoption.json'
import taxCapJson from '../public/data/tax-cap.json'

export type Stage = 'requested' | 'tentative' | 'preliminary' | 'adopted'

export type LineChange = { fund: string; account: string; name: string; from: number; to: number; delta: number }
export type StageChange = {
  from: Stage
  to: Stage
  delta: number
  linesChanged: number
  increase: number
  decrease: number
  largest: LineChange[]
}

type BookYear = {
  year: number
  layout: 'recap' | 'stage-columns'
  source: { title: string; url: string; slug: string }
  printed: Partial<Record<Stage, string>>
  lines: number
  totals: Record<Stage, number | null>
  reconciliation: { against: string; complete: boolean; fundsOff: unknown[] }
  changes: Record<string, StageChange>
  zeroedInPreliminary: { lines: number; amount: number } | null
}

type TentativeOnlyYear = {
  year: number
  layout: 'tentative-only'
  source: { title: string; url: string; slug: string }
  totals: { tentative: number | null }
  priorYearCheck: {
    against: string
    unchanged: boolean
    rows: { fund: string; tentativeAppropriations: number; reportedAppropriations: number | null; tentativeLevy: number; reportedLevy: number | null }[]
  } | null
}

type AdoptionFile = { note: string; firstYear: number; years: Record<string, BookYear | TentativeOnlyYear> }

const adoption = adoptionJson as unknown as AdoptionFile

export function book(year: number): BookYear | TentativeOnlyYear | null {
  return adoption.years[String(year)] ?? null
}

/** Net change the Board made from the Tentative to the budget the Town ran on. Null when no adopted book exists. */
export function netChange(year: number): StageChange | null {
  const b = book(year)
  if (!b || b.layout === 'tentative-only') return null
  return b.changes.tentativeToAdopted ?? null
}

// --- the minutes record -----------------------------------------------------

export type Source = { label: string; url: string }
export type Quote = { who: string; text: string; source: Source }

/** Did the budget become the budget by a vote? */
export type Outcome = 'vote' | 'no-vote' | 'voted-down'
/** When the Board changed the Tentative, relative to the public hearing. */
export type Timing = 'before' | 'before-and-after' | 'after' | 'none'

export type YearRecord = {
  year: number
  supervisor: string
  party: 'D' | 'R' | null
  /** The other four members, from the adoption meeting's roll call. */
  board: string[]
  hearing: string | null
  timing: Timing
  adoption: { outcome: Outcome; date: string | null; vote: string | null; resolution: string | null }
  /** Adopted by a Board whose Supervisor was leaving office. */
  lameDuck?: string
  /** Did the hearing notice list the elected officials' proposed salaries, as Town Law §108 requires? Null where not checked. */
  noticeSalaries?: boolean
  override?: { date: string; vote: string; resolution: string }
  summary: string
  quotes: Quote[]
  sources: Source[]
}

const civic = (fileId: number, label: string, scanned = false): Source => ({
  label: `${label}${scanned ? ' (scanned; read page by page)' : ''}`,
  url: `https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=${fileId},plainText=false)`,
})

const NEWS_REVIEW_2017: Source = {
  label: 'Riverhead News-Review, Nov. 2017: “the first time a Democrat sits on the Town Board since Mr. Cardinale”',
  url: 'https://riverheadnewsreview.archive.timesreview.com/2017/11/live-riverhead-town-election-results-2017',
}
const LOCAL_2014: Source = {
  label: 'RiverheadLOCAL, Nov. 7, 2014 Board wrap',
  url: 'https://riverheadlocal.com/2014/11/07/riverhead-town-board-wrap-nov-5/',
}
const LOCAL_AUDIT_2023: Source = {
  label: 'RiverheadLOCAL, Mar. 14, 2023: Town pierced the cap for five years without the required law',
  url: 'https://riverheadlocal.com/2023/03/14/2023-0314-tax-cap-mistake/',
}
const LOCAL_NOTICE_2025: Source = {
  label: 'RiverheadLOCAL, Nov. 5, 2025: questions about the budget hearing notice go unanswered',
  url: 'https://riverheadlocal.com/2025/11/05/riverhead-to-hold-hearing-to-pierce-tax-cap-and-adopt-2026-budget-thursday-questions-about-budget-hearing-notice-go-unanswered/',
}
const MEMO_2019: Source = {
  label: 'Financial Administrator’s memo, Oct. 31, 2019: proposed changes requested by Board members',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/275/2020-Proposed-Changes-to-Preliminary-Budget-PDF',
}

export const RECORD: YearRecord[] = [
  {
    year: 2005, supervisor: 'Phil Cardinale', party: 'D', board: ['Densieski', 'Blass', 'Sanders', 'Bartunek'],
    hearing: '2004-11-03', timing: 'before',
    adoption: { outcome: 'vote', date: '2004-11-16', vote: '5–0', resolution: '#1059' },
    summary:
      'The Board rebuilt Cardinale’s first Tentative into its Preliminary, moving several hundred thousand dollars; Cardinale said the tax-rate increase ended where it started, at 5.5%: “when we added we cut.” No amendment was offered at adoption, though the adopted column carries about $79,000 of debt-service and garbage-contract re-estimates.',
    quotes: [
      { who: 'Councilman Densieski', text: 'I think Phil did what ever Supervisor before him has done and that’s to cut the budget down to the bare bones and let the Town Board put it back in and I guess that’s normal procedure.', source: civic(6799, 'Minutes, Nov. 16, 2004') },
      { who: 'Supervisor Cardinale', text: 'The Board had significant impact of several hundreds of thousands of dollars where they moved money, where they felt appropriate with three votes and which I concurred in in most instances.', source: civic(6799, 'Minutes, Nov. 16, 2004') },
    ],
    sources: [civic(6583, 'Minutes, Nov. 3, 2004 (hearing)'), civic(6799, 'Minutes, Nov. 16, 2004 (adoption)')],
  },
  {
    year: 2006, supervisor: 'Phil Cardinale', party: 'D', board: ['Densieski', 'Bartunek', 'Blass', 'Sanders'],
    hearing: '2005-11-09', timing: 'before-and-after',
    adoption: { outcome: 'vote', date: '2005-11-17', vote: '5–0', resolution: '#1100' },
    summary:
      'The Preliminary added the new sanitation contract and personnel promotions the Board had approved since the Tentative. Adoption added Town Attorney staff and rent for offices at 552 East Main Street after a basement flood.',
    quotes: [
      { who: 'Supervisor Cardinale', text: 'There will be a preliminary after the board looks at it on the 20th of October and then a final November 20th.', source: civic(6224, 'Minutes, Oct. 4, 2005') },
    ],
    sources: [civic(6422, 'Minutes, Oct. 18, 2005 (hearing notice)'), civic(8315, 'Minutes, Nov. 9, 2005 (hearing)'), civic(8339, 'Minutes, Nov. 17, 2005 (adoption)', true)],
  },
  {
    year: 2007, supervisor: 'Phil Cardinale', party: 'D', board: ['Bartunek', 'Dunleavy', 'Blass', 'Densieski'],
    hearing: '2006-11-08', timing: 'before-and-after',
    adoption: { outcome: 'vote', date: '2006-11-20', vote: '4–1, Supervisor no', resolution: '#1051' },
    summary:
      'The Board added programs it said the Tentative had left out, and raises for its own members (3–2, Cardinale and Bartunek voting no). Councilwoman Blass put the result on the record: spending up 6.1% instead of 4.5%, the tax increase 8.2% instead of 5.9%. Cardinale voted against the budget.',
    quotes: [
      { who: 'Supervisor Cardinale', text: 'the supervisor produces a tentative budget by September 30th, by the first week in November the board should have looked at it and make the changes they feel appropriate and then by November 20th it has to be adopted or whatever is on file, the tentative or preliminary, becomes the budget.', source: civic(8366, 'Minutes, Nov. 20, 2006', true) },
      { who: 'Supervisor Cardinale', text: 'the easy part is to add. The hard part is to cut.', source: civic(8366, 'Minutes, Nov. 20, 2006', true) },
    ],
    sources: [civic(6703, 'Minutes, Nov. 8, 2006 (hearing)'), civic(8366, 'Minutes, Nov. 20, 2006 (amendments and adoption)', true)],
  },
  {
    year: 2008, supervisor: 'Phil Cardinale', party: 'D', board: ['Densieski', 'Bartunek', 'Blass', 'Dunleavy'],
    hearing: '2007-11-07', timing: 'before-and-after',
    adoption: { outcome: 'vote', date: '2007-11-20', vote: '3–1, Supervisor no, one abstention', resolution: '#1113' },
    summary:
      'The Board amended the Tentative a week before the hearing, again at the hearing, and again at adoption. Cardinale said the changes took the tax increase from 2.6% to 5.27%, and voted no. Densieski abstained over administrative charge-backs.',
    quotes: [
      { who: 'Supervisor Cardinale, opening the hearing', text: 'The annual budget has been on file since September 30th. About a week ago there were some amendments to certain lines of it which have been on file since as the preliminary budget and that’s what we’re having the hearing on today.', source: civic(6674, 'Minutes, Nov. 7, 2007') },
      { who: 'Councilman Dunleavy', text: 'Last year we got blamed for raising the tax up because you left things out that were needed.', source: civic(6896, 'Minutes, Nov. 20, 2007') },
    ],
    sources: [civic(6674, 'Minutes, Nov. 7, 2007 (hearing)'), civic(6896, 'Minutes, Nov. 20, 2007 (adoption)')],
  },
  {
    year: 2009, supervisor: 'Phil Cardinale', party: 'D', board: ['Blass', 'Wooten', 'Buckley', 'Dunleavy'],
    hearing: '2008-11-05', timing: 'after',
    adoption: { outcome: 'no-vote', date: null, vote: null, resolution: null },
    summary:
      'The hearing was held on the Tentative as filed, amid protest over eliminating the Town’s 911 dispatchers. The Board amended it that afternoon and again on the Nov. 20 deadline, funding the dispatchers to June 30 and adding 1.9% raises for elected officials (3–2). No resolution adopting the budget was offered; it took effect under Town Law §109(3).',
    quotes: [
      { who: 'Councilwoman Blass, voting no on the raises', text: 'I have a really hard time authorizing raises for myself in light of what we just did.', source: civic(8369, 'Minutes, Nov. 20, 2008', true) },
      { who: 'Supervisor Cardinale', text: 'That concludes the resolutions of the special meeting and concludes the meeting.', source: civic(8369, 'Minutes, Nov. 20, 2008', true) },
    ],
    sources: [civic(6630, 'Minutes, Nov. 5, 2008 (hearing and first amendments)'), civic(6848, 'Minutes, Nov. 18, 2008'), civic(8369, 'Minutes, Nov. 20, 2008 (last amendments; no adoption)', true)],
  },
  {
    year: 2010, supervisor: 'Phil Cardinale', party: 'D', board: ['Blass', 'Dunleavy', 'Wooten', 'Gabrielsen'],
    hearing: null, timing: 'after',
    lameDuck: 'Cardinale lost to Sean Walter on Nov. 3, 2009',
    adoption: { outcome: 'vote', date: '2009-11-19', vote: '5–0', resolution: '#1078' },
    summary:
      'Two weeks after Cardinale lost, the Board amended his Preliminary five times — funding the public safety dispatchers, among other things — and adopted it unanimously.',
    quotes: [
      { who: 'Supervisor Cardinale', text: 'We are opening the meeting of the Town Board to finally address the final amount of the budget.', source: civic(8348, 'Minutes, Nov. 19, 2009') },
    ],
    sources: [civic(8348, 'Minutes, Nov. 19, 2009 (amendments and adoption)')],
  },
  {
    year: 2011, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Gabrielsen', 'Giglio'],
    hearing: '2010-11-03', timing: 'after',
    adoption: { outcome: 'voted-down', date: '2010-11-19', vote: '1–4, only the Supervisor yes', resolution: '#866' },
    summary:
      'Walter’s first budget. The Board trimmed $22,000 and rejected a $113,860 General Fund tax cut. Then every council member voted against adopting the budget, and it took effect anyway.',
    quotes: [
      { who: 'Councilman Wooten', text: 'Or is that automatic', source: civic(8351, 'Minutes, Nov. 19, 2010', true) },
      { who: 'Councilman Gabrielsen', text: 'That’s automatic we don’t have to vote on that', source: civic(8351, 'Minutes, Nov. 19, 2010', true) },
    ],
    sources: [civic(6449, 'Minutes, Oct. 19, 2010 (hearing notice)'), civic(6586, 'Minutes, Nov. 3, 2010 (hearing)'), civic(8351, 'Minutes, Nov. 19, 2010 (amendments; adoption fails)', true)],
  },
  {
    year: 2012, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Gabrielsen', 'Giglio'],
    hearing: '2011-11-01', timing: 'none',
    adoption: { outcome: 'no-vote', date: null, vote: null, resolution: null },
    summary:
      'No changes and no adoption vote: no resolution at the Nov. 1 hearing meeting or the Nov. 15 meeting adopts the budget.',
    quotes: [],
    sources: [civic(6425, 'Minutes, Oct. 18, 2011 (hearing notice)'), civic(6554, 'Minutes, Nov. 1, 2011 (hearing)'), civic(6773, 'Minutes, Nov. 15, 2011 (no adoption)')],
  },
  {
    year: 2013, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Gabrielsen', 'Giglio'],
    hearing: '2012-11-07', timing: 'after',
    adoption: { outcome: 'no-vote', date: null, vote: null, resolution: null },
    summary:
      'The Board restored a Personnel Director over Walter’s no (4–1) and rejected a package of cuts (2–3). No adoption resolution followed; the amended Preliminary took effect on Nov. 20.',
    quotes: [
      { who: 'Councilman Wooten, voting against the cuts', text: 'I don’t like wringing the sponge dry, I just don’t like that.', source: civic(6899, 'Minutes, Nov. 20, 2012') },
    ],
    sources: [civic(6677, 'Minutes, Nov. 7, 2012 (hearing)'), civic(6899, 'Minutes, Nov. 20, 2012 (amendments; no adoption)')],
  },
  {
    year: 2014, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Gabrielsen', 'Giglio'],
    hearing: '2013-11-06', timing: 'none',
    adoption: { outcome: 'vote', date: '2013-11-19', vote: '5–0', resolution: '#779' },
    summary: 'Unchanged, and adopted unanimously — the first Walter budget Councilwoman Giglio voted for.',
    quotes: [
      { who: 'Councilwoman Giglio', text: 'this is your first budget that I will be voting for', source: civic(6871, 'Minutes, Nov. 19, 2013') },
      { who: 'Councilman Wooten', text: 'it’s a good budget, it’s tight budget and no you can’t have anything.', source: civic(6871, 'Minutes, Nov. 19, 2013') },
    ],
    sources: [civic(6147, 'Minutes, Oct. 1, 2013 (hearing notice)'), civic(6652, 'Minutes, Nov. 6, 2013 (hearing)'), civic(6871, 'Minutes, Nov. 19, 2013 (adoption)')],
  },
  {
    year: 2015, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Gabrielsen', 'Giglio'],
    hearing: '2014-11-05', timing: 'none',
    adoption: { outcome: 'no-vote', date: null, vote: null, resolution: null },
    summary:
      'Councilman Dunleavy moved to bring the budget to a vote. The motion failed, 2 yes, 2 no, Walter abstaining, and the Tentative took effect unchanged. The Town titles this book “2015 Final Budget.”',
    quotes: [
      { who: 'Councilman Dunleavy', text: 'it’s a constitutional right to vote yes or no and I think we should be given that right', source: civic(6851, 'Minutes, Nov. 18, 2014') },
      { who: 'Councilman Gabrielsen', text: 'unless a Board member or members come forth with an amended budget which I don’t see here then the Supervisor’s budget becomes the budget.', source: civic(6851, 'Minutes, Nov. 18, 2014') },
      { who: 'Supervisor Walter', text: 'I’ll stand by the budget. I’ll abstain.', source: civic(6851, 'Minutes, Nov. 18, 2014') },
    ],
    sources: [civic(6633, 'Minutes, Nov. 5, 2014 (hearing)'), civic(6851, 'Minutes, Nov. 18, 2014 (motion to vote fails)'), LOCAL_2014],
  },
  {
    year: 2016, supervisor: 'Sean Walter', party: 'R', board: ['Giglio', 'Gabrielsen', 'Wooten', 'Dunleavy'],
    hearing: '2015-11-04', timing: 'after',
    override: { date: '2015-11-17', vote: '4–1', resolution: '#783' },
    adoption: { outcome: 'vote', date: '2015-11-17', vote: '4–1', resolution: '#809' },
    summary:
      'Two weeks after Walter beat Councilwoman Giglio for Supervisor, the Board added $80,000 she had pressed for, then adopted a tax-cap override law and the budget, both 4–1 with Giglio voting no.',
    quotes: [
      { who: 'Councilman Dunleavy', text: 'this is a real bony budget, you can’t get any more meat off this budget.', source: civic(6827, 'Minutes, Nov. 17, 2015') },
    ],
    sources: [civic(6279, 'Minutes, Oct. 6, 2015 (override notice)'), civic(6608, 'Minutes, Nov. 4, 2015 (hearing)'), civic(6827, 'Minutes, Nov. 17, 2015 (override, amendment, adoption)')],
  },
  {
    year: 2017, supervisor: 'Sean Walter', party: 'R', board: ['Hubbard', 'Giglio', 'Wooten', 'Dunleavy'],
    hearing: '2016-11-01', timing: 'none',
    override: { date: '2016-11-01', vote: '4–1', resolution: '#809' },
    adoption: { outcome: 'vote', date: '2016-11-15', vote: '4–1', resolution: '#826' },
    summary: 'Unchanged. The override law and the budget each passed 4–1, Giglio voting no.',
    quotes: [
      { who: 'Councilwoman Giglio', text: 'I did make some suggestions to some Board members about some changes we should make for the budget but there didn’t seem to be consensus so I’m going to vote no for the budget.', source: civic(6776, 'Minutes, Nov. 15, 2016') },
    ],
    sources: [civic(6230, 'Minutes, Oct. 4, 2016 (hearing notice)'), civic(6557, 'Minutes, Nov. 1, 2016 (hearing and override)'), civic(6776, 'Minutes, Nov. 15, 2016 (adoption)')],
  },
  {
    year: 2018, supervisor: 'Sean Walter', party: 'R', board: ['Dunleavy', 'Wooten', 'Giglio', 'Hubbard'],
    hearing: '2017-11-08', timing: 'none',
    lameDuck: 'Walter lost to Laura Jens-Smith on Nov. 7, 2017',
    adoption: { outcome: 'vote', date: '2017-11-20', vote: '3–2', resolution: '#864' },
    summary:
      'Adopted at a special meeting on the deadline day, 3–2. Giglio objected to department-head raises; Dunleavy wanted a lower Supervisor’s salary but had no resolution. Only the Tentative is posted, so the check is fund by fund.',
    quotes: [
      { who: 'Councilman Dunleavy', text: 'I wanted to lower the Supervisors salary to a culpable to the rest of the East End and Islip Supervisors but I don’t know if I have enough votes', source: civic(8371, 'Minutes, Nov. 20, 2017', true) },
    ],
    sources: [civic(6402, 'Minutes, Oct. 17, 2017 (hearing notice)'), civic(6706, 'Minutes, Nov. 8, 2017 (hearing)'), civic(8371, 'Minutes, Nov. 20, 2017 (adoption)', true)],
  },
  {
    year: 2019, supervisor: 'Laura Jens-Smith', party: 'D', board: ['Wooten', 'Giglio', 'Hubbard', 'Kent'],
    hearing: '2018-11-07', timing: 'none', noticeSalaries: true,
    adoption: { outcome: 'no-vote', date: null, vote: null, resolution: null },
    summary:
      'Jens-Smith’s first budget. Board members questioned it at a Nov. 1 work session, and Giglio had the transcript entered into the hearing record. No resolution between the hearing and the deadline adopts the budget, and the Town titles it “2019 Final Budget.”',
    quotes: [
      { who: 'Supervisor Jens-Smith, at the work session', text: 'That was the tentative budget. No, it has not changed since', source: civic(6680, 'Minutes and packet, Nov. 7, 2018') },
      { who: 'Councilwoman Giglio, at the hearing', text: 'I want it all in there Diane, every word of it.', source: civic(6680, 'Minutes, Nov. 7, 2018') },
    ],
    sources: [civic(6374, 'Minutes, Oct. 16, 2018 (hearing notice)'), civic(6680, 'Minutes, Nov. 7, 2018 (hearing)'), civic(6902, 'Minutes, Nov. 20, 2018 (no adoption)')],
  },
  {
    year: 2020, supervisor: 'Laura Jens-Smith', party: 'D', board: ['Wooten', 'Giglio', 'Hubbard', 'Kent'],
    hearing: '2019-11-06', timing: 'after', noticeSalaries: true,
    lameDuck: 'Jens-Smith lost to Yvette Aguiar on Nov. 5, 2019',
    adoption: { outcome: 'vote', date: '2019-11-19', vote: '5–0', resolution: '#2019-844' },
    summary:
      'After Jens-Smith lost, the Board moved $105,500 from the capital projects reserve to code enforcement (5–0), dropped a $30,000 ambulance add, and rejected Kent’s move of $10,000 out of the Supervisor’s office (2–3). The book’s “Proposed Preliminary” column prints all of the proposals, including the rejected one.',
    quotes: [
      { who: 'Councilman Wooten', text: 'I just don’t know if I want to mess with the Supervisor’s office at this point.', source: civic(6874, 'Minutes, Nov. 19, 2019') },
      { who: 'Councilwoman Giglio', text: 'the town is trying to stay underneath the tax cap', source: civic(6874, 'Minutes, Nov. 19, 2019') },
    ],
    sources: [civic(6378, 'Minutes, Oct. 16, 2019 (hearing notice)'), civic(6655, 'Minutes, Nov. 6, 2019 (hearing)'), MEMO_2019, civic(6874, 'Minutes, Nov. 19, 2019 (amendments and adoption)')],
  },
  {
    year: 2021, supervisor: 'Yvette Aguiar', party: 'R', board: ['Giglio', 'Hubbard', 'Kent', 'Beyrodt'],
    hearing: '2020-11-04', timing: 'none', noticeSalaries: true,
    adoption: { outcome: 'vote', date: '2020-11-17', vote: '5–0', resolution: '#2020-605' },
    summary: 'Unchanged and adopted unanimously. The finance director told the hearing it was one of the most difficult budgets of his 25 years, given the uncertainty and lost revenue of 2020.',
    quotes: [],
    sources: [civic(6475, 'Minutes, Oct. 20, 2020 (hearing notice)'), civic(6611, 'Minutes, Nov. 4, 2020 (hearing)'), civic(6830, 'Minutes, Nov. 17, 2020 (adoption)')],
  },
  {
    year: 2022, supervisor: 'Yvette Aguiar', party: 'R', board: ['Hubbard', 'Kent', 'Beyrodt', 'Rothwell'],
    hearing: '2021-11-03', timing: 'none', noticeSalaries: true,
    adoption: { outcome: 'vote', date: '2021-11-16', vote: '5–0', resolution: '#2021-742' },
    summary: 'Unchanged and adopted unanimously; Kent moved it two weeks after losing the Supervisor race. The book prints no Preliminary column.',
    quotes: [
      { who: 'Councilman Hubbard', text: 'I want to thank the Supervisor for giving us a budget with no tax increase', source: civic(6805, 'Minutes, Nov. 16, 2021') },
    ],
    sources: [civic(6452, 'Minutes, Oct. 19, 2021 (hearing notice)'), civic(6589, 'Minutes, Nov. 3, 2021 (hearing)'), civic(6805, 'Minutes, Nov. 16, 2021 (adoption)')],
  },
  {
    year: 2023, supervisor: 'Yvette Aguiar', party: 'R', board: ['Hubbard', 'Beyrodt', 'Rothwell', 'Kern'],
    hearing: '2022-11-01', timing: 'after', noticeSalaries: true,
    override: { date: '2022-11-01', vote: '5–0', resolution: '#2022-782' },
    adoption: { outcome: 'vote', date: '2022-11-15', vote: '3–2, Supervisor no', resolution: '#2022-828' },
    summary:
      'Eight amendments, drafted by Oct. 26, were adopted right after the Nov. 1 hearing: new positions, a Town Board Coordinator raise (4–1, Aguiar no), and $150,000 of electricity for a Peconic Hockey contract. Aguiar and Rothwell voted against the result.',
    quotes: [
      { who: 'Supervisor Aguiar', text: 'I did have discussions with the Town Board members during the budget process and when I completed my process and no one made any recommendations', source: civic(6779, 'Minutes, Nov. 15, 2022') },
      { who: 'Councilman Rothwell', text: 'I think the budget should have been more discussed at work sessions.', source: civic(6779, 'Minutes, Nov. 15, 2022') },
    ],
    sources: [civic(6233, 'Minutes, Oct. 4, 2022 (hearing notices)'), civic(6564, 'Minutes, Nov. 1, 2022 (hearing, amendments, override)'), civic(6779, 'Minutes, Nov. 15, 2022 (adoption)')],
  },
  {
    year: 2024, supervisor: 'Yvette Aguiar', party: 'R', board: ['Hubbard', 'Beyrodt', 'Rothwell', 'Kern'],
    hearing: '2023-11-09', timing: 'none', noticeSalaries: false,
    lameDuck: 'Aguiar did not run; Tim Hubbard was elected Nov. 7, 2023',
    override: { date: '2023-11-15', vote: '5–0', resolution: '#2023-846' },
    adoption: { outcome: 'vote', date: '2023-11-15', vote: '5–0', resolution: '#2023-847' },
    summary:
      'Unchanged. The hearing notice was added to the override notice by a floor amendment, and from here on the notice omits the elected officials’ salaries. Override and budget passed at a six-minute special meeting.',
    quotes: [
      { who: 'Financial Administrator Rothaar, at the hearing', text: 'The tax levy increase is four point eight percent which is two point six percent above the cap.', source: civic(6720, 'Minutes, Nov. 9, 2023') },
    ],
    sources: [civic(6405, 'Minutes, Oct. 17, 2023 (combined notice)'), civic(6720, 'Minutes, Nov. 9, 2023 (hearing)'), civic(6783, 'Minutes, Nov. 15, 2023 (override and adoption)')],
  },
  {
    year: 2025, supervisor: 'Tim Hubbard', party: 'R', board: ['Rothwell', 'Kern', 'Merrifield', 'Waski'],
    hearing: '2024-11-07', timing: 'after', noticeSalaries: false,
    override: { date: '2024-11-19', vote: '5–0', resolution: '#2024-936' },
    adoption: { outcome: 'vote', date: '2024-11-19', vote: '5–0', resolution: '#2024-937' },
    summary:
      'The Preliminary raised the Supervisor’s pay 8.75% and the Board’s 7.5%, raises the hearing notice did not list. After public comment at the hearing, the Board cut both to 3.25%.',
    quotes: [
      { who: 'Resolution 2024-918', text: 'while some members of the public expressed that no salary increase should issue be it now or in the future, other members of the public favored a lesser percentage increase', source: civic(6684, 'Minutes, Nov. 7, 2024') },
    ],
    sources: [civic(6382, 'Minutes, Oct. 16, 2024 (combined notice)'), civic(6684, 'Minutes, Nov. 7, 2024 (hearing and pay trim)'), civic(6878, 'Minutes, Nov. 19, 2024 (override and adoption)')],
  },
  {
    year: 2026, supervisor: 'Tim Hubbard', party: 'R', board: ['Rothwell', 'Kern', 'Merrifield', 'Waski'],
    hearing: '2025-11-06', timing: 'none', noticeSalaries: false,
    lameDuck: 'Hubbard lost to Jerry Halpin on Nov. 4, 2025',
    override: { date: '2025-11-18', vote: '5–0', resolution: '#2025-943' },
    adoption: { outcome: 'vote', date: '2025-11-18', vote: '5–0', resolution: '#2025-944' },
    summary: 'Unchanged and adopted unanimously two weeks after Hubbard lost. RiverheadLOCAL reported that the hearing notice left out the required salaries and that its questions went unanswered.',
    quotes: [],
    sources: [civic(10248, 'Agenda packet, Oct. 7, 2025 (combined notice)'), civic(10345, 'Minutes, Nov. 6, 2025 (hearing)'), civic(10384, 'Minutes, Nov. 18, 2025 (override and adoption)'), LOCAL_NOTICE_2025],
  },
]

// --- what follows from the record -------------------------------------------

type CapStatus = { year: string; status: string; label: string }
const capStatus = (taxCapJson as unknown as { capStatus: CapStatus[] }).capStatus

export type OverrideState = 'not-applicable' | 'adopted' | 'missed' | 'none-found'

/**
 * The budgets in the current unbroken run of tax-cap override laws, oldest
 * first: the latest budget adopted with one and each year before it back to
 * the first without. Pages that name the recent overrides read it from here, so
 * they cannot disagree with the record.
 */
export const overrideStreak: number[] = (() => {
  const withOverride = new Set(RECORD.filter((r) => r.override).map((r) => r.year))
  const run: number[] = []
  for (let y = Math.max(...RECORD.filter((r) => r.override).map((r) => r.year)); withOverride.has(y); y--) run.unshift(y)
  return run
})()

/**
 * The audited record of budgets against the levy limit, which starts in 2018:
 * how many years it covers and whether every one of them was over the limit.
 */
export const overLimitRecord = (() => {
  const years = capStatus.map((c) => Number(c.year))
  return {
    from: Math.min(...years),
    to: Math.max(...years),
    count: capStatus.length,
    allOver: capStatus.every((c) => c.status.startsWith('over-')),
    withLaw: capStatus.filter((c) => c.status === 'over-with-law').length,
  }
})()

/** A count as a word in running text: "four budgets", "all nine". */
export const countWord = (n: number) =>
  ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n)

/** "2023, 2024, 2025 and 2026". */
export const yearsPhrase = (years: number[]) =>
  years.length <= 1 ? years.join('') : `${years.slice(0, -1).join(', ')} and ${years[years.length - 1]}`

/** The tax cap applies from 2012. From 2018 the audited record says whether the override step was missed. */
export function overrideState(r: YearRecord): OverrideState {
  if (r.year < 2012) return 'not-applicable'
  const audited = capStatus.find((c) => Number(c.year) === r.year)
  if (audited?.status === 'over-no-law') return 'missed'
  if (r.override || audited?.status === 'over-with-law') return 'adopted'
  return 'none-found'
}

export const OVERRIDE_LABEL: Record<OverrideState, string> = {
  'not-applicable': 'cap not yet in law',
  adopted: 'override law adopted',
  missed: 'over the limit, no override law',
  'none-found': 'no override law in the minutes',
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  vote: 'Adopted by vote',
  'no-vote': 'No adoption vote',
  'voted-down': 'Adoption voted down',
}

export const TIMING_LABEL: Record<Timing, string> = {
  before: 'before the hearing',
  'before-and-after': 'before and after the hearing',
  after: 'after the hearing',
  none: 'no changes',
}

export const counts = {
  years: RECORD.length,
  byVote: RECORD.filter((r) => r.adoption.outcome === 'vote').length,
  noVote: RECORD.filter((r) => r.adoption.outcome === 'no-vote').length,
  votedDown: RECORD.filter((r) => r.adoption.outcome === 'voted-down').length,
  changedBeforeHearing: RECORD.filter((r) => r.timing === 'before' || r.timing === 'before-and-after').map((r) => r.year),
  lastChangedBeforeHearing: Math.max(...RECORD.filter((r) => r.timing === 'before' || r.timing === 'before-and-after').map((r) => r.year)),
  supervisorVotedNo: RECORD.filter((r) => /Supervisor no/.test(r.adoption.vote ?? '')).map((r) => r.year),
}

export type Era = { from: number; to: number; title: string; text: string }

export const ERAS: Era[] = [
  {
    from: 2005, to: 2008, title: 'The sequence as the law describes it',
    text:
      'Cardinale filed lean Tentatives and the Board rebuilt them into a Preliminary before the hearing, then adopted by vote. Twice the result went through over the Supervisor’s own no.',
  },
  {
    from: 2009, to: 2019, title: 'Changes after the hearing, and budgets nobody adopted',
    text:
      'Every change moved to after the public hearing, and in six of these eleven years no adoption resolution passed. Board members described adoption as automatic, and under Town Law §109(3) it is.',
  },
  {
    from: 2020, to: 2026, title: 'Votes every year, changes still late',
    text:
      'Every budget has been adopted by vote, with an override law each year from 2023. The Board’s changes, in 2020, 2023 and 2025, all came after the hearing, and since the 2024 budget the hearing notice has left out the elected officials’ salaries.',
  },
]

export function eraStats(e: Era) {
  const rs = RECORD.filter((r) => r.year >= e.from && r.year <= e.to)
  const changed = rs.filter((r) => (netChange(r.year)?.linesChanged ?? 0) > 0 || r.timing !== 'none')
  return {
    years: rs.length,
    byVote: rs.filter((r) => r.adoption.outcome === 'vote').length,
    withoutVote: rs.filter((r) => r.adoption.outcome !== 'vote').length,
    changed: changed.length,
    net: rs.reduce((s, r) => s + (netChange(r.year)?.delta ?? 0), 0),
  }
}

export type Reason = { title: string; text: string; years: number[] }

/** Possible explanations. Each is an inference from the record, labelled as one, with the years it rests on. */
export const REASONS: Reason[] = [
  {
    title: 'Adoption was treated as automatic',
    text:
      'Town Law §109(3) makes an unadopted Preliminary the budget on Nov. 20, and with no changes the Preliminary is the Supervisor’s Tentative. Members said as much on the record, so a vote could be skipped, or cast against, at no cost.',
    years: [2011, 2015, 2019],
  },
  {
    title: 'No one had to own a tax increase',
    text:
      'The years without an adoption vote cluster in 2009–2015, when reserves were being spent down. The Nov. 18, 2014 minutes record a resident saying the $9 million reserve was now at zero, and Walter saying there had not been a structurally sound budget since 1999.',
    years: [2009, 2012, 2013, 2015],
  },
  {
    title: 'Lean Tentatives invited additions; tight ones did not',
    text:
      'Cardinale’s bare-bones Tentatives were rebuilt by the Board every year. Walter’s were described by his own Board as “bony” and as leaving nothing to give, and an all-Republican Board rarely amended them.',
    years: [2005, 2007, 2008, 2014, 2016],
  },
  {
    title: 'Divided control produces amendments',
    text:
      'The largest changes came when the Board majority overrode its Supervisor — Cardinale in 2007 and 2008, Walter in 2013, Aguiar in 2023 — or when the Supervisor was leaving, as in 2010 and 2020.',
    years: [2007, 2008, 2010, 2013, 2020, 2023],
  },
  {
    title: 'The calendar pushes changes past the hearing',
    text:
      'The Tentative arrives around Oct. 1 and the hearing notice goes out by mid-October. Since the 2009 budget, the Board has noticed the Tentative as filed and made any changes in November, after the public has spoken.',
    years: [2009, 2020, 2023, 2025],
  },
  {
    title: 'The missed override was a calculation error',
    text:
      'The auditor traced the 2018–2022 levies above the limit to a tax-cap calculation error that began in 2018, not to a decision to skip the law; members said in 2019 they were staying under the cap.',
    years: [2018, 2019, 2020, 2021, 2022],
  },
]

export const AUDIT_SOURCE = LOCAL_AUDIT_2023
export const PARTY_SOURCE = NEWS_REVIEW_2017

/** 2027, which none of the record above can yet describe. */
export const OUTLOOK = {
  year: 2027,
  supervisor: 'Jerry Halpin',
  partyLabel: 'Democratic line, not enrolled in a party',
  board: ['Rothwell', 'Kern', 'Merrifield', 'Waski'],
  calendar: [
    ['Sept 24', 'Town Clerk presents the Tentative at a special meeting', 'Town notice, Sept 2026'],
    ['Sept 30', 'Deadline to file the Tentative', 'Town Law §106(2)'],
    ['Oct 5', 'Presented to the Board, which may change it into the Preliminary', 'Town Law §106(3)–(4)'],
    ['Nov 3', 'General election: Halpin against Councilman Rothwell', ''],
    ['Nov 5', 'Last day for the public hearing on the Preliminary', 'Town Law §108'],
    ['Nov 20', 'Adopt by resolution — or the Preliminary becomes the budget', 'Town Law §109'],
  ] as [string, string, string][],
  precedents: [2007, 2008, 2009, 2019, 2020],
}

export const LIMITS: string[] = [
  'The 2005 book’s line detail and fund recap disagree on several debt-service funds, so its totals do not reconcile; both show the same Tentative-to-Preliminary change.',
  'No adopted book is posted for 2018. Its row compares the Tentative with what the 2019 book reports as the 2018 budget for the three town-wide funds.',
  'The 2006 Preliminary column prints about $2 million of bond payments as zero and its Adopted column restores them; those lines are counted apart and are not a Board decision.',
  'Whether the 2012–2015 levies were within the tax cap is not in this site’s data. The minutes for those falls record no override law.',
  'Party labels are shown only where a source gives them. None is shown for council members before 2010.',
  'A column’s label is kept as printed. The 2020 “Proposed Preliminary” column includes an amendment the Board rejected, so the record of votes comes from the minutes, not the column.',
]
