'use client'

import { useMemo, useState } from 'react'
import { BASIS_TEXT, type ContractAward } from '../lib/contract-awards'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)
const dateText = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function ContractAwardsList({ awards, kinds }: { awards: ContractAward[]; kinds: Record<string, string> }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return awards
      .filter((a) => kind === 'all' || a.kind === kind)
      .filter((a) => !q || [a.title, a.resolution, ...a.vendors.map((v) => v.name)].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.resolution.localeCompare(a.resolution, 'en', { numeric: true })))
  }, [awards, query, kind])

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ flex: '1 1 240px', display: 'grid', gap: 4, color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 }}>
          Search a vendor, item or resolution number
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. H2M, dump truck, 2026-915"
            style={{ font: 'inherit', fontSize: 15, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)' }}
          />
        </label>
        <label style={{ flex: '0 1 220px', display: 'grid', gap: 4, color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 }}>
          Kind
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={{ font: 'inherit', fontSize: 15, padding: '9px 10px', borderRadius: 10, border: '1px solid var(--rbl-border-strong)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)' }}
          >
            <option value="all">All kinds</option>
            {Object.entries(kinds).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 13 }}>
        Showing {shown.length} of {awards.length} resolutions.
      </p>

      {shown.map((a) => (
        <article key={`${a.date}-${a.resolution}`} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: 'var(--rbl-text-muted)', fontSize: 13 }}>
            <span>
              {dateText(a.date)} · Resolution {a.resolution} · {kinds[a.kind]}
            </span>
            <span>{a.result ? (a.adopted === false ? a.result : a.result.replace(/\s*\[UNANIMOUS\]/i, ', unanimous').replace(/^ADOPTED/i, 'Adopted')) : 'Result not in the meeting record'}</span>
          </div>
          <h3 style={{ margin: '6px 0 8px', fontSize: 16, lineHeight: 1.35, color: 'var(--rbl-title)' }}>{a.title}</h3>
          <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0,110px) minmax(0,1fr)', gap: '4px 12px', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            <dt style={{ color: 'var(--rbl-text-muted)' }}>Vendor</dt>
            <dd style={{ margin: 0, color: 'var(--rbl-text-strong)' }}>
              {a.vendors.length ? (
                a.vendors.map((v, i) => (
                  <span key={i} style={{ display: 'block' }}>
                    <strong>{v.name}</strong>
                    {v.role && <span style={{ color: 'var(--rbl-text-muted)' }}> · {v.role}</span>}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--rbl-text-muted)' }}>{a.kind === 'change-order' ? 'Not named in the resolution; the change order attached to it names the contractor.' : 'Not named in a form this list can read; see the packet.'}</span>
              )}
            </dd>
            <dt style={{ color: 'var(--rbl-text-muted)' }}>Amount</dt>
            <dd style={{ margin: 0, color: 'var(--rbl-text-strong)' }}>
              {a.amount ? <strong>{usd(a.amount)}</strong> : a.basis === 'no-cost' ? <strong>No cost</strong> : null}
              <span style={{ color: 'var(--rbl-text-muted)' }}>{a.amount || a.basis === 'no-cost' ? `, ${BASIS_TEXT[a.basis]}` : BASIS_TEXT[a.basis].charAt(0).toUpperCase() + BASIS_TEXT[a.basis].slice(1)}</span>
            </dd>
            {a.funds.length > 0 && (
              <>
                <dt style={{ color: 'var(--rbl-text-muted)' }}>Charged to</dt>
                <dd style={{ margin: 0, color: 'var(--rbl-text-strong)' }}>{a.funds.join(', ')}</dd>
              </>
            )}
          </dl>
          {(a.quote || a.clause) && (
            <blockquote style={{ margin: '10px 0 0', padding: '8px 12px', background: 'var(--rbl-surface-2)', borderRadius: 10, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5 }}>
              “{a.quote || a.clause}”
            </blockquote>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 13, fontWeight: 700 }}>
            {a.sourceUrl && <a href={a.sourceUrl} style={{ color: 'var(--rbl-link)' }}>Agenda packet (PDF)</a>}
            <a href={`${base}/meetings/?meeting=${a.date}&q=${encodeURIComponent(a.resolution)}`} style={{ color: 'var(--rbl-link)' }}>The vote</a>
          </div>
        </article>
      ))}
    </div>
  )
}
