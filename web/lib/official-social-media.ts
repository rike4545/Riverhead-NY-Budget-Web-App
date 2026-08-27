// When a Riverhead official's social media account stops being theirs alone.
//
// WHY THIS IS ON A BUDGET SITE. Much of what the Town decides gets announced,
// explained and argued over on social media before it reaches an agenda. A
// resident blocked from those accounts loses access to that, and this site's
// whole premise is that the record should be reachable.
//
// WHAT THIS PAGE IS NOT. It does not allege that any Riverhead official has
// blocked anyone or violated anyone's rights. Nobody here has audited that, and
// it would take evidence this site does not have. The page explains the test the
// Supreme Court set and shows residents how to apply it themselves.
//
// SOURCING. The legal standard is quoted from the slip opinion in Lindke v.
// Freed, 601 U.S. 187 (2024), read directly rather than summarised from
// coverage. That matters here: the widely-cited earlier cases — the Second
// Circuit's Trump ruling, the AOC settlement — were decided under a different
// framework, and Lindke replaced it in March 2024. A page describing the 2019
// approach as current law would be wrong.

export type Element = { n: number; title: string; body: string; quote?: string }

export const ruling = {
  case: 'Lindke v. Freed',
  citation: '601 U.S. 187 (2024)',
  decided: 'March 15, 2024',
  court: 'Supreme Court of the United States',
  vote: 'Unanimous, 9–0. Opinion by Justice Amy Coney Barrett.',
  facts:
    'James Freed ran a Facebook page from before he became city manager of Port Huron, Michigan. He updated it to say he was city manager and kept posting — mostly about his own life, sometimes about city business. When Kevin Lindke criticised the city’s COVID-19 response, Freed deleted the comments and blocked him. Lindke sued.',
  holding:
    'A public official who prevents someone from commenting on the official’s social-media page engages in state action only if the official both (1) possessed actual authority to speak on the State’s behalf on a particular matter, and (2) purported to exercise that authority when speaking in the relevant social-media posts.',
  url: 'https://www.supremecourt.gov/opinions/23pdf/22-611_ap6c.pdf',
}

export const elements: Element[] = [
  {
    n: 1,
    title: 'Did they actually have authority to speak for the Town?',
    body:
      'Not whether speaking publicly appears in a job description, but whether making that kind of announcement is genuinely part of the job the government entrusted to them. A Supervisor announcing a policy decision is a different thing from a council member sharing an opinion.',
  },
  {
    n: 2,
    title: 'Were they using that authority in the specific post?',
    body:
      'This is post by post, not account by account. An official keeps their own First Amendment rights, including the right to talk about their job in a personal capacity. A post that invokes official authority to announce something not available elsewhere reads as official; one that repeats or shares information already public reads as personal.',
    quote:
      'Lest any official lose the right to speak about public affairs in his personal capacity, the plaintiff must show that the official purports to exercise state authority in specific posts.',
  },
]

export const labelRule = {
  headline: 'A label does most of the work',
  body:
    'The Court was specific about this. An account marked as personal earns its owner a strong presumption that everything on it is personal — and an account that carries the office, or gets handed to whoever holds the office next, plainly speaks for the government.',
  personalQuote:
    'Had Freed’s account carried a label (e.g., “this is the personal page of James R. Freed”) or a disclaimer (e.g., “the views expressed are strictly my own”), he would be entitled to a heavy (though not irrebuttable) presumption that all of the posts on his page were personal.',
  officialQuote:
    'Context can make clear that a social-media account purports to speak for the government—for instance, when an account belongs to a political subdivision (e.g., a “City of Port Huron” Facebook page) or is passed down to whomever occupies a particular office (e.g., an “@PHuronCityMgr” Instagram account).',
  mixedQuote:
    'A public official who fails to keep personal posts in a clearly designated personal account therefore exposes himself to greater potential liability.',
}

export const blockingVsDeleting = {
  headline: 'Blocking is riskier than deleting, because of how the button works',
  body:
    'A deleted comment only puts that one post in question. Blocking is page-wide: it stops the person commenting on everything, so a court has to look at every post they might have wanted to comment on. On a mixed account there may be no way to shut someone out of the personal posts without also shutting them out of the official ones.',
  quote:
    'The bluntness of Facebook’s blocking tool highlights the cost of a “mixed use” social-media account: If page-wide blocking is the only option, a public official might be unable to prevent someone from commenting on his personal posts without risking liability for also preventing comments on his official posts.',
  footnote:
    'The Court also noted, in a footnote, that an official cannot insulate government business from scrutiny simply by conducting it on a personal page.',
}

