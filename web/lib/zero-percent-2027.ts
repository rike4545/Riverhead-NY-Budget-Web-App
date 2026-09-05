// What a zero-percent General Fund year would actually take.
//
// Suffolk County's executive announced on September 3, 2026 that he would not
// raise general fund taxes for 2027. The obvious resident question is whether
// Riverhead could do the same. This file answers it from the site's own
// pipeline rather than fresh constants: the 2026 adopted General Fund, the
// 2027 projection, the audited fund balance, and the savings package already
// catalogued on the spending-reduction page.
//
// ONE DISTINCTION THE WHOLE PAGE TURNS ON. Suffolk's general fund is one fund
// among several, and its police district is levied separately from towns that
// are not in it — Riverhead is not. Riverhead's police department sits inside
// the very General Fund a freeze would apply to. The comparison is real but the
// two "general funds" are not the same animal, and the page says so.

import prediction from '../public/data/budget-2027-prediction.json'
import taxBill from '../public/data/tax-bill.json'
import { appropriations, unassignedFundBalance, policyMinimumPercent, policyUpperPercent, targetUpper, surplusAboveUpper } from './reserve-policy'
import { capGap2027, firmRecurringTotal, retirementIncentive2027 } from './close-the-gap-2027'
import { personnelPolicyTotal, operationalTotal, supplementTrimTotal, fullRecurringReductionPackage } from './spending-reduction-2027'
import { generalFund } from './general-fund'

const gfFund = (prediction.byFund as { fundCode: string; v2026: number; v2027: number; delta: number; pct: number }[])
  .find((f) => f.fundCode === 'A01')!

// The number a freeze has to absorb: the General Fund's own projected cost growth.
export const generalFund2026 = appropriations
export const generalFund2027 = gfFund.v2027
export const costGrowth = gfFund.delta
export const costGrowthPct = gfFund.pct

export const suffolk = {
  who: 'Suffolk County Executive Ed Romaine, third State of the County address, September 3, 2026',
  pledge:
    '“Affordability is currently at the top of every resident’s mind in Suffolk County. With that, I am announcing that I will not be raising general fund taxes for 2027. There will be no increase for Suffolk County residents.”',
  dateNote:
    'The County’s own headline on that release says 2026 while the text says 2027. The address was delivered in September 2026 and concerns the 2027 budget, so 2027 is the operative year.',
  how:
    'The County credited more than $700 million in reserves, five bond upgrades since 2024, improved liquidity and conservative budgeting.',
  theCatch:
    'A county general fund is one fund among several. Suffolk’s police district is a separate fund levied on the towns inside it, and the five East End towns — Riverhead among them — are not in it and do not pay that levy. So “no general fund increase” at the county level leaves a great deal of county spending outside the promise. Riverhead’s General Fund is not structured that way.',
}

// Where Riverhead is actually heading, before anyone decides anything.
export const trajectory = {
  rateRows: [
    { label: 'General Fund rate', y2025: taxBill.rates2025.generalFund, y2026: taxBill.rates2026.generalFund },
    { label: 'Highway', y2025: taxBill.rates2025.highway, y2026: taxBill.rates2026.highway },
    { label: 'Street lighting', y2025: taxBill.rates2025.streetLighting, y2026: taxBill.rates2026.streetLighting },
    { label: 'Total town-wide', y2025: taxBill.rates2025.totalTownWide, y2026: taxBill.rates2026.totalTownWide },
  ],
  rateSource: taxBill.rateSource,
  levyHistory: generalFund.rows
    .filter((r) => r.taxLevy !== null && r.year >= 2021)
    .map((r) => ({ year: r.year, levy: r.taxLevy as number })),
  gapNote:
    'There is no 2023 row. The long-run General Fund history behind this site is parsed from the Town’s published adopted budgets and no 2023 figure was extracted, so the change shown against 2024 covers two years rather than one — about 4.9% a year compounded, not 9.97% in a single year. It is labelled that way below rather than left to look like an annual jump.',
  note:
    'These are rates per $1,000 of assessed value from the Town’s own adopted rate table, not levies. A rate can move differently from the levy because the assessment roll moves too. Both are shown because residents feel the rate and the cap governs the levy.',
}

