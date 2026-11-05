// Unofficial result of the November 3, 2026 Town Supervisor race, as reported by
// RiverheadLOCAL from the Suffolk County Board of Elections' unofficial returns.
// It is not certified. Replace it with the Board of Elections' certified count
// when that is published, and say so on the page.
//
// The article's text gives Rothwell 6,152 votes and its page summary gives 6,153;
// its stated margin of 626 matches 6,153. Both are shown rather than choosing one.

export const supervisorResult2026 = {
  office: 'Town Supervisor',
  electionDate: 'November 3, 2026',
  status: 'Unofficial',
  districtsReporting: { reported: 22, of: 22 },
  candidates: [
    { name: 'Jerry Halpin', votes: '6,779', percent: '52.4%' },
    { name: 'Ken Rothwell', votes: '6,152 or 6,153', percent: '47.6%' },
  ],
  margin: '626 votes',
  note: 'The article’s text and its page summary differ by one vote for Rothwell; its stated margin of 626 matches 6,153.',
  source: {
    title: 'RiverheadLOCAL: Halpin edges past Rothwell, 52.4% to 47.6%',
    url: 'https://riverheadlocal.com/2026/11/03/halpin-edges-past-rothwell-52-4-to-47-6-in-unofficial-results/',
    byline: 'Denise Civiletti',
    posted: 'November 3, 2026, 11:48 p.m.',
    updated: 'November 4, 2026, 3:02 a.m.',
  },
  countySource: { title: 'Suffolk County Board of Elections results (suffolkvotes.com)', url: 'https://suffolkvotes.com/' },
} as const
