// The choices in front of the Town Board for 2027, and a scorecard that fills in
// when the tentative budget is actually filed.
//
// WHY THIS EXISTS. The prediction page answers "what happens if nothing changes."
// That is not a decision. The Board has a small set of real options, each with a
// levy number, a dollar amount it has to find, and a different legal requirement —
// and the site has already done the work behind every one of them. This gathers
// them into a choice a resident can follow, and then sets up the comparison that
// matters afterwards: what we projected, what the options cost, and what was
// actually proposed.
//
// THE POINT IS NOT TO PICK ONE. Any of these is a legitimate call. Piercing the
// cap is lawful if the Board adopts the override local law first, in public. A
// freeze paid out of reserves is lawful and affordable and also a deferral. Each
// option states what it costs and what it requires, and leaves the judgement where
// it belongs.
//
// EVERY FIGURE derives from the site's own 2027 projection and its existing
// savings catalogue rather than fresh constants, so the options move when the
// model does.

import prediction from '../public/data/budget-2027-prediction.json'
import { fullRecurringReductionPackage, personnelPolicyItems } from './spending-reduction-2027'
import { firmRecurringTotal, retirementIncentive2027 } from './close-the-gap-2027'
import { surplusAboveUpper } from './reserve-policy'

const le = prediction.levyEstimate
const cg = prediction.capGap

export const levy2026 = le.levy2026
export const levyPredicted = le.levy2027
export const capAllowed = cg.allowedLevy
export const onePercent = Math.round(levy2026 * 0.01)

/** What a given levy target requires the Board to find, against the projection. */
const mustFind = (levy: number) => Math.round(levyPredicted - levy)

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/** Share of a target the catalogued package covers, as a whole percent. */
const covers = (pool: number, target: number) => Math.round((pool / target) * 100)

// The catalogue already contains a "targeted retirement + refill" line. The Town's
// separately adopted retirement incentive works on the same mechanism, so the two
// overlap and cannot simply be added. Every combined figure below nets the overlap
// out, which is the conservative reading.
const retirementRefillInPackage =
  personnelPolicyItems.find((i) => i.id === 'retirementRefill')?.amount ?? 0

export const packageTotal = fullRecurringReductionPackage
export const firmTotal = firmRecurringTotal
export const incentiveLow = retirementIncentive2027.projectedSavingsLow
export const incentiveHigh = retirementIncentive2027.projectedSavingsHigh

/** Firm savings plus the incentive, with the double-counted refill line removed. */
export const firmPlusIncentiveLow = firmTotal - retirementRefillInPackage + incentiveLow
export const firmPlusIncentiveHigh = firmTotal - retirementRefillInPackage + incentiveHigh

export const overlapCaveat =
  `The catalogued package and the Town's adopted retirement incentive are not additive. ` +
  `${usd(retirementRefillInPackage)} of the package is itself a "targeted retirement + refill" line, ` +
  `covering the same mechanism as the incentive. Wherever the two are combined below, that overlap has ` +
  `been subtracted first — the conservative reading, and the reason some combined totals look smaller ` +
  `than a straight addition would suggest.`

