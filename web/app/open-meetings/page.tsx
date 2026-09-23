import fs from 'fs'
import path from 'path'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { meetingsIndex } from '../../lib/meetings'
import {
  SOURCES, covered, notCovered, requirements, differences, differencesNote, yourRights, type SourceKey,
} from '../../lib/open-meetings'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
const day = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}` }
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '8px 10px', verticalAlign: 'top' as const }
const link = { color: 'var(--rbl-accent)' }
const body = { color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5 } as const
const label = { color: 'var(--rbl-text-muted)', fontWeight: 800 } as const

export const metadata = {
  title: 'The Open Meetings Law in Riverhead',
  description:
    'What New York’s Open Meetings Law requires of the Riverhead Town Board and the Town’s other boards: notice, documents a day ahead, closed sessions, minutes and remote attendance, how the Board’s own rules compare, and what residents can do.',
}

type MeetingFile = {
  roster?: { last: string; party: string | null }[]
  officialRecord?: { minutes?: { fileId: number } | null } | null
}

// The meeting records this site holds, read at build time. Only what is on
// file: the site has no posting times, so nothing here says a deadline was met
// or missed except a meeting with no minutes at all two weeks later.
function loadRecord() {
  const dir = path.join(process.cwd(), 'public', 'data', 'meetings')
  const read = <T,>(file: string): T | null => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as T } catch { return null }
  }
  const rows = meetingsIndex.meetings
    .filter((m) => m.slug >= '2025-01-01')
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((m) => {
      const f = read<MeetingFile>(`${m.slug}.json`)
      return { slug: m.slug, type: m.type, minutes: Boolean(f?.officialRecord?.minutes), roster: f?.roster ?? [] }
    })
  // Written by the same sync that fetches minutes, so it dates what is on file.
  const asOf = (read<{ generatedAt?: string }>('upcoming.json')?.generatedAt ?? '').slice(0, 10) || null
  const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
  const overdue = asOf ? rows.filter((r) => !r.minutes && daysBetween(r.slug, asOf) > 14) : []
  const latest = rows.length ? rows[rows.length - 1] : null
  const counts: Record<string, number> = {}
  for (const m of latest?.roster ?? []) if (m.party === 'Republican' || m.party === 'Democrat') counts[m.party] = (counts[m.party] ?? 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return {
    rows,
    withMinutes: rows.filter((r) => r.minutes).length,
    overdue,
    latest,
    asOf,
    majorityParty: top ? { party: top[0], count: top[1] } : null,
  }
}

function Sources({ keys }: { keys: SourceKey[] }) {
  return (
    <div style={{ ...muted, marginTop: 8 }}>
      Sources:{' '}
      {keys.map((k, i) => (
        <span key={k}>{i > 0 && ' · '}<a href={SOURCES[k].url} target="_blank" rel="noreferrer" style={link}>{SOURCES[k].label}</a></span>
      ))}
    </div>
  )
}

export default function OpenMeetingsPage() {
  const rec = loadRecord()
  const first = rec.rows[0]
  const minutesText = first && rec.latest
    ? `Minutes are on file in the Town’s meeting portal for ${rec.withMinutes} of the ${rec.rows.length} Town Board meetings in this site’s records from ${day(first.slug)} through ${day(rec.latest.slug)}` +
      (rec.overdue.length
        ? `; for ${rec.overdue.map((r) => day(r.slug)).join(', ')} there were none more than two weeks after the meeting.`
        : rec.latest.minutes ? ', including the latest.' : '.') +
      ' The site doesn’t record when each set was posted, so it can’t check every two-week deadline. The Board’s rules have the Town Clerk keep formal minutes of regular and special meetings; they don’t mention work sessions.'
    : null

  return (
    <PageShell
      title="The Open Meetings Law in Riverhead"
      subtitle="What New York’s Open Meetings Law requires of the Town Board and the Town’s other boards, how the Board’s own rules compare, and what you can do."
    >
      <PlainCallout
        tips={[
          { label: 'Public body', text: 'any board of two or more members that needs a quorum to act, such as the Town Board, its committees and the Planning Board.' },
          { label: 'Quorum', text: 'the number of members needed to hold a meeting. For the five-member Town Board it is three.' },
          { label: 'Executive session', text: 'a part of a meeting closed to the public, allowed only for the reasons the law lists.' },
          { label: 'Work session', text: 'the Board’s Thursday meeting, where it discusses business without voting. It is still a meeting under the law.' },
        ]}
      >
        New York’s Open Meetings Law says the public’s business has to be done in public. It covers the Town Board and the
        Town’s other boards, and sets rules for notice, documents, closed sessions, minutes and attending by video. Anyone can
        go to court if they aren’t followed. This page sets out each rule, how Riverhead’s own rules match up, and what the
        records show. It explains the law; it isn’t legal advice.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Who it covers in Riverhead</h2>
        <p style={{ ...body, marginTop: 0 }}>
          A meeting is any time a quorum gathers to discuss public business, whether or not it votes and whatever it is
          called. A meeting can’t be held by phone or email.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 16 }}>
          <div data-covered style={{ minWidth: 0 }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16 }}>Covered</h3>
            <ul style={{ margin: 0, paddingLeft: 18, ...body }}>
              {covered.map((b) => <li key={b.name} style={{ marginBottom: 6 }}><strong>{b.name}.</strong> {b.note}</li>)}
            </ul>
          </div>
          <div data-not-covered style={{ minWidth: 0 }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16 }}>Not covered</h3>
            <ul style={{ margin: 0, paddingLeft: 18, ...body }}>
              {notCovered(rec.majorityParty).map((b) => <li key={b.name} style={{ marginBottom: 6 }}><strong>{b.name}.</strong> {b.note}</li>)}
            </ul>
          </div>
        </div>
        <Sources keys={['law', 'faq', 'rules2025']} />
      </section>

      <section style={{ ...card, marginBottom: 16 }} data-records>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>What the records show</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 12, marginBottom: 12 }}>
          <Stat label="Meetings in our records" value={String(rec.rows.length)} sub={first && rec.latest ? `${day(first.slug)} to ${day(rec.latest.slug)}` : ''} />
          <Stat label="With minutes on file" value={`${rec.withMinutes} of ${rec.rows.length}`} sub={rec.overdue.length ? `${rec.overdue.length} missing after two weeks` : 'none missing after two weeks'} />
          <Stat label="Videoconferencing law" value="Adopted 2023" sub="Town Code §101-26 (Local Law 2-2023)" />
          <Stat label="Board rules in force" value="March 2025" sub="Resolution 2025-230" />
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, ...body }}>
          {minutesText && <li data-minutes-record style={{ marginBottom: 6 }}>{minutesText}</li>}
          <li style={{ marginBottom: 6 }}>
            The Board replaced its rules in March 2025 (Resolution 2025-230), but the copy linked from the Supervisor’s Office page
            is still the 2019 version. The two differ on public comment time, work sessions, special meetings and resolutions filed
            late.
          </li>
          <li style={{ marginBottom: 6 }}>
            The 2025 and 2026 regular-meeting minutes this site holds record no executive sessions. The Board’s Thursday work
            sessions, where its rules also allow them, aren’t in the records we check yet.
          </li>
        </ul>
        {rec.asOf && <p style={{ ...muted, marginBottom: 0 }}>Meeting records as of {day(rec.asOf)}. They update twice a day.</p>}
        <Sources keys={['portal', 'rules2025', 'rules2019', 'videoLaw']} />
      </section>

      <h2 style={{ color: 'var(--rbl-title)', fontSize: 21, margin: '22px 0 10px' }}>What the law requires, and how Riverhead does it</h2>
      <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
        {requirements.map((r) => (
          <article key={r.id} data-requirement={r.id} style={{ ...card, padding: 18, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 17 }}>{r.title}</h3>
              <span style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800, color: 'var(--rbl-text-muted)' }}>{r.cite}</span>
            </div>
            <p style={{ ...body, margin: '8px 0 0' }}><span style={label}>The law: </span>{r.law}</p>
            {(r.id === 'minutes' ? minutesText : r.riverhead) && (
              <p style={{ ...body, margin: '8px 0 0' }} data-riverhead><span style={label}>In Riverhead: </span>{r.id === 'minutes' ? minutesText : r.riverhead}</p>
            )}
            {r.practice && <p style={{ ...body, margin: '8px 0 0' }} data-practice><span style={label}>Good practice: </span>{r.practice}</p>}
            <Sources keys={r.sources} />
          </article>
        ))}
      </div>

      <section style={{ ...card, marginBottom: 16 }} data-differences>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Where the Board’s rules and state law differ</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Topic</th><th style={th}>The Board’s rules (2025)</th><th style={th}>State law</th>
            </tr></thead>
            <tbody>
              {differences.map((d) => (
                <tr key={d.topic} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{d.topic}</td>
                  <td style={td}>{d.rules}</td>
                  <td style={td}>{d.law}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, marginBottom: 0 }}>{differencesNote}</p>
        <Sources keys={['rules2025', 'town62', 'town63', 'notice62', 'law']} />
      </section>

      <section style={{ ...card, marginBottom: 16 }} data-rights>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>What you can do</h2>
        <ul style={{ margin: 0, paddingLeft: 18, ...body }}>
          {yourRights.map((y) => (
            <li key={y.title} style={{ marginBottom: 6 }}>
              <strong>{y.title}.</strong> {y.text}
              {y.source && <> <a href={SOURCES[y.source].url} target="_blank" rel="noreferrer" style={link}>Source</a></>}
            </li>
          ))}
        </ul>
        <p style={{ ...muted, marginBottom: 0 }}>
          Follow the Board’s votes and minutes on the <a href={`${base}/meetings/`} style={link}>meetings page</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Sources</h2>
        <ul style={{ margin: 0, paddingLeft: 18, ...body, fontSize: 13.5 }}>
          {(Object.keys(SOURCES) as SourceKey[]).map((k) => (
            <li key={k}><a href={SOURCES[k].url} target="_blank" rel="noreferrer" style={link}>{SOURCES[k].label}</a></li>
          ))}
        </ul>
        <p style={{ ...muted, marginBottom: 0 }}>
          The Committee on Open Government’s advisory opinions are the state’s guidance on the law; courts decide disputes.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ label: l, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, minWidth: 0 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.2, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{l}</div>
      <strong style={{ fontSize: 19, color: 'var(--rbl-title)' }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
