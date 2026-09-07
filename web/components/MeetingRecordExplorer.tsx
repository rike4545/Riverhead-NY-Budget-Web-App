'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoadingCard, useFetchJson } from './useFetchJson'
import { meetingsIndex, meetingUrl, type Meeting, type Resolution, type Vote } from '../lib/meetings'
import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import type { FiscalResolution } from './FiscalImpactTable'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const VOTE_COLOR: Record<Vote, string> = { aye: 'var(--rbl-success)', nay: 'var(--rbl-danger)', abstain: 'var(--rbl-series-gold)', absent: 'var(--rbl-border-strong)' }
const VOTE_LABEL: Record<Vote, string> = { aye: 'Yes', nay: 'No', abstain: 'Abstained', absent: 'Absent' }
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type Filter = 'all' | 'contested' | 'failed' | 'tabled' | 'fiscal'
type FiscalMeeting = {
  slug: string
  meetingDate: string
  source: { title: string; url: string }
  method: string
  summary: { total: number; markedNo: number; markedYes: number; understated: number; understatedMarkedNo: number; identifiedDollarsAtStake: number }
  resolutions: FiscalResolution[]
}

function useOptionalJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let cancelled = false
    setData(null)
    if (!url) return () => { cancelled = true }
    fetch(url).then((r) => r.ok ? r.json() : null).then((value) => {
      if (!cancelled) setData(value as T | null)
    }).catch(() => { if (!cancelled) setData(null) })
    return () => { cancelled = true }
  }, [url])
  return data
}