// Verified on the Town's own homepage — these are institutional accounts, the
// unambiguous case in Lindke: an account belonging to a political subdivision.
export const townAccounts = {
  note:
    'These three are listed by the Town on its own homepage. They belong to the Town as an institution rather than to any individual, which puts them squarely in the category the Court called unambiguous.',
  source: 'https://www.townofriverheadny.gov/',
  accounts: [
    { platform: 'Facebook', handle: 'facebook.com/riverheadtown', url: 'https://www.facebook.com/riverheadtown' },
    { platform: 'Instagram', handle: 'instagram.com/townofriverhead', url: 'https://www.instagram.com/townofriverhead' },
    { platform: 'YouTube', handle: 'youtube.com/@TownOfRiverhead', url: 'https://www.youtube.com/@TownOfRiverhead' },
  ],
}

// The harder category, and the honest limits on what this page can say about it.
export const individualAccounts = {
  headline: 'The individual accounts are the ones the test is actually for',
  body:
    'Members of the Town Board also maintain their own accounts. Those are where the interesting question lives, because they are the ones that can be personal, official, or a mix — and it is the mix that creates exposure. Two examples, offered as examples only:',
  examples: [
    {
      who: 'Supervisor Jerry Halpin',
      what: 'An Instagram account whose handle carries the office itself — “supervisorjerryhalpin.”',
      url: 'https://www.instagram.com/supervisorjerryhalpin/',
      note:
        'A handle built around the office is the sort of signal the Court said points toward official. That is a starting observation, not a conclusion — the test turns on the content and function of particular posts.',
    },
    {
      who: 'Councilwoman Joann Waski',
      what: 'A Facebook presence under her own name.',
      url: null,
      note:
        'No URL is given here because this site has not verified which of several accounts under that name is hers. Naming the wrong one would be worse than naming none.',
    },
  ],
  caveat:
    'Neither account could be read from this site’s build environment — Instagram and Facebook both refuse automated requests, and the Instagram fetch returned a rate-limit response rather than a page. So nothing here describes what is on them, who can comment, or whether anyone has ever been blocked. A resident who wants to know can look, using the questions above.',
}

export const whatToDo = [
  'Look for a label. Does the account say it is personal, or carry a disclaimer? Does it instead carry the office in its name?',
  'Read the posts, not the bio. Is this account announcing Town decisions, or sharing things already public?',
  'If you were blocked, note the date and what you had said. Viewpoint is the thing that matters — being shut out for criticism is the problem, not being shut out for abuse.',
  'Ask at a Town Board meeting. The Board’s own rules set out when the public may speak; they are on this site’s Town Board Votes page.',
  'A public-records request reaches official communications regardless of where they were posted — the Court said an official cannot put government business beyond scrutiny by running it through a personal page.',
]

export const harassmentNote =
  'None of this makes every block unlawful. Officials keep their own rights, and even Representative Ocasio-Cortez, in settling her case and apologising, reserved the right to block accounts engaged in actual harassment. The line the First Amendment draws is at viewpoint: shutting someone out because of what they think is the problem.'

export const sources = [
  {
    title: 'Lindke v. Freed, 601 U.S. 187 (2024) — slip opinion (Supreme Court of the United States, March 15, 2024)',
    url: 'https://www.supremecourt.gov/opinions/23pdf/22-611_ap6c.pdf',
    covers: 'The controlling two-part test, the labelling presumption, and the blocking-versus-deleting distinction. Quoted directly from the opinion.',
  },
  {
    title: 'Lindke v. Freed — Legal Information Institute, Cornell Law School',
    url: 'https://www.law.cornell.edu/supremecourt/text/22-611',
    covers: 'The opinion in HTML, if the PDF is awkward to read.',
  },
  {
    title: 'City & State New York — AOC settles Twitter lawsuit, avoids court showdown (November 5, 2019)',
    url: 'https://www.cityandstateny.com/policy/2019/11/aoc-settles-twitter-lawsuit-avoids-court-showdown/176752/',
    covers: 'The settlement with former Assemblyman Dov Hikind, the apology, and the reservation about harassment. Decided under the pre-Lindke framework.',
  },
  {
    title: 'Knight First Amendment Institute at Columbia University — Lindke v. Freed case page',
    url: 'https://knightcolumbia.org/cases/lindke-v-freed',
    covers: 'Background and filings, from the institute that brought the earlier Trump case.',
  },
  {
    title: 'Town of Riverhead official website',
    url: 'https://www.townofriverheadny.gov/',
    covers: 'The three official Town accounts listed above were read from this homepage.',
  },
]

export const disclaimer =
  'This page summarises a published Supreme Court opinion. It is not legal advice, it was not written by a lawyer, and it makes no claim about the conduct of any named official. Anyone who believes they have been blocked unlawfully should talk to one.'
