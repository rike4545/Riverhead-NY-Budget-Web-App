// Factual, sourced record of Riverhead's spending on the even-year election law
// litigation and its June 2026 withdrawal. Figures as reported by RiverheadLOCAL
// (June 4, June 16, June 25, and July 23, 2026). Where a total is still
// unreleased it is marked unknown rather than estimated. The travel/banquet
// benchmark below is a SCALE comparison against public per-diem rules, not a
// legal disallowance and not a "recall from the firm" figure — a private law
// firm's litigation expenses are not governed by the state travel manual.

export const electionLawCase = {
  title: 'The even-year election law case — what Riverhead spent',
  subtitle:
    "The Town joined a lawsuit to block New York's 2023 even-year election law, paid outside counsel — including hotel and banquet tabs — then quietly withdrew. Here's what's on the record.",

  paidDisclosed: 207_958.79, // Riverhead, through Dec 31, 2025
  paidPeriod: 'through December 31, 2025',
  jointTotal: 1_656_000, // eight LI governments' combined fees through Dec 31
  jointEntities: 8,
  blendedRate: 650, // Brewer blended hourly rate for attorneys AND non-attorney staff
  monthlyCapPerEntity: 7_142.86, // March 23, 2026 amended agreement

  firms: [
    { name: 'Brewer, Attorneys & Counselors', total: 1_913_670, period: 'June 2025 – May 2026' },
    { name: 'Troutman Pepper Locke', total: 1_101_956, period: 'reported total' },
  ],

  // Itemized travel/hospitality charges reported by RiverheadLOCAL (July 23, 2026).
  expenses: [
    {
      venue: 'Garden City Hotel',
      when: 'July 22–24, 2025',
      amount: 14_000,
      amountPrefix: 'over ',
      detail: '10 rooms for 3 nights, plus meals and "Black Car" Uber rides, for a litigation "deep dive." Attendees included Suffolk GOP counsel Steven Losquadro and Brewer firm staff.',
      perUnit: '≈ $467 per room-night (blended, incl. meals/rides)',
    },
    {
      venue: 'The Mansion at Glen Cove',
      when: 'September 3, 2025',
      amount: 8_300,
      amountPrefix: '',
      detail: 'Food-and-beverage tab for 25 people at a strategy "deep dive."',
      perUnit: '$332 per person for a single meal',
    },
  ],

  timeline: [
    { date: '2023', text: 'New York enacts the Even-Year Election Law, moving most town and county elections to even-numbered years.' },
    { date: 'October 2025', text: 'The federal lawsuit challenging the law is filed. The NY, Suffolk, and Nassau Republican committees are lead plaintiffs.' },
    { date: 'Through Dec 31, 2025', text: 'Eight LI governments are billed $1.656M; Riverhead’s share is $207,958.79. Brewer’s blended rate is $650/hour for attorneys and staff alike.' },
    { date: 'March 23, 2026', text: 'An amended agreement caps monthly costs at $50,000 total — about $7,142.86 per participating entity.' },
    { date: 'May 8, 2026', text: 'A FOIL request for the firm’s invoices since January 1 is filed; as of the reporting it had not been answered.' },
    { date: 'June 10, 2026', text: 'Notices of voluntary dismissal are filed — Riverhead withdraws. The Town Board did not publicly discuss the withdrawal beforehand.' },
    { date: 'June 18, 2026', text: 'Judge Gary R. Brown hears motion-to-dismiss arguments; Legislator Greg Doroski moves to pull Suffolk County (at least $230,000 in fees) from the case.' },
    { date: 'June 29, 2026', text: 'Judge Brown dismisses the government plaintiffs’ claims with prejudice. The even-year election law stands — the taxpayer-funded challenge failed.' },
  ],

  outcome: {
    date: 'June 29, 2026',
    court: 'U.S. District Judge Gary R. Brown',
    ruling:
      'dismissed the government plaintiffs’ claims with prejudice — on three independent grounds: their claims were precluded by prior state-court litigation, they lacked Article III standing, and Section 1983 gave them no cause of action. New York’s even-year election law stands. (Non-government plaintiffs — GOP committees and candidates — were allowed to refile against different defendants.)',
    judgeQuote:
      'Their presence in this lawsuit is troubling, especially so in light of the substantial legal expenses reportedly billed to the governmental plaintiffs by counsel.',
  },

  whatItWasAbout:
    "The suit challenged New York's 2023 Even-Year Election Law, which shifts most town and county elections to even years. Supporters of the challenge argued local races would be “buried” beneath federal and statewide contests; the law's backers argued even-year timing raises turnout. The Republican state and county committees were lead plaintiffs but, per the reporting and Doroski's resolution, “have paid none of the costs” — taxpayers did.",

  unknowns: [
    'The Town’s full lifetime cost — the $207,958.79 covers only through December 31, 2025; later invoices have not been released.',
    'The complete itemized invoices (all hours, rates, and expenses), which were still outstanding under FOIL as of the reporting.',
  ],

  questionsToAsk: [
    'What is the Town’s total cost on this case across all invoices, not just the $207,958.79 through December 2025?',
    'Were the Garden City Hotel and Glen Cove banquet charges necessary litigation costs — and would the Town ever reimburse its own employees at those rates?',
    'Why was the decision to withdraw not discussed publicly by the Town Board before the dismissal was filed?',
  ],

  // Benchmark context — NOT a disallowance or recovery figure.
  travelBenchmarkNote:
    "New York's OSC Travel Manual reimburses public employees for travel at federal GSA per-diem rates — in FY2025 that is about $110/night for lodging and $68/day for all meals (downstate high-cost areas run somewhat higher, but even the top New York meal tier is about $92 for a full day). Measured against that yardstick, a $332-per-person banquet is several times a full day's meal allowance, and a ~$467-per-room-night stay is well above the lodging cap. Two caveats: these were a private law firm's billed expenses, not public-employee travel, so the manual doesn't legally bind them; and this is a comparison of scale, not a legal determination that any amount must be returned. The mileage yardstick, for reference, is the IRS 2026 rate of 72.5¢ per mile.",
  irsMileageRate2026: 0.725,

  sources: [
    { title: 'RiverheadLOCAL — “Hotel rooms, banquet tabs: how the GOP fight against even-year elections cost taxpayers” (July 23, 2026)', url: 'https://riverheadlocal.com/2026/07/23/hotel-rooms-banquet-tabs-how-the-gop-fight-against-even-year-elections-cost-taxpayers/' },
    { title: 'RiverheadLOCAL — “Federal judge dismisses New York even-year election law challenge” (June 29, 2026)', url: 'https://riverheadlocal.com/2026/06/29/federal-judge-dismisses-new-york-even-year-election-law-challenge/' },
    { title: 'Courthouse News — “Bucking GOP challenge, New York’s high court approves even-year elections”', url: 'https://www.courthousenews.com/bucking-gop-challenge-new-yorks-high-court-approves-even-year-elections/' },
    { title: 'RiverheadLOCAL — “Doroski moves to pull Suffolk County from costly even-year election law federal lawsuit” (June 25, 2026)', url: 'https://riverheadlocal.com/2026/06/25/doroski-moves-to-pull-suffolk-county-from-costly-even-year-election-law-federal-lawsuit/' },
    { title: 'RiverheadLOCAL — “Riverhead withdraws from even-year election law case after paying at least $207K in legal fees” (June 16, 2026)', url: 'https://riverheadlocal.com/2026/06/16/riverhead-withdraws-from-even-year-election-law-case-after-paying-at-least-207k-in-legal-fees/' },
    { title: 'RiverheadLOCAL — “Even-year election law legal fees, GOP committees, taxpayers” (June 4, 2026)', url: 'https://riverheadlocal.com/2026/06/04/even-year-election-law-legal-fees-gop-committees-taxpayers/' },
    { title: 'NYS OSC — Travel Manual (agencies travel manual attachment, PDF)', url: 'https://www.osc.ny.gov/files/state-agencies/travel/pdf/agencies-travel-manual-attachment.pdf' },
    { title: 'U.S. GSA — FY2025 per diem rates for New York', url: 'https://www.gsa.gov/travel/plan-book/per-diem-rates/per-diem-rates-results?action=perdiems_report&fiscal_year=2025&state=NY' },
    { title: 'IRS — 2026 business standard mileage rate set at 72.5 cents per mile', url: 'https://www.irs.gov/newsroom/irs-sets-2026-business-standard-mileage-rate-at-725-cents-per-mile-up-25-cents' },
  ],
}
