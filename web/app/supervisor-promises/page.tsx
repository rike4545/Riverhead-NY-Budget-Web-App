import PageShell from '../../components/PageShell'
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

const STATUS_STYLE: Record<ClaimStatus, { bg: string; fg: string }> = {
  supported: { bg: 'var(--rbl-success-bg, var(--rbl-surface-3))', fg: 'var(--rbl-success-strong)' },
  partly: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn-strong)' },
  unverifiable: { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-body)' },
  outside: { bg: 'var(--rbl-surface-3)', fg: 'var(--rbl-text-muted)' },
}

export const metadata = {
  title: 'The Supervisor’s promises and the record',
  description:
    'Supervisor Jerry Halpin’s own commitments and claims, checked against the Town of Riverhead’s own records — resolutions, roll calls and budgets — and the tests the 2027 Tentative Budget will answer.',
}

export default function SupervisorPromisesPage() {
  return (
    <PageShell
      title="The Supervisor’s promises and the record"
      subtitle={`What Supervisor ${SUPERVISOR} said he would do and says he has done, checked against records the Town itself publishes — and the tests his first budget, the 2027 Tentative, will answer.`}
    >
      <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-accent)' }}>
        <strong style={{ color: 'var(--rbl-title)' }}>What this page is, and is not.</strong>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '6px 0 0' }}>
          It is not an endorsement or an opposition, and it does not judge character or intent. It sets the Supervisor’s own
          published words beside the Town’s own records. It never calls a statement false: where the record contradicts part
          of a claim it says which part, and where the record cannot settle a claim it says that. He is on the {ELECTION} ballot;
          his opponent has no record as Supervisor to check, so both platforms are weighed evenly on{' '}
          <a href={`${base}/candidate-cost-benefit/`} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>Candidate Proposals</a>.
          Every vote below shows the full roll call.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Context</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }}>
          {context.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Put to the test: the 2027 Tentative</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          The 2027 Tentative is the first budget prepared under him; the 2026 budget was his predecessor’s.{' '}
          {released
            ? 'These are computed from the Tentative as published.'
            : 'Each of these fills in on its own when the Town publishes the Tentative, presented September 24. Nothing here is written in by hand beforehand.'}{' '}
          Figures and method: <a href={`${base}/tentative-2027/`} style={{ color: 'var(--rbl-accent)' }}>The 2027 Tentative Budget</a>.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Question</th><th style={th}>Measure</th><th style={{ ...th, textAlign: 'right' }}>2027 Tentative</th><th style={th}>Against</th>
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
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What he committed to</h3>
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
                  <>Tested by: {c.testedBy.map((id, j) => {
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
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What he says he has done, checked</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Each claim is from his campaign site. The Supervisor casts one vote of five, so where a vote decided the matter
          the roll call is shown, and the outcome belongs to whoever carried it.
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
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: '8px 0 0' }}>{c.finding}</p>
                {c.votes && c.votes.length > 0 && (
                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                        <th style={th}>Resolution</th><th style={th}>Action</th><th style={th}>Result</th><th style={th}>Supervisor</th><th style={th}>Roll call</th>
                      </tr></thead>
                      <tbody>
                        {c.votes.map((v) => (
                          <tr key={v.resolution} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                            <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 700 }}>{v.resolution}<div style={{ color: 'var(--rbl-text-muted)', fontWeight: 400 }}>{v.date}</div></td>
                            <td style={td}>{v.action}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>{v.result}</td>
                            <td style={{ ...td, fontWeight: 800 }}>{v.halpin}</td>
                            <td style={{ ...td, color: 'var(--rbl-text-body)' }}>
                              <div style={{ color: 'var(--rbl-text-muted)' }}>Moved: {v.mover}</div>
                              {v.ayes && <div>Aye: {v.ayes}</div>}
                              {v.nays && <div>No: {v.nays}</div>}
                              {v.abstain && <div>Abstained: {v.abstain}</div>}
                              {!v.ayes && !v.nays && !v.abstain && <span>All five aye</span>}
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
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 6 }}>Records: {c.records.join('; ')}</div>
                )}
                {c.documents && c.documents.length > 0 && (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>
                    Documents: {c.documents.map((s, j) => (
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
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Other levers, and where each stands</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Five levers a Supervisor can reach for, set against the record since January: who can act, what has happened so
          far, and what each is worth. Only the first appears among his campaign’s own claims. None is scored. Most need a
          Board majority, and the Supervisor is one of five votes.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {levers.map((l) => {
            const t = l.testId ? tests.find((x) => x.id === l.testId) : undefined
            return (
              <article key={l.id} id={`lever-${l.id}`} data-lever={l.id} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
                <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14.5 }}>{l.lever}</div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, marginTop: 3 }}>Who can act: {l.whoActs}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>
                  {l.record.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                {l.worth && (
                  <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 0' }}>
                    <strong style={{ color: 'var(--rbl-title)' }}>What it is worth:</strong> {l.worth}
                  </p>
                )}
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13, marginTop: 6 }}>
                  {t && <>Measured on the 2027 Tentative: <a href={`#test-${t.id}`} style={{ color: 'var(--rbl-accent)' }}>{t.question}</a>{l.link && ' · '}</>}
                  {l.link && <a href={`${base}${l.link.path}`} style={{ color: 'var(--rbl-accent)' }}>{l.link.label}</a>}
                </div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 6 }}>Records: {l.sources.join('; ')}</div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="transparency" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Transparency: what each Tentative shows</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Transparency is not a plank in either candidate’s platform as Candidate Watch records them, and his campaign page
          uses the word “accountability” once, without a specific commitment. What the record can measure is the part the
          budget officer controls: what goes into the Tentative itself. The same six checks are applied to each Tentative,
          so his first one is read against the three before it. Where a letter is a scanned image, the site read it by hand;
          the quotes are exact.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Check</th>{T_YEARS.map((y) => yearHead(y, preparedUnder(y)))}
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
            This site first found the 2027 Tentative on the Town’s website on {firstFound2027}.
          </p>
        )}
        <h4 style={{ color: 'var(--rbl-title)', margin: '14px 0 6px' }}>Outside the budget document</h4>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6 }}>
          {beyondTheDocument.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
          Votes the minutes omit: <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-accent)' }}>Meetings</a>.
        </p>
      </section>

      <section id="score" style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The scoring rule: restraint, scored the same way every year</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          This is the site’s own scoring rule, fixed on {RULE.fixed}, before the 2027 Tentative was presented, so it
          could not be tuned to the result. It scores restraint, which is what he promised, and scores every Tentative with
          complete data the same way, so his first budget has a baseline. It is analysis, not a fact: a Tentative can fail
          every criterion and still be the prudent one in a year of new contracts or storm damage.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Criterion</th>{scores.map((s) => yearHead(s.year, s.preparedUnder))}
            </tr></thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id} id={`score-${c.id}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, minWidth: 220 }}>
                    <div style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>{c.test}</div>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>Tests: {c.promise}</div>
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
          Reported, not scored: General Fund revenue growth other than the levy,{' '}
          {revenueGrowth.filter((r) => r.value !== null).map((r) => `${r.year} ${pctSigned(r.value as number)}`).join(', ')}.
          A Tentative can raise its revenue estimates to hold the levy down, so scoring revenue would reward optimism.
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          The 2% line is the reference the site uses everywhere. It is stricter than the legal levy limit, which the Town does
          not print (<a href={`${base}/tax-cap/`} style={{ color: 'var(--rbl-accent)' }}>Tax Cap</a>). Every other threshold is
          “no worse than the year before.” Any change to these criteria will be dated here, with the earlier scores kept.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-warn)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>{prudence.question}</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{prudence.framing}</p>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }}>
          {prudence.considerations.map((c, i) => <li key={i} style={{ marginBottom: 6 }}>{c}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, marginBottom: 0 }}>
          The evidence is the table above: <a href="#test-cap" style={{ color: 'var(--rbl-accent)' }}>the levy against the cap</a>,{' '}
          <a href="#test-ran-against" style={{ color: 'var(--rbl-accent)' }}>against the increase he ran on</a>,{' '}
          <a href="#test-one-time" style={{ color: 'var(--rbl-accent)' }}>the use of one-time money</a>,{' '}
          <a href="#test-requests" style={{ color: 'var(--rbl-accent)' }}>what departments asked for</a> and{' '}
          <a href="#test-office" style={{ color: 'var(--rbl-accent)' }}>his own office’s payroll</a>, and{' '}
          <a href="#levers" style={{ color: 'var(--rbl-accent)' }}>where each of the other levers stands</a>. The site’s own
          measure of it is <a href="#score" style={{ color: 'var(--rbl-accent)' }}>the scoring rule</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How claims are marked</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>
          <li><strong>{STATUS_LABEL.supported}</strong> — the Town’s records show what the claim says.</li>
          <li><strong>{STATUS_LABEL.partly}</strong> — the records show part of it; the finding says which part.</li>
          <li><strong>{STATUS_LABEL.unverifiable}</strong> — the records this site reads neither confirm nor contradict it. That is not evidence against the claim.</li>
          <li><strong>{STATUS_LABEL.outside}</strong> — not a budget or voting matter, so not assessed here.</li>
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginBottom: 0 }}>
          Items marked “as reported” are someone else’s account of his campaign, not his own words; each names whose account
          it is. Roll calls are from the Town Board minutes and, where the minutes omit them, the official Agenda Packet.
        </p>
      </section>
    </PageShell>
  )
}
