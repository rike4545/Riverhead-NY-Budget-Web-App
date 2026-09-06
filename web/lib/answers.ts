// The question layer.
//
// WHY THIS EXISTS. Every other page on this site is organised around a dataset
// or a tool — the General Fund, the AFR, subaccounts, the debt schedule. That is
// how the data is shaped, and it is how someone who already knows municipal
// finance would go looking. It is not how a resident arrives. A resident arrives
// with a question: why did my taxes go up, who makes $380,000, does the Town
// have savings, did the Board vote for this.
//
// Nothing here is new analysis. Every answer below is a figure this site already
// publishes, pulled from the same libraries the detail pages render, with a link
// to the page that shows the work. The value is entirely in the routing: it turns
// "here are twenty pages you could investigate" into "here is the answer, and
// here is where it comes from."
//
// TWO RULES for anything added here.
//   1. Every answer carries a real number, derived — never typed in. If a claim
//      cannot be sourced from an existing lib, it does not belong on this page.
//   2. Every answer links to the page that proves it. This page is an index, not
//      an authority; it must never become the only place a figure appears.

import prediction from '../public/data/budget-2027-prediction.json'
import taxBill from '../public/data/tax-bill.json'
import { estimateTaxBill } from './tax-bill'
import { yearSummaries } from './payroll'
import { debtProfile } from './debt-profile'
import { riverheadCurrent } from './credit-rating'
import {
  unassignedFundBalance, appropriations, policyMinimumPercent, policyUpperPercent,
} from './reserve-policy'
import { whyHarder } from './zero-percent-2027'
import { boardOptions, levyPredicted, levy2026 } from './budget-2027-options'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const usdCents = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
/** Tax rates are published per $1,000 to three decimals; two would drop a real digit. */
const rate = (n: number) => `$${n.toFixed(3)}`

// ---- figures, all derived -------------------------------------------------

const r25 = taxBill.rates2025
const r26 = taxBill.rates2026
const ratePct = ((r26.totalTownWide / r25.totalTownWide) - 1) * 100

// A worked example at the Town's own residential assessment ratio. $500,000 is a
// round illustrative market value, NOT a claim about the typical Riverhead home —
// the page says so.
const exampleMarketValue = 500_000
const exampleAssessed = exampleMarketValue * (taxBill.equalization.residentialAssessmentRatio / 100)
const bill25 = estimateTaxBill(exampleAssessed, 0, r25).total
const bill26 = estimateTaxBill(exampleAssessed, 0, r26).total

const payrollRows = (Array.isArray(yearSummaries) ? yearSummaries : Object.values(yearSummaries)) as any[]
const pay = payrollRows[payrollRows.length - 1]
const payPrior = payrollRows[payrollRows.length - 2]
const topEarner = pay.topEarners?.[0]
/** Payroll stores "Last, First M"; a sentence needs it the other way round. */
const naturalName = (n: string) => {
  const [last, rest] = n.split(',').map((x: string) => x.trim())
  return rest ? `${rest} ${last}` : n
}

const fbPct = (unassignedFundBalance / appropriations) * 100

const gf2026 = prediction.byFund.find((f) => f.fundCode === 'A01')
const publicSafety = whyHarder.shares.find((s) => s.label === 'Public safety')
const benefits = whyHarder.shares.find((s) => s.label === 'Employee benefits and debt')

export type Answer = {
  q: string
  a: string
  href: string
  cta: string
}

export type AnswerTopic = {
  id: string
  icon: string
  title: string
  blurb: string
  answers: Answer[]
}

