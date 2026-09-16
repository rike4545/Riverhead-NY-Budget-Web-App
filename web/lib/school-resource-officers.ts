// Who pays for Riverhead's school resource officers — and why the answer keeps
// coming back to the Town.
//
// On September 15, 2026 the Town Board tabled the renewal of the agreement that
// puts two police officers in Riverhead Central School District buildings. The
// resolution is in this site's own record as 2026-856, and the vote is recorded
// as tabled rather than adopted, which is why it appears here at all: the Board
// did not decline the program, it declined to sign this version of the deal.
//
// WHAT THE ARGUMENT IS ABOUT. Not whether to have SROs — every member said they
// want them. It is about which taxpayer pays, and the structural problem is that
// every funding path anyone has proposed pays somebody else. The state bills pay
// school districts. The federal school-safety money pays school districts and
// states. The one federal program that pays a police department requires a
// signed agreement with the school and a local match — so the Town cannot chase
// it while the agreement is tabled.
//
// WHAT THIS PAGE DOES NOT DO. It does not say who ought to pay. That is a
// political judgement and the Board is having it in public. It lays out what
// each source actually funds, sourced, so the argument is about the same facts.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { policeDistrict } from './police-crime'

type Res = {
  number: string | null
  title: string
  category: string
  townFiscalImpact: string
  townTreatment: string
  vote: { adopted: boolean | null; tag: string | null } | null
}
type Meeting = { meetingDate: string; resolutions: Res[] }

const meetings: Meeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as Meeting,
)

const SRO_RE = /school resource officer/i

/** The tabled renewal, read from this site's own parsed record. */
export const resolution = (() => {
  for (const m of meetings) {
    for (const r of m.resolutions) {
      if (SRO_RE.test(r.title)) {
        return {
          meetingDate: m.meetingDate,
          number: r.number,
          title: r.title,
          adopted: r.vote?.adopted ?? null,
          tag: r.vote?.tag ?? null,
          townFiscalImpact: r.townFiscalImpact,
          townTreatment: r.townTreatment,
        }
      }
    }
  }
  return null
})()

export const officers = 2

/**
 * What the program has cost and who carried it.
 *
 * Reported by RiverheadLOCAL and the News-Review from the Board's own
 * discussion. The Town does not publish an SRO line in the adopted budget — the
 * officers are police officers, paid out of the Police department — so these
 * are the only figures in the public record, and they are approximate as
 * reported.
 */
export type YearSplit = {
  schoolYear: string
  total: number
  district: number
  town: number
  note: string
}

export const costHistory: YearSplit[] = [
  {
    schoolYear: '2024–25',
    total: 352_000,
    district: 88_000,
    town: 264_000,
    note: 'The district paid half the cost of one of the two officers.',
  },
  {
    schoolYear: '2025–26',
    total: 352_000,
    district: 176_000,
    town: 176_000,
    note: 'Split evenly for the first time.',
  },
  {
    schoolYear: '2026–27',
    total: 350_000,
    district: 200_000,
    town: 150_000,
    note: 'What the tabled agreement proposed: the district budgets $200,000 and the Town carries the rest.',
  },
]

export const perOfficer = Math.round(costHistory[1].total / officers)

export const townShare = costHistory.map((y) => ({
  schoolYear: y.schoolYear,
  pct: y.town / y.total,
}))

/** What the Board actually said, as reported. Quotes, not paraphrase. */
export const positions = [
  {
    who: 'Erik Howard, Town Attorney',
    quote: 'No commitment for them, and no commitment for us.',
    on: 'the one-year extension through June 30, 2027, which makes no promise about later years',
  },
  {
    who: 'Denise Merrifield, Councilwoman',
    quote: 'this is actually taxation without representation',
    on: 'Town taxpayers who live outside the school district helping to fund a school district programme',
  },
  {
    who: 'Ken Rothwell, Councilman',
    quote: 'we want the program… but we’ve got to bring the school board to the table',
    on: 'his position that the district should cover the entire cost, and his request to see the full contract with changes marked',
  },
]

