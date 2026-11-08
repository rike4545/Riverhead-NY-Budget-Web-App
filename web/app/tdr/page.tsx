import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BarRows from '../../components/charts/BarRows'
import { ACRE, floorRates, src, tdr, walmartAdditionalCost, walmartHeadroomCredits, walmartSegments, walmartSumCredits } from '../../lib/tdr'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const h3 = { margin: '18px 0 8px', color: 'var(--rbl-title)', fontSize: 18 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { padding: '8px 10px', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 } as const
const td = { padding: '7px 10px' } as const
const n = (v: number, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const usd = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const usd2 = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const cite = (key: string, where: string) => <>{' '}(<a href={src(key).url} style={link}>{src(key).title}</a>, {where})</>

export const metadata = {
  title: 'Transfer of development rights — how Riverhead trades farmland for building room',
  description: 'How Riverhead’s TDR program works: which land can sell credits, where they can be used, what a credit costs, and how the Walmart expansion on Route 58 uses them.',
}

export default function TdrPage() {
  const w = tdr.walmart
  const price = tdr.price.perCredit
  const drc = floorRates.find((r) => r.code === 'DRC')!
  const total = w.maxWithCreditsSquareFeet
  const bought = w.creditsBought.reduce((s, c) => s + c.credits, 0)
  return (
    <PageShell
      title="Transfer of development rights"
      subtitle="How Riverhead lets a builder buy extra building room by paying a farmer not to build: which land can sell credits, where they can be used, what one costs, and how the Walmart expansion on Route 58 uses them."
    >
      <PlainCallout
        tips={[
          { label: 'Sending land', text: `farmland in the ${tdr.sending.district}. Its owner can sell credits, ${tdr.sending.yield.replace('one (1) right', 'one credit')} (one acre), and the land is then preserved for good.` },
          { label: 'Receiving land', text: 'places the Town wants growth, such as Route 58, Calverton and some residential districts. A builder there can exceed the normal limit by buying credits.' },
          { label: 'Preservation credit', text: 'the Code’s name for one development right once it has been separated from the farm and put on a certificate.' },
        ]}
      >
        A credit sells for <strong>about {usd(price)}</strong>, the Town&apos;s planners say. On Route 58 one credit lets a store build{' '}
        {n(drc.perCredit)} more square feet, about {usd2(drc.costPerSquareFoot)} a square foot. The Walmart at {w.address} has bought{' '}
        {n(bought)} credits since 2007. Its proposed {n(w.expansionSquareFeet)} sq. ft. expansion needs {n(w.creditsAdditional, 3)} more,
        about {usd(walmartAdditionalCost)} at that price. The Planning Board&apos;s public hearing on it is{' '}
        <strong>{longDate(w.hearing)}</strong>.
      </PlainCallout>

      <section id="how" aria-labelledby="how-heading" style={card}>
        <h2 id="how-heading" style={h2}>How it works</h2>
        <ol style={{ ...prose, paddingLeft: 22 }}>
          <li>A farm owner in the {tdr.sending.district} asks the Planning Board how many credits the land holds. The rule is{' '}
            {tdr.sending.yield}, which is one credit an acre{cite(tdr.sending.source, tdr.sending.where)}.</li>
          <li>The owner records an easement that ends the land&apos;s development rights and receives a credit certificate. The farm can still
            be farmed and sold; it can never be built on. It then joins the <a href={`${base}/preserved-land/`} style={link}>preserved
            land</a>.</li>
          <li>The owner sells the certificate privately. The Town does not set the price, and there is no TDR bank to buy from (see{' '}
            <a href="#program" style={link}>the program so far</a>).</li>
          <li>A builder in a receiving district buys credits and redeems them with the Planning Board for more floor area or more homes
            than the zoning otherwise allows.</li>
        </ol>
        <p style={prose}>
          No credits are allocated for {tdr.sending.exclusions.join('; ')}{cite(tdr.sending.source, '§ 108-308, page 4')}. The Town&apos;s
          2026 environmental statement on golf cottages still counts one credit as one acre: &ldquo;{tdr.sending.dgeisCheck}&rdquo;
          {cite('tb20261020', 'page 179')}.
        </p>
      </section>

      <section id="program" aria-labelledby="program-heading" style={card}>
        <h2 id="program-heading" style={h2}>The program so far, and is there a bank?</h2>
        <p style={prose}>
          The Planning Department&apos;s count for the 2024 Comprehensive Plan Update: since {tdr.program.since}, over{' '}
          {n(tdr.program.acresPreserved)} acres preserved and about {n(tdr.program.creditsRedeemed)} credits redeemed. About{' '}
          <strong>{n(tdr.program.creditsNotRedeemed)} credits</strong> had been issued to farm owners but not yet used: those are the credits
          a builder could buy{cite(tdr.program.source, tdr.program.where)}.
        </p>
        <BarRows
          title={`Preservation credits, as of ${tdr.program.asOf}`}
          lede="Approximate counts, as the plan gives them."
          rows={[
            { label: 'Redeemed for homes', value: tdr.program.residentialRedeemed, display: `about ${n(tdr.program.residentialRedeemed)}` },
            { label: 'Redeemed for commercial floor area', value: tdr.program.commercialRedeemed, display: `about ${n(tdr.program.commercialRedeemed)}`, note: `Walmart's ${n(bought)} credits are about half of these` },
            { label: 'Issued, not yet redeemed', value: tdr.program.creditsNotRedeemed, display: `about ${n(tdr.program.creditsNotRedeemed)}`, highlight: true },
          ]}
          format={n}
          source={`${tdr.program.attribution}, in the ${src(tdr.program.source).title}.`}
        />
        <p style={{ ...prose, marginTop: 12 }}>
          <strong>There is no TDR bank.</strong> The plan&apos;s recommendation &ldquo;{tdr.bank.recommendation}&rdquo; describes one:
          &ldquo;{tdr.bank.quote}&rdquo; It adds: &ldquo;{tdr.bank.noList}&rdquo;{cite(tdr.bank.source, tdr.bank.where)}. This site found no
          Town Board resolution creating a bank in the meeting records it holds (every regular meeting since January 2025). So buyers and sellers find each other
          privately, and the Town publishes no current count of the credits still available; the 2023 figure above is the latest.
        </p>
      </section>

      <section id="where" aria-labelledby="where-heading" style={card}>
        <h2 id="where-heading" style={h2}>Where credits can be used, and what one buys</h2>
        <p style={prose}>
          From § 301-208 of the Town Code as amended December 17, 2024{cite(tdr.receivingSource, tdr.receivingWhere)}. In the commercial
          and industrial districts a credit buys floor area, up to a cap on the floor-area ratio (building floor area divided by lot area).
        </p>
        <BarRows
          title="Floor area one credit buys, by receiving district"
          lede={`Square feet per credit, and what that comes to per square foot at about ${usd(price)} a credit.`}
          rows={floorRates.map((r) => ({
            label: `${r.name}${r.proposed ? '' : ` (${r.code})`}`,
            value: r.perCredit,
            display: `${n(r.perCredit)} sq. ft.`,
            note: `about ${usd2(r.costPerSquareFoot)} a sq. ft.${r.maxFar != null ? ` · cap ${r.maxFar.toFixed(2)} floor-area ratio` : ' · not yet adopted'}`,
            highlight: r.code === 'DRC',
          }))}
          format={(v) => `${n(v)} sq. ft.`}
          source="§ 301-208 B to K; the golf-course rate is the draft in the October 20, 2026 Town Board packet. Cost per square foot is this site's arithmetic."
        />
        <h3 style={h3}>Residential districts</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>District</th>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>What credits allow</th>
            </tr></thead>
            <tbody>
              {tdr.receiving.filter((r) => r.kind === 'homes').map((r) => (
                <tr key={r.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{r.name} ({r.code})</th>
                  <td data-label="What credits allow" style={td}>{r.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={h3}>The rate has changed</h3>
        <p style={prose}>
          Until December 2024 a credit bought {n(tdr.rateChange.before.squareFeetPerCredit)} square feet of commercial floor area; since then it
          buys {n(tdr.rateChange.after.squareFeetPerCredit)}. That halves the number of credits a store needs for the same building, so each
          addition preserves half as much farmland. A draft rule for golf cottages was also cut in half, from one credit per cottage to one per
          1,200 square feet, after the Town Board worried the cost would deter golf courses{cite(tdr.proposed.source, tdr.proposed.where)}.
        </p>
      </section>

      <section id="walmart" aria-labelledby="walmart-heading" style={card}>
        <h2 id="walmart-heading" style={h2}>Case study: the Walmart on Route 58</h2>
        <p style={prose}>
          The site is {w.acres} acres ({n(w.lotSquareFeet)} sq. ft.) in the {w.zoning} district. Without credits a building may cover 15% of
          the lot, {n(w.baseSquareFeet)} sq. ft. With credits it may reach a 0.30 floor-area ratio, {n(w.maxWithCreditsSquareFeet)} sq. ft.
          Everything above the first figure has to be paid for in credits.
        </p>
        <figure style={{ margin: '8px 0 16px' }}>
          <figcaption style={{ fontSize: 15, fontWeight: 700, color: 'var(--rbl-text-strong)', marginBottom: 8 }}>The site&apos;s floor area, from the site plan</figcaption>
          <div aria-hidden="true" style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--rbl-border)', gap: 2, background: 'var(--rbl-surface)' }}>
            {walmartSegments.map((s) => <div key={s.label} style={{ flex: `${s.value} 0 0`, background: s.color }} />)}
          </div>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 6 }}>
            {walmartSegments.map((s) => (
              <li key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, color: 'var(--rbl-text-body)' }}>
                <span aria-hidden="true" style={{ flex: '0 0 18px', height: 12, borderRadius: 3, background: s.color, border: '1px solid var(--rbl-border)' }} />
                <span>{s.label}: <strong>{n(s.value)} sq. ft.</strong> ({Math.round((s.value / total) * 100)}% of the cap)</span>
              </li>
            ))}
          </ul>
        </figure>

        <h3 style={h3}>How many credits the expansion needs</h3>
        <p style={prose}>The site plan&apos;s own table, row by row. Building area up to 15% of the lot is free; above it, the old rate applies to what was approved before December 2024 and the new rate to what is added now.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>Row</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Square feet</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Sq. ft. per credit</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Credits</th>
            </tr></thead>
            <tbody>
              {w.calculation.map((c) => (
                <tr key={c.label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{c.label}</th>
                  <td data-label="Square feet" style={{ ...td, textAlign: 'right' }}>{n(c.squareFeet, c.squareFeet % 1 ? 1 : 0)}</td>
                  <td data-label="Sq. ft. per credit" style={{ ...td, textAlign: 'right' }}>{n(c.perCredit)}</td>
                  <td data-label="Credits" style={{ ...td, textAlign: 'right' }}>{c.credits > 0 ? '+' : '−'}{n(Math.abs(c.credits), 3)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 700 }} colSpan={3}>Credits required</th>
                                <td data-label="Credits" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{n(walmartSumCredits, 3)}</td>
              </tr>
              {w.creditsBought.map((b) => (
                <tr key={b.approval} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }} colSpan={3}>Bought: {b.approval}; {b.recorded}</th>
                                    <td data-label="Credits" style={{ ...td, textAlign: 'right' }}>−{n(b.credits, 3)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }} colSpan={3}>Conveyed away earlier</th>
                                <td data-label="Credits" style={{ ...td, textAlign: 'right' }}>+{n(w.creditsConveyed, 3)}</td>
              </tr>
              <tr>
                <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 700 }} colSpan={3}>Still to buy</th>
                                <td data-label="Credits" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{n(w.creditsAdditional, 3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...prose, marginTop: 12 }}>
          The Planning Department agrees: &ldquo;{w.staffQuote}&rdquo;{cite(w.source, 'staff report of October 9, 2026, pages 28 and 29')}.
        </p>

        <h3 style={h3}>What it costs, and what it preserves</h3>
        <ul style={prose}>
          <li>The {n(w.creditsAdditional, 3)} credits still needed would cost about <strong>{usd(walmartAdditionalCost)}</strong> at{' '}
            {usd(price)} a credit. That is this site&apos;s estimate: the price is the planners&apos; figure from a different sale, and Walmart
            buys its credits privately.</li>
          <li>The {n(bought)} credits bought in 2007 to 2020 stand for about {n(bought)} acres of farmland preserved, at one credit an acre.
            The Town&apos;s records do not give what was paid for them.</li>
          <li>The room left under the 0.30 cap, {n(w.maxWithCreditsSquareFeet - w.proposedBuildingSquareFeet)} sq. ft., would take about{' '}
            {n(walmartHeadroomCredits, 1)} more credits at today&apos;s rate, roughly {usd(walmartHeadroomCredits * price)}.</li>
          <li>The {n(w.expansionSquareFeet)} sq. ft. figure is the size of the addition. The building grows by {n(w.additionalSquareFeet)} sq. ft.
            over what was approved because the addition goes where the outdoor garden center is.</li>
        </ul>
        <p style={prose}>
          {w.status} The <a href={w.news.url} style={link}>{w.news.title}</a> is a news report, not a Town record.
        </p>
      </section>

      <section id="concerns" aria-labelledby="concerns-heading" style={card}>
        <h2 id="concerns-heading" style={h2}>What residents may want to ask</h2>
        <ul style={prose}>
          <li>The 2024 rate change halved the farmland each commercial addition preserves. Is 3,000 square feet a credit the right balance?
            The 2024 Comprehensive Plan Update itself recommends revisiting the formulas from time to time.</li>
          <li>Prices are set privately, case by case. The Town&apos;s figure rests on one recent sale. The Town publishes no list of trades or
            prices, so residents cannot see what preservation is costing builders.</li>
          <li>Credits fill a gap between what zoning allows and what a site can hold. On Route 58, what traffic, sewer and water capacity
            do the receiving districts have for the extra floor area?</li>
        </ul>
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources</h2>
        <ul style={prose}>
          <li><a href={tdr.code.url} style={link}>{tdr.code.title}</a>. {tdr.code.adopted}. This site cannot read eCode360 automatically,
            so the current § 301-208 is quoted from the copy the Planning Department put in the Town Board&apos;s packet.</li>
          {Object.entries(tdr.sources).map(([k, s]) => <li key={k}><a href={s.url} style={link}>{s.title}</a>.</li>)}
          <li>The credit yield of one per {n(ACRE)} square feet is from the Town&apos;s 2004 TDR law, which the 2018 article replaced. The
            2026 environmental statement still counts one credit as one acre.</li>
        </ul>
      </section>
    </PageShell>
  )
}
