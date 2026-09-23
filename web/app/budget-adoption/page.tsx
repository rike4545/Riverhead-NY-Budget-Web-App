import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  RECORD, ERAS, REASONS, OUTLOOK, LIMITS, AUDIT_SOURCE, PARTY_SOURCE, counts, eraStats, book, netChange,
  overrideState, OVERRIDE_LABEL, OUTCOME_LABEL, TIMING_LABEL, type YearRecord,
} from '../../lib/budget-adoption'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd(Math.abs(n))}`
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const day = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}` }
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '8px 10px', verticalAlign: 'top' as const }
const num = { ...td, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
const link = { color: 'var(--rbl-accent)' }
const body = { color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5 } as const

export const metadata = {
  title: 'How Riverhead adopts its budget, 2005–2026',
  description:
    'Every Riverhead budget since 2005: what the Town Board changed in each Supervisor’s Tentative, whether it changed it before or after the public hearing, and whether it ever voted to adopt the result — from the Town’s budget books and minutes.',
}

const LAW: [string, string, string][] = [
  ['Sept 30', 'The Supervisor, as budget officer, files the Tentative with the Town Clerk', 'Town Law §106(2)'],
  ['Oct 5', 'The Board receives it and may change it; the Tentative plus the Board’s changes becomes the Preliminary', 'Town Law §106(3)–(4)'],
  ['By the Thursday after Election Day', 'Public hearing on the Preliminary, noticed with the elected officials’ proposed salaries', 'Town Law §108'],
  ['After the hearing', 'The Board may change the Preliminary further', 'Town Law §109(1)'],
  ['Nov 20', 'The Board adopts it by resolution. If it does not, the Preliminary becomes the budget anyway', 'Town Law §109(2)–(3)'],
  ['Before adopting a levy above the cap', 'A local law passed by 60% of the Board (from the 2012 budget on)', 'General Municipal Law §3-c'],
]

/** What the book shows the Board changed, in words. */
function changeText(r: YearRecord): string {
  const b = book(r.year)
  if (b && b.layout === 'tentative-only') {
    return b.priorYearCheck?.unchanged
      ? 'Town-wide funds unchanged (only the Tentative is posted)'
      : 'Only the Tentative is posted'
  }
  const c = netChange(r.year)
  if (!c || c.linesChanged === 0) return 'None'
  if (c.delta === 0) return `${usd(c.increase)} moved between lines, net zero`
  return `${signed(c.delta)} across ${c.linesChanged} line${c.linesChanged === 1 ? '' : 's'}`
}

function adoptionText(r: YearRecord): string {
  const a = r.adoption
  if (a.outcome === 'vote') return `${a.vote}, ${a.date ? day(a.date) : ''}`
  if (a.outcome === 'voted-down') return `${a.vote}, ${a.date ? day(a.date) : ''}; took effect anyway`
  return 'Took effect on Nov 20 without one'
}

/** A year whose line detail does not add up to the book's own totals. */
function unreconciled(r: YearRecord): boolean {
  const b = book(r.year)
  return !!b && b.layout !== 'tentative-only' && !b.reconciliation.complete
}

const outcomeColor = (r: YearRecord) =>
  r.adoption.outcome === 'vote' ? 'var(--rbl-title)' : 'var(--rbl-warn-strong)'

export default function BudgetAdoptionPage() {
  const first = RECORD[0].year
  const last = RECORD[RECORD.length - 1].year
  const withoutVote = counts.noVote + counts.votedDown
  const firstWithoutVote = Math.min(...RECORD.filter((r) => r.adoption.outcome !== 'vote').map((r) => r.year))
  return (
    <PageShell
      title="How Riverhead adopts its budget"
      subtitle={`Every budget from ${first} to ${last}: what the Town Board changed in each Supervisor’s Tentative, whether it changed it before or after the public hearing, and whether it voted to adopt the result. Read from the Town’s own budget books and minutes.`}
    >
      <PlainCallout
        tips={[
          { label: 'The Supervisor proposes', text: 'the Tentative, by Sept 30. It appropriates nothing.' },
          { label: 'The Board decides', text: 'it can change the Tentative into a Preliminary before the hearing, change it again after, and must adopt by Nov 20.' },
          { label: 'If the Board never votes', text: `the Preliminary becomes the budget on Nov 20 anyway (Town Law §109(3)). That has happened ${withoutVote} times since ${firstWithoutVote}.` },
        ]}
      >
        The law describes a sequence: the Board reviews the Supervisor’s Tentative, turns it into its own Preliminary, holds a
        hearing on that, and adopts a budget by vote. Riverhead followed it through the {counts.lastChangedBeforeHearing} budget. Since then the Board has
        made every change after the public hearing, and for a decade it often did not vote to adopt at all.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <Stat label="Budgets read" value={String(counts.years)} sub={`${first}–${last}, every year the Town has posted`} />
        <Stat label="Adopted by a vote" value={String(counts.byVote)} sub={`${counts.supervisorVotedNo.length} over the Supervisor’s own no`} />
        <Stat label="Took effect without one" value={String(withoutVote)} sub={`${counts.noVote} never voted on, ${counts.votedDown} voted down`} warn />
        <Stat label="Last change made before the hearing" value={String(counts.lastChangedBeforeHearing)} sub="every change since has come after it" />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The sequence the law sets</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.7 }}>
          {LAW.map(([when, what, law]) => (
            <li key={when}><strong>{when}</strong> — {what} <span style={{ color: 'var(--rbl-text-muted)' }}>({law})</span></li>
          ))}
        </ol>
      </section>

      <section id="years" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Year by year</h3>
        <p style={{ ...body, marginTop: 0 }}>
          “Board changes” is the difference between the Tentative and the adopted columns of each year’s own budget book, line by line,
          across every fund. “When” and “Adoption” come from the minutes. Open a year below the table for what was changed, what members
          said, and the files it rests on.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Budget</th><th style={th}>Supervisor</th><th style={th}>Board changes</th>
              <th style={th}>When</th><th style={th}>Adoption</th><th style={th}>Tax cap</th>
            </tr></thead>
            <tbody>
              {RECORD.map((r) => (
                <tr key={r.year} id={`row-${r.year}`} data-year={r.year} data-outcome={r.adoption.outcome} data-timing={r.timing}
                  style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800 }}><a href={`#year-${r.year}`} style={{ ...link, textDecoration: 'none' }}>{r.year}</a></td>
                  <td style={td}>{r.supervisor}{r.party && <span style={{ color: 'var(--rbl-text-muted)' }}> ({r.party})</span>}
                    {r.lameDuck && <div style={{ ...muted, fontSize: 11.5 }}>outgoing</div>}</td>
                  <td style={td} data-change>{changeText(r)}{unreconciled(r) && <div style={{ ...muted, fontSize: 11.5 }}>the book does not reconcile</div>}</td>
                  <td style={td}>{TIMING_LABEL[r.timing]}</td>
                  <td style={{ ...td, color: outcomeColor(r), fontWeight: r.adoption.outcome === 'vote' ? 600 : 800 }}>
                    {r.adoption.outcome !== 'vote' && <div>{OUTCOME_LABEL[r.adoption.outcome]}</div>}{adoptionText(r)}
                  </td>
                  <td style={{ ...td, color: overrideState(r) === 'missed' ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-body)' }}>{OVERRIDE_LABEL[overrideState(r)]}</td>
                </tr>
              ))}
              <tr data-year={OUTLOOK.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...td, fontWeight: 800 }}>{OUTLOOK.year}</td>
                <td style={td}>{OUTLOOK.supervisor} <span style={{ color: 'var(--rbl-text-muted)' }}>({OUTLOOK.partyLabel})</span></td>
                <td style={{ ...td, color: 'var(--rbl-text-muted)' }} colSpan={4}>Tentative due this month; see <a href="#outlook" style={link}>what the record suggests</a>.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, marginBottom: 0 }}>
          Party is shown only for Supervisors, where a source gives it; Cardinale’s rests on the{' '}
          <a href={PARTY_SOURCE.url} style={link}>News-Review’s 2017 report</a> that no Democrat had sat on the Board since him.
          “Over the limit, no override law” is the Town auditor’s finding (<a href={AUDIT_SOURCE.url} style={link}>RiverheadLOCAL</a>;
          see <a href={`${base}/tax-cap/`} style={link}>Tax cap</a>).
        </p>
      </section>

      <section style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        {ERAS.map((e) => {
          const s = eraStats(e)
          return (
            <div key={e.from} data-era={`${e.from}-${e.to}`} style={card}>
              <div style={{ color: 'var(--rbl-badge)', fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{e.from}–{e.to}</div>
              <h3 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)', fontSize: 17 }}>{e.title}</h3>
              <p style={{ ...body, fontSize: 14, margin: '0 0 10px' }}>{e.text}</p>
              <div style={muted}>
                {s.years} budgets · {s.byVote} adopted by vote · {s.withoutVote} without one · {s.changed} changed by the Board, net {signed(s.net)}
              </div>
            </div>
          )
        })}
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Each year in the record</h3>
        {RECORD.map((r) => <YearDetail key={r.year} r={r} />)}
      </section>

      <section id="reasons" style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-accent)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Why the Board stopped following the sequence — possible reasons</h3>
        <p style={{ ...body, marginTop: 0 }}>
          These are inferences from the record, not findings. Each lists the years it rests on; none is stated as a motive by anyone in the minutes.
        </p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {REASONS.map((x) => (
            <li key={x.title} style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--rbl-title)' }}>{x.title}.</strong>{' '}
              <span style={body}>{x.text}</span>
              <div style={{ ...muted, marginTop: 3 }}>
                Rests on: {x.years.map((y, i) => <span key={y}>{i > 0 && ', '}<a href={`#year-${y}`} style={link}>{y}</a></span>)}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="outlook" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What it means for {OUTLOOK.year}</h3>
        <p style={{ ...body, marginTop: 0 }}>
          {OUTLOOK.supervisor} prepares the {OUTLOOK.year} Tentative for a Board of four Republicans ({OUTLOOK.board.join(', ')}). The record has two
          stretches when the Board majority and the Supervisor were not aligned. From 2007 to 2009 the Board rewrote Cardinale’s Tentatives
          upward, adopted them over his no, and once let the budget take effect without a vote. In 2019 and 2020 a Board with a
          Republican majority left Jens-Smith’s first budget unadopted and amended her second after she lost. A 4–1 majority can do any
          of those things, and it can supply or withhold the three votes a tax-cap override needs.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.7 }}>
          {OUTLOOK.calendar.map(([d, what, law]) => (
            <li key={d}><strong>{d}</strong> — {what}{law && <span style={{ color: 'var(--rbl-text-muted)' }}> ({law})</span>}</li>
          ))}
        </ul>
        <p style={{ ...muted, marginBottom: 0 }}>
          Precedents: {OUTLOOK.precedents.map((y, i) => <span key={y}>{i > 0 && ', '}<a href={`#year-${y}`} style={link}>{y}</a></span>)}.
          The Tentative itself, against this site’s projection: <a href={`${base}/tentative-${OUTLOOK.year}/`} style={link}>{OUTLOOK.year} Tentative Budget</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How this was built, and what it cannot tell you</h3>
        <p style={{ ...body, marginTop: 0 }}>
          Each adopted budget book prints its stages side by side — Department Requested, Tentative, Preliminary, Adopted — and the
          changes here are read from those columns, line by line, then checked against the same book’s fund recap or Summary page.
          The votes, dates and quotes are read from the Town Clerk’s minutes on CivicClerk; the files that are scanned images were read
          page by page and are marked. A date the minutes did not show is left blank.
        </p>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {LIMITS.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
        <p style={{ ...muted, marginBottom: 0 }}>
          Related: <a href={`${base}/tentative-2027/`} style={link}>2027 Tentative Budget</a> ·{' '}
          <a href={`${base}/tax-cap/`} style={link}>Tax cap</a> · <a href={`${base}/town-history/`} style={link}>Supervisors &amp; Council History</a> ·{' '}
          <a href={`${base}/meetings/`} style={link}>Board votes</a>
        </p>
      </section>
    </PageShell>
  )
}