export type FundingPath = {
  name: string
  authority: string
  url: string
  status: string
  paysWhom: 'school district' | 'law enforcement agency' | 'states and districts'
  paysTheTown: boolean
  /** False for a bill that has not been enacted — money that does not exist yet. */
  enacted: boolean
  what: string
  catch: string
}

/**
 * Every funding route raised in the debate, and who each one actually pays.
 *
 * This is the part that decides the argument, and it is checkable: three of the
 * four pay somebody other than the Town, and the fourth has a precondition the
 * tabled agreement was going to supply.
 */
export const fundingPaths: FundingPath[] = [
  {
    name: 'A703 — grants for school resource officer costs',
    authority: 'New York State Assembly, 2025–2026 session',
    url: 'https://www.nysenate.gov/legislation/bills/2025/A703',
    status: 'Not law — in committee, referred to Education January 8, 2025',
    paysWhom: 'school district',
    paysTheTown: false,
    enacted: false,
    what: 'Would give districts grants equal to 100% of the combined annual salaries paid to school resource officers, and let BOCES contract with local police for them.',
    catch: 'The money goes to the district, not the municipality that employs the officers. A town that supplies the officers and carries the cost receives nothing directly under this bill.',
  },
  {
    name: 'S9336 — SRO Training and Implementation Program',
    authority: 'New York State Senate, sponsored by Sen. James Skoufis',
    url: 'https://www.nysenate.gov/legislation/bills/2025/S9336',
    status: 'Not law — in committee, referred to Education March 3, 2026',
    paysWhom: 'school district',
    paysTheTown: false,
    enacted: false,
    what: 'Would create a certification programme for RETIRED officers serving as SROs and would raise their pension earnings cap from $35,000 to $65,000 so they could take the work without losing benefits. It has passed neither chamber and has not been signed.',
    catch: 'Not a funding bill at all. It makes a different staffing model possible — retired officers hired by the district — rather than paying for the serving officers a town assigns.',
  },
  {
    name: 'Bipartisan Safer Communities Act school-safety money',
    authority: 'U.S. Department of Education',
    url: 'https://www.ed.gov/laws-and-policy/laws-preschool-grade-12-education/bipartisan-safer-communities-act',
    status: 'Enacted and operating',
    paysWhom: 'states and districts',
    paysTheTown: false,
    enacted: true,
    what: 'Stronger Connections grants and two school mental-health programmes, flowing to states and school districts.',
    catch: 'These are school-climate and mental-health programmes. The Department’s own programme list does not carry an SRO salary grant, and none of it is payable to a police department.',
  },
  {
    name: 'COPS Hiring Program',
    authority: 'U.S. Department of Justice, Office of Community Oriented Policing Services',
    url: 'https://cops.usdoj.gov/chp',
    status: 'Enacted — but the FY2026 round closed July 29, 2026',
    paysWhom: 'law enforcement agency',
    paysTheTown: true,
    enacted: true,
    what: 'Funds law enforcement agencies to hire full-time sworn officers, and explicitly covers school resource officer positions. This is the one route that pays the Town rather than the district.',
    catch: 'It requires a local match of at least 25% of the project cost, and an agency awarded SRO funding must file a signed memorandum of understanding with its school partner within 90 days. The agreement the Board tabled is that memorandum. A grant is also not free money: the match is Town money, and the FY2026 round has closed.',
  },
]

/** Money that exists today, as against money a bill would create if enacted. */
export const enactedPaths = fundingPaths.filter((f) => f.enacted)
export const unenactedPaths = fundingPaths.filter((f) => !f.enacted)

export const notLawYet =
  'Neither state bill is law. A703 has sat in the Assembly Education Committee since January 2025 and S9336 in the Senate Education Committee since March 2026; neither has passed a chamber, and neither has been signed. That matters for a budget decision being made now: whatever they would do if enacted, they fund nothing in the 2026–27 school year, and a Board weighing who pays this year cannot count on either.'

/**
 * The part that reframes Riverhead's argument.
 *
 * Nobody in this county has put SRO money in writing where a resident can read
 * it. The county publishes a roster and no terms; its written agreement with
 * the superintendents is explicitly not an MOU and says nothing about cost; the
 * four other East End towns publish nothing. Riverhead is the one place the
 * argument is happening in public with figures attached — which is why it looks
 * like dysfunction and is closer to the opposite.
 */
