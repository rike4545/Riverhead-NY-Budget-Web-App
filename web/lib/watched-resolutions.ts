// How the Town Board voted on the resolutions hand-written pages depend on.
//
// etl/resolve_watched.py fills public/data/watched-resolutions.json from the
// parsed meeting records after every meeting sync (sync-meetings.yml), so a page
// that reads its status here changes when the Board votes, with no one editing
// it. scripts/verify-watched-resolutions.mjs checks the file against the meeting
// data and that each page shows the status it should.

import data from '../public/data/watched-resolutions.json'

export type WatchStatus = 'pending' | 'adopted' | 'tabled' | 'failed'

export type Watched = {
  id: string
  meetingDate: string
  agendaItem: string
  match: string
  pages: string[]
  followUps: string[]
  status: WatchStatus
  number: string | null
  title: string | null
  voteTag: string | null
  ayes: number | null
  nays: number | null
  note: string | null
}

const items = data.items as Watched[]

export function watched(id: string): Watched {
  const w = items.find((i) => i.id === id)
  if (!w) throw new Error(`watched-resolutions: no item "${id}"; add it to etl/data/watched-resolutions.json`)
  return w
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** True once the meeting day is over (the site is rebuilt after every meeting sync). */
const meetingPassed = (w: Watched) => new Date().toISOString().slice(0, 10) > w.meetingDate

/** The vote in words, for the end of a sentence: "approved by the Town Board on November 17, 2026 (Resolution 2026-1001, unanimously)". */
export function statusPhrase(w: Watched): string {
  const how = w.voteTag === 'unanimous' ? ', unanimously' : w.ayes != null && w.nays != null ? `, ${w.ayes}–${w.nays}` : ''
  const res = w.number ? ` (Resolution ${w.number}${how})` : ''
  switch (w.status) {
    case 'adopted': return `approved by the Town Board on ${longDate(w.meetingDate)}${res}`
    case 'tabled': return `tabled by the Town Board on ${longDate(w.meetingDate)}${res}`
    case 'failed': return `not approved by the Town Board on ${longDate(w.meetingDate)}${res}`
    // The agenda numbers a resolution before the vote, so a pending one can
    // still be found by its number in the minutes later. Once the meeting has
    // passed, "not yet voted on" may be untrue: the minutes may simply not be
    // out yet, so say only what the record shows.
    default: {
      const num = w.number ? ` (Resolution ${w.number})` : ''
      return meetingPassed(w)
        ? `on the Town Board’s ${longDate(w.meetingDate)} agenda${num}, with no vote in the published record yet`
        : `proposed, not yet voted on${num}`
    }
  }
}

export const isDecided = (w: Watched) => w.status !== 'pending'
