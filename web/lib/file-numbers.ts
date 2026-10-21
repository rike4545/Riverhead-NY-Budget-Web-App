// How the Town's payroll file numbers ("GFZ 000980") run. The Town has not
// published how it assigns them; this is what its own roster shows when each
// number is matched to the hire year in the payroll exports.
//
// Sources: the Town's payroll company-code roster (etl/data/payroll/
// gfz-code-lookup.csv: company code, name, file number) and the Gross Earnings
// exports' hire year and status (etl/data/payroll/gross-earnings-*.csv).
// scripts/verify-file-numbers.mjs re-derives every figure here from them.

export type FileNumberBlock = {
  from: string
  to: string
  people: number
  hired: string
  who: string
  order: string
}

export const fileNumbers = {
  code: 'GFZ',
  rosterPeople: 974,
  highestOnRoster: '001308',
  highestHireYear: 2021,
  blocks: [
    {
      from: '000051', to: '000670', people: 420, hired: '1967–2016',
      who: 'People working for the Town when the numbering began',
      order: 'By hire year, oldest first',
    },
    {
      from: '000671', to: '000815', people: 125, hired: '1954–2013',
      who: 'Former employees still on the payroll, 122 of them retired or deceased',
      order: 'By hire year, oldest first',
    },
    {
      from: '000816', to: '001308', people: 417, hired: '2013–2021',
      who: 'People hired, or hired back, after the numbering began',
      order: 'The next number as each person joined',
    },
    {
      from: '900002', to: '900017', people: 12, hired: '1976–2007',
      who: 'Retired or deceased former employees, numbered separately',
      order: 'No pattern by hire year',
    },
  ] satisfies FileNumberBlock[],
  // One person in 000671–000815 has a hire year of 1900 in the exports, which
  // reads as a placeholder; the hire-year ranges leave it out.
  // Five numbers appear under two names on the roster: each is one person
  // whose name changed or was spelled two ways.
  sharedNumbers: 5,
  // The highest number the Town Board has cited, as of the October 20, 2026
  // agenda packet: Resolution 2026-951 "terminates employee GFZ001716".
  latestCited: { number: '001716', resolution: '2026-951', meeting: 'October 20, 2026' },
  example: { number: '000980', name: 'Carroll, Bryan', hired: 2018, yearFrom: '000975', yearTo: '001072' },
} as const
