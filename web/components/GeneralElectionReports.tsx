// The reports committees file around the November 3, 2026 General Election:
// the 32-Day and 11-Day Pre-General and the 27-Day Post-General. Shown from the
// stored copy (etl/build_campaign_reports.py) until Refresh replaces it with the
// same rows fetched live.

import {
  GENERAL_2026,
  GENERAL_2026_REPORTS,
  summarizeElectionReports,
  type CampaignOfficial,
  type ElectionReportRow,
} from '../lib/campaign-finance'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const cell = { padding: '7px 10px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.45 } as const

export default function GeneralElectionReports({
  officials,
  rows,
  asOf,
  liveAt,
}: {
  officials: CampaignOfficial[]
  rows: ElectionReportRow[]
  /** The day the rows were fetched, as an ISO date. */
  asOf: string
  /** When Refresh fetched them, for display; absent for the stored copy. */
  liveAt?: string
}) {
  const summaries = summarizeElectionReports(rows, officials)
  const onBallot = officials.filter((o) => o.nextElection === GENERAL_2026.date)

  return (
    <section
      id="general-2026-reports"
      aria-labelledby="general-2026-reports-h"
      style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, marginBottom: 14, scrollMarginTop: 20 }}
    >
      <h3 id="general-2026-reports-h" style={{ margin: 0, fontSize: 18, color: 'var(--rbl-title)' }}>
        2026 General Election reports (November 3, 2026)
      </h3>
      <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, maxWidth: '75ch' }}>
        Committees in a general election file three reports with the State: 32 days and 11 days before the election, and 27 days after.
        On the ballot from this page: {onBallot.map((o) => o.name).join(' and ')}. The two town party committees are shown too.
        {liveAt ? ` Fetched live from data.ny.gov ${liveAt}.` : ` Stored copy from data.ny.gov, ${longDate(asOf)}; Refresh fetches it live.`}
      </p>

      {GENERAL_2026_REPORTS.map((report) => {
        const filed = summaries.filter((s) => s.report === report.name)
        return (
          <div key={report.name} style={{ marginTop: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15.5, color: 'var(--rbl-title)' }}>
              {report.name} report
              {report.alsoListedAs && <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> (may be listed as &ldquo;{report.alsoListedAs}&rdquo;)</span>}
            </h4>
            <div style={{ fontSize: 13, color: 'var(--rbl-text-muted)', marginTop: 2 }}>
              Covers activity through {longDate(report.periodEnds)}; due {longDate(report.due)}.
            </div>
            {filed.length === 0 ? (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--rbl-text-body)' }}>
                {report.due > asOf
                  ? `Not due yet as of ${longDate(asOf)}.`
                  : 'No itemized transactions in the State’s data yet for these committees. A report with nothing to itemize has no rows there.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <caption style={{ textAlign: 'left', fontSize: 12.5, color: 'var(--rbl-text-muted)', padding: '0 0 4px' }}>
                    Itemized totals in the {report.name} report, by committee
                  </caption>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
                      {['Committee', 'Contributions', 'Transfers in', 'Other in', 'Spent', 'Transfers out', 'Owed', 'Latest transaction'].map((h) => (
                        <th key={h} scope="col" style={{ ...cell, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filed.map((s) => (
                      <tr key={s.filerID} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                        <td data-label="Committee" className="rbl-stack-prose" style={{ ...cell, fontWeight: 600 }}>
                          <span>
                            {s.committeeName}
                            {s.candidate && s.candidate !== s.committeeName && <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> · {s.candidate}</span>}
                            {s.amended && <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> · amended</span>}
                          </span>
                        </td>
                        <td data-label="Contributions" style={cell}><span>{usd(s.contributions)}</span></td>
                        <td data-label="Transfers in" style={cell}><span>{usd(s.transfersIn)}</span></td>
                        <td data-label="Other in" style={cell}><span>{usd(s.otherIn)}</span></td>
                        <td data-label="Spent" style={cell}><span>{usd(s.spent)}</span></td>
                        <td data-label="Transfers out" style={cell}><span>{usd(s.transfersOut)}</span></td>
                        <td data-label="Owed" style={cell}><span>{s.owed ? usd(s.owed) : '—'}</span></td>
                        <td data-label="Latest transaction" style={cell}><span>{s.through ? longDate(s.through) : '—'} ({s.transactions} item{s.transactions === 1 ? '' : 's'})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--rbl-text-muted)', lineHeight: 1.55, maxWidth: '80ch' }}>
        Contributions are Schedules A to C; transfers in, G; other in, D, E, I and L (in-kind gifts, other receipts, loans and refunds); spent, F; transfers out, H.
        Owed is Schedule N, the outstanding loans and bills each report repeats, so it is a balance, not new money.
        The State&apos;s open data holds itemized transactions only: unitemized contributions are not in these totals, and a committee missing from a report may have filed it with nothing to itemize.
        Contributions or loans over $1,000 received after October 19 and before the election are reported separately within 24 hours (Election Law §14-108) and are not in these reports.
        Source: <a href="https://data.ny.gov/Transparency/Campaign-Finance-Disclosure-Reports-Data-Beginning/e9ss-239a" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Campaign Finance Disclosure Reports Data, data.ny.gov</a>.
      </p>
    </section>
  )
}
