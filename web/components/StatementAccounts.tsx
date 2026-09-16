'use client'

import {
  fundingSplit,
  grantCost,
  resolveFunding,
  type ResolutionFunding,
  type ResolvedAccount,
} from '../lib/account-lookup'

// Renders section G of a Fiscal Impact Statement as a small ledger: which
// budget line the resolution charges, where the money comes from, and how big
// the charge is next to what the adopted budget set that line at.
//
// Nothing here is inferred. Every code, name and figure is transcribed from the
// statement; the adopted-budget comparison comes from the Town's own 2026
// Adopted Budget line items.

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const ROLE_LABEL: Record<string, string> = {
  revenue: 'Paid from',
  charge: 'Charged to',
  transfer: 'Transferred into',
  unspecified: 'Account named',
}

/** The one line a resident should take away from a resolved account. */
function consequence(a: ResolvedAccount): { text: string; tone: 'warn' | 'plain' } | null {
  const { match, share, amount } = a
  if (match.status === 'unbudgeted-fund-balance') {
    return {
      text: `The ${match.fundName}'s 2026 adopted budget appropriated no fund balance. This draw was not in it.`,
      tone: 'warn',
    }
  }
  if (match.status === 'new-account') {
    return {
      text: `Opened by this resolution under project ${match.project} — it is not in the adopted budget because it did not exist when the budget was adopted.`,
      tone: 'warn',
    }
  }
  if (match.status === 'non-operating') {
    return { text: `${match.fundName} — outside the operating budget, so not a draw on an operating fund's surplus.`, tone: 'plain' }
  }
  if (match.status !== 'matched') return null
  if (match.adopted2026 == null) return { text: `${match.fundName} · ${match.department}`, tone: 'plain' }
  if (match.adopted2026 === 0) {
    return {
      text: `${match.lineName} was funded at $0 in the adopted budget.`,
      tone: amount ? 'warn' : 'plain',
    }
  }
  if (share == null) return { text: `Adopted 2026: ${usd(match.adopted2026)}`, tone: 'plain' }
  return {
    text: `${Math.round(share * 100)}% of this line's ${usd(match.adopted2026)} adopted budget`,
    tone: share >= 0.25 ? 'warn' : 'plain',
  }
}

export default function StatementAccounts({ funding }: { funding?: ResolutionFunding | null }) {
  const accounts = resolveFunding(funding)
  const split = fundingSplit(funding)
  const grant = grantCost(funding)
  if (accounts.length === 0) return grant ? <GrantTerms text={grant} funding={funding} /> : null

  return (
    <div style={{ marginTop: 8, borderLeft: '3px solid var(--rbl-border-strong)', paddingLeft: 9 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--rbl-text-muted)', marginBottom: 4 }}>
        Accounts on the Town’s own statement
      </div>
      {grant && <GrantTerms text={grant} funding={funding} inline />}
      {split.isSplit && (
        <div style={{ fontSize: 11.5, color: 'var(--rbl-text-body)', marginBottom: 5 }}>
          One action, <strong>{split.lines.length}</strong> budget lines
          {split.departments.length > 1 && <> across <strong>{split.departments.length}</strong> departments</>}
          {split.largest && split.largest.share < 0.9 && (
            <> — largest share {Math.round(split.largest.share * 100)}%</>
          )}
          .
        </div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {accounts.map((a) => {
          const c = consequence(a)
          const label = a.match.status === 'matched' ? a.match.lineName : a.name ?? a.code
          return (
            <div key={`${a.code}-${a.role}`} style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800, fontSize: 10.5, minWidth: 92 }}>
                  {ROLE_LABEL[a.role] ?? a.role}
                </span>
                <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 700 }}>{label}</span>
                {a.amount != null && (
                  <span style={{ color: 'var(--rbl-title)', fontWeight: 800 }}>{usd(a.amount)}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 1 }}>
                {a.match.status === 'matched' ? (
                  <a href={`${base}/funds/${a.match.fund}/`} title={`Open the ${a.match.fundName} line items`} style={{ fontSize: 10.5, color: 'var(--rbl-link)', minWidth: 92, fontFamily: 'ui-monospace, monospace', textDecoration: 'none', fontWeight: 700 }}>{a.code}</a>
                ) : (
                  <code style={{ fontSize: 10.5, color: 'var(--rbl-text-faint)', minWidth: 92 }}>{a.code}</code>
                )}
                {c && (
                  <span style={{ fontSize: 11.5, color: c.tone === 'warn' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)', fontWeight: c.tone === 'warn' ? 700 : 500 }}>
                    {c.text}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** What a grant actually costs the Town — shown whether or not accounts were named. */
function GrantTerms({ text, funding, inline }: { text: string; funding?: ResolutionFunding | null; inline?: boolean }) {
  const costly = funding?.matchRequired === true || funding?.reimbursementBasis === true
  return (
    <div style={{
      marginTop: inline ? 0 : 8, marginBottom: inline ? 6 : 0,
      borderLeft: inline ? undefined : '3px solid var(--rbl-border-strong)',
      paddingLeft: inline ? 0 : 9,
      fontSize: 11.5, lineHeight: 1.45,
      color: costly ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)',
      fontWeight: costly ? 700 : 500,
    }}>
      {text}
    </div>
  )
}
