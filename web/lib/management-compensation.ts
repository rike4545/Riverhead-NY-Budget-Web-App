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
// positions, by the rate it gave the other positions paid off the union grid.
// Both actions were taken in public, unanimously, and both are in the record.
// Neither is visible from the other.
//
// WHAT THIS PAGE IS NOT. It is not an allegation that anyone acted improperly.
// Every action here was adopted in open session by a recorded vote, and the
// equity argument the resolution makes for itself is a real one. The finding is
// about visibility: the Town's published material does not let a resident see
// these two decisions together, and this page is the attempt to do that.

import {
  nyshipPlanPrimeIndividualMonthlyPremium,
  modeledEligibleHealthcarePositions,
  healthcareContributionRate,
} from './spending-reduction-2027'
import { staff as officeStaff, raise2025, deputyRate, sameRateCount } from './supervisor-office'

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
 * where a match exists. The three in the Supervisor's office are read from the
 * schedules by supervisor-office.ts, which also carries the 2025 raise the
 * January schedule does not show. The fourth does not appear in the published
 * schedule under its name, which is reported rather than filled in.
 */
const seat = (title: string) => {
  const s = officeStaff.find((x) => x.title === title)
  if (!s) throw new Error(`management-compensation: no "${title}" in the Supervisor’s Office section`)
  return s
}
const whole = (n: number | null) => (n === null ? null : Math.round(n))
const budgetOfficer = seat(raise2025.title)
const deputy = seat('Deputy Town Supervisor')
const secretary = seat('Secretary')

