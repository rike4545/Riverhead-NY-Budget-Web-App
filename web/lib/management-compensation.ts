// Compensation for the Town's exempt and appointed positions, and the two
// different channels it travels through.
//
// WHY THIS PAGE EXISTS. Riverhead publishes a salary schedule every January,
// adopted by resolution, and a resident can read it. What the schedule cannot
// show is compensation delivered as a benefit rather than a wage — an employer
// paying more of a health premium is worth real money to the employee and costs
// the Town real money, and none of it appears on a salary line.
//
// In December 2025 the Board moved four appointed titles from paying 25% of
// their medical, dental and vision premiums to having those premiums fully
// employer paid, and gave its reason as being "in lieu of merit increases."
// Three weeks later the 2026 salary schedule raised two of those same
// positions. Both actions were taken in public, unanimously, and both are in
// the record. Neither is visible from the other.
//
// WHAT THIS PAGE IS NOT. It is not an allegation that anyone acted improperly.
// Every action here was adopted in open session by a recorded vote, and the
// equity argument the resolution makes for itself is a real one. The finding is
// about visibility: the Town's published material does not let a resident see
// these two decisions together, and this page is the attempt to do that.

export type NamedPosition = {
  title: string
  holder: string | null
  salary2025: number | null
  salary2026: number | null
  /** Actual regular pay recorded for 2025, where the schedule reports it. */
  actual2025: number | null
  note?: string
}

/**
 * The four titles Resolution 2025-984 names, matched to the salary schedule
 * where a match exists. Two of them do not appear in the published schedule
 * under these names, which is reported rather than filled in.
 */
export const affectedPositions: NamedPosition[] = [
  {
    title: 'Chief of Staff / Town Budget Officer',
    holder: 'Burkowsky, Debi',
    salary2025: 72_570,
    salary2026: 80_567,
    actual2025: 77_345,
    note:
      'Resolution 2025-984 names "Chief of Staff or Budget Officer" as one title. Resolution 2026-59 confirms the same person holds the Chief of Staff appointment, so the schedule line and the resolution describe one position.',
  },
  {
    title: 'Deputy Town Supervisor',
    holder: 'Higgins, Devon',
    salary2025: 102_180,
    salary2026: 105_527,
    actual2025: 101_623,
    note: 'Appointment acknowledged by Resolution 2026-60 on January 6, 2026.',
  },
  {
    title: 'Secretary (Supervisor’s Office)',
    holder: 'Cote, David',
    salary2025: null,
    salary2026: 59_740,
    actual2025: null,
    note:
      'New in the 2026 schedule. Resolution 2026-58 acknowledges the appointment of David Cote as Legislative Aide to the Town Supervisor and sets terms and conditions, so the schedule title and the resolution title differ.',
  },
  {
    title: 'Town Board Coordinator',
    holder: null,
    salary2025: null,
    salary2026: null,
    actual2025: null,
    note:
      'Named in Resolution 2025-984 but absent from the payroll title data published for this site. That may be an artifact of how the title is recorded rather than evidence of anything; it does mean the position’s cost cannot be read off the schedule.',
  },
]

const pctChange = (from: number, to: number) => ((to - from) / from) * 100

export const salaryMoves = affectedPositions
  .filter((p) => p.salary2025 !== null && p.salary2026 !== null)
  .map((p) => ({
    title: p.title,
    holder: p.holder as string,
    from: p.salary2025 as number,
    to: p.salary2026 as number,
    change: (p.salary2026 as number) - (p.salary2025 as number),
    pct: pctChange(p.salary2025 as number, p.salary2026 as number),
  }))
  .sort((a, b) => b.pct - a.pct)

