import PageShell from '../../components/PageShell'
import ProposalLineStageNotice from '../../components/ProposalLineStageNotice'
import PlainCallout from '../../components/PlainCallout'
import OutlierWatch from '../../components/OutlierWatch'
import {
  outliers, transitions, allYoyChanges, fundCount, fundNames, adoptedYears, proposal, proposalLines, supplementSource,
  paydowns2026, cpfDebtTransfer, PCT_THRESHOLD, DOLLAR_THRESHOLD, type FundYoyChange, type LineMove,
} from '../../lib/outlier-watch'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`
const pct = (n: number | null) => (n === null ? '' : `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`)
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const listed = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)
const counted = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n)
const Counted = (n: number) => counted(n).replace(/^./, (c) => c.toUpperCase())
/** "Water District (up $382,713, 3.5%)" */
const moved = (c: FundYoyChange) => `${c.name} (${c.dollarChange >= 0 ? 'up' : 'down'} ${usd(Math.abs(c.dollarChange))}, ${c.pctChange === null ? 'new' : `${Math.abs(c.pctChange).toFixed(1)}%`})`
/** "the Debt Service Fund, from $6,888,150 to $2,594,028 (−$4,294,122, −62.3%)" */
const movedFully = (c: FundYoyChange) => `the ${c.name}, from ${usd(c.prior)} to ${usd(c.current)} (${signed(c.dollarChange)}, ${pct(c.pctChange)})`

const last = proposal ? `the ${proposal.to.label}` : String(adoptedYears.last)
/** The later budget's label, from the comparison's key: '2027 Tentative' from '2026→2027 Tentative'. */
const labelOf = (c: FundYoyChange) => c.transition.split('→')[1]
const range = `${adoptedYears.first} to ${last}`

export const metadata = {
  title: 'Outlier Watch — unusual year-over-year fund swings',
  description: `Every one of Riverhead's ${fundCount} funds, checked against its own budget the year before, ${range}. Flags appropriation swings large enough in both percentage and dollar terms to be worth a resident's attention.`,
}

export default function OutlierWatchPage() {
  const biggest = outliers[0]
  const key = proposal?.key
  const fromProposal = key ? outliers.filter((o) => o.transition === key).length : 0

  return (
    <PageShell
      title="Outlier Watch"
      subtitle={`Riverhead's ${fundCount} town funds, each checked against its own budget the year before, from ${range}. A flag marks a swing large enough to be worth a second look. It is not proof of a problem, but a place to start asking questions.`}
    >
      <ProposalLineStageNotice />
      <PlainCallout
        tips={[
          {
            label: 'What counts as an outlier',
            text: `a fund whose appropriation moved at least ${PCT_THRESHOLD}% and at least ${usd(DOLLAR_THRESHOLD)} from one budget to the next: each adopted budget against the one before it${proposal ? `, and the ${proposal.to.label} against the ${proposal.from.label} adopted budget` : ''}.`,
          },
          { label: 'Why two thresholds', text: 'percent alone flags small funds swinging on a tiny base (a $15,000 fund going to $25,000 is "+67%" but immaterial); dollars alone would flag the General Fund almost every year simply because it is the biggest fund.' },
          ...(proposal
            ? [{
                label: `The ${proposal.to.label} is a proposal`,
                text: proposal.to.stage === 'tentative'
                  ? `it is the Supervisor's recommended budget. The Board can change it before it adopts the ${proposal.to.year} budget, by November 20, and this page moves to the Board's version when it is published.`
                  : `it is the Tentative with the Board's changes, the version the public hearing is held on. The Board adopts the ${proposal.to.year} budget by November 20.`,
              }]
            : []),
          { label: 'What it does not mean', text: 'a flag is not an accusation. Big swings often have ordinary explanations — a bond payoff, a new contract, a one-time grant. Treat this as a starting point for a question at a Town Board meeting, not a conclusion.' },
        ]}
      >
        Across {allYoyChanges.length} fund-year comparisons from {range}, <strong>{outliers.length}</strong> clear the bar for a flag
        {proposal ? <>, {counted(fromProposal)} of them in the {proposal.to.label}</> : null}.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <Stat label="Fund-year comparisons" value={String(allYoyChanges.length)} sub={`${range}, all ${fundCount} funds`} />
        <Stat label="Flagged as outliers" value={String(outliers.length)} sub={`≥${PCT_THRESHOLD}% and ≥${usd(DOLLAR_THRESHOLD)}`} accent />
        <Stat label="Largest flagged swing" value={biggest ? usd(Math.abs(biggest.dollarChange)) : '—'} sub={biggest ? `${biggest.name}, ${biggest.transition.replace('→', ' → ')}` : ''} />
      </section>

      {proposal && (
        <section aria-labelledby="proposal-heading" style={{ marginBottom: 24 }}>
          <h2 id="proposal-heading" style={{ margin: '0 0 10px', color: 'var(--rbl-title)', fontSize: 24, lineHeight: 1.25 }}>What the {proposal.to.label} flags</h2>
          <p style={prose}>
            {proposal.flagged.length === 0
              ? <>Against the {proposal.from.label} adopted budget, no fund in the {proposal.to.label} moves past both bars.</>
              : <>Against the {proposal.from.label} adopted budget, {counted(proposal.flagged.length)} {proposal.flagged.length === 1 ? 'fund moves' : 'funds move'} past both bars: {listed(proposal.flagged.map(movedFully))}.</>}
          </p>
          {proposal.dollarsOnly.length > 0 && (
            <p style={prose}>
              {Counted(proposal.dollarsOnly.length)} {proposal.flagged.length > 0 ? 'other ' : ''}{proposal.dollarsOnly.length === 1 ? 'fund changes' : 'funds change'} by {usd(DOLLAR_THRESHOLD)} or more but by less than {PCT_THRESHOLD}%, so {proposal.dollarsOnly.length === 1 ? 'it is' : 'they are'} not flagged: {listed(proposal.dollarsOnly.map(moved))}.
            </p>
          )}
          {proposal.percentOnly.length > 0 && (
            <p style={prose}>
              {Counted(proposal.percentOnly.length)} {proposal.percentOnly.length === 1 ? 'fund changes' : 'funds change'} by {PCT_THRESHOLD}% or more but by less than {usd(DOLLAR_THRESHOLD)}, so {proposal.percentOnly.length === 1 ? 'it is' : 'they are'} not flagged either: {listed(proposal.percentOnly.map(moved))}.
            </p>
          )}
          {/* A flagged fund gets its Supplement lines when the Supplement prints this proposal (a Tentative). The Debt Service
              Fund's fall is explained by the 2026 votes whichever stage is newest, so it keeps its panel without them. */}
          {proposal.flagged.map((c) => (proposalLines[c.code] || isDebtServiceFall(c)
            ? <FlagLines key={c.code} change={c} lines={proposalLines[c.code] ?? null} fromLabel={String(c.fromYear)} toLabel={labelOf(c)} />
            : null))}
        </section>
      )}

      <h2 style={{ margin: '0 0 10px', color: 'var(--rbl-title)', fontSize: 24, lineHeight: 1.25 }}>Every flag since {adoptedYears.first}</h2>
      <OutlierWatch outliers={outliers} transitions={transitions} />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55, marginTop: 16 }}>
        Sources: each adopted budget's Summary page, through the same fund history that powers{' '}
        <a href={`${base}/funds/`} style={link}>Funds Explorer</a>
        {proposal && <>; the <a href={proposal.to.source.url} target="_blank" rel="noopener noreferrer" style={link}>{proposal.to.source.title}</a>, its Summary page</>}
        {supplementSource && Object.keys(proposalLines).length > 0 && <>; and, line by line, the <a href={supplementSource.url} target="_blank" rel="noopener noreferrer" style={link}>{supplementSource.title}</a>, whose lines add up to the Tentative to the dollar</>}.
      </p>
    </PageShell>
  )
}

