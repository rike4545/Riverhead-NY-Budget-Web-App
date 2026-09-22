import PageShell from '../../components/PageShell'
import {
  SUPERVISOR, ELECTION, context, tests, commitments, claims, STATUS_LABEL, prudence, released,
  type ClaimStatus,
} from '../../lib/supervisor-promises'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '8px 10px', verticalAlign: 'top' as const }

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
              <article key={i} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
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
                {c.records.length > 0 && (
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 6 }}>Records: {c.records.join('; ')}</div>
                )}
              </article>
            )
          })}
        </div>
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
          <a href="#test-one-time" style={{ color: 'var(--rbl-accent)' }}>the use of one-time money</a>, and{' '}
          <a href="#test-requests" style={{ color: 'var(--rbl-accent)' }}>what departments asked for</a>.
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
