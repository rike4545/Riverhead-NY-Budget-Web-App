// The Open Meetings Law as it applies to the Town of Riverhead.
//
// THE LAW is Public Officers Law Article 7 (§§100–111) in the Committee on Open
// Government's text of May 29, 2026. That text runs §103-a, the "extraordinary
// circumstances" videoconferencing section, to July 15, 2028 (Chapter 58 of the
// Laws of 2026). Phrases in quotation marks are the statute's own words. Town
// Law §§62–63 add the Board's own quorum, vote and special-meeting rules.
//
// RIVERHEAD'S RULES are Resolution 2025-230, adopted March 4, 2025, which
// replaced every earlier set ("any prior Rules of Order and Procedure are hereby
// deemed null and void"). The copy linked from the Supervisor's Office page is
// still the 2019 version, so this cites the 2025 text in that meeting's
// minutes. Riverhead's videoconferencing law is Town Code Chapter 101, Article
// VI (Local Law 2-2023); the Town's own notices cite it as §101-26.
//
// Where a Board rule gives the public less access than the Open Meetings Law,
// the law controls (§110(1)). Differences listed here are differences between
// the written rules and state law, not findings that the Board broke the law.
//
// WHAT THE RECORDS SHOW is computed by the page from the meeting records this
// site holds. The site has no posting times for notices, agendas or minutes, so
// it reports what is on file, never whether a deadline was met.

export type Source = { label: string; url: string }

