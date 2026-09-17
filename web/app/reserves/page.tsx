import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ReserveDrawdownSlider from '../../components/ReserveDrawdownSlider'
import { dollars } from '../../lib/financial-data'
import { afr2025 } from '../../lib/afr'
import {
  appropriations,
  authorizedReserves,
  authorizedReservesNote,
  authorizedReservesSource,
  communityBlockGrants,
  constrainedFundBalance,
  deployableAbove288,
  earliestFundBalanceYear,
  fundBalanceHealth,
  fundBalanceReading,
  fundBalanceTiers,
  fundBalanceTrend,
  fundBalanceYears,
  latestFundBalanceYear,
  peerBenchmarks,
  policyMinimumPercent,
  surplusAboveUpper,
  targetReservePercent,
  targetUnassignedAt288,
  targetUpper,
  totalFundBalance,
  unassignedFundBalance,
} from '../../lib/reserve-policy'
import {
  availabilityReading,
  ceilingPercentOfAppropriations,
  surplusAboveUpperCeiling,
  unassignedCeiling,
  committedAuthorized,
  committedDocumented,
  committedThisYear,
  deployableAbove288Ceiling,
  deploymentLedger,
  deploymentPlanFits,
  deploymentPlanShortfall,
  deploymentPlanTotal,
  absorptionOptions,
  fundedOptions,
  leftoverAfterFunded,
  partialCoverageOfNext,
  smallOnesTogetherCover,
  spareIfAllSmallDropped,
  tooSmallCombined,
  tooSmallToAbsorb,
  targetForFullPlan,
  unfundedOptions,
  openingPercentOfAppropriations,
  peerAlignmentScenariosNet,
  planReading,
} from '../../lib/reserve-availability'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export const metadata = {
  title: 'Reserves & fund balance policy — how much cushion is enough?',
  description:
    "The five GASB classifications of Riverhead's General Fund balance, how its savings stack up against its own reserve rules after netting what 2026 has already committed, a one-time deployment plan for the ceiling on what is left, and how the Town's posture compares to neighboring towns.",
}

const healthColor: Record<string, string> = { healthy: 'var(--rbl-success)', watch: 'var(--rbl-warn)', atRisk: 'var(--rbl-danger)' }
const healthLabel: Record<string, string> = { healthy: 'Healthy', watch: 'Watch', atRisk: 'At risk' }
const spendableTone: Record<string, { label: string; color: string; bg: string; border: string }> = {
  no: { label: 'Cannot be spent', color: 'var(--rbl-text-muted)', bg: 'var(--rbl-surface-3)', border: 'var(--rbl-border-strong)' },
  constrained: { label: 'Strings attached', color: 'var(--rbl-accent)', bg: 'var(--rbl-info-bg)', border: 'var(--rbl-info-border)' },
  yes: { label: 'Spendable on anything lawful', color: 'var(--rbl-success)', bg: 'var(--rbl-success-bg)', border: 'var(--rbl-success-border)' },
}

const healthNote: Record<string, string> = {
  healthy: "The savings cushion is above the Town's minimum policy target — a good sign.",
  watch: 'Reserves are near the policy minimum. Watch for further draw-downs.',
  atRisk: 'Reserves are below the policy minimum. Ask the Town about its plan to replenish.',
}

