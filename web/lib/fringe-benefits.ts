// The Town-paid deferred comp, annuity and life insurance allowance: a yearly
// sum the Town pays every elected official, and a shrinking group of appointed
// managers, on top of salary, to put toward a deferred compensation account
// (regular or Roth), a life or disability insurance policy, or an annuity.
//
// WHERE THE NUMBERS COME FROM. No budget line names the allowance, and no
// resolution in the searchable record sets the elected officials' amount. It
// shows in the Town's Gross Earnings reports: after base pay, overtime,
// longevity, holiday pay, buyouts and retroactive pay are taken out, the same
// sum to the cent is left in the pay of every elected official each year, a
// sum one and two-thirds as large in the Supervisor's, and a third sum in the
// pay of the managers whose contracts carry the clause quoted below. Each year's
// sum is the previous year's raised by New York-area inflation for the year
// before, rounded to a hundredth of a percent — the rule the contracts state.
// The managers' sum is the contracts' own: the "$4,692.59" two 2010 contracts
// give as its 2009 cost, carried forward by that rule, lands within $2.12 of
// what the payroll paid in 2018.
//
// Self-contained, with no imports, so web/scripts/verify-fringe-benefits.mjs can
// load it directly. That script recomputes every amount and count here from
// etl/data/payroll/gross-earnings-*.csv, checks each year against the BLS index
// kept in etl/data/fringe/allowance-sources.json, and checks every quoted phrase
// against the passage it comes from, kept in the same file under `excerpt`.

const civic = (fileId: number) =>
  `https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=${fileId},plainText=false)`

export const PAYROLL_SOURCE = {
  label: 'Town of Riverhead Gross Earnings reports, 2018–2025',
  url: 'https://www.townofriverheadny.gov/206/Financial-Reports',
}
export const CPI_SOURCE = {
  label: 'U.S. Bureau of Labor Statistics, CPI-U for New York-Newark-Jersey City (series CUURS12ASA0), annual averages',
  url: 'https://data.bls.gov/timeseries/CUURS12ASA0',
}

/** One year of the allowance as the payroll paid it. Counts are people paid exactly that sum. */
export type AllowanceYear = {
  year: number
  /** Each elected official other than the Supervisor. */
  elected: number
  /** The Supervisor. */
  supervisor: number
  /** Each appointed manager whose terms carry it. */
  manager: number
  /** Elected officials other than the Supervisor paid exactly `elected`. */
  electedPaid: number
  /** Managers paid exactly `manager`. */
  managersPaid: number
}

export const ALLOWANCE: AllowanceYear[] = [
  { year: 2018, elected: 4629.89, supervisor: 7716.48, manager: 5342.90, electedPaid: 12, managersPaid: 10 },
  { year: 2019, elected: 4718.32, supervisor: 7863.86, manager: 5444.95, electedPaid: 12, managersPaid: 11 },
  { year: 2020, elected: 4796.17, supervisor: 7993.61, manager: 5534.80, electedPaid: 10, managersPaid: 9 },
  { year: 2021, elected: 4878.18, supervisor: 8130.31, manager: 5629.44, electedPaid: 10, managersPaid: 9 },
  { year: 2022, elected: 5040.14, supervisor: 8400.23, manager: 5816.34, electedPaid: 9, managersPaid: 8 },
  { year: 2023, elected: 5347.59, supervisor: 8912.65, manager: 6171.13, electedPaid: 11, managersPaid: 7 },
  { year: 2024, elected: 5551.86, supervisor: 9253.11, manager: 6406.87, electedPaid: 12, managersPaid: 4 },
  { year: 2025, elected: 5762.28, supervisor: 9603.80, manager: 6649.69, electedPaid: 12, managersPaid: 5 },
]

