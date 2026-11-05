// Unofficial result of the November 3, 2026 Town Supervisor race, copied from the
// Suffolk County Board of Elections' election-night results page
// (app.enhancedvoting.com, "Last Updated" Nov. 4, 2026, 12:24:42 AM). It is not
// certified. Replace it with the Board's certified count when that is published,
// and say so on the page. Prior-year margins come from board-elections.json.
export const supervisorResult2026 = {
  office: 'Town Supervisor',
  electionDate: 'November 3, 2026',
  status: 'Unofficial',
  asOf: 'November 4, 2026, 12:24 AM',
  districtsReporting: { reported: 22, of: 22 },
  countyStatus: 'The County labels all 22 election districts “Partially Reported”. Its status panel shows early voting and absentee/EVBM ballots as “Election Night Complete” and affidavit ballots as “Not Reported”.',
  candidates: [
    { name: 'Jerry Halpin', lines: 'Democratic 6,587 + Taxpayers First 192', votes: 6779, percent: '52.40%' },
    { name: 'Ken Rothwell', lines: 'Republican 5,264 + Conservative 888', votes: 6152, percent: '47.55%' },
    { name: 'Write-in', lines: '', votes: 7, percent: '0.05%' },
  ],
  total: 12938,
  margin: 627,
  districts: [
    { ed: '001', halpinDem: 382, halpinTpf: 7, rothwellRep: 298, rothwellCon: 71, writeIn: 0, total: 758 },
    { ed: '002', halpinDem: 165, halpinTpf: 4, rothwellRep: 67, rothwellCon: 16, writeIn: 0, total: 252 },
    { ed: '003', halpinDem: 60, halpinTpf: 2, rothwellRep: 22, rothwellCon: 8, writeIn: 0, total: 92 },
    { ed: '004', halpinDem: 375, halpinTpf: 7, rothwellRep: 235, rothwellCon: 37, writeIn: 3, total: 657 },
    { ed: '005', halpinDem: 123, halpinTpf: 6, rothwellRep: 64, rothwellCon: 8, writeIn: 0, total: 201 },
    { ed: '006', halpinDem: 123, halpinTpf: 7, rothwellRep: 46, rothwellCon: 9, writeIn: 1, total: 186 },
    { ed: '007', halpinDem: 439, halpinTpf: 15, rothwellRep: 373, rothwellCon: 48, writeIn: 0, total: 875 },
    { ed: '008', halpinDem: 282, halpinTpf: 5, rothwellRep: 173, rothwellCon: 29, writeIn: 0, total: 489 },
    { ed: '009', halpinDem: 238, halpinTpf: 5, rothwellRep: 134, rothwellCon: 18, writeIn: 1, total: 396 },
    { ed: '010', halpinDem: 134, halpinTpf: 5, rothwellRep: 108, rothwellCon: 15, writeIn: 0, total: 262 },
    { ed: '011', halpinDem: 375, halpinTpf: 13, rothwellRep: 348, rothwellCon: 55, writeIn: 0, total: 791 },
    { ed: '012', halpinDem: 597, halpinTpf: 13, rothwellRep: 435, rothwellCon: 48, writeIn: 0, total: 1093 },
    { ed: '013', halpinDem: 383, halpinTpf: 9, rothwellRep: 226, rothwellCon: 40, writeIn: 1, total: 659 },
    { ed: '014', halpinDem: 401, halpinTpf: 8, rothwellRep: 397, rothwellCon: 69, writeIn: 0, total: 875 },
    { ed: '015', halpinDem: 52, halpinTpf: 0, rothwellRep: 43, rothwellCon: 6, writeIn: 0, total: 101 },
    { ed: '016', halpinDem: 245, halpinTpf: 15, rothwellRep: 162, rothwellCon: 34, writeIn: 0, total: 456 },
    { ed: '017', halpinDem: 532, halpinTpf: 24, rothwellRep: 531, rothwellCon: 110, writeIn: 0, total: 1197 },
    { ed: '018', halpinDem: 149, halpinTpf: 6, rothwellRep: 153, rothwellCon: 16, writeIn: 0, total: 324 },
    { ed: '019', halpinDem: 459, halpinTpf: 13, rothwellRep: 399, rothwellCon: 68, writeIn: 0, total: 939 },
    { ed: '020', halpinDem: 446, halpinTpf: 11, rothwellRep: 659, rothwellCon: 116, writeIn: 0, total: 1232 },
    { ed: '021', halpinDem: 244, halpinTpf: 9, rothwellRep: 163, rothwellCon: 23, writeIn: 0, total: 439 },
    { ed: '022', halpinDem: 383, halpinTpf: 8, rothwellRep: 228, rothwellCon: 44, writeIn: 1, total: 664 },
  ] as const,
  source: {
    title: 'Suffolk County Board of Elections: 2026 General Election results',
    url: 'https://app.enhancedvoting.com/results/public/suffolk-county-ny/elections/GE2026_20261028145605',
  },
  secondary: {
    title: 'RiverheadLOCAL: Halpin edges past Rothwell, 52.4% to 47.6%',
    url: 'https://riverheadlocal.com/2026/11/03/halpin-edges-past-rothwell-52-4-to-47-6-in-unofficial-results/',
    note: 'RiverheadLOCAL reported a margin of 626 votes (and, in one place, 6,153 for Rothwell). The County page shows 6,152 and a margin of 627.',
  },
} as const
