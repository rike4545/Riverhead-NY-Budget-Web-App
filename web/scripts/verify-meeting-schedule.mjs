import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const repoPath = (...parts) => join(root, '..', ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

const scheduleFile = path('out/data/meetings/upcoming.json')
const timelineFile = path('components/MeetingTimeline.tsx')
const fetcherFile = repoPath('etl/fetch_upcoming.py')
for (const file of [scheduleFile, timelineFile, fetcherFile]) {
  if (!existsSync(file)) fail(`Meeting schedule verification is missing: ${file}`)
}

if (existsSync(scheduleFile)) {
  const data = JSON.parse(readFileSync(scheduleFile, 'utf8'))
  const officialDates = new Set(data.officialScheduleDates ?? [])
  if (officialDates.size < 20) fail(`Published Town Board schedule coverage is unexpectedly low: ${officialDates.size} dates`)
  if (!data.scheduleSource?.url?.includes('/282/Town-Board-Meeting-Schedule')) fail('Official Town Board schedule source is missing')

  const rows = [...(data.recent ?? []), ...(data.meetings ?? [])]
  const allowedSources = new Set([null, 'published-agenda', 'official-calendar', 'published-agenda+official-calendar'])
  for (const meeting of rows) {
    if ((meeting.type ?? '').trim().toLowerCase() === 'town board meeting' && !officialDates.has(meeting.slug)) {
      fail(`Regular Town Board date is not on the published Town schedule: ${meeting.slug}`)
    }
    if (!allowedSources.has(meeting.itemsSource ?? null)) fail(`Unknown meeting item source for ${meeting.slug}: ${meeting.itemsSource}`)

    const docket = meeting.docket ?? []
    const hearings = meeting.hearings ?? []
    const itemCount = docket.length + hearings.length
    if (itemCount > 0 && !meeting.itemsSource) fail(`Meeting ${meeting.slug} lists items without an official item source`)
    if (meeting.itemsSource == null && itemCount !== 0) fail(`Meeting ${meeting.slug} has unsourced listed items`)

    if (docket.length > 0) {
      if (!meeting.agendaPublished) fail(`Meeting ${meeting.slug} lists resolutions without a published agenda`)
      if (!String(meeting.itemsSource).includes('published-agenda')) fail(`Meeting ${meeting.slug} docket is not attributed to a published agenda`)
      const numbers = new Set()
      for (const item of docket) {
        if (!Number.isInteger(item.seq) || item.seq < 1) fail(`Meeting ${meeting.slug} has an invalid resolution sequence`)
        if (!/^20\d{2}-\d{3,4}$/.test(item.number ?? '')) fail(`Meeting ${meeting.slug} has an invalid resolution number: ${item.number}`)
        if (!(item.title ?? '').trim()) fail(`Meeting ${meeting.slug} has a blank resolution title: ${item.number}`)
        if (numbers.has(item.number)) fail(`Meeting ${meeting.slug} repeats resolution ${item.number}`)
        numbers.add(item.number)
      }
    }

    if (hearings.length > 0 && !['official-calendar', 'published-agenda', 'published-agenda+official-calendar'].includes(meeting.itemsSource)) {
      fail(`Meeting ${meeting.slug} has public hearings without an official agenda/calendar source`)
    }
  }
}

if (existsSync(fetcherFile)) {
  const source = readFileSync(fetcherFile, 'utf8')
  for (const text of [
    'published_regular_meeting_dates',
    'official_calendar_hearings',
    'section_lines(text, "Resolutions")',
    'section_lines(text, "Public Hearings")',
    'itemsSource',
    'Town-Board-Meeting-Schedule',
  ]) if (!source.includes(text)) fail(`Official meeting-source contract regressed: missing ${text}`)
}

if (existsSync(timelineFile)) {
  const source = readFileSync(timelineFile, 'utf8')
  for (const text of [
    'Officially noticed public hearings',
    'published resolution item',
    'No agenda items are currently published in the indexed Town sources',
    'the site does not infer agenda items',
    'Official schedule ↗',
  ]) if (!source.includes(text)) fail(`Meeting timeline actual-items UX regressed: missing ${text}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Meeting schedule verification passed: regular dates reconcile to the Town schedule and listed items require an official published source.')
