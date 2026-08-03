// Cost–benefit analysis of the stated platforms in the November 3, 2026 Riverhead
// Town Supervisor race — the only Town seat on this ballot. This is a neutral,
// symmetric analysis of each candidate's OWN stated proposals: every plank gets
// a benefit, a cost, and a feasibility/tradeoff note, grounded in this app's
// budget data. It is not an endorsement, a prediction, or a claim about what a
// candidate "really" intends — only an estimate of what each stated proposal
// would take and what it would move.
//
// Platforms are transcribed from CandidateWatchData (iOS CandidateWatchView),
// which sourced them from each campaign's own website/social media plus local
// news coverage. Fiscal anchors (the $2.62M cap gap, the retirement buyout,
// police OT, the $33.4M General Fund balance of which $29.7M is unassigned, the Peconic Bay CPF) are the same figures
// used elsewhere in the app.

export type Plank = {
  proposal: string
  benefit: string
  cost: string
  tradeoff: string
  anchor?: { label: string; href: string } // internal app page that quantifies it
}

export type Candidate = {
  name: string
  party: string
  partyLabel: string
  incumbent: boolean
  site?: string
  background: string
  planks: Plank[]
  sources: string
}

export const supervisorRace2026 = {
  office: 'Town Supervisor',
  seats: 1,
  electionDate: 'November 3, 2026',
  ballotNote:
    'The Supervisor is the only Town seat on the November 2026 ballot. Council members Kern and Rothwell won three-year terms in 2025 (through 2028); Waski and Merrifield are up in 2027. Under NY Town Law the Supervisor prepares the tentative budget and the Council adopts it — so whoever wins still has to work with the current Republican Council majority.',
  disclaimer:
    'This is analysis of each candidate’s stated positions, weighed evenly. Costs and benefits are estimates tied to the Town’s own figures, not campaign estimates or predictions of what will actually be proposed. Every plank is shown with both a benefit and a cost.',
}

