import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/officials-pensions.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: 'Elected officials who also collect a public pension',
  description:
    'A transparent, sourced review of every current Town of Riverhead elected official and whether they also collect a New York State public pension while in office — legal, common, and public money either way.',
}

const STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  pension: { bg: '#fff7ed', fg: '#9a3412', border: '#fdba74' },
  unconfirmed: { bg: '#fefce8', fg: '#854d0e', border: '#fde047' },
  active: { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
  none: { bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0' },
  review: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
}
const ORDER = ['pension', 'unconfirmed', 'active', 'none', 'review']

export default function OfficialsPage() {
  const officials = [...data.officials].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
  const pensionCount = data.officials.filter((o) => o.status === 'pension').length
  const labels = data.statusLabels as Record<string, string>

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <div style={{ background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #1f5f8f', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: '#1f3a52', fontSize: 14.5, lineHeight: 1.6 }}>
        <strong>It’s legal — this is disclosure, not an accusation.</strong> {data.legalNote}
      </div>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Current elected officials reviewed" value={String(data.officials.length)} />
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
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#12385b' }}>{o.name}</span>
                  <span style={{ color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{o.office}{o.party && o.party !== '—' ? ` · ${o.party}` : ''}</span>
                </div>
                <span style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}`, fontWeight: 800, fontSize: 12, padding: '3px 11px', borderRadius: 999 }}>
                  {labels[o.status]}
                </span>
              </div>
              <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.55, margin: '10px 0 6px' }}>{o.background}</p>
              <p style={{ color: o.status === 'pension' ? '#9a3412' : '#475569', fontSize: 14, lineHeight: 1.55, margin: 0, fontWeight: o.status === 'pension' ? 700 : 400 }}>{o.pension}</p>
              {o.sources?.length > 0 && (
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>Sources: {o.sources.join(' · ')}</div>
              )}
            </section>
          )
        })}
      </div>

      <section style={{ ...card, marginTop: 16, background: '#f8fafc' }}>
        <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{data.note}</p>
        <p style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0 0' }}>Sources: {data.sources.join(' · ')}</p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#fff7ed' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 26, color: accent ? '#b45309' : '#12385b' }}>{value}</strong>
    </div>
  )
}
