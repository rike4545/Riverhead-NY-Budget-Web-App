// /records/: records this site has looked for and not found published, each
// with a Freedom of Information Law (FOIL) request a resident can send, and the
// deadlines that apply. Modelled on the New York Coalition for Open Government's
// FOIL toolkit (nyopengov.org/foil-toolkit/): the letter is built in the
// browser and nothing typed into the page is sent anywhere.
//
// No JSON imports, so scripts/verify-records.mjs can load this file directly.

export type Source = { label: string; url: string }

/** How Riverhead takes requests, from its 2023 Public Access to Records Policy. */
export const TOWN_FOIL = {
  policy: {
    label: 'Town of Riverhead, 2023 Public Access to Records Policy (updated September 27, 2023)',
    url: 'https://www.townofriverheadny.gov/337/FOIL-Freedom-of-Information-Law',
  },
  submitTo: 'Town Clerk’s Office, 4 West Second Street, Riverhead, New York 11901',
  /** §5(A), as the policy words it. */
  online: 'Applicants are strongly encouraged to request records via the Online FOIL Submission Form',
  onlineWhere: 'the “F.O.I.L. Electronic Request” link on the Town’s home page',
  homepage: 'https://www.townofriverheadny.gov',
  hours: '9:00 a.m. to 4:00 p.m., Monday to Friday, excluding holidays',
  /** §7(C): the appeals officer, by title. The policy names the 2023 holder; the page uses the title. */
  appealsTo: 'the Town Attorney, as FOIL Records Appeals Officer, 4 West Second Street, Riverhead, New York 11901',
  /** §7(F), as the policy words it. */
  appealDaysInPolicy: 15,
  appealPolicyText: 'A failure to determine an appeal within fifteen business days of its receipt',
  copyFee: 'twenty-five (.25) cents per page',
  noFee: 'There shall be no fee charged for',
} as const

