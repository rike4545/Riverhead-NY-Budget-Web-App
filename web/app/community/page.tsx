import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/community.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd0 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const bn = (n: number) => `$${(n / 1e9).toFixed(2)}B`

export const metadata = {
  title: 'Community & tax base — population, valuation, largest taxpayers',
  description:
    "Riverhead's population, the assessed and market value of its tax base, its largest commercial taxpayers, and the assessment stresses (grievance lawsuits, the Friar's Head error) that shift the burden between properties.",
}

export default function CommunityPage() {
  const d = data
  return (
    <PageShell
      title="Community & tax base"
      subtitle="Who and what the Town taxes: population sets the scale of demand for services, and the tax base — the assessed value of all taxable property — is what the levy is spread across."
    >
      <PlainCallout
        tips={[
          { label: 'Population', text: 'roughly 36,000 residents — the number of people the Town’s services and budget must cover.' },
          { label: 'Tax base', text: 'the total value of taxable property. A few big commercial parcels carry an outsized share.' },
          { label: 'Why it matters', text: 'when a large taxpayer wins an assessment reduction, the same levy is re-spread onto everyone else — so the tax base’s health is a resident’s concern.' },
        ]}
      >
        {d.intro}
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Population (2020 Census)" value={d.population.census2020.toLocaleString()} sub={`~${d.population.estimate2024.toLocaleString()} (2024 est.)`} />
        <Stat label="Tax base — full (market) value" value={bn(d.taxBase.impliedFullValuation)} sub="implied from debt limit" accent />
        <Stat label="Debt limit (7% of value)" value={usd0(d.taxBase.debtLimit)} sub={`${d.taxBase.debtLimitExhaustedPct}% used`} />
        <Stat label="Credit rating" value="Aa2" sub="Moody’s" />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>The tax base, explained</h3>
        <ul style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, paddingLeft: 18, margin: 0 }}>
          <li>{d.taxBase.impliedFullValuationNote}</li>
          <li>{d.taxBase.assessmentRatioNote}</li>
          <li>{d.taxBase.assessedChange2023} {d.taxBase.townWideRateChange2023}</li>
          <li>The Town’s outstanding general-obligation debt uses only <strong>{d.taxBase.debtLimitExhaustedPct}%</strong> of its legal debt limit (about {usd0(d.taxBase.outstandingGoDebtApprox)} of a {usd0(d.taxBase.debtLimit)} ceiling) — it carries a Moody’s {d.taxBase.moodyRating.replace(' (Moody’s Investors Service)', '')} rating.</li>
          <li>{d.taxBase.transferTax}</li>
        </ul>
      </section>

      <h2 style={{ color: '#12385b' }}>Largest taxpayers</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, lineHeight: 1.5 }}>{d.largestTaxpayers.note}</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {d.largestTaxpayers.items.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '9px 12px', background: i === 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${i === 0 ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 10 }}>
              <span style={{ fontWeight: 900, color: i === 0 ? '#1e3a8a' : '#94a3b8', minWidth: 20 }}>{i + 1}</span>
              <div>
                <div style={{ fontWeight: 800, color: '#12385b' }}>{t.name}{i === 0 && <span style={{ marginLeft: 8, background: '#1e3a8a', color: 'white', fontSize: 10.5, fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>largest</span>}</div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.45 }}>{t.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #b45309' }}>
        <h3 style={{ marginTop: 0 }}>{d.assessmentStress.headline}</h3>
        <ul style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {d.assessmentStress.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Sources: {d.sources.join(' · ')} Independent public-information project — figures are compiled from public
        records and reporting; the largest-taxpayers list is illustrative of major ratables, not an official ranked
        assessment schedule. Verify against the Town Assessor before relying on them.
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: '#12385b' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
