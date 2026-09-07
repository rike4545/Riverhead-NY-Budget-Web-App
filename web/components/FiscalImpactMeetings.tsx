'use client'

import { useEffect, useState } from 'react'
import FiscalImpactTable, { type FiscalResolution } from './FiscalImpactTable'
import RecordTrail from './RecordTrail'
import DataStatus from './DataStatus'
import { meetingUrl, meetingsIndex, type Meeting } from '../lib/meetings'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const VOTE_GRACE_DAYS = 7

export type FiscalMeeting = {
  slug: string
  meetingDate: string
  source: { title: string; url: string }
  method: string
  summary: {
    total: number
    markedNo: number
    markedYes: number
    understated: number
    understatedMarkedNo: number
    identifiedDollarsAtStake: number
    largestUnderstatedMarkedNo: [number, string, string] | null
  }
  resolutions: FiscalResolution[]
}

type VoteDetailState = 'available' | 'pending' | 'omitted' | 'unindexed'

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function ageDays(iso: string) {
  return Math.max(0, Math.floor((Date.now() - Date.parse(`${iso}T12:00:00Z`)) / 86_400_000))
}

function recordState(slug: string, meetingDate: string, record: Meeting | null): { kind: VoteDetailState; title: string; detail: string } {
  const indexEntry = meetingsIndex.meetings.find((entry) => entry.slug === slug)
  const official = record?.officialRecord?.status
  if (official === 'vote-record-parsed' || official === 'vote-record-parsed-resolution-documents-linked' || (indexEntry && !indexEntry.preliminary)) {
    return {
      kind: 'available',
      title: 'Official vote record available',
      detail: 'The fiscal statement can be read alongside parsed Town Board outcomes and member vote detail where the Clerk published it.',
    }
  }
  if (indexEntry?.preliminary && ageDays(meetingDate) > VOTE_GRACE_DAYS) {
    return {
      kind: 'omitted',
      title: 'Official minutes published · vote detail omitted',
      detail: 'The Clerk minutes list the resolutions but do not state individual outcomes in the structured vote format. This site does not infer adoption from the fiscal statement, agenda placement, title, or meeting video.',
    }
  }
  if (indexEntry?.preliminary) {
    return {
      kind: 'pending',
      title: 'Meeting completed · vote record not yet available',
      detail: `This meeting is still inside the ${VOTE_GRACE_DAYS}-day reconciliation window. The fiscal filing is available, but it is not proof of the final vote.`,
    }
  }
  return {
    kind: 'unindexed',
    title: 'Fiscal statement available · vote record not indexed',
    detail: 'The fiscal filing is available, but this site does not currently have a matching parsed Town Board vote record for this meeting.',
  }
}

