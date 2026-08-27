// Know-your-rights material for Riverhead residents interacting with federal
// immigration enforcement, plus the New York protections enacted in 2026.
//
// WHY THIS SITS ON A BUDGET SITE: the state protections below were enacted as
// part of the FY27 Enacted Budget, so they are budget legislation. That is the
// honest connection — this page does not pretend to be fiscal analysis.
//
// SOURCING AND ONE IMPORTANT CORRECTION. The rights section is drawn from the
// New York City Comptroller's Immigrant Workers Resource Guide, and the state
// measures from the Governor's announcement of May 28, 2026. But the
// Comptroller's guide is written for New York City, and Riverhead is in Suffolk
// County — so two things in it do not carry over, and are deliberately not
// repeated here as though they did:
//
//   • Its statement that city agencies do not cooperate with ICE rests on New
//     York City local law. Riverhead residents are covered instead by the state
//     law summarised below, which is what actually applies here.
//   • Its help line — 311, or the Mayor's Office of Immigrant Affairs — serves
//     New York City. A Riverhead resident calling it will not reach anyone who
//     can help them. The resources listed here serve Long Island and the state.
//
// The constitutional rights themselves are federal and apply in Riverhead
// exactly as they do in the city. Every phone number below was read off the
// publishing organisation's own website rather than a search result.

export type RightsSection = {
  setting: string
  lede: string
  points: string[]
}

export const rights: RightsSection[] = [
  {
    setting: 'If agents come to your home',
    lede: 'You do not have to open the door. Speaking through it costs you nothing and gives up nothing.',
    points: [
      'Stay calm. You do not have to open the door unless you are shown a warrant signed by a judge.',
      'You have the right to speak through the door, and to ask someone else in the household to do the talking.',
      'Ask whether they are immigration agents, why they are there, and to see a badge or identification through the window or peephole.',
      'Ask whether they have a warrant signed by a judge. If they say yes, you can ask them to slide it under the door or hold it up to a window so you can read it.',
      'You do not have to let agents in unless they have a judicial search warrant, or an arrest warrant naming a person in your home or the areas to be searched.',
      'You have the right to remain silent even if they do have a warrant.',
      'Do not lie and do not produce false documents. Do not sign anything without speaking to a lawyer first.',
    ],
  },
  {
    setting: 'If agents come to your workplace',
    lede: 'Public areas and private areas are treated differently, and the difference is a judge’s signature.',
    points: [
      'Agents may enter the public areas of a workplace without a warrant.',
      'They cannot lawfully enter private areas — break rooms, storage areas, anywhere the public cannot go — without a judicial warrant signed by a judge or magistrate, or the employer’s permission.',
      'You have the right to remain silent.',
      'You have the right to refuse a search of your pockets or belongings. Say it out loud: "I do not consent to the search."',
      'You have the right to speak to an attorney before signing anything or answering questions.',
      'If you are detained, you can tell the agent about any medical need, and about arrangements needed for your children or dependent adults.',
      'You can ask for an interpreter in your own language for any conversation or hearing.',
    ],
  },
  {
    setting: 'If you are stopped in public or in a car',
    lede: 'The safest thing and the strongest thing are the same thing: stay calm, and say that you are staying silent.',
    points: [
      'Stay calm. Do not run, argue, or obstruct. Keep your hands where they can be seen.',
      'You have the right to remain silent — and if you intend to use it, say so out loud.',
      'You do not have to answer questions about where you were born, whether you are a U.S. citizen, or how you entered the country.',
      'In a car, both the driver and the passengers have the right to remain silent.',
      'A passenger may ask whether they are free to leave. If the officer says yes, you can calmly leave.',
    ],
  },
]

export const warrantNote = {
  title: 'The word "warrant" is doing a lot of work',
  body:
    'A judicial warrant is signed by a judge or magistrate and names the person or the place to be searched. That is the document that can require a door to be opened. An administrative form issued by the immigration agency itself is not the same thing and does not carry the same authority. You are entitled to read it before deciding anything — through a window, or slid under the door.',
}

export type StateMeasure = { title: string; detail: string }