export type BoardOption = {
  id: string
  name: string
  shortName: string
  levy: number
  changePct: number
  mustFind: number
  legal: string
  legalTone: 'routine' | 'override'
  whatItTakes: string
  canWeGetThere: string
  reach: 'covered' | 'tight' | 'short' | 'none'
  theCase: string
  theCost: string
  ourWork: { label: string; href: string }[]
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const zeroMustFind = mustFind(levy2026)
const decreaseLevy = Math.round(levy2026 * 0.99)
const decreaseMustFind = mustFind(decreaseLevy)

export const boardOptions: BoardOption[] = [
  {
    id: 'zero',
    name: 'A zero year — hold the levy flat',
    shortName: 'Zero',
    levy: levy2026,
    changePct: 0,
    mustFind: zeroMustFind,
    legal: 'No override needed. A flat levy is comfortably inside the cap.',
    legalTone: 'routine',
    whatItTakes:
      `Hold the levy at ${usd(levy2026)} — the same dollars the Town raised for 2026 — and close a ` +
      `${usd(zeroMustFind)} hole against the projection.`,
    canWeGetThere:
      `On paper, barely. The full catalogued savings package is ${usd(packageTotal)}, or about ` +
      `${covers(packageTotal, zeroMustFind)}% of what a freeze has to find. But that is the whole catalogue — ` +
      `it only works by taking every item, including the volatile, price-driven ones nobody can guarantee. ` +
      `The firm items alone come to ${usd(firmTotal)}, roughly ${covers(firmTotal, zeroMustFind)}% of the target. ` +
      `That distance is why a reserve draw is on the table for this option and not for the others.`,
    reach: 'tight',
    theCase:
      'Affordability, and the fact that the Town holds far more unassigned fund balance than its own policy ' +
      'calls for. Suffolk County has pledged the same thing for 2027.',
    theCost:
      'If the gap is filled from surplus rather than recurring savings, it is a deferral, not a saving: the ' +
      'same cost pressure returns in 2028 against a smaller cushion. A freeze funded by trims is durable; a ' +
      'freeze funded by fund balance buys one year.',
    ourWork: [
      { label: 'A Zero-Percent Year — the full arithmetic', href: `${base}/zero-percent-2027/` },
      { label: 'Reserves & Fund Balance — what surplus can and cannot do', href: `${base}/reserves/` },
    ],
  },
  {
    id: 'decrease',
    name: 'A decrease — cut the levy',
    shortName: 'Decrease',
    levy: decreaseLevy,
    changePct: -1,
    mustFind: decreaseMustFind,
    legal: 'No override needed.',
    legalTone: 'routine',
    whatItTakes:
      `Every 1% off the levy is about ${usd(onePercent)}, on top of the hole a freeze already has to close. ` +
      `A 1% cut therefore needs roughly ${usd(decreaseMustFind)}.`,
    canWeGetThere:
      `Not on identified recurring savings. The entire catalogued package (${usd(packageTotal)}) covers about ` +
      `${covers(packageTotal, decreaseMustFind)}% of it, leaving ${usd(decreaseMustFind - packageTotal)} ` +
      `unaccounted for. Getting there would require either service reductions this site has not costed, or a ` +
      `substantially larger draw on reserves than a freeze.`,
    reach: 'short',
    theCase:
      'The strongest possible answer on affordability, and the only option that reduces what a household ' +
      'actually pays before assessment changes.',
    theCost:
      'Spending one-time money to lower a recurring revenue base is the hardest version of the deferral ' +
      'problem: the levy has to climb back from a lower floor in 2028, and the reserves that paid for the cut ' +
      'are gone.',
    ourWork: [
      { label: '2027 Spending Reduction — the package, item by item', href: `${base}/spending-reduction-2027/` },
      { label: 'Reserves & Fund Balance', href: `${base}/reserves/` },
    ],
  },
  {
    id: 'at-cap',
    name: 'An increase, inside the cap',
    shortName: 'At cap',
    levy: capAllowed,
    changePct: 2,
    mustFind: cg.gap,
    legal: 'No override needed. This is the default lawful ceiling.',
    legalTone: 'routine',
    whatItTakes:
      `Bring the levy in at or under ${usd(capAllowed)} — the cap-allowed figure — by closing the ` +
      `${usd(cg.gap)} cap gap.`,
    canWeGetThere:
      `Yes, with room. The full package (${usd(packageTotal)}) is about ${covers(packageTotal, cg.gap)}% of the ` +
      `gap. Even the firm items alone reach ${usd(firmTotal)}, roughly ${covers(firmTotal, cg.gap)}% — short on ` +
      `their own, but the Town's adopted retirement incentive closes the remainder. Firm savings plus that ` +
      `incentive, with the overlapping refill line netted out, come to ${usd(firmPlusIncentiveLow)}–` +
      `${usd(firmPlusIncentiveHigh)} against a ${usd(cg.gap)} target.`,
    reach: 'covered',
    theCase:
      'It keeps pace with cost growth, needs no override vote, and is the least disruptive path to a lawful budget.',
    theCost:
      'It is still an increase in what residents pay, in a year when both candidates for Supervisor campaigned ' +
      'on tax restraint.',
    ourWork: [
      { label: 'Close the 2027 gap — the levers', href: `${base}/spending-reduction-2027/` },
      { label: 'Tax Cap — how the limit actually works', href: `${base}/tax-cap/` },
    ],
  },
  {
    id: 'pierce',
    name: 'An increase above the cap',
    shortName: 'Above cap',
    levy: levyPredicted,
    changePct: Number((((levyPredicted / levy2026) - 1) * 100).toFixed(1)),
    mustFind: 0,
    legal:
      'Requires a local law authorising the override, passed by 60% of the Board — three of five votes — and ' +
      'adopted BEFORE the budget itself.',
    legalTone: 'override',
    whatItTakes:
      'Nothing has to be found. This is simply what the projection says happens if current trends are carried ' +
      'into the budget with no offsetting action — which is why it is the baseline the other three are measured against.',
    canWeGetThere:
      'Not a savings question. The constraint here is procedural, not arithmetic: the override local law has to ' +
      'be adopted first, at a public meeting, on a recorded vote. Riverhead did that properly in 2023, 2024 and ' +
      '2026 — and failed to do it at all in each of the five years from 2018 to 2022.',
    reach: 'none',
    theCase:
      'If the services are worth it, the cap can be exceeded lawfully. Doing it deliberately and in public is ' +
      'the honest version of an increase.',
    theCost:
      'It is the largest increase on the table and the only one requiring a recorded override vote — which is ' +
      'precisely why it is the most visible choice a Board can make.',
    ourWork: [
      { label: 'Tax Cap — and Riverhead’s five-year override failure', href: `${base}/tax-cap/` },
      { label: 'The line-by-line projection behind this number', href: '#go-deeper' },
    ],
  },
  {
    id: 'hybrid',
    name: 'A hybrid — savings for what recurs, reserves for what does not',
    shortName: 'Hybrid',
    levy: capAllowed,
    changePct: 2,
    mustFind: cg.gap,
    legal: 'Depends where the levy lands. Anything at or under the cap needs no override.',
    legalTone: 'routine',
    whatItTakes:
      'Not a single number but a rule: recurring savings pay for recurring costs, and reserves are used only ' +
      'for one-time items. Where the levy lands then falls out of how much recurring saving the Board is ' +
      'willing to bank.',
    canWeGetThere:
      `This is the option with slack in it. Closing the ${usd(cg.gap)} cap gap out of the ${usd(packageTotal)} ` +
      `package leaves about ${usd(packageTotal - cg.gap)} of headroom — roughly ` +
      `${(((packageTotal - cg.gap) / onePercent)).toFixed(1)} percentage points of levy — which could push the ` +
      `levy below the cap without touching surplus at all. It does not reach a freeze on its own, but it does ` +
      `not depend on any single lever working perfectly either.`,
    reach: 'covered',
    theCase:
      'It is the only option that can lower the levy while leaving the reserve position intact, and the only ' +
      'one that degrades gracefully if a lever underperforms.',
    theCost:
      'It is the hardest to explain in a sentence and the easiest to quietly weaken. A hybrid that leans on ' +
      'reserves for the recurring part is a zero year wearing a different label.',
    ourWork: [
      { label: '2027 Spending Reduction — build your own package', href: `${base}/spending-reduction-2027/` },
      { label: 'A Zero-Percent Year — what surplus can and cannot do', href: `${base}/zero-percent-2027/` },
    ],
  },
]

export const leversAvailable = {
  package: packageTotal,
  firm: firmTotal,
  incentiveLow,
  incentiveHigh,
  surplusAbovePolicy: surplusAboveUpper,
  note:
    'These are identified levers, not a forecast that the Board will use them. The savings package is this ' +
    'site’s own catalogue of line trims and policy items, each with a confidence rating; "firm" counts only the ' +
    'items rated firm. The retirement incentive is the Town’s own projection of a program it has already ' +
    'adopted. The surplus figure is what sits above the top of the Town’s own reserve policy — real money, but ' +
    'one-time money.',
}

// NY Town Law fixes the calendar, and in 2026 it collides with an election.
export const calendar = {
  headline: 'The statutory clock — and why 2026 is unusual',
  steps: [
    {
      when: 'On or before September 30, 2026',
      what: 'The Supervisor, as budget officer, files the tentative budget with the Town Clerk.',
      law: 'Town Law §106(2)',
    },
    {
      when: 'Early October',
      what: 'The Town Board reviews it and may change it. Once it does, it becomes the preliminary budget.',
      law: 'Town Law §106(3)',
    },
    {
      when: 'November 3, 2026',
      what: 'General election. The Supervisor’s office is on the ballot.',
      law: '',
    },
    {
      when: 'On or before Thursday, November 5, 2026',
      what: 'Public hearing on the preliminary budget — the Thursday immediately following the general election.',
      law: 'Town Law §108',
    },
    {
      when: 'On or before November 20, 2026',
      what: 'The Board adopts the budget by resolution. It then becomes the annual budget.',
      law: 'Town Law §109(2)',
    },
  ],
  theCollision:
    'The tentative budget is due about five weeks BEFORE the election, and the ' +
    'public hearing falls two days AFTER it. So residents see a proposed levy while they are voting, but get ' +
    'to comment on the Board’s revised version only once the result is known. That is the ordinary operation ' +
    'of the statute, not anything unusual the Town has done — but it does mean this year’s tentative budget ' +
    'is a campaign document as well as a fiscal one.',
  overrideNote:
    'If the Board intends to exceed the cap it must adopt the override local law BEFORE adopting the budget. ' +
    'That sequencing is the step Riverhead missed every year from 2018 through 2022.',
}

// The scorecard. `actual` stays null until the tentative budget is filed; the page
// renders an explicit awaiting state rather than a zero or a blank.
export type ScorecardRow = {
  metric: string
  basis: string
  ourEstimate: number | null
  estimateLabel?: string
  actual: number | null
  note: string
}

const generalFund2027 =
  prediction.byFund.find((f) => f.fundCode === 'A01')?.v2027 ?? 0

export const release = {
  status: 'awaiting' as 'awaiting' | 'filed',
  dueBy: 'September 30, 2026',
  whatToLookFor: [
    'The levy line first, not the appropriations total. Appropriations can rise while the levy holds if non-tax revenue or fund balance is carrying the difference.',
    'Whether an override local law appears on an agenda BEFORE the budget resolution. If it does, the Board is planning to exceed the cap; if it does not, the budget has to come in at or under the limit.',
    'How much appropriated fund balance is used. That is the single number separating a durable freeze from a deferred one.',
    'Whether revenue estimates move toward what the Town has actually been collecting. In 2023 the General Fund took in $4.36 million more than its own final revenue budget assumed, so a materially higher revenue estimate would be evidence of a budget tuned to reality rather than to tradition.',
  ],
}

export const scorecard: ScorecardRow[] = [
  {
    metric: 'Town-wide tax levy',
    basis: 'All funds',
    ourEstimate: levyPredicted,
    actual: null,
    note: 'Our projection carries current trends forward with no policy change. The distance between this and the filed number is the size of the choice the administration made.',
  },
  {
    metric: 'Levy change from 2026',
    basis: 'Percent',
    ourEstimate: null,
    estimateLabel: `+${le.levyIncreasePct}%`,
    actual: null,
    note: 'Compare against the four options above — which one did the filed budget actually land on?',
  },
  {
    metric: 'Total appropriations',
    basis: 'All operating funds',
    ourEstimate: prediction.totals.appropriations2027,
    actual: null,
    note: `Our line-by-line projection across ${prediction.totals.lineItems.toLocaleString()} lines.`,
  },
  {
    metric: 'General Fund appropriations',
    basis: 'A01 only',
    ourEstimate: generalFund2027,
    actual: null,
    note: 'The fund carrying the police department and most employee benefits — where the cost pressure actually sits.',
  },
  {
    metric: 'Appropriated fund balance',
    basis: 'All funds',
    ourEstimate: null,
    estimateLabel: 'Not forecast',
    actual: null,
    note: 'We do not project this — it is a policy choice, not a trend. It is the number telling you whether a low levy was funded by savings or by surplus.',
  },
  {
    metric: 'Cap override local law adopted',
    basis: 'Yes / no',
    ourEstimate: null,
    estimateLabel: 'Projection pierces the cap',
    actual: null,
    note: 'Required before the budget if the levy exceeds the cap. Its presence or absence is a fact, not an estimate.',
  },
]

export const accountability = {
  headline: 'What this measures — and what it does not',
  fair:
    'Both candidates for Supervisor have put tax restraint on the record. The incumbent, Jerome (Jerry) ' +
    'Halpin, campaigns on keeping "a tight lid on Town spending" and on growing new tax dollars through ' +
    'economic development instead of raising the levy. His challenger, Council Member Kenneth Rothwell, names ' +
    'lowering the cost of taxes as the campaign\u2019s stated top issue. Under Town Law the Supervisor writes the ' +
    'tentative budget and the Board adopts it \u2014 so this year one of them files the proposal and the other ' +
    'votes on it. The filed budget is the first moment either stated intention becomes a number with a date on it.',
  method:
    'The comparison is between three things: what this site projected from trend alone, what each of the ' +
    'Board’s realistic options would cost, and what was actually filed. A budget close to our projection means ' +
    'trends were carried forward. A budget materially below it means a deliberate choice was made — and the ' +
    'interesting question becomes which lever paid for it.',
  limits:
    'This measures a proposal against arithmetic, not against what is right. A higher levy funding something ' +
    'residents want is not a failure, and a low levy paid for by drawing down reserves is not automatically a ' +
    'success. The page reports which happened and leaves the verdict to the reader. It also cannot see intent: ' +
    'a budget can match a promise by coincidence or miss one for reasons outside the Board’s control, and ' +
    'neither shows up in a number.',
}

export const sources = [
  {
    title: 'NY Town Law §106 — Preparation and filing of tentative and preliminary budgets',
    url: 'https://newyork.public.law/laws/n.y._town_law_section_106',
    covers: 'The September 30 deadline for the tentative budget, and the Board review that turns it into the preliminary budget.',
  },
  {
    title: 'NY Town Law §108 — Public hearing',
    url: 'https://newyork.public.law/laws/n.y._town_law_section_108',
    covers: 'The hearing must be held on or before the Thursday immediately following the general election.',
  },
  {
    title: 'NY Town Law §109 — Final revision and adoption',
    url: 'https://newyork.public.law/laws/n.y._town_law_section_109',
    covers: 'Adoption by resolution no later than November 20.',
  },
  {
    title: 'Town of Riverhead — Financial Reports',
    url: 'https://www.townofriverheadny.gov/206/Financial-Reports',
    covers: 'Where the tentative, preliminary and adopted budgets are published when filed.',
  },
]
