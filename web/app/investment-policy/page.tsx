import type { ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import { CASH_2025, COMPARISON, IMPROVEMENTS, RIVERHEAD_YEARS, SOURCES, TOWNS, WORDING_FIXES } from '../../lib/investment-policy'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const p = { margin: '0 0 12px', color: 'var(--rbl-text-strong)', fontSize: 16, lineHeight: 1.6, maxWidth: '72ch' } as const
const h2 = { margin: '0 0 10px', fontSize: 20, color: 'var(--rbl-title)' } as const
const usd = (n: number) => `$${n.toLocaleString('en-US')}`

export const metadata = {
  title: 'Investment policy — how the Town of Riverhead keeps its cash, and how it compares',
  description:
    'The investment policy the Riverhead Town Board readopts each January, read across 2023 to 2026 and beside Brookhaven, Southampton, Southold and Smithtown, with possible improvements.',
}

export default function InvestmentPolicyPage() {
  return (
    <PageShell
      title="Investment policy"
      subtitle="Each January the Town Board readopts the rules for where the Town keeps its cash and how it is protected. Here are the last four, beside four neighboring towns’ and the State Comptroller’s model, with some possible improvements."
    >
      <section style={card}>
        <h2 style={h2}>What it is</h2>
        <p style={p}>
          State law requires every town to adopt an investment policy and review it every year (General Municipal Law §39). It says which banks may hold Town money,
          how deposits above federal insurance must be backed by collateral (securities a bank pledges so the Town is repaid if the bank fails), and what the Town may invest in.
          The State Comptroller publishes a model policy, and Riverhead’s follows it closely.
        </p>
        <p style={{ ...p, marginBottom: 0 }}>
          The short version: Riverhead has readopted the same text four years running, unanimously each time, with one word changed. The audit reports every dollar in the banks at the end of 2025 insured or backed by collateral.
          The policy itself leaves out some details the law and the model expect, and some neighbors include them.
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>The money it covers</h2>
        <p style={p}>From the Town’s audited statements for December 31, 2025:</p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))' }}>
          <Stat value={usd(CASH_2025.bookBalance)} label={`cash on the Town’s books, including ${usd(CASH_2025.fiduciary)} held for others`} />
          <Stat value={usd(CASH_2025.bankBalance)} label="in the banks" />
          <Stat value={usd(CASH_2025.collateral)} label="of that backed by collateral in the Town’s name" />
          <Stat value={usd(CASH_2025.fdic)} label="covered by federal deposit insurance" />
          <Stat value={usd(CASH_2025.nyclass)} label="in NYCLASS, a pool of Treasury securities run with other governments" />
        </div>
        <p style={{ ...p, marginTop: 12, marginBottom: 0, fontSize: 14.5, color: 'var(--rbl-text-muted)' }}>
          The bank balance was fully covered: {usd(CASH_2025.fdic)} insured plus {usd(CASH_2025.collateral)} collateralized makes {usd(CASH_2025.fdic + CASH_2025.collateral)}.
          Source: <a href={SOURCES['riverhead-audit-2025'].url} style={link}>{SOURCES['riverhead-audit-2025'].label}</a>.
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Four years in Riverhead</h2>
        <p style={p}>
          Each policy was compared word for word with the year before. All four were adopted unanimously at the January organizational meeting, with the policy attached to the resolution.
        </p>
        <Table
          caption="Riverhead’s investment policy resolutions, 2023 to 2026"
          head={['Year', 'Resolution', 'Moved and seconded', 'What changed']}
          rows={RIVERHEAD_YEARS.map((y) => [
            String(y.year),
            <a key="r" href={SOURCES[y.doc].url} style={link}>{y.resolution}, {y.date}</a>,
            `${y.mover}; ${y.seconder}`,
            y.change,
          ])}
        />
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Beside four neighbors</h2>
        <p style={p}>
          Each town’s latest policy, or what its resolutions show where the policy itself is not posted. Where a cell says “not known” or “did not find”, this site could not find it online; that does not mean the town lacks it.
        </p>
        <Table
          caption="Investment policies in five Suffolk County towns, as adopted for 2026"
          head={['', ...TOWNS]}
          rows={COMPARISON.map((r) => [r.topic, ...TOWNS.map((t) => r.cells[t])])}
        />
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Possible improvements</h2>
        <p style={p}>
          These are suggestions for the Board’s next annual review, drawn from the law, the State Comptroller’s model and what neighbors do. They are not findings that the Town has broken a rule:
          the audit reports the Town’s deposits fully insured or collateralized.
        </p>
        <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 14, maxWidth: '72ch' }}>
          {IMPROVEMENTS.map((imp) => (
            <li key={imp.title} style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--rbl-text-strong)' }}>
              <strong>{imp.title}.</strong> {imp.body}
              {imp.title === 'Fix the wording errors' && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 6, fontSize: 15 }}>
                  {WORDING_FIXES.map(([was, fix]) => <li key={was}>{was}: {fix}.</li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Sources</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, lineHeight: 1.5, maxWidth: '80ch' }}>
          {Object.entries(SOURCES).map(([id, s]) => <li key={id}><a href={s.url} style={link}>{s.label}</a></li>)}
        </ul>
        <p style={{ ...p, marginTop: 12, marginBottom: 0, fontSize: 14, color: 'var(--rbl-text-muted)' }}>
          Every quotation on this page is checked against the text of these documents when the site is built. This is an unofficial resident project, not legal or audit advice.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px', background: 'var(--rbl-surface-2)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--rbl-title)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 14, color: 'var(--rbl-text-muted)', lineHeight: 1.4, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <figure className="tcl-table" style={{ margin: '6px 0 0', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, overflowX: 'auto' }}>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
        <caption style={{ padding: '12px 14px 4px', color: 'var(--rbl-text-muted)', fontSize: 14.5, lineHeight: 1.45, textAlign: 'left' }}>{caption}</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            {head.map((h, i) => <th key={h || i} scope="col" style={{ textAlign: 'left', padding: '8px 14px', color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 14 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: ri ? '1px solid var(--rbl-border-subtle)' : undefined }}>
              {/* Every cell is prose, so on a phone each takes the full width, its label above it. */}
              {r.map((c, i) => <td key={i} data-label={head[i]} className="rbl-stack-prose" style={{ padding: '9px 14px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)', fontWeight: i === 0 ? 600 : 400 }}><span>{c}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
