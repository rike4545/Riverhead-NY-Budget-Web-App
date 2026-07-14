import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ReserveDrawdownSlider from '../../components/ReserveDrawdownSlider'
import { dollars } from '../../lib/financial-data'
import {
  appropriations,
  deployableAbove288,
  deploymentOptions,
  fundBalanceHealth,
  peerAlignmentScenarios,
  peerBenchmarks,
  percentOfAppropriations,
  policyMinimumPercent,
  remainingAfterDeploymentOptions,
  surplusAboveUpper,
  targetReservePercent,
  targetUnassignedAt288,
  targetUpper,
  unassignedFundBalance,
} from '../../lib/reserve-policy'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export const metadata = {
  title: 'Reserves & fund balance policy — how much cushion is enough?',
  description:
    "How Riverhead's savings stack up against its own reserve rules, a one-time deployment plan for the surplus above target, and how the Town's posture compares to neighboring towns.",
}

const healthColor: Record<string, string> = { healthy: '#16a34a', watch: '#c2410c', atRisk: '#dc2626' }
const healthLabel: Record<string, string> = { healthy: 'Healthy', watch: 'Watch', atRisk: 'At risk' }
const healthNote: Record<string, string> = {
  healthy: "The savings cushion is above the Town's minimum policy target — a good sign.",
  watch: 'Reserves are near the policy minimum. Watch for further draw-downs.',
  atRisk: 'Reserves are below the policy minimum. Ask the Town about its plan to replenish.',
}