export const nobodyPublishesTheMoney =
  'Across the whole county, on both sides of the 1960 line, the cost of school resource officers is not a public number. Suffolk publishes who its eighteen officers are and nothing about what they cost or whether any district reimburses it. The document it agreed with the superintendents is, by both parties\u2019 own account, not a memorandum of understanding, and carries no payment terms. None of the four other East End towns publishes its agreement. Riverhead is the one place where the money is being argued over in public with figures attached — which reads like dysfunction and is nearer the opposite.'

export const theBind =
  'Put together, the paths do not contradict each other so much as they miss each other. The two state bills would pay the school district, and both have sat in committee — one since January 2025. The federal school-safety money is district and state money for school climate and mental health, not officer salaries. The single programme that would pay Riverhead directly is the COPS Hiring Program, and it asks for two things the Town does not currently have: a quarter of the cost from its own budget, and a signed agreement with the school district — which is the document that was tabled.'

/**
 * Who else even has this argument — and why the county has it differently.
 *
 * The obvious question is what other districts pay. The structural answer comes
 * first, because it decides which comparisons are meaningful at all: in the five
 * western towns, policing is the Suffolk County Police Department's, funded by a
 * county police district tax levied across the district. A school district there
 * negotiates with the COUNTY, and its town is not a party — there is no town
 * police budget for an SRO cost to land on and nothing to allocate per township.
 *
 * Riverhead is in the other five. Each East End town employs its own force, so
 * each one negotiates directly with the districts inside its boundaries. That
 * makes the other four — Southampton, East Hampton, Southold and Shelter Island
 * — the only towns in the county facing the same negotiation, exactly as they
 * are the only ones with a comparable police budget on the crime page.
 */
export const whoElseHasThisArgument = {
  countyPoliced: {
    towns: ['Babylon', 'Huntington', 'Islip', 'Smithtown', 'Brookhaven'],
    how: 'Policing is the Suffolk County Police Department\u2019s, paid for by a county police district tax levied across the district rather than by each town.',
    allocation:
      'There is no per-township allocation for an SRO. The town is not in the transaction: an agreement runs between the school district and the county, and the town has no police budget for the cost to land on.',
  },
  ownForce: {
    towns: ['Riverhead', 'Southampton', 'East Hampton', 'Southold', 'Shelter Island'],
    southampton:
      'Southampton publishes a programme page saying its SROs are “coordinated with several participating school districts within the Township”. It names no district, no officer count and no money — and the plural matters: a town holding several districts is negotiating something structurally different from Riverhead, which has one.',
    how: 'Each town employs its own police department and negotiates directly with the school districts inside its boundaries.',
    allocation:
      'Whatever each town and district agree. That is the negotiation Riverhead is having, and these four are the only towns in Suffolk facing the same one.',
  },
  whatIsNotSourced:
    'What the other four East End towns actually pay is not established here. None of them publishes its SRO memorandum, and neither does Riverhead. So this page can say how the two halves of the county are STRUCTURED, which is checkable, and cannot yet say what the neighbours pay, which would need each town\u2019s agreement or budget. Stating a comparison without them would be inventing one.',
}

/**
 * The county's own SRO programme — and the phrase that settles the structure.
 *
 * The Community Relations Bureau publishes a roster: officers assigned "as
 * School Resource Officers (SROs) THROUGHOUT THE POLICE DISTRICT". The police
 * district is the five western towns. Riverhead is not in it, which is why the
 * Town cannot simply have county SROs the way a Brookhaven or Islip district
 * can, and why it is negotiating over its own officers at all.
 *
 * The roster is the county saying, in its own words, that this programme stops
 * at the district line.
 */
