import { CircleCheck, CircleDot, CircleMinus, Hourglass, Link } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  adoptedItems, citingByDate, longDate, openItems, plan, planAsOf, planCoverage, planItems, planPageUrl, statusCounts, statusLabel,
  type PlanItem, type PlanStatus,
} from '../../lib/comprehensive-plan'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14 } as const

export const metadata = {
  title: 'Comprehensive Plan tracker — what Riverhead has and has not adopted',
  description: 'The 2024 Comprehensive Plan Update’s main land use recommendations, each checked against Town Board resolutions: which became law, which are under way, and which have seen no action.',
}

const tone: Record<PlanStatus, { color: string; bg: string; Icon: typeof CircleCheck }> = {
  done: { color: 'var(--rbl-success)', bg: 'var(--rbl-success-bg)', Icon: CircleCheck },
  partial: { color: 'var(--rbl-link)', bg: 'var(--rbl-info-bg)', Icon: CircleDot },
  related: { color: 'var(--rbl-link)', bg: 'var(--rbl-info-bg)', Icon: Link },
  underway: { color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)', Icon: Hourglass },
  none: { color: 'var(--rbl-text-muted)', bg: 'var(--rbl-track)', Icon: CircleMinus },
}

function Badge({ status }: { status: PlanStatus }) {
  const t = tone[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: t.bg, border: `1px solid ${t.color}`, fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>
      <t.Icon size={16} aria-hidden="true" style={{ color: t.color }} />{statusLabel[status]}
    </span>
  )
}

function Item({ item }: { item: PlanItem }) {
  return (
    <li style={{ listStyle: 'none', borderTop: '1px solid var(--rbl-border-subtle)', padding: '14px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center', marginBottom: 6 }}>
        <Badge status={item.status} />
        <span style={muted}>{item.group}</span>
      </div>
      <p style={{ ...prose, margin: '0 0 6px', fontWeight: 600, color: 'var(--rbl-text-strong)' }}>{item.recommendation}</p>
      {item.quote ? (
        <blockquote style={{ margin: '0 0 8px', paddingLeft: 12, borderLeft: '2px solid var(--rbl-border)', color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.5, maxWidth: '75ch' }}>
          “{item.quote}”
        </blockquote>
      ) : null}
      {item.planPage ? (
        <p style={{ ...muted, margin: '0 0 8px' }}><a href={planPageUrl(item.planPage)} style={link}>Plan, page {item.planPage}</a></p>
      ) : null}
      {item.actions.length ? (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.5 }}>
          {item.actions.map((a) => (
            <li key={a.resolution} style={{ marginBottom: 4 }}>
              <a href={a.url.startsWith('/') ? `${base}${a.url}` : a.url} style={link}>{longDate(a.date)}, Resolution {a.resolution}</a>: {a.what}.
              {a.citesPlan ? <span style={muted}> The resolution says it carries out the plan.</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...muted, margin: 0 }}>No Town Board resolution found on this through {longDate(planAsOf)}.</p>
      )}
      {item.note ? <p style={{ ...muted, margin: '6px 0 0' }}>{item.note}</p> : null}
    </li>
  )
}

