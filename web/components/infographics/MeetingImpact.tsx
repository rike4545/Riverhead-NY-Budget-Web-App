import BarRows from '../charts/BarRows'
import fiscalIndex from '../../public/data/meetings/fiscal-index.json'
import { money } from './format'

type Summary = { total: number; markedNo: number; markedYes: number; understated: number; identifiedDollarsAtStake: number }
type Meeting = { slug: string; meetingDate: string; summary: Summary }

// Each Town Board meeting's own fiscal-impact statements, drawn as the dollars
// the statements tie to a resolution. A meeting with no priced resolution shows
// a zero bar, not a blank: the notes say how many resolutions it had and how many
// the Town marked as having no fiscal impact.
const meetings: Meeting[] = (fiscalIndex.meetings as string[])
  .map((slug) => require(`../../public/data/meetings/${slug}-fiscal.json`) as Meeting)
  .filter((m) => m.summary && typeof m.summary.total === 'number')
  .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
  .slice(-8)

const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function MeetingImpact() {
  if (meetings.length === 0) return null
  return (
    <BarRows
      title="Dollars the Town Board’s resolutions put at stake, by meeting"
      lede="Dollars that a meeting’s fiscal-impact statements tie to a resolution, for the last eight meetings parsed. It is not the total the Town spent."
      source="Source: Town of Riverhead agenda packets (Fiscal Impact Statements), parsed by this site. Only dollars the statements tie to a resolution are counted; resolutions without a stated amount are not."
      rows={meetings.map((m) => ({
        label: day(m.meetingDate),
        value: m.summary.identifiedDollarsAtStake,
        note: `${m.summary.total} resolutions: ${m.summary.markedNo} marked no fiscal impact, ${m.summary.markedYes} marked yes; ${m.summary.understated} that this site’s read of the resolution says may understate its cost (a likely concern, not a finding).`,
      }))}
      format={money}
    />
  )
}