export const SOURCES = {
  law: { label: 'Open Meetings Law, Public Officers Law §§100–111 (Committee on Open Government text, May 29, 2026)', url: 'https://opengovernment.ny.gov/open-meetings-law-text-0' },
  faq: { label: 'Committee on Open Government: Open Meetings Law questions and answers', url: 'https://opengovernment.ny.gov/oml-frequently-asked-questions' },
  records: { label: 'Committee on Open Government: records scheduled for discussion at open meetings', url: 'https://opengovernment.ny.gov/disclosure-records-scheduled-discussion-open-meetings' },
  videoGuidance: { label: 'Committee on Open Government: procedures for member videoconferencing', url: 'https://opengovernment.ny.gov/procedures-member-videoconferencing' },
  extension: { label: 'Committee on Open Government: §103-a extended to July 15, 2028 (May 27, 2026)', url: 'https://opengovernment.ny.gov/system/files/documents/2026/05/extraordinary-circumstances-videoconferencing-extension-052726.pdf' },
  notice62: { label: 'Committee on Open Government, advisory opinion OML-AO-4737: special meetings and Town Law §62', url: 'https://docs.dos.ny.gov/coog/otext/o4737.html' },
  committee: { label: 'Committee on Open Government: advisory opinions, and how to ask for one', url: 'https://opengovernment.ny.gov/open-meetings-law' },
  rules2025: { label: 'Rules of the Town Board, Resolution 2025-230 (Mar. 4, 2025), in that meeting’s minutes from packet p. 149', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=3406,plainText=false)' },
  rules2019: { label: 'The 2019 rules still linked from the Supervisor’s Office page', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/202/Town-Board-Rules-PDF' },
  videoLaw: { label: 'Riverhead Town Code, Chapter 101, Article VI: Videoconferencing by Town Board (Local Law 2-2023)', url: 'https://ecode360.com/42304412' },
  specialNotice: { label: 'Town notice of the June 23, 2026 special meeting', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3646/6-23-26-Notice-of-Special-TB-Meeting' },
  town62: { label: 'Town Law §62: meetings of the town board', url: 'https://www.nysenate.gov/legislation/laws/TWN/62' },
  town63: { label: 'Town Law §63: quorum, votes and rules of procedure', url: 'https://www.nysenate.gov/legislation/laws/TWN/63' },
  agendas: { label: 'Town of Riverhead: Agendas & Minutes', url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes' },
  portal: { label: 'Town of Riverhead meeting portal (CivicClerk)', url: 'https://riverheadny.portal.civicclerk.com/' },
} satisfies Record<string, Source>

export type SourceKey = keyof typeof SOURCES

// ── Who the law covers in Riverhead ──────────────────────────────────────────
export type Body = { name: string; note: string }

export const covered: Body[] = [
  {
    name: 'Town Board',
    note: 'Five members, so three is a quorum. Its regular meetings, special meetings and Thursday work sessions are all meetings under the law. Its rules hold all of them in the Town Hall Meeting Room, 4 West Second Street.',
  },
  {
    name: 'The Board’s two standing committees',
    note: 'The Community Development Agency’s finance and audit committees, three Board members each. A committee is a public body in its own right (§102(2)), and three members is also a quorum of the full Board.',
  },
  { name: 'Community Development Agency', note: 'The Town Board sits as its governing body.' },
  { name: 'Industrial Development Agency', note: 'A public benefit corporation whose board grants tax breaks to projects.' },
  {
    name: 'Planning Board and Zoning Board of Appeals',
    note: 'The law exempts court-like proceedings but expressly not zoning boards of appeals (§108(1)), so the ZBA deliberates in public.',
  },
  {
    name: 'Other boards the Town appoints',
    note: 'Such as the Architectural Review Board and the Landmarks Preservation Commission, when they carry out a necessary step in a decision (§102(2)).',
  },
]

/** `majorityParty` is filled in by the page from the latest roster, so the caucus note stays current. */
export function notCovered(majorityParty: { party: string; count: number } | null): Body[] {
  const caucus =
    'Town Board members of the same party may meet privately, even about Town business (§108(2)). A caucus can’t take official action: that still takes a meeting.' +
    (majorityParty && majorityParty.count >= 3
      ? ` ${majorityParty.count === 4 ? 'Four' : majorityParty.count === 5 ? 'All five' : 'Three'} of the five current members are ${majorityParty.party}s, so a caucus of them would include a quorum.`
      : '')
  return [
    { name: 'A party caucus', note: caucus },
    { name: 'Groups that only advise', note: 'Recommendations that need further action by the Board don’t make a group a public body (§102(2)).' },
    { name: 'Court-like proceedings', note: 'Judicial and quasi-judicial proceedings, except those of the Zoning Board of Appeals (§108(1)).' },
    { name: 'Chance or social gatherings', note: 'These aren’t meetings. But if a quorum is together without notice, it shouldn’t discuss Town business (Committee on Open Government).' },
    { name: 'Matters made confidential by law', note: 'Such as records federal law requires to be kept private (§108(3)).' },
  ]
}

// ── What the law requires, and how it applies here ──────────────────────────
export type Requirement = {
  id: string
  title: string
  /** What the law requires, in plain words. */
  law: string
  cite: string
  /** Riverhead's rules and practice on the same point. The minutes entry is written by the page. */
  riverhead?: string
  /** What following it fully looks like, where the law or the Committee's guidance says more. */
  practice?: string
  sources: SourceKey[]
}

export const requirements: Requirement[] = [
  {
    id: 'open',
    title: 'Meetings are open, and you can record them',
    law:
      'Every meeting is open to the public. Anyone may photograph, record, broadcast or webcast it; a board may set reasonable rules only about where equipment goes, and must post them at the meeting. Meetings belong in a room that is accessible and big enough for the people who come, and at least one place where a member takes part must be open to the public.',
    cite: '§103(a)–(d)',
    riverhead:
      'The Board’s rules hold every meeting and work session in the Town Hall Meeting Room and say all meetings follow the Open Meetings Law. Town notices, such as the one for the June 23, 2026 special meeting, say the public can watch live on Channel 22 and the Town’s website. The rules ban signs, posters and flyers in the room; they say nothing about recording, so the law’s default applies: anyone may record.',
    sources: ['law', 'rules2025', 'specialNotice'],
  },
  {
    id: 'notice',
    title: 'Notice before every meeting',
    law:
      'A meeting scheduled at least a week ahead needs notice of its time and place sent to the news media and posted in public places at least 72 hours before. Any other meeting needs notice as early as practicable. The notice also goes on the Town’s website. If the meeting will be streamed, the notice gives the web address. If a member may attend by video, the notice says so and says where the public can watch and take part.',
    cite: '§104; §103-a(2)(f)',
    riverhead:
      'Regular meetings are set in advance for the first and third Tuesdays, alternating 2:00 PM and 6:00 PM, so each needs 72 hours’ notice. The Town’s notice for its June 23, 2026 special meeting shows everything the law asks for: the time, the place, the one item of business, that a member may attend by video under Town Code §101-26, and how to watch on Channel 22 or online, or take part by Zoom. Board members get their own notice of a special meeting under Town Law §62, which is separate from the public’s.',
    sources: ['law', 'specialNotice', 'rules2025', 'notice62'],
  },
  {
    id: 'documents',
    title: 'Documents a day ahead',
    law:
      'Proposed resolutions, local laws and policies scheduled for discussion, and other public records to be discussed, must be available on request and posted on the Town’s website at least 24 hours before the meeting, “to the extent practicable.” The 24-hour rule took effect October 19, 2021.',
    cite: '§103(e)',
    riverhead:
      'The Town posts agendas and packets on its meeting portal, and its rules require the final work-session agenda to be posted on the Town’s website. But the rules let a member file a resolution with the Town Clerk until 4:00 PM on the business day before a meeting. For a 2:00 PM meeting that is 22 hours ahead, so a resolution filed at the deadline can’t be posted a full day before. For meetings at any other hour, the rules already require filing 24 hours ahead. Resolutions “from the floor,” which the rules keep for rare, urgent cases, need copies for the audience and press only 30 minutes before the meeting.',
    practice:
      'A filing deadline 24 hours before every meeting would line the rules up with the law. The Committee on Open Government reads “to the extent practicable” to allow items introduced at the meeting in emergencies, or where posting ahead isn’t practicable.',
    sources: ['law', 'records', 'rules2025', 'portal'],
  },
  {
    id: 'executive',
    title: 'Closed sessions, for listed reasons only',
    law:
      'A board may close part of a meeting, called an executive session, only for eight reasons: public safety; the identity of a law enforcement agent or informer; criminal investigations; litigation; collective bargaining; a particular person’s medical, financial or employment history, or their hiring, discipline or firing; exams; and buying, selling or leasing property when publicity would substantially change the price. The motion is made in public and names the general subject, and it needs a majority of the whole Board: three votes. No vote to spend public money can be taken in the closed session.',
    cite: '§105',
    riverhead:
      'The Board’s rules allow executive sessions at work sessions and regular meetings and list seven of the eight reasons; they leave out exams. For personnel matters they say “any person” where the law says “a particular person,” and the law controls. The 2025 and 2026 regular-meeting minutes this site holds record no executive sessions. Work sessions aren’t in the records we check yet.',
    practice:
      '“Personnel” alone isn’t a specific enough reason, according to the Committee on Open Government. A motion should say, for example, “the employment history of a particular person,” without naming the person. The vote to go into executive session is taken in open session, so it belongs in the minutes (§106(1)), at a work session as much as at a regular meeting.',
    sources: ['law', 'faq', 'rules2025'],
  },
  {
    id: 'minutes',
    title: 'Minutes within two weeks',
    law:
      'Minutes must record every motion, resolution and vote. They must be available, and posted on the Town’s website, within two weeks of the meeting, and minutes of any vote taken in executive session within one week. Minutes not yet approved must still be released, marked draft. A complete video or audio recording, or a transcript, can count as minutes.',
    cite: '§106',
    practice: 'Riverhead’s minutes summarize what each member of the public said, which goes beyond what the law requires.',
    sources: ['law', 'faq', 'agendas', 'portal'],
  },
  {
    id: 'remote',
    title: 'Board members attending by video',
    law:
      'Until July 15, 2028, a member may attend by video in “extraordinary circumstances”: disability, illness, caregiving, or another significant or unexpected event. A town board must first adopt a local law after a public hearing, and post written procedures. A quorum must still be in the room with the public. The remote member must be seen and heard, the minutes must say who attended remotely, and the meeting must be recorded, posted within five business days and kept for five years.',
    cite: '§103-a',
    riverhead:
      'Riverhead adopted its law in 2023: Town Code Chapter 101, Article VI (Local Law 2-2023). A member attending by video can vote but doesn’t count toward the in-person quorum of three, and when a member attends by video the public must be able to comment by video too.',
    practice:
      'Separately, the Board’s rules let anyone speak by Zoom during public comment and hearings. The law allows that but doesn’t require it.',
    sources: ['law', 'extension', 'videoGuidance', 'videoLaw'],
  },
  {
    id: 'comment',
    title: 'Speaking at meetings',
    law:
      'The law gives the public the right to attend and listen, not to speak. When a board does allow comment, it must treat everyone alike, and it may set reasonable rules such as time limits.',
    cite: 'Committee on Open Government',
    riverhead:
      'Under the 2025 rules, anyone may speak once for up to three minutes on the resolutions on the agenda, and once for up to three minutes on any Town matter near the end of the meeting. Public hearings have no set limit, and the chair may limit comments only if it does so evenly. Speakers give their name and hamlet, in person or by Zoom, and can hand written comments to the Town Clerk for the minutes.',
    sources: ['faq', 'rules2025'],
  },
  {
    id: 'votes',
    title: 'Three votes to act',
    law: 'Three of the five Town Board members make a quorum, and any act of the Board takes three yes votes, however many members are present.',
    cite: 'Town Law §63',
    riverhead:
      'The Board’s rules say a resolution passes with a majority of the members present, “except as otherwise provided by law.” Town Law is that exception, so it still takes three yes votes when only three or four members attend.',
    sources: ['town63', 'rules2025'],
  },
  {
    id: 'enforce',
    title: 'If the law isn’t followed',
    law:
      'Anyone harmed can go to court, in an Article 78 proceeding usually brought within four months. A court can void an action taken in violation, order the board to take training from the Committee on Open Government, and must award legal fees if a vote was taken in material violation of the law or the real deliberations happened in private first, unless the board had a reasonable basis to think it could meet in private. An unintentional notice mistake alone doesn’t void an action. For an action taken in executive session, the time limit starts when its minutes are released.',
    cite: '§107',
    sources: ['law', 'committee'],
  },
]

// ── Where the Board's written rules and state law differ ─────────────────────
export type Difference = { topic: string; rules: string; law: string }

export const differences: Difference[] = [
  {
    topic: 'Notice of a special meeting to Board members',
    rules: 'At least 24 hours, in writing; members may waive it in writing (Rule III)',
    law: 'At least two days, in writing (Town Law §62)',
  },
  {
    topic: 'Who calls a special meeting',
    rules: 'The Town Clerk, at the Supervisor’s direction or on written request of any two members (Rule III)',
    law: 'The Supervisor, who must call one within ten days if two members ask in writing (Town Law §62)',
  },
  {
    topic: 'Votes to pass a resolution',
    rules: 'A majority of the members present, “except as otherwise provided by law” (Rule XIV)',
    law: 'A majority of the whole Board: three (Town Law §63)',
  },
  {
    topic: 'When resolutions are in',
    rules: 'Filed by 4:00 PM the business day before; 24 hours ahead for meetings at other hours (Rule XIV)',
    law: 'Posted online 24 hours before, to the extent practicable (§103(e))',
  },
  {
    topic: 'Notice of a committee meeting',
    rules: 'Two days’ written notice to committee members (Rule XVI)',
    law: 'Public notice too, and an open meeting (§§103–104)',
  },
  {
    topic: 'Reasons for an executive session',
    rules: 'Seven, with “any person” for employment matters (Rule II)',
    law: 'Eight, with “a particular person” (§105(1)); the law controls',
  },
]

export const differencesNote =
  'These are differences between the Board’s written rules and state law, not findings that the Board has broken the law. Some are easily squared. The Committee on Open Government notes that the Attorney General and the Comptroller have advised that business done at a special meeting on short notice stands if every member had actual notice, attended and took part, though public notice under the Open Meetings Law is still required. A town can also replace some Town Law rules with a local law; we haven’t found one for these.'

// ── What anyone can do ───────────────────────────────────────────────────────
export const yourRights: { title: string; text: string; source?: SourceKey }[] = [
  { title: 'Attend, watch and record', text: 'Any open meeting, in person or on Channel 22, the Town’s website or Zoom. You don’t need permission to record.', source: 'law' },
  { title: 'Ask for the documents first', text: 'Proposed resolutions and other records to be discussed should be online 24 hours ahead. If one isn’t, ask the Town Clerk; the law says you can have it on request.', source: 'records' },
  { title: 'Get the minutes in two weeks', text: 'Even unapproved minutes have to be released within two weeks, marked draft.', source: 'faq' },
  { title: 'Ask the state for an opinion', text: 'The Committee on Open Government answers questions from residents and officials and publishes advisory opinions.', source: 'committee' },
  { title: 'Go to court', text: 'Anyone harmed by a violation can bring an Article 78 proceeding. A court can void the action and award legal fees.', source: 'law' },
]
