// The Peconic Bay Region Community Housing Fund — the 0.5% transfer tax that
// four of the five Peconic Bay towns levy for housing, and the community
// housing plan state law requires a town to adopt *before* it can spend a
// dollar of that money. Riverhead is the fifth town: no fund, no plan.
//
// Sourcing note (the same standard as lib/credit-rating.ts): the primary
// documents — Town Law § 64-k on justia.com/nysenate.gov, Shelter Island's
// Chapter 52 on ecode360, and the RiverheadLOCAL / Riverhead News-Review /
// East Hampton Star coverage — were not directly retrievable in the
// environment that compiled this file. So every claim below carries a
// confidence flag:
//
//   STATUTE  — statutory language, quoted as it appears in indexed excerpts of
//              Town Law § 64-k. Read it as the statute's substance, not as a
//              certified verbatim transcript; check the citation before
//              quoting it in a filing.
//   REPORTED — from news coverage or a town's own web pages, not confirmed
//              against the primary record here.
//   VERIFIED — traceable to a document this site already parses. Riverhead's
//              transfer-tax revenue is the only category that qualifies: it
//              comes from the Town's audited CPF financial statements via
//              etl/parse_cpf.py, not from any of the sources above.
//
// The dollar estimate of what Riverhead has forgone is arithmetic on VERIFIED
// revenue — but it is still an estimate, and the caveats in `estimateCaveats`
// are part of the number, not a footnote to it.

import { cpfHistory, cpfMechanics } from './cpf'

export type Confidence = 'STATUTE' | 'REPORTED' | 'VERIFIED'

export const CPF_RATE = cpfMechanics.ratePercent // 0.02
export const HOUSING_FUND_RATE = 0.005

/** A 0.5% tax is one quarter of a 2% tax on the same conveyance. */
export const rateRatio = HOUSING_FUND_RATE / CPF_RATE

export const statute = {
  name: 'Peconic Bay Region Community Housing Act',
  citation: 'New York Town Law § 64-k',
  enactedYear: 2021,
  amendedYear: 2022,
  collectionsBegan: 'April 1, 2023',
  collectionsBeganYear: 2023,
  // Collections started April 1, so the first year is 9 months, not 12.
  firstYearMonths: 9,
  towns: ['East Hampton', 'Riverhead', 'Shelter Island', 'Southampton', 'Southold'],
  ratePlain: `${(HOUSING_FUND_RATE * 100).toFixed(1)}% of the sale price, on top of the CPF's ${(CPF_RATE * 100).toFixed(0)}%`,
  paidBy: 'the grantee — the buyer — at closing, filed with the Suffolk County Clerk',
  paidByConfidence: 'REPORTED' as Confidence,
  combinedRateInAdoptingTowns: 0.025,
}

export type PlanStep = {
  step: number
  title: string
  detail: string
  quote?: string
  confidence: Confidence
  /** True when this step is decided by voters rather than the Town Board. */
  votersDecide?: boolean
}