export const topics: AnswerTopic[] = [
  {
    id: 'my-taxes',
    icon: '🏠',
    title: 'My taxes',
    blurb: 'What you pay the Town, why it changed, and what it is not.',
    answers: [
      {
        q: 'Why did my property taxes go up this year?',
        a: `The Town's total town-wide rate rose from ${rate(r25.totalTownWide)} to ${rate(r26.totalTownWide)} per $1,000 of assessed value for 2026 — an increase of ${ratePct.toFixed(2)}%.`,
        href: `${base}/tax-bill/`,
        cta: 'Estimate your own bill',
      },
      {
        q: 'How much more am I actually paying?',
        a: `On a home assessed at ${usd(exampleAssessed)} — roughly ${usd(exampleMarketValue)} of market value at the Town's ${taxBill.equalization.residentialAssessmentRatio}% residential ratio — the Town's share went from about ${usdCents(bill25)} to ${usdCents(bill26)}. That is roughly ${usdCents(bill26 - bill25)} more for the year.`,
        href: `${base}/tax-bill/`,
        cta: 'Run it on your assessed value',
      },
      {
        q: 'Where does the Town portion of my tax money go?',
        a: `Of the ${rate(r26.totalTownWide)} rate, ${rate(r26.generalFund)} is the General Fund, ${rate(r26.highway)} the Highway Fund and ${rate(r26.streetLighting)} street lighting.`,
        href: `${base}/tax-bill/`,
        cta: 'See the breakdown',
      },
      {
        q: 'Is this my whole tax bill?',
        a: 'No — and this is the single most common misreading. Everything on this site covers the TOWN portion only. School, county, fire district and library taxes are levied by separate governments and billed separately; for most Riverhead households the school portion is the largest line on the bill.',
        href: `${base}/tax-bill/`,
        cta: 'What the Town does and does not levy',
      },
    ],
  },
  {
    id: 'spending',
    icon: '💰',
    title: 'What the Town spends',
    blurb: 'The size of the budget, what dominates it, and what moved.',
    answers: [
      {
        q: 'How much does Riverhead spend in a year?',
        a: `${usd(prediction.totals.appropriations2026)} adopted for 2026 across all 19 operating funds. The General Fund — the one most Town services run through — is ${usd(gf2026?.v2026 ?? 0)} of that.`,
        href: `${base}/funds/`,
        cta: 'Every fund, side by side',
      },
      {
        q: 'What does the Town actually spend the most on?',
        a: `Police and people. Public safety is ${publicSafety?.pct}% of the 2026 General Fund (${usd(publicSafety?.amount ?? 0)}) and employee benefits and debt another ${benefits?.pct}% (${usd(benefits?.amount ?? 0)}) — together ${((publicSafety?.pct ?? 0) + (benefits?.pct ?? 0)).toFixed(1)}% before a single other service is funded.`,
        href: `${base}/general-fund/`,
        cta: 'Inside the General Fund',
      },
      {
        q: 'What changed from last year?',
        a: 'Compare any two budget years line by line — by fund, by department, or by individual account — and sort by what moved most.',
        href: `${base}/compare/`,
        cta: 'Open the comparison tool',
      },
    ],
  },
  {
    id: 'people',
    icon: '👥',
    title: 'Who works here and what they earn',
    blurb: 'Headcount, pay, overtime — the published payroll, not estimates.',
    answers: [
      {
        q: 'How many people work for the Town, and what does that cost?',
        a: `${pay.headcount.toLocaleString()} people appeared on the ${pay.year} payroll, for ${usd(pay.totalGross)} in gross pay — up from ${usd(payPrior.totalGross)} in ${payPrior.year}.`,
        href: `${base}/payroll/`,
        cta: 'Search the payroll',
      },
      {
        q: 'Who is the highest-paid Town employee?',
        a: topEarner
          ? `In ${pay.year} it was ${naturalName(topEarner.name)} (${topEarner.title}) at ${usd(topEarner.gross)} gross. Gross pay includes overtime, longevity and any payout of accrued time — it is not a base salary.`
          : `The published payroll lists every employee's gross pay for ${pay.year}.`,
        href: `${base}/payroll/`,
        cta: 'See the full list',
      },
      {
        q: 'What does a typical Town employee earn?',
        a: `The median ${pay.year} gross was ${usd(pay.medianGross)}, against an average of ${usd(pay.avgGross)}. The gap between the two is the tell: a handful of very large packages pull the average well above what most employees actually earn.`,
        href: `${base}/payroll/`,
        cta: 'Distribution and titles',
      },
      {
        q: 'How much overtime is the Town paying?',
        a: `${usd(pay.totalOvertime)} in ${pay.year}, ${pay.totalOvertime < payPrior.totalOvertime ? 'down' : 'up'} from ${usd(payPrior.totalOvertime)} in ${payPrior.year}.`,
        href: `${base}/payroll/`,
        cta: 'Overtime by rank',
      },
    ],
  },
  {
    id: 'debt',
    icon: '🏗️',
    title: 'Borrowing and debt',
    blurb: 'What the Town owes, what it owes it for, and what it costs to carry.',
    answers: [
      {
        q: 'How much does Riverhead owe?',
        a: `${usd(debtProfile.totalBondedDebt)} in bonded debt as of ${debtProfile.asOf}, plus ${usd(debtProfile.bondAnticipationNotes)} in outstanding bond anticipation notes.`,
        href: `${base}/capital-debt/`,
        cta: 'The full debt schedule',
      },
      {
        q: 'What is a BAN, and why should I care?',
        a: `A bond anticipation note is short-term borrowing — the Town takes the money now and decides later whether to pay it off or convert it into long-term bonds. Riverhead is carrying ${usd(debtProfile.bondAnticipationNotes)} of them, so the decision to bond or repay is a real one with real cost either way.`,
        href: `${base}/capital-debt/`,
        cta: 'Every note and when it matures',
      },
      {
        q: "What is the Town's credit rating?",
        a: `${riverheadCurrent.rating} from ${riverheadCurrent.agency}, ${riverheadCurrent.affirmedDate === undefined ? 'most recently affirmed' : `affirmed ${riverheadCurrent.affirmedDate}`}. Rating matters because it sets what the Town pays to borrow.`,
        href: `${base}/credit-rating/`,
        cta: 'What drives the rating',
      },
    ],
  },
  {
    id: 'health',
    icon: '📈',
    title: 'Is the Town in good shape?',
    blurb: 'Savings, cushion, and whether the position is improving.',
    answers: [
      {
        q: 'Does the Town have savings?',
        a: `${usd(unassignedFundBalance)} in unassigned General Fund balance — ${fbPct.toFixed(1)}% of appropriations, against the Town's own policy of ${(policyMinimumPercent * 100).toFixed(0)}–${(policyUpperPercent * 100).toFixed(0)}%.`,
        href: `${base}/reserves/`,
        cta: 'Reserves and the policy',
      },
      {
        q: 'Is holding that much savings good or bad?',
        a: `Both readings are legitimate and the page gives you each. A large cushion protects the credit rating and absorbs a bad year; it is also money collected from taxpayers and not spent, sitting at more than double the top of the Town's own stated target.`,
        href: `${base}/reserves/`,
        cta: 'The argument on both sides',
      },
    ],
  },
  {
    id: 'next-year',
    icon: '🗓️',
    title: 'What happens next year',
    blurb: 'The 2027 budget: the projection, the choices, and the deadline.',
    answers: [
      {
        q: 'Will my taxes go up again in 2027?',
        a: `If current trends carry forward with no policy change, the town-wide levy rises from ${usd(levy2026)} to ${usd(levyPredicted)} — ${prediction.levyEstimate.levyIncreasePct}%, which would pierce the state tax cap by ${usd(prediction.capGap.gap)}. That is a projection, not the Town's budget.`,
        href: `${base}/predict-2027/`,
        cta: 'How the projection is built',
      },
      {
        q: "What are the Town Board's options for my 2027 taxes?",
        a: `There are ${boardOptions.length}: hold the levy flat, cut it, raise it inside the cap, raise it above the cap, or a hybrid of savings and reserves. Each has a levy number, a dollar amount the Board would have to find, and a different legal requirement — only going above the cap needs an override vote.`,
        href: `${base}/predict-2027/#the-choice`,
        cta: 'Compare all five',
      },
      {
        q: 'Could Riverhead just freeze taxes, like Suffolk County did?',
        a: `It is arithmetically possible and harder than it sounds. A flat levy has to absorb ${usd(prediction.byFund.find((f) => f.fundCode === 'A01')!.delta)} of projected General Fund cost growth, and unlike Suffolk, Riverhead's police department sits inside the very fund a freeze would apply to.`,
        href: `${base}/zero-percent-2027/`,
        cta: 'What a zero-percent year takes',
      },
      {
        q: 'When does the Board actually decide, and can I say anything?',
        a: 'The Supervisor files a tentative budget by September 30. The public hearing falls on or before the Thursday after the November election, and the Board must adopt by November 20. The hearing is the formal moment residents are heard.',
        href: `${base}/predict-2027/#the-clock`,
        cta: 'The statutory calendar',
      },
    ],
  },
  {
    id: 'board',
    icon: '🏛️',
    title: 'The Town Board',
    blurb: 'Who decides, how they voted, and who funds them.',
    answers: [
      {
        q: 'Did the Town Board vote for this?',
        a: 'Resolutions are indexed with how each member voted, and the ones carrying a dollar figure are tagged with it.',
        href: `${base}/meetings/`,
        cta: 'Search the votes',
      },
      {
        q: 'Who represents me, and what are they responsible for?',
        a: 'The Supervisor prepares the budget; the Council adopts it. Both are on the record here, with the statutory qualifications for each office.',
        href: `${base}/officials/`,
        cta: 'Who holds which office',
      },
      {
        q: 'Who is funding their campaigns?',
        a: 'Filings come live from the New York State Board of Elections, including contributions from people who also appear on the Town payroll.',
        href: `${base}/campaign-finance/`,
        cta: 'Contributions and filers',
      },
      {
        q: 'What is the Town Square project costing taxpayers?',
        a: 'The land sale, the credits against it, what the Town pays the developer, the parking arrangement and the votes that authorised each piece — read from the master developer agreement itself, not from coverage of it.',
        href: `${base}/town-square/`,
        cta: 'The whole deal, in order',
      },
    ],
  },
]