// From the Governor's announcement of May 28, 2026 — enacted as part of the
// FY27 Enacted Budget.
export const stateLaw = {
  signed: 'May 28, 2026',
  vehicle: 'FY27 Enacted Budget',
  measures: [
    {
      title: 'Local police handle local crimes',
      detail:
        'Local governments, state and local police, and state and local corrections may not enter 287(g) agreements or similar arrangements that put local personnel and facilities to work on civil immigration enforcement. Local governments also may not pay toward building or running an immigration detention facility, or rezone to allow one without public input.',
    },
    {
      title: 'No masked officers',
      detail:
        'State, local and federal officers are prohibited from wearing face coverings while interacting with the public. Tactical equipment, sunglasses and medical masks are excluded. A willful violation is an infraction; repeat willful violations are a misdemeanor.',
    },
    {
      title: 'A way to sue over constitutional violations',
      detail:
        'New Yorkers could already sue state and local officials over constitutional violations under federal civil rights law, but suits against federal officials were far more limited. State law now allows a New Yorker to bring an action against federal, state or local officials for violating their constitutional rights.',
    },
    {
      title: 'Public employees and schools are off limits',
      detail:
        'State and local civilian agencies and public school resources — including employee time — may not be used for civil immigration enforcement. Officials may not question or investigate someone solely on civil immigration grounds absent a federal judicial warrant, disclose identifying information to immigration authorities, give access to non-public areas, or use immigration officers as interpreters. A student may not be released or transferred into immigration custody even if a parent has been detained, absent a judicial warrant or court order.',
    },
    {
      title: 'Sensitive locations stay closed without a judicial warrant',
      detail:
        'Civilian state, local and school employees may not admit immigration authorities to any non-public area of a state or municipally owned or operated facility without a judicial warrant — housing, parks, childcare, preschools, hospitals, schools, dorms, health care facilities, community centers, libraries and shelters. Polling places are covered too, and privately operated hospitals, daycares, schools, housing and houses of worship are empowered to do the same.',
    },
    {
      title: 'Every student keeps the right to a free public education',
      detail:
        'The right to a free public education regardless of immigration status is codified, and practices around collecting or disclosing immigration status that would chill that right are prohibited.',
    },
  ] as StateMeasure[],
}

export type HelpResource = {
  name: string
  phone?: string
  hours?: string
  detail: string
  url: string
  scope: string
}

// Every number here was read from the organisation's own website.
export const help: HelpResource[] = [
  {
    name: 'New Americans Hotline — New York State Office for New Americans',
    phone: '1-800-566-7636',
    hours: '8:00 AM – 8:00 PM Monday to Friday; 9:00 AM – 5:00 PM Saturday and Sunday',
    detail:
      'Answers immigration and naturalization questions and refers callers to free legal help. Interpretation available. Statewide, so it serves Riverhead.',
    url: 'https://dos.ny.gov/office-new-americans',
    scope: 'Statewide',
  },
  {
    name: 'CARECEN — Central American Resource Center, Suffolk office',
    phone: '(631) 273-8721',
    detail:
      'Runs the Office for New Americans’ Suffolk Opportunity Center. Free naturalization help, and legal representation in asylum, VAWA, U-visa, family petition, work permit and DACA matters.',
    url: 'https://www.carecenny.org/legal-services',
    scope: 'Long Island',
  },
  {
    name: 'Long Island Regional Immigration Assistance Center',
    detail:
      'Free consultations on the immigration consequences of criminal charges and family court matters for Suffolk County residents.',
    url: 'https://sclas.org/long-island-regional-immigration-assistance-center/',
    scope: 'Suffolk County',
  },
  {
    name: 'Legal Services of Long Island',
    detail: 'Confidential screening for free civil legal help, including immigration matters, for low-income Long Islanders.',
    url: 'https://legalservicesli.org/immigrants/',
    scope: 'Long Island',
  },
]

export const nycCaveat =
  'Much of the know-your-rights material circulating online is written for New York City. Its advice on your constitutional rights holds anywhere, but its help lines do not: calling 311 or the Mayor’s Office of Immigrant Affairs will not reach anyone who can assist a Riverhead resident. The numbers above serve Long Island and New York State.'