/** New York-area CPI-U annual averages (1982–84 = 100), as BLS publishes them. */
export const NY_CPI: Record<number, number> = {
  2008: 235.782, 2009: 236.825, 2010: 240.864, 2011: 247.718, 2012: 252.588, 2013: 256.833,
  2014: 260.23, 2015: 260.558, 2016: 263.365, 2017: 268.52, 2018: 273.641, 2019: 278.164,
  2020: 282.92, 2021: 292.303, 2022: 310.141, 2023: 321.998, 2024: 334.209, 2025: 345.511,
}

/** The raise the rule gives for `year`: the prior year's New York-area inflation, rounded to 0.01%. */
export function ruleRaise(year: number): number {
  return Math.round((NY_CPI[year - 1] / NY_CPI[year - 2] - 1) * 10000) / 10000
}
const cents = (n: number) => Math.round(n * 100) / 100

export const allowanceTotal = (y: AllowanceYear) =>
  cents(y.electedPaid * y.elected + y.supervisor + y.managersPaid * y.manager)
export const LATEST = ALLOWANCE[ALLOWANCE.length - 1]
export const FIRST = ALLOWANCE[0]
export const allowanceTotalAllYears = cents(ALLOWANCE.reduce((s, y) => s + allowanceTotal(y), 0))

/** 2026 on the same rule. The Town's 2026 payroll report is not out yet. */
export const ESTIMATE_2026 = (() => {
  const raise = ruleRaise(2026)
  return {
    year: 2026,
    raise,
    elected: cents(LATEST.elected * (1 + raise)),
    supervisor: cents(LATEST.supervisor * (1 + raise)),
    manager: cents(LATEST.manager * (1 + raise)),
  }
})()

/** The contracts' 2009 figure carried forward by the rule to 2018, beside what the payroll paid. */
export const CONTRACT_2009 = 4692.59
export const contract2009Carried = (() => {
  let amount = CONTRACT_2009
  for (let year = 2010; year <= FIRST.year; year++) amount = cents(amount * (1 + ruleRaise(year)))
  return amount
})()

/** A Council Member's salary was the same in 2018 and 2024 (Gross Earnings, regular pay). */
export const COUNCIL_SALARY_FLAT = { from: 2018, to: 2024, salary: 48955 }

export type Recipient = {
  name: string
  office: string
  group: 'supervisor' | 'elected' | 'manager'
  /** The name the Gross Earnings report uses, where it differs. */
  payrollName: string
  note?: string
}

// Everyone the 2025 payroll paid a full allowance. The Town Board's own records
// name two Council Members Merrifield and Waski; the payroll report still lists
// them as Timmons and Spanburgh.
export const RECIPIENTS_2025: Recipient[] = [
  { name: 'Tim Hubbard', office: 'Supervisor', group: 'supervisor', payrollName: 'Hubbard, Timothy C' },
  { name: 'Robert Kern', office: 'Council Member', group: 'elected', payrollName: 'Kern, Robert E' },
  { name: 'Denise Merrifield', office: 'Council Member', group: 'elected', payrollName: 'Timmons, Denise M', note: 'listed in the payroll report as Denise Timmons' },
  { name: 'Kenneth Rothwell', office: 'Council Member', group: 'elected', payrollName: 'Rothwell, Kenneth T' },
  { name: 'Joann Waski', office: 'Council Member', group: 'elected', payrollName: 'Spanburgh, Joann', note: 'listed in the payroll report as Joann Spanburgh' },
  { name: 'James Wooten', office: 'Town Clerk', group: 'elected', payrollName: 'Wooten, James M' },
  { name: 'Laurie Zaneski', office: 'Receiver of Taxes', group: 'elected', payrollName: 'Zaneski, Laurie A' },
  { name: 'Michael Zaleski', office: 'Superintendent of Highways', group: 'elected', payrollName: 'Zaleski, Michael T' },
  { name: 'Lori Hulse', office: 'Town Justice', group: 'elected', payrollName: 'Hulse, Lori M' },
  { name: 'Sean Walter', office: 'Town Justice', group: 'elected', payrollName: 'Walter, Sean M' },
  { name: 'Dana Brown', office: 'Assessor', group: 'elected', payrollName: 'Brown, Dana N' },
  { name: 'Meredith Lipinsky', office: 'Assessor', group: 'elected', payrollName: 'Lipinsky, Meredith B' },
  { name: 'Laverne Tennenberg', office: 'Assessor', group: 'elected', payrollName: 'Tennenberg, Laverne' },
  { name: 'Edward Frost', office: 'Police Chief', group: 'manager', payrollName: 'Frost, Edward J' },
  { name: 'Danielle Willsey', office: 'Police Captain', group: 'manager', payrollName: 'Willsey, Danielle E' },
  { name: 'Tim Allen', office: 'Sewer District Superintendent', group: 'manager', payrollName: 'Allen, Timothy M' },
  { name: 'Raymond Coyne', office: 'Superintendent of Recreation', group: 'manager', payrollName: 'Coyne, Raymond A' },
  { name: 'Annemarie Prudenti', office: 'Deputy Town Attorney', group: 'manager', payrollName: 'Prudenti, Annemarie' },
]

