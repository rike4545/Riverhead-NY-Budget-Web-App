// Fund balance policies: Riverhead's own, as adopted, and the written rules of
// nearby towns, each read from the town's newest audit, budget or policy
// document. Also what the three neighbors with published projections hold.
//
// Self-contained, with no imports, so web/scripts/verify-fund-balance-policies.mjs
// can load it directly. That script checks every quoted phrase and every figure
// here against the text of the page it cites, which is kept in
// etl/data/policies/fund-balance-policies.json under the `excerpt` key.

const civic = (fileId: number) =>
  `https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=${fileId},plainText=false)`

/** A cited document. `excerpt` names its entry in etl/data/policies/fund-balance-policies.json; `pages` are PDF page numbers. */
export type PolicySource = { label: string; url: string; excerpt: string; pages: readonly string[] }

// THE TOWN'S POLICY, AS ADOPTED. Resolution 918 of December 20, 2011 is the
// policy in force. It amends Resolution 1101 of December 5, 2006 for GASB 54
// and keeps its 15% floor on the General Fund's TOTAL balance, including
// reserves, and its three permitted uses for money above the floor, word for
// word. It drops one sentence: the 2006 promise that after a draw below 15% the
// Town "would immediately begin" rebuilding to it. Neither version sets a
// ceiling or any other percentage. This site used to describe "a 15% minimum
// and 20% upper target"; no Town record says 20% except the 2006 policy's note
// that the balance at the end of 2005 was "in excess of 20%" — a description,
// not a target. A search of every Board agenda from 2007 through September
// 2026, and every set of minutes from 2012, found no later resolution changing
// the policy.
export const FUND_BALANCE_POLICY = {
  resolution: '2011-918',
  adopted: 'December 20, 2011',
  vote: '5–0',
  floorPercent: 0.15,
  floorText:
    'The Town Board will make all reasonable efforts to maintain a total fund balance including reserves in its General Fund at the end of each fiscal year equal to no less than 15% of its total operating budget.',
  usesIntro: 'Fund balance in the General Fund above 15% may be appropriated for the following purposes:',
  uses: [
    'To reduce the subsequent year’s property taxes.',
    'For one-time capital expenditures.',
    'For emergencies caused by natural occurrences such as hurricanes or blizzards.',
  ],
  reviewText: 'Fund balances and adequate reserves should be managed and reviewed on a regular basis.',
  /** All the policy says about going below the floor. */
  belowFloorText:
    'If an emergency or a need were to occur that necessitated the appropriation of funds that would result in reducing the projected fund balance in the General Fund below 15% of operating expenditures, a resolution of the Town Board would be adopted to approve such appropriation.',
  /** The 2006 policy's next sentence, which the 2011 rewrite dropped. */
  droppedRebuildText:
    'Subsequent to such appropriation, the Town would immediately begin the process of reducing expenditures or raising revenues in order to restore the unreserved/unappropriated fund balance in the General Fund to 15% of operating expenditures.',
  /** What the 2011 rewrite added for GASB 54, in its own words. */
  gasb54: {
    spendingOrder:
      'When committed, assigned and unassigned funds are available for expenditure, committed funds should be spent first, assigned funds second, and unassigned funds last.',
    commit: 'Any funds set aside as Committed Fund Balance requires the passage of a resolution by a simple majority vote.',
    assign:
      'Upon passage of a budget resolution, where fund balance is used as a source to balance the budget, the Financial Administrator shall record the amount of Assigned Fund Balance.',
    shortfall:
      'In the event of a projected revenue shortfall, it is the responsibility of the Financial Administrator to report the projections to the Town’s Board on, at a minimum, an annual basis and shall be recorded in the minutes.',
  },
  history: [
    { date: 'December 5, 2006', resolution: '2006-1101', outcome: 'Adopted 4–0', note: 'The first policy: a 15% floor, three uses for money above it, and a promise that after any draw below 15% the Town “would immediately begin” rebuilding to it.' },
    { date: 'November 15, 2011', resolution: '2011-833', outcome: 'Tabled 5–0', note: 'A rewrite for GASB 54, tabled after public comment. It proposed a 10% unrestricted minimum and let the Financial Administrator assign fund balance.' },
    { date: 'December 20, 2011', resolution: '2011-918', outcome: 'Adopted 5–0', note: 'Amends the 2006 policy for GASB 54. It keeps the 15% floor and the three uses, adds who may set money aside and the order it is spent, and drops the promise to rebuild. The policy in force.' },
  ],
  sources: [
    { label: 'Resolution 918 and the policy text (Dec. 20, 2011 agenda packet, pp. 16–21)', url: civic(7270) },
    { label: 'Minutes, Dec. 20, 2011 (adopted 5–0, pp. 1357–1358)', url: civic(7271) },
    { label: 'Minutes, Nov. 15, 2011 (Resolution 833 tabled, pp. 1190–1191)', url: civic(6773) },
    { label: 'Resolution 1101 and the 2006 policy (Dec. 5, 2006 agenda packet, pp. 72–74)', url: civic(7064) },
    { label: 'Minutes, Dec. 5, 2006 (adopted 4–0, pp. 47–48)', url: civic(7065) },
  ],
  /** Where the build finds the two policies' text. */
  excerpts: { current: 'riverhead-2011', original: 'riverhead-2006' },
} as const