export default function MeetingRecordExplorer() {
  const meetings = meetingsIndex.meetings
  const [slug, setSlug] = useState(meetings[0]?.slug ?? '')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const query = q.trim().toLowerCase()
  const { data: meeting, error } = useFetchJson<Meeting>(meetingUrl(slug))
  const hasFiscal = (fiscalIndex.meetings as string[]).includes(slug)
  const fiscal = useOptionalJson<FiscalMeeting>(hasFiscal ? `${base}/data/meetings/${slug}-fiscal.json` : null)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const requestedMeeting = params.get('meeting')
      const requestedQuery = params.get('q') ?? ''
      if (requestedMeeting && meetings.some((m) => m.slug === requestedMeeting)) setSlug(requestedMeeting)
      if (requestedQuery) setQ(requestedQuery)
    } catch { /* URL state is optional */ }
  }, [meetings])

  const fiscalByNumber = useMemo(() => {
    const map = new Map<string, FiscalResolution>()
    for (const r of fiscal?.resolutions ?? []) if (r.number) map.set(r.number, r)
    return map
  }, [fiscal])

  const filtered = useMemo(() => {
    if (!meeting) return []
    return meeting.resolutions.filter((r) => {
      const fi = r.number ? fiscalByNumber.get(r.number) : undefined
      if (filter === 'contested' && !(r.tag === 'split' || (r.naysCount ?? 0) > 0)) return false
      if (filter === 'failed' && r.tag !== 'failed') return false
      if (filter === 'tabled' && r.tag !== 'tabled') return false
      if (filter === 'fiscal' && !fi) return false
      if (query && !(`${r.number ?? ''} ${r.title} ${fi?.category ?? ''} ${fi?.realistic.verdict ?? ''}`.toLowerCase().includes(query))) return false
      return true
    })
  }, [meeting, filter, query, fiscalByNumber])

  const syncUrl = (nextSlug: string, search = q) => {
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('meeting', nextSlug)
      if (search) params.set('q', search); else params.delete('q')
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    } catch { /* URL state is optional */ }
  }

  const changeMeeting = (next: string) => {
    setSlug(next)
    setQ('')
    setFilter('all')
    syncUrl(next, '')
  }

  if (!meeting && !error) return <LoadingCard label="Loading the Town Board record…" />
  if (error || !meeting) return <LoadingCard label="Could not load this meeting record — check your connection and reload." />

  if (meeting.preliminary) {
    const docket = meeting.docket ?? []
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <MeetingPicker slug={slug} changeMeeting={changeMeeting} />
        <section style={{ ...card, borderLeft: '5px solid var(--rbl-warn)' }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--rbl-warn)' }}>Latest record · minutes not final</div>
          <h2 style={{ margin: '4px 0 6px' }}>{meeting.date}</h2>
          <p style={{ margin: 0, color: 'var(--rbl-text-body)', lineHeight: 1.55 }}>
            The Town has published the meeting docket, but the vote-bearing minutes have not been parsed yet. That means the resolution list is official, while individual outcomes remain pending.
          </p>
          <OfficialRecordLine meeting={meeting} />
        </section>
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Resolutions on the docket</h3>
            <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{docket.length} items · votes pending</span>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {docket.map((d) => <div key={`${d.number}-${d.seq}`} style={{ padding: '11px 13px', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10 }}><div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}><strong style={{ color: 'var(--rbl-link)', fontSize: 12 }}>{d.number}</strong>{d.officialDocumentVerified && <VerifiedChip />}</div><div style={{ color: 'var(--rbl-title)', fontWeight: 650, marginTop: 2, lineHeight: 1.4 }}>{d.title}</div></div>)}
          </div>
        </section>
      </div>
    )
  }

  const rosterOrder = meeting.roster.map((r) => r.last)
  const shortName = (last: string) => meeting.memberTallies?.[last]?.name.split(' ').slice(-1)[0] ?? last
  const adopted = meeting.resolutions.filter((r) => r.adopted).length
  const fiscalCorrections = fiscal?.resolutions.filter((r) => r.realistic.flag === 'understated' || r.realistic.flag === 'reserve-draw').length ?? 0
  const officialSourceUrl = (r: Resolution) => {
    const firstId = r.officialDocumentFileIds?.[0]
    if (firstId == null) return undefined
    return meeting.officialRecord?.resolutionSources.find((source) => String(source.fileId) === String(firstId))?.sourceUrl
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <MeetingPicker slug={slug} changeMeeting={changeMeeting} />

      <section style={{ ...card, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'start' }}>
          <div>
            <div style={{ color: 'var(--rbl-success-strong)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.35 }}>
              {meeting.officialRecord?.status === 'vote-record-parsed-resolution-documents-linked' ? 'Official vote record · adopted-resolution documents matched' : 'Official vote record available'}
            </div>
            <h2 style={{ margin: '4px 0 3px', color: 'var(--rbl-title)' }}>{meeting.date}</h2>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>{meeting.type}{meeting.calledToOrder ? ` · called to order ${meeting.calledToOrder}` : ''}</div>
            <OfficialRecordLine meeting={meeting} />
          </div>
          <a href={meetingsIndex.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Official minutes &amp; agendas ↗</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10, marginTop: 16 }}>
          <Stat label="Decisions" value={meeting.stats.total} sub={`${adopted} adopted`} />
          <Stat label="Unanimous" value={meeting.stats.unanimous} sub="routine consensus" />
          <Stat label="Contested" value={meeting.stats.contested} sub="member disagreement" tone={meeting.stats.contested ? 'warn' : undefined} />
          <Stat label="Failed" value={meeting.stats.failed} sub="did not carry" tone={meeting.stats.failed ? 'danger' : undefined} />
          <Stat label="Tabled" value={meeting.stats.tabled} sub="decision postponed" />
          {fiscal && <Stat label="Fiscal flags" value={fiscalCorrections} sub={`${fiscal.summary.total} statements reviewed`} tone={fiscalCorrections ? 'warn' : undefined} />}
        </div>
      </section>

      {fiscal && (
        <section style={{ ...card, borderLeft: '5px solid var(--rbl-series-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
            <div>
              <div style={{ color: 'var(--rbl-warn)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>Fiscal impact companion</div>
              <h3 style={{ margin: '4px 0 4px' }}>What the vote may mean financially</h3>
              <p style={{ margin: 0, color: 'var(--rbl-text-body)', lineHeight: 1.5, fontSize: 14 }}>
                The Town filed fiscal-impact statements for {fiscal.summary.total} resolutions. {fiscalCorrections > 0 ? `${fiscalCorrections} deserve a closer read because the stated treatment may understate money moving through the budget, reserves, or contracts.` : 'No corrections are flagged in the current read.'}
              </p>
            </div>
            <a href={`${base}/fiscal-impact/`} style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Open full fiscal-impact analysis →</a>
          </div>
          {fiscal.summary.identifiedDollarsAtStake > 0 && <div style={{ marginTop: 10, fontWeight: 900, color: 'var(--rbl-title)' }}>{usd(fiscal.summary.identifiedDollarsAtStake)} in identified dollars tied to this meeting</div>}
        </section>
      )}

      <section style={{ ...card, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {([
            ['all', `All ${meeting.stats.total}`],
            ['contested', `Contested ${meeting.stats.contested}`],
            ['failed', `Failed ${meeting.stats.failed}`],
            ['tabled', `Tabled ${meeting.stats.tabled}`],
            ...(fiscal ? [['fiscal', `Has fiscal statement ${fiscal.summary.total}`] as const] : []),
          ] as const).map(([value, label]) => <FilterButton key={value} active={filter === value} onClick={() => setFilter(value)}>{label}</FilterButton>)}
        </div>
        <input value={q} onChange={(e) => { setQ(e.target.value); syncUrl(slug, e.target.value) }} placeholder="Find a resolution by number, topic, contract, person, project…" aria-label="Search this meeting" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid var(--rbl-border-strong)', borderRadius: 10, fontSize: 15, color: 'var(--rbl-title)', background: 'var(--rbl-surface)' }} />
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{filtered.length} of {meeting.stats.total} decisions shown</div>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        {filtered.map((r) => <DecisionCard key={r.seq} resolution={r} fiscal={r.number ? fiscalByNumber.get(r.number) : undefined} rosterOrder={rosterOrder} shortName={shortName} officialSourceUrl={officialSourceUrl(r)} />)}
        {filtered.length === 0 && <div style={{ ...card, color: 'var(--rbl-text-muted)' }}>No decisions match this view.</div>}
      </section>

      <details style={card}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, color: 'var(--rbl-title)' }}>How each member voted across the whole meeting</summary>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 610 }}>
            <thead><tr style={{ color: 'var(--rbl-text-muted)', textAlign: 'left', borderBottom: '2px solid var(--rbl-border-subtle)' }}><th style={th}>Member</th><th style={num}>Yes</th><th style={num}>No</th><th style={num}>Abstained</th><th style={num}>Absent</th></tr></thead>
            <tbody>{rosterOrder.map((last) => { const tally = meeting.memberTallies?.[last]; if (!tally) return null; return <tr key={last} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}><td style={td}><strong>{tally.name}</strong><span style={{ color: 'var(--rbl-text-muted)', marginLeft: 6, fontSize: 12 }}>{tally.title}</span></td><td style={num}>{tally.aye}</td><td style={{ ...num, color: tally.nay ? 'var(--rbl-danger)' : undefined, fontWeight: tally.nay ? 900 : 400 }}>{tally.nay}</td><td style={{ ...num, color: tally.abstain ? 'var(--rbl-warn)' : undefined }}>{tally.abstain}</td><td style={num}>{tally.absent}</td></tr> })}</tbody>
          </table>
        </div>
      </details>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
        Vote source: {meetingsIndex.source.title} — {meeting.date}. Fiscal-impact labels reproduce the Town&apos;s filed Yes/No treatment and pair it with this project&apos;s independently calculated read; dollar amounts are shown only where they can be tied unambiguously to a resolution. Separately published adopted-resolution documents are marked only when the exact resolution number is found in the current CivicClerk source.
      </p>
    </div>
  )
}

function OfficialRecordLine({ meeting }: { meeting: Meeting }) {
  const record = meeting.officialRecord
  if (!record) return null
  const version = record.sourceVersionAt ? new Date(record.sourceVersionAt).toLocaleString() : null
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9, color: 'var(--rbl-text-muted)', fontSize: 11.8 }}>
    <span>{record.verifiedResolutionCount} resolution document{record.verifiedResolutionCount === 1 ? '' : 's'} matched</span>
    <span>·</span>
    <span>{record.minutesRevisionCount ? `minutes revised ${record.minutesRevisionCount} time${record.minutesRevisionCount === 1 ? '' : 's'}` : 'no archived minutes revisions'}</span>
    {version && <><span>·</span><span>source version {version}</span></>}
  </div>
}