export const amountFor = (r: Recipient, y: AllowanceYear = LATEST) =>
  r.group === 'supervisor' ? y.supervisor : r.group === 'elected' ? y.elected : y.manager

// WHERE IT SITS IN THE BUDGET. Paid through payroll, so it is charged to each
// office's salary ("Personal Services") line. The Town Board's line shows it:
// its 2025 actual matches the Board's payroll only with the four Council
// Members' allowances in it. Health-insurance buyouts are left out of the
// payroll side because the budget charges them to their own line (object 154).
export const TOWN_BOARD_2025 = {
  account: 'A01-1-1010-101',
  personalServicesActual: 273900.65,
  buyoutAccount: 'A01-1-1010-154',
  buyoutActual: 3300.0,
  payrollGross: 275806.94,
  payrollBuyouts: 3300.0,
  councilAllowances: 4,
}
/** The Justice Court's sick-buyback line (A01-1-1110-152), 2025 actual. */
export const JUSTICE_SICK_BUYBACK_2025 = 4511.69

export const townBoardPayrollLessBuyouts = cents(TOWN_BOARD_2025.payrollGross - TOWN_BOARD_2025.payrollBuyouts)
export const townBoardWithoutAllowance = cents(townBoardPayrollLessBuyouts - TOWN_BOARD_2025.councilAllowances * LATEST.elected)

/** A record the page quotes. `excerpt` names its entry in etl/data/fringe/allowance-sources.json. */
export type RecordSource = { label: string; url: string; excerpt: string; pages?: readonly string[] }

export type TimelineEntry = {
  date: string
  heading: string
  body: string
  quotes: readonly string[]
  source: RecordSource
}