/** One written rule, in plain words, with the exact phrases it rests on. */
export type WrittenPolicy = {
  town: string
  /** How the rule is adopted, and how hard it is to change. */
  form: string
  /** The General Fund minimum as a share of the budget; a range is [low, high]. */
  minimum: number | readonly [number, number]
  minimumText: string
  /** What money counts toward the minimum. */
  counts: string
  /** What the rule says if the balance falls below the minimum; null if the published text does not say. */
  ifBelow: string | null
  /** What the rule says about money above the minimum; null if the published text does not say. */
  aboveMinimum: string | null
  /** When the rule requires the balance rebuilt, in a few words; absent if it does not. */
  rebuildWithin?: string
  /** True when the rule directs where surplus goes, rather than only permitting uses. */
  directsSurplus?: boolean
  otherFunds?: string
  note?: string
  /** Exact phrases from the source, checked at build time. */
  quotes: readonly string[]
  source: PolicySource
  own?: boolean
  guidance?: boolean
}

export const RIVERHEAD_POLICY: WrittenPolicy = {
  town: 'Riverhead',
  form: 'Board resolution (Resolution 918 of 2011)',
  minimum: FUND_BALANCE_POLICY.floorPercent,
  minimumText: '15% of the total operating budget',
  counts: 'Total fund balance, reserves included',
  ifBelow: 'A Board resolution approves the draw. Nothing requires rebuilding: the 2006 policy did, and the 2011 rewrite dropped it.',
  aboveMinimum: '“May” be used to cut the next year’s taxes, for one-time capital or for natural emergencies. Nothing requires it, and there is no ceiling.',
  quotes: [FUND_BALANCE_POLICY.floorText, FUND_BALANCE_POLICY.belowFloorText, FUND_BALANCE_POLICY.usesIntro],
  source: { label: 'Resolution 918 of 2011, agenda packet pp. 16–21', url: civic(7270), excerpt: 'riverhead-2011', pages: ['18', '19', '20', '21'] },
  own: true,
}