// What it actually takes to stand this up. The order matters: the plan is not
// the first step and the tax is not the last one — and step 2 is the only step
// in the sequence that is not the Town Board's to decide.
export const planSteps: PlanStep[] = [
  {
    step: 1,
    title: 'The Town Board adopts a local law establishing the fund',
    detail:
      'A town in the Peconic Bay region may adopt a local law imposing a supplemental 0.5% real-estate transfer tax dedicated to community housing. Nothing happens without this first vote — which is the step Riverhead\'s board declined to take in 2022.',
    confidence: 'STATUTE',
  },
  {
    step: 2,
    title: 'The voters decide, at a mandatory referendum',
    detail:
      'The local law is subject to a mandatory referendum. In November 2022 voters in East Hampton, Southampton, Southold, and Shelter Island approved theirs. Riverhead residents were never asked, because the question never reached the ballot.',
    confidence: 'STATUTE',
    votersDecide: true,
  },
  {
    step: 3,
    title: 'The Town Board creates an advisory board',
    detail:
      'A town that establishes a fund "shall create an advisory board to review and make recommendations regarding the town\'s community housing plan." Its seats are specified by statute, not left to the board\'s discretion.',
    confidence: 'STATUTE',
  },
  {
    step: 4,
    title: 'The Town Board adopts the community housing plan — by local law',
    detail:
      'This is the requirement the page is named for, and it is a precondition on spending, not on collecting.',
    quote:
      'Before a town in the Peconic Bay region may expend any funds pursuant to this section, the town board shall first adopt a town housing plan which establishes an implementation plan for the provision of community housing opportunities by the fund',
    confidence: 'STATUTE',
  },
  {
    step: 5,
    title: 'The plan has to follow smart-growth principles',
    detail:
      'The statute names them: account for and minimize the social, economic, and environmental costs of new development — infrastructure, sewers and wastewater, water, schools, recreation, loss of open space and farmland — and encourage development where transportation, water, and sewer infrastructure are already available or practical.',
    confidence: 'STATUTE',
  },
  {
    step: 6,
    title: 'Only then can the money be spent, on statutory uses',
    detail:
      'Eligible expenses run to land acquisition, planning, engineering, and construction costs, plus other hard and soft costs directly related to the construction, rehabilitation, purchase, or rental of community housing.',
    confidence: 'STATUTE',
  },
]

// Statutory composition of the advisory board that reviews the plan.
export const advisoryBoardSeats = [
  'A representative of the construction industry',
  'A representative of the real-estate industry',
  'A representative of the banking industry',
  'Three representatives of local housing-advocacy or human-services organizations',
]

export type PeerTown = {
  town: string
  adoptedFund: boolean
  referendum: string
  collected?: number
  collectedAsOf?: string
  planStatus: string
  spending: string
  confidence: Confidence
}

// What the other four towns have collected and done with it. Figures are as
// reported in coverage of the annual Assembly transfer-tax tallies and each
// town's own housing pages — not audited statements this site parses, which is
// why they are all REPORTED.
export const peerTowns: PeerTown[] = [
  {
    town: 'East Hampton',
    adoptedFund: true,
    referendum: 'Approved November 2022',
    collected: 25_190_000,
    collectedAsOf: 'through 2025 (about $11.7M of it in 2025 alone)',
    planStatus: 'Community housing plan adopted; fund administered by the Town\'s housing office',
    spending:
      '$1.5M to the East Hampton Housing Authority for roughly 50 workforce apartments on Route 114, $1M to close a funding gap at the 50-unit Green at Gardiner\'s Point, and $1.5M to buy 109 Hampton Street in Sag Harbor, preserving 4 affordable units.',
    confidence: 'REPORTED',
  },
  {
    town: 'Southampton',
    adoptedFund: true,
    referendum: 'Approved November 2022',
    planStatus: 'Community housing plan adopted',
    spending:
      '$1.25M for down-payment assistance and $1.25M for an accessory-dwelling-unit program, both administered with the Community Development Corporation of Long Island.',
    confidence: 'REPORTED',
  },
  {
    town: 'Southold',
    adoptedFund: true,
    referendum: 'Approved November 2022',
    collected: 4_800_000,
    collectedAsOf: 'as of May 2025',
    planStatus: 'Community housing plan adopted',
    spending:
      'Zoning updates and program build-out first; a 2025 request for qualifications sought 10 units across three sites — six studio/one-bedroom and four two-bedroom.',
    confidence: 'REPORTED',
  },
  {
    town: 'Shelter Island',
    adoptedFund: true,
    referendum: 'Approved November 2022',
    collected: 2_250_000,
    collectedAsOf: 'in 2023, its first (partial) year',
    planStatus:
      'Community housing plan developed in 2023 on the advice of its Community Housing Board, and carried into the Town\'s comprehensive plan',
    spending:
      'Selected for New York\'s Plus One ADU program, pairing the Community Housing Board with CDCLI on grants of up to $125,000 per accessory dwelling unit.',
    confidence: 'REPORTED',
  },
  {
    town: 'Riverhead',
    adoptedFund: false,
    referendum: 'Never placed on the ballot',
    collected: 0,
    collectedAsOf: 'no fund exists',
    planStatus: 'No community housing plan under § 64-k',
    spending: 'None — with no fund and no plan, there is nothing to spend.',
    confidence: 'VERIFIED',
  },
]

