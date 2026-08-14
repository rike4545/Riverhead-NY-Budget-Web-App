// Riverhead's municipal credit rating: where it stands, how it got there, how
// it compares to nearby towns (Brookhaven in particular, which holds Moody's
// and S&P's top rating), and what the rating agencies' own stated criteria
// suggest would move it.
//
// Sourcing note: primary rating-agency documents (moodys.com, spglobal.com)
// and several town press-release pages (brookhavenny.gov, riverheadlocal.com)
// were not directly fetchable in the environment that compiled this file.
// Every quote and figure below is flagged for confidence: VERIFIED (matches
// a figure already sourced elsewhere on this site from an audited filing) or
// REPORTED (from news coverage / press releases, not independently confirmed
// against the primary document). Nothing here should be read as a direct,
// word-for-word quotation unless marked VERIFIED — reported quotes are the
// best available reconstruction from public coverage, not a certified
// transcript.

export const riverheadCurrent = {
  agency: "Moody's Investors Service",
  rating: 'Aa2',
  outlookKnown: false,
  affirmedDate: 'February 16, 2024',
  shortTermRating: 'MIG 1',
  shortTermContext: 'assigned to a $20 million Bond Anticipation Note renewal issued alongside the Feb. 2024 affirmation',
  confidence: 'REPORTED',
  source: {
    title: "RiverheadLOCAL, \"Moody's affirms Riverhead's credit rating, citing downtown growth, strong local economy and town's conservative budgeting,\" Feb. 25, 2024",
    detail: 'A primary Moody\'s rating-action letter is hosted by the Town itself (townofriverheadny.gov/files/documents), but could not be retrieved in this pass to quote verbatim.',
  },
}

export type RatingEvent = {
  date: string
  action: string
  rating: string
  quote?: string
  quoteAttribution?: string
  confidence: 'VERIFIED' | 'REPORTED'
}

export const riverheadRatingHistory: RatingEvent[] = [
  {
    date: 'March 2015',
    action: 'Downgraded',
    rating: 'Aa2 → Aa3',
    confidence: 'REPORTED',
  },
  {
    date: 'July 23, 2021',
    action: 'Upgraded',
    rating: 'Aa3 → Aa2',
    quote:
      "the town's much improved reserve position over the past several years along with the expectation that these levels will be maintained in the future; the town's sizable tax base [and] declining debt burden, but elevated OPEB liability",
    quoteAttribution: "Moody's rating rationale, as reported by RiverheadLOCAL",
    confidence: 'REPORTED',
  },
  {
    date: 'February 16, 2024',
    action: 'Affirmed',
    rating: 'Aa2 (plus MIG 1 short-term, on a $20M BAN renewal)',
    quote: "the Town Board's conservative fiscal budgeting is leading us down the right path",
    quoteAttribution: 'Bill Rothaar, Riverhead Financial Administrator, as reported by RiverheadLOCAL',
    confidence: 'REPORTED',
  },
]

export const riverheadRatingGap =
  "The most recent Moody's action found in public reporting is the February 2024 affirmation. Riverhead carried $21,975,000 in Bond Anticipation Notes as of Dec. 31, 2025 — a balance that typically gets renewed annually and usually comes with a fresh (if brief) rating letter. If a 2024–2025 renewal rating exists, it isn't in the coverage indexed here; ask the Financial Administrator's office for the most recent letter before treating Feb. 2024 as current."

export const brookhaven = {
  moodyRating: 'Aaa',
  spRating: 'AAA',
  outlook: 'stable',
  consecutiveMoodyAaaYears: 7,
  asOf: 'reported ~September 2025',
  confidence: 'REPORTED' as const,
  spRationale:
    'the growing local economy, comprehensive formal financial management policies, strong budgetary performance with very strong reserves, and moderate debt with rapid amortization and manageable pension and OPEB costs',
  spRationaleConfidence: 'REPORTED' as const,
  history:
    "Brookhaven's climb to a top rating predates the current administration — coverage traces AAA-adjacent recognition back to at least 2015 (under then-Supervisor Ed Romaine) and a 2020 upgrade to triple-A, carried forward through Supervisor Dan Panico. It reads as a decade-plus of sustained practice, not one administration's achievement.",
  sources: [
    "Town of Brookhaven press release, \"Panico Announces Brookhaven Maintains AAA Rating with Stable Outlook from Moody's and S&P Global\" (~Sept. 2025)",
    'The Bond Buyer, "Budgeting credited for Brookhaven, N.Y., upgrade to triple-A" (2020)',
  ],
}

