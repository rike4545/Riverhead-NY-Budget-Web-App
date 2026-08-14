import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { debtProfile } from '../../lib/debt-profile'
import { appropriations, percentOfAppropriations, unassignedFundBalance } from '../../lib/reserve-policy'
import {
  riverheadCurrent,
  riverheadRatingHistory,
  riverheadRatingGap,
  brookhaven,
  brookhavenQuoteNote,
  peerRatings,
  ratingCriteria,
  levers,
  caveats,
} from '../../lib/credit-rating'
import retireeHealthComparison from '../../public/data/retiree-health-comparison.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export const metadata = {
  title: "Credit rating — Riverhead's Aa2 vs. Brookhaven's AAA",
  description:
    "Riverhead carries a Moody's Aa2 rating; Brookhaven carries Moody's Aaa and S&P's AAA. What separates them, how Riverhead compares to other Suffolk towns, and concrete steps that map to the rating agencies' own stated criteria.",
}

const riverheadPct = percentOfAppropriations(unassignedFundBalance, appropriations)
const riverheadOpebPerResident = retireeHealthComparison.towns.find((t: any) => t.isRiverhead)?.perResident ?? 0
const opebRankOfTen = retireeHealthComparison.towns
  .slice()
  .sort((a: any, b: any) => b.perResident - a.perResident)
  .findIndex((t: any) => t.isRiverhead) + 1

const confidenceBadge = (c: 'VERIFIED' | 'REPORTED') => (
  <span
    style={{
      marginLeft: 8,
      fontSize: 10.5,
      fontWeight: 900,
      letterSpacing: 0.3,
      padding: '2px 7px',
      borderRadius: 999,
      background: c === 'VERIFIED' ? '#dcfce7' : '#fef3c7',
      color: c === 'VERIFIED' ? '#166534' : '#92400e',
    }}
  >
    {c}
  </span>
)