/** The benefit change itself, in the resolution's own words. */
export const resolution984 = {
  number: '2025-984',
  title: 'Sets Health Insurance Contribution Rates for Select Positions',
  adopted: '2025-12-16',
  mover: 'Councilwoman Joann Waski',
  seconder: 'Councilman Kenneth Rothwell',
  ayes: ['Tim Hubbard', 'Kenneth Rothwell', 'Robert Kern', 'Denise Merrifield', 'Joann Waski'],
  nays: 0,
  effective: 'January 1, 2026',
  before: 'The four titles paid 25% of the cost of medical, dental and vision premiums.',
  after: 'Those premiums are 100% employer paid.',
  statedReason:
    'The resolution recites that the titles’ contribution "is not equal to that of other employees with similar management level positions," and that the Supervisor suggested the change "in lieu of merit increases" so the contribution would be "comparable to those in similar management positions where contributions are 100% employer paid."',
}

/** The appointment resolutions adopted three weeks later. */
export const appointmentResolutions = [
  { number: '2026-58', title: 'Acknowledges Appointment of David Cote (Legislative Aide to Town Supervisor) and Sets Terms and Conditions of Employment' },
  { number: '2026-59', title: 'Acknowledges Appointment of Chief of Staff (Burkowsky)' },
  { number: '2026-60', title: 'Acknowledges Appointment of Deputy Supervisor (Higgins)' },
]

/**
 * What a contribution is worth, using the same rate the site's 2027 reduction
 * analysis uses so the two pages cannot quote different numbers.
 */
export const nyshipIndividualMonthly = 1_611.46
const annualPremium = nyshipIndividualMonthly * 12
export const restoring25PercentOnFour = annualPremium * 4 * 0.25
export const twentyPercentAcross22 = annualPremium * 22 * 0.2

/** The January 2023 round, for the pattern and for the contrast with CSEA. */
export const raises2023 = {
  date: '2023-01-05',
  count: 11,
  approxTotal: 48_000,
  named: [
    { name: 'Jefferson Murphree', title: 'Building and Planning Administrator', from: 133_753.48, to: 137_766.08, pct: 3 },
    { name: 'Ray Coyne', title: 'Recreation Superintendent', from: 114_685.18, to: 119_272.59, pct: 4 },
    { name: 'Drew Dillingham', title: 'Town Engineer', from: 136_163.89, to: 143_663.89, pct: 5.5 },
  ],
  alreadyBudgeted:
    'The Financial Administrator of the day said the increases were already carried in the 2023 adopted budget.',
  csea:
    'The CSEA agreement covering January 1, 2019 through December 31, 2022 had expired and successor negotiations were, in the union’s description, far apart. The CSEA president objected publicly that members had taken low wages in good faith while management received larger amounts.',
}

export const limits = [
  'Enrolment tier is unknown. The premium figure used here is the NYSHIP Empire Plan participating-agency INDIVIDUAL rate. Any of these positions holding family coverage would carry a materially larger premium, so every benefit figure on this page is a floor rather than an estimate.',
  'The resolution covers dental and vision as well as medical. Only the medical premium is modelled, which understates the change again.',
  'Whether the 2026 salary increases are merit increases is not stated anywhere this site can read. A reclassification, added duties or a market adjustment would each explain them without contradicting the resolution, and none of those would appear in the schedule either.',
  'All three positions with a schedule line are coded to "Senior Citizen Programs Nutrition" in 2025 and "Eisep Program" in 2026. That is an unusual department for Supervisor’s-office staff. It is consistent across both years, so the year-over-year comparison is like for like, but the coding itself is not explained in the source.',
  'The 2023 figures come from contemporaneous local reporting, not from a Town document this site has parsed.',
]

export const sources = [
  { title: 'TB Resolution 2025-984, Sets Health Insurance Contribution Rates for Select Positions', detail: 'Adopted December 16, 2025, unanimously.' },
  { title: '2026 salary schedule', detail: 'Town Board agenda packet, January 6, 2026 — the source behind this site’s authorized-salary extract.' },
  { title: '2025 salary resolutions', detail: 'Town Board minutes, January 7, 2025 (Resolution 2025-9).' },
  { title: 'TB Resolutions 2026-58, 2026-59 and 2026-60', detail: 'January 6, 2026 organizational meeting. Each carries a fiscal impact statement answering "yes."' },
  { title: 'RiverheadLOCAL, January 5, 2023', detail: 'Reporting on raises for eleven salaried employees during the CSEA contract gap.' },
]
