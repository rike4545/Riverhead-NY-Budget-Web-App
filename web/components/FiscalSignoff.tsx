import { signoffReport, type SignoffMeeting, type Split } from '../lib/fiscal-signoff'

// Who signed the Fiscal Impact Statements, from sections H to M of each one,
// and how often the signed and unsigned ones are read as understating the cost.

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const th = { textAlign: 'right', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700 } as const
const td = { textAlign: 'right', padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', fontVariantNumeric: 'tabular-nums' } as const
const pct = (k: number, n: number) => (n ? `${Math.round((k / n) * 100)}%` : '—')
const of = (k: number, n: number) => `${k.toLocaleString('en-US')} of ${n.toLocaleString('en-US')}`
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function SplitCells({ s }: { s: Split }) {
  return (
    <>
      <td data-label="Signed by Accounting" style={td}><span><strong>{pct(s.signedWrong, s.signed)}</strong> <span style={{ color: 'var(--rbl-text-muted)' }}>({of(s.signedWrong, s.signed)})</span></span></td>
      <td data-label="Not signed" style={td}><span><strong>{pct(s.unsignedWrong, s.unsigned)}</strong> <span style={{ color: 'var(--rbl-text-muted)' }}>({of(s.unsignedWrong, s.unsigned)})</span></span></td>
    </>
  )
}

export default function FiscalSignoff({ meetings, year }: { meetings: SignoffMeeting[]; year: number }) {
  const r = signoffReport(meetings)
  if (!r.read) return null
  const o = r.overall
  const clear = o.z !== null && Math.abs(o.z) >= 2
  const latest = r.byMeeting[0]
  return (
    <section id="signoff" aria-labelledby="signoff-heading" data-fiscal-signoff style={{ ...card, margin: '18px 0' }}>
      <h2 id="signoff-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 }}>Who checked the forms</h2>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '78ch' }}>
        The bottom of every statement has a place for the person who prepared it and for the Accounting Office to sign and date it. Of the{' '}
        {r.read.toLocaleString('en-US')} statements filed in {year}, the Accounting Office dated <strong>{of(r.accountingDated, r.read)}</strong> (
        {pct(r.accountingDated, r.read)}), and the preparer dated {of(r.preparerDated, r.read)} ({pct(r.preparerDated, r.read)}).
        {latest && latest.read ? <> At the latest meeting, {shortDate(latest.date)}, Accounting dated {of(latest.accountingDated, latest.read)}.</> : null}
      </p>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '78ch' }}>
        Signed statements are read as understating the cost less often: <strong>{pct(o.signedWrong, o.signed)}</strong>, against{' '}
        <strong>{pct(o.unsignedWrong, o.unsigned)}</strong> of unsigned ones.{' '}
        {clear ? 'The gap is too large to be chance, so the review does catch something. ' : ''}
        But a signature is no guarantee: about one signed statement in {Math.round(o.signed / Math.max(o.signedWrong, 1))} is still read that way, and more for
        hiring and contracts. That pattern fits a review that checks the accounts and amounts and leaves the yes-or-no answer above them as written:
        a cost the budget already holds is marked “no fiscal impact”, though the form’s own box for it, E(a), is reached only by answering “yes”.
      </p>
      <table className="rbl-stack" style={{ width: '100%', maxWidth: 720, borderCollapse: 'collapse', fontSize: 15, margin: '6px 0 12px' }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px' }}>Share of statements read as understating the cost</caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>Statements</th>
            <th scope="col" style={th}>Signed by Accounting</th>
            <th scope="col" style={th}>Not signed</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>All</td><SplitCells s={o} /></tr>
          {r.byCategory.filter((c) => c.signed && c.unsigned).map((c) => (
            <tr key={c.id}><td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{c.label}</td><SplitCells s={c} /></tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--rbl-link)', minHeight: 24 }}>Sign-offs at each meeting</summary>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', maxWidth: 760, minWidth: 520, borderCollapse: 'collapse', fontSize: 14.5, marginTop: 8 }}>
            <thead>
              <tr>
                <th scope="col" style={{ ...th, textAlign: 'left' }}>Meeting</th>
                <th scope="col" style={th}>Statements</th>
                <th scope="col" style={th}>Dated by Accounting</th>
                <th scope="col" style={th}>Dated by preparer</th>
                <th scope="col" style={th}>Read as understated</th>
              </tr>
            </thead>
            <tbody>
              {r.byMeeting.map((m) => (
                <tr key={m.date}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{shortDate(m.date)}</th>
                  <td style={td}>{m.statements}</td>
                  <td style={td}>{m.accountingDated} ({pct(m.accountingDated, m.read)})</td>
                  <td style={td}>{m.preparerDated} ({pct(m.preparerDated, m.read)})</td>
                  <td style={td}>{m.understated} ({pct(m.understated, m.statements)})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
        Read from sections H to M of each statement in the {year} agenda packets. A date in the block shows the form was signed; how closely it was read is
        not recorded, and the names are left off this page. “Understating the cost” is this page’s realistic read of each form, and an audit could judge some of them differently. A question for the Board: when
        Accounting signs a statement, does it check the yes-or-no answer, or only the accounts?
      </p>
    </section>
  )
}
