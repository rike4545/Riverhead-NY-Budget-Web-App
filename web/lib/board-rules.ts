// The Town Board's own Rules of Procedure, reduced to the parts a resident
// needs in order to be heard.
//
// The rules matter here for a specific reason: GFOA's budget-presentation
// criteria ask "when can the public engage in the budget process?" and "what
// methods are used to collect feedback?" Those questions are answered by this
// document, not by the budget. The two public-comment windows below, and the
// fact that a public hearing carries no time limit, are the practical answer.
//
// Source: Rules of the Town Board of the Town of Riverhead (Rules I–XII).

export const meetingSchedule = {
  regular: 'First and third Tuesdays of the month, alternating between a 2:00 PM and a 6:00 PM start.',
  exceptions: [
    'January: the first meeting falls on the Wednesday or Thursday at 2:00 PM immediately after the January 1 holiday.',
    'February and May: the second meeting moves to the third Wednesday.',
    'If a meeting date lands on a holiday, it moves to the next business day at the same time.',
  ],
  workSessions: 'Work sessions are held Thursdays at 10:00 AM.',
  setBy: 'The schedule is set by Board resolution, so it can change — check the current calendar before relying on it.',
  quorum: 'A majority of the Board is a quorum.',
}

export const specialMeetings = {
  calledBy: 'The Supervisor, or any three members of the Board.',
  notice: 'Written notice of date, time, place and the list of items, at least 24 hours ahead, by fax, email or personal delivery.',
  limit: 'No business other than what the notice names may be transacted.',
  served: 'The meeting cannot be held until every Board member has been served with notice.',
}

// Rule VI, in order. The two windows where the public speaks are flagged.
export const orderOfBusiness: { n: number; item: string; publicSpeaks?: boolean }[] = [
  { n: 1, item: 'Roll call' },
  { n: 2, item: 'Invocation' },
  { n: 3, item: 'Pledge of Allegiance' },
  { n: 4, item: 'Public presentation / agenda items' },
  { n: 5, item: 'Approval of the minutes of the preceding meeting' },
  { n: 6, item: 'Miscellaneous communications' },
  { n: 7, item: 'Committee reports' },
  { n: 8, item: 'Public hearings', publicSpeaks: true },
  { n: 9, item: 'Public comment on resolutions', publicSpeaks: true },
  { n: 10, item: 'Introduction of and action upon local laws and resolutions' },
  { n: 11, item: 'Public comment on matters of concern to the Town', publicSpeaks: true },
  { n: 12, item: 'Adjournment' },
]

export type SpeakingRule = { rule: string; detail: string }

export const speakingRules: SpeakingRule[] = [
  {
    rule: 'On a resolution, five minutes',
    detail:
      'Before resolutions are introduced, the Supervisor may allow any member of the audience to speak for up to five minutes on a resolution that is on the agenda but not set down for a public hearing. It is discretionary — the Supervisor sets the terms.',
  },
  {
    rule: 'At a public hearing, no time limit',
    detail:
      'The rules state plainly that there is no time limit for public comment at a public hearing. This is the single most useful fact in the document: the annual budget hearing is a public hearing, so the five-minute rule does not apply to it.',
  },
  {
    rule: 'On anything at all, just before adjournment',
    detail:
      'The "public comment" period near the end of the meeting is open to any subject concerning the Town, whether or not it appears on the agenda.',
  },
  {
    rule: 'State your name and address',
    detail: 'Anyone addressing the Board must give their name and home address, and state their business or question.',
  },
  {
    rule: 'Address the Board, not the room',
    detail:
      'Remarks must go to the Board rather than drawing the audience into debate, and no one may disrupt the meeting. A speaker who argues with the room rather than the Board can be ruled out of order.',
  },
]

// Rule I: the seven subjects that may be discussed with the public excluded.
export const executiveSessionTopics = [
  'Matters that would imperil public safety if disclosed',
  'Anything that would reveal the identity of a law-enforcement agent or informer',
  'Current or future criminal investigation or prosecution, where disclosure would imperil law enforcement',
  'Proposed, pending or current litigation',
  'The medical, financial, credit or employment history of a person or corporation, and appointment, employment, promotion, demotion, discipline, suspension, dismissal or removal of a person',
  'Collective bargaining negotiations',
  'Proposed acquisition, sale or lease of real property, or of securities, where publicity would substantially affect the value',
]

export const votingRules = [
  'A local law passes on the affirmative vote of a majority of all Board members.',
  'A local law amended after introduction does not require a fresh public hearing unless the chair rules the change substantial.',
  'Debate on a local law, resolution or debatable motion cannot start until a member moves it and another seconds it.',
  'No member may speak more than once on a question until every member who wants to speak has done so, or more than twice without the Board’s leave.',
  'A motion to table, to adjourn, or to close debate ("the previous question") is not debatable and carries on a majority.',
]

export const boardRulesSource = {
  title: 'Rules of the Town Board of the Town of Riverhead',
  note: 'Rules I through XII, as adopted by the Board. Executive-session subjects track Public Officers Law § 105.',
}