export const disclaimer =
  'This page summarises published guidance from the New York City Comptroller’s Office and the Governor’s Office. It is not legal advice, it was not written by a lawyer, and no one should rely on it in place of one. If you are facing enforcement, call the New Americans Hotline above.'

export const sources = [
  {
    title: 'New York City Comptroller — Your Rights when Interacting with Immigration and Customs Enforcement (ICE)',
    url: 'https://comptroller.nyc.gov/services/for-the-public/immigrant-workers-resource-guide/know-your-rights/your-rights-when-interacting-with-immigration-and-customs-enforcement-ice/',
    covers: 'The rights described above, at home, at work, and in public.',
  },
  {
    title: 'Governor Hochul Signs Comprehensive Immigration Plan to Protect New Yorkers Against ICE (May 28, 2026)',
    url: 'https://www.governor.ny.gov/news/governor-hochul-signs-comprehensive-immigration-plan-protect-new-yorkers-against-ice',
    covers: 'The six state measures, enacted as part of the FY27 Enacted Budget.',
  },
  {
    title: 'New York State Office for New Americans',
    url: 'https://dos.ny.gov/office-new-americans',
    covers: 'The New Americans Hotline number and its hours.',
  },
]

// WHAT THE NEIGHBOURING TOWNS DID. The state law above sets a floor; it does not
// tell a town how its own police should behave when federal agents arrive. Three
// East End towns answered that three different ways, and the contrast is the
// useful part for a Riverhead resident.
//
// Riverhead's own entry needed the most care. Searching every Town Board
// resolution this site has parsed — 42 meetings across 2025 and 2026 — turns up
// nothing on immigration enforcement. That is a statement about the resolution
// record, not proof no policy exists: a police department can hold a general
// order that never reaches a Town Board vote. The entry says that and no more.

export type TownResponse = {
  town: string
  status: 'adopted' | 'stated-position' | 'no-action-on-record'
  headline: string
  detail: string
  what: string[]
  asOf: string
  sources: { title: string; url: string }[]
}

