import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const repoPath = (...parts) => join(root, '..', ...parts)
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); process.exitCode = 1 }

const required = [
  'components/MeetingRecordExplorer.tsx',
  'components/MeetingTimeline.tsx',
  'out/meetings/index.html',
  'out/data/meetings/index.json',
  'out/data/meetings/fiscal-index.json',
  'out/data/meetings/official-sources.json',
]
for (const file of required) if (!existsSync(path(file))) fail(`Meeting record is missing required file: ${file}`)

for (const file of [
  repoPath('etl/fetch_meetings.py'),
  repoPath('etl/fetch_vote_packets.py'),
  repoPath('etl/apply_vote_packet_fallback.py'),
  repoPath('etl/vote_packet_parser.py'),
  repoPath('etl/reconcile_meeting_sources.py'),
  repoPath('.github/workflows/sync-meetings.yml'),
]) if (!existsSync(file)) fail(`Meeting reconciliation is missing required file: ${file}`)

if (existsSync(path('out/meetings/index.html'))) {
  const html = readFileSync(path('out/meetings/index.html'), 'utf8')
  for (const text of [
    'Town Board Minutes &amp; Votes',
    'The decision record',
    'What happened, who voted how, and what did it cost?',
    'Minutes should answer a resident',
    'Need the full fiscal-impact audit?',
  ]) if (!html.includes(text)) fail(`Meeting decision-record framing regressed: missing ${text}`)
}

if (existsSync(path('components/MeetingRecordExplorer.tsx'))) {
  const source = readFileSync(path('components/MeetingRecordExplorer.tsx'), 'utf8')
  for (const text of [
    'Official vote record available',
    'Fiscal impact companion',
    'Has fiscal statement',
    'Town filing:',
    'dollar amounts are shown only where they can be tied unambiguously',
    'meetings[0]?.slug',
    'Adopted resolution document matched',
    'Official adopted resolution ↗',
    'minutes revised',
    'resolution documents matched',
    'officialDocumentVerified',
    'PENDING_GRACE_DAYS = 7',
    'voteDetailOmitted',
    'Official minutes · vote detail omitted',
    'individual outcomes not stated',
    'The site will not infer an outcome',
  ]) if (!source.includes(text)) fail(`Meeting explorer contract regressed: missing ${text}`)
  if (!source.includes('fiscal-index.json')) fail('Meeting explorer no longer uses the fiscal-impact meeting index')
  if (!source.includes('${slug}-fiscal.json')) fail('Meeting explorer no longer loads the selected meeting fiscal companion')
  if (source.includes('detailed votes are still pending')) fail('Historical minute records reverted to indefinite pending-vote wording')
}

if (existsSync(path('components/MeetingTimeline.tsx'))) {
  const source = readFileSync(path('components/MeetingTimeline.tsx'), 'utf8')
  for (const text of [
    'PENDING_GRACE_DAYS = 7',
    'Official minutes are published, but they omit individual vote results',
    'published minutes, and a published individual vote record are separate states',
    'It will not infer those votes from the agenda, resolution titles, or video',
  ]) if (!source.includes(text)) fail(`Meeting timeline vote-status framing regressed: missing ${text}`)
  if (source.includes('detailed votes are still pending')) fail('Meeting timeline reverted to indefinite pending-vote wording')
}

if (existsSync(path('out/data/meetings/fiscal-index.json'))) {
  const fiscal = JSON.parse(readFileSync(path('out/data/meetings/fiscal-index.json'), 'utf8'))
  if (!Array.isArray(fiscal.meetings) || fiscal.meetings.length < 10) fail(`Fiscal-impact meeting coverage collapsed: ${fiscal.meetings?.length ?? 0} meetings`)
  if (!fiscal.meetings.includes('2026-07-07')) fail('Hand-curated July 7 fiscal-impact record is missing from the fiscal index')
}