export const affectedPositions: NamedPosition[] = [
  {
    title: 'Chief of Staff / Town Budget Officer',
    holder: budgetOfficer.holder2026,
    salary2025: whole(budgetOfficer.salary2025),
    salary2026: whole(budgetOfficer.salary2026),
    actual2025: whole(budgetOfficer.paid2025),
    note:
      `Resolution 2025-984 names "Chief of Staff or Budget Officer" as one title. Resolution 2026-59 confirms the same person holds the Chief of Staff appointment, so the schedule line and the resolution describe one position. The 2025 schedule prints $${Math.round(budgetOfficer.schedule2025).toLocaleString('en-US')}; Resolution ${raise2025.resolution}, adopted with it on ${raise2025.adopted} at Supervisor Hubbard’s request, added ${raise2025.rate * 100}% from January 1, and the 2025 figure here includes it.`,
  },
  {
    title: 'Deputy Town Supervisor',
    holder: deputy.holder2026,
    salary2025: whole(deputy.salary2025),
    salary2026: whole(deputy.salary2026),
    actual2025: whole(deputy.paid2025),
    note: 'Appointment acknowledged by Resolution 2026-60 on January 6, 2026.',
  },
  {
    title: 'Secretary (Supervisor’s Office)',
    holder: secretary.holder2025 === secretary.holder2026 ? secretary.holder2026 : `${secretary.holder2026} (2025: ${secretary.holder2025})`,
    salary2025: whole(secretary.salary2025),
    salary2026: whole(secretary.salary2026),
    actual2025: whole(secretary.paid2025),
    note:
      'The same post appears under the Supervisor’s Office in both schedules; it changed hands at the same salary. Resolution 2026-58 acknowledges the new holder’s appointment as Legislative Aide to the Town Supervisor, and its fiscal impact statement names the post Secretary to Town Supervisor, so the schedule title and the resolution title describe one position.',
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

/**
 * The rate on both raised lines, and how many other positions paid off the
 * union grid received exactly the same in the 2026 schedules.
 */
export const scheduleRate = deputyRate
export const scheduleRateCount = sameRateCount

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
 * What a contribution is worth.
 *
 * The premium, the eligible-position count and the contribution rate come from
 * the 2027 reduction analysis by import. The first version of this file said
 * exactly that in its comment and on the page while holding its own copy of the
 * literal, so the guarantee was decorative: changing the rate over there would
 * have left this page quoting the old one, which is the drift the claim
 * promised to prevent.
 *
 * Neither total is a floor. The individual rate is the cheapest enrollment tier
 * and the resolution covers dental and vision beyond medical, so an enrolled
 * position is understated here — but a position that waives Town coverage costs
 * the Town nothing and is still counted. These are what the policy is worth at
 * full enrollment, and the Town does not publish enrollment by position.
 */
export const nyshipIndividualMonthly = nyshipPlanPrimeIndividualMonthlyPremium
const annualPremium = nyshipIndividualMonthly * 12
/** The share Resolution 2025-984 removed, restored across the titles it names. */
export const contributionRemovedByResolution984 = 0.25
export const restoring25PercentOnFour =
  annualPremium * affectedPositions.length * contributionRemovedByResolution984
export const twentyPercentAcross22 =
  annualPremium * modeledEligibleHealthcarePositions * healthcareContributionRate
export const eligiblePositionsModeled = modeledEligibleHealthcarePositions
export const contributionRateModeled = healthcareContributionRate

/**
 * The January 2023 round, now read from the Town's own minutes.
 *
 * This block used to be sourced from contemporaneous local reporting, and the
 * page said so. The minutes of January 4, 2023 are now parsed, and they correct
 * the secondhand account in three ways rather than merely confirming it.
 *
 * The count was 14 resolutions, not 11. The reported total of roughly $48,000
 * was close: the eleven that can be priced against the adopted schedule come to
 * $48,713.
 *
 * Drew Dillingham's award was a flat $7,500 (Resolution 2023-21), not the 5.5%
 * recorded here before. The dollar figure was right and the mechanism was not,
 * which matters because a percentage compounds against a base and a flat sum
 * does not.
 *
 * The 5% increase was Resolution 2023-20, and it went to Assistant Town Engineer
 * Kenneth Testa -- requested by Dillingham on his behalf. This page had
 * attributed it to Dillingham. It was also one of two awards that did not carry
 * the Board unanimously.
 *
 * The full fourteen, with mechanism and vote, are in management-salary-history.
 */
export const raises2023 = {
  date: '2023-01-04',
  count: 14,
  pricedCount: 11,
  pricedTotal: 48_713.41,
  offScheduleCount: 5,
  offScheduleTotal: 28_928.04,
  named: [
    { name: 'Jefferson Murphree', title: 'Town Building & Planning Administrator', from: 133_753.48, to: 137_766.08, mechanism: '3%', resolution: '2023-14', unanimous: true },
    { name: 'Raymond Coyne', title: 'Superintendent of Recreation', from: 114_685.18, to: 119_272.59, mechanism: '4%', resolution: '2023-15', unanimous: true },
    { name: 'Kenneth Testa', title: 'Assistant Town Engineer', from: 106_560.58, to: 111_888.61, mechanism: '5%', resolution: '2023-20', unanimous: false },
    { name: 'Drew Dillingham', title: 'Town Engineer', from: 136_163.89, to: 143_663.89, mechanism: '$7,500', resolution: '2023-21', unanimous: true },
    { name: 'Carol Sclafani', title: 'Legislative Secretary', from: 45_844.39, to: 53_344.39, mechanism: '$7,500', resolution: '2023-10', unanimous: false },
  ],
  alreadyBudgeted:
    'The Financial Administrator of the day said the increases were already carried in the 2023 adopted budget.',
  csea:
    'The CSEA agreement covering January 1, 2019 through December 31, 2022 had expired and successor negotiations were, in the union\u2019s description, far apart. The CSEA president objected publicly that members had taken low wages in good faith while management received larger amounts.',
}

export const limits = [
  'Enrollment is unknown, in both directions. The premium used here is the NYSHIP Empire Plan participating-agency INDIVIDUAL rate, the cheapest tier, so a position holding family coverage carries a materially larger premium than is modelled. But a position that waives Town coverage — on a spouse\u2019s plan, say — costs the Town nothing and is still counted here as though enrolled. The benefit figures are therefore what the policy is worth at full enrollment, not a floor: the Town publishes no enrollment by position, so neither correction can be made.',
  'The resolution covers dental and vision as well as medical. Only the medical premium is modelled, which understates the change again.',
  `Whether the 2026 salary increases are merit increases is not stated anywhere this site can read. Both were ${scheduleRate === null ? 'the same rate' : `${(scheduleRate * 100).toFixed(3)}%`}, the rate the same schedules gave ${scheduleRateCount} other positions paid off the union grid, which points to the year’s general increase rather than an award to these two. No resolution setting that rate apart from the schedules is in the records this site reads.`,
  'An earlier version of this page compared the two January schedules alone and reported the Chief of Staff’s 2026 increase as 11.0%. Most of that was Resolution 2025-64, a 7.5% raise adopted a year earlier with the 2025 schedule; measured from her salary after it, the 2026 increase was 3.3%.',
  'An earlier version of this page reported that these positions are coded to an unusual department — "Senior Citizen Programs Nutrition" in 2025, "Eisep Program" in 2026 — and invited the reader to make something of it. Neither was the Town’s coding. The 2025 schedule, read from the minutes, prints each department as a left-column label that the text extraction hoists to the foot of the page, and the parser paired each row with whichever label followed it; it filed 169 of 2025’s 349 records under a fiscal impact statement heading, so no 2025 department is published. The 2026 schedule, read from the agenda packet, prints each heading above its rows, but the parser skipped “SUPERVISOR’S OFFICE” for its typographic apostrophe and filed the office’s three staff under the heading before it. That is fixed, and the 2026 schedule’s own grouping is what places these three positions in the Supervisor’s office.',
  'The 2023 figures were previously taken from contemporaneous local reporting. They now come from the Town Board minutes of January 4, 2023, which corrected the count, one mechanism and one attribution — see the January rounds section.',
]

export const sources = [
  { title: 'TB Resolution 2025-984, Sets Health Insurance Contribution Rates for Select Positions', detail: 'Adopted December 16, 2025, unanimously.' },
  { title: '2026 salary schedule', detail: 'Town Board agenda packet, January 6, 2026 — the attachment to Resolution 2026-2, which groups the general employees by department, and the source behind this site’s authorized-salary extract.' },
  { title: '2025 salary resolutions', detail: 'Town Board minutes, January 7, 2025 (Resolution 2025-9).' },
  { title: 'TB Resolution 2025-64, Approves Salary Increase for Chief of Staff', detail: 'Adopted January 7, 2025, unanimously: 7.5% from January 1, 2025, at the Supervisor’s request, on top of the 2025 schedule.' },
  { title: 'TB Resolutions 2026-58, 2026-59 and 2026-60', detail: 'January 6, 2026 organizational meeting. Each carries a fiscal impact statement answering "yes."' },
  { title: 'Town Board minutes, January 4, 2023', detail: 'Resolutions 2023-1 through 2023-8 set the year\u2019s salary schedules; 2023-9 through 2023-22 raise fourteen individuals above them.' },
  { title: 'Town Board minutes, January 4 2022, January 3 2024 and January 7 2025', detail: 'The adopted salary schedules behind the four-year management series.' },
  { title: 'RiverheadLOCAL, January 5, 2023', detail: 'Contemporaneous reporting on the same round, and the source of the CSEA response quoted here.' },
]