export default function ComprehensivePlanPage() {
  const total = planItems.length
  const count = (s: PlanStatus) => statusCounts.find((c) => c.status === s)!.count
  const days = citingByDate()
  const biggest = [...days].sort((a, b) => b.count - a.count)[0]
  const groups = Array.from(new Set(planItems.map((i) => i.group)))
  return (
    <PageShell
      title="Comprehensive Plan tracker"
      subtitle={`What the Town Board has and has not adopted from the ${plan.title}, recommendation by recommendation, as of ${longDate(planAsOf)}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Comprehensive plan', text: 'the Town’s long-range guide for land use. It is not law by itself; zoning changes put it into effect.' },
          { label: 'Local law', text: 'a change to the Town Code, adopted by the Town Board after a public hearing.' },
          { label: 'No action found', text: 'this site found no Town Board resolution on the item. Work may still be going on in a department.' },
        ]}
      >
        The Town Board adopted the plan on <strong>{longDate(plan.adopted.date)}</strong> (Resolution {plan.adopted.resolution}, unanimously).
        Of the {total} recommendations tracked here, <strong>{count('done')} became law</strong>, {count('partial')} became law in part, and{' '}
        {count('related')} saw a related law that does not say it carries out the plan. {count('underway')} are under way.{' '}
        <strong>{count('none')} show no Town Board action</strong> in the records this site searched.
      </PlainCallout>

      <section aria-labelledby="summary-heading" style={card}>
        <h2 id="summary-heading" style={h2}>The {total} recommendations at a glance</h2>
        <div role="img" aria-label={statusCounts.map((c) => `${statusLabel[c.status]}: ${c.count}`).join('; ')}
          style={{ display: 'flex', gap: 2, height: 28, borderRadius: 6, overflow: 'hidden', margin: '8px 0 10px' }}>
          {statusCounts.filter((c) => c.count).map((c) => (
            <div key={c.status} style={{ flex: c.count, background: tone[c.status].color, opacity: c.status === 'related' ? 0.6 : 1 }} />
          ))}
        </div>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', margin: 0, padding: 0, listStyle: 'none' }}>
          {statusCounts.map((c) => (
            <li key={c.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--rbl-text-strong)' }}>
              <Badge status={c.status} /> <strong>{c.count}</strong>
            </li>
          ))}
        </ul>
        <h3 style={{ margin: '18px 0 8px', color: 'var(--rbl-title)', fontSize: 17 }}>By topic</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {groups.map((g) => (
            <li key={g} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '8px 0', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: 'var(--rbl-text-strong)', minWidth: '14em' }}>{g}</span>
              <span style={{ color: 'var(--rbl-text-body)', fontSize: 15 }}>
                {statusCounts.map((c) => ({ s: c.status, n: planItems.filter((i) => i.group === g && i.status === c.status).length }))
                  .filter((x) => x.n).map((x) => `${x.n} ${statusLabel[x.s].toLowerCase()}`).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', margin: '14px 0 0' }}>
          <a href="#adopted-heading" style={{ ...link, display: 'inline-block', padding: '4px 0' }}>Jump to what was adopted ({adoptedItems.length})</a>
          <a href="#open-heading" style={{ ...link, display: 'inline-block', padding: '4px 0' }}>Jump to what was not ({openItems.length})</a>
        </p>
      </section>

      <section aria-labelledby="when-heading" style={card}>
        <h2 id="when-heading" style={h2}>How it was put into effect</h2>
        <p style={prose}>
          The plan replaced {plan.adopted.replaces}. It was prepared by {plan.consultant} and runs to {plan.pages} pages. {plan.adopted.previous}, it was adopted on {longDate(plan.adopted.date)}:{' '}
          <a href={plan.adopted.url} style={link}>minutes of that meeting</a>.
        </p>
        <p style={prose}>
          Most of the work came at once. On {longDate(biggest.date)} the Board adopted {biggest.count} local laws tracked here, each of
          which says it carries out the plan: the new Calverton Industrial and Light Industrial districts, the rezonings, and the changes to
          the transfer of development rights (TDR) program. Since then, changes have come one at a time. See the{' '}
          <a href={`${base}/tdr/`} style={link}>TDR page</a> for how credits work.
        </p>
      </section>

      <section aria-labelledby="adopted-heading" style={card}>
        <h2 id="adopted-heading" style={h2}>Adopted ({adoptedItems.length})</h2>
        <ul style={{ margin: 0, padding: 0 }}>{adoptedItems.map((i) => <Item key={i.id} item={i} />)}</ul>
      </section>

      <section aria-labelledby="open-heading" style={card}>
        <h2 id="open-heading" style={h2}>Not yet adopted ({openItems.length})</h2>
        <ul style={{ margin: 0, padding: 0 }}>{openItems.map((i) => <Item key={i.id} item={i} />)}</ul>
      </section>

      <section aria-labelledby="concerns-heading" style={card}>
        <h2 id="concerns-heading" style={h2}>Likely concerns for residents</h2>
        <ul style={{ ...prose, paddingLeft: 18 }}>
          <li>The industrial and TDR changes, which most affect what can be built in Calverton, moved fastest. Several housing and
            design recommendations, such as the downtown cap study, the Pattern Book and the hospital district, show no action two years on.</li>
          <li>Some later laws touch topics the plan covers (accessory dwelling units, the outlet district, the Community Benefit District)
            but do not say they carry it out. Residents cannot tell from the resolution alone whether they follow the plan’s advice.</li>
          <li>The plan says “The Town should continue to monitor progress of recommendations to ensure the plan’s objectives are being
            met.” This site found no progress report on the plan among the Town Board’s resolutions.</li>
        </ul>
      </section>

      <section aria-labelledby="method-heading" style={card}>
        <h2 id="method-heading" style={h2}>How this was checked</h2>
        <p style={prose}>
          The {planItems.length} items are the main recommendations in the plan’s land use chapter (Chapter 13), plus a few from other
          chapters that call for a specific law or plan. The plan has many more goals. Each item quotes the plan and links to its page.
        </p>
        <p style={prose}>Records searched: {planCoverage}</p>
        <p style={muted}>
          Source: <a href={plan.url} style={link}>{plan.title}</a> (Town of Riverhead, PDF). Also see the{' '}
          <a href={`${base}/housing-plan/`} style={link}>Community Housing Plan</a> and{' '}
          <a href={`${base}/preserved-land/`} style={link}>Preserved Land</a> pages.
        </p>
      </section>
    </PageShell>
  )
}