export const candidates2026: Candidate[] = [
  {
    name: 'Jerome (Jerry) Halpin',
    party: 'D',
    partyLabel: 'Democrat',
    incumbent: true,
    site: 'https://www.votejerryhalpin.com/',
    background:
      'Incumbent Supervisor; won by 37 votes in November 2025 running against the 2025 budget’s 7.89% tax increase. Former lead pastor in Riverhead for ~22 years.',
    planks: [
      {
        proposal: 'Keep a tight lid on Town spending.',
        benefit:
          'Directly attacks the ~$2.62M by which the 2027 levy is projected to pierce the 2% tax cap. The app already identifies ~$2.1M in firm, individually-sourced recurring trims — so “hold the line” is not an empty slogan here; the line items exist.',
        cost:
          'Most of the budget base is personnel and mandated costs (pension, debt service, insurance) a spending freeze can’t touch. Real restraint means audits, held vacancies, and deferred equipment/capital — each of which trades a dollar saved for a service or a delayed repair.',
        tradeoff:
          'The two largest cost drivers — the PBA and SOA contracts — expire 12/31/2026 and settle through binding arbitration, not a Supervisor’s pen. Much of the 2027 payroll pressure is locked until those settle.',
        anchor: { label: 'The 2027 spending-reduction package', href: '/spending-reduction-2027/' },
      },
      {
        proposal: 'Grow new tax dollars through economic development instead of raising the levy.',
        benefit:
          'Every $1M of new non-property-tax revenue (assessed-value growth, fees, mortgage tax) offsets the cap-busting levy dollar-for-dollar with no service cut and no rate increase — the cleanest way to close the gap.',
        cost:
          'Development is a multi-year lever; it does little for the 2027 gap that lands first. New rooftops and commercial space also bring their own service and infrastructure costs, so net fiscal benefit is slower and smaller than gross new assessment suggests.',
        tradeoff:
          'Sits in direct tension with the next plank (preserve rural character and open space). Land preserved is land off the tax roll; land developed is open space lost. The platform wants both, and the budget can only have so much of each.',
        anchor: { label: 'Where the 2027 levy overshoots the cap', href: '/spending-reduction-2027/' },
      },
      {
        proposal: 'Support businesses and small businesses while preserving rural character and open space.',
        benefit:
          'Open-space preservation is popular and largely funded by the dedicated Peconic Bay Community Preservation Fund — not the general levy — and the Town just retired its CPF land-preservation debt five years early, freeing CPF cash flow.',
        cost:
          'Preserved parcels leave the tax roll permanently and can carry stewardship costs; CPF dollars are restricted and voter-defined, so they can’t be redirected to plug the operating gap.',
        tradeoff:
          'The “business support + preservation” pairing is a genuine balancing act, not a free win: each acre preserved is one not generating new commercial assessment for plank 2.',
        anchor: { label: 'Peconic Bay CPF', href: '/community-preservation-fund/' },
      },
      {
        proposal: 'Build a stable budget that doesn’t over-tax young families and seniors.',
        benefit:
          'Frames the goal as recurring balance rather than one-time patches — the fiscally honest target, and consistent with staying under the tax cap year over year.',
        cost:
          '“Stable” is an outcome, not a mechanism: it still requires either the trims or the new revenue above. If neither fully lands, the only lever left is fund balance — $29.7M of the $33.4M General Fund balance is unassigned and actually flexible — and that is one-time money that can’t fund a recurring gap twice.',
        tradeoff:
          'Protecting specific groups from tax increases can mean shifting cost to fees or districts, which are less visible but still land on the same households.',
        anchor: { label: 'What it means for your tax bill', href: '/my-tax-bill/' },
      },
    ],
    sources: 'votejerryhalpin.com; Riverhead News-Review (Feb. 2026).',
  },
  {
    name: 'Kenneth Rothwell',
    party: 'R/C',
    partyLabel: 'Republican · Conservative',
    incumbent: false,
    site: 'https://www.friendsofkenrothwell.com/',
    background:
      'Current Town Councilman (since 2021) and licensed funeral director; Republican and Conservative nominee for Supervisor. His council seat runs through 2028 and would need separate filling if he wins.',
    planks: [
      {
        proposal: 'Lower the cost of taxes — the campaign’s stated top issue.',
        benefit:
          'Direct, immediately felt relief for every property owner, and the Town has a large cushion to work from: a $33.4M General Fund balance, of which $29.7M is unassigned and actually available.',
        cost:
          'An actual levy cut (versus merely holding growth) widens the ~$2.62M cap gap rather than closing it — the reduction has to be found on top of the gap. Funding a cut from reserves spends one-time money on a recurring obligation and can’t be repeated.',
        tradeoff:
          'The NY tax cap already caps levy growth at ~2%; the fiscal distance between “hold at the cap” and “actually lower” is large, and this plank must be squared with the new-spending planks below.',
        anchor: { label: 'The cap gap and the fund-balance cushion', href: '/spending-reduction-2027/' },
      },
      {
        proposal: 'Make each Town department more self-sustaining to reduce the burden on taxpayers.',
        benefit:
          'Moving costs onto fee-for-service and enterprise/district funding shifts them off the general levy — the model the Town already uses for its sewer, water, and refuse districts.',
        cost:
          'A “self-sustaining” district still charges the same residents; it moves the cost, it doesn’t erase it (the ES5 scavenger-waste line already jumped ~38% in one year). Core services — police, roads, general government — cannot be made fee-funded.',
        tradeoff:
          'District charges are cap-exempt, so this can quietly raise total household cost even as the headline levy falls — the opposite of transparent.',
        anchor: { label: 'Fund-by-fund spending', href: '/spending-reduction-2027/' },
      },
      {
        proposal: 'Expand clean-water access for residents (cites the Manorville clean-water project).',
        benefit:
          'A concrete public-health benefit for households on contaminated private wells, and often substantially grant-, state-, or CPF-water-quality-funded rather than levy-funded.',
        cost:
          'Water-main extension and district formation are capital-intensive and add debt service and district charges for connected properties; the local share still has to be financed.',
        tradeoff:
          'The Peconic Bay CPF’s water-quality allocation is limited and voter-defined; it can fund pieces of this but not an open-ended program.',
        anchor: { label: 'Peconic Bay CPF', href: '/community-preservation-fund/' },
      },
      {
        proposal: 'Expand veterans programs and continue supporting police and first responders.',
        benefit:
          'Services for veterans and sustained public-safety staffing — broadly supported, and public safety is the Town’s core function.',
        cost:
          'This is net-new recurring spending, and it points at the Town’s single largest controllable cost: police. Uniform overtime already ran ~$1.4M in 2024, over budget. Expanding here pulls directly against planks 1 and 2.',
        tradeoff:
          '“Lower taxes” and “expand police/veterans spending” can only coexist with an explicit offset elsewhere; the platform doesn’t yet name that offset.',
        anchor: { label: 'Police overtime & the trim list', href: '/spending-reduction-2027/' },
      },
      {
        proposal: 'Attract high-tech development to build a more sustainable tax base.',
        benefit:
          'High-value commercial assessment is the same base-growth lever in Halpin’s platform — potentially the largest long-run offset to levy pressure.',
        cost:
          'The incentives that attract such development (PILOTs, IDA abatements) defer the very tax revenue they promise, sometimes for years; and the Town’s recent record on non-competitive deals (the Petrocelli Town Square arrangement) is a caution on execution, not just intent.',
        tradeoff:
          'Same development-versus-preservation tension both candidates face, plus a governance question: on what terms, and through what procurement process, the incentives are granted.',
        anchor: { label: 'Procurement & sole-source watch', href: '/election-law-case/' },
      },
    ],
    sources: 'friendsofkenrothwell.com; Riverhead News-Review (Feb. 2026).',
  },
]

