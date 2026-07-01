// Town Board voting record, extracted from meeting minutes by
// etl/parse_meetings.py. Each resolution records the result, who moved and
// seconded it, and how every member voted.

import indexJson from '../public/data/meetings/index.json'
import jan2025 from '../public/data/meetings/2025-01-07.json'

export type Vote = 'aye' | 'nay' | 'abstain' | 'absent'

export type Resolution = {
  seq: number
  number: string | null
  title: string
  result: string
  adopted: boolean
  tag: 'unanimous' | 'split' | 'failed'
  ayesCount: number | null
  naysCount: number | null
  mover: string
  seconder: string
  votes: Record<string, Vote>
}

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

export type Meeting = {
  slug: string
  date: string
  type: string
  calledToOrder: string | null
  resolutions: Resolution[]
  stats: { total: number; unanimous: number; contested: number; failed: number }
  memberTallies: Record<string, MemberTally>
}

export type MeetingsIndex = {
  source: { title: string; url: string }
  meetings: { slug: string; date: string; type: string; total: number; unanimous: number; contested: number; failed: number }[]
}

export const meetingsIndex = indexJson as MeetingsIndex

const meetings: Record<string, Meeting> = {
  '2025-01-07': jan2025 as unknown as Meeting,
}

export function getMeeting(slug: string): Meeting | undefined {
  return meetings[slug]
}

export const latestMeeting = meetings[meetingsIndex.meetings[0].slug]

// Member display order (Supervisor first).
export const MEMBER_ORDER = ['Hubbard', 'Rothwell', 'Kern', 'Merrifield', 'Waski']
