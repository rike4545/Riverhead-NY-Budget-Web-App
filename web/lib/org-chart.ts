// The Town of Riverhead as an organization chart: the offices residents elect,
// and the departments the Town Board oversees, each with every job title its
// payroll paid in the latest year and how many people held it.
//
// The Town publishes no organization chart, so this one is put together from
// three records, and the page says so:
//   - Which offices are elected: the Town's payroll marks them in its own
//     department codes ("Supervisor Elected", "Town Board Elected", "Town Clerk
//     Elected", "Highway Admin Elected/Appointed", "Tax Collection Elected",
//     "Assessment Elected/Board", "Justice Court Elected").
//   - The departments and their names: the Departments list on the Town's
//     website, read October 8, 2026.
//   - The positions: each payroll department's job titles and headcount, from
//     the Town's Gross Earnings reports (titles-by-year.json).
// Which payroll departments make up each Town department is this site's
// reading of their names and of the budget's departments; each unit lists the
// payroll codes it is built from. A payroll code is the department the payroll
// report lists a person under, which the budget can group differently: the
// payroll lists code enforcement officers under the Town Attorney, while the
// budget has a Code Enforcement department. A head is named only where the
// payroll itself pays a title that names the role, and the check holds it to
// that.
//
// This file imports nothing, so scripts/verify-workforce.mjs can check under
// Node that every payroll department with staff is placed exactly once.

export type OrgUnit = {
  /** The Town's own name for the office or department. */
  name: string
  /** The title that heads it: the start of a title its payroll pays, matched without regard to case. */
  head?: string
  /** How the page names the head, where "the {head}" would read wrong. */
  headLabel?: string
  /** The payroll department codes it is built from. */
  payroll: string[]
  note?: string
}
export type OrgGroup = { id: string; name: string; about: string; units: OrgUnit[] }

export const TOWN_DEPARTMENTS_SOURCE = { title: 'Town of Riverhead, Departments', url: 'https://www.townofriverheadny.gov/31/Departments', read: 'October 8, 2026' }

export const ELECTED: OrgGroup = {
  id: 'elected',
  name: 'Elected by residents',
  about: 'The offices the Town’s payroll marks as elected. Each official runs an office of their own.',
  units: [
    { name: 'Town Supervisor', head: 'Supervisor', headLabel: 'The elected Supervisor', payroll: ['Supervisor Elected', 'Supervisor Management', 'Supervisor Clerical'], note: 'Sits on the Town Board and prepares the budget each year.' },
    { name: 'Town Board', head: 'Council Member', headLabel: 'Four elected Council Members and the Supervisor', payroll: ['Town Board Elected'], note: 'The Board adopts the budget and appoints the heads of the departments below, as it did the Police Chief in November 2025 (Resolution 2025-904).' },
    { name: 'Town Clerk', head: 'Town Clerk', headLabel: 'The elected Town Clerk', payroll: ['Town Clerk Elected', 'Town Clerk'] },
    { name: 'Highway', head: 'Superintendent of Highways', headLabel: 'The elected Superintendent of Highways', payroll: ['Highway Admin  Elected/Appointed', 'Highway Admin Clerical', 'General Repairs Highway'] },
    { name: 'Receiver of Taxes', head: 'Town Tax Receiver', headLabel: 'The elected Town Tax Receiver', payroll: ['Tax Collection Elected', 'Tax Collection'] },
    { name: 'Assessor', head: 'Member of Board of Assessors', headLabel: 'The elected Board of Assessors', payroll: ['Assessment Elected/Board', 'Assessment'], note: 'The same payroll code also lists a member of an appointed board.' },
    { name: 'Justice Court', head: 'Town Justice', headLabel: 'Two elected Town Justices', payroll: ['Justice Court Elected', 'Justice Court', 'Court Officers'] },
  ],
}