const isDebtServiceFall = (c: FundYoyChange) => c.code === 'V01' && c.toYear === 2027 && c.dollarChange < 0

/**
 * One flagged fund in the proposal: the lines that moved, and what the record says about why.
 * `lines` is null when the Supplement does not print this proposal (a Preliminary or Adopted budget).
 */
function FlagLines({ change, lines, fromLabel, toLabel }: { change: FundYoyChange; lines: { spending: LineMove[]; money: LineMove[] } | null; fromLabel: string; toLabel: string }) {
  const debtService = isDebtServiceFall(change)
  const cpf = cpfDebtTransfer
  // Said only while it is the whole story: the transfer gone, the same amount
  // budgeted as a contribution instead, and the fund itself left unflagged.
  // Its figures are the Supplement's, which prints the Tentative, so it needs the lines.
  const cpfStory = debtService && lines && cpf && cpf.transfer.to === 0 && cpf.contribution.from === 0 && cpf.contribution.to === cpf.transfer.from &&
    !proposal?.flagged.some((c) => c.code === 'CM4')
  return (
    <section aria-labelledby={`lines-${change.code}`} style={{ ...card, marginTop: 4 }}>
      <h3 id={`lines-${change.code}`} style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 19, lineHeight: 1.3 }}>
        {debtService ? 'Why the Debt Service Fund falls' : `The ${change.name}, line by line`}
      </h3>
      {debtService && (
        <>
          <p style={prose}>
            The fund makes bond and note payments for the General Fund and other funds, with money they send it, so a fall here
            is not a cut to a service. {paydowns2026.length > 0 && 'Two votes the Board took in 2026 paid debt down, mostly with savings:'}
          </p>
          {paydowns2026.length > 0 && (
            <ul style={{ margin: '0 0 12px', paddingLeft: 20, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              {paydowns2026.map((p) => (
                <li key={p.number} style={{ color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.55 }}>
                  <a href={`${base}/meetings/?meeting=${encodeURIComponent(p.meetingSlug)}&q=${encodeURIComponent(p.number)}`} style={link}>
                    Resolution {p.number}
                  </a>
                  {' '}({longDate(p.meetingDate)}{p.unanimous ? ', unanimous' : ''}) pays down {p.paysDown} with{' '}
                  {listed(p.money.map((m) => `${usd(m.amount)} ${m.words}`))}.
                </li>
              ))}
            </ul>
          )}
          {cpfStory && (
            <p style={prose}>
              In the {toLabel}, the Community Preservation Fund sends the Debt Service Fund nothing; the {fromLabel} budget had it
              send {usd(cpf.transfer.from)}. That fund's own budget does not shrink: a new line, “{cpf.contribution.name}”, adds the
              same {usd(cpf.contribution.to)} to its savings instead, which is why the Community Preservation Fund is not flagged.
            </p>
          )}
        </>
      )}
      {lines ? (
        <LineTable caption={`What the ${change.name} pays for, ${fromLabel} adopted and ${toLabel}`} first="Line" rows={lines.spending} fromLabel={fromLabel} toLabel={toLabel} />
      ) : (
        <p style={{ ...prose, fontSize: 15 }}>
          The Budget Supplement, which lists the fund line by line, prints the Tentative, not the {toLabel}, so the lines are not shown here.
        </p>
      )}
      {lines?.spending.some((l) => /\bBAN\b/.test(l.name)) && (
        <p style={{ ...prose, fontSize: 15 }}>
          A BAN, or bond anticipation note, is short-term borrowing that the Town pays off or renews until it sells long-term bonds.
        </p>
      )}
      {lines && lines.money.length > 0 && (
        <LineTable caption={`Where the ${change.name}'s money comes from`} first="Source" rows={lines.money} fromLabel={fromLabel} toLabel={toLabel} />
      )}
      {debtService && (
        <p style={{ ...prose, margin: 0, fontSize: 15 }}>
          <a href={`${base}/capital-debt/`} style={link}>Debt &amp; Capital</a> lists every bond and note the Town owes, and what
          has happened to each since the end of 2025.
        </p>
      )}
    </section>
  )
}

