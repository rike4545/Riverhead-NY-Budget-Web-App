'use client'

// The arrivals and departures behind a net change.
//
// A net figure answers "how many" and hides "who". Heavy Equipment Operator's
// fall from 15 to 6 is almost nobody leaving at all — nine of them were
// retitled and kept working for the Town. That row and a row where nine people
// genuinely quit look identical in a Change column and mean opposite things.
//
// These flows count REGULAR staff only. The Town's NON-TIME, Part Time and
// Seasonal pay classes are counted separately, because lifeguards returning
// each June are not a workforce turning over: on the first pass this page
// reported Recreation hiring 123 people and losing 104 across 2022–2025, when
// its six permanent staff saw one of each. The group is not purely seasonal —
// appointed board members paid a stipend file no time card either — so it is
// labelled for what the Town calls it rather than guessed at.

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
// that people moved OUT and none were hired. Shown apart, the four add up —
// hired + moved in − left − moved out is the change in regular staff across the
// years named on the line.
export function ChurnLine({ churn, years }: { churn: Churn | undefined; years: number[] }) {
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
      <span>{span} regular staff: </span>
      {parts.map((p, i) => <span key={i}>{i > 0 && ' · '}{p}</span>)}
    </div>
  )
}

// Shown wherever casual staff exist, so a row of 132 people is never read as
// 132 jobs. Without it, Recreation's six permanent posts are invisible.
export function CasualNote({ casual, total, year }: { casual: Record<string, number> | undefined; total: number; year: number }) {
  const n = casual?.[String(year)] ?? 0
  if (n <= 0) return null
  const regular = total - n
  return (
    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2, lineHeight: 1.45 }}>
      <span title="The Town's NON-TIME, Part Time and Seasonal pay classes — seasonal recreation staff, and appointed board members paid a stipend">
        {year}: {regular.toLocaleString()} regular · <strong style={{ fontWeight: 700 }}>{n.toLocaleString()} seasonal or part-time</strong>
      </span>
    </div>
  )
}
