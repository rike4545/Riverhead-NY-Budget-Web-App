// Video and transcripts for each Town Board meeting (etl/build_meeting_media.py).
//
// Three sources, never blended: the Town's own recording (CivicClerk), the
// volunteer site riverheadtranscripts.org, and this site's own Whisper
// transcripts, which also carry the moment each resolution was voted.

import media from '../public/data/meetings/media.json'

export type MeetingMedia = {
  eventId?: number
  name?: string
  portal?: string
  video?: string
  transcript?: string
  ours?: { path: string; model?: string | null; votes: Record<string, number> }
}

const MEETINGS = media.meetings as Record<string, MeetingMedia>
export const mediaSources = media.sources

export function meetingMedia(slug: string): MeetingMedia | undefined {
  return MEETINGS[slug]
}

/** 1:02:05 or 20:36. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** The Town's video opened at a moment: a media-fragment link any browser plays. */
export function videoAt(video: string, seconds: number): string {
  return `${video}#t=${Math.max(0, Math.floor(seconds))}`
}

/**
 * Where to watch or read a resolution's vote: this site's timestamp in the
 * Town's video when the transcript found it, otherwise the volunteer
 * transcript's entry for the resolution. Opens a few seconds early so the
 * number being read out is heard.
 */
export function voteLink(slug: string, number?: string | null): { href: string; label: string; title: string } | null {
  const m = MEETINGS[slug]
  if (!m || !number) return null
  const t = m.ours?.votes?.[number]
  if (t != null && m.video) {
    return {
      href: videoAt(m.video, t - 5),
      label: `Watch this vote (${clock(t)}) ↗`,
      title: "Opens the Town's video just before this resolution is read out; the roll call follows. The time comes from this site's machine transcript.",
    }
  }
  if (m.transcript) {
    return {
      href: `${m.transcript}#decision-${number}`,
      label: 'In the volunteer transcript ↗',
      title: "This resolution on riverheadtranscripts.org, a volunteer site's Whisper transcript of the Town's video. Not an official record.",
    }
  }
  return null
}
