// Budget accuracy: lines where the adopted budget and what was actually spent
// are far enough apart that the budget stops being a useful plan.
//
// Two halves, deliberately kept distinct:
//
//   • curatedFlags — hand-researched lines, each with a specific question a
//     resident or Board member can put to the Finance Department. Ported from
//     the iOS app, which has carried them since before this page existed.
//   • the auto-detected outliers in web/public/data/budget-supplement/
//     outliers.json, produced weekly by etl/parse_budget_supplement.py across
//     roughly 1,700 expenditure lines. That file has been generated for some
//     time and read by nothing until this page.

import outliers from '../public/data/budget-supplement/outliers.json'

export type Severity = 'critical' | 'high' | 'explain'

export type BudgetAccuracyFlag = {
  rank: number
  title: string
  severity: Severity
  /** What the line actually spent in 2024. */
  actual2024: string
  /** What the 2024 budget allowed. */
  budget2024: string
  variance: string
  /** What the 2026 adopted budget sets for the same line. */
  adopted2026: string
  /** Present where the account name alone does not explain the item. */
  plainEnglish?: string
  issue: string
  action: string
}

export const curatedFlags: BudgetAccuracyFlag[] = [
  {
    rank: 1,
    title: "Finance Department - Management Buy-Back",
    severity: 'critical',
    actual2024: "$290,150",
    budget2024: "$30,000",
    variance: "+867%",
    adopted2026: "$35,400",
    plainEnglish: "This is usually cash paid to management or exempt employees for accrued leave, not normal salary. It can be caused by retirements, resignations, separation payouts, unused vacation/personal/comp time cash-outs, or a one-time settlement or reclassification.",
    issue: "The 2024 actual was nearly 10 times the recurring baseline shown for 2025, yet the 2026 line rises only modestly. This may be deferred buyout payments, a settlement, or reclassification, but the current supplement trail does not explain it.",
    action: "Require an immediate account-level explanation and identify whether the 2024 actual was amended, reclassified, or left to absorb silently.",
  },
  {
    rank: 2,
    title: "Town Hall Postage",
    severity: 'critical',
    actual2024: "$56,973",
    budget2024: "$6,265",
    variance: "+809%",
    adopted2026: "$6,265",
    issue: "The 2026 budget repeats the 2025 amount despite 2024 actual spending at about nine times the line.",
    action: "Confirm whether charges were misposted in 2024 or whether the recurring postage baseline is chronically understated.",
  },
  {
    rank: 3,
    title: "Police Uniform OT",
    severity: 'critical',
    actual2024: "$1,401,354",
    budget2024: "$1,000,000",
    variance: "+40%",
    adopted2026: "$1,000,000",
    plainEnglish: "Uniform OT means overtime for sworn uniformed police personnel. It is driven by minimum staffing rules, vacancies, sick or vacation backfill, shift coverage, arrests, court time, events, emergencies, training coverage, and contract overtime premiums.",
    issue: "The account is frozen below actual spend, making police costs look smaller at adoption while overruns are absorbed later. March workload data complicates the offset story: criminal incidents rose to 167 from 144 and total incidents rose to 2,994 from 2,922, even though accidents and summonses fell.",
    action: "Treat this as the first 2027 offset test: either reset the recurring overtime baseline honestly, or publish a monthly Police OT recovery plan showing how much of the $401K 2024 overrun can be captured through scheduling, cause coding, and tighter court/recall/training/event review without assuming workload has declined.",
  },
  {
    rank: 4,
    title: "Police Sick Buy-Back",
    severity: 'high',
    actual2024: "$334,738",
    budget2024: "$174,200",
    variance: "+92%",
    adopted2026: "$116,900",
    plainEnglish: "This is payment for unused sick leave under police contract or work rules. It can come from retirement or separation payouts, annual sick-leave sellbacks if permitted, or accumulated sick banks converting into cash.",
    issue: "The 2024 actual was nearly double budget, but the 2026 budget cuts the line by about one-third.",
    action: "Identify the contract change, usage change, or accounting correction that would make the lower 2026 number realistic.",
  },
  {
    rank: 5,
    title: "Fire Protection - Part-Time Staff",
    severity: 'critical',
    actual2024: "$47,089",
    budget2024: "$0",
    variance: "No budget",
    adopted2026: "$0",
    issue: "A personal-services payment was made against a line with no 2025 or 2026 budget.",
    action: "Determine whether this was a misposting or staff paid outside a visible appropriation.",
  },
  {
    rank: 6,
    title: "Police Body Cameras",
    severity: 'high',
    actual2024: "$1,304,519",
    budget2024: "$0",
    variance: "One-time",
    adopted2026: "$0",
    issue: "The body-camera purchase is a separate Police equipment account, not part of IT Equipment. It may be a one-time capital outlay, but the supplement shows no adopted baseline for the account.",
    action: "Confirm the capital authorization, funding source, and budget amendment trail so the one-time purchase is not confused with recurring IT equipment.",
  },
  {
    rank: 7,
    title: "IT Equipment",
    severity: 'high',
    actual2024: "$503,573",
    budget2024: "$230,450",
    variance: "+119%",
    adopted2026: "$164,660",
    issue: "IT Equipment is its own variance: 2024 actual was about 2.2 times the 2025 adopted baseline, then the 2026 line is cut further.",
    action: "Confirm what drove the 2024 equipment spike and whether the lower 2026 equipment baseline is operationally sustainable.",
  },
  {
    rank: 8,
    title: "ES1 Sewer Hospitalization",
    severity: 'high',
    actual2024: "$2,268,127",
    budget2024: "$353,997",
    variance: "+541%",
    adopted2026: "$400,963",
    issue: "This is consistent with a non-cash GASB 75/OPEB actuarial allocation through the sewer enterprise fund's hospitalization account, rather than normal insurance payments. The supplement does not explain the swing before returning to a much lower 2026 baseline.",
    action: "Tie the 2024 charge to the audited OPEB allocation or journal entry, identify where it was disclosed, and explain why the supplement does not label the spike as non-cash accounting activity.",
  },
  {
    rank: 9,
    title: "Highway Machinery 5130",
    severity: 'high',
    actual2024: "$1,268,472",
    budget2024: "$681,819",
    variance: "+86%",
    adopted2026: "Review",
    issue: "The Highway Machinery function spent far above the recurring baseline. The total combines $882,072 of equipment against a $236,500 equipment baseline, plus R&M equipment that was under its own baseline.",
    action: "Confirm whether the spending was separately authorized through capital or board action, and tie it back to the operating budget.",
  },
  {
    rank: 10,
    title: "Planning Environmental Review",
    severity: 'critical',
    actual2024: "$100,081",
    budget2024: "$0",
    variance: "No budget",
    adopted2026: "$0",
    issue: "A six-figure consulting spend appears with no 2025 or 2026 budget line.",
    action: "Determine whether this was grant-funded, reimbursed, or an unappropriated consulting expenditure.",
  },
  {
    rank: 11,
    title: "CDA Special Events",
    severity: 'explain',
    actual2024: "$0",
    budget2024: "$0",
    variance: "YTD $7K",
    adopted2026: "$43,200",
    issue: "The $7,000 amount is 2025 YTD, not 2024 actual. The account had no 2025 adopted baseline, then gets formalized at $43,200 for 2026.",
    action: "Explain the event plan, funding source, public purpose, and why the new 2026 baseline is being created after mid-year spending appeared in 2025.",
  },
]

export type Outlier = {
  account: string
  fund: string
  name: string
  control: string
  actual2024: number
  budget2025: number
  ytd2025: number
  tentative2026: number
  flag: string
  excess: number
}

export const overBudget = outliers.overBudget as Outlier[]
export const chronicOverrun = outliers.chronicOverrun as Outlier[]
export const noBudget = outliers.noBudget as Outlier[]
export const recoverablePool = outliers.recoverablePoolControllable as number
export const outlierNote = outliers.note as string

export const detectedCount = overBudget.length + chronicOverrun.length + noBudget.length

export const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  explain: 'Needs explaining',
}
