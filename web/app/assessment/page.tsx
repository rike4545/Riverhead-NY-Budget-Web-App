import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BarRows from '../../components/charts/BarRows'
import DivergingBars from '../../components/charts/DivergingBars'
import { assessorPage, classChanges, exemptions, final, homes, marketOf, schoolDistricts, tentative, townTaxable, uniformPercent, whollyExempt } from '../../lib/assessment'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const n = (v: number) => Math.round(v).toLocaleString('en-US')
const usd = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const big = (v: number) => (Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)} billion` : `$${(v / 1e6).toFixed(1)} million`)
const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const upct = (v: number) => `${(v * 100).toFixed(2)}%`
const rollDate = (s: string | null) => (s ? new Date(s.replace(/^(\w)(\w+)/, (_m, a: string, b: string) => a + b.toLowerCase())).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'not stated')
const th = { padding: '8px 10px', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 } as const
const td = { padding: '7px 10px' } as const

export const metadata = {
  title: 'Assessment roll — what Riverhead’s property is worth, by kind',
  description: 'Graphs from the Assessor’s 2026 tentative and final rolls: market value by property class, exemptions, one-family home values and what changed between the two rolls.',
}

export default function AssessmentPage() {
  const g = final.grandTotals
  const market = marketOf(g.assessedTotal)
  const res = final.byClass.find((c) => c.code === '2')!
  const com = final.byClass.find((c) => c.code === '4')!
  const totalMarket = final.byClass.reduce((s, c) => s + c.marketValue, 0)
  const change = g.assessedTotal - tentative.grandTotals.assessedTotal
  const star = exemptions.groups.find((x) => x.name.startsWith('STAR'))
  const townExempt = exemptions.groups.filter((x) => x.town > 0)
  const example = 46_300
  // $100,000 bands up to $1 million, then wider ones: 21 bands are too many to read on a phone.
  const groups = [[0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 15], [15, 20], [20, 21]]
  const money = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)} million` : `$${v / 1000}K`)
  const homeBands = groups.map(([a, z]) => {
    const bs = homes.bands.slice(a, z)
    const from = bs[0].from
    const to = bs[bs.length - 1].to
    return {
      label: to == null ? `${money(from)} and up` : from === 0 ? `Under ${money(to)}` : `${money(from)} to ${money(to)}`,
      homes: bs.reduce((t, b) => t + b.homes, 0),
      median: homes.median >= from && (to == null || homes.median < to),
    }
  })
  return (
    <PageShell
      title="Assessment roll"
      subtitle="What the Town's property is worth, by kind, from the Assessor's 2026 tentative and final assessment rolls. Totals only: no owner, address or single property."
    >
      <PlainCallout
        tips={[
          { label: 'Assessed value', text: `Riverhead assesses property at ${upct(uniformPercent)} of its market value (the State calls this the uniform percentage). An assessed value of ${usd(example)} means a market value of about ${usd(marketOf(example))}.` },
          { label: 'Taxable value', text: 'the assessed value less exemptions. Tax rates are applied to it, so an exemption on one property shifts its share of the levy onto everyone else.' },
          { label: 'Two rolls', text: 'the tentative roll comes out in May; owners can grieve their assessment; the final roll in September is what the 2027 tax bills use.' },
        ]}
      >
        The 2026 final roll lists <strong>{n(g.parcels)} parcels</strong> assessed at {usd(g.assessedTotal)}, which is a market value of
        about <strong>{big(market)}</strong>. Homes make up {pct(res.marketValue / totalMarket)} of that value and commercial
        property {pct(com.marketValue / totalMarket)}. After exemptions, {usd(townTaxable)} of the assessed value is taxable for the
        Town&apos;s tax: {pct(townTaxable / g.assessedTotal)} of the roll.
      </PlainCallout>

      <section id="by-class" aria-labelledby="by-class-heading" style={card}>
        <h2 id="by-class-heading" style={h2}>What the Town&apos;s property is worth, by kind</h2>
        <BarRows
          title="Market value by property class, 2026 final roll"
          lede="Each class is the State's property-class code. Market value is the roll's own full market value for each parcel, added up."
          rows={final.byClass.map((c) => ({ label: c.name, value: c.marketValue, display: big(c.marketValue), note: `${n(c.parcels)} parcels · ${pct(c.marketValue / totalMarket)} of the value` }))}
          format={big}
          source={`${final.title}. Every parcel record, added up by class; the sums equal the roll's own section totals.`}
        />
        <p style={{ ...prose, fontSize: 15, marginTop: 12 }}>
          Community services (class 600) are schools, churches, hospitals, libraries and the like; public services (800) are utilities
          and pipelines; class 900 is mostly parkland and preserved open space.
        </p>
      </section>

      <section id="homes" aria-labelledby="homes-heading" style={card}>
        <h2 id="homes-heading" style={h2}>What a one-family home is worth</h2>
        <p style={prose}>
          The roll&apos;s market values for the Town&apos;s {n(homes.count)} taxable one-family homes. The median is{' '}
          <strong>{usd(homes.median)}</strong>: half are worth less and half more. The middle half fall between {usd(homes.lowerQuartile)}{' '}
          and {usd(homes.upperQuartile)}.
        </p>
        <BarRows
          title="One-family homes by market value"
          lede="Homes in each band of the roll's full market value. The band holding the median is highlighted."
          rows={homeBands.map((b) => ({ label: b.label, value: b.homes, display: n(b.homes), highlight: b.median }))}
          format={n}
          source={`${final.title}, class 210 on the taxable section.`}
        />
        <p style={{ ...prose, fontSize: 15, marginTop: 10 }}>
          A roll&apos;s market value is the assessment divided by {upct(uniformPercent)}, valued as of {rollDate(final.valuationDate)}. It is not a
          sale price or an appraisal of any one house.
        </p>
      </section>

      <section id="exemptions" aria-labelledby="exemptions-heading" style={card}>
        <h2 id="exemptions-heading" style={h2}>What is exempt, and why</h2>
        <p style={prose}>
          {n(g.sections['8']?.parcels ?? 0)} parcels are wholly exempt: {usd(whollyExempt)} assessed, about {big(marketOf(whollyExempt))} of
          market value. Most are owned by governments, schools and nonprofits. Partial exemptions such as veterans&apos;, seniors&apos; and farm
          exemptions lower the taxable value of thousands more. The chart shows each group&apos;s reduction to the value the Town&apos;s tax is
          levied on.
        </p>
        <BarRows
          title="Exemptions from the Town tax, by kind"
          lede="Assessed value taken off the Town's taxable roll by each kind of exemption, 2026 final roll."
          rows={townExempt.map((x) => ({ label: x.name, value: x.town, display: `${usd(x.town)}`, note: `${n(x.parcels)} parcels · about ${big(marketOf(x.town))} of market value` }))}
          format={usd}
          source={`${final.title}, exemption summary: ${n(exemptions.total.parcels)} exemptions totalling ${usd(exemptions.total.town)} for the Town.`}
        />
        {star ? (
          <p style={{ ...prose, fontSize: 15, marginTop: 12 }}>
            STAR is a school-tax exemption only: it takes {usd(star.school)} off the school districts&apos; taxable value on{' '}
            {n(star.parcels)} homes and nothing off the Town&apos;s. IDA exemptions are for businesses that receive a tax break from the
            Town&apos;s Industrial Development Agency, which usually pay a PILOT (payment in lieu of taxes) instead; see the{' '}
            <a href={`${base}/budget-flow/`} style={link}>budget flow</a>.
          </p>
        ) : null}
      </section>

      <section id="changes" aria-labelledby="changes-heading" style={card}>
        <h2 id="changes-heading" style={h2}>What changed between the tentative and final rolls</h2>
        <p style={prose}>
          The final roll&apos;s assessed value is {usd(Math.abs(change))} {change < 0 ? 'lower' : 'higher'} than the tentative roll&apos;s,
          about {big(Math.abs(marketOf(change)))} of market value. Changes between the two rolls include the Board of Assessment Review&apos;s
          decisions on grievances, corrections and the State&apos;s values for utility property; the rolls do not say which caused each change.
        </p>
        <DivergingBars
          title="Change in assessed value, tentative to final, by class"
          lede="Assessed dollars. Most classes did not change."
          rows={classChanges.filter((c) => c.assessed !== 0).map((c) => ({ label: c.code + '00', value: c.assessed, display: `${c.assessed > 0 ? '+' : '−'}${usd(Math.abs(c.assessed))}`, note: c.name }))}
          positive={{ label: 'Higher on the final roll', color: 'var(--rbl-series-teal)' }}
          negative={{ label: 'Lower on the final roll', color: 'var(--rbl-series-gold)' }}
          source={`${tentative.title} and ${final.title}.`}
        />
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>Class</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Parcels</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Tentative assessed</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Final assessed</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Final market value</th>
            </tr></thead>
            <tbody>
              {final.byClass.map((c) => {
                const t = tentative.byClass.find((x) => x.code === c.code)!
                return (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{c.code}00 · {c.name}</th>
                    <td data-label="Parcels" style={{ ...td, textAlign: 'right' }}>{n(c.parcels)}</td>
                    <td data-label="Tentative assessed" style={{ ...td, textAlign: 'right' }}>{usd(t.assessedTotal)}</td>
                    <td data-label="Final assessed" style={{ ...td, textAlign: 'right' }}>{usd(c.assessedTotal)}</td>
                    <td data-label="Final market value" style={{ ...td, textAlign: 'right' }}>{big(c.marketValue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="homes-kinds" aria-labelledby="homes-kinds-heading" style={card}>
        <h2 id="homes-kinds-heading" style={h2}>Kinds of homes</h2>
        <BarRows
          title="Residential parcels by kind, 2026 final roll"
          lede="The State's residential class codes. Condominium units are counted as one-family homes."
          rows={final.residential.slice(0, 8).map((c) => ({ label: c.name, value: c.parcels, display: n(c.parcels), note: `about ${big(c.marketValue)} of market value` }))}
          format={n}
          source={`${final.title}.`}
        />
      </section>

      <section id="schools" aria-labelledby="schools-heading" style={card}>
        <h2 id="schools-heading" style={h2}>School districts</h2>
        <p style={prose}>Most of the Town is in the Riverhead Central School District; parts of the west and east lie in neighboring districts.</p>
        <BarRows
          title="Assessed value by school district, 2026 final roll"
          rows={schoolDistricts.map((s) => ({ label: s.name, value: s.assessedTotal, display: usd(s.assessedTotal), note: `${n(s.parcels)} parcels` }))}
          format={usd}
          source={`${final.title}, school district summary.`}
        />
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li>The <a href={final.url} style={link}>{final.title}</a> and the <a href={tentative.url} style={link}>{tentative.title}</a>, from
            the <a href={assessorPage} style={link}>Assessor&apos;s page</a>. Valuation date {rollDate(final.valuationDate)}; taxable status date {rollDate(final.taxableStatusDate)}.</li>
          <li>Every parcel record on each roll is added up by its property class. The sums match the roll&apos;s own totals for each roll
            section, parcel for parcel and dollar for dollar, or the page is not rebuilt.</li>
          <li>Roll sections: taxable, State-owned land, special franchises (utility lines in streets, valued by the State), utilities and
            wholly exempt. Grand totals and the school and exemption summaries are the roll&apos;s own pages.</li>
          <li>This page publishes totals only. The rolls themselves are public and list each owner; look up one property on the
            Assessor&apos;s roll, not here.</li>
          <li>For what the Town&apos;s tax rate does with these values, see <a href={`${base}/tax-bill/`} style={link}>your tax bill</a>.</li>
        </ul>
      </section>
    </PageShell>
  )
}