export const countyProgram = {
  url: 'https://scpdcrb.suffolkcountyny.gov/School-Resource-Officer-SRO',
  quote: 'assigns Officers as School Resource Officers (SROs) throughout the police district',
  precincts: [
    { precinct: '1st', officers: 1 },
    { precinct: '2nd', officers: 2 },
    { precinct: '3rd', officers: 2 },
    { precinct: '4th', officers: 2 },
    { precinct: '5th', officers: 2 },
    { precinct: '6th', officers: 2 },
    { precinct: '7th', officers: 1 },
  ],
  countywide: 6,
  get precinctTotal() {
    return this.precincts.reduce((n, p) => n + p.officers, 0)
  },
  get total() {
    return this.precinctTotal + this.countywide
  },
  districtPopulation: policeDistrict?.countyPolicedPopulation ?? null,
  namesNoDistrict: true,
  publishesNoFunding: true,
  reading:
    'The county runs a visible programme and publishes who is in it. What it does not publish is what any of it costs, who pays, or whether a district reimburses anything — there is no cost-sharing formula, no agreement and no budget figure on the page. So the opacity Riverhead residents run into is not peculiar to Riverhead: a resident inside the police district cannot see what their school resource officers cost either.',
  /**
   * What the county and its superintendents actually put in writing — and did
   * not. In 2023 the department and the Suffolk County Schools Superintendents
   * Association agreed a one-page, nineteen-point job description for SROs.
   * Both sides said explicitly that it is NOT a memorandum of understanding,
   * and it carries no funding, cost-sharing or payment terms of any kind.
   *
   * That matters twice over. It confirms that the money question is unanswered
   * on the county side too, not just in Riverhead. And a COPS Hiring Program
   * award requires a SIGNED MOU with the school partner — a document both
   * parties have said this one is not.
   */
  jobDescription: {
    what: 'A one-page, nineteen-point list of roles and responsibilities, agreed between the department and the Suffolk County Schools Superintendents Association.',
    notAnMou: 'Both sides stated it is not a memorandum of understanding.',
    topDuty: 'perform all duties, responsibilities, and lawful requirements of a duly sworn Suffolk County Police Officer',
    silentOn: 'Funding, cost-sharing, payment terms, how many districts or officers it covers, and the boundaries some parents had asked for.',
    who: 'Kenneth Bossert, president of the Suffolk County Schools Superintendents Association',
  },
  /**
   * What the county DOES measure the programme by.
   *
   * Its police-reform report publishes an SRO arrest series and the share of
   * all SCPD arrests those represent — 18 SRO arrests in 2018, 5 in 2019, none
   * in the 2020 year-to-date, against 34,807 total arrests in 2018. It counts
   * the programme in arrests, and at no point in dollars. Note the headcount
   * there is 17 (12 precinct, 5 countywide) against the 18 on the current
   * roster; the report is from the 2020-21 police-reform review and the roster
   * is live, so both are given with their source rather than reconciled.
   */
  reformReport: {
    url: 'https://suffolkcountyny.gov/Portals/0/formsdocs/police%20reform/School%20Resource%20Officer%20Statistics.pdf',
    officersThen: 17,
    precinctThen: 12,
    countywideThen: 5,
    arrests: [
      { period: '2018', sro: 18, allScpd: 34_807 },
      { period: '2019', sro: 5, allScpd: 33_030 },
      { period: '2020, to Aug 31', sro: 0, allScpd: 12_991 },
    ],
    reading:
      'The county reports this programme in arrests — a handful a year, never as much as a tenth of one per cent of all SCPD arrests — and never in cost. What a resident can find out about their school resource officers is how often one arrested somebody, not what the programme is worth paying for.',
  },
  scaleCaveat:
    'The two counts are not a ratio worth computing. SROs serve students, not residents, and neither the county nor the Town publishes the enrolment each programme covers — so the figures below show scale, and a per-pupil comparison would need numbers that are not published.',
}

export const whatWouldSettleIt = [
  'The agreement itself. The Board tabled the renewal partly because it had not seen the full contract with changes marked; the Town does not publish the SRO memorandum, so neither can a resident.',
  'An SRO line in the adopted budget. The officers are paid out of the Police department, so no budget line shows what the programme costs or what the district reimburses. Every figure on this page comes from press reporting of the Board’s own discussion rather than from the budget.',
  'The overtime terms. Members asked who authorises and pays overtime for games and proms. That is a real cost on a $350,000 programme and the reported figures do not separate it.',
  'The district boundary against the town boundary. One member’s objection is that Town taxpayers outside the school district help fund a district programme. Whether and how much the two differ is a factual question this site has not sourced, and it is the crux of that argument.',
  'What the other East End towns pay. Southampton, East Hampton, Southold and Shelter Island run their own police and face the same negotiation, so their agreements are the only real benchmark. Southampton publishes a programme page with no financial terms; none of the four publishes an agreement. Its own page points a resident at a FOIL request, which is the answer to how you would get this.',
  'What the county\u2019s own programme costs. Suffolk publishes its SRO roster but no funding terms at all — no cost share, no agreement, no budget line. Whether districts inside the police district reimburse anything is unanswerable from the public record, which makes the natural comparison unavailable to everyone, not only to Riverhead.',
]

