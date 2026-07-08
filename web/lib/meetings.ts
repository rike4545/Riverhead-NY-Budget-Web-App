// Town Board voting record, extracted from meeting minutes by
// etl/parse_meetings.py. The small index (meeting list + totals) is imported
// at build time; each meeting's full record is fetched at runtime.

import indexJson from '../public/data/meetings/index.json'

const base = '/rike4545-riverhead-budget-live'

export function meetingUrl(slug: string): string {
  return `${base}/data/meetings/${slug}.json`
}

export type Vote = 'aye' | 'nay' | 'abstain' | 'absent'
export type ResolutionTag = 'unanimous' | 'split' | 'failed' | 'tabled'

export type Resolution = {
  seq: number
  number: string | null
  title: string
  result: string
  adopted: boolean
  tag: ResolutionTag
  ayesCount: number | null
  naysCount: number | null
  mover: string
  seconder: string
  votes: Record<string, Vote>
}

export type Party = 'Democrat' | 'Republican' | null
export type RosterMember = { last: string; name: string; title: string; party: Party }

export type MemberTally = {
  name: string
  title: string
  aye: number
  nay: number
  abstain: number
  absent: number
  moved: number
  seconded: number
}

export type MeetingStats = { total: number; unanimous: number; contested: number; failed: number; tabled: number }

export type Meeting = {
  slug: string
  date: string
  type: string
  calledToOrder: string | null
  roster: RosterMember[]
  resolutions: Resolution[]
  stats: MeetingStats
  memberTallies: Record<string, MemberTally>
}

export type MeetingIndexEntry = {
  slug: string
  date: string
  type: string
  total: number
  unanimous: number
  contested: number
  failed: number
  tabled: number
}

export type MeetingsIndex = {
  source: { title: string; url: string }
  totals: { meetings: number; votes: number; contested: number; failed: number; tabled: number }
  meetings: MeetingIndexEntry[]
}

export const meetingsIndex = indexJson as MeetingsIndex

// ---- per-member career records (members.json, fetched at runtime) ----

export const MEMBERS_URL = `${base}/data/meetings/members.json`

export type VotedItem = { slug: string; date: string; number: string | null; title: string; result: string }

export type MemberRecord = {
  key: string
  name: string
  titles: string[]
  party: Party
  years: string[]
  byYear: Record<string, Partial<Record<Vote, number>>>
  career: Partial<Record<Vote, number>>
  ayePct: number | null
  moved: number
  seconded: number
  meetingsVoted: number
  dissents: VotedItem[]
  abstentions: VotedItem[]
}

export type MembersData = {
  source: { title: string; url: string }
  note: string
  partySource: string
  latestYear: string
  members: MemberRecord[]
}