export const TIMELINE: TimelineEntry[] = [
  {
    date: '1989',
    heading: 'It begins, under Supervisor Joseph Janoski',
    body: 'Asked in 2010 about the payments, Supervisor Sean Walter said they started as a life insurance policy or an annuity bought from one insurance company, and that under Supervisor Phil Cardinale officials were allowed to put the money into deferred compensation instead. The contracts that carry the benefit still index it from a 1989 base year.',
    quotes: [
      'it started out as an insurance or an annuity, life insurance or an annuity',
      'It started under Janoski in \'89.',
      'to put this into deferred comp so you didn\'t have to go get life insurance or an annuity policy through an insurance agent that you didn\'t use',
    ],
    source: { label: 'Town Board minutes, December 7, 2010', url: civic(7111), excerpt: 'minutes-2010-12-07' },
  },
  {
    date: 'January 5, 2010',
    heading: 'Two Supervisor’s Office appointees get the clause, with its 2009 cost',
    body: 'Resolutions 11 and 15, adopted 5–0, set terms for the Executive Assistant to the Supervisor and the Deputy Supervisor. Both offer a Universal Life policy, a disability policy or the State deferred compensation plan, and state what the Town paid for it the year before.',
    quotes: [
      'The cost of these policies to the Town for 2009 was $4,692.59.',
      'The cost will be adjusted yearly based on the Consumer Price Index for New York and Northeastern New Jersey area for all Urban Consumers',
      'The Base Year to be used will be 1989.',
    ],
    source: { label: 'Town Board agenda packet, January 5, 2010, pp. 27 and 42 (scanned; read by OCR)', url: civic(2661), excerpt: 'packet-2010-01-05', pages: ['27', '42'] },
  },
  {
    date: 'November 3, 2010',
    heading: 'A resident asks why the budget doesn’t say “annuities”',
    body: 'At the hearing on the 2011 budget, Jan McKenna said she had been told the Justice Court’s sick-pay buyback line also paid the two judges’ annuities, and estimated that about 20 employees received annuities costing about $100,000. Councilman James Wooten said he did not believe they were annuities.',
    quotes: [
      'the remainder of that portion is for the annuities for the two judges',
      'why does it not say annuities',
      'we felt there was like 20 employees that were getting annuities which seems to come to $100,000',
      'I don\'t believe that they are annuities.',
    ],
    source: { label: 'Town Board minutes, November 3, 2010', url: civic(6586), excerpt: 'minutes-2010-11-03' },
  },
  {
    date: 'December 7, 2010',
    heading: 'The Supervisor: “there’s nothing that’s been hidden”',
    body: 'A resident asked about an article by former Supervisor Vinny Villella saying that $170,000 in deferred compensation for elected officials, appointees and department heads had never been disclosed. Supervisor Walter answered “That’s not accurate,” said the payments were mostly contractual, and said the Town Board and the other elected officials receive them. He did not say what they cost.',
    quotes: [
      'Most of it is contractual.',
      'the town board does receive them',
      'the other elected officials do receive them so there\'s nothing that\'s been hidden',
    ],
    source: { label: 'Town Board minutes, December 7, 2010', url: civic(7111), excerpt: 'minutes-2010-12-07' },
  },
  {
    date: 'November 20, 2012',
    heading: 'Frozen salaries, rising annuity',
    body: 'When three Board members said they would not take a raise, resident Matt Hattorff asked whether they would take their annuity’s cost-of-living increase. Supervisor Walter agreed that a zero raise would still leave the annuity rising.',
    quotes: [
      'Are you taking your annuity?',
      'If you had a zero built into the budget, you would still get cost of living on your annuity.',
      'Yes, that\'s accurate.',
    ],
    source: { label: 'Town Board minutes, November 20, 2012 (transcript, pp. 1468–1470)', url: civic(6899), excerpt: 'minutes-2012-11-20' },
  },
  {
    date: 'June 20, 2017',
    heading: 'The Roth option opens',
    body: 'Resolution 2017-495, adopted 5–0, opted the Town into the New York State Deferred Compensation Plan’s Roth 457 program, so employees could choose an after-tax Roth account as well as the regular one.',
    quotes: [
      'Authorizes the Financial Administrator to Opt into the New York State Deferred Compensation Plan Roth 457 Program for Otherwise eligible Town Employees',
      'this is just giving the employees the option to invest in either Deferred or a Roth 457.',
    ],
    source: { label: 'Town Board minutes, June 20, 2017', url: civic(4876), excerpt: 'minutes-2017-06-20' },
  },
  {
    date: 'January 3, 2019',
    heading: 'Extended to the Chief of Staff',
    body: 'Resolution 2019-37, adopted 4–0, gave the Supervisor’s Chief of Staff the benefit “to make his salary commensurate with the previous staff member.” Its fiscal impact statement says there is a fiscal impact, absorbed in the existing budget, and gives no amount. The payroll pays the managers’ sum in 2019, but not 2018, to John Marafino, whom the Board appointed Executive Assistant to the Supervisor in January 2018.',
    quotes: [
      'RESOLVED, that the deferred comp., annuity, life insurance benefit be extended to the chief of staff',
      'to make his salary commensurate with the previous staff member',
      'To provide the Chief of Staff with deferred comp., annuity and life insurance benefit',
    ],
    source: { label: 'Town Board minutes, January 3, 2019', url: civic(2591), excerpt: 'minutes-2019-01-03' },
  },
  {
    date: 'December 5, 2023',
    heading: 'The Police Chief’s contract states the base: $2,500 in 1989',
    body: 'Resolution 2023-893, adopted 5–0, approved the Police Chief’s contract.',
    quotes: [
      'The cost of these policies to the Town may not exceed $2,500.00.',
      'The cost will be adjusted annually based on the Consumer Price Index for New York and Northeastern New Jersey area for all Urban Consumers',
      'The Base Year to be used will be 1989.',
    ],
    source: { label: 'Town Board minutes, December 5, 2023', url: civic(7071), excerpt: 'minutes-2023-12-05' },
  },
  {
    date: 'April 1, 2025',
    heading: 'The Sewer District Superintendent’s contract adds the annuity option',
    body: 'Resolution 2025-294, adopted 5–0, set the terms of Sewer District Superintendent Tim Allen. His contract lets the Town pay into an insurance policy, annuity or deferred compensation plan of his choice.',
    quotes: [
      'have the Town contribute to an independent life insurance policy, disability insurance policy, annuity or deferred compensation program of the employee’s choice',
    ],
    source: { label: 'Town Board minutes, April 1, 2025', url: civic(3750), excerpt: 'minutes-2025-04-01' },
  },
]

