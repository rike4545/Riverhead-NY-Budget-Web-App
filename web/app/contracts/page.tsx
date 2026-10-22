import PageShell from '../../components/PageShell'
import ContractAwardsList from '../../components/ContractAwardsList'
import data from '../../public/data/meetings/contract-awards.json'
import { vendorCounts, type ContractAwards } from '../../lib/contract-awards'

const awards = data as ContractAwards
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export const metadata = {
  title: 'Contracts and bids — who the Town Board agreed to pay in 2026',
  description:
    'Every 2026 Riverhead Town Board resolution that awards a bid, extends one, buys equipment, changes a construction contract or hires a firm, with the vendor and amount in the resolution’s own words.',
}

export default function ContractsPage() {
  const list = awards.awards
  const top = vendorCounts(list).filter((v) => v.count > 1)
  const stated = list.filter((a) => a.amount && a.basis === 'stated')
  const capped = list.filter((a) => a.amount && a.basis === 'cap')
  const attached = list.filter((a) => a.basis === 'attached').length
  const latest = list.reduce((d, a) => (a.date > d ? a.date : d), awards.since)
  const latestText = new Date(`${latest}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const byKind = Object.entries(awards.kinds).map(([k, label]) => [label, list.filter((a) => a.kind === k).length] as const)

  return (
    <PageShell
      title="Contracts and bids"
      subtitle="Who the Town Board agreed to pay in 2026: bid awards, bid extensions, purchases, change orders and service agreements, each with the vendor and amount in the resolution’s own words."
    >
      <section style={card}>
        <p style={{ margin: 0, color: 'var(--rbl-text-strong)', fontSize: 15.5, lineHeight: 1.6 }}>
          At <strong>{awards.counts.meetings}</strong> meetings from January 1 through {latestText}, the Board voted on <strong>{awards.counts.resolutions}</strong> resolutions
          that choose a vendor or set the terms for one. <strong>{awards.counts.withVendor}</strong> of them name the vendor in a form this list can read.
          Only <strong>{awards.counts.withAmount}</strong> state a dollar figure in the resolution itself. Most bid awards ({attached}) say the prices are “on the
          attached pages”, so their amounts are left blank here rather than read from an attachment.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {byKind.map(([label, n]) => (
            <span key={label} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '4px 10px', fontSize: 13, color: 'var(--rbl-text-body)' }}>
              {label}: <strong>{n}</strong>
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 16, marginTop: 16 }}>
        <section style={card}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--rbl-title)' }}>Named more than once</h2>
          {top.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.7 }}>
              {top.slice(0, 12).map((v) => (
                <li key={v.name}>
                  <strong>{v.name}</strong>: {v.count} resolutions ({v.resolutions.join(', ')})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No vendor is named in more than one resolution.</p>
          )}
          <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
            A count of resolutions, not dollars. A renewal or an addendum counts as its own resolution.
          </p>
        </section>
        <section style={card}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--rbl-title)' }}>The amounts that are stated</h2>
          <p style={{ margin: 0, color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6 }}>
            {stated.length} resolutions state an amount, together <strong>{usd(stated.reduce((s, a) => s + (a.amount ?? 0), 0))}</strong>.
            Another {capped.length} set a ceiling (“not to exceed”), together <strong>{usd(capped.reduce((s, a) => s + (a.amount ?? 0), 0))}</strong>.
            A ceiling is the most the Town may pay, not what it paid.
          </p>
          <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
            These totals leave out every award whose prices are in an attachment, so they are far below what the Town committed. What it actually pays each
            vendor is in the bills the Board approves at each meeting, which this list does not read.
          </p>
        </section>
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 19, color: 'var(--rbl-title)' }}>Every resolution</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55 }}>
          Newest first. The quotation under each one is the resolution’s own clause; the packet link opens the agenda packet it came from.
        </p>
        <ContractAwardsList awards={list} kinds={awards.kinds} />
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--rbl-title)' }}>How this list is made</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
          <li>It is read from each 2026 Town Board agenda packet on CivicClerk, through the {latestText} meeting, and rebuilt by running <code>etl/build_contract_awards.py</code>. The vote and result come from the meeting record.</li>
          <li>A vendor is listed only where the resolution names it: in its title, in a RESOLVED clause, or in the block of vendors a bid award lists. The vendors’ e-mail addresses and phone numbers are left out.</li>
          <li>Change orders name the engineer’s earlier agreement but not the contractor, so their vendor is left blank.</li>
          <li>Left out: notices to bidders and requests for proposals (no one is chosen yet), rejected bids, licenses and leases of Town property, agreements with other governments, grants, labor agreements, and agreements setting a Town employee’s terms.</li>
          <li>Names are set in ordinary case where the packet prints them in capitals. The packet’s spelling is kept.</li>
          <li>This is an unofficial list. Check a figure against the packet before relying on it.</li>
        </ul>
      </section>
    </PageShell>
  )
}
