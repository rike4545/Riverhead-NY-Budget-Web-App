'use client'

import { useMemo, useState } from 'react'
import { compareFinancing } from '../lib/capital-financing'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function CapitalDebtCalculator() {
  const [projectCost, setProjectCost] = useState(5_000_000)
  const [banYears, setBanYears] = useState(2)
  const [banRatePct, setBanRatePct] = useState(3.75)
  const [bondYears, setBondYears] = useState(20)
  const [bondRatePct, setBondRatePct] = useState(4.25)

  const cmp = useMemo(
    () => compareFinancing({ projectCost, banYears, banRatePct, bondYears, bondRatePct }),
    [projectCost, banYears, banRatePct, bondYears, bondRatePct]
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(320px,1.3fr)', gap: 16 }}>
      <div style={{ ...card, display: 'grid', gap: 16, alignContent: 'start' }}>
        <Field label="Project cost" value={usd(projectCost)} hint="A hypothetical capital project — a road program, a facility, equipment.">
          <input type="range" min={500_000} max={30_000_000} step={100_000} value={projectCost} onChange={(e) => setProjectCost(Number(e.target.value))} style={slider} />
        </Field>
        <Field label="BAN period" value={`${banYears} yr${banYears === 1 ? '' : 's'}`} hint="How long the project is financed short-term before converting to a permanent bond.">
          <input type="range" min={1} max={5} step={1} value={banYears} onChange={(e) => setBanYears(Number(e.target.value))} style={slider} />
        </Field>
        <Field label="BAN rate (assumption)" value={`${banRatePct.toFixed(2)}%`} hint="Short-term note rate — you set this; it is not a quoted Town rate.">
          <input type="range" min={1} max={7} step={0.05} value={banRatePct} onChange={(e) => setBanRatePct(Number(e.target.value))} style={slider} />
        </Field>
        <Field label="Bond term" value={`${bondYears} yrs`} hint="Length of the permanent, long-term serial bond once issued.">
          <input type="range" min={5} max={30} step={1} value={bondYears} onChange={(e) => setBondYears(Number(e.target.value))} style={slider} />
        </Field>
        <Field label="Bond rate (assumption)" value={`${bondRatePct.toFixed(2)}%`} hint="Long-term bond rate — also user-set, not a quoted Town rate.">
          <input type="range" min={1} max={7} step={0.05} value={bondRatePct} onChange={(e) => setBondRatePct(Number(e.target.value))} style={slider} />
        </Field>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <PathCard
            title="Bond now"
            sub={`Issue a ${bondYears}-year bond immediately`}
            totalInterest={cmp.bondNow.totalInterest}
            totalCost={cmp.bondNow.totalCost}
            yearsToRetire={cmp.bondNow.yearsToRetire}
          />
          <PathCard
            title="BAN, then bond"
            sub={`${banYears} yr${banYears === 1 ? '' : 's'} BAN, then a ${bondYears}-year bond`}
            totalInterest={cmp.banThenBond.totalInterest}
            totalCost={cmp.banThenBond.totalCost}
            yearsToRetire={cmp.banThenBond.yearsToRetire}
            breakdown={[
              { label: 'BAN carrying cost', value: cmp.banThenBond.banCarryingCost },
              { label: 'Bond interest', value: cmp.banThenBond.bondInterest },
            ]}
          />
        </section>

        <section style={{ ...card, borderLeft: `6px solid ${cmp.banPremium >= 0 ? '#dc2626' : '#16a34a'}` }}>
          <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Cost of financing through a BAN first
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: cmp.banPremium >= 0 ? '#b91c1c' : '#166534', marginTop: 2 }}>
            {cmp.banPremium >= 0 ? '+' : ''}{usd(cmp.banPremium)}
          </div>
          <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.55, marginTop: 8, marginBottom: 0 }}>
            {cmp.banPremium >= 0
              ? `At these assumptions, BAN-then-bond costs ${usd(Math.abs(cmp.banPremium))} more in total interest than bonding immediately — the price of ${banYears} year${banYears === 1 ? '' : 's'} of interest-only carrying cost on top of the eventual bond.`
              : `At these assumptions, BAN-then-bond actually costs ${usd(Math.abs(cmp.banPremium))} less — that happens when the BAN rate is low enough relative to the bond rate that the short-term carrying cost is cheaper than locking in the long-term rate sooner.`}
            {' '}Towns use BANs anyway when a project's final cost isn't settled yet, to avoid borrowing — and paying interest on — money that
            isn't ready to be spent, and to keep the option open on when to lock in a long-term rate.
          </p>
        </section>
      </div>
    </div>
  )
}

function PathCard({
  title, sub, totalInterest, totalCost, yearsToRetire, breakdown,
}: {
  title: string; sub: string; totalInterest: number; totalCost: number; yearsToRetire: number
  breakdown?: { label: string; value: number }[]
}) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 900, color: '#284a69', fontSize: 15 }}>{title}</div>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>{sub}</div>
      <Mini label="Total interest" value={usd(totalInterest)} />
      <div style={{ height: 8 }} />
      <Mini label="Total cost (principal + interest)" value={usd(totalCost)} />
      <div style={{ height: 8 }} />
      <Mini label="Years until retired" value={`${yearsToRetire} yrs`} />
      {breakdown && (
        <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
          {breakdown.map((b) => (
            <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
              <span>{b.label}</span>
              <strong style={{ color: '#334155' }}>{usd(b.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: '#284a69' }}>{value}</div>
    </div>
  )
}

function Field({ label, value, hint, children }: { label: string; value: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#4a7297', fontSize: 14 }}>{value}</span>
      </div>
      {children}
      <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>{hint}</div>
    </div>
  )
}

const slider = { width: '100%', accentColor: '#4a7297' } as const
