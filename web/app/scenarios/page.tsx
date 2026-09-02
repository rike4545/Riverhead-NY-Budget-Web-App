import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CapBalancer from '../../components/CapBalancer'
import p from '../../public/data/budget-2027-prediction.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'What-if scenarios — balance the 2027 budget under the tax cap',
  description:
    'Interactive: close the ~$2.3M gap between predicted 2027 spending and what the tax cap allows, using your own mix of spending trims, buyout savings, new revenue, and reserves — plus grounded scenarios on the surplus, the buyout, and debt.',
}

const cg = p.capGap
const grounded = [
  {
    kicker: 'Using a one-time surplus', title: 'What should the Town do with a surplus?',
    body: <>The General Fund ended 2025 with a <strong>{usd(5003327)}</strong> surplus and about <strong>$33.4M</strong> in reserves. A windfall can hold taxes down for a year, top up the rainy-day fund, or fix up parks and replace vehicles — but one-time money spent on recurring costs just reopens the hole next year.</>,
    href: `${base}/annual-report/`, cta: 'See the actual results',
  },
  {
    kicker: 'Workforce turnover', title: 'What does the retirement buyout really save?',
    body: <>The buyout looks like big salary savings, but the honest number is smaller: ranked police retirements trigger promotion chains (the real saving lands on a rookie at the bottom, ~$95k each), and every retiree keeps ~$17k/yr of lifetime health coverage. Net realistic savings land well below the headline.</>,
    href: `${base}/buyout/`, cta: 'See the buyout analysis',
  },
  {
    kicker: 'Debt & big projects', title: 'How much is the Town borrowing against the future?',
    body: <>Riverhead has used budget adjustments to pay down the Town Square bond-anticipation note and a 2018 refunding bond, and its debt sits at <strong>6.74%</strong> of the legal limit. Neither resolution states an amount, so the paydowns cannot be sized from the record. But debt service and big capital projects compete directly with the operating budget for the same tax dollars.</>,
    href: `${base}/town-square/`, cta: 'Follow the Town Square money',
  },
]

export default function ScenariosPage() {
  return (
    <PageShell title="What-if scenarios" subtitle="Play out choices the Town could make — starting with the big one for next year: can it fund services without blowing past the tax cap? These are illustrations for thinking, not Town policy.">
      <PlainCallout title="Start with the 2027 squeeze">
        Our line-by-line model predicts 2027 spending rises about <strong>{p.totals.pct}%</strong>, which pushes the tax
        levy roughly <strong>{cg.predictedLevyPct}%</strong> — over the ~{cg.capBasePct}% cap by about <strong>{usd(cg.gap)}</strong>.
        The tool below lets you try to close that gap yourself. Drag the sliders and watch whether you land under the cap.
      </PlainCallout>

      <h2 style={{ color: 'var(--rbl-title)', marginBottom: 6 }}>Balance the 2027 budget under the tax cap</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, marginTop: 0, marginBottom: 14 }}>
        Starting point: a predicted levy of <strong>{usd(cg.predictedLevy)}</strong> against a cap ceiling near
        {' '}<strong>{usd(cg.allowedLevy)}</strong>. Find <strong>{usd(cg.gap)}</strong> and you&apos;re under the cap with no override.
      </p>
      <CapBalancer
        levy2026={p.levyEstimate.levy2026}
        predictedLevy={cg.predictedLevy}
        allowedLevy={cg.allowedLevy}
        approp2027={p.totals.appropriations2027}
        capPct={cg.capBasePct}
      />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55, margin: '14px 0 24px' }}>
        Prefer the written version? The <a href={`${base}/predict-2027/`} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>2027 prediction</a> lays
        out the same levers with real magnitudes, and the <a href={`${base}/tax-cap/`} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>Tax Cap page</a> covers
        what a proper override takes if the Board decides the services are worth it.
      </p>

      <h2 style={{ color: 'var(--rbl-title)' }}>Other things the Town could weigh</h2>
      <section style={{ display: 'grid', gap: 14 }}>
        {grounded.map((g) => (
          <article key={g.title} style={{ ...card, borderLeft: '6px solid var(--rbl-accent-border)' }}>
            <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>{g.kicker}</div>
            <h3 style={{ margin: '4px 0 8px', color: 'var(--rbl-title)' }}>{g.title}</h3>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px' }}>{g.body}</p>
            <a href={g.href} style={{ color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>{g.cta} →</a>
          </article>
        ))}
      </section>
    </PageShell>
  )
}
