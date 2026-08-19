'use client'

import { useState } from 'react'
import {
  buildCandidateSummary,
  CANDIDATE_SELF_NAMES,
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
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

function dateOnly(value: string | null): string | null {
  return value ? value.slice(0, 10) : null
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
            background: status === 'loading' ? '#93c5fd' : 'var(--rbl-fill-accent)',
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
        <div style={{ marginBottom: 12, color: 'var(--rbl-danger)', background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: 10, fontSize: 13 }}>
          Update failed: {errorMessage}
        </div>
      )}

      {lastUpdated && (
        <div style={{ marginBottom: 12, color: 'var(--rbl-text-muted)', fontSize: 12 }}>Filings last updated: {lastUpdated.toLocaleString()}</div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {officials.filter((o) => o.currentlyServing && !o.isPartyCommittee).map((official) => {
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
            <article key={official.name} style={{ ...card, borderLeft: `6px solid ${official.currentlyServing ? 'var(--rbl-accent-border)' : 'var(--rbl-text-muted)'}` }}>
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
                    <strong style={{ fontSize: 16, color: 'var(--rbl-title)' }}>{official.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{official.office}</div>
                  </div>
                </div>
                <span
                  style={{
                    background: official.currentlyServing ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-3)',
                    color: official.currentlyServing ? 'var(--rbl-accent)' : 'var(--rbl-text-body)',
                    border: `1px solid ${official.currentlyServing ? 'var(--rbl-info-border)' : 'var(--rbl-border-subtle)'}`,
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

              {/* Term, next election & salary */}
              {(official.termStarts || official.salary) && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 13, color: 'var(--rbl-text-body)', lineHeight: 1.5 }}>
                  {official.termYears && (
                    <span style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>
                      {official.termYears}-year term
                    </span>
                  )}
                  {official.termStarts && official.termEnds && (
                    <span>
                      {fmtDate(official.termStarts)} – {fmtDate(official.termEnds)}
                    </span>
                  )}
                  {official.nextElection && (
                    <span>
                      Next election: <strong>{fmtDate(official.nextElection)}</strong>
                      {days != null && days > 0 ? ` (${days} day${days === 1 ? '' : 's'})` : days === 0 ? ' (today)' : ''}
                    </span>
                  )}
                  {official.salary != null && (
                    <span>
                      Salary: <strong>{usd(official.salary)}/yr</strong>
                      {official.salaryNote && (
                        <span style={{ color: 'var(--rbl-text-muted)', fontStyle: 'italic', marginLeft: 4 }}>— {official.salaryNote}</span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {live && (
                <div style={{ marginTop: 12, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: 12, fontSize: 13.5, color: 'var(--rbl-title)', lineHeight: 1.5 }}>
                  {buildCandidateSummary(official, live, endYear)}
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rbl-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12 }}>
                Lifetime totals ({startYear}–{endYear})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                <Stat label="Total raised" value={raised != null ? usd(raised) : 'No data on file'} />
                <Stat label="Direct contributions" value={direct != null ? usd(direct) : '—'} />
                <Stat label="Transfers in" value={transfers != null ? usd(transfers) : '—'} />
                <Stat label="Last reported" value={lastReported ?? '—'} />
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rbl-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 14 }}>
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
                <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-title)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                    Who&rsquo;s giving
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {live.contributorTypeBreakdown.map((bucket) => (
                      <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rbl-text-strong)' }}>
                        <span>
                          {bucket.type} ({bucket.donorCount})
                        </span>
                        <strong style={{ color: 'var(--rbl-title)' }}>{usd(bucket.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {live && live.historicalByYear.length > 0 && <YearBreakdownList years={live.historicalByYear} />}

              <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-title)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {endYear} filing activity
                </div>
                {latestYear ? (
                  <div style={{ color: 'var(--rbl-success-strong)', fontSize: 13, marginTop: 4 }}>
                    {usd(latestYear.filingAmount)} across {latestYear.rowCount} row(s), schedules {latestYear.schedules || 'none'}
                    {latestYear.lastReported ? ` · latest ${dateOnly(latestYear.lastReported)}` : ''}
                  </div>
                ) : snapshots ? (
                  <div style={{ color: 'var(--rbl-warn)', fontSize: 13, marginTop: 4 }}>No {endYear} filings found yet for this committee.</div>
                ) : (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 4 }}>
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
              {!official.isPartyCommittee && (
                <CandidateFamilyWatch
                  contributions={live?.candidateFamilyContributions ?? null}
                  hasFetched={!!snapshots}
                  currentlyServing={official.currentlyServing}
                  endYear={endYear}
                  selfNames={CANDIDATE_SELF_NAMES[official.name] ?? []}
                />
              )}

              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, marginTop: 10 }}>{official.note}</div>
            </article>
          )
        })}

        {officials.some((o) => o.isPartyCommittee) && (
          <PartyCommitteesSection officials={officials} snapshots={snapshots} filingsByOfficial={filingsByOfficial} startYear={startYear} endYear={endYear} />
        )}

        {officials.some((o) => !o.currentlyServing) && (
          <FormerOfficialsSection officials={officials} snapshots={snapshots} filingsByOfficial={filingsByOfficial} startYear={startYear} endYear={endYear} />
        )}
      </div>
    </div>
  )
}

function PartyCommitteesSection({
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
  const committees = officials.filter((o) => o.isPartyCommittee)

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: 14,
          color: 'var(--rbl-accent)',
          padding: '10px 14px',
          background: 'var(--rbl-surface-3)',
          border: '1px solid var(--rbl-border-subtle)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        Party committees ({committees.length})
        <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--rbl-text-muted)', marginLeft: 4 }}>— Republican &amp; Democratic funding records</span>
      </button>

      {open && (
        <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>

          {/* Contribution rules for constituted committees */}
          <div style={{ background: '#f5f3ff', border: '1px solid var(--rbl-violet-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-violet-strong)', marginBottom: 8 }}>
              Constituted Committee Contribution Rules (2026)
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              <div style={{ fontSize: 11, color: 'var(--rbl-violet-strong)', lineHeight: 1.5 }}>
                <strong>Individual:</strong> Up to $117,300 per calendar year to any constituted committee.
              </div>
              <div style={{ fontSize: 11, color: 'var(--rbl-violet-strong)', lineHeight: 1.5 }}>
                <strong>Corporate:</strong> Corporations face a separate $5,000 aggregate limit per calendar year across <em>all</em> NY political contributions statewide — this does not override individual per-committee limits.
              </div>
              <div style={{ fontSize: 11, color: 'var(--rbl-violet-strong)', lineHeight: 1.5 }}>
                <strong>Housekeeping:</strong> No contribution limits for funds designated toward housekeeping expenses. Only constituted committees may maintain a housekeeping fund for headquarters upkeep.
              </div>
              <div style={{ fontSize: 10, color: 'var(--rbl-violet)', marginTop: 2, fontStyle: 'italic', lineHeight: 1.4 }}>
                Source: Suffolk County BOE 2026 Comprehensive Limits Report; NCSL 2025–26 State Limits on Contributions to Candidates. Note: corporations may also contribute to candidate committees subject to the same per-candidate limits as individuals, but face a $5,000 statewide aggregate cap across all NY political contributions per calendar year under § 14-116.
              </div>
            </div>
          </div>

          {committees.map((official) => {
            const live = snapshots?.[official.name]
            const raised = live ? live.raised : official.seedRaised
            const direct = live ? live.directContributions : official.seedDirectContributions
            const transfers = live ? live.transfersIn : official.seedTransfersIn
            const lastReported = dateOnly(live ? live.lastReported : official.seedLastReported)

            return (
              <article key={official.name} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)', borderLeft: '6px solid #7c6fa0' }}>
                <div>
                  <strong style={{ fontSize: 16, color: 'var(--rbl-text-body)' }}>{official.name}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{official.office}</div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rbl-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12 }}>
                  Lifetime totals ({startYear}–{endYear})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                  <Stat label="Total raised" value={raised != null ? usd(raised) : 'No data on file'} />
                  <Stat label="Direct contributions" value={direct != null ? usd(direct) : '—'} />
                  <Stat label="Transfers in" value={transfers != null ? usd(transfers) : '—'} />
                  <Stat label="Last reported" value={lastReported ?? '—'} />
                </div>

                <CampaignFilingsList filings={filingsByOfficial?.[official.name] ?? null} endYear={endYear} hasFetched={!!filingsByOfficial} />

                <PetroCelliWatch contributions={live?.petrocelliContributions ?? null} hasFetched={!!snapshots} currentlyServing={true} endYear={endYear} />
                <ScottPointeWatch contributions={live?.scottPointeContributions ?? null} hasFetched={!!snapshots} currentlyServing={true} endYear={endYear} />

                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, marginTop: 10 }}>{official.note}</div>
              </article>
            )
          })}
        </div>
      )}
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
          color: 'var(--rbl-accent)',
          padding: '10px 14px',
          background: 'var(--rbl-surface-3)',
          border: '1px solid var(--rbl-border-subtle)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        Former officials ({former.length})
        <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--rbl-text-muted)', marginLeft: 4 }}>— historical campaign-finance records</span>
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
              <article key={official.name} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)', borderLeft: '6px solid #9ca3af' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {official.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={official.photoUrl} alt={official.name} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: 16, color: 'var(--rbl-text-body)' }}>{official.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{official.office}</div>
                    </div>
                  </div>
                  <span style={{ background: 'var(--rbl-surface-3)', color: 'var(--rbl-text-body)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800, height: 'fit-content' }}>
                    No longer serving
                  </span>
                </div>

                {live && (
                  <div style={{ marginTop: 12, background: 'var(--rbl-surface-3)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 12, fontSize: 13.5, color: 'var(--rbl-text-body)', lineHeight: 1.5 }}>
                    {buildCandidateSummary(official, live, endYear)}
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rbl-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12 }}>
                  Lifetime totals ({startYear}–{endYear})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 6 }}>
                  <Stat label="Total raised" value={raised != null ? usd(raised) : 'No data on file'} />
                  <Stat label="Direct contributions" value={direct != null ? usd(direct) : '—'} />
                  <Stat label="Transfers in" value={transfers != null ? usd(transfers) : '—'} />
                  <Stat label="Last reported" value={lastReported ?? '—'} />
                </div>

                {live && live.contributorTypeBreakdown.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-text-body)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Who&rsquo;s giving</div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {live.contributorTypeBreakdown.map((bucket) => (
                        <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rbl-text-strong)' }}>
                          <span>{bucket.type} ({bucket.donorCount})</span>
                          <strong style={{ color: 'var(--rbl-text-body)' }}>{usd(bucket.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {live && live.historicalByYear.length > 0 && <YearBreakdownList years={live.historicalByYear} />}

                <CampaignFilingsList filings={filingsByOfficial?.[official.name] ?? null} endYear={endYear} hasFetched={!!filingsByOfficial} />

                <PetroCelliWatch contributions={live?.petrocelliContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} />
                <ScottPointeWatch contributions={live?.scottPointeContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} />
                <CandidateFamilyWatch contributions={live?.candidateFamilyContributions ?? null} hasFetched={!!snapshots} currentlyServing={false} endYear={endYear} selfNames={CANDIDATE_SELF_NAMES[official.name] ?? []} />

                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, marginTop: 10 }}>{official.note}</div>
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
      <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-title)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Campaign filings</div>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 4 }}>No filings found for this committee in this range.</div>
      </div>
    )
  }

  const groups = groupFilingsByBucket(filings, endYear)
  const hasMultipleCommittees = new Set(filings.map((f) => f.filerID)).size > 1

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-title)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Campaign filings</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.bucket}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-accent)', marginBottom: 4 }}>{g.bucket}</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {g.filings.map((f, i) => (
                <div
                  key={`${f.filerID}-${f.electionYear}-${f.filingDesc}-${f.isAmendment}-${i}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, background: 'var(--rbl-surface-2)', borderRadius: 8, padding: '6px 10px', flexWrap: 'wrap' }}
                >
                  <span style={{ color: 'var(--rbl-text-strong)' }}>
                    <strong>{f.filingDesc}</strong>
                    <span style={{ color: 'var(--rbl-text-muted)' }}> — {f.category}, {f.isAmendment ? 'Amendment' : 'Original'}, {f.electionType}</span>
                    {hasMultipleCommittees && <span style={{ color: 'var(--rbl-text-muted)' }}> ({f.committeeName})</span>}
                  </span>
                  <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
                    {usd(f.amount)} · {f.transactionCount} row{f.transactionCount === 1 ? '' : 's'}
                    {f.lastActivity ? ` · through ${dateOnly(f.lastActivity)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, marginTop: 6 }}>
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
    <div style={{ marginTop: 12, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-title)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        Direct contributions by year
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {years.map((year) => (
          <details key={year.year} style={{ background: 'var(--rbl-surface-2)', borderRadius: 8, padding: '6px 10px' }}>
            <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rbl-text-strong)' }}>
              <span>{year.year}</span>
              <strong style={{ color: 'var(--rbl-title)' }}>{usd(year.raised)}</strong>
            </summary>
            <div style={{ marginTop: 6, paddingLeft: 4, display: 'grid', gap: 3 }}>
              <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)' }}>
                {year.donorCount} donor{year.donorCount === 1 ? '' : 's'}
                {year.avgDonationPerDonor != null ? `, avg ${usd(year.avgDonationPerDonor)}` : ''}
              </div>
              {year.typeBreakdown.map((bucket) => (
                <div key={bucket.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--rbl-text-body)' }}>
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
  'It matches any donor field containing "Petrocelli" — covering J. Petrocelli Development Associates, ' +
  'J. Petrocelli Contracting, J. Petrocelli Construction, J. Petrocelli Development Inc, ' +
  'J. Petrocelli Cellars LLC, J. Petrocelli Wine Cellars LLC, J. Petrocelli Riverhead Town Square LLC, ' +
  'M. Petrocelli, Marie Petrocelli, Michael Petrocelli, Jennifer Petrocelli, and other variants. ' +
  'Also matches HP East End Riverhead LLC / H.P. East End Riverhead LLC — the operating entity for the ' +
  'Hyatt Place Long Island / East End hotel at 451 East Main Street, Riverhead, developed by J. Petrocelli. ' +
  'Additional venue/entity watch terms from public profiles: Jacqueline Phillips, Alexandra Bussi, ' +
  'The Preston House, Atlantis Banquets, Sea Star Ballroom, Taste the East End, Raphael Vineyard, ' +
  'Long Island Aquarium (also constructed by J. Petrocelli Contracting), ' +
  'Hyatt Place Long Island / East End, Hyatt Place East End. ' +
  'Source basis: Schneps / QNS and Dan\'s Papers profiles. ' +
  'These matches are transparency context, not proof of coordination or quid pro quo.'

// ---------------------------------------------------------------------------
// § 113-4(B)(1)(f) Ethics Analysis Panel — reused by both project-interest watches
// ---------------------------------------------------------------------------

function EthicsAnalysisPanel({
  contributions,
  accentColor,
  watchLabel,
}: {
  contributions: WatchContribution[]
  accentColor: string
  watchLabel: string
}) {
  const groups = groupByDonorAndYear(contributions)
  const flagged = groups.filter((g) => g.total > 1000)
  const approaching = groups.filter((g) => g.total > 800 && g.total <= 1000)
  const allClear = flagged.length === 0 && approaching.length === 0

  // Combined exposure: all contributions in this watch summed together.
  // Fires when no single entity/person hit $1,000 individually but the
  // total across multiple entities exceeds $1,000 — e.g. two Petrocelli
  // LLCs each giving $600 would not trigger per-entity flagging but the
  // combined relationship still warrants voluntary disclosure.
  const combinedTotal = contributions.reduce((s, c) => s + c.amount, 0)
  const showCombinedWarning = flagged.length === 0 && groups.length > 1 && combinedTotal > 1000

  return (
    <div
      style={{
        marginTop: 8,
        padding: '10px 12px',
        background: flagged.length > 0 ? 'var(--rbl-danger-bg)' : approaching.length > 0 ? 'var(--rbl-warn-bg)' : 'var(--rbl-success-bg)',
        borderRadius: 8,
        border: `1px solid ${flagged.length > 0 ? 'var(--rbl-danger-border)' : approaching.length > 0 ? 'var(--rbl-warn-border)' : 'var(--rbl-success-border)'}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: flagged.length > 0 ? 'var(--rbl-danger-strong)' : approaching.length > 0 ? 'var(--rbl-warn)' : 'var(--rbl-success-strong)', marginBottom: 6 }}>
        § 113-4(B)(1)(f) Ethics Analysis — Town of Riverhead Code of Ethics
      </div>

      {allClear && !showCombinedWarning && (
        <div style={{ fontSize: 11, color: 'var(--rbl-success-strong)' }}>
          No donor&rsquo;s combined contributions exceeded $1,000 in any campaign — the aggregate recusal/disclosure threshold of § 113-4(B)(1)(f) is not reached for this watch. Transparency is still appropriate if {watchLabel} matters come before the Town.
        </div>
      )}

      {showCombinedWarning && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--rbl-warn-strong)' }}>
              Combined {watchLabel} entity exposure
            </span>
            <span style={{ fontWeight: 800, color: 'var(--rbl-warn)', fontSize: 11 }}>⚠ COMBINED TOTAL EXCEEDS $1,000</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--rbl-warn-strong)', marginTop: 2, lineHeight: 1.4 }}>
            {usd(combinedTotal)} total across {groups.length} {watchLabel}-linked entities or individuals — no single entity reached the $1,000 per-person threshold of § 113-4(B)(1)(f) individually,
            but the combined relationship with {watchLabel}-associated interests totals {usd(combinedTotal)}.
            Voluntary disclosure of this aggregate relationship is appropriate when any {watchLabel}-related matter comes before the Town.
          </div>
        </div>
      )}

      {flagged.map(({ donor, year, total: groupTotal, rows }) => {
        const maxSingle = Math.max(...rows.map((r) => r.amount))
        const isStructured = rows.length > 1 && maxSingle < 1000
        return (
          <div key={`${donor}||${year}`} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--rbl-danger-strong)' }}>
                {donor} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({year} election)</span>
              </span>
              <span style={{ fontWeight: 800, color: 'var(--rbl-danger)', fontSize: 11 }}>⚠ THRESHOLD EXCEEDED</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--rbl-danger-strong)', marginTop: 2, lineHeight: 1.4 }}>
              {usd(groupTotal)} received in aggregate — exceeds the $1,000 per-campaign limit of § 113-4(B)(1)(f).
              {isStructured && (
                <> Composed of {rows.length} contributions (largest: {usd(maxSingle)}) each individually below $1,000 — the threshold is an <em>in-aggregate</em> limit, so the total triggers disclosure/recusal regardless of per-transaction size.</>
              )}
              {' '}Elected officials must publicly disclose this relationship when any matter involving this donor comes before the Town.
              Recusal is also an option and may be required depending on the nature of the matter and legal advice.
            </div>
          </div>
        )
      })}

      {approaching.map(({ donor, year, total: groupTotal, rows }) => (
        <div key={`${donor}||${year}`} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--rbl-warn-strong)' }}>
              {donor} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({year} election)</span>
            </span>
            <span style={{ fontWeight: 800, color: 'var(--rbl-warn)', fontSize: 11 }}>Approaching $1,000</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--rbl-warn-strong)', marginTop: 2, lineHeight: 1.4 }}>
            {usd(groupTotal)} received{rows.length > 1 ? ` across ${rows.length} contributions` : ''} — below the $1,000 aggregate threshold of § 113-4(B)(1)(f) but close. Any additional contribution in the same campaign would trigger the recusal/disclosure requirement.
          </div>
        </div>
      ))}

      <div style={{ fontSize: 10, color: 'var(--rbl-text-muted)', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic', borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 6 }}>
        § 113-4(B)(1)(f) of the Town of Riverhead Code of Ethics prohibits a Town officer from taking or failing to take any action
        that may benefit a person who contributed more than $1,000 <strong>in aggregate</strong> during their most recent or current campaign —
        unless the officer recuses or (for elected officials) publicly discloses the relationship on the record.
        The threshold is per-campaign aggregate: multiple contributions from the same donor that individually fall below $1,000
        still count toward the total and trigger disclosure/recusal obligations when they collectively exceed $1,000.
        § 113-12 additionally requires land use applications (variance, zoning change, site plan, special exception) to disclose
        any Town officer interest in the applicant. See{' '}
        <a href="https://ecode360.com/29708189" target="_blank" rel="noopener noreferrer" style={{ color: accentColor }}>
          Riverhead Code of Ethics § 113-4
        </a>.
      </div>
    </div>
  )
}

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

  const borderColor = hasHits ? '#c2700a' : clear ? 'var(--rbl-success)' : 'var(--rbl-series-slate)'
  const bgColor = hasHits ? 'var(--rbl-warn-bg)' : clear ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)'

  return (
    <div
      style={{
        marginTop: 14,
        borderTop: '1px solid var(--rbl-border-subtle)',
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
          color: hasHits ? 'var(--rbl-warn)' : clear ? 'var(--rbl-success-strong)' : 'var(--rbl-text-strong)',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '⚠️' : clear ? '✅' : '🔍'}</span>
        <span>Petrocelli Project-Interest Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to run the Petrocelli donor watchlist check.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: 'var(--rbl-success-strong)' }}>
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
                  background: 'var(--rbl-surface)',
                  borderRadius: 6,
                  padding: '5px 8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{c.donorName}</span>
                <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
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
              color: 'var(--rbl-text-muted)',
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            {petrocelliScopeNote(endYear, currentlyServing)}
          </div>

          <EthicsAnalysisPanel contributions={contributions!} accentColor="#92400e" watchLabel="Petrocelli" />
          <div style={{ fontSize: 10, color: 'var(--rbl-text-muted)', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>
            § 14-114 note: individual contributors are subject to the Town of Riverhead per-election limit ({usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} general / {usd(SUFFOLK_TOWN_PRIMARY_LIMIT)} primary, per Suffolk County BOE 2026 Comprehensive Limits Report). Corporations, PACs, and unions face the same per-candidate limits as individuals under § 14-114; corporations are additionally capped at $5,000 statewide aggregate across all NY political contributions per calendar year under § 14-116 (Suffolk County BOE 2026 Comprehensive Limits Report; NCSL 2025–26). See{' '}
            <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)' }}>elections.ny.gov</a> for current limits.
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

  const borderColor = hasHits ? '#6d28d9' : clear ? 'var(--rbl-success)' : 'var(--rbl-series-slate)'
  const bgColor = hasHits ? 'var(--rbl-violet-bg)' : clear ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)'

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
          color: hasHits ? 'var(--rbl-violet-strong)' : clear ? 'var(--rbl-success-strong)' : 'var(--rbl-text-strong)',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '⚠️' : clear ? '✅' : '🔍'}</span>
        <span>Scott&rsquo;s Pointe / Island Water Park Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to run the Scott&rsquo;s Pointe donor watchlist check.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: 'var(--rbl-success-strong)' }}>
          No Scott&rsquo;s Pointe entities, Island Water Park Corp, or known individual donors (Eric, Claudia, Cody, Jake Scott; Ken Myers; Grant Anderson)
          were found in NY Open Data for this committee across the 2005–{currentlyServing ? endYear : endYear - 1} filing window.
        </div>
      )}

      {hasHits && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rbl-violet-strong)', marginBottom: 6 }}>
            {usd(total)} matched across {contributions!.length} contribution{contributions!.length === 1 ? '' : 's'}
          </div>

          <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            {contributions!.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: 'var(--rbl-surface)', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
              >
                <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{c.donorName}</span>
                <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
                  {usd(c.amount)}
                  {c.date ? ` · ${c.date}` : ''}
                  {c.contributorType ? ` · ${c.contributorType}` : ''}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--rbl-text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{scottPointeScopeNote(endYear, currentlyServing)}</div>

          <EthicsAnalysisPanel contributions={contributions!} accentColor="#5b21b6" watchLabel="Scott's Pointe / Island Water Park" />
          <div style={{ fontSize: 10, color: 'var(--rbl-text-muted)', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>
            § 14-114 note: individual contributors are subject to the Town of Riverhead per-election limit ({usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} general / {usd(SUFFOLK_TOWN_PRIMARY_LIMIT)} primary, per Suffolk County BOE 2026 Comprehensive Limits Report). Corporations, PACs, and unions face the same per-candidate limits as individuals under § 14-114; corporations are additionally capped at $5,000 statewide aggregate across all NY political contributions per calendar year under § 14-116 (Suffolk County BOE 2026 Comprehensive Limits Report; NCSL 2025–26). See{' '}
            <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-violet-strong)' }}>elections.ny.gov</a> for current limits.
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
  `Scope (2005–${currentlyServing ? endYear : endYear - 1}): candidate self-funding, known immediate-family financing, cross-campaign committee donations, and business-entity contributors (LLC, partnership, sole proprietorship, association). ` +
  'Matches contributor type fields ("Candidate/Candidate Spouse", "Candidate Family Member", committee-type donors, and business-entity types) ' +
  'plus known family names from public records: Halpin family (Dennis, Chloe, Patrick, Kristen Halpin); ' +
  'Rothwell family (Werner Rothwell, Alexander Rothwell — each reported $2,500 outstanding Schedule N loans; Thomas Rothwell). ' +
  'All contributions shown are legal under NY Election Law but relevant to understanding who finances a committee. ' +
  'These matches are disclosure context, not proof of wrongdoing.'

// NY Election Law § 14-114(1): per-contributor per-election limit for Town of Riverhead.
// Source: Suffolk County BOE "2026 Comprehensive Limits Report", Town of Riverhead row:
//   General election individual: $1,219.30 | All primaries individual: $1,000.00
// These limits are biennial CPI-adjusted; primary and general elections count separately.
const SUFFOLK_TOWN_LIMIT_PER_ELECTION = 1219.30
const SUFFOLK_TOWN_PRIMARY_LIMIT = 1000.00

// NY Election Law § 14-114 family aggregate limit: 1/4 × registered voters in district.
// Source: Suffolk County BOE voter enrollment report, Feb 20, 2026.
// All Riverhead town offices are town-wide races (25,341 total registered).
//   General:          1/4 × 25,341 = $6,335.25
//   Dem primary:      1/4 × 6,914  = $1,728.50
//   Rep primary:      1/4 × 8,919  = $2,229.75
const FAMILY_AGGREGATE_GENERAL = 6335.25
const FAMILY_AGGREGATE_DEM_PRIMARY = 1728.50
const FAMILY_AGGREGATE_REP_PRIMARY = 2229.75

type DonorElectionGroup = { donor: string; year: string; total: number; rows: WatchContribution[] }

// Maps normalized variant names → canonical display name so contributions
// filed under alternate spellings merge into a single ethics-threshold group.
const DONOR_NAME_ALIASES: Record<string, string> = {
  'li builders pac':           'Long Island Builders PAC',
  'long island buiders pac':   'Long Island Builders PAC', // typo in filing
  'long island builders':      'Long Island Builders PAC', // name without PAC suffix
  // Mason Tenders variants
  'mason tender district council of greater ny pac':    'Mason Tenders District Council PAC',
  'mason tenders district council of greater pac':      'Mason Tenders District Council PAC',
  'mason tenders district council of greater ny pac':   'Mason Tenders District Council PAC',
  "mason tender's district council":                    'Mason Tenders District Council PAC',
  // Riverhead PBA variants
  'riverhead pba pac':                         'Riverhead PBA PAC',
  'riverhead pba inc pac':                     'Riverhead PBA PAC',
  'riverhead police benevolent assoc pac':     'Riverhead PBA PAC',
  'riverhead police bene assoc pac':           'Riverhead PBA PAC',
  'riverhead police benevolent assoc':         'Riverhead PBA PAC',
  'riverhead police benevolent ass.':          'Riverhead PBA PAC',
  'riverhed police benevolent assoc pac':      'Riverhead PBA PAC',
  'riverhead pba':                             'Riverhead PBA PAC',
  // Sheet Metal Workers variants
  'sheet metal workers lu 28':   'Sheet Metal Workers LU 28',
  'sheet metal workders lu 28':  'Sheet Metal Workers LU 28', // typo
  'sheet metal  workers lu 28':  'Sheet Metal Workers LU 28', // double space
  // Operating Engineers variants
  'international union of operating engineers':       'IUOE PAC',
  'international union of operation engineers':       'IUOE PAC', // typo
  "int'l union of operating eng local 138 138a pac":  'IUOE PAC',
  // Plumbers Local 200 variants
  'plumbers local union #200':     'Plumbers Local Union #200',
  'plumbers local union#200':      'Plumbers Local Union #200',
  'plumbers local union #200 pac': 'Plumbers Local Union #200',
  'plumbers local union pac':      'Plumbers Local Union #200',
  // NERCC variants
  'nercc political education committee-nys':      'NERCC Political Education Committee',
  'nercc political education committee--nys pac': 'NERCC Political Education Committee',
  // 1199 SEIU variants
  '1199 seiu':                        '1199 SEIU',
  '1199 seiu - nys political action fund': '1199 SEIU',
  // Steamfitters variants
  'ua steamfitters lu #638':      'Steamfitters LU 638',
  'u.a. steamfitters l.u.#638':   'Steamfitters LU 638',
  'steamfitters local union 638': 'Steamfitters LU 638',
  // Suffolk County PBA variants
  'suffolk county pba pac':    'Suffolk County PBA PAC',
  'suffolk count pba pac':     'Suffolk County PBA PAC', // typo
  'suffolk county p.b.a. pac': 'Suffolk County PBA PAC',
  // Suffolk County Corrections variants
  'suffolk county correction officers assoc pac':     'Suffolk County Correction Officers Assoc PAC',
  'suffolk cty correction officers assoc':            'Suffolk County Correction Officers Assoc PAC',
  'suffolk county corrections officers assc':         'Suffolk County Correction Officers Assoc PAC',
  'suffolk county correction officers assoc inc':     'Suffolk County Correction Officers Assoc PAC',
  'suffolk count correction officers assoc pac':      'Suffolk County Correction Officers Assoc PAC',
  // Eleanor Roosevelt Legacy variants
  "eleanor roosevelt legacy committee inc.": 'Eleanor Roosevelt Legacy Committee',
  'eleanor rooevelt legacy':                 'Eleanor Roosevelt Legacy Committee', // typo
  // Building Trades variants
  'building & construction trade - nassau &':           'Building & Construction Trades Council',
  'building & contruction trades council nass & suff':  'Building & Construction Trades Council', // typo
  'building and construction trades':                   'Building & Construction Trades Council',
}

function groupByDonorAndYear(contributions: WatchContribution[]): DonorElectionGroup[] {
  const map = new Map<string, DonorElectionGroup>()
  for (const c of contributions) {
    const year = c.electionYear ?? c.date?.slice(0, 4) ?? 'Unknown'
    const normalized = c.donorName.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ')
    const canonical = DONOR_NAME_ALIASES[normalized]
    const key = `${canonical !== undefined ? canonical.toLowerCase() : normalized}||${year}`
    const g = map.get(key)
    if (g) { g.total += c.amount; g.rows.push(c) }
    else map.set(key, { donor: canonical ?? c.donorName, year, total: c.amount, rows: [c] })
  }
  return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year) || b.total - a.total)
}

function isCommitteeContrib(c: WatchContribution): boolean {
  const type = (c.contributorType ?? '').toLowerCase()
  return type.includes('committee') && !type.includes('party') && !type.includes('county')
}

function isBusinessContrib(c: WatchContribution): boolean {
  const type = (c.contributorType ?? '').toLowerCase()
  if (!type || type.includes('individual') || type.includes('candidate') || type.includes('unitem')) return false
  if (type.includes('committee') || type.includes('party') || type.includes('county') || type.includes('pac')) return false
  // LLC, PLLC, Partnership, Sole Proprietorship, Association, Other
  return type.includes('llc') || type.includes('pllc') || type.includes('partnership') ||
    type.includes('sole') || type === 'association' || type === 'other'
}

function CandidateFamilyWatch({
  contributions,
  hasFetched,
  currentlyServing,
  endYear,
  selfNames = [],
}: {
  contributions: WatchContribution[] | null
  hasFetched: boolean
  currentlyServing: boolean
  endYear: number
  selfNames?: string[]
}) {
  if (!hasFetched) return null

  const total = (contributions ?? []).reduce((sum, c) => sum + c.amount, 0)
  const hasHits = contributions !== null && contributions.length > 0
  const clear = contributions !== null && contributions.length === 0

  const committeeContribs = hasHits ? contributions!.filter(isCommitteeContrib) : []
  const businessContribs  = hasHits ? contributions!.filter((c) => !isCommitteeContrib(c) && isBusinessContrib(c)) : []
  const individualContribs = hasHits ? contributions!.filter((c) => !isCommitteeContrib(c) && !isBusinessContrib(c)) : []

  const borderColor = hasHits ? '#0369a1' : clear ? 'var(--rbl-success)' : 'var(--rbl-series-slate)'
  const bgColor = hasHits ? '#f0f9ff' : clear ? '#f0fdf4' : 'var(--rbl-surface-2)'

  const groupsIndividual = individualContribs.length > 0 ? groupByDonorAndYear(individualContribs) : []

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
          color: hasHits ? 'var(--rbl-info-text)' : clear ? 'var(--rbl-success-strong)' : 'var(--rbl-text-strong)',
          marginBottom: 6,
        }}
      >
        <span>{hasHits ? '💰' : clear ? '✅' : '🔍'}</span>
        <span>Candidate &amp; Family Financing Watch</span>
      </div>

      {contributions === null && (
        <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)' }}>
          Tap &ldquo;Refresh from NY Open Data&rdquo; to check for candidate and family financing activity.
        </div>
      )}

      {clear && (
        <div style={{ fontSize: 12, color: 'var(--rbl-success-strong)' }}>
          No candidate self-funding, known immediate-family donor rows, or PAC/committee contributors were found in NY Open Data for this committee across the 2005–{currentlyServing ? endYear : endYear - 1} filing window.
        </div>
      )}

      {hasHits && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rbl-info-text)', marginBottom: 8 }}>
            {usd(total)} matched across {contributions!.length} contribution{contributions!.length === 1 ? '' : 's'}
          </div>

          {/* PAC & Committee Donors subsection */}
          {committeeContribs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-violet-strong)', marginBottom: 6, borderBottom: '1px solid var(--rbl-violet-border)', paddingBottom: 4 }}>
                PAC &amp; Committee Donors
              </div>
              <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
                {committeeContribs.map((c, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: 'var(--rbl-surface)', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
                  >
                    <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{c.donorName}</span>
                    <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
                      {usd(c.amount)}
                      {c.electionYear ? ` · ${c.electionYear}` : c.date ? ` · ${c.date}` : ''}
                      {c.contributorType ? ` · ${c.contributorType}` : ''}
                    </span>
                  </div>
                ))}
              </div>
              <EthicsAnalysisPanel contributions={committeeContribs} accentColor="#5b21b6" watchLabel="PAC/committee" />
            </div>
          )}

          {/* Business & Corporate Donors subsection */}
          {businessContribs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-warn)', marginBottom: 6, borderBottom: '1px solid var(--rbl-warn-border)', paddingBottom: 4 }}>
                Business &amp; Corporate Donors
              </div>
              <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
                {businessContribs.map((c, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: 'var(--rbl-surface)', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
                  >
                    <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{c.donorName}</span>
                    <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
                      {usd(c.amount)}
                      {c.electionYear ? ` · ${c.electionYear}` : c.date ? ` · ${c.date}` : ''}
                      {c.contributorType ? ` · ${c.contributorType}` : ''}
                    </span>
                  </div>
                ))}
              </div>
              <EthicsAnalysisPanel contributions={businessContribs} accentColor="#92400e" watchLabel="business entity" />
              <div style={{ fontSize: 10, color: 'var(--rbl-warn-strong)', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>
                Corporations, LLCs, and partnerships may contribute to candidate committees subject to the same per-election limit as individuals ({usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} general / {usd(SUFFOLK_TOWN_PRIMARY_LIMIT)} primary). Corporations are additionally capped at $5,000 statewide aggregate across all NY political contributions per calendar year under § 14-116 (Suffolk County BOE 2026 Comprehensive Limits Report).
              </div>
            </div>
          )}

          {/* Self-Funding & Family Donors subsection */}
          {individualContribs.length > 0 && (
            <div>
              {committeeContribs.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-info-text)', marginBottom: 6, borderBottom: '1px solid var(--rbl-sky-border)', paddingBottom: 4, marginTop: 4 }}>
                  Self-Funding &amp; Family Donors
                </div>
              )}
              <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
                {individualContribs.map((c, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: 'var(--rbl-surface)', borderRadius: 6, padding: '5px 8px', flexWrap: 'wrap' }}
                  >
                    <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{c.donorName}</span>
                    <span style={{ color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>
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
                  border: '1px solid var(--rbl-sky-border)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-info-text)', marginBottom: 8 }}>
                  § 14-114 Limit Analysis — {usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} general / {usd(SUFFOLK_TOWN_PRIMARY_LIMIT)} primary per contributor (Town of Riverhead, Suffolk County BOE 2026)
                </div>

                {/* Family aggregate cap — all immediate family combined, per election year */}
                {(() => {
                  const familyGroups = groupsIndividual.filter((g) => !selfNames.some((n) => g.donor.toLowerCase().includes(n)))
                  const byYear = new Map<string, number>()
                  for (const g of familyGroups) byYear.set(g.year, (byYear.get(g.year) ?? 0) + g.total)
                  if (byYear.size === 0) return null
                  return (
                    <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--rbl-sky-border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rbl-title)', marginBottom: 6 }}>
                        Family Aggregate Cap — all immediate family members combined
                      </div>
                      {Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([year, familyTotal]) => {
                        const remaining = Math.max(0, FAMILY_AGGREGATE_GENERAL - familyTotal)
                        const pct = Math.min(100, (familyTotal / FAMILY_AGGREGATE_GENERAL) * 100)
                        const over = familyTotal > FAMILY_AGGREGATE_GENERAL
                        const atLimit = !over && remaining === 0
                        const barColor = over ? 'var(--rbl-danger)' : pct >= 80 ? 'var(--rbl-warn)' : 'var(--rbl-series-violet)'
                        const labelColor = over ? 'var(--rbl-danger)' : atLimit ? '#92400e' : 'var(--rbl-success-strong)'
                        return (
                          <div key={year} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
                              <span style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>
                                All family members <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({year} election)</span>
                              </span>
                              <span style={{ fontWeight: 800, color: labelColor, fontSize: 11 }}>
                                {over ? '⚠ OVER AGGREGATE CAP' : atLimit ? 'AT CAP' : `${usd(remaining)} remaining`}
                              </span>
                            </div>
                            <div style={{ height: 6, background: 'var(--rbl-sky-bg)', borderRadius: 3, margin: '4px 0', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--rbl-text-body)' }}>
                              {usd(familyTotal)} of {usd(FAMILY_AGGREGATE_GENERAL)} general-election family aggregate cap (1/4 × 25,341 registered voters)
                              {over && ` — EXCESS: ${usd(familyTotal - FAMILY_AGGREGATE_GENERAL)}`}
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ fontSize: 10, color: 'var(--rbl-text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                        § 14-114 caps combined immediate-family contributions (child, parent, grandparent, sibling, and their spouses) at 1/4 of total registered voters. Primary limits are lower: DEM {usd(FAMILY_AGGREGATE_DEM_PRIMARY)} / REP {usd(FAMILY_AGGREGATE_REP_PRIMARY)} (Feb 20, 2026 Suffolk County BOE enrollment).
                      </div>
                    </div>
                  )
                })()}

                {groupsIndividual.map(({ donor, year, total: groupTotal }) => {
                  const isSelf = selfNames.some((n) => donor.toLowerCase().includes(n))

                  if (isSelf) {
                    return (
                      <div key={`${donor}||${year}`} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>
                            {donor} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({year} election)</span>
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--rbl-violet)', fontSize: 11 }}>No cap — self-funding</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--rbl-text-body)' }}>
                          {usd(groupTotal)} · Candidate self-funding is unlimited for local town races not in NY&apos;s public financing program.
                        </div>
                      </div>
                    )
                  }

                  const remaining = Math.max(0, SUFFOLK_TOWN_LIMIT_PER_ELECTION - groupTotal)
                  const pct = Math.min(100, (groupTotal / SUFFOLK_TOWN_LIMIT_PER_ELECTION) * 100)
                  const over = groupTotal > SUFFOLK_TOWN_LIMIT_PER_ELECTION
                  const atLimit = !over && remaining === 0
                  const barColor = over ? 'var(--rbl-danger)' : pct >= 80 ? 'var(--rbl-warn)' : 'var(--rbl-accent)'
                  const labelColor = over ? 'var(--rbl-danger)' : atLimit ? '#92400e' : 'var(--rbl-success-strong)'

                  return (
                    <div key={`${donor}||${year}`} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>
                          {donor} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({year} election)</span>
                        </span>
                        <span style={{ fontWeight: 800, color: labelColor, fontSize: 11 }}>
                          {over ? '⚠ OVER LIMIT' : atLimit ? 'AT LIMIT' : `${usd(remaining)} remaining`}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--rbl-sky-bg)', borderRadius: 3, margin: '4px 0', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--rbl-text-body)' }}>
                        {usd(groupTotal)} of {usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)} per-election limit
                        {over && ` — EXCESS: ${usd(groupTotal - SUFFOLK_TOWN_LIMIT_PER_ELECTION)}`}
                      </div>
                    </div>
                  )
                })}

                <div style={{ fontSize: 10, color: 'var(--rbl-text-muted)', marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>
                  Primary and general elections are separate limits under § 14-114(1). This analysis groups by election year as reported in the filing; it cannot distinguish primary vs. general election
                  within the same year. Limits shown are from the Suffolk County BOE 2026 Comprehensive Limits Report (general: {usd(SUFFOLK_TOWN_LIMIT_PER_ELECTION)}, all primaries: {usd(SUFFOLK_TOWN_PRIMARY_LIMIT)}). These are biennial CPI-adjusted; verify the current cycle at{' '}
                  <a href="https://elections.ny.gov/laws-regulations/contribution-limits" target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1' }}>
                    elections.ny.gov
                  </a>.
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--rbl-text-muted)', marginTop: 8, marginBottom: 4, lineHeight: 1.5 }}>{candidateFamilyScopeNote(endYear, currentlyServing)}</div>

          <div style={{ fontSize: 11, color: 'var(--rbl-text-body)', fontStyle: 'italic', lineHeight: 1.5 }}>
            Candidate self-loans, family gifts, and PAC contributions are lawful under NY Election Law. This watch surfaces them for
            transparency — voters and journalists can weigh whether personal, family, or organized interests are a primary funding source.
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 10, padding: 10 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: 'var(--rbl-title)' }}>{value}</div>
    </div>
  )
}
