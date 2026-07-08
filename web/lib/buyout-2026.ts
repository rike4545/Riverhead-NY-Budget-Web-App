// The Town of Riverhead's 2026 Voluntary Retirement Incentive Program — the
// final, executed union stipulations (CSEA, PBA, SOA), transcribed from the
// July 7, 2026 Town Board agenda packet (resolutions 2026-678, 2026-679,
// 2026-680). This is the adopted program language, not a hypothetical model.

export type BuyoutProgram = {
  unit: string
  unitFull: string
  resolution: string
  retirementSystem: string
  serviceRequirement: string
  benefitSummary: string
  benefitDetail: string[]
}

export type Buyout2026 = {
  title: string
  dated: string
  status: string
  agendaNote: string
  source: { title: string; url: string }
  commonEligibility: string[]
  timeline: { date: string; event: string }[]
  commonTerms: string[]
  programs: BuyoutProgram[]
  caveats: string[]
}

export const buyout2026: Buyout2026 = {
  title: '2026 Voluntary Retirement Incentive Program',
  dated: 'July 2026',
  status: 'Union stipulations executed; Town Board ratification on the July 7, 2026 agenda',
  agendaNote:
    'The three union agreements were negotiated and executed as stipulations; the Town Board ratifies them by resolution. The recorded votes will appear in the Town Board Votes record once the July 7, 2026 minutes are published.',
  source: {
    title: 'Town of Riverhead Town Board agenda, July 7, 2026 — resolutions 2026-678 (CSEA), 2026-679 (SOA), 2026-680 (PBA)',
    url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes',
  },
  commonEligibility: [
    'Employed by the Town as of June 1, 2026.',
    'Voluntarily resigns from Town service for retirement purposes, effective no later than October 1, 2026.',
    'Had not, as of June 1, 2026, already submitted a letter of intended separation.',
    'Is not separating under any other prior stipulation, State-offered incentive, or similar program, and is not the subject of formal disciplinary action during the 2026 fiscal year.',
  ],
  timeline: [
    { date: 'June 1, 2026', event: 'Must be employed by the Town on this date to qualify.' },
    { date: 'September 1, 2026', event: 'Deadline to elect: deliver the irrevocable letter of resignation and signed waiver/release.' },
    { date: 'October 1, 2026', event: 'Latest effective retirement date under the incentive.' },
  ],
  commonTerms: [
    'Deliver a duly executed "Irrevocable Letter of Resignation" to the Town Supervisor by September 1, 2026, stating the intended retirement date (no later than October 1, 2026).',
    'Simultaneously submit a signed "Waiver and General Release of Claims."',
    'The incentive payment is added to the employee\'s final W-2 and paid minus applicable taxes and withholdings, on top of any severance already owed under the collective bargaining agreement.',
    'Retiree health insurance is unchanged: available only if the employee otherwise meets the preexisting eligibility criteria in the applicable contract.',
  ],
  programs: [
    {
      unit: 'CSEA',
      unitFull: 'Civil Service Employees Association, Local 1000, AFSCME, AFL-CIO, Riverhead Unit of Suffolk Local #852',
      resolution: '2026-678',
      retirementSystem: 'NYS Employees’ Retirement System (ERS)',
      serviceRequirement: 'Must retire as a fully vested Tier IV ERS member.',
      benefitSummary: 'Flat $12,500 lump sum',
      benefitDetail: [
        'A one-time lump sum payment of $12,500.00, included in the employee’s final W-2.',
      ],
    },
    {
      unit: 'PBA',
      unitFull: 'Riverhead Town Police Benevolent Association',
      resolution: '2026-680',
      retirementSystem: 'NYS Police and Fire Retirement System (PFRS)',
      serviceRequirement: 'Must retire into PFRS with the mandated 20 years of New York State law-enforcement service.',
      benefitSummary: '$1,000 per year of service + up to 30 sick days',
      benefitDetail: [
        'A lump sum of $1,000.00 for each year of service with the Town.',
        'Plus a lump sum for up to 30 additional accrued sick days beyond the contractual maximum, paid at the average of the employee’s base salary over 2024, 2025 and 2026.',
      ],
    },
    {
      unit: 'SOA',
      unitFull: 'Riverhead Town Superior Officers Association, Inc.',
      resolution: '2026-679',
      retirementSystem: 'NYS Police and Fire Retirement System (PFRS)',
      serviceRequirement: 'Must retire into PFRS with the mandated 20 years of New York State law-enforcement service.',
      benefitSummary: '$1,000 per year of service + up to 30 sick days',
      benefitDetail: [
        'A lump sum of $1,000.00 for each year of service with the Town.',
        'Plus a lump sum for up to 30 additional accrued sick days beyond the contractual maximum, paid at the average of the employee’s base salary over 2024, 2025 and 2026.',
      ],
    },
  ],
  caveats: [
    'The total cost depends on how many eligible employees actually elect to retire, which is not known until the September 1, 2026 election deadline passes.',
    'The ratification resolutions themselves state no direct fiscal impact; the incentive payouts and any replacement-hiring decisions are handled through the operating budget.',
    'Retirement-benefit eligibility (ERS tier / PFRS 20-year) is set by New York State, not the Town; the incentive only adds the lump-sum payments described above.',
  ],
}