/** "Interfund Transfers - CM4" reads as "From the Community Preservation Fund". */
const lineName = (l: LineMove) => {
  const from = l.name.match(/^Interfund Transfers - (\w+)$/)?.[1]
  return from && fundNames[from] ? `From the ${fundNames[from]}` : l.name
}
const pages = (rows: LineMove[]) => {
  const p = Array.from(new Set(rows.map((r) => r.page))).sort((a, b) => a - b)
  return p.length === 1 ? `p. ${p[0]}` : `pp. ${p.join(', ')}`
}

function LineTable({ caption, first, rows, fromLabel, toLabel }: { caption: string; first: string; rows: LineMove[]; fromLabel: string; toLabel: string }) {
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  const head = { ...cell, fontWeight: 600, fontSize: 13.5, color: 'var(--rbl-text-muted)' } as const
  return (
    <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, margin: '4px 0 14px' }}>
      <caption style={{ textAlign: 'left', color: 'var(--rbl-text-body)', fontWeight: 600, fontSize: 15, padding: '0 0 6px' }}>
        {caption} <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>(Budget Supplement, {pages(rows)})</span>
      </caption>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--rbl-border)', textAlign: 'left' }}>
          <th scope="col" style={head}>{first}</th>
          <th scope="col" style={{ ...head, textAlign: 'right' }}>{fromLabel} adopted</th>
          <th scope="col" style={{ ...head, textAlign: 'right' }}>{toLabel}</th>
          <th scope="col" style={{ ...head, textAlign: 'right' }}>Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((l) => (
          <tr key={l.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
            <td style={{ ...cell, color: 'var(--rbl-text-strong)' }}>
              {/* One box, so a phone's stacked row keeps the account number under its line, on the left. */}
              <span style={{ textAlign: 'left' }}>
                {lineName(l)}
                <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 400 }}>{l.account}</span>
              </span>
            </td>
            <td data-label={`${fromLabel} adopted`} style={{ ...cell, textAlign: 'right' }}>{usd(l.from)}</td>
            <td data-label={toLabel} style={{ ...cell, textAlign: 'right' }}>{usd(l.to)}</td>
            <td data-label="Change" style={{ ...cell, textAlign: 'right', fontWeight: 700, color: l.dollarChange >= 0 ? 'var(--inc)' : 'var(--dec)' }}>{signed(l.dollarChange)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <div style={{ color: accent ? 'var(--rbl-danger)' : 'var(--rbl-title)', fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>{sub}</div>}
    </div>
  )
}