export const regionalResponses: TownResponse[] = [
  {
    town: 'Southold',
    status: 'adopted',
    headline: 'Adopted a written police response protocol — as a resolution, not a local law',
    asOf: 'August 25, 2026',
    detail:
      'After months of debate that began with federal enforcement in Greenport, the Town Board settled on a resolution memorialising a procedure written by Police Chief Steven Grattan. It chose a resolution over a local law after the town attorney questioned whether parts of a law would be enforceable, and after board members argued over how far a town may direct its own police chief — the final text says the Board “acknowledges” the procedure rather than adopts or directs it.',
    what: [
      'When police learn an outside agency is operating in town — by advance notice, a 911 call, or an officer on patrol — an officer is dispatched to verify it is actually happening.',
      'Once verified, Southold officers provide a “peacekeeping and calming presence,” activate body-worn cameras, and try to de-escalate confrontations involving bystanders — while not positioning themselves so as to impede the federal operation.',
      'An earlier draft said officers would “neither obstruct nor assist.” The chief objected that this could stop his officers intervening if someone were attacked, so the final language preserves their duty to “act as required by law.”',
      'A notification chain runs from the chief to the supervisor, then to Town Board members, the Greenport mayor, and administrators of affected schools, hospitals and clinics — for “situational awareness and preparedness only.”',
      'The chief issues a “timely public statement” of non-sensitive information afterwards, which may wait until an operation has ended if releasing it sooner would compromise safety.',
      'All sworn officers receive ongoing de-escalation training, and the Town Board, sitting as the Board of Police Commissioners, reviews the town’s own response afterwards — explicitly not whether the federal agency was justified.',
      'Supervisor Al Krupski said the town is not going in the direction of the OLA model local law. Councilman Brian Mealy put the reasoning plainly at the work session: “We have to do it the Southold way. We can’t do it the same way as East Hampton Village.”',
    ],
    sources: [
      {
        title: 'North Fork Sun — Southold finalizes police response protocol for future immigration enforcement actions (August 25, 2026)',
        url: 'https://northforksun.com/southold-finalizes-police-response-protocol-for-future-immigration-enforcement-actions/',
      },
      {
        title: 'The Suffolk Times — Southold Town Board passes communication resolution regarding ICE and outside agency activities (August 26, 2026)',
        url: 'https://suffolktimes.timesreview.com/2026/08/southold-town-board-agrees-on-communication-resolution-regarding-ice-and-outside-agency-activities/',
      },
    ],
  },
  {
    town: 'Southampton',
    status: 'stated-position',
    headline: 'The Supervisor stated a police position out loud, but no local law has been adopted',
    asOf: 'Position stated November 2025; still no law as of April 2026',
    detail:
      'After enforcement activity in Hampton Bays and Westhampton, Supervisor Maria Moore told residents at a Town Board meeting that Southampton police neither assist nor coordinate with federal immigration agents, and that the agency does not notify the department before operating in town. Advocates have kept pressing to have that written into law rather than left as a statement.',
    what: [
      'Moore: Southampton police “neither assist nor coordinate with” the agency.',
      'On being asked for help: “If they were to ask for our assistance, we would not provide it unless they presented a court order signed by a judge.”',
      'She said she would write to Senator Chuck Schumer and Congressman Nick LaLota asking for better communication and clear procedures for local governments when federal operations occur.',
      'OLA of Eastern Long Island has been seeking a Town Board work session on its model law. As of April 2026 the town had not adopted one, and Southampton Village said conversations were still ongoing.',
    ],
    sources: [
      {
        title: 'RiverheadLOCAL — Southampton residents call on town to oppose ICE raids (November 13, 2025)',
        url: 'https://riverheadlocal.com/2025/11/13/residents-press-southampton-town-board-to-oppose-ice-operations-in-local-communities/',
      },
      {
        title: '27east — East End municipalities continue to discuss OLA ICE accountability law',
        url: 'https://www.27east.com/southampton-press/news/government-news/article_5b925546-fc34-4a24-95d6-4a85bbc5ff31.html',
      },
      {
        title: 'OLA of Eastern Long Island — East End municipalities continue to discuss the OLA ICE accountability law',
        url: 'https://www.olaofeasternlongisland.org/post/east-end-municipalities-continue-to-discuss-ola-ice-accountability-law',
      },
    ],
  },
  {
    town: 'Riverhead',
    status: 'no-action-on-record',
    headline: 'No resolution on immigration enforcement appears in the Town Board record',
    asOf: 'Across 42 meetings on record, 2025 through August 2026',
    detail:
      'This site parses every Riverhead Town Board resolution it can obtain. Searching all of them for immigration enforcement — ICE, federal agents, a public-safety-and-accountability law, 287(g) — returns nothing. Southold spent months of work sessions on the question and voted. Southampton’s supervisor answered it at a public meeting. Riverhead’s Board has not taken it up in any resolution we can find.',
    what: [
      'This describes the resolution record, not the whole of Town policy. A police department can operate under a general order that never reaches a Town Board vote, and this site cannot see those.',
      'The state law described above applies in Riverhead regardless. It is state legislation and does not depend on the Town adopting anything.',
      'A resident who wants Riverhead’s position on the record can ask for it at a Town Board meeting. The rules for speaking are on the Town Board Votes page.',
    ],
    sources: [
      {
        title: 'Riverhead Budget Live — Town Board Votes, the resolution record searched for this',
        url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/meetings/',
      },
    ],
  },
]

// The model law behind most of this, and the county next door deciding what to do.
export const regionalContext = {
  modelLaw:
    'Most of the East End activity traces to one draft. OLA of Eastern Long Island — Organización Latino Americana — circulated a Public Safety and Accountability Local Law in February 2026, written by former State Assemblyman Fred Thiele, and invited every municipality with its own police department to adapt it. East Hampton Village went furthest, adding a rule blocking federal access to its licence-plate-reader data. Southold ended up with a resolution instead. Southampton has not adopted a version.',
  nassau:
    'The same question is live west of here. Nassau County, which had signed an agreement deputising county police for federal immigration work, has been weighing its options against the new state law that bars exactly those arrangements.',
  nassauSource: {
    title: 'ABC7 New York — New York law bans local police cooperation with ICE, Nassau County weighs options',
    url: 'https://abc7ny.com/post/new-york-law-bans-local-police-cooperation-ice-nassau-county-weighs-options/19732322/',
  },
}