/** The statute, quoted from the New York State Senate's text. */
export const LAW = {
  respond: {
    cite: 'Public Officers Law §89(3)(a)',
    quote: 'within five business days of the receipt of a written request for a record reasonably described',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  outer: {
    cite: 'Public Officers Law §89(3)(a)',
    quote: 'within twenty business days from the date of the acknowledgement of the receipt of the request',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  email: {
    cite: 'Public Officers Law §89(3)(b)',
    quote: 'accept requests for records submitted in the form of electronic mail',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  appeal: {
    cite: 'Public Officers Law §89(4)(a)',
    quote: 'within thirty days appeal in writing such denial to the head, chief executive or governing body of the entity',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  appealDecision: {
    cite: 'Public Officers Law §89(4)(a)',
    quote: 'shall within ten business days of the receipt of such appeal fully explain in writing',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  deemedDenial: {
    cite: 'Public Officers Law §89(4)(a)',
    quote: 'Failure by an agency to conform to the provisions of subdivision three of this section shall constitute a denial.',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
  },
  holidays: {
    cite: 'General Construction Law §24',
    url: 'https://www.nysenate.gov/legislation/laws/GCN/24',
  },
} as const

export const DEADLINE_DAYS = { respond: 5, outer: 20, appealCalendar: 30, appealDecision: 10 } as const

export type RecordRequest = {
  id: string
  title: string
  /** Why the site is asking: what it found missing, and where. */
  why: string
  /** The words that go in the letter: the record, reasonably described. */
  describe: string
  /** The department whose records access officer would hold it, per the Town's policy. */
  department: string
  page?: { label: string; href: string }
  sources: Source[]
}

export const RECORD_REQUESTS: RecordRequest[] = [
  {
    id: 'fund-balance-107',
    title: 'The 2027 fund balance breakdown',
    why: 'Town Law §107 requires the preliminary budget to show each fund’s estimated balance with a breakdown, and the balance left after the budget “shall not exceed a reasonable amount.” The 2027 Tentative’s fund balance page lists the General Fund at $33,303,051 at the end of 2026, the same as the audited balance a year earlier, and has no column for the balance left after the 2027 budget.',
    describe: 'The statement of estimated fund balances prepared for the 2027 Preliminary Budget under Town Law §107, showing for each fund the estimated balance at December 31, 2026, the amounts encumbered, reserved and appropriated for 2027, and the estimated unappropriated unreserved balance remaining, together with any worksheet the Accounting Department used to prepare it.',
    department: 'Accounting',
    page: { label: 'Reserves and fund balance', href: '/reserves/' },
    sources: [
      { label: 'Town Law §107', url: 'https://www.nysenate.gov/legislation/laws/TWN/107' },
      { label: 'Town of Riverhead, 2027 Tentative Budget, Fund Balances', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3928/2027-Tentative-Budget-PDF' },
    ],
  },
  {
    id: 'single-audit-2025',
    title: 'The 2025 federal single audit and corrective action plan',
    why: 'RiverheadLOCAL reported on September 24, 2026 that the auditors found failures in the Town’s handling of a $3.575 million EPA grant. The report on federal awards that carries such findings, and the Town’s plan to correct them, are separate from the financial statements the Board accepted on September 1. This site has not found them posted.',
    describe: 'The Town’s single audit report on federal awards for the fiscal year ended December 31, 2025, including the schedule of expenditures of federal awards, the schedule of findings and questioned costs, and the Town’s corrective action plan responding to those findings.',
    department: 'Accounting',
    page: { label: 'Annual report', href: '/annual-report/' },
    sources: [
      { label: 'RiverheadLOCAL, September 24, 2026: Riverhead audit flags failures handling $3.57M EPA grant', url: 'https://riverheadlocal.com/2026/09/24/riverhead-audit-epa-water-grant-failures/' },
    ],
  },
  {
    id: 'payroll-record',
    title: 'The current payroll record',
    why: 'Every agency must keep “a record setting forth the name, public office address, title and salary of every officer or employee of the agency” (Public Officers Law §87(3)(b)). This site’s payroll runs through 2025, and some Board resolutions name employees only by payroll file number, which a current record would let residents match.',
    describe: 'The record required by Public Officers Law §87(3)(b) setting forth the name, public office address, title and salary of every officer or employee of the Town, as of the date of this request, including each employee’s payroll file number where the Town’s payroll system records it.',
    department: 'Personnel',
    page: { label: 'Payroll explorer', href: '/payroll/' },
    sources: [{ label: 'Public Officers Law §87', url: 'https://www.nysenate.gov/legislation/laws/PBO/87' }],
  },
  {
    id: 'subject-matter-list',
    title: 'The subject matter list and records retention schedule',
    why: 'Every agency must keep a “reasonably detailed current list by subject matter” of all its records (Public Officers Law §87(3)(c)), and the Town’s own policy requires it to be updated each year. With it, a resident can ask for a record by name. This site has not found it posted.',
    describe: 'The Town’s current subject matter list of records maintained under Public Officers Law §87(3)(c), showing the date of its most recent update, and the Town Board resolution adopting the records retention and disposition schedule the Town follows.',
    department: 'Town Clerk',
    sources: [
      { label: 'Public Officers Law §87', url: 'https://www.nysenate.gov/legislation/laws/PBO/87' },
      { label: 'Town of Riverhead, 2023 Public Access to Records Policy, §6', url: 'https://www.townofriverheadny.gov/337/FOIL-Freedom-of-Information-Law' },
    ],
  },
]

// ── Business days ─────────────────────────────────────────────────────────────
// FOIL counts business days. These are the State's public holidays under
// General Construction Law §24; a holiday on a Sunday moves to Monday (Flag Day,
// on a Sunday by definition, is not a weekday holiday). The Town may close on
// other days too, so the page tells readers to allow a day of margin.

const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const weekday = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay()
/** The nth given weekday (0 = Sunday) of a month; n = -1 for the last. */
function nth(y: number, m: number, dow: number, n: number): number {
  if (n > 0) return 1 + ((dow - weekday(y, m, 1) + 7) % 7) + (n - 1) * 7
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return last - ((weekday(y, m, last) - dow + 7) % 7)
}

export function nyHolidays(y: number): Map<string, string> {
  const fixed: [number, number, string][] = [
    [1, 1, 'New Year’s Day'], [2, 12, 'Lincoln’s Birthday'], [6, 19, 'Juneteenth'], [7, 4, 'Independence Day'],
    [11, 11, 'Veterans’ Day'], [12, 25, 'Christmas Day'],
  ]
  const h = new Map<string, string>()
  for (const [m, d, name] of fixed) {
    const sunday = weekday(y, m, d) === 0
    h.set(sunday ? ymd(y, m, d + 1) : ymd(y, m, d), name)
  }
  h.set(ymd(y, 1, nth(y, 1, 1, 3)), 'Martin Luther King, Jr. Day')
  h.set(ymd(y, 2, nth(y, 2, 1, 3)), 'Washington’s Birthday')
  h.set(ymd(y, 5, nth(y, 5, 1, -1)), 'Memorial Day')
  h.set(ymd(y, 9, nth(y, 9, 1, 1)), 'Labor Day')
  h.set(ymd(y, 10, nth(y, 10, 1, 2)), 'Columbus Day')
  // General election day: the Tuesday after the first Monday in November.
  h.set(ymd(y, 11, nth(y, 11, 1, 1) + 1), 'General Election Day')
  h.set(ymd(y, 11, nth(y, 11, 4, 4)), 'Thanksgiving Day')
  return h
}

export function isBusinessDay(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = weekday(y, m, d)
  return dow !== 0 && dow !== 6 && !nyHolidays(y).has(iso)
}

/** The date n business days after `iso`, not counting `iso` itself. */
export function addBusinessDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  let left = n
  while (left > 0) {
    t.setUTCDate(t.getUTCDate() + 1)
    if (isBusinessDay(t.toISOString().slice(0, 10))) left -= 1
  }
  return t.toISOString().slice(0, 10)
}

export function addCalendarDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// ── The letter ────────────────────────────────────────────────────────────────

export type LetterFields = { name: string; email: string; address: string; date: string }

export function buildLetter(selected: RecordRequest[], custom: string, f: LetterFields): string {
  const items = [...selected.map((r) => r.describe), ...(custom.trim() ? [custom.trim()] : [])]
  const lines = [
    f.date || '[Date]',
    '',
    'Records Access Officer',
    'Town of Riverhead, Town Clerk’s Office',
    '4 West Second Street',
    'Riverhead, New York 11901',
    '',
    'Re: Freedom of Information Law request',
    '',
    'Dear Records Access Officer:',
    '',
    'Under the Freedom of Information Law (Public Officers Law, Article 6), I request copies of the following records:',
    '',
    ...items.map((t, i) => `${i + 1}. ${t}`),
    '',
    'Please provide the records electronically, by email, where they exist in electronic form. If any record is already posted online, a link is sufficient.',
    '',
    `As Public Officers Law §89(3)(a) provides, please respond within five business days of receipt, either by providing the records, denying the request in writing, or acknowledging it with an approximate date when it will be granted or denied.`,
    '',
    'If any part of this request is denied, please cite the specific exemption relied on, release any reasonably segregable portions, and identify the person or body to whom an appeal may be directed.',
    '',
    'If copying fees will exceed $25, please tell me before the copies are made.',
    '',
    'Thank you.',
    '',
    'Sincerely,',
    '',
    f.name || '[Your name]',
    ...(f.address ? [f.address] : []),
    f.email || '[Email address]',
  ]
  return lines.join('\n')
}