// The arithmetic of a freeze.
export const theAsk = {
  headline: 'A zero-percent General Fund year has to absorb about $3.5 million',
  detail:
    'The Town’s own 2027 projection puts General Fund appropriations at $72,627,474 against $69,113,159 adopted for 2026 — a rise of $3,514,315, or 5.1%. Holding the levy flat does not make that cost disappear; it means every dollar of it has to come from somewhere that is not the property tax.',
  versusCap:
    'For scale, simply getting under the 2% cap needs $2,316,256. A freeze is about 52% harder than cap compliance, and the page on closing the cap gap is the shallower version of this same problem.',
  precision:
    'One honest caveat about the number. $3,514,315 is projected growth in General Fund appropriations, which is what a flat levy must offset. It is not itself a levy figure: the Town does not publish a General Fund levy separately from the town-wide levy in the material behind this site, so the appropriations change is used as the closest available proxy.',
}

export type Lever = {
  name: string
  amount: number | null
  display: string
  covers: string
  kind: 'recurring' | 'one-time' | 'legal'
  detail: string
  catch: string
}

export const levers: Lever[] = [
  {
    name: 'The savings package already catalogued',
    amount: fullRecurringReductionPackage,
    display: `${fullRecurringReductionPackage.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`,
    covers: `${Math.round((fullRecurringReductionPackage / gfFund.delta) * 100)}% of the $3.5M`,
    kind: 'recurring',
    detail: `Personnel and policy items ${personnelPolicyTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}, operational control ${operationalTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}, and sourced line trims ${supplementTrimTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}. This is the same package the spending-reduction page builds, taken in full.`,
    catch: `Taken in full it just covers the cost growth, with no margin. The firmest subset alone — the part that excludes volatile fuel, energy and capital-timing items — is ${firmRecurringTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}, which is well short on its own.`,
  },
  {
    name: 'The retirement incentive, already adopted',
    amount: retirementIncentive2027.projectedSavingsHigh,
    display: `${retirementIncentive2027.projectedSavingsLow.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} – ${retirementIncentive2027.projectedSavingsHigh.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`,
    covers: `up to ${Math.round((retirementIncentive2027.projectedSavingsHigh / gfFund.delta) * 100)}% of the $3.5M`,
    kind: 'recurring',
    detail: `Approved unanimously on ${retirementIncentive2027.approved.split(' — ')[0]} by resolutions ${retirementIncentive2027.resolutions}. ${retirementIncentive2027.eligibleTotal} employees were eligible.`,
    catch: retirementIncentive2027.note,
  },
  {
    name: 'Fund balance above the Town’s own policy ceiling',
    amount: surplusAboveUpper,
    display: `${surplusAboveUpper.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`,
    covers: `${(surplusAboveUpper / gfFund.delta).toFixed(1)}× the $3.5M`,
    kind: 'one-time',
    detail: `Unassigned fund balance was ${unassignedFundBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} at December 31, 2025 — ${((unassignedFundBalance / appropriations) * 100).toFixed(1)}% of appropriations against a policy range of ${policyMinimumPercent * 100}–${policyUpperPercent * 100}%. Everything above the ${policyUpperPercent * 100}% ceiling of ${targetUpper.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} could fund a freeze without the Town breaching its own rule. This is the closest Riverhead analogue to the reserves Suffolk leaned on.`,
    catch:
      'One-time money against recurring cost. On its own it buys roughly four and a half zero-percent years before the balance reaches the policy ceiling — and each of those years hands a larger structural gap to the next budget on a smaller cushion.',
  },
  {
    name: 'Non-property-tax revenue',
    amount: null,
    display: 'dollar for dollar',
    covers: 'unbounded in principle',
    kind: 'recurring',
    detail:
      'State aid, mortgage recording tax, fees and interest earnings offset the levy one for one. Every additional $1,000,000 of non-tax revenue is $1,000,000 the levy does not have to raise.',
    catch:
      'Mortgage tax and interest earnings are the volatile ones — they rise and fall with rates and the housing market, and budgeting optimistically on them is how gaps get hidden rather than closed.',
  },
  {
    name: 'The cap’s legal pension exclusion',
    amount: prediction.capGap.pensionExclusion.totalEstimate,
    display: `${prediction.capGap.pensionExclusion.totalEstimate.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`,
    covers: 'raises the legal ceiling, not the freeze',
    kind: 'legal',
    detail:
      'The police retirement system’s contribution rate rose 2.8 points for 2027, 0.8 points past the two-point threshold, which makes part of that growth legally excludable from the cap.',
    catch:
      'This helps with the cap, not with a freeze. Excluding cost from the cap calculation raises how much the Town may lawfully levy; it does not reduce what the General Fund has to spend.',
  },
]

