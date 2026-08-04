// The conceptual half of budget literacy — the ideas behind the vocabulary in
// the glossary. These are the accounting and fiscal-policy concepts the rest of
// the site leans on (GASB 54 classes when we say "unassigned," the tax cap when
// we say "override," multiyear planning in the neutral fiscal view), grounded in
// Riverhead's own figures wherever a real number exists.
//
// Statutory detail and deadlines come from the Office of the State Comptroller's
// annual "Information for Town Officials" (January 2026). Riverhead is a town of
// the SECOND class — Town Law §10 puts every Suffolk County town in that class
// regardless of population — so the budget deadlines below are the general ones,
// not the later dates that apply only to Westchester and Monroe County towns.

export type BudgetConcept = {
  id: string
  title: string
  plain: string           // the idea in everyday language
  riverhead?: string      // how it shows up in Riverhead's actual numbers
  ask: string             // what a resident can ask at a hearing
  cite?: string           // the statute or standard behind it
}

export const OSC_TOWN_GUIDE = {
  label: 'OSC, Information for Town Officials (January 2026)',
  url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/information-for-town-officials.pdf',
}

export const budgetConcepts: BudgetConcept[] = [
  {
    id: 'gasb54',
    title: 'GASB 54: not all “fund balance” is spendable',
    plain:
      'Accounting rules sort a fund’s balance into five tiers by how tied-up the money is: Nonspendable (can’t be spent at all — inventory, prepaids), Restricted (locked by outside law or grant terms), Committed (set aside by the Board’s own formal action), Assigned (earmarked by intent), and Unassigned (genuinely flexible). Only that last tier is the true cushion. Town Law still uses the older phrase “unappropriated unreserved fund balance” — total assets minus liabilities, deferred revenues, encumbrances, amounts already appropriated into next year’s budget, and amounts reserved by law — which GASB 54 replaced in the financial statements themselves.',
    riverhead:
      'Riverhead’s 2025 General Fund balance was $33,407,251 in total — but $2,012,534 of it is nonspendable, $17,924 restricted, $42,435 committed, and $1,663,273 assigned. The actually-flexible unassigned balance is $29,671,084. Quoting the $33.4M total as “the cushion” overstates available money by about $3.7M.',
    ask: 'When someone cites a fund-balance number, ask which tiers it includes, how much is unassigned — and whether the Town has adopted a written fund-balance policy, which OSC recommends every local government adopt and review annually.',
    cite: 'Town Law §103; GASB Statement No. 54',
  },
  {
    id: 'one-time-vs-recurring',
    title: 'One-time money vs. recurring costs',
    plain:
      'Reserve draws, asset sales, settlements, and one-off grants help exactly once. Payroll, benefits, insurance, and routine services come back every single year. Balancing a recurring cost with one-time money works this year and rebuilds the same hole next year — with growth on top. State law lets a town carry over a “reasonable amount” of fund balance and spend it mid-year, but only when actual and expected revenues plus that carryover genuinely exceed what the budget assumed.',
    riverhead:
      'Riverhead’s unassigned fund balance could erase the entire projected 2027 tax-cap gap on paper. It would also be spent, and the gap would return in 2028 — which is why the plan leans on recurring trims and the retirement incentive instead, and reserves one-time money for the residual.',
    ask: 'Which part of this plan disappears after one year, and which costs still remain?',
    cite: 'Chapter 528 of the Laws of 2000',
  },
  {
    id: 'tax-cap-override',
    title: 'The tax cap, and what an override actually is',
    plain:
      'New York limits how much a town can raise its property-tax levy each year — the lesser of 2% or the rate of inflation, with adjustments for tax-base growth and certain exclusions. The Board can legally exceed it, but only by adopting an override local law first, in public, with a 60% vote of the governing body. The cap is a guardrail with a documented exit, not a hard ceiling. One step is easy to miss: the Town’s chief fiscal officer must file a tax-cap form with the State Comptroller *before* the budget is adopted, so the levy limit is on record with the State ahead of the vote.',
    riverhead:
      'Riverhead adopted overrides in 2023, 2024, and 2026, and on current trends the 2027 levy pierces the cap again by about $2.62M. The question worth asking isn’t only whether an override happens, but whether a cap-compliant version of the budget was ever shown alongside it.',
    ask: 'What would this budget look like under the cap, what specifically does the override fund — and what levy limit did the Town file with the Comptroller before adoption night?',
    cite: 'General Municipal Law §3-c (enacted 2011, effective for fiscal years beginning 2012)',
  },
  {
    id: 'budget-calendar',
    title: 'The budget calendar is a legal deadline, not a custom',
    plain:
      'A town budget moves on dates fixed by statute, not by preference. Department estimates are due to the budget officer by September 20. The tentative budget must be filed with the town clerk by September 30, and the clerk puts it before the Board by October 5. The Board revises it into the preliminary budget, publishes notice at least five days ahead, and holds the public hearing on the Thursday following the general election — adjournable, but never past November 15. The budget must be adopted by November 20. The sharpest detail: if the Board fails to adopt by then, the preliminary budget simply *becomes* the budget by operation of law. Inaction is not a veto; it is an adoption.',
    riverhead:
      'These are the general Town Law dates, and they are the ones Riverhead runs on. Suffolk County towns are all towns of the second class, so the later deadlines you may see quoted — a December 20 adoption — apply only to Westchester and Monroe County towns.',
    ask: 'When was the tentative budget filed, and how many days did the public actually have with the preliminary budget before the hearing?',
    cite: 'Town Law §§104, 106, 107, 108, 109',
  },
  {
    id: 'how-salaries-are-set',
    title: 'How salaries get set — and which ones you get to hear first',
    plain:
      'The Town Board fixes the pay of every town officer and employee, either by resolution or through a collective bargaining agreement, and it has to appear in the Board’s minutes. Four of those salaries get extra protection: the proposed pay for each Board member, an elected town clerk, and an elected highway superintendent must be printed in the public-hearing notice for the preliminary budget. The Board can raise them above the noticed figure, but only by local law subject to permissive referendum — meaning voters can force it to a vote.',
    riverhead:
      'This is why the January organizational-meeting resolutions are the authority behind the pay figures on this site: that is the document where the Board actually fixes the rates. Those resolutions print an annual salary for nearly every full-time title and an hourly rate only for part-time staff and the Water District.',
    ask: 'Was this salary set by Board resolution or by a union contract — and if it went up, was it noticed in the budget hearing?',
    cite: 'Town Law §§27, 108',
  },
  {
    id: 'budget-flexibility',
    title: 'Where a budget can legally flex mid-year',
    plain:
      'An adopted budget is not frozen, but every escape hatch has a limit. The general fund may carry an appropriation for contingencies of up to 10% of appropriations (excluding debt service, judgments, special districts, and certain highway and part-town purposes) — and nothing may be charged to it directly; money must first be transferred out to a real appropriation account. A town may issue budget notes to fund new or increased appropriations, ordinarily capped at 5% of the annual budget. Beyond that, the Board can transfer between appropriations. Each of these leaves a public paper trail in the minutes.',
    riverhead:
      'Amendments after adoption show up as resolutions in the Town Board Votes record on this site — transfers, supplemental appropriations, and salary changes — so the plan can be watched as it moves during the year.',
    ask: 'Is this a transfer between existing appropriations, a draw on contingency, or new borrowing — and how much contingency is left?',
    cite: 'Town Law §107(2); Local Finance Law §29.00',
  },
  {
    id: 'budgetary-vs-gaap',
    title: 'Budgetary basis vs. GAAP basis',
    plain:
      'The adopted budget and the audited financial statements can show different numbers for the same year — and both be right. The budget is kept on a “budgetary basis” (encumbrances count when money is committed); the audit follows GAAP (revenues and expenses recognized when earned or incurred). The mechanism behind the gap is concrete: at year end, department heads file their unpaid obligations and the supervisor encumbers those appropriation balances. Whatever is left unencumbered lapses. The one exception — appropriations for a capital purpose stay alive until the project is finished or abandoned.',
    riverhead:
      'This is why the Annual Report’s actual results don’t line up line-for-line with the adopted budget on this site. Neither is wrong; they answer different questions — “what did we plan and commit?” versus “what happened under standard accounting rules?”',
    ask: 'Is this figure on a budgetary basis or a GAAP basis, and where is the reconciliation between them?',
    cite: 'Town Law §§110, 111, 117',
  },
  {
    id: 'fiscal-stress',
    title: 'OSC fiscal-stress monitoring',
    plain:
      'The New York State Comptroller scores every local government each year on financial indicators — fund balance, operating deficits, cash position, and short-term borrowing — and publishes a stress designation. It is an outside, standardized read on whether a town’s finances are trending toward trouble, independent of local politics. It costs the Town nothing extra to be scored: OSC builds it from the Annual Financial Report the Town already has to file, so there is no separate submission a town could decline to make.',
    riverhead:
      'The indicators OSC watches are the same ones this site tracks: how much unassigned fund balance is left, whether operations run a deficit, and whether the Town is leaning on short-term notes for cash flow.',
    ask: 'What is the Town’s current OSC fiscal-stress score, and which indicator moved most since last year?',
    cite: 'OSC Fiscal Stress Monitoring System, built from filed Annual Financial Reports',
  },
  {
    id: 'multiyear-planning',
    title: 'Multiyear financial planning',
    plain:
      'A one-year budget can look balanced while a structural gap builds behind it. A rolling three-to-five-year projection of revenues, contractual payroll, pension, and debt turns next year’s surprise into a problem visible 18 months out — while small corrections still work. This is not something a town has to invent alone: the Comptroller’s office runs town budget reviews, offers technical assistance, and will issue legal opinions on request.',
    riverhead:
      'The 2027 gap on this site is exactly what a standing multiyear forecast is meant to surface early: contracted costs rising faster than the levy is legally allowed to grow. It was foreseeable well before adoption night.',
    ask: 'Does the Town publish a multiyear forecast, and what does it show for the next three years?',
  },
  {
    id: 'short-term-notes',
    title: 'TANs, BANs, and deficiency notes',
    plain:
      'Towns borrow short-term for different reasons, and the reason matters. A TAN (Tax Anticipation Note) bridges cash flow until taxes arrive — routine. A BAN (Bond Anticipation Note) is interim financing for a capital project that will later be bonded — normal, but it has to be rolled or permanently financed. A budget or deficiency note covers a shortfall in the operating budget itself — that one is a warning sign, and state law ordinarily caps it at 5% of the annual budget, which tells you the Legislature meant it as a last resort rather than a tool.',
    riverhead:
      'BANs appear in the Town’s capital and debt figures on this site. The distinction to watch is whether short-term borrowing is funding assets (expected) or plugging operating gaps (not).',
    ask: 'Is this note financing a capital asset or an operating shortfall, and what is the plan to retire it?',
    cite: 'Local Finance Law §29.00',
  },
  {
    id: 'interfund',
    title: 'Interfund loans vs. interfund transfers',
    plain:
      'A transfer moves money between funds permanently — it is a real cost to the sending fund. A loan is temporary and must be paid back. State law is unusually specific here: an advance has to be authorized by the Board the same way a budget transfer is, it must be recorded, and it must be repaid as soon as money is available and no later than the close of the fiscal year in which it was made. If the two funds rest on different tax bases, the repayment must also include the interest the lending fund would have earned. And bond proceeds or other money legally earmarked for a stated purpose may not be advanced at all. A loan that quietly rolls past year end is not a loan — it is an undisclosed transfer.',
    riverhead:
      'The Town keeps separate funds for general services, highway, water, sewer, and refuse, each with its own balanced budget — so money moving between them is worth reading closely.',
    ask: 'Is this a loan or a transfer? If it is a loan, was it repaid before the fiscal year closed, and did the repayment include imputed interest?',
    cite: 'General Municipal Law §9-a',
  },
  {
    id: 'capital-vs-operating',
    title: 'Capital vs. operating spending',
    plain:
      'Operating spending keeps services running this year — salaries, fuel, insurance. Capital spending buys or builds something lasting and is usually financed over the asset’s life. State law defines a capital project broadly: a physical public betterment or improvement, the studies, surveys and plans behind it, land or rights in land, and the furnishings, machinery or equipment bought when that improvement is first built or acquired. Deferring capital can make an operating budget look better today while the bill grows — and unlike ordinary appropriations, a capital appropriation does not lapse at year end; it stays in force until the purpose is accomplished or abandoned.',
    riverhead:
      'Some of the trims identified on this site are capital or maintenance timing rather than permanent savings, which is exactly why they are tagged separately from firm, recurring reductions.',
    ask: 'Is this a one-year deferral or a real reduction — and what does deferring it cost later?',
    cite: 'Town Law §103; Town Law §111',
  },
]
