import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BarRows from '../../components/charts/BarRows'
import {
  censusDataset, censusSource, households, medianHouseholdIncome, method, notCovered,
  payrollYear, perHousehold, perResident, population, programs, reconciliation, source,
  totals, type Program,
} from '../../lib/programs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

// Steps down through M / K / plain dollars so a small real number reads as
// itself. Health's benefit share is $1,958 — formatting everything as millions
// rendered that as "$0.00M", which looks like a bug rather than a small number.
const millions = (n: number) => {
  const magnitude = Math.abs(n)
  if (magnitude >= 1e6) return `$${(n / 1e6).toFixed(magnitude < 1e7 ? 2 : 1)}M`
  if (magnitude >= 1e4) return `$${Math.round(n / 1e3).toLocaleString('en-US')}K`
  return usd(n)
}

// One hue per program, from the validated series palette. Kept stable so a
// program reads as the same colour in the chart and on its own card.
const TONES: Record<string, string> = {
  '3': 'var(--rbl-series-blue)',
  '8': 'var(--rbl-series-teal)',
  '1': 'var(--rbl-series-indigo)',
  '5': 'var(--rbl-series-gold)',
  '7': 'var(--rbl-series-violet)',
  '4': 'var(--rbl-series-slate)',
  '6': 'var(--rbl-series-blue)',
}

export const metadata = {
  title: 'Program Budget — what each Town service costs and what it earns back',
  description:
    'Riverhead’s 2026 adopted budget regrouped into the seven services the State’s account system says the Town performs: what each costs once pension and health insurance are counted, how much it earns back in fees, what is left for taxpayers, and what that works out to per resident.',
}