function MeetingPicker({ slug, changeMeeting }: { slug: string; changeMeeting: (slug: string) => void }) {
  return <section style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 14 }}><label htmlFor="decision-meeting" style={{ fontWeight: 900, color: 'var(--rbl-title)' }}>Meeting</label><select id="decision-meeting" value={slug} onChange={(e) => changeMeeting(e.target.value)} style={{ flex: '1 1 320px', minWidth: 0, padding: '10px 12px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontWeight: 700, color: 'var(--rbl-title)', background: 'var(--rbl-surface)' }}>{meetingsIndex.meetings.map((m) => <option key={m.slug} value={m.slug}>{m.date} — {m.preliminary ? `${m.docketCount ?? 0} docket items · votes pending` : `${m.total} decisions${m.contested ? ` · ${m.contested} contested` : ''}`}</option>)}</select><span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{meetingsIndex.totals.meetings} meetings · {meetingsIndex.totals.votes.toLocaleString()} votes</span></section>
}

function VerifiedChip() {
  return <span style={{ background: 'var(--rbl-success-bg)', color: 'var(--rbl-success-strong)', border: '1px solid var(--rbl-success-border)', borderRadius: 999, padding: '2px 7px', fontWeight: 900, fontSize: 10.5 }}>Adopted resolution document matched</span>
}

function DecisionCard({ resolution: r, fiscal, rosterOrder, shortName, officialSourceUrl }: { resolution: Resolution; fiscal?: FiscalResolution; rosterOrder: string[]; shortName: (last: string) => string; officialSourceUrl?: string }) {
  const voteStyle = r.tag === 'failed' ? { label: 'Failed', fg: 'var(--rbl-danger-strong)', bg: 'var(--rbl-danger-bg)', border: 'var(--rbl-danger)' } : r.tag === 'tabled' ? { label: 'Tabled', fg: 'var(--rbl-text-body)', bg: 'var(--rbl-surface-3)', border: 'var(--rbl-border-strong)' } : r.tag === 'split' ? { label: r.ayesCount != null && r.naysCount != null ? `Passed ${r.ayesCount}–${r.naysCount}` : 'Passed · split vote', fg: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)', border: 'var(--rbl-series-gold)' } : { label: 'Passed unanimously', fg: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)', border: 'var(--rbl-success)' }
  const hasVotes = Object.keys(r.votes).length > 0
  const fiscalFlag = fiscal?.realistic.flag
  const fiscalTone = fiscalFlag === 'understated' ? { fg: 'var(--rbl-danger-strong)', bg: 'var(--rbl-danger-bg)' } : fiscalFlag === 'reserve-draw' ? { fg: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' } : { fg: 'var(--rbl-text-body)', bg: 'var(--rbl-surface-2)' }
  return <article style={{ ...card, borderLeft: `5px solid ${voteStyle.border}`, padding: 17 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 460px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{r.number && <strong style={{ color: 'var(--rbl-link)', fontSize: 12.5 }}>{r.number}</strong>}<span style={{ background: voteStyle.bg, color: voteStyle.fg, borderRadius: 999, padding: '3px 9px', fontWeight: 900, fontSize: 11.5 }}>{voteStyle.label}</span>{r.officialDocumentVerified && <VerifiedChip />}</div>
        <h3 style={{ margin: '6px 0 0', fontSize: 17, lineHeight: 1.35, color: 'var(--rbl-title)' }}>{r.title}</h3>
      </div>
      {fiscal && <span style={{ background: fiscalTone.bg, color: fiscalTone.fg, borderRadius: 999, padding: '4px 10px', fontWeight: 900, fontSize: 11.5 }}>{fiscal.amount ? usd(fiscal.amount) : fiscal.townFiscalImpact === 'Yes' ? 'Town: fiscal impact' : 'Town: no fiscal impact'}</span>}
    </div>

    {(r.tag !== 'unanimous' && hasVotes) && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>{rosterOrder.map((last) => { const vote = r.votes[last]; if (!vote) return null; return <span key={last} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', fontSize: 12, fontWeight: 750 }}><span style={{ width: 8, height: 8, borderRadius: 8, background: VOTE_COLOR[vote] }} />{shortName(last)} · {VOTE_LABEL[vote]}</span> })}</div>}

    {fiscal && <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--rbl-border-subtle)', display: 'grid', gap: 5 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><strong style={{ fontSize: 12.5, color: 'var(--rbl-title)' }}>Fiscal impact</strong><span style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>Town filing: {fiscal.townFiscalImpact === 'Yes' ? 'Yes' : 'No'}{fiscal.townTreatment === 'absorbed' ? ' · absorbed in existing budget' : ''}</span></div>
      <div style={{ color: fiscalTone.fg, fontWeight: 850, fontSize: 13 }}>{fiscal.realistic.verdict}{fiscal.amount ? ` · ${usd(fiscal.amount)}` : ''}</div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{fiscal.realistic.reason}</div>
    </div>}

    {(r.mover || r.seconder || officialSourceUrl) && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.8, marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}><span>{r.mover ? `Moved by ${r.mover}` : ''}{r.seconder ? ` · seconded by ${r.seconder}` : ''}</span>{officialSourceUrl && <a href={officialSourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 850, textDecoration: 'none' }}>Official adopted resolution ↗</a>}</div>}
  </article>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={{ border: '1px solid', borderColor: active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: active ? 'white' : 'var(--rbl-text-strong)', borderRadius: 999, padding: '7px 11px', fontWeight: 850, fontSize: 12.5, cursor: 'pointer' }}>{children}</button> }
function Stat({ label, value, sub, tone }: { label: string; value: number; sub: string; tone?: 'warn' | 'danger' }) { return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 11, padding: 11 }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.35 }}>{label}</div><div style={{ fontSize: 21, fontWeight: 900, color: tone === 'danger' ? 'var(--rbl-danger)' : tone === 'warn' ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value.toLocaleString()}</div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{sub}</div></div> }
const th = { padding: '8px 9px' } as const
const td = { padding: '8px 9px' } as const
const num = { ...td, textAlign: 'right' as const }
