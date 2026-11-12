// The Downtown Riverhead Pattern Book, for /pattern-book/.
//
// The book's own standards are quoted from the adopted PDF (Urban Design
// Associates, January 2021); the pages quoted are kept in
// etl/data/pattern-book/downtown-pattern-book-2021-excerpt.txt, and
// scripts/verify-pattern-book.mjs checks every quote against it. The Board's
// votes come from its minutes and the meeting data; the 2024 Comprehensive Plan
// from public/data/comprehensive-plan.json. What Board members and others said
// in debate is from news reports, each labelled as such.
//
// No imports, so the verify script can load this file directly.

export const BOOK = {
  title: 'Downtown Riverhead Pattern Book',
  author: 'Urban Design Associates',
  date: 'January 2021',
  adopted: 'January 20, 2021',
  url: 'https://www.townofriverheadny.gov/356/Final-Pattern-Book-2021-PDF',
}

/** The book's words, by printed page. Each must appear in the kept excerpt. */
export const QUOTES = {
  proposal: { page: 62, text: 'This document proposes four stories but with 100% lot coverage with a slight stepback on the fourth story.' },
  sameFloorArea: { page: 62, text: 'this maintains approximately the same permitted developable square footage for any lot.' },
  height: { page: 63, text: '4 stories or 50\' maximum' },
  greenRoof: { page: 63, text: '40% minimum of the lot area' },
  zne: { page: 63, text: 'Meeting ZNE standards is strongly encouraged, including the use of solar panels.' },
  economics: { page: 5, text: 'between four and five stories, a height required for developers to recoup their investment on the cost of construction and land values.' },
  current: { page: 24, text: 'Current DC-1 zoning permits 5-story buildings with up to 80% lot coverage' },
}

/** Today's Main Street (DC-1) zoning beside the book, from the book's own pages 24, 62 and 63. */
export const COMPARE = [
  { rule: 'Height', now: 'Five stories (60 feet)', book: 'Four stories or 50 feet, stepped back above the third' },
  { rule: 'Lot coverage', now: '80%, or up to 100% by application', book: 'Up to 100%' },
  { rule: 'Green roof', now: 'None required', book: 'At least 40% of the lot' },
  { rule: 'Energy', now: 'None required', book: 'Zero net energy strongly encouraged' },
]

export type NewsKey = keyof typeof NEWS
export const NEWS = {
  hearing2022: { title: 'RiverheadLOCAL, May 5, 2022: “Vocal residents ask board to adopt pattern book code”', url: 'https://riverheadlocal.com/2022/05/05/vocal-residents-ask-board-to-adopt-pattern-book-code-new-parking-code-needs-more-work-committee-members-say/' },
  hold2022: { title: 'RiverheadLOCAL, May 13, 2022: “Downtown pattern book code amendments put on hold after business committee raises objections”', url: 'https://riverheadlocal.com/2022/05/13/downtown-pattern-book-code-amendments-put-on-hold-after-business-committee-raises-objections/' },
  balk2023: { title: 'RiverheadLOCAL, March 16, 2023: “Town officials balk at moving away from pattern book recommendations”', url: 'https://riverheadlocal.com/2023/03/16/town-officials-balk-at-moving-away-from-pattern-book-recommendations/' },
  board2024: { title: 'RiverheadLOCAL, July 2, 2024: “What’s next for downtown Riverhead? Town Board members say condos and more 5-story buildings”', url: 'https://riverheadlocal.com/2024/07/02/whats-next-for-downtown-riverhead-town-board-members-say-condos-and-more-5-story-buildings/' },
  survey2020: { title: 'Riverhead News-Review, October 2020: “Pattern book survey recommends limiting downtown buildings to four stories”', url: 'https://riverheadnewsreview.timesreview.com/2020/10/102450/pattern-book-survey-recommends-limiting-downtown-buildings-to-four-stories/' },
  vue2025: { title: 'RiverheadLOCAL, December 30, 2025: “Riverhead secures more than $4M in state grants for downtown projects”', url: 'https://riverheadlocal.com/2025/12/30/riverhead-secures-more-than-4m-in-state-grants-for-downtown-projects/' },
  taxcap2026: { title: 'RiverheadLOCAL, October 6, 2026: “Suffolk supervisors seek changes to state property tax cap as costs rise”', url: 'https://riverheadlocal.com/2026/10/06/suffolk-supervisors-seek-changes-to-state-property-tax-cap-as-costs-rise/' },
  hotel2026: { title: 'RiverheadLOCAL, June 11, 2026: “Peconic River Hotel plan draws support, questions and opposition at hearing”', url: 'https://riverheadlocal.com/2026/06/11/peconic-river-hotel-plan-hearing/' },
} satisfies Record<string, { title: string; url: string }>

/** What has happened to the book since it was adopted. */
export const TIMELINE: { when: string; what: string; source: string; news?: NewsKey[] }[] = [
  { when: 'January 20, 2021', what: 'The Town Board adopts the Pattern Book as a planning guide, after a study that cost about $175,000. It is not part of the zoning code.', source: 'news', news: ['balk2023'] },
  { when: 'May 2022', what: 'A hearing on a law to write the book into the Main Street (DC-1) zoning: four stories or 50 feet instead of five stories or 60 feet, a 40% green roof and required design elements. Residents, the Chamber of Commerce and the Downtown Revitalization Committee spoke for it; an architect on the Town’s parking committee called the design rules “subjective”. The law was put on hold after the Business Advisory Committee objected.', source: 'news', news: ['hearing2022', 'hold2022'] },
  { when: 'March 2023', what: 'The Business Advisory Committee brings a marked-up version to the Board. Officials decline to move away from the book and send the committee back to work with the Downtown Revitalization Committee and staff. No revised law followed.', source: 'news', news: ['balk2023'] },
  { when: 'July 2024', what: 'Discussing the draft Comprehensive Plan, Board members say they want to keep five-story buildings downtown and to treat the book as a “guiding document” rather than code. A Town planner says that without codification it is “almost useless”.', source: 'news', news: ['board2024'] },
  { when: 'September 4, 2024', what: 'The Board unanimously adopts the Comprehensive Plan Update (Resolution 2024-760), which says “It is recommended that the Pattern Book be formally included in the zoning code, so it is required to be considered during the site plan approval process by developers, land use boards, the Town Board, and Town staff.” This site has found no Board action on that since.', source: 'Resolution 2024-760; 2024 Comprehensive Plan Update, page 196' },
  { when: 'March 17, 2026', what: 'Supervisor Halpin abstains on Resolution 2026-257, preliminary site plan approval for the Zenith building addition at 301 East Main Street, which passes 4–0. In the meeting’s machine transcript he says the Pattern Book asked the Town not to go to a fifth floor.', source: 'Minutes of March 17, 2026; machine transcript (may mishear words)' },
  { when: 'August 4, 2026', what: 'The Board approves the five-story Peconic River Hotel at 117–127 East Main Street, 5–0 (Resolution 2026-746). The Town’s environmental review had required projects to follow the Pattern Book, and the developer’s analysis said the hotel does, with its upper stories set back from Main Street.', source: 'Resolution 2026-746; Resolution 2025-263 (March 18, 2025 packet); June 2026 agenda packet' },
]