// Why the same promise is structurally harder here than at the county.
export const whyHarder = {
  headline: 'Riverhead’s General Fund is mostly police and benefits',
  shares: [
    { label: 'Employee benefits and debt', amount: 25_507_319, pct: 36.9 },
    { label: 'Public safety', amount: 24_761_480, pct: 35.8 },
    { label: 'General government', amount: 14_255_750, pct: 20.6 },
    { label: 'Everything else', amount: 4_588_610, pct: 6.6 },
  ],
  detail:
    'Public safety and employee benefits together are 72.7% of the 2026 General Fund. Suffolk can hold its general fund flat in part because its largest public-safety cost sits in a separate district fund that Riverhead does not pay into and does not control. Riverhead’s police department sits inside the fund a freeze would apply to.',
  contracts:
    'The timing compounds it. Both the PBA and SOA agreements expire on December 31, 2026 with no successor public. A zero-percent pledge for 2027 would be made while the Town’s two largest bargaining units are unsettled, which is the year in which a freeze is least within the Board’s control.',
  sourceNote:
    'Shares are computed from the 848 budget lines behind the 2027 projection, grouped by the first digit of the Uniform System of Accounts function code.',
}

export const verdict = {
  oneYear:
    'For a single year, yes, and comfortably. The fund balance above the Town’s own policy ceiling covers the cost growth more than four times over, so a 2027 freeze could be adopted without breaching the reserve policy and without cutting a service.',
  durable:
    'For a durable freeze, it is much tighter. The recurring levers — the full savings package plus the retirement incentive — do reach the number, but only by taking nearly all of the package including its least firm items, and by settling two police contracts inside a flat envelope.',
  theRealPoint:
    'The honest framing is the one this site already applies to the cap gap: a freeze paid for out of surplus is not a saving, it is a deferral. It converts a 5.1% problem in 2027 into a larger one in 2028 with less cushion behind it. That may still be the right call — affordability is a real argument and the Town is holding far more than its policy requires — but it should be adopted as a deliberate choice rather than presented as costless.',
}

export const sources = [
  {
    title: 'Suffolk County — County Executive Romaine announces no general fund tax increase (September 3, 2026)',
    url: 'https://suffolkcountyny.gov/News/ArtMID/583/ArticleID/15376/Suffolk-County-Executive-Ed-Romaine-Announces-No-General-Fund-Tax-Increase-in-2026-State-of-the-County-Address',
    covers: 'The pledge itself, the reserves and bond upgrades the County credits for it, and the headline/body year discrepancy.',
  },
  {
    title: 'Town of Riverhead 2026 Adopted Budget',
    url: taxBill.rateSource.url,
    covers: 'The 2026 adopted General Fund appropriations and the published tax-rate table used for the rate comparison.',
  },
  {
    title: 'Riverhead Budget Live — 2027 Prediction',
    url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/predict-2027/',
    covers: 'The line-by-line 2027 projection, the per-fund totals, and the tax-cap gap calculation behind the numbers on this page.',
  },
  {
    title: 'Riverhead Budget Live — 2027 Spending Reduction',
    url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/spending-reduction-2027/',
    covers: 'The savings package, item by item, with the confidence rating on each.',
  },
  {
    title: 'Riverhead Budget Live — Reserves and Fund Balance',
    url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/reserves/',
    covers: 'The audited December 31, 2025 unassigned balance and the Town’s own 15–20% policy range.',
  },
]
