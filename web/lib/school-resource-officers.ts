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
    status: 'In committee — referred to Education, January 8, 2025',
    paysWhom: 'school district',
    paysTheTown: false,
    what: 'Would give districts grants equal to 100% of the combined annual salaries paid to school resource officers, and let BOCES contract with local police for them.',
    catch: 'The money goes to the district, not the municipality that employs the officers. A town that supplies the officers and carries the cost receives nothing directly under this bill.',
  },
  {
    name: 'S9336 — SRO Training and Implementation Program',
    authority: 'New York State Senate, sponsored by Sen. James Skoufis',
    url: 'https://www.nysenate.gov/legislation/bills/2025/S9336',
    status: 'In committee — referred to Education, March 3, 2026',
    paysWhom: 'school district',
    paysTheTown: false,
    what: 'Creates a certification programme for RETIRED officers serving as SROs and raises their pension earnings cap from $35,000 to $65,000 so they can take the work without losing benefits.',
    catch: 'Not a funding bill at all. It makes a different staffing model possible — retired officers hired by the district — rather than paying for the serving officers a town assigns.',
  },
  {
    name: 'Bipartisan Safer Communities Act school-safety money',
    authority: 'U.S. Department of Education',
    url: 'https://www.ed.gov/laws-and-policy/laws-preschool-grade-12-education/bipartisan-safer-communities-act',
    status: 'Active',
    paysWhom: 'states and districts',
    paysTheTown: false,
    what: 'Stronger Connections grants and two school mental-health programmes, flowing to states and school districts.',
    catch: 'These are school-climate and mental-health programmes. The Department’s own programme list does not carry an SRO salary grant, and none of it is payable to a police department.',
  },
  {
    name: 'COPS Hiring Program',
    authority: 'U.S. Department of Justice, Office of Community Oriented Policing Services',
    url: 'https://cops.usdoj.gov/chp',
    status: 'The FY2026 round closed July 29, 2026',
    paysWhom: 'law enforcement agency',
    paysTheTown: true,
    what: 'Funds law enforcement agencies to hire full-time sworn officers, and explicitly covers school resource officer positions. This is the one route that pays the Town rather than the district.',
    catch: 'It requires a local match of at least 25% of the project cost, and an agency awarded SRO funding must file a signed memorandum of understanding with its school partner within 90 days. The agreement the Board tabled is that memorandum. A grant is also not free money: the match is Town money, and the FY2026 round has closed.',
  },
]

export const theBind =
  'Put together, the paths do not contradict each other so much as they miss each other. The two state bills would pay the school district, and both have sat in committee — one since January 2025. The federal school-safety money is district and state money for school climate and mental health, not officer salaries. The single programme that would pay Riverhead directly is the COPS Hiring Program, and it asks for two things the Town does not currently have: a quarter of the cost from its own budget, and a signed agreement with the school district — which is the document that was tabled.'

export const whatWouldSettleIt = [
  'The agreement itself. The Board tabled the renewal partly because it had not seen the full contract with changes marked; the Town does not publish the SRO memorandum, so neither can a resident.',
  'An SRO line in the adopted budget. The officers are paid out of the Police department, so no budget line shows what the programme costs or what the district reimburses. Every figure on this page comes from press reporting of the Board’s own discussion rather than from the budget.',
  'The overtime terms. Members asked who authorises and pays overtime for games and proms. That is a real cost on a $350,000 programme and the reported figures do not separate it.',
  'The district boundary against the town boundary. One member’s objection is that Town taxpayers outside the school district help fund a district programme. Whether and how much the two differ is a factual question this site has not sourced, and it is the crux of that argument.',
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
    title: 'New York State Education Department — school safety plans',
    url: 'https://www.nysed.gov/student-support-services/school-safety-plans',
    covers: 'The district-level safety planning framework SROs sit inside.',
  },
]