/** Reported four-town total since collections began. */
export const fourTownTotal = {
  amount: 79_120_000,
  through: '2025',
  attribution:
    'Annual East End transfer-tax tally reported March 2026 (about $79.12M collected by the four participating towns since the tax took effect April 1, 2023)',
  confidence: 'REPORTED' as Confidence,
}

export const shelterIsland = {
  fundLocalLaw: 'Local Law No. 7 of 2022, adopted April 29, 2022',
  referendum: 'Approved by Shelter Island voters, November 2022',
  boardExpanded:
    'Local Law No. 1 of 2023 (January 10, 2023) grew the Community Housing Board from five members to seven, adding seats for construction, real estate, finance, environmental, housing-advocacy, and housing-recipient perspectives',
  planYear: 2023,
  planStatus:
    'The town\'s Community Housing Plan was drafted and taken through public workshops and a hearing during 2023, adopted on the advice of the Community Housing Board as § 64-k requires, and folded into the comprehensive plan update — the first time that plan carried a housing plan.',
  // Named honestly: the exact local-law number and adoption date for the PLAN
  // (as distinct from the FUND law and the board-expansion law above) could not
  // be pinned to a retrievable primary record in this pass.
  gap:
    'The local-law number and exact adoption date of the plan itself could not be confirmed against a retrievable primary record here. The Shelter Island Town Clerk\'s office holds it. Treat "adopted in 2023" as the sourced grain, not a citation.',
  confidence: 'REPORTED' as Confidence,
}

export type TimelineEvent = {
  date: string
  what: string
  detail: string
  confidence: Confidence
  tone: 'neutral' | 'gap' | 'progress'
}

export const riverheadTimeline: TimelineEvent[] = [
  {
    date: '2021',
    what: 'State law creates the option',
    detail:
      'The Peconic Bay Region Community Housing Act names Riverhead as one of the five towns that may establish a community housing fund. Amended in 2022; collections in adopting towns start April 1, 2023.',
    confidence: 'STATUTE',
    tone: 'neutral',
  },
  {
    date: 'April 2022',
    what: 'The Town Board takes it up',
    detail:
      'Riverhead\'s board discusses whether to adopt the local law that would put the 0.5% tax to a townwide vote in November.',
    confidence: 'REPORTED',
    tone: 'neutral',
  },
  {
    date: 'July–August 2022',
    what: 'Riverhead declines to put it on the ballot',
    detail:
      'The board lets the deadline pass without adopting the local law — the only one of the five towns not to. Then-Councilman Tim Hubbard said he had first thought it could help first-time buyers, but that the proposal "doesn\'t really fit Riverhead" and worked better in Southampton and East Hampton. The board\'s stated position was that the town already carries a large share of the region\'s affordable housing.',
    confidence: 'REPORTED',
    tone: 'gap',
  },
  {
    date: 'November 2022',
    what: 'The other four towns\' voters say yes',
    detail:
      'East Hampton, Southampton, Southold, and Shelter Island approve their referendums. Riverhead residents are not asked.',
    confidence: 'REPORTED',
    tone: 'gap',
  },
  {
    date: '2023',
    what: 'Shelter Island adopts its community housing plan',
    detail:
      'Drafted with its Community Housing Board, taken through public workshops and a hearing, and carried into the comprehensive plan — the statutory precondition on spending, satisfied.',
    confidence: 'REPORTED',
    tone: 'neutral',
  },
  {
    date: 'September 4, 2024',
    what: 'Riverhead adopts its Comprehensive Plan Update',
    detail:
      'Unanimously adopted, and it does carry housing recommendations — easing accessory-dwelling-unit rules among them. It is a comprehensive plan under Town Law § 272-a, not a community housing plan under § 64-k, and it comes with no dedicated revenue.',
    confidence: 'REPORTED',
    tone: 'progress',
  },
  {
    date: '2025',
    what: 'Riverhead moves projects, one at a time',
    detail:
      'The board unanimously approves zoning changes for Northville Commons — the Family Community Life Center\'s affordable housing and community-center project with Georgica Green Ventures — and a separate downtown-area project wins a $1M state grant. Supervisor Hubbard, on Northville Commons: "This is something that I\'ve supported from day one… We\'re losing too many young people [who are] moving off Long Island, [because they] can\'t afford to live here."',
    confidence: 'REPORTED',
    tone: 'progress',
  },
  {
    date: 'Today',
    what: 'Still no plan, and still no fund',
    detail:
      'Riverhead is the only Peconic Bay town without a community housing plan under § 64-k and the only one whose buyers pay 2% at closing rather than 2.5%.',
    confidence: 'VERIFIED',
    tone: 'gap',
  },
]