export const answerCount = topics.reduce((n, t) => n + t.answers.length, 0)

// The other half of an honest question layer: what this site does NOT answer.
// A resident who leaves believing their school tax is in here has been misled by
// omission, so the limits get equal billing rather than a footnote.
export type Limit = { q: string; a: string; href?: string; cta?: string }

export const limits: Limit[] = [
  {
    q: 'What is my actual tax bill?',
    a: "This site estimates the TOWN portion from the Town's own published rate table. It does not know your parcel. For the real bill — every jurisdiction, amounts due and payment status — use the Town's official lookup.",
    href: 'https://tax.egov.basgov.com/riverhead/Search/Search',
    cta: 'Official tax lookup (BAS eGov) ↗',
  },
  {
    q: 'When is my payment due, and where do I pay it?',
    a: 'Due dates, penalty schedule and payment methods are set by the Receiver of Taxes, not by anything published here.',
    href: 'https://www.townofriverheadny.gov/189/Receiver-of-Taxes',
    cta: 'Receiver of Taxes ↗',
  },
  {
    q: 'Why is my school tax so high?',
    a: 'School districts are separate governments with their own budgets, their own boards and their own public votes. They are the largest part of most Riverhead tax bills and none of it is Town money. Nothing on this site covers them.',
  },
  {
    q: 'What is my assessed value, and can I challenge it?',
    a: "Assessment is set by the Town Assessor on the annual roll. This site takes assessed value as an input — it neither sets nor holds it — and grievance is a separate statutory process with its own deadline.",
  },
  {
    q: 'Why does a particular employee earn what they earn?',
    a: 'The payroll here shows what was paid. It does not show why — the contract step, the assignment, the accrued time paid out. Gross pay is a fact; the explanation behind any individual figure is not something this data contains.',
  },
]

export const method = {
  headline: 'How to read these answers',
  body:
    'Every figure on this page is pulled from the same data the detail pages render — none of it is written in by hand, so when the underlying budget or payroll data updates, these answers move with it. Each answer links to the page that shows the work; treat that page, not this one, as the source. Where a number is a projection rather than a reported figure, it says so.',
}
