'use client'

import { useState } from 'react'
import {
  buildCandidateSummary,
  fetchCampaignSnapshots,
  fetchFilingHistory,
  RIVERHEAD_POPULATION_ESTIMATE_2024,
  type CampaignOfficial,
  type CampaignSnapshot,
  type FilingEvent,
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
      const [snapshotResult, filingResult] = await Promise.all([
        fetchCampaignSnapshots(officials, startYear, endYear),
        fetchFilingHistory(officials, startYear, endYear),
      ])
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
        {officials.map((official) => {
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

              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 10 }}>{official.note}</div>
            </article>
          )
        })}
      </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: '#284a69' }}>{value}</div>
    </div>
  )
}