// ---------------------------------------------------------------------------
// What the same tax would have raised here, from Riverhead's own audited data.
// ---------------------------------------------------------------------------

const housingEraYears = cpfHistory.filter((y) => y.year >= statute.collectionsBeganYear)

export type ForgoneYear = {
  year: number
  cpfRevenue: number
  quarterShare: number
  partialYear: boolean
}

export const forgoneByYear: ForgoneYear[] = housingEraYears.map((y) => ({
  year: y.year,
  cpfRevenue: y.transferTaxRevenue,
  quarterShare: y.transferTaxRevenue * rateRatio,
  partialYear: y.year === statute.collectionsBeganYear,
}))

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Full-year quarter-share in every year — the top of the range. */
export const forgoneHigh = sum(forgoneByYear.map((y) => y.quarterShare))

/** Same, but the first year prorated to the 9 months the tax was actually collectible. */
export const forgoneLow = sum(
  forgoneByYear.map((y) => (y.partialYear ? y.quarterShare * (statute.firstYearMonths / 12) : y.quarterShare))
)

export const forgoneThroughYear = housingEraYears.length
  ? housingEraYears[housingEraYears.length - 1].year
  : statute.collectionsBeganYear

export const cpfRevenueSinceHousingTax = sum(housingEraYears.map((y) => y.transferTaxRevenue))

// The estimate's honest limits. These are not disclaimers bolted on afterward —
// each one moves the real number, and two of them move it down.
export const estimateCaveats = [
  {
    label: 'It is arithmetic, not a forecast',
    text: 'A 0.5% rate is one quarter of a 2% rate applied to the same conveyances, so the sizing is Riverhead\'s own audited CPF transfer-tax revenue divided by four. No model, no assumptions about the market.',
  },
  {
    label: 'The exemption floors differ, so the real figure is lower',
    text: 'Towns that adopted the housing fund also raised the sale-price floor exempt from the transfer tax, and widened the first-time-homebuyer exemption. Riverhead, having opted out, kept the older floors ($75,000 unimproved / $150,000 improved). Applied to Riverhead\'s sales, the housing-fund exemptions would shave real dollars off the quarter-share — treat the range as a ceiling.',
  },
  {
    label: 'It would have cost the preservation fund something too',
    text: 'Those higher exemption floors apply to the whole transfer tax, not just the new half-percent — so adopting the housing fund would also have trimmed the 2% CPF take. That trade-off belongs in the total, and this estimate does not net it out.',
  },
  {
    label: 'It assumes the sales still happen',
    text: 'A higher closing cost can change behavior at the margin. Nothing here models that.',
  },
]

