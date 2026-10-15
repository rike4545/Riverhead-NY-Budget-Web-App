// Salaries of Elected Officials in Riverhead's 2027 Tentative Budget (PDF
// p. 10, printed p. 5), the rows /brookhaven-2027/ uses, as printed.
// No imports, so scripts/verify-brookhaven.mjs checks them against the page.

export const RIVERHEAD_SALARIES_2027 = {
  title: '2027 Tentative Budget (PDF)',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3973/2027-Tentative-Budget-PDF',
  pdfPage: 10,
  printedPage: 5,
  supervisor: { 2026: 118_919, 2027: 118_919 },
  councilMember: { 2026: 50_558, 2027: 50_558 },
  councilSeats: 4,
  /** Footnote (a), word for word. */
  supervisorNote: 'Supervisor reduced his actual salary to $110,000 in 2026 and also opted not to accept the 2026 Fringe Benefit',
} as const
