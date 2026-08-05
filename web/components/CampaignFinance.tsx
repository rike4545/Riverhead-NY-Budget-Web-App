'use client'

import { useState } from 'react'
import {
  buildCandidateSummary,
  fetchAllWatchContributions,
  fetchCampaignSnapshots,
  fetchFilingHistory,
  RIVERHEAD_POPULATION_ESTIMATE_2024,
  type CampaignOfficial,
  type CampaignSnapshot,
  type FilingEvent,
  type WatchContribution,
  type YearBreakdown,
} from '../lib/campaign-finance'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

function dateOnly(value: string | null): string | null {
  return value ? value.slice(0, 10) : null
}

function daysToElection(nextElection: string | null): number | null {
  if (!nextElection) return null
  const ms = new Date(`${nextElection}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// "2026" / "2025" / "Prior" — the two most recent years on their own, everything else lumped.
function yearBucket(electionYear: string, endYear: number): string {
  const y = Number(electionYear)
  if (y === endYear) return String(endYear)
  if (y === endYear - 1) return String(endYear - 1)
  return 'Prior'
}

function groupFilingsByBucket(filings: FilingEvent[], endYear: number): { bucket: string; filings: FilingEvent[] }[] {
  const buckets = [String(endYear), String(endYear - 1), 'Prior']
  return buckets
    .map((bucket) => ({
      bucket,
      filings: filings
        .filter((f) => yearBucket(f.electionYear, endYear) === bucket)
        .sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? '')),
    }))
    .filter((g) => g.filings.length > 0)
}

export default function CampaignFinance({
  officials,
  startYear,
  endYear,
}: {
  officials: CampaignOfficial[]
  startYear: number
  endYear: number
}) {
  const [snapshots, setSnapshots] = useState<Record<string, CampaignSnapshot> | null>(null)
  const [filingsByOfficial, setFilingsByOfficial] = useState<Record<string, FilingEvent[]> | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function refresh() {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const [snapshotResult, filingResult, watchResult] = await Promise.all([
        fetchCampaignSnapshots(officials, startYear, endYear),
        fetchFilingHistory(officials, startYear, endYear),
        fetchAllWatchContributions(officials, startYear, endYear),
      ])
      for (const name of Object.keys(snapshotResult)) {
        snapshotResult[name].petrocelliContributions = watchResult.petrocelli[name] ?? []
        snapshotResult[name].scottPointeContributions = watchResult.scottPointe[name] ?? []
        snapshotResult[name].candidateFamilyContributions = watchResult.candidateFamily[name] ?? []
      }
      setSnapshots(snapshotResult)
      setFilingsByOfficial(filingResult)
      setLastUpdated(new Date())
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={refresh}
          disabled={status === 'loading'}
          style={{
            background: status === 'loading' ? '#93c5fd' : '#4a7297',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 16px',
            fontWeight: 800,
            cursor: status === 'loading' ? 'default' : 'pointer',
          }}
        >
          {status === 'loading' ? 'Updating…' : 'Refresh from NY Open Data'}
        </button>
      </div>

      {status === 'error' && (
        <div style={{ marginBottom: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, fontSize: 13 }}>
          Update failed: {errorMessage}
        </div>
      )}

      {lastUpdated && (
        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 12 }}>Filings last updated: {lastUpdated.toLocaleString()}</div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {officials.filter((o) => o.currentlyServing).map((official) => {
          const live = snapshots?.[official.name]
          const raised = live ? live.raised : official.seedRaised
          const direct = live ? live.directContributions : official.seedDirectContributions
          const transfers = live ? live.transfersIn : official.seedTransfersIn
          const lastReported = dateOnly(live ? live.lastReported : official.seedLastReported)
          const latestYear = live?.latestYear
          const days = daysToElection(official.nextElection)
          const currentCycleRaised = live
            ? live.contributorTypeBreakdown.reduce((sum, t) => sum + t.amount, 0)
            : null
          const perResident = currentCycleRaised != null ? currentCycleRaised / RIVERHEAD_POPULATION_ESTIMATE_2024 : null

          return (
            <article key={official.name} style={{ ...card, borderLeft: `6px solid ${official.currentlyServing ? '#4a7297' : '#6b7280'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {official.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={official.photoUrl}
                      alt={official.name}
                      width={48}
                      height={48}
                      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <strong style={{ fontSize: 16, color: '#284a69' }}>{official.name}</strong>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{official.office}</div>
                  </div>
                </div>
                <span
                  style={{
                    background: official.currentlyServing ? '#eef6ff' : '#f1f5f9',
                    color: official.currentlyServing ? '#4a7297' : '#475569',
                    border: `1px solid ${official.currentlyServing ? '#bcd9f5' : '#e2e8f0'}`,
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 'fit-content',
                  }}
                >
                  {official.currentlyServing ? 'Currently serving' : 'No longer serving'}
                </span>
              </div>

              {official.termStarts && official.termEnds && (
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
                  Term: {official.termStarts} → {official.termEnds}
                  {official.nextElection ? ` · Next election: ${official.nextElection}` : ''}
                </div>
              )}

              {live && (
                <div style={{ marginTop: 12, background: '#eef6ff', border: '1px solid #bcd9f5', borderRadius: 10, padding: 12, fontSize: 13.5, color: '#1e3a5f', lineHeight: 1.5 }}>
                  {buildCandidateSummary(official, live, endYear)}
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12 }}>
                Lifetime totals ({startYear}–{endYear})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                <Stat label="Total raised" value={raised != null ? usd(raised) : 'No data on file'} />
                <Stat label="Direct contributions" value={direct != null ? usd(direct) : '—'} />
                <Stat label="Transfers in" value={transfers != null ? usd(transfers) : '—'} />
                <Stat label="Last reported" value={lastReported ?? '—'} />
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 14 }}>
                {endYear} election cycle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                <Stat
                  label="Days to next election"
                  value={days == null ? '—' : days > 0 ? `${days} day${days === 1 ? '' : 's'}` : days === 0 ? 'Today' : 'Passed'}
                />
                <Stat label="Raised this cycle" value={currentCycleRaised != null ? usd(currentCycleRaised) : '—'} />
                <Stat
                  label="Avg. donation / donor"
                  value={live && live.avgDonationPerDonor != null ? `${usd(live.avgDonationPerDonor)} (${live.donorCount} donors)` : '—'}
                />
                <Stat label="Raised / resident" value={perResident != null ? `$${perResident.toFixed(2)}` : '—'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
                <Stat label="Loans received (all-time)" value={live?.loanAmount ? usd(live.loanAmount) : 'None on file'} />
                <Stat
                  label="Currently outstanding"
                  value={
                    live?.outstandingLoanAmount
                      ? `${usd(live.outstandingLoanAmount)}${live.outstandingLoanYear ? ` (${live.outstandingLoanYear})` : ''}`
                      : 'None on file'
                  }
                />
              </div>

              {live && live.contributorTypeBreakdown.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#284a69', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                    Who&rsquo;s giving
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {live.contributorTypeBreakdown.map((bucket) => (
                      <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155' }}>
                        <span>
                          {bucket.type} ({bucket.donorCount})
                        </span>
                        <strong style={{ color: '#284a69' }}>{usd(bucket.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {live && live.historicalByYear.length > 0 && <YearBreakdownList years={live.historicalByYear} />}

              <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#284a69', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {endYear} filing activity
                </div>
                {latestYear ? (
                  <div style={{ color: '#166534', fontSize: 13, marginTop: 4 }}>
                    {usd(latestYear.filingAmount)} across {latestYear.rowCount} row(s), schedules {latestYear.schedules || 'none'}
                    {latestYear.lastReported ? ` · latest ${dateOnly(latestYear.lastReported)}` : ''}
                  </div>
                ) : snapshots ? (
                  <div style={{ color: '#92400e', fontSize: 13, marginTop: 4 }}>No {endYear} filings found yet for this committee.</div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                    Tap &ldquo;Refresh from NY Open Data&rdquo; to check {endYear} activity.
                  </div>
                )}
              </div>

              <CampaignFilingsList filings={filingsByOfficial?.[official.name] ?? null} endYear={endYear} hasFetched={!!filingsByOfficial} />

              <PetroCelliWatch
                contributions={live?.petrocelliContributions ?? null}
                hasFetched={!!snapshots}
                currentlyServing={official.currentlyServing}
                endYear={endYear}
              />
              <ScottPointeWatch
                contributions={live?.scottPointeContributions ?? null}
                hasFetched={!!snapshots}
                currentlyServing={official.currentlyServing}
                endYear={endYear}
              />
              <CandidateFamilyWatch
                contributions={live?.candidateFamilyContributions ?? null}
                hasFetched={!!snapshots}
                currentlyServing={official.currentlyServing}
                endYear={endYear}
              />

              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 10 }}>{official.note}</div>
            </article>
          )
        })}

        {officials.some((o) => !o.currentlyServing) && (
          <FormerOfficialsSection officials={officials} snapshots={snapshots} filingsByOfficial={filingsByOfficial} startYear={startYear} endYear={endYear} />
        )}
      </div>
    </div>
  )
}

function FormerOfficialsSection({
  officials,
  snapshots,
  filingsByOfficial,
  startYear,
  endYear,
}: {
  officials: CampaignOfficial[]
  snapshots: Record<string, CampaignSnapshot> | null
  filingsByOfficial: Record<string, FilingEvent[]> | null
  startYear: number
  endYear: number
}) {
  const [open, setOpen] = useState(false)
  const former = officials.filter((o) => !o.currentlyServing)

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: 14,
          color: '#4a7297',
          padding: '10px 14px',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        Former officials ({former.length})
        <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b', marginLeft: 4 }}>— historical campaign-finance records</span>
      </button>

      {open && (
        <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
          {former.map((official) => {
            const live = snapshots?.[official.name]
            const raised = live ? live.raised : official.seedRaised
            const direct = live ? live.directContributions : official.seedDirectContributions
            const transfers = live ? live.transfersIn : official.seedTransfersIn
            const lastReported = dateOnly(live ? live.lastReported : official.seedLastReported)

            return (
              <article key={official.name} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)', borderLeft: '6px solid #9ca3af' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {official.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={official.photoUrl} alt={official.name} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: 16, color: '#374151' }}>{official.name}</strong>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{official.office}</div>
                    </div>
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800, height: 'fit-content' }}>
                    No longer serving
                  </span>
                </div>

                {live && (
                  <div style={{ marginTop: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                    {buildCandidateSummary(official, live, endYear)}
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12 }}>
                  Lifetime totals ({startYear}–{endYear})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                  <Stat label="Total raised" value={raised != null ? usd(raised) : 'No data on file'} />
                  <Stat label="Direct contributions" value={direct != null ? usd(direct) : '—'} />
                  <Stat label="Transfers in" value={transfers != null ? usd(transfers) : '—'} />
                  <Stat label="Last reported" value={lastReported ?? '—'} />
                </div>

                {live && live.contributorTypeBreakdown.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Who&rsquo;s giving</div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {live.contributorTypeBreakdown.map((bucket) => (
                        <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155' }}>
                          <span>{bucket.type} ({bucket.donorCount})</span>
                          <strong style={{ color: '#374151' }}>{usd(bucket.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {live && live.historicalByYear.length > 0 && <YearBreakdownList years={live.historicalByYear} />}

                <CampaignFilingsList filings={filingsByOfficial?.[official.name] ?? null} endYear={endYear} hasFetched={!!filingsByOfficial} />

                <PetroCelliWatch contributions={live?.petrocelliContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} />
                <ScottPointeWatch contributions={live?.scottPointeContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} />
                <CandidateFamilyWatch contributions={live?.candidateFamilyContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} />

                <div style={{ color: '#6b7280', fontSize: 11, marginTop: 10 }}>{official.note}</div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}


function CampaignFilingsList({ filings, endYear, hasFetched }: { filings: FilingEvent[] | null; endYear: number; hasFetched: boolean }) {
  if (!hasFetched) return null
  if (!filings || filings.length === 0) {
    return (
      <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#284a69', textTransform: 'uppercase', letterSpacing: 0.4 }}>Campaign filings</div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>No filings found for this committee in this range.</div>
      </div>
    )
  }

  const groups = groupFilingsByBucket(filings, endYear)
  const hasMultipleCommittees = new Set(filings.map((f) => f.filerID)).size > 1

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#284a69', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Campaign filings</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.bucket}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4a7297', marginBottom: 4 }}>{g.bucket}</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {g.filings.map((f, i) => (
                <div
                  key={`${f.filerID}-${f.electionYear}-${f.filingDesc}-${f.isAmendment}-${i}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, background: '#f8fafc', borderRadius: 8, padding: '6px 10px', flexWrap: 'wrap' }}
                >
                  <span style={{ color: '#334155' }}>
                    <strong>{f.filingDesc}</strong>
                    <span style={{ color: '#64748b' }}> — {f.category}, {f.isAmendment ? 'Amendment' : 'Original'}, {f.electionType}</span>
                    {hasMultipleCommittees && <span style={{ color: '#6b7280' }}> ({f.committeeName})</span>}
                  </span>
                  <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                    {usd(f.amount)} · {f.transactionCount} row{f.transactionCount === 1 ? '' : 's'}
                    {f.lastActivity ? ` · through ${dateOnly(f.lastActivity)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 6 }}>
        &ldquo;Through&rdquo; is the latest transaction date reported inside that filing, not the date the filing was submitted — the
        bulk data doesn&apos;t carry a submission timestamp, only per-transaction dates (which can be old for a recurring loan
        balance re-reported each period). This list also only shows filings that reported at least one itemized transaction —
        a filing with no reportable activity for that period won&apos;t appear here at all, since the bulk data has no row for it.
      </div>
    </div>
  )
}

function YearBreakdownList({ years }: { years: YearBreakdown[] }) {
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#284a69', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        Direct contributions by year
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {years.map((year) => (
          <details key={year.year} style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
            <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155' }}>
              <span>{year.year}</span>
              <strong style={{ color: '#284a69' }}>{usd(year.raised)}</strong>
            </summary>
            <div style={{ marginTop: 6, paddingLeft: 4, display: 'grid', gap: 3 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {year.donorCount} donor{year.donorCount === 1 ? '' : 's'}
                {year.avgDonationPerDonor != null ? `, avg ${usd(year.avgDonationPerDonor)}` : ''}
              </div>
              {year.typeBreakdown.map((bucket) => (
                <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
                  <span>
                    {bucket.type} ({bucket.donorCount})
                  </span>
                  <span>{usd(bucket.amount)}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Petrocelli Project-Interest Watch
// Mirrors petrocelliDisclosureNote(for:) in CouncilScorecardView.swift.
// ---------------------------------------------------------------------------

const petrocelliScopeNote = (endYear: number, currentlyServing: boolean) =>
  `Scope (2005–${currentlyServing ? endYear : endYear - 1}): this is a corporate/project-interest watch, not candidate immediate-family support. ` +
  'It matches Petrocelli-named donor fields — J Petrocelli Construction, J. Petrocelli Contracting, ' +
  'J. Petrocelli Development Inc, J Petrocelli Wine Cellars LLC, J. Petrocelli Cellars LLC, ' +
  'J. Petrocelli Riverhead Town Square LLC, M. Petrocelli, Marie Petrocelli, Michael Petrocelli, ' +
  'Jennifer Petrocelli — and Hp East End Riverhead LLC, as well as associated venue/entity watch terms ' +
  'from public profiles: Jacqueline Phillips, Alexandra Bussi, The Preston House, Atlantis Banquets, ' +
  'Sea Star Ballroom, Taste the East End, Raphael Vineyard, Long Island Aquarium, Hyatt Place East End. ' +
  'Source basis: Schneps / QNS and Dan\'s Papers profiles. ' +
  'These matches are transparency context, not proof of coordination or quid pro quo.'

function PetroCelliWatch({
  contributions,
  hasFetched,
  currentlyServing,
  endYear,
}: {
  contributions: WatchContribution[] | null
  hasFetched: boolean
  currentlyServing: boolean
  endYear: number
}) {
  if (!hasFetched) return null

  const total = (contributions ?? []).reduce((sum, c) => sum + c.amount, 0)
  const hasHits = contributions !== null && contributions.length > 0
  const clear = contributions !== null && contributions.length === 0

  const borderColor = hasHits ? '#c2700a' : clear ? '#15803d' : '#64748b'
  const bgColor = hasHits ? '#fff7ed' : clear ? '#f0fdf4' : '#f8fafc'

  return (
    <div
      style={{
        marginTop: 14,
        borderTop: '1px solid #e2e8f0',
        paddingTop: 10,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          fontSize: 13,
          color: hasHits ? '#92400e' : clear ? '#14532d' : '#334155',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '⚠️' : clear ? '✅' : '🔍'}</span>
        <span>Petrocelli Project-Interest Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to run the Petrocelli donor watchlist check.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: '#166534' }}>
          No Petrocelli-named individual, related business, Hp East End Riverhead LLC, or known venue/entity donor
          rows were found in NY Open Data for this committee across the 2005–{currentlyServing ? endYear : endYear - 1} filing window.
        </div>
      )}

      {hasHits && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c2700a', marginBottom: 6 }}>
            {usd(total)} matched across {contributions!.length} contribution{contributions!.length === 1 ? '' : 's'}
          </div>

          <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            {contributions!.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  fontSize: 12,
                  background: '#fff',
                  borderRadius: 6,
                  padding: '5px 8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: '#334155', fontWeight: 600 }}>{c.donorName}</span>
                <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                  {usd(c.amount)}
                  {c.date ? ` · ${c.date}` : ''}
                  {c.contributorType ? ` · ${c.contributorType}` : ''}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            {petrocelliScopeNote(endYear, currentlyServing)}
          </div>

          <div
            style={{
              fontSize: 11,
              color: total > 1000 ? '#92400e' : '#475569',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {total > 1000
              ? 'Ethics implication: the matched total exceeds $1,000 — any Petrocelli-related Town matter should be publicly disclosed and reviewed for conflict handling. For elected officials, disclosure is the minimum guardrail; recusal may be appropriate depending on the matter and legal advice.'
              : 'Ethics implication: the matched total is below $1,000, so it does not by itself establish a code violation or automatic recusal requirement. It still warrants transparency if Petrocelli-related business comes before the Town.'}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>
            § 14-114 note: individual contributors are subject to the Suffolk County town-office per-election limit (~{usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)}/election, 2025–26). Corporate entities are generally prohibited from contributing to NY candidates under § 14-116. See{' '}
            <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: '#92400e' }}>elections.ny.gov</a> for current limits.
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scott's Pointe / Island Water Park Project-Interest Watch
// ---------------------------------------------------------------------------

const scottPointeScopeNote = (endYear: number, currentlyServing: boolean) =>
  `Scope (2005–${currentlyServing ? endYear : endYear - 1}): project-interest watch for the Scott's Pointe / Island Water Park development proposal. ` +
  "Matches entity terms (Scott's Pointe, Scotts Pointe, Island Water Park Corp, Island Water Sports, Lake View Grill) " +
  'and named individuals (Eric Scott, Claudia Scott, Cody Scott, Jake Scott, Ken Myers, Grant Anderson) from public filings. ' +
  'These matches are transparency context, not proof of coordination or quid pro quo.'

function ScottPointeWatch({
  contributions,
  hasFetched,
  currentlyServing,
  endYear,
}: {
  contributions: WatchContribution[] | null
  hasFetched: boolean
  currentlyServing: boolean
  endYear: number
}) {
  if (!hasFetched) return null

  const total = (contributions ?? []).reduce((sum, c) => sum + c.amount, 0)
  const hasHits = contributions !== null && contributions.length > 0
  const clear = contributions !== null && contributions.length === 0

  const borderColor = hasHits ? '#6d28d9' : clear ? '#15803d' : '#64748b'
  const bgColor = hasHits ? '#f5f3ff' : clear ? '#f0fdf4' : '#f8fafc'

  return (
    <div
      style={{
        marginTop: 14,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          fontSize: 13,
          color: hasHits ? '#5b21b6' : clear ? '#14532d' : '#334155',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '⚠️' : clear ? '✅' : '🔍'}</span>
        <span>Scott&rsquo;s Pointe / Island Water Park Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to run the Scott&rsquo;s Pointe donor watchlist check.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: '#166534' }}>
          No Scott&rsquo;s Pointe entities, Island Water Park Corp, or known individual donors (Eric, Claudia, Cody, Jake Scott; Ken Myers; Grant Anderson)
          were found in NY Open Data for this committee across the 2005–{currentlyServing ? endYear : endYear - 1} filing window.
        </div>
      )}

      {hasHits && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6', marginBottom: 6 }}>
            {usd(total)} matched across {contributions!.length} contribution{contributions!.length === 1 ? '' : 's'}
          </div>

          <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            {contributions!.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: '#fff', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
              >
                <span style={{ color: '#334155', fontWeight: 600 }}>{c.donorName}</span>
                <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                  {usd(c.amount)}
                  {c.date ? ` · ${c.date}` : ''}
                  {c.contributorType ? ` · ${c.contributorType}` : ''}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, lineHeight: 1.5 }}>{scottPointeScopeNote(endYear, currentlyServing)}</div>

          <div style={{ fontSize: 11, color: total > 1000 ? '#5b21b6' : '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>
            {total > 1000
              ? "Ethics implication: the matched total exceeds $1,000 — any Scott's Pointe or Island Water Park matter should be publicly disclosed and reviewed for conflict handling."
              : "Ethics implication: the matched total is below $1,000, but any pending Scott's Pointe or Island Water Park matter still warrants transparency disclosures."}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>
            § 14-114 note: individual contributors are subject to the Suffolk County town-office per-election limit (~{usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)}/election, 2025–26). Corporate entities are generally prohibited from contributing to NY candidates under § 14-116. See{' '}
            <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: '#5b21b6' }}>elections.ny.gov</a> for current limits.
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Candidate & Family Financing Watch
// ---------------------------------------------------------------------------

const candidateFamilyScopeNote = (endYear: number, currentlyServing: boolean) =>
  `Scope (2005–${currentlyServing ? endYear : endYear - 1}): candidate self-funding and known immediate-family financing watch. ` +
  'Matches contributor type fields ("Candidate/Candidate Spouse", "Candidate Family Member") plus ' +
  'known family names from public records: Halpin family (Dennis, Chloe, Patrick, Kristen Halpin); ' +
  'Rothwell family (Werner Rothwell, Alexander Rothwell — each reported $2,500 outstanding Schedule N loans). ' +
  'Candidate self-loans and family contributions are legal under NY Election Law but relevant to understanding who finances a committee. ' +
  'These matches are disclosure context, not proof of wrongdoing.'

// NY Election Law § 14-114(1): per-contributor per-election limit for town offices in Suffolk County
// (population ~1.6M; biennial CPI-adjusted; primary and general elections count separately).
// Source: NY BOE contribution limits chart, 2025-26 cycle — verify at elections.ny.gov/laws-regulations/contribution-limits.
const SUFFOLK_TOWN_LIMIT_PER_ELECTION = 4700

type DonorElectionGroup = { donor: string; year: string; total: number; rows: WatchContribution[] }

function groupByDonorAndYear(contributions: WatchContribution[]): DonorElectionGroup[] {
  const map = new Map<string, DonorElectionGroup>()
  for (const c of contributions) {
    const year = c.electionYear ?? c.date?.slice(0, 4) ?? 'Unknown'
    const key = `${c.donorName}||${year}`
    const g = map.get(key)
    if (g) { g.total += c.amount; g.rows.push(c) }
    else map.set(key, { donor: c.donorName, year, total: c.amount, rows: [c] })
  }
  return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year) || b.total - a.total)
}

function CandidateFamilyWatch({
  contributions,
  hasFetched,
  currentlyServing,
  endYear,
}: {
  contributions: WatchContribution[] | null
  hasFetched: boolean
  currentlyServing: boolean
  endYear: number
}) {
  if (!hasFetched) return null

  const total = (contributions ?? []).reduce((sum, c) => sum + c.amount, 0)
  const hasHits = contributions !== null && contributions.length > 0
  const clear = contributions !== null && contributions.length === 0

  const borderColor = hasHits ? '#0369a1' : clear ? '#15803d' : '#64748b'
  const bgColor = hasHits ? '#f0f9ff' : clear ? '#f0fdf4' : '#f8fafc'

  const groups = hasHits ? groupByDonorAndYear(contributions!) : []

  return (
    <div
      style={{
        marginTop: 14,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          fontSize: 13,
          color: hasHits ? '#0c4a6e' : clear ? '#14532d' : '#334155',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '💰' : clear ? '✅' : '🔍'}</span>
        <span>Candidate &amp; Family Financing Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to check for candidate and family financing activity.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: '#166534' }}>
          No candidate self-funding or known immediate-family donor rows were found in NY Open Data for this committee across the 2005–{currentlyServing ? endYear : endYear - 1} filing window.
        </div>
      )}

      {hasHits && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e', marginBottom: 8 }}>
            {usd(total)} matched across {contributions!.length} contribution{contributions!.length === 1 ? '' : 's'}
          </div>

          {/* Raw contribution rows */}
          <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
            {contributions!.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: '#fff', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
              >
                <span style={{ color: '#334155', fontWeight: 600 }}>{c.donorName}</span>
                <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                  {usd(c.amount)}
                  {c.electionYear ? ` · ${c.electionYear}` : c.date ? ` · ${c.date}` : ''}
                  {c.contributorType ? ` · ${c.contributorType}` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* § 14-114 per-election limit analysis */}
          <div
            style={{
              marginTop: 6,
              padding: '10px 12px',
              background: '#e0f2fe',
              borderRadius: 8,
              border: '1px solid #bae6fd',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0c4a6e', marginBottom: 8 }}>
              § 14-114 Limit Analysis — {usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)}/election per contributor (approx., Suffolk County town office, 2025–26 cycle)
            </div>

            {groups.map(({ donor, year, total: groupTotal }) => {
              const remaining = Math.max(0, SUFFOLK_TOWN_LIMIT_PER_ELECTION - groupTotal)
              const pct = Math.min(100, (groupTotal / SUFFOLK_TOWN_LIMIT_PER_ELECTION) * 100)
              const over = groupTotal > SUFFOLK_TOWN_LIMIT_PER_ELECTION
              const atLimit = !over && remaining === 0
              const barColor = over ? '#b91c1c' : pct >= 80 ? '#b45309' : '#0369a1'
              const labelColor = over ? '#b91c1c' : atLimit ? '#92400e' : '#166534'

              return (
                <div key={`${donor}||${year}`} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#1e3a5f' }}>
                      {donor} <span style={{ fontWeight: 400, color: '#64748b' }}>({year} election)</span>
                    </span>
                    <span style={{ fontWeight: 800, color: labelColor, fontSize: 11 }}>
                      {over ? '⚠ OVER LIMIT' : atLimit ? 'AT LIMIT' : `${usd(remaining)} remaining`}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#bae6fd', borderRadius: 3, margin: '4px 0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#475569' }}>
                    {usd(groupTotal)} of {usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} per-election limit
                    {over && ` — EXCESS: ${usd(groupTotal - SUFFOLK_TOWN_LIMIT_PER_ELECTION)}`}
                  </div>
                </div>
              )
            })}

            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>
              Primary and general elections are separate limits under § 14-114(1). This analysis groups by election year as reported in the filing; it cannot distinguish primary vs. general election
              within the same year without per-transaction filing-type data. Verify current limits at{' '}
              <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1' }}>
                elections.ny.gov
              </a>.
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, marginBottom: 4, lineHeight: 1.5 }}>{candidateFamilyScopeNote(endYear, currentlyServing)}</div>

          <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>
            Candidate self-loans and family gifts are lawful under NY Election Law. This watch surfaces them for
            transparency — voters and journalists can weigh whether personal and family resources are substituting for broader donor support.
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: '#284a69' }}>{value}</div>
    </div>
  )
}