function YearDetail({ r }: { r: YearRecord }) {
  const b = book(r.year)
  const c = netChange(r.year)
  const lines = c ? c.largest.slice(0, 6) : []
  return (
    <details id={`year-${r.year}`} data-year-detail={r.year} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '10px 0' }}>
      <summary style={{ cursor: 'pointer', color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14.5 }}>
        {r.year} · {r.supervisor} · <span style={{ color: outcomeColor(r) }}>{OUTCOME_LABEL[r.adoption.outcome]}</span>
      </summary>
      <div style={{ paddingTop: 8 }}>
        <p style={{ ...body, marginTop: 0 }}>{r.summary}</p>
        <div style={{ ...muted, marginBottom: 8 }}>
          Board: {r.board.join(', ')}.{' '}
          {r.hearing && <>Hearing {day(r.hearing)}. </>}
          {r.adoption.date && <>{r.adoption.outcome === 'voted-down' ? 'Adoption voted down' : 'Adopted'} {day(r.adoption.date)}{r.adoption.resolution && <>, Res. {r.adoption.resolution}</>}. </>}
          {r.override && <>Override law {day(r.override.date)}, {r.override.vote}. </>}
          {r.lameDuck && <>{r.lameDuck}. </>}
          {r.noticeSalaries === false && <>The hearing notice did not list the elected officials’ salaries. </>}
        </div>
        {lines.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Largest line changes, Tentative to adopted</th>
                <th style={{ ...th, textAlign: 'right' }}>Tentative</th><th style={{ ...th, textAlign: 'right' }}>Adopted</th><th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>{l.name}<div style={{ color: 'var(--rbl-text-muted)', fontSize: 11 }}>{l.account}</div></td>
                    <td style={num}>{usd(l.from)}</td><td style={num}>{usd(l.to)}</td>
                    <td style={{ ...num, fontWeight: 800 }}>{signed(l.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {b && b.layout !== 'tentative-only' && b.zeroedInPreliminary && (
          <p style={muted}>
            The book’s Preliminary column prints {b.zeroedInPreliminary.lines} lines ({usd(b.zeroedInPreliminary.amount)}) as zero that its Adopted
            column restores unchanged — a gap in how that column was produced, left out of the changes above.
          </p>
        )}
        {b && b.layout !== 'tentative-only' && !b.reconciliation.complete && (
          <p style={muted}>This book’s line detail does not add up to its own {b.reconciliation.against.replace(/^the book's /, '')}; its totals are shown as printed.</p>
        )}
        {b && b.layout === 'tentative-only' && b.priorYearCheck && (
          <p style={muted}>
            {b.priorYearCheck.against} reports the 2018 General Fund, Highway and Street Lighting appropriations and levies at exactly the
            Tentative’s figures{b.priorYearCheck.unchanged ? '' : ', except where noted'}.
          </p>
        )}
        {r.quotes.map((q, i) => (
          <blockquote key={i} style={{ margin: '8px 0', padding: '6px 12px', borderLeft: '3px solid var(--rbl-border)', color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55 }}>
            “{q.text}” <span style={{ color: 'var(--rbl-text-muted)' }}>— {q.who}, <a href={q.source.url} style={link}>{q.source.label}</a></span>
          </blockquote>
        ))}
        <div style={muted}>
          Sources: {b && <><a href={b.source.url} style={link}>{b.source.title}</a>; </>}
          {r.sources.map((s, i) => <span key={s.url + i}>{i > 0 && '; '}<a href={s.url} style={link}>{s.label}</a></span>)}
        </div>
      </div>
    </details>
  )
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, color: warn ? 'var(--rbl-warn-strong)' : 'var(--rbl-title)' }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  )
}