export default function FiscalImpactMeetings({ meetings }: { meetings: FiscalMeeting[] }) {
  const [date, setDate] = useState(meetings[0]?.meetingDate ?? '')
  const m = meetings.find((x) => x.meetingDate === date) ?? meetings[0]
  const [meetingRecord, setMeetingRecord] = useState<Meeting | null>(null)

  useEffect(() => {
    let cancelled = false
    setMeetingRecord(null)
    if (!m?.slug) return () => { cancelled = true }
    fetch(meetingUrl(m.slug))
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (!cancelled) setMeetingRecord(value as Meeting | null) })
      .catch(() => { if (!cancelled) setMeetingRecord(null) })
    return () => { cancelled = true }
  }, [m?.slug])

  if (!m) return null
  const s = m.summary
  const understatedNo = m.resolutions.filter((r) => r.realistic.flag === 'understated' && r.townFiscalImpact === 'No')
  const reserveDraw = m.resolutions.filter((r) => r.realistic.flag === 'reserve-draw')
  const corrections = [...understatedNo, ...reserveDraw]
  const lu = s.largestUnderstatedMarkedNo
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const meetingHref = `${base}/meetings/?meeting=${encodeURIComponent(m.slug)}`
  const evidence = recordState(m.slug, m.meetingDate, meetingRecord)
  const verifiedCount = meetingRecord?.officialRecord?.verifiedResolutionCount ?? 0
  const statusTone = evidence.kind === 'available' ? 'var(--rbl-success)' : evidence.kind === 'omitted' ? 'var(--rbl-warn)' : 'var(--rbl-accent-border)'

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <label htmlFor="meeting" style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>Meeting:</label>
          <select id="meeting" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: '1 1 220px', minWidth: 0, padding: '10px 13px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 15, fontWeight: 700, color: 'var(--rbl-title)' }}>
            {meetings.map((x) => <option key={x.meetingDate} value={x.meetingDate}>{fmtDate(x.meetingDate)}</option>)}
          </select>
          <DataStatus status="calculated" text="Independent read from the Town's fiscal-impact statement" />
        </div>
        <a href={meetingHref} style={{ color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }} title={`Open the Town Board voting record for ${fmtDate(m.meetingDate)}`}>Open this meeting’s record →</a>
      </section>

      <section style={{ ...card, borderLeft: `5px solid ${statusTone}` }} data-fiscal-record-status={evidence.kind}>
        <div style={{ color: evidence.kind === 'omitted' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)', fontWeight: 950, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: .45 }}>Decision-record status</div>
        <h3 style={{ margin: '4px 0 5px', color: 'var(--rbl-title)' }}>{evidence.title}</h3>
        <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55 }}>{evidence.detail}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, color: 'var(--rbl-text-muted)', fontSize: 12 }}>
          <span>Fiscal statement: available</span>
          <span>·</span>
          <span>Vote evidence: {evidence.kind === 'available' ? 'available' : evidence.kind === 'omitted' ? 'omitted from published minutes' : evidence.kind === 'pending' ? 'not yet available' : 'not indexed'}</span>
          {verifiedCount > 0 && <><span>·</span><span>{verifiedCount} adopted-resolution document{verifiedCount === 1 ? '' : 's'} verified</span></>}
        </div>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(170px,100%),1fr))', gap: 12 }}>
        <Stat label="Resolutions" value={String(s.total)} sub={`on ${fmtDate(m.meetingDate)}`} />
        <Stat label="Marked “no fiscal impact”" value={String(s.markedNo)} sub={`of ${s.total}`} />
        <Stat label="…that plainly move money" value={String(understatedNo.length)} sub="marked “no impact”" accent />
        <Stat label="Marked “absorbed”, but draws reserves" value={String(reserveDraw.length)} sub="the other half of the corrections" accent />
        {s.identifiedDollarsAtStake > 0 && <Stat label="Identified dollars in play" value={usd(s.identifiedDollarsAtStake)} sub="cost items we could price" />}
      </section>

      {lu && <section style={{ ...card, borderLeft: '6px solid var(--rbl-danger)' }}><h3 style={{ marginTop: 0 }}>The clearest example</h3><p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>Resolution <strong>{lu[1]}</strong> — “{lu[2]}” — carries a fiscal-impact statement checked <strong>“No,”</strong> yet commits <strong style={{ color: 'var(--rbl-danger)' }}>{usd(lu[0])}</strong>. A six-figure action is exactly the kind of item a fiscal-impact statement exists to flag.</p><a href={`${meetingHref}&q=${encodeURIComponent(lu[1])}`} style={{ display: 'inline-block', marginTop: 10, color: 'var(--rbl-link)', fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>Open resolution {lu[1]} in the meeting record →</a></section>}

      {corrections.length > 0 && <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Of the <strong>{s.total}</strong> resolutions, <strong>{corrections.length}</strong> get a different answer here than the Town gave. <strong>{understatedNo.length}</strong> were marked <strong>no fiscal impact</strong> yet commit or change real money. Another <strong>{reserveDraw.length}</strong> the Town did flag as having an impact, but called <strong>absorbed by the existing budget</strong> — on a realistic read those draw on reserves, fund balance or borrowing, which is not the same as costing nothing.</p>}

      <FiscalImpactTable resolutions={m.resolutions} meetingRecord={meetingRecord} voteDetailState={evidence.kind} />

      <RecordTrail title="Trace the financial finding" intro="Follow the corrected fiscal-impact read back to the vote, the broader budget record, and the underlying evidence." items={[
        { href: `/meetings/?meeting=${encodeURIComponent(m.slug)}`, label: 'Town Board Record', text: `Open the meeting record for ${fmtDate(m.meetingDate)} and see whether vote detail is actually available.` },
        { href: '/compare/', label: 'Budget Changes', text: 'See how adopted appropriations changed across the budget.' },
        { href: '/analytics/', label: 'Financial Health', text: 'Put these commitments alongside spending, levy growth, and reserves.' },
        { href: '/sources/', label: 'Source Library', text: 'Review the public records and source material behind the analysis.' },
      ]} />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>Source: {m.source.title}. {m.method} This is an independent read, not the Town’s official position. A fiscal-impact form documents the Town’s financial treatment of a proposed resolution; by itself it does not prove that the resolution was adopted or how each member voted. Verify against the agenda packet, minutes, and any separately published adopted-resolution document.</p>
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return <div style={{ background: accent ? 'var(--rbl-danger-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div><strong style={{ fontSize: 22, color: accent ? 'var(--rbl-danger-strong)' : 'var(--rbl-title)' }}>{value}</strong>{sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}</div>
}