'use client'

// The arrivals and departures behind a net change.
//
// A net figure answers "how many" and hides "who". Recreation's +16 is 123
// people hired against 104 who left; Heavy Equipment Operator's fall from 15 to
// 6 is almost nobody leaving at all — eight of them were retitled and kept
// working for the Town. Those two rows look identical in a Change column and
// mean opposite things, which is why the split is shown rather than summarised.

export type Churn = Record<string, number[]>

/** [hired, movedIn, left, movedOut] summed across the compared years. */
export function churnTotals(churn: Churn | undefined, years: number[]): [number, number, number, number] {
  const out: [number, number, number, number] = [0, 0, 0, 0]
  for (const y of years) {
    const row = churn?.[String(y)]
    if (!row) continue
    for (let i = 0; i < 4; i++) out[i] += row[i] ?? 0
  }
  return out
}

// Moving in and moving out are opposite flows, so they are never added together
// into one "moved" figure: for Heavy Equipment Operator the whole finding is
// that eight people moved OUT and none were hired, and a combined number would
// bury exactly that. Shown apart, the four add up — hired + moved in − left −
// moved out is the net change across the years named on the line.
export function ChurnLine({ churn, years, compact }: { churn: Churn | undefined; years: number[]; compact?: boolean }) {
  const [hired, movedIn, left, movedOut] = churnTotals(churn, years)
  if (hired + movedIn + left + movedOut === 0) return null
  const span = years.length > 0 ? `${years[0] - 1}–${years[years.length - 1]}` : ''
  const parts: React.ReactNode[] = []
  if (hired > 0) parts.push(<span key="h" style={{ color: 'var(--rbl-success-strong)', fontWeight: 700 }}>{hired} hired</span>)
  if (movedIn > 0) parts.push(<span key="mi" title="Already worked for the Town under a different title or department">{movedIn} moved in</span>)
  if (left > 0) parts.push(<span key="l" style={{ color: 'var(--rbl-danger)', fontWeight: 700 }}>{left} left the Town</span>)
  if (movedOut > 0) parts.push(<span key="mo" title="Kept working for the Town under a different title or department">{movedOut} moved elsewhere in the Town</span>)
  return (
    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2, lineHeight: 1.45 }}>
      {!compact && <span>{span}: </span>}
      {parts.map((p, i) => <span key={i}>{i > 0 && ' · '}{p}</span>)}
    </div>
  )
}