export default function ReservesPage() {
  // Compliance is tested against the ceiling on what is left, not the opening
  // balance. The opening figure stays beside it, labeled, because it is what the
  // Town reported and the source for everything else — but a policy check
  // against money already voted away is a check against a number that is gone.
  // Both clear the floor comfortably, so the verdict does not turn on the choice.
  const pctOfApprop = ceilingPercentOfAppropriations
  const health = fundBalanceHealth(pctOfApprop, policyMinimumPercent)

  return (
    <PageShell
      title="Reserves &amp; fund balance policy"
      subtitle="How the Town's savings stack up against its own reserve rules, what a disciplined one-time deployment plan could look like, and how Riverhead's posture compares to nearby towns."
    >
      <PlainCallout
        tips={[
          { label: 'Unassigned fund balance', text: 'the "rainy-day" savings with no strings attached — the actual FY2025 year-end figure from the Town\u2019s Annual Financial Report, not a mid-year estimate. It is one of five classifications; the other four are shown below.' },
          { label: "Policy floor", text: `Riverhead's own policy sets a 15% minimum and 20% upper target of General Fund appropriations.` },
          { label: 'One-time vs. recurring', text: 'anything above the operating target is one-time money — good for debt paydown or capital, not for permanent new spending.' },
          { label: 'Opening vs. available', text: 'the figure the Town reported for December 31, 2025 — its own filing, not an independent audit. The Board has voted against it all year, so what is left is the smaller number, and it is the one every plan here is priced against.' },
        ]}
      >
        The General Fund ended FY2025 with <strong>{dollars(unassignedFundBalance)}</strong> in unassigned reserves —{' '}
        <strong>{pct(openingPercentOfAppropriations)}</strong> of the {dollars(appropriations)} 2026 General Fund
        budget. The Board has since committed <strong>{dollars(committedThisYear)}</strong> of it by resolution, which puts
        a ceiling of <strong>{dollars(unassignedCeiling)}</strong> on what is left — <strong>{pct(pctOfApprop)}</strong>,
        still well above the Town&apos;s 15% policy floor. A ceiling, not a balance: there is no 2026 financial report.
        Every plan below is priced against that second figure rather than the opening one.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Policy compliance at a glance</h3>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 10, color: 'var(--rbl-text-muted)' }}>
          <span>Unassigned fund balance (FY2025 reported)</span>
          <span>{dollars(unassignedFundBalance)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 4, color: 'var(--rbl-text-muted)' }}>
          <span>Less committed by 2026 resolutions</span>
          <span style={{ color: 'var(--rbl-warn)' }}>&minus; {dollars(committedThisYear)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 6 }}>
          <strong>Ceiling on what is left</strong>
          <strong>{dollars(unassignedCeiling)}</strong>
        </div>
        <div style={{ background: 'var(--rbl-track)', borderRadius: 999, height: 8, overflow: 'hidden', marginTop: 8 }}>
          <div
            style={{
              width: `${Math.min(100, (pctOfApprop / (policyMinimumPercent * 2)) * 100)}%`,
              height: '100%',
              background: healthColor[health],
              borderRadius: 999,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 4, color: 'var(--rbl-text-muted)' }}>
          <span>{pct(pctOfApprop)} of appropriations</span>
          <span>Policy min: {pct(policyMinimumPercent, 0)}</span>
        </div>
        <p style={{ color: healthColor[health], fontSize: 14, fontWeight: 700, marginTop: 10 }}>{healthNote[health]}</p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--rbl-text-muted)' }}>
          <span>Policy upper target (20%)</span>
          <span>{dollars(targetUpper)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--rbl-text-muted)', marginTop: 4 }}>
          <span>Surplus above upper target, at the reported opening</span>
          <span>{dollars(surplusAboveUpper)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--rbl-text-muted)', marginTop: 4 }}>
          <span>Surplus above upper target, net of 2026 votes</span>
          <span style={{ color: surplusAboveUpperCeiling >= 0 ? 'var(--rbl-success)' : 'var(--rbl-warn)', fontWeight: 700 }}>{dollars(surplusAboveUpperCeiling)}</span>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The five classifications of fund balance</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          Every percentage above measures one tier. GASB Statement 54 splits a fund&apos;s balance into five, ordered by
          how hard the money is to spend — and the Town&apos;s own annual report files all five. {fundBalanceReading}
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {fundBalanceTiers.map((tier) => {
            const latest = tier.values[latestFundBalanceYear] ?? 0
            const trend = fundBalanceTrend.find((t) => t.name === tier.name)
            const tone = spendableTone[tier.spendable]
            const share = totalFundBalance > 0 ? latest / totalFundBalance : 0
            return (
              <div key={tier.name} style={{ borderLeft: `3px solid ${tone.color}`, paddingLeft: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 15, color: 'var(--rbl-text)' }}>{tier.name}</strong>
                    <span
                      style={{
                        background: tone.bg,
                        color: tone.color,
                        border: `1px solid ${tone.border}`,
                        borderRadius: 999,
                        padding: '1px 9px',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      {tone.label}
                    </span>
                  </span>
                  <strong style={{ fontSize: 15 }}>{dollars(latest)}</strong>
                </div>

                <div style={{ background: 'var(--rbl-track)', borderRadius: 999, height: 6, overflow: 'hidden', marginTop: 7 }}>
                  <div style={{ width: `${Math.max(share * 100, share > 0 ? 0.6 : 0)}%`, height: '100%', background: tone.color, borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)', marginTop: 3 }}>
                  {pct(share)} of the {latestFundBalanceYear} General Fund balance
                </div>

                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, margin: '7px 0 0' }}>{tier.what}</p>

                {trend ? (
                  <div style={{ fontSize: 12.5, color: 'var(--rbl-text-muted)', marginTop: 5 }}>
                    {earliestFundBalanceYear}: {dollars(trend.from)} → {latestFundBalanceYear}: {dollars(trend.to)}{' '}
                    <span style={{ color: trend.change === 0 ? 'var(--rbl-text-muted)' : trend.change > 0 ? 'var(--rbl-success)' : 'var(--rbl-warn)', fontWeight: 700 }}>
                      {trend.change >= 0 ? '+' : '−'}
                      {dollars(Math.abs(trend.change))}
                      {trend.pct === null ? ' (new)' : ` (${trend.pct >= 0 ? '+' : '−'}${Math.abs(trend.pct).toFixed(0)}%)`}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}>
          <strong>Total General Fund balance ({latestFundBalanceYear})</strong>
          <strong>{dollars(totalFundBalance)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--rbl-text-muted)', marginTop: 4 }}>
          <span>Of which constrained (the four tiers above Unassigned)</span>
          <span>{dollars(constrainedFundBalance)}</span>
        </div>

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 12, lineHeight: 1.55 }}>
          Why this matters for the numbers on this page: a reserve policy is written against{' '}
          <strong>Unassigned</strong>, so that is the figure the compliance test uses. Quoting the{' '}
          {dollars(totalFundBalance)} balance-sheet total instead would overstate the spendable cushion by{' '}
          {dollars(constrainedFundBalance)}. Classifications and definitions follow GASB Statement 54; the dollar
          figures are the Town&apos;s own{' '}
          <a href={afr2025.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)' }}>
            {afr2025.source.title}
          </a>
          , which reports {fundBalanceYears.length} years side by side.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What 2026 has already committed</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          {availabilityReading}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}>
          <span>Reported unassigned balance, December 31, 2025</span>
          <strong>{dollars(unassignedFundBalance)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 6 }}>
          <span>Committed by 2026 resolutions</span>
          <strong style={{ color: 'var(--rbl-warn)' }}>&minus; {dollars(committedThisYear)}</strong>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15.5 }}>
          <strong>Ceiling on what is left</strong>
          <strong style={{ color: 'var(--rbl-accent)' }}>{dollars(unassignedCeiling)}</strong>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 12 }}>
          Why a ceiling rather than a balance. These are authorizations, not cash out the door — a budget adjustment
          permits spending, and what was consumed appears in the next financial report. Several adopted draws state no
          amount at all, so the committed side is itself a floor and the remainder could be lower. And fund balance
          moves for reasons no resolution records: revenue beating budget and departments underspending together swung
          the General Fund <strong>$8.6 million to the good</strong> in 2023, so it could equally be higher. The true
          current balance is unknown until the Town files a 2026 report. It is netted here anyway, because a dollar the
          Board has already voted cannot fund a suggestion on this page as well.{' '}
          <a href={`${base}/predict-2027/`} style={{ color: 'var(--rbl-link)' }}>
            The ledger on /predict-2027/
          </a>{' '}
          lists every draw, largest first, with the basis for each.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>28.8% Reserve Reset</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          A one-time-money plan: keep a strong cushion, use the rest on purpose, and show what still fits after the
          serious bills are paid. It is priced below against the <em>ceiling on what is left</em>, not the
          reported opening figure it was first written against.
        </p>
        {!deploymentPlanFits && (
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
            <strong>
              The reset still works;{' '}
              {unfundedOptions.length === 1
                ? 'the last item on the list no longer does.'
                : `the last ${unfundedOptions.length} items on the list no longer do.`}
            </strong>{' '}
            Holding the {pct(targetReservePercent)} target leaves {dollars(deployableAbove288Ceiling)} to deploy, which
            funds {fundedOptions.length} of the {fundedOptions.length + unfundedOptions.length} published options in
            full and falls {dollars(deploymentPlanShortfall)} short of{' '}
            {unfundedOptions.length === 1 ? 'the last' : `the remaining ${unfundedOptions.length}`}. What does not fit
            is shown below the plan rather than dropped from it.
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14.5 }}>
          <span>Ceiling on what is left (net of 2026 votes)</span>
          <strong>{dollars(unassignedCeiling)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 6 }}>
          <span>{pct(targetReservePercent)} target balance</span>
          <strong>{dollars(targetUnassignedAt288)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, marginTop: 6 }}>
          <span>Ceiling on one-time deployment</span>
          <strong style={{ color: 'var(--rbl-accent)' }}>{dollars(deployableAbove288Ceiling)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 4, color: 'var(--rbl-text-muted)' }}>
          <span>Same figure before netting 2026&apos;s votes</span>
          <span>{dollars(deployableAbove288)}</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '14px 0' }} />

        <div style={{ display: 'grid', gap: 14 }}>
          {fundedOptions.map((option) => (
            <div key={option.number} style={{ display: 'flex', gap: 10, opacity: option.coveredInFull ? 1 : 0.92 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: option.coveredInFull ? '#4a729722' : 'var(--rbl-warn-bg)',
                  color: option.coveredInFull ? 'var(--rbl-accent)' : 'var(--rbl-warn-strong)',
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
                  <span style={{ color: 'var(--rbl-badge)', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{dollars(option.amount)}</span>
                </div>
                <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '2px 0 0' }}>{option.detail}</p>
                <div style={{ fontSize: 12.3, marginTop: 3, color: option.coveredInFull ? 'var(--rbl-text-faint)' : 'var(--rbl-warn-strong)', fontWeight: option.coveredInFull ? 500 : 700 }}>
                  {option.coveredInFull
                    ? `${dollars(option.remainingAfter)} left after this one`
                    : `Runs out here — ${dollars(Math.abs(option.remainingAfter))} short of funding this in full`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 800 }}>
          <span>{deploymentPlanFits ? 'Still available after these deployments' : 'Unallocated after the funded items'}</span>
          <span style={{ color: 'var(--rbl-success)' }}>{dollars(leftoverAfterFunded)}</span>
        </div>

        {unfundedOptions.length > 0 && (
          <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
            <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 14 }}>
              What no longer fits, and why it is still listed
            </strong>
            {unfundedOptions.map((option) => (
              <div key={option.number} style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ fontSize: 14 }}>
                    {option.number}. {option.title}
                  </strong>
                  <span style={{ color: 'var(--rbl-warn-strong)', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {dollars(option.amount)}
                  </span>
                </div>
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13, margin: '2px 0 0', lineHeight: 1.5 }}>{option.detail}</p>
                {option.fundsRecurringCost && (
                  <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 12.8, margin: '4px 0 0', lineHeight: 1.5 }}>
                    This one funds <em>posts</em>, which recur. The rule at the top of this page is that one-time money
                    suits debt paydown and capital rather than permanent new spending — so on the page&apos;s own
                    reading it sits awkwardly here whether or not the money were there.
                  </p>
                )}
              </div>
            ))}
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.6, margin: '10px 0 0' }}>
              The {dollars(leftoverAfterFunded)} left over covers{' '}
              {partialCoverageOfNext === null ? 'none' : `${Math.round(partialCoverageOfNext * 100)}%`} of it. Closing
              the {dollars(deploymentPlanShortfall)} gap the other way would mean holding a{' '}
              {pct(targetForFullPlan)} reserve instead of {pct(targetReservePercent)}.
            </p>
            <div style={{ marginTop: 12 }}>
              <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.4 }}>
                Or absorb it elsewhere: what each option would have to give up
              </strong>
              <div style={{ display: 'grid', gap: 7, marginTop: 7 }}>
                {absorptionOptions.map((o) => (
                  <div key={o.number} style={{ borderTop: '1px solid var(--rbl-warn-border)', paddingTop: 6 }}>
                    <div style={{ fontSize: 13, color: 'var(--rbl-text)', lineHeight: 1.4 }}>
                      {o.number}. {o.title}
                    </div>
                    <div style={{ fontSize: 12.6, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
                      <span style={{ color: 'var(--rbl-text-muted)' }}>{dollars(o.amount)}</span>
                      {o.canAbsorbAlone ? (
                        <>
                          <span style={{ color: 'var(--rbl-warn-strong)', fontWeight: 800 }}>
                            trim {((o.trimFraction as number) * 100).toFixed(1)}%
                          </span>
                          <span style={{ color: 'var(--rbl-text-muted)' }}>
                            &rarr; {dollars(o.remainsAfterTrim as number)} remains
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--rbl-text-muted)', fontStyle: 'italic' }}>smaller than the gap</span>
                      )}
                    </div>
                    {o.canAbsorbAlone && o.trimCharacter && (
                      <div style={{ fontSize: 12.3, marginTop: 2, color: 'var(--rbl-text-muted)', lineHeight: 1.45 }}>
                        {o.trimCharacter}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.6, margin: '8px 0 0' }}>
                {tooSmallToAbsorb.length} of the options are smaller than the gap, so none of them can close it alone.
                That is not the same as saying they are not candidates:{' '}
                {smallOnesTogetherCover
                  ? `together they come to ${dollars(tooSmallCombined)}, so dropping them covers it with ${dollars(spareIfAllSmallDropped)} to spare.`
                  : `together they come to only ${dollars(tooSmallCombined)}, which still leaves ${dollars(deploymentPlanShortfall - tooSmallCombined)} outstanding.`}
              </p>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.6, margin: '6px 0 0' }}>
                A trim is not the same act in every row, which is why each carries its own note above. Which to drop,
                trim or fund another way is the Board&apos;s call; this page shows the arithmetic and the principle, not
                a decision.
              </p>
            </div>
          </div>
        )}

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '10px 0 0' }}>{planReading}</p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Spending it is not the only option</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0, lineHeight: 1.6 }}>
          Every line above uses one-time money. New York also lets a town move it into a formal reserve &mdash; a
          different legal thing from leaving it as unassigned fund balance. {authorizedReservesNote}
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {authorizedReserves.map((r) => (
            <div
              key={r.citation}
              style={{
                border: '1px solid var(--rbl-border-subtle)',
                borderRadius: 10,
                padding: '11px 13px',
                background: 'var(--rbl-warn-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.4 }}>
                  {r.citation}
                </span>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.8 }}>{r.name}</strong>
              </div>
              <div style={{ color: 'var(--rbl-title)', fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>
                {r.exposure}: {dollars(r.exposureAmount)}
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 3 }}>
                {r.detail}
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.55, marginBottom: 0, marginTop: 12 }}>
          {authorizedReservesSource}
        </p>
      </section>

      <h2 style={{ margin: '26px 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>Go deeper</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 8px' }}>The breakdown, peer comparisons, and a draw-down tool — open only what you want.</p>

      <Detail title="Community block grants — who would get funded">
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Community block grants — who would get funded</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          The breakdown behind deployment option #6 above: four nonprofits serving Riverhead and the East End. These
          amounts are this site&apos;s own illustrative sizing, not an official Town budget line or commitment.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {communityBlockGrants.map((grant) => (
            <div key={grant.organization} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{grant.organization}</strong>
                <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '2px 0 0' }}>{grant.focus}</p>
              </div>
              <span style={{ color: 'var(--rbl-badge)', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{dollars(grant.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      </Detail>

      <Detail title="How Riverhead's 28.8% target compares nearby">
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How 28.8% compares nearby</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          Riverhead&apos;s target lands below what Brookhaven and Smithtown are doing today, but above
          Southampton&apos;s official policy.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {peerBenchmarks.map((peer) => (
            <div key={peer.town}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{peer.town}</strong>
                <span style={{ color: peer.town === 'Riverhead target' ? 'var(--rbl-accent)' : 'var(--rbl-badge)', fontWeight: 800 }}>{pct(peer.percent)}</span>
              </div>
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '2px 0 0' }}>{peer.detail}</p>
            </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '12px 0' }} />
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
          Benchmark note: GFOA guidance commonly points to at least two months of regular operating spending or
          revenue in unrestricted fund balance, about 16.7% to 17% — which is why Southampton&apos;s 17% policy reads
          more like a minimum floor than a default target.
        </p>
      </section>

      </Detail>

      <Detail title="What if Riverhead matched its peers?">
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What if Riverhead matched its peers?</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          How much one-time room Riverhead would have if it matched a neighboring town&apos;s reserve levels — or the
          average of them all. Measured against the {dollars(unassignedCeiling)} ceiling rather than the opening
          balance, since the targets are a share of appropriations and 2026&apos;s votes do not move them.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {peerAlignmentScenariosNet.map((peer) => (
            <div key={peer.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{peer.label}</strong>
                <span style={{ color: 'var(--rbl-badge)', fontWeight: 800 }}>{pct(peer.percent)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--rbl-text-muted)', marginTop: 2 }}>
                <span>Target balance</span>
                <span>{dollars(peer.targetBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: peer.deploymentCapacity >= 0 ? 'var(--rbl-success)' : 'var(--rbl-warn)', marginTop: 2 }}>
                <span>{peer.deploymentCapacity >= 0 ? 'One-time room created' : 'Additional reserve needed'}</span>
                <span>{dollars(Math.abs(peer.deploymentCapacity))}</span>
              </div>
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, margin: '4px 0 0' }}>{peer.detail}</p>
            </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '12px 0' }} />
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
          Ideal guidance: treat 17% like a GFOA-style minimum floor, not the automatic target. East Hampton&apos;s
          56.2% reads like a high-cushion outlier. For Riverhead, a practical operating range is still roughly 25% to
          32%, with 28.8% as a strong middle path that leaves room for debt reduction and one-time public
          improvements.
        </p>
      </section>

      </Detail>

      <Detail title="Try it: what if the Town uses some savings?">
      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What if the Town uses some savings?</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, marginTop: 0 }}>
          See how using reserves for tax relief or a project would affect the cushion. The slider starts from the{' '}
          {dollars(unassignedCeiling)} ceiling on what is left, not the reported opening balance, so it cannot offer
          money the Board has already voted.
        </p>
        <ReserveDrawdownSlider
          unassignedFundBalance={unassignedCeiling}
          appropriations={appropriations}
          policyMinimumPercent={policyMinimumPercent}
        />
      </section>
      </Detail>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Sources: 2025 Annual Financial Report (all five fund-balance classifications, three years each, including the
        actual unassigned balance), 2026 Adopted Budget (General Fund appropriations and one-time deployment figures),
        and the Town Board resolution record for the {dollars(committedThisYear)} committed during 2026. That total is
        mixed in provenance and should not be read as one source: {dollars(committedDocumented)} was read from Section G
        of the Fiscal Impact Statements, where the Town names its own Appropriated Fund Balance account, and{' '}
        {dollars(committedAuthorized)} comes from separately sourced resolutions and the Town Square record whose
        statements name no account code. Both are itemized on{' '}
        <a href={`${base}/predict-2027/`} style={{ color: 'var(--rbl-link)' }}>/predict-2027/</a>, each row labeled with
        its basis. Classification
        definitions follow GASB Statement 54. Peer-town figures from each town&apos;s own 2026 adopted budget or policy
        document where available.
      </p>
    </PageShell>
  )
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details style={{ ...card, padding: 0, marginBottom: 12, overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{title}</span>
        <span aria-hidden style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>Open ▾</span>
      </summary>
      <div style={{ padding: '0 18px 18px' }}>{children}</div>
    </details>
  )
}
