// The Suffolk town supervisors' October 2026 tax-cap letter, set beside what
// Riverhead's own records show.
//
// The letter itself has not been published. What it asks comes from the two
// public accounts of it: RiverheadLOCAL's report of the October 5 press
// conference, and the Suffolk County Supervisors Association's statement as
// Long Island Life & Politics printed it. Quotes are exact, from those pages.
//
// Riverhead's figures come from the libraries that already carry them, each
// traced to the Town's budgets, audits and minutes. The five benefit lines and
// the refuse district's revenue line are read here from the 2027 Tentative and
// checked against its text by scripts/verify-tax-cap-letter.mjs, so a misread
// figure fails the build.

export const ARTICLE = {
  title: 'Suffolk supervisors seek changes to state property tax cap as costs rise',
  outlet: 'RiverheadLOCAL',
  author: 'Denise Civiletti',
  date: 'October 6, 2026',
  url: 'https://riverheadlocal.com/2026/10/06/suffolk-supervisors-seek-changes-to-state-property-tax-cap-as-costs-rise/',
}

export const SCSA_STATEMENT = {
  title: 'Town Officials Address Property Tax Cap, Unfunded Mandates',
  outlet: 'Long Island Life & Politics',
  url: 'https://lilifepolitics.com/news/politics/town-officials-address-property-tax-cap-unfunded-mandates/',
}

export const PATCH_REPORT = {
  title: 'Suffolk Supervisors Call For Albany To Address Unfunded Mandates And Property Tax Pressures',
  outlet: 'Patch',
  url: 'https://patch.com/new-york/sachem/suffolk-supervisors-call-albany-address-unfunded-mandates-property-tax-pressures',
}

/** What the letter asks, in the words of the two accounts of it. */
export const ASKS = [
  {
    text: 'the supervisors of six of the county’s 10 towns signed a letter to Gov. Kathy Hochul and state lawmakers, asking them to reconsider how the property tax cap treats expenses such as waste disposal, health insurance and pension costs, and to consider adjustments for inflation.',
    source: ARTICLE,
  },
  {
    text: 'The SCSA’s joint letter calls for a constructive meeting with the governor’s office and state lawmakers to discuss potential adjustments to the tax-cap formula and greater flexibility for extraordinary or externally imposed expenses, essential infrastructure and other costs municipalities are legally required to absorb.',
    source: SCSA_STATEMENT,
  },
  {
    text: 'The supervisors also renewed local officials’ longstanding complaints about unfunded state mandates, calling on lawmakers to provide funding for new requirements imposed on municipalities by Albany.',
    source: ARTICLE,
  },
] as const

/** Riverhead's Supervisor at the press conference, as RiverheadLOCAL reported him. */
export const HALPIN = {
  /** RiverheadLOCAL's words, after "Riverhead Supervisor Jerry Halpin". */
  summary: 'highlighted the contradiction between being asked to be a “pro-housing community” without being given the tools to deliver the services needed to sustain it.',
  quote: 'We’re just asking Albany to help us to continue that conversation, to sit down with us and figure this out.',
}

/** The two ways the accounts quote Huntington's Supervisor on the 2% figure. */
export const SMYTH = {
  impossible: 'it is impossible to maintain parks, beaches, roads, and garbage collection, along with other life-saving services, without exceeding the 2% tax cap this year',
  adjust: 'we hope the state will adjust the arbitrary 2% tax cap to establish a formula that recognizes economic reality',
  abandon: 'We hope the State will abandon the arbitrary 2% tax cap and establish a formula that recognizes economic reality.',
}

/** The test the supervisors' own statement sets for "piercing the tax cap". */
export const OWN_TEST =
  'residents deserve to know not simply whether a municipality exceeds a particular tax-cap number, but why costs increased, which expenses were locally discretionary, which were externally imposed and what authority local officials actually had to control them.'

/** What state officials said back, as RiverheadLOCAL reported it. */
export const RESPONSES = [
  { who: 'Gordon Tepper, the Governor’s Long Island press secretary', text: 'Elected officials across the state should be looking for ways to control costs, not asking homeowners to pay more.' },
  { who: 'State Sen. Anthony Palumbo', text: 'If local governments need to pierce the cap, then they can put it to a vote and let the taxpayers decide.' },
  { who: 'Assembly Member Jodi Giglio, whose district includes Riverhead', text: 'If supervisors and mayors can show they are only increasing it to cover unfunded state mandates, then maybe something can be done.' },
] as const

/** Other towns' figures, as the supervisors gave them at the press conference. Not checked here. */
export const OTHER_TOWNS = [
  'Smithtown’s Supervisor said the cap lets his town raise taxes by $1.6 million in 2027, and that fixed costs already put the increase about $1.2 million over that.',
  'Islip’s Supervisor said a new garbage contract cost her town $6 million more than the last one.',
  'Brookhaven’s Supervisor said waste disposal is “going to be the single largest expense”: the Brookhaven ashfill is expected to close in 2028, with no settled plan for the ash after that.',
] as const