export const PEER_POLICIES: readonly WrittenPolicy[] = [
  {
    town: 'Brookhaven',
    form: 'Board resolution; a Town law directs surpluses',
    minimum: 0.25,
    minimumText: '25% of the General Fund’s budgeted spending',
    counts: 'Total fund balance, less nonspendable items such as inventory',
    ifBelow: 'A Board resolution is required, and the Board “will immediately take measures to restore fund balance over a three-year period.”',
    aboveMinimum:
      'When the General Fund meets its minimum and revenue beats spending, Town law splits the excess: 50% stays unassigned, 10% each goes to the solid waste, vehicle and capital reserves, and 20% to an environmental preservation capital reserve.',
    otherFunds: '20% for the outside-village fund, 10% highway, 7% special districts.',
    rebuildWithin: 'over three years',
    directsSurplus: true,
    quotes: [
      'minimum fund balance, exclusive of nonspendable fund balance, equal to no less than a defined percentage of the total budgeted expenditures',
      'General Fund 25%',
      'Town Outside Village Fund 20%',
      'Highway Fund 10%',
      'Special Districts Funds 7%',
      'a Town Board resolution is required',
      'the Town Board will immediately take measures to restore fund balance over a three-year period',
      'In accordance with Local Law 18b-4',
      'Fifty percent allocated to unassigned fund balance',
      'Ten percent allocated to the solid waste management reserve',
      'Ten percent allocated to the motor vehicle reserve',
      'Ten percent allocated to the capital projects reserve',
      'Twenty percent shall be transferred to the Joseph Macchia Environmental Preservation Capital Reserve Fund',
    ],
    source: { label: 'Brookhaven 2025 audited financial statements, PDF p. 48', url: 'https://www.brookhavenny.gov/ArchiveCenter/ViewFile/Item/3449', excerpt: 'brookhaven-2025', pages: ['48'] },
  },
  {
    town: 'East Hampton',
    form: 'Town policy, first adopted in 2002 and updated in 2023',
    minimum: 0.2,
    minimumText: 'A goal of 20% in each major fund',
    counts: 'Overall fund balance',
    ifBelow: null,
    aboveMinimum: null,
    otherFunds: 'The same 20% goal for the part-town, highway, refuse and garbage, and airport funds.',
    note: 'From the Town’s summary in its 2025 annual report; the 2023 text is not published with it.',
    quotes: [
      'The Town’s fund balance policy was first adopted in 2002.',
      'a goal that a 20% overall positive fund balance be maintained in each of the Town’s major funds',
      'The Town updated its Fund Balance Policy in 2023.',
    ],
    source: { label: 'East Hampton 2025 annual financial report, PDF p. 14', url: 'https://www.ehamptonny.gov/ArchiveCenter/ViewFile/Item/289', excerpt: 'easthampton-2025', pages: ['14'] },
  },
  {
    town: 'Southampton',
    form: 'Town Code, by local law (2013, amended 2015); changing it takes a public hearing',
    minimum: 0.17,
    minimumText: '17% of the next year’s budget: 10% held in a reserve, plus at least 7% unallocated',
    counts: 'A contingency and tax stabilization reserve, plus unallocated fund balance',
    ifBelow: null,
    aboveMinimum:
      'A second local law (2017, amended 2021) requires at least 75% of the amount by which a year ends above the budget’s projection to go to capital projects in place of borrowing.',
    otherFunds: 'At least 7% unallocated in district, enterprise and part-town funds.',
    directsSurplus: true,
    quotes: [
      'no less than 10% of the total respective ensuing year’s operating budget, plus maintain at least 7% of the unallocated fund balance, for a total of 17%',
      'The Town Board by resolution shall establish a contingency and tax stabilization reserve',
      '7% of the total respective ensuing year’s budgets for each allowable fund of the special district, enterprise funds and part-town operating funds',
      'a public hearing was held',
      'The Town Board shall allocate at least 75% of the difference between the prior year’s adopted budget projections and the actual fund balance reported by the Comptroller',
      'to offset the Town’s capital project borrowing in the current fiscal year',
    ],
    source: { label: 'Southampton 2026 Financial Policies (Town Code Chapter 8), PDF pp. 19–23 and 55–56', url: 'https://www.southamptontownny.gov/DocumentCenter/View/42516/2026-Financial-Policies---Adopted', excerpt: 'southampton-2026', pages: ['19', '20', '21', '22', '23', '55', '56'] },
  },
  {
    town: 'Southold',
    form: 'Board resolution',
    minimum: 0.1,
    minimumText: '10% of General Fund spending',
    counts: 'Unassigned fund balance only',
    ifBelow: 'The Board “will develop a plan to replenish the fund balance to the established minimum level within the current or ensuing fiscal year.”',
    aboveMinimum: null,
    rebuildWithin: 'within the current or next year',
    quotes: [
      'minimum unassigned fund balance in the general fund equal to 10% of general fund expenditures',
      'the Town’s Board will develop a plan to replenish the fund balance to the established minimum level within the current or ensuing fiscal year',
    ],
    source: { label: 'Southold 2024 audited financial statements, PDF p. 46', url: 'https://southoldtownny.gov/Archive/ViewFile/Item/131', excerpt: 'southold-2024', pages: ['46'] },
  },
  {
    town: 'Huntington',
    form: 'Financial policy printed in each adopted budget, which says the policies are reviewed annually',
    minimum: 0.1,
    minimumText: '10% of the operating budget, not counting open space spending',
    counts: 'Unreserved, undesignated fund balance, not counting reserve funds',
    ifBelow:
      'Going below takes a Board resolution; then “the Town would immediately begin the process of reducing expenditures or raising revenues in order to restore the unreserved fund balance to 10%.”',
    aboveMinimum:
      'May be used to stabilize the next year’s taxes, for one-time capital, natural emergencies or unforeseen operating costs. Separate reserves cover employee benefits, pensions, debt, snow and ice, and claims.',
    rebuildWithin: 'starting immediately',
    quotes: [
      'reviewed annually',
      'equal to 10% of its total operating budget',
      'exclusive of the Open Space Budgeted Expenditures',
      'Such unreserved fund balance will be exclusive of any reserve funds maintained by the Town.',
      'the Town would immediately begin the process of reducing expenditures or raising revenues in order to restore the unreserved fund balance to 10%',
      'Stabilizing subsequent year’s property taxes',
      'Unforeseen operating expenditures',
      'Employee Benefit Reserve, Pension Contribution Reserve, Debt Reserve, Snow & Ice Reserve, and a Judgment & Claims Reserve',
    ],
    source: { label: 'Huntington 2025 Adopted Budget, Financial Policies, PDF pp. 274–275', url: 'https://www.huntingtonny.gov/filestorage/13753/13757/17478/17482/2025_Adopted_Budget_Web_(12.9).pdf', excerpt: 'huntington-2025', pages: ['274', '275'] },
  },
  {
    town: 'Smithtown',
    form: 'Board resolution',
    minimum: [0.05, 0.1],
    minimumText: '5% to 10% of the next year’s budgeted spending and outgoing transfers',
    counts: 'Unrestricted fund balance: committed, assigned and unassigned',
    ifBelow: 'It “should be replenished within five years.”',
    aboveMinimum: null,
    note: 'The Supervisor may assign fund balance; a simple majority of the Board can change an assignment.',
    rebuildWithin: 'within five years',
    quotes: [
      'minimum unrestricted (the total of committed, assigned and unassigned) fund balance ranging from 5% to 10% of the subsequent year\'s budgeted expenditures and outgoing transfers',
      'Unrestricted fund balance below the minimum should be replenished within five years.',
      'Authority to assign fund balance for specific purposes is given to the Town Supervisor.',
    ],
    source: { label: 'Smithtown 2025 audited financial statements, PDF p. 41', url: 'https://smithtownny.gov/DocumentCenter/View/9726/Town-of-Smithtown-NY-2025-Financial-StatementsPDF', excerpt: 'smithtown-2025', pages: ['41'] },
  },
]