// The user-supplied quote — "We have remained disciplined in our budgeting,
// strengthened the Town's financial position, and planned responsibly for
// Brookhaven's future." — could NOT be located verbatim in any retrievable
// source after multiple targeted searches. The closest confirmed-adjacent
// statement is a DIFFERENT Panico quote, about the 2026 budget PROPOSAL, not
// the AAA rating announcement. Per this site's sourcing standard, an
// unverified quote is not published as a direct attribution — it's noted
// here so the gap is visible rather than silently dropped, and so a future
// pass can confirm it against brookhavenny.gov/CivicAlerts.aspx?AID=4604.
export const brookhavenQuoteNote = {
  suppliedQuote:
    "We have remained disciplined in our budgeting, strengthened the Town's financial position, and planned responsibly for Brookhaven's future.",
  status: 'UNVERIFIED — not found verbatim in any source checked; not published as an attributed quote on this page.',
  closestConfirmedAdjacent:
    '"a plan that strengthens the town\'s core functions and reflects the priorities of our residents — safety, quality of life and financial responsibility" — Supervisor Dan Panico, on the 2026 budget PROPOSAL (a different announcement than the AAA rating news).',
}

export type PeerRating = {
  town: string
  moodyRating?: string
  moodyNotchesBelowAaa: number // 0 = Aaa; used only for the same-agency (Moody's) comparison bar
  otherAgencyRating?: string
  asOf: string
  confidence: 'VERIFIED' | 'REPORTED'
  isRiverhead?: boolean
}

// Same-agency (Moody's) comparison only — mixing S&P/Fitch notches onto the
// same bar would require an equivalence table this site can't source, so
// those ratings are shown as a separate label instead of a bar position.
export const peerRatings: PeerRating[] = [
  { town: 'Brookhaven', moodyRating: 'Aaa', moodyNotchesBelowAaa: 0, otherAgencyRating: 'AAA (S&P)', asOf: '~Sept. 2025', confidence: 'REPORTED' },
  { town: 'Smithtown', moodyRating: 'Aaa', moodyNotchesBelowAaa: 0, asOf: 'reaffirmed 2024–2026 bond issues', confidence: 'REPORTED' },
  { town: 'Islip', moodyRating: 'Aaa', moodyNotchesBelowAaa: 0, asOf: 'Oct. 2020 — may be stale, re-verify', confidence: 'REPORTED' },
  { town: 'Southold', moodyRating: 'Aa1', moodyNotchesBelowAaa: 1, asOf: 'July 2015 — may be stale, re-verify', confidence: 'REPORTED' },
  { town: 'Riverhead', moodyRating: 'Aa2', moodyNotchesBelowAaa: 2, asOf: 'affirmed Feb. 2024', confidence: 'REPORTED', isRiverhead: true },
  { town: 'Huntington', otherAgencyRating: 'AAA (Fitch)', moodyNotchesBelowAaa: 0, asOf: 'no Moody\'s rating found', confidence: 'REPORTED' },
  { town: 'Suffolk County', moodyRating: 'Baa1', moodyNotchesBelowAaa: 7, otherAgencyRating: 'AA- (Fitch & S&P, Oct. 2025)', asOf: 'Moody\'s downgraded A3 → Baa1 in 2020', confidence: 'REPORTED' },
]

// General rating-criteria framing (Moody's US Cities & Counties Methodology
// and S&P's local-government criteria). Weights are approximate — search
// synthesis of secondary summaries, not a read of the primary methodology
// PDFs (both moodys.com and spglobal.com were unreachable) — so they're
// presented as illustrative ranges, not citable exact percentages.
export type CriteriaFactor = {
  factor: string
  approxWeight: string
  whatItMeans: string
  riverheadRead: string
}

export const ratingCriteria: CriteriaFactor[] = [
  {
    factor: 'Economy / tax base',
    approxWeight: '~30%',
    whatItMeans: 'Total taxable value, value per resident, income levels, and how diversified the local economy is.',
    riverheadRead:
      "A strength that's improving: Moody's Feb. 2024 affirmation specifically cited downtown redevelopment and a strong local economy. EPCAL/Calverton remains underused capacity for further tax-base diversification.",
  },
  {
    factor: 'Financial position / reserves',
    approxWeight: '~30%',
    whatItMeans: 'Fund balance as a share of revenue, and — agencies say this explicitly — whether that level is expected to hold, not just its snapshot value.',
    riverheadRead:
      "Riverhead's clearest strength: unassigned General Fund balance was about 42.9% of 2026 appropriations at the 2025 audit — above Brookhaven's own ~38.8% posture. This has not translated into a rating edge, which suggests other factors are the binding constraint.",
  },
  {
    factor: 'Management / formal policies',
    approxWeight: '~10–20%',
    whatItMeans: 'Whether budgeting, multi-year planning, and reserve policy are written, followed, and disclosed — not just practiced informally.',
    riverheadRead:
      "Brookhaven's S&P rationale explicitly credits \"comprehensive formal financial management policies.\" Worth confirming Riverhead's own 15%/20% reserve policy is a standing Town Board resolution, prominently disclosed in the AFR's MD&A the way a rating analyst would look for it.",
  },
  {
    factor: 'Debt & long-term liabilities',
    approxWeight: '~20–30%',
    whatItMeans: 'Debt burden relative to the tax base and revenue, how fast principal amortizes, and pension/OPEB liabilities.',
    riverheadRead:
      "Split picture: bonded debt is a genuine strength (just 3.78% of the constitutional debt limit used). But OPEB (retiree health) is a documented drag — Moody's named \"elevated OPEB liability\" explicitly in the 2021 upgrade language, and Riverhead's $152.6M 2023-audited liability ranks 4th-highest per resident among 10 Suffolk towns.",
  },
]

