// Factual, sourced record of Riverhead's spending on the even-year election law
// litigation and its June 2026 withdrawal. Figures as reported by RiverheadLOCAL
// (June 16, 2026); totals the Town has not released (FOIL pending) are marked
// unknown rather than estimated. This view deliberately does NOT compute a
// "recoverable from the firm" figure — see the reference note below on why.

export const electionLawCase = {
  title: 'The even-year election law case — what Riverhead spent',
  subtitle:
    "The Town joined a lawsuit to block New York's 2023 even-year election law, paid outside counsel, then quietly withdrew. Here's what's on the record — and what still isn't.",

  paidDisclosed: 207_000, // Riverhead's share, June–Dec 2025
  paidPeriod: 'June–December 2025',
  jointTotal: 1_656_000, // Brewer's total billed to all eight governments through Dec 31
  jointEntities: 8, // Riverhead paid a one-eighth share
  firm: 'Brewer, Attorneys & Counselors',

  timeline: [
    { date: '2023', text: "New York enacts the Even-Year Election Law, moving most town and county elections to even-numbered years." },
    { date: 'Through Dec 31, 2025', text: 'Brewer bills the eight-government joint retainer $1.656 million; Riverhead’s one-eighth share for June–December 2025 is $207,000.' },
    { date: 'May 8, 2026', text: 'A FOIL request for the firm’s invoices since January 1 is filed; as of the reporting it had not been answered.' },
    { date: 'June 10, 2026', text: 'Notices of voluntary dismissal are filed — Riverhead withdraws from the case. The Town Board did not publicly discuss the withdrawal beforehand.' },
  ],

  whatItWasAbout:
    "The suit challenged New York's 2023 Even-Year Election Law, which shifts most town and county elections to even years. Supporters of the challenge argued local races would be “buried” beneath federal and statewide contests; the law's backers argued even-year timing raises turnout. Suffolk County and the Town of Huntington remain as plaintiffs; Riverhead does not.",

  unknowns: [
    'The Town’s total spend on the case — the $207,000 covers only June–December 2025; earlier and later invoices have not been released.',
    'The itemized invoices (hours, rates, and any billed travel/expenses), which were still outstanding under FOIL as of the reporting.',
    'Whether any of the billed amount was travel or expense pass-through subject to state travel-reimbursement limits (see below).',
  ],

  questionsToAsk: [
    'What is the Town’s total cost on this case across all invoices, not just the $207,000 June–December 2025 share?',
    'Will the Town release the itemized Brewer invoices so residents can see hours, rates, and any billed travel?',
    'Why was the decision to withdraw not discussed publicly by the Town Board before the dismissal was filed?',
  ],

  // Reference explainer — general rules, NOT a recovery calculation.
  travelRuleNote:
    "New York's OSC Travel Manual and the IRS standard mileage rate govern how public employees are reimbursed for travel — mileage, meals, and lodging. They do not govern an outside law firm's legal fees. So there is no basis here to “recall” a disallowed amount from the firm: that would only apply to specific travel or expense line items an invoice billed above these limits, and the itemized invoices haven't been released. If they are, the caps below are the yardstick for any travel billed.",
  irsMileageRate2026: 0.725, // dollars per mile

  sources: [
    { title: 'RiverheadLOCAL — “Riverhead withdraws from even-year election law case after paying at least $207K in legal fees” (June 16, 2026)', url: 'https://riverheadlocal.com/2026/06/16/riverhead-withdraws-from-even-year-election-law-case-after-paying-at-least-207k-in-legal-fees/' },
    { title: 'NYS OSC — Travel Manual (agencies travel manual attachment, PDF)', url: 'https://www.osc.ny.gov/files/state-agencies/travel/pdf/agencies-travel-manual-attachment.pdf' },
    { title: 'IRS — 2026 business standard mileage rate set at 72.5 cents per mile', url: 'https://www.irs.gov/newsroom/irs-sets-2026-business-standard-mileage-rate-at-725-cents-per-mile-up-25-cents' },
  ],
}