export const GFOA_GUIDANCE: WrittenPolicy = {
  town: 'GFOA guidance',
  form: 'Best practice of the Government Finance Officers Association, approved 2015',
  minimum: 2 / 12,
  minimumText: 'At least two months of regular General Fund revenue or spending, about 17%',
  counts: 'Unrestricted fund balance',
  ifBelow: '“Generally, governments should seek to replenish their fund balances within one to three years of use.”',
  aboveMinimum:
    'Where more is held than the policy requires, “governments should consider a policy as to how this would be addressed,” and “use of those funds should be prohibited as a funding source for ongoing recurring expenditures.”',
  rebuildWithin: 'within one to three years',
  quotes: [
    'no less than two months of regular general fund operating revenues or regular general fund operating expenditures',
    'Generally, governments should seek to replenish their fund balances within one to three years of use.',
    'governments should consider a policy as to how this would be addressed',
    'use of those funds should be prohibited as a funding source for ongoing recurring expenditures',
    'September 30, 2015',
  ],
  source: { label: 'GFOA, Fund Balance Guidelines for the General Fund', url: 'https://www.gfoa.org/materials/fund-balance-guidelines-for-the-general-fund', excerpt: 'gfoa', pages: ['web'] },
  guidance: true,
}

/** "A", "A and B", "A, B and C". */
export const nameList = (names: readonly string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
export const countWord = (n: number) => COUNT_WORDS[n] ?? String(n)
const wholePct = (n: number) => `${Math.round(n * 100)}%`
/** A policy's minimum as printed: "25%", or "5–10%" for a range. */
export const minimumLabel = (p: WrittenPolicy) =>
  typeof p.minimum === 'number' ? wholePct(p.minimum) : `${Math.round(p.minimum[0] * 100)}–${wholePct(p.minimum[1])}`
const minimumLow = (p: WrittenPolicy) => (typeof p.minimum === 'number' ? p.minimum : p.minimum[0])

/** The highest share a policy can require: the top of a range. */
export const policyMinimumTop = (p: WrittenPolicy) => (typeof p.minimum === 'number' ? p.minimum : p.minimum[1])

// ── What the neighbors hold ──────────────────────────────────────────────────
// One measure for every town: the total General Fund balance at the end of
// 2025, as each town's 2026 budget projects it, over its 2026 General Fund
// budget. It is the only measure all three budgets report, so Riverhead is set
// beside them on its audited total. Brookhaven's budget also reports the
// narrower measure this site tests for Riverhead, kept as `narrower`.
export type PeerBalance = {
  town: string
  total: number
  /** The pieces that add to `total`, where the budget reports it in parts. */
  parts?: readonly { label: string; amount: number }[]
  budget: number
  budgetParts?: readonly { label: string; amount: number }[]
  narrower?: { label: string; amount: number }
  detail: string
  source: PolicySource
}

export const PEER_BALANCES: readonly PeerBalance[] = [
  {
    town: 'Brookhaven',
    total: 95_740_864,
    budget: 154_611_894,
    narrower: { label: 'unappropriated and unreserved', amount: 60_023_184 },
    detail: 'General Town Wide fund. The 2026 budget shows the same total entering 2025 and at the end of 2026.',
    source: { label: 'Brookhaven 2026 Adopted Operating Budget, 2026 Estimated Fund Balances, PDF p. 16', url: 'https://www.brookhavenny.gov/DocumentCenter/View/38793/Town-of-Brookhaven-2026-Adopted-Operating-Budget---Web-Version', excerpt: 'brookhaven-2026-budget', pages: ['16'] },
  },
  {
    town: 'East Hampton',
    total: 48_743_724,
    parts: [
      { label: 'whole town', amount: 29_709_031 },
      { label: 'part town', amount: 19_034_693 },
    ],
    budget: 86_782_601,
    budgetParts: [
      { label: 'whole town', amount: 48_230_180 },
      { label: 'part town', amount: 38_552_421 },
    ],
    detail: 'Whole-town ($29,709,031) and part-town ($19,034,693) General Fund balances projected for the end of 2025, against the two parts’ combined 2026 appropriations.',
    source: { label: 'East Hampton 2026 Adopted Budget, PDF pp. 15 and 18', url: 'https://www.ehamptonny.gov/ArchiveCenter/ViewFile/Item/274', excerpt: 'easthampton-2026-budget', pages: ['15', '18'] },
  },
  {
    town: 'Smithtown',
    total: 24_449_593,
    budget: 66_169_203,
    detail: 'General Fund balance projected for the end of 2025. The budget document prints tentative-stage figures.',
    source: { label: 'Smithtown 2026 Adopted Budget document, Appendices A and B, PDF pp. 147–148', url: 'https://smithtownny.gov/DocumentCenter/View/9030/26-Adopted--BudgetFinalPDF', excerpt: 'smithtown-2026-budget', pages: ['147', '148'] },
  },
]

/** Brookhaven's narrower measure, the one comparable with Riverhead's unassigned balance. */
export const brookhavenNarrowPercent = (() => {
  const b = PEER_BALANCES.find((p) => p.town === 'Brookhaven')!
  return b.narrower!.amount / b.budget
})()

/** How Riverhead's rule compares with its neighbors', computed from the rows above. */
export const policyComparisonReading = (() => {
  const byLow = [...PEER_POLICIES].sort((a, b) => minimumLow(a) - minimumLow(b))
  const lowest = byLow[0]
  const highest = [...PEER_POLICIES].sort((a, b) => policyMinimumTop(b) - policyMinimumTop(a))[0]
  const rebuild = PEER_POLICIES.filter((p) => p.rebuildWithin)
  const directs = PEER_POLICIES.filter((p) => p.directsSurplus)
  const own = FUND_BALANCE_POLICY.floorPercent
  const middle = minimumLow(lowest) < own && own < policyMinimumTop(highest)
  return (
    `Riverhead’s ${minimumLabel(RIVERHEAD_POLICY)} ${middle ? 'sits in the middle of' : 'compares with'} its neighbors’ minimums, which run from ${lowest.town}’s ${minimumLabel(lowest)} to ${highest.town}’s ${minimumLabel(highest)}. ` +
    `What its policy lacks, several of theirs have. ${countWord(rebuild.length)} of the ${countWord(PEER_POLICIES.length).toLowerCase()} say how the balance gets rebuilt after a draw below the minimum: ` +
    `${nameList(rebuild.map((p) => `${p.town} ${p.rebuildWithin}`))}. ` +
    `${countWord(directs.length)} direct by law what happens to a surplus: ${nameList(directs.map((p) => p.town))}. ` +
    `GFOA’s guidance asks for both: a rebuild ${GFOA_GUIDANCE.rebuildWithin}, and a policy for money above the minimum.`
  )
})()