// A plausibility check against what the peer towns actually collected, so the
// estimate can be judged rather than taken on faith.
export const plausibilityCheck =
  'The estimate lands between Southold (about $4.8M by May 2025) and East Hampton (about $25.19M through 2025) — which is where Riverhead belongs: its sales volume is high and its prices are far below the South Fork\'s. A number above East Hampton\'s or below Shelter Island\'s would be a sign the arithmetic was wrong.'

export type Argument = {
  point: string
  detail: string
  confidence: Confidence
}

export const argumentsAgainst: Argument[] = [
  {
    point: 'The board\'s stated position: Riverhead already carries the region\'s affordable housing',
    detail:
      'In 2022 board members held that the town has substantially more affordable and multifamily housing than its East End neighbors, and that a law written for the Hamptons market "doesn\'t really fit Riverhead."',
    confidence: 'REPORTED',
  },
  {
    point: 'The tax is paid by the buyer',
    detail:
      'The Peconic Bay transfer tax is paid by the grantee at closing. A tax aimed at affordability is collected from people buying homes — which is the tension the statute\'s first-time-homebuyer exemption exists to answer, and a fair thing to weigh.',
    confidence: 'REPORTED',
  },
  {
    point: 'It raises the exemption floor on the CPF as well',
    detail:
      'Adopting the housing fund moves the exempt share of every sale, so some preservation-fund revenue goes with it. Riverhead\'s CPF is the largest revenue engine the Town controls outside the levy.',
    confidence: 'REPORTED',
  },
  {
    point: 'Money is not the only constraint',
    detail:
      'Sewer and water capacity, zoning, and project-level opposition all bind. A fund does not by itself produce a unit, as Southold\'s slower start shows.',
    confidence: 'REPORTED',
  },
]

export const argumentsFor: Argument[] = [
  {
    point: 'The Town\'s own leadership describes the problem the fund addresses',
    detail:
      'Supervisor Hubbard, backing Northville Commons in 2025: "We\'re losing too many young people [who are] moving off Long Island, [because they] can\'t afford to live here." That is the case for a dedicated revenue source stated by the person who would administer it.',
    confidence: 'REPORTED',
  },
  {
    point: 'Riverhead is funding housing project by project, without a plan or a dedicated dollar',
    detail:
      'Northville Commons, the state grant, the ADU changes in the 2024 comprehensive plan — real progress, each pursued on its own terms. The four other towns did the planning once, by local law, and attached money to it.',
    confidence: 'REPORTED',
  },
  {
    point: 'A plan is required before a dollar is spent — so the planning is the long pole',
    detail:
      'Under § 64-k the plan, the advisory board, and the smart-growth analysis all have to exist before the fund can be used. A town starting today still has that work ahead of it; the four towns that started in 2022 have it behind them.',
    confidence: 'STATUTE',
  },
  {
    point: 'The tax itself is not the Town Board\'s decision to make — it is the voters\'',
    detail:
      'The statute puts the levy to a mandatory referendum. What the board decided in 2022 was not whether Riverhead would have the tax, but whether Riverhead residents would get to vote on it.',
    confidence: 'STATUTE',
  },
]

export type HousingSource = {
  title: string
  url: string
  covers: string
}

