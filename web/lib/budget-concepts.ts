// The conceptual half of budget literacy — the ideas behind the vocabulary in
// the glossary. These are the accounting and fiscal-policy concepts the rest of
// the site leans on (GASB 54 classes when we say "unassigned," the tax cap when
// we say "override," multiyear planning in the neutral fiscal view), grounded in
// Riverhead's own figures wherever a real number exists.

export type BudgetConcept = {
  id: string
  title: string
  plain: string           // the idea in everyday language
  riverhead?: string      // how it shows up in Riverhead's actual numbers
  ask: string             // what a resident can ask at a hearing
}

export const budgetConcepts: BudgetConcept[] = [
  {
    id: 'gasb54',
    title: 'GASB 54: not all “fund balance” is spendable',
    plain:
      'Accounting rules sort a fund’s balance into five tiers by how tied-up the money is: Nonspendable (can’t be spent at all — inventory, prepaids), Restricted (locked by outside law or grant terms), Committed (set aside by the Board’s own formal action), Assigned (earmarked by intent), and Unassigned (genuinely flexible). Only that last tier is the true cushion.',
    riverhead:
      'Riverhead’s 2025 General Fund balance was $33,407,251 in total — but $2,012,534 of it is nonspendable, $17,924 restricted, $42,435 committed, and $1,663,273 assigned. The actually-flexible unassigned balance is $29,671,084. Quoting the $33.4M total as “the cushion” overstates available money by about $3.7M.',
    ask: 'When someone cites a fund-balance number, ask which tiers it includes — and how much of it is unassigned.',
  },
  {
    id: 'one-time-vs-recurring',
    title: 'One-time money vs. recurring costs',
    plain:
      'Reserve draws, asset sales, settlements, and one-off grants help exactly once. Payroll, benefits, insurance, and routine services come back every single year. Balancing a recurring cost with one-time money works this year and rebuilds the same hole next year — with growth on top.',
    riverhead:
      'Riverhead’s unassigned fund balance could erase the entire projected 2027 tax-cap gap on paper. It would also be spent, and the gap would return in 2028 — which is why the plan leans on recurring trims and the retirement incentive instead, and reserves one-time money for the residual.',
    ask: 'Which part of this plan disappears after one year, and which costs still remain?',
  },
  {
    id: 'tax-cap-override',
    title: 'The tax cap, and what an override actually is',
    plain:
      'New York limits how much a town can raise its property-tax levy each year — roughly 2%, or inflation if lower, with adjustments for tax-base growth and certain exclusions. The Board can legally exceed it, but only by adopting an override local law first, in public, with a 60% vote of the governing body (General Municipal Law §3-c). The cap is a guardrail with a documented exit, not a hard ceiling.',
    riverhead:
      'Riverhead adopted overrides in 2023, 2024, and 2026, and on current trends the 2027 levy pierces the cap again by about $2.62M. The question worth asking isn’t only whether an override happens, but whether a cap-compliant version of the budget was ever shown alongside it.',
    ask: 'What would this budget look like under the cap, and what specifically does the override fund?',
  },
  {
    id: 'budgetary-vs-gaap',
    title: 'Budgetary basis vs. GAAP basis',
    plain:
      'The adopted budget and the audited financial statements can show different numbers for the same year — and both be right. The budget is kept on a “budgetary basis” (encumbrances count when money is committed); the audit follows GAAP (revenues and expenses recognized when earned or incurred). The audit usually includes a reconciliation between the two.',
    riverhead:
      'This is why the Annual Report’s actual results don’t line up line-for-line with the adopted budget on this site. Neither is wrong; they answer different questions — “what did we plan and commit?” versus “what happened under standard accounting rules?”',
    ask: 'Is this figure on a budgetary basis or a GAAP basis, and where is the reconciliation between them?',
  },
  {
    id: 'fiscal-stress',
    title: 'OSC fiscal-stress monitoring',
    plain:
      'The New York State Comptroller scores every local government each year on financial indicators — fund balance, operating deficits, cash position, and short-term borrowing — and publishes a stress designation. It is an outside, standardized read on whether a town’s finances are trending toward trouble, independent of local politics.',
    riverhead:
      'The indicators OSC watches are the same ones this site tracks: how much unassigned fund balance is left, whether operations run a deficit, and whether the Town is leaning on short-term notes for cash flow.',
    ask: 'What is the Town’s current OSC fiscal-stress score, and which indicator moved most since last year?',
  },
  {
    id: 'multiyear-planning',
    title: 'Multiyear financial planning',
    plain:
      'A one-year budget can look balanced while a structural gap builds behind it. A rolling three-to-five-year projection of revenues, contractual payroll, pension, and debt turns next year’s surprise into a problem visible 18 months out — while small corrections still work.',
    riverhead:
      'The 2027 gap on this site is exactly what a standing multiyear forecast is meant to surface early: contracted costs rising faster than the levy is legally allowed to grow. It was foreseeable well before adoption night.',
    ask: 'Does the Town publish a multiyear forecast, and what does it show for the next three years?',
  },
  {
    id: 'short-term-notes',
    title: 'TANs, BANs, and deficiency notes',
    plain:
      'Towns borrow short-term for different reasons, and the reason matters. A TAN (Tax Anticipation Note) bridges cash flow until taxes arrive — routine. A BAN (Bond Anticipation Note) is interim financing for a capital project that will later be bonded — normal, but it has to be rolled or permanently financed. A deficiency or budget note covers a shortfall in the operating budget itself — that one is a warning sign.',
    riverhead:
      'BANs appear in the Town’s capital and debt figures on this site. The distinction to watch is whether short-term borrowing is funding assets (expected) or plugging operating gaps (not).',
    ask: 'Is this note financing a capital asset or an operating shortfall, and what is the plan to retire it?',
  },
  {
    id: 'interfund',
    title: 'Interfund loans vs. interfund transfers',
    plain:
      'A transfer moves money between funds permanently — it is a real cost to the sending fund. A loan is temporary and must be paid back, usually within the year. They look similar in a budget line but mean very different things: a loan that is never repaid is effectively an undisclosed transfer.',
    riverhead:
      'The Town keeps separate funds for general services, highway, water, sewer, and refuse, each with its own balanced budget — so money moving between them is worth reading closely.',
    ask: 'Is this a loan or a transfer, and if it is a loan, when is it scheduled to be repaid?',
  },
  {
    id: 'capital-vs-operating',
    title: 'Capital vs. operating spending',
    plain:
      'Operating spending keeps services running this year — salaries, fuel, insurance. Capital spending buys or builds something lasting — a road, a plant, a truck — and is usually financed over the asset’s life. Deferring capital can make an operating budget look better today while the bill grows.',
    riverhead:
      'Some of the trims identified on this site are capital or maintenance timing rather than permanent savings, which is exactly why they are tagged separately from firm, recurring reductions.',
    ask: 'Is this a one-year deferral or a real reduction — and what does deferring it cost later?',
  },
]