export const DEPARTMENTS: OrgGroup[] = [
  {
    id: 'government',
    name: 'General government',
    about: 'The offices that run the Town itself.',
    units: [
      { name: 'Town Attorney', head: 'Town Attorney', payroll: ['Town Attorney Management', 'Town Attorney Appointed', 'Town Attorney Clerical'], note: 'Its payroll codes also list the Town’s code enforcement officers, ordinance inspectors and investigators, its Personnel Officer and a Personnel Assistant. The budget has separate Code Enforcement and Personnel Officer departments.' },
      { name: 'Personnel', payroll: [], note: 'The Town lists it as a department, and the budget funds it under Personnel Officer; the payroll lists its staff under the Town Attorney’s codes.' },
      { name: 'Accounting', payroll: ['Accounting Management', 'Accounting'] },
      { name: 'Purchasing', payroll: ['Purchasing'] },
      { name: 'Information Technology', payroll: ['Information Technology'] },
      { name: 'Buildings and Grounds', payroll: ['Buildings and Grounds'], note: 'A payroll and budget department that the Town’s list doesn’t name.' },
      { name: 'Municipal Garage', payroll: ['Municipal Garage'], note: 'A payroll and budget department that the Town’s list doesn’t name.' },
    ],
  },
  {
    id: 'safety',
    name: 'Public safety',
    about: 'Police, fire prevention, building safety and code enforcement.',
    units: [
      {
        name: 'Police Department', head: 'Police Chief',
        payroll: ['Headquarters', 'Squad 1 - Police', 'Squad 2 - Police', 'Squad 3 - Police', 'Squad 4 - Police', 'Squad 5 - Police', 'COPE Comm Oriented Police Enforce', 'Detectives', 'K-9', 'P/T Police', 'Police Clerical', 'Juvenile Aide Bureau / Police', 'Det Attnd', 'Crossing Guards'],
        note: 'Crossing guards and holding-cell attendants are paid from the Police budget.',
      },
      { name: 'Public Safety Dispatch', payroll: ['PSD - Public Safet Disp'], note: 'A payroll department of its own; the budget has no separate dispatch department.' },
      { name: 'Traffic Control and parking officers', payroll: ['Traffic Control', 'PMO - Parking Meter Officer'], note: 'Payroll departments the Town’s list doesn’t name.' },
      { name: 'Bay Constable', payroll: ['Harbormaster I'], note: 'The payroll calls it Harbormaster; the budget’s Bay Constable department pays its pump-out boat operator.' },
      { name: 'Fire Prevention', head: 'Chief Fire Marshal', payroll: ['Fire Marshal', 'Fire Marshall'] },
      { name: 'Building', head: 'Town Building & Planning Administrator', payroll: ['Building / Planning Management', 'Safety Inspection / Inspectors', 'Safety Inspection / Clerical'], note: 'Its management code is shared with Planning.' },
      { name: 'Code Enforcement', payroll: ['Code Enforcement'], note: 'Its own payroll code lists one office assistant; the payroll lists the code enforcement officers, ordinance inspectors and investigators under the Town Attorney’s codes. The budget funds Code Enforcement as a department of its own.' },
      { name: 'Animal Control', payroll: [], note: 'The Town lists it as a department; it has no payroll department of its own, and the budget funds it as Control of Dogs.' },
    ],
  },
  {
    id: 'planning',
    name: 'Planning and development',
    about: 'Land use, engineering and the Town’s development projects.',
    units: [
      { name: 'Planning', payroll: ['Planning Department', 'Planning / Zoning / CAC/AARB'], note: 'Includes the appointed Planning Board, Zoning Board of Appeals and advisory boards, whose members are paid a stipend.' },
      { name: 'Community Development', payroll: ['Community Development Management', 'Community Development Clerical'] },
      { name: 'Engineering', head: 'Town Engineer', payroll: ['Town Engineer Management', 'Town Engineer'] },
      { name: 'Historian', payroll: ['Town Historian Planning Department'] },
      { name: 'Industrial Development Agency', payroll: [], note: 'The Town lists it with its departments; it is a separate public agency and is not on the Town payroll.' },
    ],
  },
  {
    id: 'community',
    name: 'Recreation and seniors',
    about: 'Programs residents use directly.',
    units: [
      { name: 'Parks & Recreation', head: 'Superintendent of Recreation', payroll: ['Recreation Management', 'Recreation'], note: 'Most of its people are seasonal or part-time: lifeguards, beach attendants and recreation aides.' },
      { name: 'Senior Citizen Programs', head: 'Senior Citizens Program Director', payroll: ['Nutrition Management', 'Nutrition'] },
    ],
  },
  {
    id: 'districts',
    name: 'Districts and utilities',
    about: 'The water, sewer, sanitation and lighting services the Town runs.',
    units: [
      { name: 'Water District', head: 'Water District Superintendent', payroll: ['Water Management', 'Water'] },
      { name: 'Sewer District', payroll: ['Sewer / Scavenger Waste Management', 'Sewer / Scavenger Waste'], note: 'Its management code listed the Wastewater District Superintendent from 2022 to 2024; in 2025 the payroll lists that title under the planning and zoning boards’ code instead.' },
      { name: 'Sanitation', payroll: ['Sanitation'] },
      { name: 'Street Lighting', payroll: ['Street Lighting'], note: 'A payroll department and district that the Town’s department list doesn’t name.' },
    ],
  },
]

export const ALL_UNITS: OrgUnit[] = [ELECTED, ...DEPARTMENTS].reduce<OrgUnit[]>((all, g) => all.concat(g.units), [])

// ── Filling the chart in from the payroll ─────────────────────────────────────

export type PayrollDepartment = { department: string; counts: Record<string, number>; casual?: Record<string, number>; untitled?: Record<string, number>; titles: { title: string; counts: Record<string, number> }[] }
export type FilledUnit = OrgUnit & {
  people: number
  /** Of those, paid in a seasonal, part-time or no-time-card class. */
  casual: number
  /** Of those, paid with no title on the payroll; the titles add up to people less these. */
  untitled: number
  /** Every title paid in the year, most people first, summed across the unit's payroll codes. */
  titles: { title: string; people: number }[]
}

/** One unit's people and titles in a year, from the payroll departments it is built from. */
export function fill(unit: OrgUnit, departments: PayrollDepartment[], year: number): FilledUnit {
  const y = String(year)
  const mine = departments.filter((d) => unit.payroll.indexOf(d.department) >= 0)
  const byTitle = new Map<string, number>()
  for (const d of mine) for (const t of d.titles) {
    const n = t.counts[y] ?? 0
    if (n > 0) byTitle.set(t.title, (byTitle.get(t.title) ?? 0) + n)
  }
  return {
    ...unit,
    people: mine.reduce((sum, d) => sum + (d.counts[y] ?? 0), 0),
    casual: mine.reduce((sum, d) => sum + (d.casual?.[y] ?? 0), 0),
    untitled: mine.reduce((sum, d) => sum + (d.untitled?.[y] ?? 0), 0),
    titles: Array.from(byTitle.entries()).map(([title, people]) => ({ title, people })).sort((a, b) => b.people - a.people || a.title.localeCompare(b.title)),
  }
}