// July 21 and August 18 are durable regression fixtures because the Clerk's
// condensed Minutes omit the individual vote details. There are now two valid
// states for each fixture:
//
// 1. preliminary/docket-only, which truthfully exposes the omission; or
// 2. upgraded from an official CivicClerk Agenda Packet that contains complete
//    per-resolution THE VOTE blocks.
//
// The second state is an improvement, not a disappearance. What must never
// happen is silently inferring votes from titles/agendas or losing the meeting.
if (existsSync(path('out/data/meetings/index.json')) && existsSync(path('out/data/meetings/official-sources.json'))) {
  const index = JSON.parse(readFileSync(path('out/data/meetings/index.json'), 'utf8'))
  const official = JSON.parse(readFileSync(path('out/data/meetings/official-sources.json'), 'utf8'))

  for (const slug of ['2026-07-21', '2026-08-18']) {
    const meeting = index.meetings?.find((m) => m.slug === slug)
    if (!meeting) {
      fail(`Known vote-detail-omission example disappeared from meeting index: ${slug}`)
      continue
    }

    const remainsOmission = Boolean(meeting.preliminary && meeting.docketCount > 0)
    const source = official.meetings?.[slug]
    const packet = source?.votePacket
    const upgradedFromOfficialPacket = Boolean(
      meeting.voteSource === 'agenda-packet'
      && meeting.total > 0
      && String(meeting.officialRecordStatus ?? '').startsWith('vote-record-parsed')
      && source?.voteSourceKind === 'agenda-packet'
      && packet?.hasVoteBlocks
      && packet?.voteBlockCount >= meeting.total
      && source?.voteSource?.hasVoteBlocks
      && source?.voteSource?.voteBlockCount >= meeting.total
    )

    if (!remainsOmission && !upgradedFromOfficialPacket) {
      fail(`Vote-detail-omission fixture is neither preserved nor backed by a complete official Agenda Packet: ${slug}`)
    }
  }
}

// Continuous source reconciliation must remain structural, not a one-time fetch.
const fetcherPath = repoPath('etl/fetch_meetings.py')
if (existsSync(fetcherPath)) {
  const source = readFileSync(fetcherPath, 'utf8')
  for (const text of [
    'source-manifest.json',
    'hashlib.sha256',
    'revisionCount',
    'resolutionSources',
    'source manifest unchanged — no no-op commit will be created',
  ]) if (!source.includes(text)) fail(`Meeting source reconciliation regressed: missing ${text}`)
  if (source.includes('Final minutes (with a vote summary) never change')) fail('Meeting fetcher reverted to freezing vote-bearing minutes')
}

const reconcilerPath = repoPath('etl/reconcile_meeting_sources.py')
if (existsSync(reconcilerPath)) {
  const source = readFileSync(reconcilerPath, 'utf8')
  for (const text of [
    'officialDocumentVerified',
    'officialRecord',
    'verifiedResolutionCount',
    'vote-record-parsed-resolution-documents-linked',
    'official-sources.json',
    'sourceVersionAt',
  ]) if (!source.includes(text)) fail(`Meeting official-record annotation regressed: missing ${text}`)
}

const voteFallbackPath = repoPath('etl/apply_vote_packet_fallback.py')
if (existsSync(voteFallbackPath)) {
  const source = readFileSync(voteFallbackPath, 'utf8')
  for (const text of [
    'if not entry.get("preliminary")',
    'if not parsed.get("complete")',
    'meeting["voteSource"] = "agenda-packet"',
    'entry["voteSource"] = "agenda-packet"',
  ]) if (!source.includes(text)) fail(`Agenda-packet vote fallback safety contract regressed: missing ${text}`)
}

const workflowPath = repoPath('.github/workflows/sync-meetings.yml')
if (existsSync(workflowPath)) {
  const source = readFileSync(workflowPath, 'utf8')
  const ordered = [
    'python etl/fetch_meetings.py',
    'python etl/fetch_vote_packets.py',
    'python etl/parse_meetings.py',
    'python etl/apply_vote_packet_fallback.py',
    'python etl/reconcile_meeting_sources.py',
    'python etl/parse_fiscal_impact.py',
  ]
  let previous = -1
  for (const command of ordered) {
    const index = source.indexOf(command)
    if (index < 0) fail(`Meeting sync no longer runs required command: ${command}`)
    if (index <= previous) fail(`Meeting sync command order regressed around: ${command}`)
    previous = index
  }
  if (!source.includes("github.ref == 'refs/heads/main'")) fail('Meeting sync publishing is no longer restricted to main')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Meeting record verification passed: decision-first UX, accurate vote-availability states, official agenda-packet fallback, fiscal-impact integration, official-resolution verification, and continuous source reconciliation are intact.')