export const sources: HousingSource[] = [
  {
    title: 'New York Town Law § 64-k — Peconic Bay Region Community Housing Fund',
    url: 'https://codes.findlaw.com/ny/town-law/twn-sect-64-k/',
    covers: 'The statute itself: the 0.5% tax, the mandatory referendum, the housing-plan and advisory-board requirements, smart-growth principles, eligible expenses.',
  },
  {
    title: 'New York Town Law § 64-k (2024) — Justia',
    url: 'https://law.justia.com/codes/new-york/twn/article-4/64-k/',
    covers: 'Second text of the same section, including the 2022 amendments.',
  },
  {
    title: 'S.6492 / A.2633 (2021) — Peconic Bay Region Community Housing Act',
    url: 'https://www.nysenate.gov/legislation/bills/2021/S6492',
    covers: 'The enacting legislation and sponsor memo.',
  },
  {
    title: 'Riverhead News-Review — "Riverhead passes on chance to place affordable housing tax on the ballot" (July 2022)',
    url: 'https://riverheadnewsreview.timesreview.com/2022/07/111730/riverhead-passes-on-chance-to-add-affordable-housing-tax-on-the-ballot/',
    covers: 'The Town Board\'s decision and the board members\' stated reasoning.',
  },
  {
    title: 'RiverheadLOCAL — "Riverhead will not seek to establish half-percent transfer tax to fund affordable housing" (Aug. 3, 2022)',
    url: 'https://riverheadlocal.com/2022/08/03/riverhead-will-not-seek-to-establish-half-percent-transfer-tax-to-fund-affordable-housing/',
    covers: 'Confirmation that Riverhead was the only one of the five towns to skip the referendum.',
  },
  {
    title: 'RiverheadLOCAL — "2% transfer tax revenues rose in 2025 and .5% housing fund tax has raised $79M since 2023" (Mar. 5, 2026)',
    url: 'https://riverheadlocal.com/2026/03/05/2-transfer-tax-revenues-rose-in-2025-and-5-housing-fund-tax-has-raised-79m-since-2023/',
    covers: 'The four-town housing-fund total through 2025 and the annual transfer-tax tally.',
  },
  {
    title: 'The East Hampton Star — "$11.7 Million for Housing Fund in 2025"',
    url: 'https://www.easthamptonstar.com/government/2026312/117-million-housing-fund-2025',
    covers: 'East Hampton\'s 2025 collections and its cumulative total since 2023.',
  },
  {
    title: 'Dan\'s Papers — "Community Housing Funds Raise $44M, East End Rolls Out Plans" (May 2025)',
    url: 'https://www.danspapers.com/2025/05/community-housing-funds-44m-east-end/',
    covers: 'What each town has spent its housing-fund money on, and Southold\'s total as of May 2025.',
  },
  {
    title: 'Town of Shelter Island — Chapter 52, Community Housing Fund',
    url: 'https://ecode360.com/39605917',
    covers: 'Shelter Island\'s fund law (L.L. 7-2022) and the requirement that its plan be adopted by local law on the Community Housing Board\'s advice.',
  },
  {
    title: 'Town of Shelter Island — Community Housing Board',
    url: 'https://www.shelterislandtown.gov/213/Community-Housing-Board',
    covers: 'The board that drafted the 2023 plan, and its role under the statute.',
  },
  {
    title: 'RiverheadLOCAL — "Riverhead\'s comp plan approved…" (Sept. 4, 2024)',
    url: 'https://riverheadlocal.com/2024/09/04/riverheads-comp-plan-approved-despite-public-objections-and-boards-dire-warnings-about-looming-fiscal-trouble-not-addressed-by-plan/',
    covers: 'Adoption of Riverhead\'s 2024 Comprehensive Plan Update and its housing recommendations.',
  },
  {
    title: 'RiverheadLOCAL — "Affordable housing project clears major hurdle as Town Board OKs code changes" (Sept. 4, 2025)',
    url: 'https://riverheadlocal.com/2025/09/04/affordable-housing-project-clears-major-hurdle-as-town-board-oks-code-changes-wednesday/',
    covers: 'Northville Commons and Supervisor Hubbard\'s remarks.',
  },
  {
    title: 'Town of Southold — who pays the Peconic Bay transfer tax',
    url: 'https://www.southoldtownny.gov/Faq.aspx?QID=142',
    covers: 'That the tax is paid by the grantee (the buyer) at the County Clerk\'s office.',
  },
]