// JULY 2026. The draft contract for the new Recreation Superintendent in the
// July 16 work session packet carried the clause as its item 6. The contract
// attached to Resolution 2026-695 as adopted on July 21 goes from item 5 to
// Article IX without it.
export const RECREATION_2026 = {
  resolution: '2026-695',
  adoptedOn: 'July 21, 2026',
  vote: '5–0',
  ayes: ['Halpin', 'Rothwell', 'Kern', 'Merrifield', 'Waski'],
  appointee: 'Ashley Schandel',
  office: 'Recreation Superintendent',
  draftSource: { label: 'Town Board work session packet, July 16, 2026', url: civic(12122), excerpt: 'packet-2026-07-16' },
  draftQuote: 'have the Town contribute to an independent life insurance policy, disability insurance policy, annuity or deferred compensation program of the employee’s choice',
  adoptedSource: { label: 'Town Board agenda packet, July 21, 2026 (Resolution 2026-695 as adopted)', url: civic(12150), excerpt: 'packet-2026-07-21' },
}

export const QUESTIONS: string[] = [
  'Which resolution sets the elected officials’ allowance, and why is the Supervisor’s one and two-thirds times the others’? This site has not found one in the Town’s online records.',
  'Why is the allowance not a line of its own in the budget, so that residents can see what it costs? Today it is folded into each office’s salary line.',
  'The Board left the benefit out of the newest department head’s contract in July 2026. Is it closed to new hires? Will it end for elected officials, who have no contracts, and if so, by what vote?',
  'Where does the money go? The payroll report shows each payment but not whether it went to a Roth or regular deferred comp account, an insurance policy or an annuity.',
]

export const LIMITS: string[] = [
  'The counts are people whose payroll shows exactly the year’s sum. Someone who joined or left during a year, or whose allowance was paid together with other pay, is not counted, so each total is a floor. In 2024, for example, the Police Chief, the Chief Accountant and a Police Captain retired with large final payments that make their allowance impossible to separate.',
  'The payroll data this site keeps does not carry the Town’s pay-code names. The allowance is identified by its amount: the same sum, to the cent, paid to a dozen or more people each year, growing by the rule the contracts state to within a cent.',
  'The Town’s 2026 payroll report has not been published. The 2026 figures are the rule applied to BLS’s 2025 index.',
  'Whatever each person chooses, the Town’s report counts the payment in gross pay.',
]
