import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/officials-pensions.json'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'Elected officials who also collect a public pension',
  description:
    'A transparent, sourced review of Town of Riverhead elected officials and whether they also collect a New York State public pension while in office — legal, common, and public money either way.',
}

const STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  pension: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn-strong)', border: 'var(--rbl-warn-border)' },
  unconfirmed: { bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn-strong)', border: '#fde047' },
  active: { bg: 'var(--rbl-info-bg)', fg: 'var(--rbl-info-text)', border: 'var(--rbl-info-border)' },
  none: { bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)', border: 'var(--rbl-success-border)' },
  review: { bg: 'var(--rbl-surface-2)', fg: 'var(--rbl-text-body)', border: 'var(--rbl-border-subtle)' },
}
const ORDER = ['pension', 'unconfirmed', 'active', 'none', 'review']

export default function OfficialsPage() {
  const officials = [...data.officials].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
  const pensionCount = data.officials.filter((o) => o.status === 'pension').length
  const labels = data.statusLabels as Record<string, string>

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderLeft: '6px solid var(--rbl-accent-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: 'var(--rbl-info-text)', fontSize: 14.5, lineHeight: 1.6 }}>
        <strong>It’s legal — this is disclosure, not an accusation.</strong> {data.legalNote}
      </div>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Elected officials reviewed" value={String(data.officials.length)} />
        <Stat label="Collect a public pension while serving" value={String(pensionCount)} accent />
        <Stat label="Still-active career public employees" value={String(data.officials.filter((o) => o.status === 'active').length)} />
      </section>

      <PlainCallout title="What counts here">
        We flag officials <strong>collecting</strong> a New York pension while in office — retirees from a government
        career. People still working a public job (even a long one) are <em>building</em> a pension, not drawing one, so
        they’re listed separately. Private-sector business owners have no public pension at all.
      </PlainCallout>

      <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
        {officials.map((o) => {
          const s = STYLE[o.status] ?? STYLE.review
          return (
            <section key={o.name} style={{ ...card, borderLeft: `6px solid ${s.border}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--rbl-title)' }}>{o.name}</span>
                  <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 700, marginLeft: 8 }}>{o.office}{o.party && o.party !== '—' ? ` · ${o.party}` : ''}</span>
                </div>
                <span style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}`, fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                  {labels[o.status]}
                </span>
              </div>
              <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.55, margin: '10px 0 6px' }}>{o.background}</p>
              <p style={{ color: o.status === 'pension' ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: 0, fontWeight: o.status === 'pension' ? 700 : 400 }}>{o.pension}</p>
              {o.sources?.length > 0 && (
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>Sources: {o.sources.join(' · ')}</div>
              )}
            </section>
          )
        })}
      </div>

      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-violet)' }}>
        <div style={{ color: 'var(--rbl-violet)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>Coming up</div>
        <h3 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)' }}>The 2026 Town Supervisor race</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          Riverhead&apos;s next Supervisor election is in <strong>November 2026</strong>: Republican councilman
          {' '}<strong>Kenneth Rothwell</strong> (nominated by the Riverhead GOP in February 2026) against incumbent Democrat
          {' '}<strong>Jerry Halpin</strong>, who won the seat by 37 votes in 2025. New York&apos;s shift toward even-year
          local elections is what puts this contest on the 2026 ballot so soon after the last one.
        </p>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>Sources: Riverhead News-Review, “Riverhead GOP nominate Kenneth Rothwell for town supervisor” (Feb. 2026) · NYS Board of Elections, even-year local-elections guidance (2025).</div>
      </section>

      <section style={{ ...card, marginTop: 12, background: 'var(--rbl-surface-2)' }}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{data.note}</p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0 0' }}>Sources: {data.sources.join(' · ')}</p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 26, color: accent ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