export default function ReservesPage() {
  const pctOfApprop = percentOfAppropriations(unassignedFundBalance, appropriations)
  const health = fundBalanceHealth(pctOfApprop, policyMinimumPercent)

  return (
    <PageShell
      title="Reserves &amp; fund balance policy"
      subtitle="How the Town's savings stack up against its own reserve rules, what a disciplined one-time deployment plan could look like, and how Riverhead's posture compares to nearby towns."
    >
      <PlainCallout
        tips={[
          { label: 'Unassigned fund balance', text: 'the "rainy-day" savings with no strings attached — the actual FY2025 audited figure, not a mid-year estimate.' },
          { label: "Policy floor", text: `Riverhead's own policy sets a 15% minimum and 20% upper target of General Fund appropriations.` },
          { label: 'One-time vs. recurring', text: 'anything above the operating target is one-time money — good for debt paydown or capital, not for permanent new spending.' },
        ]}
      >
        The General Fund ended FY2025 with <strong>{dollars(unassignedFundBalance)}</strong> in unassigned reserves —{' '}
        <strong>{pct(pctOfApprop)}</strong> of the {dollars(appropriations)} 2026 General Fund budget, well above the
        Town&apos;s 15% policy floor.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>Policy compliance at a glance</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>General Fund</strong>
          <span
            style={{
              background: `${healthColor[health]}22`,
              color: healthColor[health],
              borderRadius: 999,
              padding: '3px 12px',
              fontSize: 12.5,
              fontWeight: 800,
            }}
          >
            {healthLabel[health]}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 10 }}>
          <span>Unassigned fund balance (FY2025 actual)</span>
          <strong>{dollars(unassignedFundBalance)}</strong>
        </div>
        <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden', marginTop: 8 }}>
          <div
            style={{
              width: `${Math.min(100, (pctOfApprop / (policyMinimumPercent * 2)) * 100)}%`,
              height: '100%',
              background: healthColor[health],
              borderRadius: 999,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 4, color: '#64748b' }}>
          <span>{pct(pctOfApprop)} of appropriations</span>
          <span>Policy min: {pct(policyMinimumPercent, 0)}</span>
        </div>
        <p style={{ color: healthColor[health], fontSize: 14, fontWeight: 700, marginTop: 10 }}>{healthNote[health]}</p>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#64748b' }}>
          <span>Policy upper target (20%)</span>
          <span>{dollars(targetUpper)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
          <span>Surplus above upper target</span>
          <span style={{ color: surplusAboveUpper >= 0 ? '#16a34a' : '#c2410c', fontWeight: 700 }}>{dollars(surplusAboveUpper)}</span>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>28.8% Reserve Reset</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          A one-time-money plan: keep a strong cushion, use the rest on purpose, and show what still fits after the
          serious bills are paid.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}>
          <span>Current unassigned balance</span>
          <strong>{dollars(unassignedFundBalance)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 6 }}>
          <span>{pct(targetReservePercent)} target balance</span>
          <strong>{dollars(targetUnassignedAt288)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginTop: 6 }}>
          <span>Available for one-time deployment</span>
          <strong style={{ color: '#1f5f8f' }}>{dollars(deployableAbove288)}</strong>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />

        <div style={{ display: 'grid', gap: 14 }}>
          {deploymentOptions.map((option) => (
            <div key={option.number} style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#1f5f8f22',
                  color: '#1f5f8f',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {option.number}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ fontSize: 14 }}>{option.title}</strong>
                  <span style={{ color: '#9b6b12', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{dollars(option.amount)}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{option.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
          <span>Still available after these deployments</span>
          <span style={{ color: '#16a34a' }}>{dollars(remainingAfterDeploymentOptions)}</span>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>How 28.8% compares nearby</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          Riverhead&apos;s target lands below what Brookhaven and Smithtown are doing today, but above
          Southampton&apos;s official policy.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {peerBenchmarks.map((peer) => (
            <div key={peer.town}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{peer.town}</strong>
                <span style={{ color: peer.town === 'Riverhead target' ? '#1f5f8f' : '#9b6b12', fontWeight: 800 }}>{pct(peer.percent)}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{peer.detail}</p>
            </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
        <p style={{ color: '#94a3b8', fontSize: 12.5 }}>
          Benchmark note: GFOA guidance commonly points to at least two months of regular operating spending or
          revenue in unrestricted fund balance, about 16.7% to 17% — which is why Southampton&apos;s 17% policy reads
          more like a minimum floor than a default target.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>What if Riverhead matched its peers?</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          How much one-time room Riverhead would have if it matched a neighboring town&apos;s reserve levels — or the
          average of them all.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {peerAlignmentScenarios.map((peer) => (
            <div key={peer.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{peer.label}</strong>
                <span style={{ color: '#9b6b12', fontWeight: 800 }}>{pct(peer.percent)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                <span>Target balance</span>
                <span>{dollars(peer.targetBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: peer.deploymentCapacity >= 0 ? '#16a34a' : '#c2410c', marginTop: 2 }}>
                <span>{peer.deploymentCapacity >= 0 ? 'One-time room created' : 'Additional reserve needed'}</span>
                <span>{dollars(Math.abs(peer.deploymentCapacity))}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{peer.detail}</p>
            </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
        <p style={{ color: '#94a3b8', fontSize: 12.5 }}>
          Ideal guidance: treat 17% like a GFOA-style minimum floor, not the automatic target. East Hampton&apos;s
          56.2% reads like a high-cushion outlier. For Riverhead, a practical operating range is still roughly 25% to
          32%, with 28.8% as a strong middle path that leaves room for debt reduction and one-time public
          improvements.
        </p>
      </section>

      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>What if the Town uses some savings?</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          See how using reserves for tax relief or a project would affect the cushion.
        </p>
        <ReserveDrawdownSlider
          unassignedFundBalance={unassignedFundBalance}
          appropriations={appropriations}
          policyMinimumPercent={policyMinimumPercent}
        />
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Sources: 2025 Annual Financial Report (actual unassigned fund balance), 2026 Adopted Budget (General Fund
        appropriations and one-time deployment figures). Peer-town figures from each town&apos;s own 2026 adopted
        budget or policy document where available.
      </p>
    </PageShell>
  )
}
