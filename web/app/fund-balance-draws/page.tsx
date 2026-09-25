import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  documentedDraws, documentedTotal, curatedCommitments, curatedTotal,
  otherTierGeneralFundDraws, otherTierDrawTotal,
  chargedToFundBalanceTotal, chargedToFundBalanceCount,
  budgetedUseByFund, budgetedUseTotal, generalFundBudgetedUse, generalFundUseThisYear,
  townWideBudgetedUse, budgetedUseUnexplained, coverage, limits, sources,
} from '../../lib/fund-balance-draws'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '9px 10px', verticalAlign: 'top' as const }
const num = { ...td, textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontWeight: 800 }

export const metadata = {
  title: 'Where the surplus went — every 2026 resolution that spent fund balance',
  description:
    'Riverhead uses accumulated surplus through two channels: the adopted budget appropriates it up front, and individual Town Board resolutions appropriate more during the year. This page lists every 2026 resolution that charged the Appropriated Fund Balance account, what it funded, and how much of the record it can see.',
}

export default function FundBalanceDrawsPage() {
  return (
    <PageShell
      title="Where the surplus went"
      subtitle="Every 2026 resolution that spent fund balance, what it funded, and how much of it the published record actually shows."
    >
      <PlainCallout
        tips={[
          { label: 'Fund balance', text: 'accumulated surplus — money left over from prior years. It is a balance, not an income stream: spending it is a one-time act that cannot be repeated without rebuilding it first.' },
          { label: 'Appropriated, not spent', text: 'these votes create the authority to spend. Whether the money was then obligated or paid out is a separate question, and not one this site can answer.' },
          { label: 'Object code 9999', text: 'in the New York chart of accounts, appropriated fund balance is recorded as a revenue line. A General Fund draw credits A01-9999 and debits whatever is being bought.' },
        ]}
      >
        The Town uses surplus through <strong>two separate channels</strong>, and only the first appears in the
        budget a resident can read. The 2026 adopted budget planned to use{' '}
        <strong>{usd(generalFundBudgetedUse)}</strong> of General Fund balance. Resolutions adopted during the year
        have charged <strong>{usd(chargedToFundBalanceTotal)}</strong> more to that account.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <Stat label="Budgeted up front" value={usd(generalFundBudgetedUse)} sub="General Fund, 2026 adopted budget" />
        <Stat label="Charged by resolution" value={usd(chargedToFundBalanceTotal)} sub={`${chargedToFundBalanceCount} adopted votes hitting A01-9999`} accent />
        <Stat label="Combined, General Fund" value={usd(generalFundUseThisYear)} sub="see the caveat below" />
        <Stat label="Record coverage" value={`${coverage.accountSharePct.toFixed(0)}%`} sub={`${coverage.resolutionsWithAccounts} of ${coverage.resolutionsWithStatement.toLocaleString()} statements itemise accounts`} warn />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Channel one: the adopted budget</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Each fund may plan to cover part of its appropriations from its own accumulated surplus rather than from
          taxes or fees. That plan is printed in the adopted budget and is the only use of fund balance a resident
          sees before the year begins.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Fund</th><th style={{ ...th, textAlign: 'right' }}>Budgeted use</th><th style={{ ...th, textAlign: 'right' }}>Appropriations</th><th style={{ ...th, textAlign: 'right' }}>Share</th>
            </tr></thead>
            <tbody>
              {budgetedUseByFund.map((r) => (
                <tr key={r.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{r.fund} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>({r.code})</span></td>
                  <td style={num}>{usd(r.budgeted)}</td>
                  <td style={{ ...num, fontWeight: 400 }}>{usd(r.appropriations)}</td>
                  <td style={{ ...num, fontWeight: 400 }}>{((r.budgeted / r.appropriations) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr><td style={{ ...td, fontWeight: 800 }}>Itemised total</td><td style={num}>{usd(budgetedUseTotal)}</td><td style={td} /><td style={td} /></tr>
            </tbody>
          </table>
        </div>
        {townWideBudgetedUse != null && budgetedUseUnexplained !== null && budgetedUseUnexplained !== 0 && (
          <p style={{ color: 'var(--rbl-warn)', fontSize: 12.8, lineHeight: 1.55, marginBottom: 0, marginTop: 10 }}>
            The Town&apos;s own town-wide line reports <strong>{usd(townWideBudgetedUse)}</strong>, which is{' '}
            <strong>{usd(Math.abs(budgetedUseUnexplained))}</strong>{' '}
            {budgetedUseUnexplained > 0 ? 'more' : 'less'} than the funds itemised above come to. The difference is
            reported rather than reconciled: the funds carrying it are not broken out in the summary this site reads.
          </p>
        )}
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Channel two: resolutions adopted during the year</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Each of these charged the General Fund&apos;s Appropriated Fund Balance account on its own fiscal impact
          statement. The amounts are the Town&apos;s, not this site&apos;s — taken from section G of the statement
          rather than inferred from the resolution text.
        </p>
        <DrawTable rows={documentedDraws} total={documentedTotal} totalLabel="Charged to A01-9999" />
      </section>

      {curatedCommitments.length > 0 && (
        <section style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>
            Commitments the account codes do not cover
          </h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            These were read from the record rather than from an account line, so they are <strong>not</strong> added
            to the figure above and are not claimed to have charged A01-9999. The largest, the East Main Street
            acquisition, was authorized explicitly from General Fund balance — a firm vote, but the record notes the
            figure could <em>rise</em> if the owner pursues more in court, so it is not a settled cost either. They
            are listed because leaving a committed sum off a page about committed sums would be its own distortion.
          </p>
          <DrawTable rows={curatedCommitments} total={curatedTotal} totalLabel="Committed, not booked to 9999" />
        </section>
      )}

      {otherTierGeneralFundDraws.length > 0 && (
        <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-warn)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Reported, but not counted against the cushion</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            GASB Statement 54 splits fund balance into five tiers, and this site measures the cushion on the
            unassigned one. {otherTierGeneralFundDraws.length === 1 ? 'This draw names' : 'These draws name'} a
            different tier on the account itself, so netting {otherTierGeneralFundDraws.length === 1 ? 'it' : 'them'}{' '}
            against the unassigned cushion would report the cushion shrinking when it has not moved. Real money and a
            real vote — shown here rather than filtered away in silence.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
            {otherTierGeneralFundDraws.map((d) => (
              <li key={d.number ?? d.title} style={{ marginBottom: 6 }}>
                <strong>{usd(d.amount)}</strong> — {d.title}{' '}
                <span style={{ color: 'var(--rbl-text-muted)' }}>
                  (Resolution {d.number ?? '—'}, {d.tiers.join(', ')})
                </span>
              </li>
            ))}
          </ul>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, marginBottom: 0, marginTop: 10 }}>
            Total not netted: <strong>{usd(otherTierDrawTotal)}</strong>
          </p>
        </section>
      )}

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this page cannot tell you</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }}>
          {limits.map((l, i) => <li key={i} style={{ marginBottom: 8 }}>{l}</li>)}
        </ul>
      </section>

      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
          {sources.map((s) => (
            <li key={s.url} style={{ marginBottom: 6 }}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{s.title} ↗</a>
              <span style={{ color: 'var(--rbl-text-muted)' }}> — {s.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

function DrawTable({ rows, total, totalLabel }: { rows: { label: string; amount: number; source: string; certainty: string; supersedes?: { label: string; was: number; by: number } }[]; total: number; totalLabel: string }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
          <th style={th}>What it funded</th><th style={{ ...th, textAlign: 'right' }}>Amount</th>
        </tr></thead>
        <tbody>
          {[...rows].sort((a, b) => b.amount - a.amount).map((c, i) => (
            <tr key={`${c.label}-${i}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <td style={td}>
                <div style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>{c.label}</div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>{c.source}</div>
                {c.certainty === 'ceiling' && (
                  <div style={{ color: 'var(--rbl-warn)', fontSize: 12, marginTop: 2 }}>
                    A ceiling: the most this vote could cost, not a figure the Town has booked.
                  </div>
                )}
                {c.certainty === 'authorized' && (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>
                    Authorized by vote, not booked against the fund balance account.
                  </div>
                )}
                {c.supersedes && (
                  <div style={{ color: 'var(--rbl-warn)', fontSize: 12, marginTop: 2 }}>
                    Replaces a {usd(c.supersedes.was)} ceiling carried before the Town published a figure — lower by{' '}
                    {usd(c.supersedes.was - c.supersedes.by)}.
                  </div>
                )}
              </td>
              <td style={num}>{usd(c.amount)}</td>
            </tr>
          ))}
          <tr><td style={{ ...td, fontWeight: 800 }}>{totalLabel}</td><td style={num}>{usd(total)}</td></tr>
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value, sub, accent, warn }: { label: string; value: string; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div style={{ background: warn ? 'var(--rbl-warn-bg)' : accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: warn ? 'var(--rbl-warn)' : accent ? 'var(--rbl-info-text)' : 'var(--rbl-title)', display: 'block', marginTop: 2, lineHeight: 1.2 }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}