// Cross-cutting synthesis — where the two platforms actually converge and diverge
// on fiscal substance, and the costs neither has yet named.
export const synthesis = {
  common: [
    'Both run on tax-base growth over levy increases, and both promise spending restraint — on fiscal strategy they are more alike than different.',
    'Both face the same unnamed constraint: the ~$2.62M by which the 2027 levy is projected to pierce the tax cap, and the PBA/SOA contracts expiring 12/31/2026 that settle by binding arbitration.',
  ],
  divergence: [
    'The incumbent’s platform is mostly “hold and grow” — restraint plus development — which maps onto the identified trims but is slow on the revenue side.',
    'The challenger adds concrete new-spending planks (veterans, police, clean water) alongside an explicit tax cut, which sharpens the appeal but requires naming an offset the platform hasn’t yet specified.',
    'Both share the development-versus-open-space tension; neither has reconciled it in dollar terms.',
  ],
  unnamedCost:
    'Neither platform, as stated, closes the ~$2.62M cap gap on paper. That is the honest scorecard: the ideas are directionally sound, but the arithmetic to hit the cap still has to be shown — which is exactly what the 2027 spending-reduction page lets a resident test lever by lever.',
}

// A view that belongs to neither campaign: how a neutral fiscal observer — and a
// resident — might address a town that has raised taxes repeatedly and pierced
// the cap in multiple recent years. These are recognized municipal-budgeting
// practices (GFOA/OSC), framed as considerations, not endorsements.
export const neutralView = {
  intro:
    'Set the campaigns aside. Riverhead has leaned on above-cap levy increases and cap overrides in several recent years — a 7.89% levy increase in the 2025 budget, and adopted overrides in 2023, 2024, and 2026. When a town has to override the cap that often, the issue is usually structural, not a single bad year: recurring costs are outgrowing recurring revenue, and the gap is being closed late, at adoption, rather than planned for. Here is how that is normally addressed, independent of who wins.',
  history: [
    '2025 adopted budget: ~7.89% tax-levy increase.',
    'Tax-cap overrides adopted in 2023, 2024, and 2026.',
    '2027 projection: the levy again pierces the ~2% cap, by about $2.62M, on current trends.',
  ],
  principles: [
    {
      title: 'Fund recurring costs with recurring revenue',
      detail:
        'The most common structural error is patching an operating gap with one-time money — appropriated fund balance, one-off sales. It balances this year and guarantees the same gap (plus growth) next year. A simple rule — reserves only for one-time or emergency needs — prevents the cliff.',
    },
    {
      title: 'Adopt a rolling multi-year forecast',
      detail:
        'A 3–5 year projection of revenues, contractual payroll, pension, and debt turns a surprise at adoption into a problem seen 18 months out, when small corrections still work. The gap this app models for 2027 is exactly the kind of thing a standing forecast would have flagged early.',
    },
    {
      title: 'Set — and respect — a fund-balance target',
      detail:
        'The $33.4M General Fund balance — $29.7M of it unassigned — is a genuine strength; GFOA guidance is to hold at least ~two months of operating expenditures. That cushion is for emergencies and cash flow, not for buying down recurring costs. Naming the target keeps reserves from being spent down quietly year after year.',
    },
    {
      title: 'Treat a cap override as an exception, decided in the open',
      detail:
        'The cap can be exceeded legally — but a deliberate override local law, adopted in public with the 60% vote on the record and a stated reason, is very different from backing into an increase. Overriding routinely, without naming what it buys, is how the discipline erodes.',
    },
    {
      title: 'Go at the real cost drivers, with the data',
      detail:
        'The 2026 retirement incentive, police-overtime normalization, and the audited line-item increases in the Budget Supplement are where the recurring dollars actually are. Prepare early and with comparables for the PBA/SOA arbitrations expiring 12/31/2026 — that is the largest single driver and it is decided by an arbitrator, not the budget.',
    },
    {
      title: 'Diversify revenue honestly — but don’t bank it early',
      detail:
        'Economic development, cost-aligned fees, and grants are all legitimate offsets to the levy. The discipline is timing: base growth is real but slow, so it belongs in the multi-year plan, not as a same-year plug for a gap that lands now.',
    },
  ],
  citizen:
    'As a resident, the highest-leverage moves are unglamorous: show up at the budget hearings and the cap-override hearing before the vote (not after); ask for the multi-year forecast and a written fund-balance policy; and push back specifically when one-time money is used to fund a recurring cost. The tools on this site — the upcoming-meetings schedule, the tax-cap history, and the lever-by-lever spending-reduction page — exist so those questions can be asked with the Town’s own numbers in hand.',
  sources:
    'Framing follows Government Finance Officers Association (GFOA) best practices and NY State Comptroller (OSC) fiscal-stress guidance. Local figures are from the Town’s adopted budgets and this app’s parsed datasets.',
}