export const sources = [
  {
    title: 'RiverheadLOCAL, “Riverhead board delays SRO deal with school district over unresolved cost questions” (September 16, 2026)',
    url: 'https://riverheadlocal.com/2026/09/16/riverhead-board-delays-sro-deal-with-school-district-over-unresolved-cost-questions/',
    covers: 'The tabling, the $200,000 district figure, and the members’ stated objections.',
  },
  {
    title: 'Riverhead News-Review, “Riverhead moves to keep school resource officers amid funding dispute” (September 2026)',
    url: 'https://riverheadnewsreview.timesreview.com/2026/09/137733/riverhead-moves-to-keep-school-resource-officers-amid-funding-disput/',
    covers: 'The three-year cost split and the one-year extension terms.',
  },
  {
    title: 'New York State Assembly Bill A703 (2025–2026)',
    url: 'https://www.nysenate.gov/legislation/bills/2025/A703',
    covers: 'Grants to school districts equal to 100% of SRO salaries; BOCES contracting authority.',
  },
  {
    title: 'New York State Senate Bill S9336 (2025–2026)',
    url: 'https://www.nysenate.gov/legislation/bills/2025/S9336',
    covers: 'SRO certification for retired officers and the pension earnings cap.',
  },
  {
    title: 'BillTrack50 — S9336 detail',
    url: 'https://www.billtrack50.com/billdetail/1831058',
    covers: 'Independent tracking of the bill’s progress.',
  },
  {
    title: 'U.S. Department of Education — Bipartisan Safer Communities Act',
    url: 'https://www.ed.gov/laws-and-policy/laws-preschool-grade-12-education/bipartisan-safer-communities-act',
    covers: 'Stronger Connections and the school mental-health programmes.',
  },
  {
    title: 'U.S. DOJ COPS Office — COPS Hiring Program',
    url: 'https://cops.usdoj.gov/chp',
    covers: 'Eligibility for law enforcement agencies, SRO positions, the 25% local match and the school MOU requirement.',
  },
  {
    title: 'Suffolk County Police Department, Community Relations Bureau — School Resource Officer (SRO) programme',
    url: 'https://scpdcrb.suffolkcountyny.gov/School-Resource-Officer-SRO',
    covers: 'The county roster, the assignment of SROs “throughout the police district”, and the absence of any published funding terms.',
  },
  {
    title: 'TBR News Media, “Suffolk police, schools reach agreement on SRO’s job description”',
    url: 'https://tbrnewsmedia.com/suffolk-police-schools-reach-agreement-on-sros-job-description/',
    covers: 'The nineteen-point job description, both parties’ statement that it is not an MOU, and its silence on cost.',
  },
  {
    title: 'Suffolk County police-reform review — School Resource Officer Statistics',
    url: 'https://suffolkcountyny.gov/Portals/0/formsdocs/police%20reform/School%20Resource%20Officer%20Statistics.pdf',
    covers: 'The 17-officer programme as reported in the reform review, and the SRO arrest series for 2018 to August 2020 — the only quantities the county publishes about the programme.',
  },
  {
    title: 'Town of Southampton — School Resource Officer',
    url: 'https://www.southamptontownny.gov/1760/School-Resource-Officer',
    covers: 'The nearest comparable programme: several participating districts within the township, and no published financial terms.',
  },
  {
    title: 'New York State Education Department — school safety plans',
    url: 'https://www.nysed.gov/student-support-services/school-safety-plans',
    covers: 'The district-level safety planning framework SROs sit inside.',
  },
]