export default function CreditRatingPage() {
  return (
    <PageShell
      title="Credit rating: Aa2 vs. Brookhaven's AAA"
      subtitle="Riverhead borrows at Moody's Aa2. Brookhaven borrows at Moody's Aaa and S&P's AAA — the top of both scales. Here's what the rating agencies actually said about each town, how Riverhead stacks up against its other Suffolk neighbors, and concrete steps that map to the agencies' own published criteria."
    >
      <PlainCallout
        tips={[
          { label: 'What a rating is', text: 'an independent agency\'s opinion of how likely a town is to repay its debt on time — a higher rating usually means lower interest costs when the Town borrows.' },
          { label: 'Aa2 vs. AAA', text: 'both are "investment grade," but AAA is the top of the scale; Aa2 sits two notches below it on Moody\'s ladder.' },
          { label: 'Sourcing here', text: 'primary rating-agency documents were not directly reachable while building this page — every reported quote and figure below is flagged VERIFIED (from an audited Town filing already used elsewhere on this site) or REPORTED (from news coverage, not independently confirmed).' },
        ]}
      >
        A credit rating is not a report card on how a town feels about its finances — it&apos;s a specific, published
        opinion an independent agency sells to bond buyers. Riverhead and Brookhaven are both rated by Moody&apos;s, which
        makes them directly comparable on the same scale. Brookhaven adds a second rating from S&amp;P, at the top of
        that scale too.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Riverhead — Moody's" value={riverheadCurrent.rating} sub={`affirmed ${riverheadCurrent.affirmedDate}`} />
        <Stat label="Brookhaven — Moody's" value={brookhaven.moodyRating} sub={`${brookhaven.consecutiveMoodyAaaYears}th consecutive year`} accent />
        <Stat label="Brookhaven — S&P" value={brookhaven.spRating} sub={`outlook: ${brookhaven.outlook}`} accent />
        <Stat label="Riverhead reserve strength" value={pct(riverheadPct)} sub="of 2026 General Fund budget — above Brookhaven's own ~38.8%" />
        <Stat label="Riverhead OPEB rank" value={`${opebRankOfTen} of 10`} sub="highest per-resident retiree-health liability, Suffolk towns" />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>The puzzle this page is about</h3>
        <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
          Riverhead&apos;s reserve cushion — {pct(riverheadPct)} of its General Fund budget — is already{' '}
          <strong>above</strong> Brookhaven&apos;s own posture (~38.8%), and its debt burden is minimal: just{' '}
          <strong>{debtProfile.debtLimit.debtLimitExhaustedPct}%</strong> of its legal debt limit used. On paper, the two
          headline numbers rating agencies talk about most — reserves and debt — both favor Riverhead. So why does
          Brookhaven sit at the top of the scale while Riverhead sits two notches below it? The rating criteria section
          below breaks out where the two towns most likely diverge — and it isn&apos;t reserves or bonded debt.
        </p>
      </section>

      <h2 style={{ color: '#284a69' }}>Riverhead&apos;s rating history</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {riverheadRatingHistory.map((e) => (
            <div key={e.date} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <strong style={{ color: '#284a69', fontSize: 14.5 }}>{e.date} — {e.action}: {e.rating}</strong>
                {confidenceBadge(e.confidence)}
              </div>
              {e.quote && (
                <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '6px 0 0', fontStyle: 'italic' }}>
                  &ldquo;{e.quote}&rdquo;
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: 12.5, fontStyle: 'normal', marginTop: 3 }}>— {e.quoteAttribution}</span>
                </p>
              )}
            </div>
          ))}
        </div>
        <p style={{ color: '#b45309', fontSize: 13, lineHeight: 1.55, marginTop: 14, marginBottom: 0, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px' }}>
          {riverheadRatingGap}
        </p>
      </section>

      <h2 style={{ color: '#284a69' }}>Brookhaven&apos;s AAA</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <strong style={{ color: '#284a69', fontSize: 14.5 }}>
            Moody&apos;s Aaa ({brookhaven.consecutiveMoodyAaaYears} consecutive years) and S&amp;P AAA, {brookhaven.asOf}
          </strong>
          {confidenceBadge(brookhaven.confidence)}
        </div>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 10px', fontStyle: 'italic' }}>
          &ldquo;{brookhaven.spRationale}&rdquo;
          <span style={{ display: 'block', color: '#94a3b8', fontSize: 12.5, fontStyle: 'normal', marginTop: 3 }}>
            — S&amp;P rating rationale, as reported {confidenceBadge(brookhaven.spRationaleConfidence)}
          </span>
        </p>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{brookhaven.history}</p>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          <strong style={{ color: '#92400e', fontSize: 13.5 }}>About the quote you sent us</strong>
          <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '4px 0 0' }}>
            &ldquo;{brookhavenQuoteNote.suppliedQuote}&rdquo; — this exact line could not be located in any source
            checked for this page, so it isn&apos;t published above as an attributed quote. The closest confirmed,
            adjacent statement found was about a different announcement: {brookhavenQuoteNote.closestConfirmedAdjacent}
          </p>
        </div>
      </section>

      <h2 style={{ color: '#284a69' }}>How Riverhead compares to its Suffolk neighbors</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Moody&apos;s scale only, so every bar is the same agency&apos;s opinion. Towns with a separate S&amp;P or
          Fitch AAA are labeled but not placed on this bar — those are different agencies&apos; scales and this site
          won&apos;t invent an equivalence between them.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {peerRatings
            .slice()
            .sort((a, b) => a.moodyNotchesBelowAaa - b.moodyNotchesBelowAaa)
            .map((t) => {
              const barPct = Math.max(6, (1 - t.moodyNotchesBelowAaa / 10) * 100)
              return (
                <div key={t.town} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 118, fontSize: 13.5, fontWeight: t.isRiverhead ? 900 : 600, color: t.isRiverhead ? '#284a69' : '#475569' }}>
                    {t.town}
                  </span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 24, overflow: 'hidden', position: 'relative' }}>
                    {t.moodyRating && (
                      <div style={{ width: `${barPct}%`, background: t.isRiverhead ? '#b45309' : '#94a3b8', height: '100%', borderRadius: 6 }} />
                    )}
                  </div>
                  <span style={{ width: 130, fontSize: 12.5, color: t.isRiverhead ? '#b45309' : '#334155', fontWeight: t.isRiverhead ? 900 : 700 }}>
                    {t.moodyRating ?? '—'}{t.otherAgencyRating ? ` · ${t.otherAgencyRating}` : ''}
                  </span>
                  <span style={{ width: 170, textAlign: 'right', fontSize: 11.5, color: '#94a3b8' }}>{t.asOf}</span>
                </div>
              )
            })}
        </div>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          Ratings dated 2015 or 2020 are the newest found for that town in this pass and may no longer be current —
          treat those rows as directional, not as today&apos;s confirmed rating.
        </p>
      </section>

      <h2 style={{ color: '#284a69' }}>What the rating criteria actually weigh</h2>
      <section style={{ ...card, marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Approximate weights synthesized from secondary summaries of Moody&apos;s and S&amp;P&apos;s published
          municipal-rating methodologies — treat the percentages as illustrative, not exact.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {ratingCriteria.map((c) => (
            <div key={c.factor} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: '#284a69', fontSize: 14.5 }}>{c.factor}</strong>
                <span style={{ color: '#9b6b12', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{c.approxWeight}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 6px' }}>{c.whatItMeans}</p>
              <p style={{ color: '#334155', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{c.riverheadRead}</p>
            </div>
          ))}
        </div>
      </section>

      <h2 style={{ color: '#284a69' }}>Five concrete ways to move the needle</h2>
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #0f766e' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {levers.map((l, i) => (
            <div key={l.title} style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#0f766e22', color: '#0f766e',
                  display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <strong style={{ fontSize: 14.5, color: '#284a69' }}>{l.title}</strong>
                <p style={{ color: '#334155', fontSize: 13.5, lineHeight: 1.6, margin: '4px 0 6px' }}>{l.detail}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0, fontStyle: 'italic' }}>{l.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>OPEB in context: where Riverhead's per-resident liability ranks</h3>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
          Riverhead&apos;s retiree-health liability is <strong>{usd(riverheadOpebPerResident)} per resident</strong> — the{' '}
          {opebRankOfTen}th-highest of the 10 Suffolk towns in the Empire Center&apos;s comparison, and well above
          Brookhaven&apos;s {usd(retireeHealthComparison.towns.find((t: any) => t.name === 'Brookhaven')?.perResident ?? 0)}.
          Brookhaven&apos;s much larger population spreads a bigger total liability into a smaller per-resident number,
          but its rating rationale also explicitly credits &ldquo;manageable pension and OPEB costs&rdquo; — this is a
          named factor, not incidental context.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '7px 9px' }}>Town</th>
                <th style={{ padding: '7px 9px', textAlign: 'right' }}>OPEB per resident</th>
              </tr>
            </thead>
            <tbody>
              {retireeHealthComparison.towns
                .slice()
                .sort((a: any, b: any) => b.perResident - a.perResident)
                .map((t: any) => (
                  <tr key={t.name} style={{ borderBottom: '1px solid #f1f5f9', background: t.isRiverhead ? '#f0fdfa' : undefined, fontWeight: t.isRiverhead ? 800 : 400 }}>
                    <td style={{ padding: '6px 9px', color: t.isRiverhead ? '#0f766e' : '#284a69' }}>{t.name}{t.isRiverhead ? ' ← this site' : ''}</td>
                    <td style={{ padding: '6px 9px', textAlign: 'right', color: t.isRiverhead ? '#0f766e' : '#334155' }}>{usd(t.perResident)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Source: Empire Center for Public Policy OPEB Liabilities Tool (Dec. 2020) — see the{' '}
          2026 Buyout page for the fuller breakdown and methodology note.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Limits of this page</h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {caveats.map((c) => (
            <li key={c} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: '#94a3b8', fontWeight: 900 }}>›</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>
        Sources: Town of Riverhead 2025 Annual Financial Report and 2023 Audited Basic Financial Statements (debt
        limit, OPEB liability); RiverheadLOCAL reporting on Moody&apos;s rating actions (2015, 2021, 2024); Town of
        Brookhaven press releases and The Bond Buyer on Brookhaven&apos;s AAA history; Empire Center for Public Policy
        OPEB Liabilities Tool. Independent public-information project — verify rating-agency quotes against the
        agencies&apos; own published rating letters before relying on them.
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: '#284a69' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
