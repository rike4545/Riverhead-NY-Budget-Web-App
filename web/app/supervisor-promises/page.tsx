import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  SUPERVISOR, ELECTION, context, tests, commitments, claims, STATUS_LABEL, prudence, released, levers,
  type ClaimStatus,
} from '../../lib/supervisor-promises'
import { checks, YEARS as T_YEARS, preparedUnder, firstFound2027, beyondTheDocument, type CheckState } from '../../lib/tentative-transparency'
import { criteria, scores, revenueGrowth, RULE } from '../../lib/restraint-score'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '8px 10px', verticalAlign: 'top' as const }
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const STATE_COLOR: Record<CheckState, string> = {
  yes: 'var(--rbl-success-strong)',
  no: 'var(--rbl-warn-strong)',
  none: 'var(--rbl-text-muted)',
  pending: 'var(--rbl-text-muted)',
}
const surname = (who: string | null) => (who ? who.split(' ').slice(-1)[0] : '—')
const yearHead = (y: number, who: string | null) => (
  <th key={y} style={{ ...th, textAlign: 'left', minWidth: 118 }}>
    {y}<div style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>{surname(who)}</div>
  </th>
)
const pctSigned = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`

// How many claims land in each rating, for the plain-English summary up top.
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const countOf = (status: ClaimStatus) => claims.filter((c) => c.status === status).length
const inWords = (n: number) => NUMBER_WORDS[n] ?? String(n)
const tally = [
  countOf('supported') ? `${inWords(countOf('supported'))} ${countOf('supported') === 1 ? 'holds' : 'hold'} up` : null,
  countOf('partly') ? `${inWords(countOf('partly'))} ${countOf('partly') === 1 ? 'holds' : 'hold'} up in part` : null,
  countOf('unverifiable') ? `${inWords(countOf('unverifiable'))} can’t be checked from the records we use` : null,
  countOf('outside') ? `${inWords(countOf('outside'))} ${countOf('outside') === 1 ? 'isn’t a budget question' : 'aren’t budget questions'}` : null,
].filter(Boolean) as string[]
const tallyText = tally.length > 1 ? `${tally.slice(0, -1).join(', ')} and ${tally[tally.length - 1]}` : tally.join('')

const STATUS_STYLE: Record<ClaimStatus, { bg: string; fg: string }> = {
  supported: { bg: 'var(--rbl-success-bg, var(--rbl-surface-3))', fg: 'var(--rbl-success-strong)' },
  partly: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn-strong)' },
  unverifiable: { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-body)' },
  outside: { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-muted)' },
}

export const metadata = {
  title: 'The Supervisor’s promises and the record',
  description:
    'What Supervisor Jerry Halpin promised and what he says he has done, checked against the Town of Riverhead’s own votes, budgets and resolutions, plus the tests his 2027 budget will answer.',
}

export default function SupervisorPromisesPage() {
  return (
    <PageShell
      title="The Supervisor’s promises and the record"
      subtitle={`What Supervisor ${SUPERVISOR} said he would do, what he says he has done, and what the Town’s own records show.`}
    >
      <PlainCallout
        tips={[
          { label: 'Tentative budget', text: 'the Supervisor’s proposed budget for next year. The Town Board can change it before adopting the final budget by November 20.' },
          { label: 'Levy', text: 'the total amount the Town raises from property taxes.' },
          { label: 'Tax cap', text: 'the State’s limit on how much the levy can grow each year, usually about 2%. The Board can vote to go over it.' },
          { label: 'Fund balance', text: 'money left over from past years: the Town’s savings. Spending it helps one year’s taxes, but then it’s gone.' },
          { label: 'Roll call', text: 'how each of the five Town Board members voted.' },
        ]}
      >
        {SUPERVISOR} became Town Supervisor in January 2026 and is on the ballot again on {ELECTION}. This page checks
        what he promised and what he says he has done against the Town’s own records. Of the claims on his campaign
        site, {tallyText}. The biggest test is still ahead: his first budget, for 2027, which fills in below as soon as the
        Town publishes it.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-accent)' }}>
        <strong style={{ color: 'var(--rbl-title)' }}>How this page works</strong>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '6px 0 0' }}>
          This page doesn’t endorse or oppose anyone, and it doesn’t judge anyone’s character or motives. It puts the
          Supervisor’s own words next to the Town’s own records. We never call a claim false. If the records back up only
          part of a claim, we say which part; if they can’t settle it, we say so. His opponent hasn’t served as Supervisor,
          so there’s no record of his to check here; both candidates’ plans are compared side by side on{' '}
          <a href={`${base}/candidate-cost-benefit/`} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>Candidate Proposals</a>.
          Every vote on this page shows how all five Board members voted.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Background</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }}>
          {context.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The big test: his 2027 budget proposal</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          The 2027 Tentative budget is the first one he prepared. The 2026 budget was his predecessor’s.{' '}
          {released
            ? 'These numbers come straight from the proposal as published.'
            : 'Each row fills in by itself when the Town publishes the proposal on September 24. Nothing is typed in by hand ahead of time.'}{' '}
          Full figures and how we got them: <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-accent)' }}>The 2027 Tentative Budget</a>.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Question</th><th style={th}>How we measure it</th><th style={{ ...th, textAlign: 'right' }}>2027 proposal</th><th style={th}>Compared with</th>
            </tr></thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} id={`test-${t.id}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{t.question}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)' }}>{t.measure}{t.note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 3 }}>{t.note}</div>}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 900, color: t.value ? 'var(--rbl-title)' : 'var(--rbl-text-muted)' }}>{t.value ?? 'Sept 24'}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)', fontSize: 12.5 }}>{t.benchmark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What he promised</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {commitments.map((c, i) => (
            <div key={i} style={{ borderLeft: '3px solid var(--rbl-border-strong)', paddingLeft: 12 }}>
              <div style={{ color: 'var(--rbl-title)', fontSize: 15, lineHeight: 1.5 }}>
                {c.kind === 'quote' ? <>“{c.text}”</> : <>{c.text} <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>(as reported)</span></>}
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 3 }}>
                {c.via && <>{c.via}, in </>}<a href={c.source.url} style={{ color: 'var(--rbl-accent)' }}>{c.source.label}</a>, {c.source.date}
              </div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13, marginTop: 4 }}>
                {c.testedBy.length > 0 && (
                  <>Checked by: {c.testedBy.map((id, j) => {
                    const t = tests.find((x) => x.id === id)
                    return <span key={id}>{j > 0 && ' · '}<a href={`#test-${id}`} style={{ color: 'var(--rbl-accent)' }}>{t?.question ?? id}</a></span>
                  })}</>
                )}
                {c.outside && <span style={{ color: 'var(--rbl-text-muted)' }}>{c.outside}</span>}
                {c.evidence && <span>{c.evidence}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What he says he’s done, and what the records show</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Each claim comes from his campaign website. The Supervisor is one of five votes on the Town Board, so where a
          vote decided something, we show how everyone voted, and the result belongs to the members who carried it.
        </p>
        <div style={{ display: 'grid', gap: 16 }}>
          {claims.map((c, i) => {
            const st = STATUS_STYLE[c.status]
            return (
              <article key={i} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14.5, flex: '1 1 320px' }}>“{c.claim}”</div>
                  <span data-status={c.status} style={{ background: st.bg, color: st.fg, fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{STATUS_LABEL[c.status]}</span>
                </div>
                <p data-summary style={{ color: 'var(--rbl-title)', fontSize: 14.2, lineHeight: 1.55, margin: '8px 0 0', fontWeight: 700 }}>
                  <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800 }}>In short: </span>{c.summary}
                </p>
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: '6px 0 0' }}>{c.finding}</p>
                {c.votes && c.votes.length > 0 && (
                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                        <th style={th}>Resolution</th><th style={th}>What it did</th><th style={th}>Result</th><th style={th}>Halpin</th><th style={th}>How they voted</th>
                      </tr></thead>
                      <tbody>
                        {c.votes.map((v) => (
                          <tr key={v.resolution} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                            <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 700 }}>{v.resolution}<div style={{ color: 'var(--rbl-text-muted)', fontWeight: 400 }}>{v.date}</div></td>
                            <td style={td}>{v.action}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>{v.result}</td>
                            <td style={{ ...td, fontWeight: 800 }}>{v.halpin === 'Aye' ? 'Yes' : v.halpin}</td>
                            <td style={{ ...td, color: 'var(--rbl-text-body)' }}>
                              <div style={{ color: 'var(--rbl-text-muted)' }}>Moved by {v.mover}</div>
                              {v.ayes && <div>Yes: {v.ayes}</div>}
                              {v.nays && <div>No: {v.nays}</div>}
                              {v.abstain && <div>Abstained: {v.abstain}</div>}
                              {!v.ayes && !v.nays && !v.abstain && <span>All five voted yes</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {c.roster && (
                  <div data-roster style={{ marginTop: 8 }}>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginBottom: 4 }}>{c.roster.caption}</div>
                    <div style={{ overflowX: 'auto' }}>
                    <table aria-label={c.roster.caption} style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                        <th style={th}>Position</th><th style={{ ...th, textAlign: 'right' }}>2025</th><th style={{ ...th, textAlign: 'right' }}>2026</th><th style={{ ...th, textAlign: 'right' }}>Change</th>
                      </tr></thead>
                      <tbody>
                        {c.roster.rows.map((r) => {
                          const d = r.y2026 - r.y2025
                          const strong = r.kind === 'subtotal' || r.kind === 'total'
                          return (
                            <tr key={r.label} data-row={r.kind} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', fontWeight: strong ? 800 : 400, fontStyle: r.kind === 'estimate' ? 'italic' : undefined, background: r.kind === 'total' ? 'var(--rbl-surface-2)' : undefined }}>
                              <td style={td}>{r.label}{r.mark && <sup>{r.mark}</sup>}</td>
                              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {r.holder2025 && <div style={{ color: 'var(--rbl-text-muted)' }}>{r.holder2025}</div>}{usd(r.y2025)}
                              </td>
                              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {r.holder2026 && <div style={{ color: 'var(--rbl-text-muted)' }}>{r.holder2026}</div>}{usd(r.y2026)}
                              </td>
                              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {Math.abs(d) < 0.5 ? 'No change' : `${d > 0 ? '+' : '−'}${usd(Math.abs(d))}${r.y2025 > 0 ? ` · ${d > 0 ? '+' : '−'}${Math.abs((d / r.y2025) * 100).toFixed(1)}%` : ''}`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                    {c.roster.notes.map((n, j) => (
                      <p key={j} style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.5, margin: '6px 0 0' }}>{n}</p>
                    ))}
                  </div>
                )}
                {c.records.length > 0 && (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 6 }}>Sources: {c.records.join('; ')}</div>
                )}
                {c.documents && c.documents.length > 0 && (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>
                    Read the documents: {c.documents.map((s, j) => (
                      <span key={s.url}>{j > 0 && '; '}<a href={s.url} style={{ color: 'var(--rbl-accent)' }}>{s.label}</a>, {s.date}</span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section id="levers" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Other things a Supervisor can do, and where each stands</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Here are five other ways a Supervisor could act on taxes or on how the Town is run. For each: who decides, what
          has happened since January and what it’s worth. Only the first is one of his campaign claims. We don’t score these.
          Most need a Board majority, and the Supervisor has one vote of five.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {levers.map((l) => {
            const t = l.testId ? tests.find((x) => x.id === l.testId) : undefined
            return (
              <article key={l.id} id={`lever-${l.id}`} data-lever={l.id} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
                <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14.5 }}>{l.lever}</div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, marginTop: 3 }}>Who decides: {l.whoActs}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>
                  {l.record.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                {l.worth && (
                  <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 0' }}>
                    <strong style={{ color: 'var(--rbl-title)' }}>What it’s worth:</strong> {l.worth}
                  </p>
                )}
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13, marginTop: 6 }}>
                  {t && <>Watch for it in the 2027 budget: <a href={`#test-${t.id}`} style={{ color: 'var(--rbl-accent)' }}>{t.question}</a>{l.link && ' · '}</>}
                  {l.link && <a href={`${base}${l.link.path}`} style={{ color: 'var(--rbl-accent)' }}>{l.link.label}</a>}
                </div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 6 }}>Sources: {l.sources.join('; ')}</div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="transparency" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How open is each budget proposal?</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Neither candidate lists transparency as a campaign promise on Candidate Watch, and his campaign page uses the word
          “accountability” once, without a specific pledge. What we can measure is the part the budget officer controls:
          what goes into the budget proposal itself. We run the same six checks on every year’s proposal, so his first one
          can be compared with the three before it. Where a letter was a scanned image, we read it by hand; the quotes are
          exact.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>What we check</th>{T_YEARS.map((y) => yearHead(y, preparedUnder(y)))}
            </tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} id={`transparency-${c.id}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, minWidth: 220 }}>
                    <div style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>{c.label}</div>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>{c.why}</div>
                  </td>
                  {T_YEARS.map((y) => {
                    const cell = c.cells[y]
                    return (
                      <td key={y} data-state={cell.state} style={td}>
                        <span style={{ fontWeight: 800, color: STATE_COLOR[cell.state] }}>{cell.text}</span>
                        {cell.quote && <div style={{ color: 'var(--rbl-text-body)', fontSize: 12, marginTop: 3 }}>“{cell.quote}”</div>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {firstFound2027 && (
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, marginBottom: 0 }}>
            We first found the 2027 proposal on the Town’s website on {firstFound2027}.
          </p>
        )}
        <h4 style={{ color: 'var(--rbl-title)', margin: '14px 0 6px' }}>Beyond the budget itself</h4>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6 }}>
          {beyondTheDocument.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
          Votes missing from the minutes are tracked on the <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-accent)' }}>Meetings</a> page.
        </p>
      </section>

      <section id="score" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Our scorecard: restraint, scored the same way every year</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          We set this scorecard on {RULE.fixed}, before the 2027 proposal came out, so it couldn’t be adjusted to fit the
          result. It measures restraint, which is what he promised, and scores every year’s proposal the same way, so his
          first one has something to compare against. It’s our analysis, not a fact: a budget can miss every mark and still
          be the sensible one in a year of new contracts or storm damage.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>What we check</th>{scores.map((s) => yearHead(s.year, s.preparedUnder))}
            </tr></thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id} id={`score-${c.id}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, minWidth: 220 }}>
                    <div style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>{c.test}</div>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>His promise: {c.promise}</div>
                  </td>
                  {scores.map((s) => {
                    const r = s.results[c.id]
                    const state = r.met === null ? 'pending' : r.met ? 'yes' : 'no'
                    return (
                      <td key={s.year} data-met={state} style={td}>
                        {r.met === null
                          ? <span style={{ color: 'var(--rbl-text-muted)' }}>{s.released ? 'Not yet measurable' : 'Sept 24'}</span>
                          : <><span style={{ fontWeight: 800, color: STATE_COLOR[state] }}>{r.met ? 'Met' : 'Not met'}</span><div style={{ fontSize: 12, color: 'var(--rbl-text-body)' }}>{r.value}</div></>}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...td, fontWeight: 900, color: 'var(--rbl-title)' }}>Score</td>
                {scores.map((s) => (
                  <td key={s.year} data-score={s.year} style={{ ...td, fontWeight: 900, fontSize: 15, color: 'var(--rbl-title)' }}>
                    {s.measured ? `${s.met} of ${s.measured}` : 'Sept 24'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>
          Shown but not scored: growth in General Fund revenue other than property taxes,{' '}
          {revenueGrowth.filter((r) => r.value !== null).map((r) => `${r.year} ${pctSigned(r.value as number)}`).join(', ')}.
          A budget can hold taxes down by assuming more revenue, so scoring it would reward optimism.
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          We use a 2% line everywhere on this site. It’s stricter than the legal limit, which the Town doesn’t publish (see{' '}
          <a href={`${base}/tax-cap/`} style={{ color: 'var(--rbl-accent)' }}>Tax Cap</a>). Every other mark is “no worse
          than the year before.” If we ever change these rules, we’ll date the change here and keep the earlier scores.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-warn)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>{prudence.question}</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{prudence.framing}</p>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }}>
          {prudence.considerations.map((c, i) => <li key={i} style={{ marginBottom: 6 }}>{c}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, marginBottom: 0 }}>
          The evidence is in the tables above: <a href="#test-cap" style={{ color: 'var(--rbl-accent)' }}>taxes against the cap</a>,{' '}
          <a href="#test-ran-against" style={{ color: 'var(--rbl-accent)' }}>against the increase he ran on</a>,{' '}
          <a href="#test-one-time" style={{ color: 'var(--rbl-accent)' }}>the use of savings</a>,{' '}
          <a href="#test-requests" style={{ color: 'var(--rbl-accent)' }}>what departments asked for</a> and{' '}
          <a href="#test-office" style={{ color: 'var(--rbl-accent)' }}>his own office’s payroll</a>, plus{' '}
          <a href="#levers" style={{ color: 'var(--rbl-accent)' }}>where each of the other options stands</a>. Our own
          measure is <a href="#score" style={{ color: 'var(--rbl-accent)' }}>the scorecard</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How we rate claims</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>
          <li><strong>{STATUS_LABEL.supported}</strong>: the Town’s records show what the claim says.</li>
          <li><strong>{STATUS_LABEL.partly}</strong>: the records back up part of it, and the finding says which part.</li>
          <li><strong>{STATUS_LABEL.unverifiable}</strong>: the records we check neither confirm nor contradict it. That isn’t evidence against the claim.</li>
          <li><strong>{STATUS_LABEL.outside}</strong>: not a budget or voting matter, so we don’t rate it.</li>
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginBottom: 0 }}>
          Items marked “as reported” are someone else’s description of his campaign, not his own words, and each says whose
          it is. Votes come from the Town Board minutes, or from the official agenda packet when the minutes leave them out.
        </p>
      </section>
    </PageShell>
  )
}