/** The State's own figures for 2027. */
export const STATE = {
  growthFactor: {
    inflationPct: 3.13,
    capPct: 2,
    consecutiveYears: 'For the sixth consecutive year, the allowable tax levy growth will be limited to 2%',
    date: 'July 15, 2026',
    url: 'https://www.osc.ny.gov/press/releases/2026/07/dinapoli-tax-cap-remains-2-percent-2027',
  },
  pensions2026_27: {
    quote: 'Employers’ average contribution rates will increase from 16.5% to 17.6% of payroll for the Employees’ Retirement System (ERS) and from 33.7% to 36.5% of payroll for the Police and Fire Retirement System (PFRS).',
    date: 'September 4, 2025',
    url: 'https://www.osc.ny.gov/press/releases/2025/09/nyslrs-announces-employer-contribution-rates-sfy-2026-27',
  },
  pensions2027_28: {
    ers: { from: 17.6, to: 17.3 },
    pfrs: { from: 36.5, to: 37.4 },
    drivers: 'higher salaries, plan options selected by employers, recent legislative reforms to Tiers 5 and 6 and member retirement rates',
    date: 'September 8, 2026',
    url: 'https://www.osc.ny.gov/press/releases/2026/09/nyslrs-announces-employer-contribution-rates-sfy-2027-28',
  },
  /** RiverheadLOCAL, summarising the Comptroller's list for 2027 town budgets. */
  pensionExclusion2027: 'For 2027 town budgets, the state comptroller lists no exclusion for the Employees’ Retirement System. It lists a 0.8% payroll exclusion for Police and Fire Retirement System payments made in February, but none for those made in December.',
}

export const LAW = {
  gml3c: { label: 'General Municipal Law §3-c', url: 'https://www.nysenate.gov/legislation/laws/GMU/3-C' },
  growthFactor: '“Allowable levy growth factor” shall be the lesser of: (i) one and two one-hundredths; or (ii) the sum of one plus the inflation factor; provided, however, that in no case shall the levy growth factor be less than one.',
  townLaw109: { label: 'Town Law §109', url: 'https://www.nysenate.gov/legislation/laws/TWN/109', text: 'shall be finally adopted by resolution of the town board not later than the twentieth day of November' },
  constitution: { label: 'State Constitution, Article XIII, §4', url: 'https://www.nysenate.gov/legislation/laws/CNS/A13S4', text: 'the legislature shall, every year, assemble on the first Wednesday after the first Monday in January' },
}

export const TENTATIVE_2027 = {
  title: '2027 Tentative Budget (PDF)',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3973/2027-Tentative-Budget-PDF',
}

/**
 * The General Fund's pension and health-insurance lines, 2026 adopted against
 * the 2027 Tentative, as printed on PDF page 25 of the Tentative. Health
 * insurance buy-backs (object 154, paid to employees who decline coverage) are
 * not included.
 */
export const BENEFIT_LINES_2027 = [
  { account: 'A01-9-9010-801-NON-00000', label: 'Retirement, civilian staff (ERS)', adopted2026: 2_268_352, tentative2027: 2_408_623 },
  { account: 'A01-9-9015-801-UNI-00000', label: 'Retirement, police (PFRS)', adopted2026: 6_633_131, tentative2027: 6_994_740 },
  { account: 'A01-9-9060-810-NON-00000', label: 'Hospital, dental and optical insurance, civilian staff', adopted2026: 5_503_333, tentative2027: 5_934_259 },
  { account: 'A01-9-9065-810-NON-00000', label: 'Hospital, dental and optical insurance, civilian staff (second line)', adopted2026: 629_046, tentative2027: 685_332 },
  { account: 'A01-9-9065-810-UNI-00000', label: 'Hospital, dental and optical insurance, police', adopted2026: 3_971_332, tentative2027: 4_455_641 },
] as const
export const BENEFIT_LINES_PAGE = 25

export const benefitGrowth2027 = BENEFIT_LINES_2027.reduce((s, l) => s + (l.tentative2027 - l.adopted2026), 0)

/** The Refuse and Garbage District's only revenue line, PDF page 66 of the Tentative. */
export const REFUSE_2027 = { account: 'SR1-1001-001-00000-A', label: 'Property Taxes', adopted2026: 5_254_540, tentative2027: 5_302_990, page: 66 }

/** What a proposal would need for a resident, or a legislator, to judge it. */
export const COMPLETE_PROPOSAL = [
  { item: 'A formula', text: 'the growth factor or exclusion it wants, written so the Comptroller could calculate it, and what it would have allowed in each of the last few years.' },
  { item: 'Each town’s numbers', text: 'its levy limit, the costs it says are above it, and how much of each cost it sets itself, such as salaries, staffing and the share of health premiums employees pay.' },
  { item: 'Reserves and results', text: 'each town’s unassigned fund balance against its own policy, and whether recent budgets ended in surplus or deficit.' },
  { item: 'Why the override is not enough', text: 'towns can already go above the limit with a 60% vote of the board. A change to the formula would let levies rise without that recorded vote.' },
  { item: 'The effect on a tax bill', text: 'what the change would add to a typical homeowner’s bill, town by town.' },
  { item: 'The mandates, priced', text: 'which state requirements cost what, so Albany can fund them or end them, which is the test the local Assembly Member set.' },
] as const

/** Questions a resident could put to the Town Board. */
export const QUESTIONS = [
  'Of the increases in the 2027 Tentative, which does the Town count as imposed by the State, and which are its own decisions?',
  'In dollars, what would the formula the supervisors want have added to Riverhead’s 2027 levy limit?',
  'Will the Town publish its tax-cap filing, the calculation behind the 2.79% limit in the Supervisor’s letter?',
  'The General Fund ended 2025 with more unassigned fund balance than its policy requires. How much of it is planned for one-time costs, and when?',
  'Would the Town keep holding a public override vote for any levy above a new, higher limit?',
] as const