export default function ProgramsPage() {
  return (
    <PageShell
      title="What the Town Does, and What It Costs"
      subtitle={`The 2026 adopted budget regrouped into services rather than funds — full cost including pension and health insurance, fees earned back, and what each one leaves for the tax levy. ${usd(perResident.everything)} per resident, all in.`}
    >
      <PlainCallout
        tips={[
          { label: 'Full cost, not just the department line', text: 'pension and health insurance are pushed back onto the programs whose staff earned them, so Police costs what Police actually costs.' },
          { label: '"Earns back"', text: 'is fees paid by the people who use the service — permits, water bills, beach passes — not taxes.' },
          { label: 'Net is what general revenue covers', text: 'property and sales taxes, mortgage tax, PILOTs and state aid. A program with a high cost and high recovery may ask less of you than a cheaper one that charges nobody.' },
        ]}
      >
        A budget organised by <strong>fund</strong> answers an accountant&apos;s question. This page reorganises the
        same dollars by <strong>what the Town does with them</strong> — and the classification isn&apos;t ours. New
        York&apos;s Uniform System of Accounts already assigns every municipal dollar to a function, and Riverhead
        codes to it on both the spending and the revenue side. We regrouped; we didn&apos;t reclassify.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Cost of services" value={millions(totals.fullCost)} note={`${programs.length} programs, ${totals.staff} staff`} />
        <Stat label="Earned back in fees" value={millions(totals.earned)} note={`${((totals.earned / totals.fullCost) * 100).toFixed(0)}% recovery`} teal />
        <Stat label="Not covered by fees" value={millions(totals.net)} note="carried by taxes and general revenue" accent />
        <Stat label="Per resident, services" value={usd(perResident.programs)} note={`${population.toLocaleString()} residents`} />
        <Stat label="Per household, all in" value={usd(perHousehold.everything)} note={`${perHousehold.shareOfMedianIncome.toFixed(1)}% of median income`} gold />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <BarRows
          title="What each service costs, once benefits are counted"
          lede="Full cost — the department's own appropriation plus the pension, health insurance and payroll taxes for the people who deliver it. Alongside each bar: the share the service earns back from the people who use it, and what the remainder costs each resident."
          rows={programs.map((p) => ({
            label: p.name,
            value: p.fullCost,
            display: `${millions(p.fullCost)} · earns ${p.recoveryPct.toFixed(0)}%`,
            note: `${usd(p.netPerResident)} per resident after fees${p.staff > 0 ? ` · ${p.staff} staff` : ''}`,
            color: TONES[p.key],
          }))}
          format={millions}
          source={`Source: ${source.title}. Benefits allocated by the Town's own uniformed/non-uniformed account split.`}
        />
      </section>

      <div style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
        {programs.map((p) => <ProgramCard key={p.key} p={p} />)}
      </div>

      {/* The honest limit of the exercise. */}
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-note-text)' }}>{notCovered.title}</h3>
        <p style={{ color: 'var(--rbl-note-text)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{notCovered.body}</p>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>What it costs per person, and per household</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
          Riverhead has <strong>{population.toLocaleString()}</strong> residents living in{' '}
          <strong>{households.toLocaleString()}</strong> households, with a median household income of{' '}
          <strong>{usd(medianHouseholdIncome)}</strong>. Spread the Town&apos;s net cost across them and you get the
          scale of Town government relative to the people in it.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, margin: '14px 0' }}>
          <Stat label="Services, per resident" value={usd(perResident.programs)} />
          <Stat label="Services, per household" value={usd(perHousehold.programs)} accent />
          <Stat label="Debt service, per household" value={usd(perHousehold.debtService)} />
          <Stat label="All in, per household" value={usd(perHousehold.everything)} gold note={`${perHousehold.shareOfMedianIncome.toFixed(1)}% of median household income`} />
        </div>
        <div style={{ background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-danger-strong)' }}>This is not your tax bill.</strong>{' '}
          <span style={{ color: 'var(--rbl-danger-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
            Commercial and industrial property carries a large share of the levy, fees carry another, and some of
            this cost never touches a household directly. What you actually owe depends on your assessment —{' '}
            <a href={`${base}/tax-bill/`} style={{ color: 'var(--rbl-danger-strong)', fontWeight: 800 }}>work it out on the tax bill page</a>.
          </span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>
          Source: {censusSource.title} — {censusDataset}. Household count carries a margin of error, so treat
          per-household figures as approximate.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>How this was built</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
          Rearranging a budget is exactly where a transparency site can mislead without meaning to, so every
          decision that moved a dollar is written down here.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {method.map((m, i) => (
            <div key={m.title} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span aria-hidden style={{ color: 'var(--rbl-accent)', fontWeight: 950, fontSize: 15, minWidth: 18 }}>{i + 1}</span>
              <div>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{m.title}</strong>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 3 }}>{m.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-success-strong)' }}>The arithmetic checks:</strong>{' '}
          <span style={{ color: 'var(--rbl-success-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
            services ({millions(totals.fullCost)}) + debt service ({millions(totals.debtService)}) + contingency
            ({millions(totals.contingency)}) + interfund transfers ({millions(totals.interfundTransfers)}) ={' '}
            {usd(reconciliation.computed)}, against {usd(reconciliation.appropriations)} in total adopted
            appropriations across all 19 funds — a variance of {usd(reconciliation.variance)}.
          </span>
        </div>

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
          {source.detail} Staff counts are headcount from the {payrollYear} payroll.{' '}
          <a href={`${base}/funds/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>Browse the same dollars by fund</a>{' '}
          or read the{' '}
          <a href={`${base}/gfoa/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>GFOA standards page</a>{' '}
          for why a program view matters.
        </p>
      </section>
    </PageShell>
  )
}

function ProgramCard({ p }: { p: Program }) {
  const tone = TONES[p.key]
  return (
    <section style={{ ...card, borderLeft: `6px solid ${tone}` }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 23 }}>{p.name}</h2>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          NY function {p.key}000s · {p.departments.length} departments
        </span>
      </div>
      <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15.5, lineHeight: 1.5, margin: '6px 0 0', fontWeight: 600 }}>{p.plain}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, margin: '14px 0' }}>
        <Stat label="Full cost" value={millions(p.fullCost)} note={`${millions(p.direct)} + ${millions(p.benefits)} benefits`} />
        <Stat label="Earns back" value={millions(p.earned)} note={`${p.recoveryPct.toFixed(0)}% of cost`} teal />
        <Stat label="Not covered by fees" value={millions(p.net)} accent />
        <Stat label="Per resident" value={usd(p.netPerResident)} note="after fees" />
        <Stat label="Per household" value={usd(p.netPerHousehold)} note="after fees" />
        <Stat label="Staff" value={p.staff > 0 ? String(p.staff) : '—'} note={p.staff > 0 ? `${payrollYear} headcount` : 'contracted out'} />
      </div>

      {/* Cost-recovery meter: how much of the bar the users pay for. */}
      <div>
        <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
          <div style={{ width: `${Math.min(100, p.recoveryPct)}%`, background: tone }} />
          <div style={{ flex: 1, background: 'var(--rbl-track)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>
          <span>{p.recoveryPct.toFixed(0)}% paid by the people who use it</span>
          <span>{(100 - p.recoveryPct).toFixed(0)}% carried by taxes and general revenue</span>
        </div>
      </div>

      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.8, lineHeight: 1.62, margin: '14px 0 0' }}>{p.narrative}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 14, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 14 }}>
        <div>
          <h4 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>What it buys</h4>
          <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
            {p.buys.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>Biggest pieces</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
            {p.departments.slice(0, 5).map((d) => (
              <li key={`${d.fund}-${d.code}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--rbl-text-body)' }}>
                <span>{d.name} <span style={{ color: 'var(--rbl-text-faint)', fontSize: 11.5 }}>{d.fund} {d.code}</span></span>
                <strong style={{ color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>{millions(d.amount)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'var(--rbl-title)', fontSize: 14, margin: '0 0 6px' }}>{p.topRevenues.length > 0 ? 'What it charges for' : 'It charges for nothing'}</h4>
          {p.topRevenues.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
              {p.topRevenues.map((r) => (
                <li key={r.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--rbl-text-body)' }}>
                  <span>{r.name}</span>
                  <strong style={{ color: 'var(--rbl-teal-strong)', whiteSpace: 'nowrap' }}>{millions(r.amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              No fee revenue is coded to this function, so the tax levy carries all of it.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, note, accent, teal, gold }: {
  label: string; value: string; note?: string; accent?: boolean; teal?: boolean; gold?: boolean
}) {
  return (
    <div style={{ background: accent ? 'var(--rbl-info-bg)' : gold ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 21, color: teal ? 'var(--rbl-teal-strong)' : gold ? 'var(--rbl-note-text)' : 'var(--rbl-title)', display: 'block', lineHeight: 1.2 }}>{value}</strong>
      {note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.35, marginTop: 2 }}>{note}</div>}
    </div>
  )
}
