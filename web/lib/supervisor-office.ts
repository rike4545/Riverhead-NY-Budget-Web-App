// The Supervisor's own office, read from the salary schedules themselves.
//
// WHO IS IN IT. The schedule attached to Resolution 2026-2 groups the Town's
// general employees under department headings, and one of them is SUPERVISOR’S
// OFFICE: a Deputy Town Supervisor, a Town Budget Officer and a Secretary. The
// Supervisor's own salary is set apart from it, with the other elected
// officials (Resolution 2026-1). Those four are the office's payroll.
//
// 2025 BY TITLE. The 2025 schedule prints the same heading, but it is read from
// the minutes, whose text extraction hoists each heading to the foot of its
// page, so this site publishes no 2025 department at all. Each of the office's
// titles appears exactly once in both years' schedules, so whoever held it in
// 2025 is not in doubt, and the 2025 payroll files the same people under its
// "Supervisor" departments. If a title ever stops being unique, the build fails
// here rather than pairing the wrong people.
//
// ONE ADJUSTMENT. A January schedule is not the whole of a year's pay. At the
// meeting that adopted the 2025 schedule, Resolution 2025-64 raised the Chief of
// Staff, who holds the Town Budget Officer line, 7.5% from January 1, 2025, at
// Supervisor Hubbard's request. Read from the schedule alone, the 2025 office
// looks $5,443 cheaper than it was and her 2026 increase looks like 11%, when
// it was 3.3%.

import sal25 from '../public/data/salary/authorized-2025.json'
import sal26 from '../public/data/salary/authorized-2026.json'

type Rec = {
  name: string
  grade: string
  title: string
  department: string | null
  annual: number
  isStipend: boolean
  actualRegular?: number
}

const rows = (d: unknown) => (d as { records: Rec[] }).records.filter((r) => !r.isStipend)
const y25 = rows(sal25)
const y26 = rows(sal26)

/** The heading as the 2026 schedule prints it. */
export const OFFICE_HEADING = 'Supervisor’s Office'
const SUPERVISOR = 'Town Supervisor'

export const raise2025 = {
  resolution: '2025-64',
  adopted: 'January 7, 2025',
  title: 'Town Budget Officer',
  rate: 0.075,
}

export const documents = {
  schedule2026: {
    label: '2026 salary schedule, attachment to TB Resolution 2026-2 (Supervisor’s Office section)',
    url: 'https://riverheadny.portal.civicclerk.com/event/6434/files/attachment/989',
    date: 'Jan. 6, 2026',
  },
  packet2026: {
    label: 'Town Board agenda packet, Resolutions 2026-1, 2026-2 and 2026-58 to 2026-60',
    url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=10512,plainText=false)',
    date: 'Jan. 6, 2026',
  },
  packet2025Dec: {
    label: 'Town Board agenda packet, Resolution 2025-984 and its fiscal impact statement (pp. 42–43)',
    url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=10450,plainText=false)',
    date: 'Dec. 16, 2025',
  },
  minutes2025: {
    label: 'Town Board minutes, with the 2025 schedules (Resolutions 2025-8 and 2025-9) and Resolution 2025-64',
    url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=2722,plainText=false)',
    date: 'Jan. 7, 2025',
  },
}

function only(list: Rec[], title: string, year: number): Rec {
  const m = list.filter((r) => r.title === title)
  if (m.length !== 1) throw new Error(`supervisor-office: ${m.length} "${title}" rows in the ${year} schedule, expected exactly one`)
  return m[0]
}

const cents = (n: number) => Math.round(n * 100) / 100
const sum = (xs: number[]) => cents(xs.reduce((s, x) => s + x, 0))

export type Seat = {
  title: string
  holder2025: string
  /** As printed in the January 2025 schedule. */
  schedule2025: number
  /** With the raise adopted beside the schedule, where there was one. */
  salary2025: number
  holder2026: string
  salary2026: number
  /** Regular earnings on the 2025 payroll. */
  paid2025: number | null
}

function seat(title: string): Seat {
  const a = only(y25, title, 2025)
  const b = only(y26, title, 2026)
  const bump = title === raise2025.title ? 1 + raise2025.rate : 1
  return {
    title,
    holder2025: a.name,
    schedule2025: a.annual,
    salary2025: cents(a.annual * bump),
    holder2026: b.name,
    salary2026: b.annual,
    paid2025: a.actualRegular ?? null,
  }
}

const staffTitles = y26.filter((r) => r.department === OFFICE_HEADING).map((r) => r.title)
if (staffTitles.length === 0) throw new Error(`supervisor-office: no "${OFFICE_HEADING}" rows in the 2026 schedule`)

/** The staff the 2026 schedule lists under the office's heading. */
export const staff: Seat[] = staffTitles.map(seat)
/** The Supervisor, from the Elected Officials schedule. */
export const supervisor: Seat = seat(SUPERVISOR)
const all = [...staff, supervisor]
const paid = all.map((s) => s.paid2025)

export const totals = {
  staff2025: sum(staff.map((s) => s.salary2025)),
  staff2026: sum(staff.map((s) => s.salary2026)),
  office2025: sum(all.map((s) => s.salary2025)),
  office2026: sum(all.map((s) => s.salary2026)),
  /** The 2025 total as the schedule alone prints it. */
  office2025Schedule: sum(all.map((s) => s.schedule2025)),
  paid2025: paid.every((p) => p !== null) ? sum(paid as number[]) : null,
}

// The rate on the Deputy Supervisor's line, and how many other positions paid
// off the union grid (no grade or step printed) got exactly the same. A title
// change between the years is a promotion, not a rate, so it is not counted,
// and neither is anyone in the office itself.
const deputy = staff.find((s) => s.title === 'Deputy Town Supervisor') ?? null
export const deputyRate = deputy ? deputy.salary2026 / deputy.salary2025 - 1 : null

const by25: Record<string, Rec> = {}
y25.forEach((r) => { if (!by25[r.name]) by25[r.name] = r })
const officeTitles = all.map((s) => s.title)

export const sameRateCount = deputyRate === null ? 0 : y26.filter((r) => {
  const b = by25[r.name]
  if (!b || r.grade || b.grade || b.title !== r.title || officeTitles.indexOf(r.title) >= 0 || b.annual < 20_000) return false
  // Elected salaries are set in whole dollars, so a dollar's tolerance.
  return Math.abs(r.annual - b.annual * (1 + deputyRate)) <= 1
}).length