export type Lever = {
  title: string
  detail: string
  evidence: string
}

export const levers: Lever[] = [
  {
    title: 'Start pre-funding OPEB through a trust',
    detail:
      "New York's General Municipal Law §6-r lets municipalities establish an OPEB trust to pre-fund retiree health costs instead of paying them year-to-year out of the operating budget. Riverhead's $152.6M liability (2023 audit) — the specific factor Moody's flagged as a drag in 2021 — keeps growing under pay-as-you-go. Directing part of the reserve surplus already identified on this site's Reserves page toward seeding a trust would be a concrete, board-actionable step rating agencies explicitly reward.",
    evidence:
      "OPEB liability $152,597,117 (2023 audit); Riverhead ranks 4th-highest of 10 Suffolk towns on a per-resident basis ($13,726/resident, Empire Center OPEB tool) — behind only the smaller East End towns that spread a similar total across far fewer people.",
  },
  {
    title: 'Close the last structural gaps with recurring revenue, not one-time transfers',
    detail:
      "The 2026 adopted budget's General Fund still needed roughly $74,283 in one-time money to true up a mismatch identified in the supplement. It's small, but agencies explicitly reward towns that \"balance responsibly — without dipping into reserves\" (cited for Smithtown's own rating). Fixing recurring-line mismatches at adoption, not with fund balance, keeps that praise applicable to Riverhead too.",
    evidence: "2026 adopted budget General Fund mismatch: $74,283 (see the Reserves & Fund Balance page, deployment option #1).",
  },
  {
    title: 'Put the reserve policy in writing, and put it where a rating analyst looks',
    detail:
      "Riverhead's own 15% minimum / 20% upper reserve policy already exists in practice, and the Town is currently running well above it (42.9%) — a fact this site's own modeling shows exceeds every peer town's benchmark. What isn't confirmed is whether that policy is a standing, written Town Board resolution, disclosed prominently in the AFR's Management's Discussion & Analysis the way Brookhaven's S&P rationale specifically credits (\"comprehensive formal financial management policies\"). Confirming and foregrounding that disclosure costs nothing and directly answers a named criterion.",
    evidence: "Riverhead's current unassigned fund balance: 42.9% of 2026 General Fund appropriations, vs. Brookhaven's ~38.8% and Smithtown's ~39.9% (see lib/reserve-policy.ts peerBenchmarks).",
  },
  {
    title: 'Keep growing the tax base beyond Tanger and Route 58',
    detail:
      'Moody\'s own 2024 affirmation cited downtown redevelopment and economic growth as a positive. EPCAL/Calverton — the former Grumman site — remains a large, underused parcel the Town has worked for years to return fully to the tax rolls. Continued progress there is a direct, on-record positive for the "economy / tax base" factor, and reduces reliance on a small number of big-box and outlet-mall ratables.',
    evidence: 'Largest taxpayers concentrated in Tanger Outlets, PSEG, and the Route 58 big-box corridor (see Community & tax base page); EPCAL redevelopment still in progress.',
  },
  {
    title: 'Ask Moody\'s for a fresh look',
    detail:
      "The last confirmed rating action found in public reporting is Feb. 2024 — before the reserve position grew further and before the 2026 buyout/retirement program reshaped payroll. The 2021 upgrade explicitly cited an \"expectation that these [reserve] levels will be maintained in the future.\" Riverhead has since exceeded that expectation. A rating review timed to reflect the current, stronger reserve position — rather than waiting for the next routine BAN renewal — is a low-cost, board-directed step.",
    evidence: 'Moody\'s Feb. 2024 affirmation vs. $21,975,000 in BANs outstanding as of Dec. 31, 2025 implying at least one un-reported renewal since.',
  },
]

export const caveats = [
  "Every quote and figure here that isn't independently confirmed against a primary audited document is marked REPORTED — reconstructed from news coverage and press releases, not a certified transcript of the rating agency's own text.",
  'Rating-agency methodology weights are approximate, synthesized from secondary summaries rather than a direct read of the current Moody\'s/S&P methodology PDFs — treat them as illustrative, not precise.',
  "Islip's Aaa (2020) and Southold's Aa1 (2015) are the newest data points found for those towns and may be outdated; ratings can and do move without making it into easily searchable coverage.",
  'The user-supplied Brookhaven quote about disciplined budgeting could not be verified verbatim against any source checked and is not presented here as an attributed quotation — see the note above.',
]
