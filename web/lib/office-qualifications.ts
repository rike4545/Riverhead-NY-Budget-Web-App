// What the law actually requires of the people who run the Town.
//
// Sourced from three places and nowhere else:
//   • NY Public Officers Law § 3 — the floor for any civil office in the state.
//   • NY Town Law § 23 — qualifications of town officers (the "elector" rule).
//   • Riverhead Town Code Ch. 103, Town Officers and Employees — the Town's own
//     additions, notably the Article VI term limits adopted as L.L. 14-2016.
//
// A deliberate negative finding is recorded below: searching the Riverhead Code
// for "residency" and "residence" returns sex-offender restrictions, zoning
// definitions and solid-waste definitions — and nothing at all about officers or
// employees. The Town imposes no residency rule of its own; the requirement
// comes entirely from state law. That absence is worth stating explicitly,
// because readers reasonably assume a town sets its own rules here.
//
// This is a plain-English summary of statute, not legal advice, and the
// officer/employee distinction below is a real line that decides which rules
// bind whom.

export type Requirement = {
  label: string
  value: string
  detail: string
  source: string
}

export const electedRequirements: Requirement[] = [
  {
    label: 'Age',
    value: '18 or older',
    detail:
      'The only age condition is the general one for holding any civil office in New York. There is no higher minimum for Supervisor or Council, and no maximum.',
    source: 'Public Officers Law § 3(1)',
  },
  {
    label: 'Citizenship',
    value: 'U.S. citizen',
    detail: 'Required for any civil office in the state.',
    source: 'Public Officers Law § 3(1)',
  },
  {
    label: 'Residency',
    value: 'Must live in Riverhead',
    detail:
      'A candidate must be a resident of New York and of the Town, and must be an elector of the Town — a registered voter here — both at the time of election and continuously throughout the term. Moving out of Riverhead mid-term vacates the office.',
    source: 'Public Officers Law § 3(1); Town Law § 23',
  },
  {
    label: 'Term limit',
    value: '12 consecutive years',
    detail:
      'Riverhead limits both the Supervisor and each Council member to 12 consecutive years — six two-year terms, three four-year terms, or any combination. The Town adopted this itself in 2016 and it overrides the state default, which sets no limit.',
    source: 'Riverhead Town Code §§ 103-25, 103-26 (L.L. No. 14-2016)',
  },
  {
    label: 'Disqualifications',
    value: 'Certain corruption convictions',
    detail:
      'A felony conviction under the Penal Law’s bribery or official-misconduct articles bars a person from civil office; the equivalent misdemeanors carry a five-year bar. Separately, a county treasurer, district superintendent of schools, or school district trustee may not serve as Town Supervisor.',
    source: 'Public Officers Law § 3(1); Town Law § 23',
  },
]

// The point of the page. Everything above is about eligibility; none of it is
// about competence, and residents consistently assume otherwise.
export const notRequired = {
  title: 'What the law does not require',
  items: [
    'No education requirement — no degree of any kind, in any subject.',
    'No professional credential. The Supervisor is the Town’s chief fiscal officer and need hold no accounting, finance, or management qualification.',
    'No prior experience in government, budgeting, or management.',
    'No minimum length of residency before running — being an elector on election day is enough.',
    'No competency or examination requirement of any kind.',
  ],
  closing:
    'This is not unusual; it is how nearly every elected office in New York works, and the theory is that the electorate is the qualification test. It is worth knowing all the same, because the Supervisor signs off on a budget of tens of millions of dollars and the only formal barrier to the job is being an adult who lives here and can win more votes than the other candidate.',
}

export const termLimitNote = {
  title: 'Riverhead limits terms — and said why',
  adopted: 'April 19, 2016',
  law: 'Local Law No. 14-2016, codified at Town Code §§ 103-24 through 103-29',
  intent:
    'The Town Board’s stated purpose was “to increase the accountability of and expand participation in the governance of the Town of Riverhead by limiting the number of terms of office for the Supervisor and Town Council.”',
  mechanics:
    'Twelve consecutive years is the cap for each office, counted the same whether served as six two-year terms, three four-year terms, or a mix. Time served by appointment counts toward it. Hitting the cap in one office does not bar someone from running for a different elective Town office.',
  authority:
    'Adopted under Municipal Home Rule Law § 10(1)(ii)a(1), expressly superseding Town Law § 24, which imposes no term limit.',
}

export const appointedStaff = {
  title: 'The Supervisor’s senior staff',
  lede:
    'Department heads and the Town Attorney are not the Supervisor’s hires. They are appointed by the Town Board as a body, at salaries the Board sets, which is a meaningful limit on what any incoming Supervisor can change alone.',
  requirements: [
    {
      label: 'Who appoints them',
      value: 'The Town Board, not the Supervisor',
      detail:
        'The Town Attorney is “appointed by the Town Board for the terms fixed by law at such salary as may from time to time be fixed by the Town Board.” The Board likewise appoints Deputy Town Attorneys and the Administrator of Economic Development and Planning.',
      source: 'Riverhead Town Code §§ 103-14B, 103-19',
    },
    {
      label: 'Merit standard',
      value: 'Only one, and only for the Town Attorney',
      detail:
        'The Code says the Town Attorney “shall be appointed on the basis of his administrative experience and qualifications for the duties of such office.” That is the sole competence standard written into the chapter. No comparable clause governs the other department heads, whose sections describe duties rather than qualifications.',
      source: 'Riverhead Town Code § 103-14B',
    },
    {
      label: 'Residency',
      value: 'State law only',
      detail:
        'Appointed town officers must also be electors of the Town under Town Law § 23, subject to narrow statutory exceptions — including one that lets a town without a resident attorney appoint a non-resident Town Attorney. The Riverhead Code adds nothing: a search of the Town Code for residency provisions turns up sex-offender restrictions and zoning definitions, and no rule at all for officers or employees.',
      source: 'Town Law § 23; Riverhead Town Code (no provision)',
    },
    {
      label: 'Age and citizenship',
      value: 'Same floor as elected office',
      detail:
        'Eighteen or older, a U.S. citizen, and a New York resident — the general qualification for holding any civil office.',
      source: 'Public Officers Law § 3(1)',
    },
  ] as Requirement[],
  officerVsEmployee:
    'One distinction matters and is easy to miss: these rules bind public *officers*, not every public *employee*. A department head who holds an office is covered; ordinary staff generally are not, and civil service rules rather than the Town Code govern most hiring. Where a particular position falls is a legal question this page does not try to settle.',
}

export const disclaimer =
  'A plain-English summary of statute and local law, not legal advice. Quoted language is from the sources named; anyone relying on this for an actual candidacy or appointment should read the sections themselves and speak to the Suffolk County Board of Elections or counsel.'

export const sources = [
  { label: 'NY Public Officers Law § 3', url: 'https://www.nysenate.gov/legislation/laws/PBO/3' },
  { label: 'NY Town Law § 23', url: 'https://www.nysenate.gov/legislation/laws/TWN/23' },
  { label: 'Riverhead Town Code Ch. 103, Art. VI (Term Limits)', url: 'https://ecode360.com/31054318' },
  { label: 'Riverhead Town Code Ch. 103, Art. IV (Town Attorney)', url: 'https://ecode360.com/6246962' },
  { label: 'Riverhead Town Code Ch. 103, Art. V (Dept. of Economic Development & Planning)', url: 'https://ecode360.com/29707857' },
]
