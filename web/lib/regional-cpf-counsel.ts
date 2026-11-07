// The regional Community Preservation Fund counsel, for /regional-cpf-counsel/.
// Quoted from the Town's own agenda packets (resolutions 2025-964 and
// 2026-980), the statute as published by the New York State Senate, and the
// bill's record there. What was said at the November 5, 2026 meeting is from
// RiverheadLOCAL's report and is attributed to it. scripts/verify-legal-costs.mjs
// checks the page against these words.

import cpfHistoryJson from '../public/data/cpf/history.json'

const AGENDAS = 'https://www.townofriverheadny.gov/129/Agendas-Minutes'

export const sources = {
  packet2026: { label: 'Town Board agenda packet, November 5, 2026 (resolution 2026-980, packet pages 39 to 43)', url: AGENDAS },
  packet2025: { label: 'Town Board agenda packet, December 2, 2025 (resolution 2025-964, packet pages 74 to 76)', url: AGENDAS },
  statute: { label: 'Town Law § 64-e, New York State Senate', url: 'https://www.nysenate.gov/legislation/laws/TWN/64-E' },
  bill: { label: 'Senate bill S9065-A of 2024 (same as Assembly A9943-A), New York State Senate', url: 'https://www.nysenate.gov/legislation/bills/2023/S9065/amendment/A' },
  homeRuleLaw: { label: 'Municipal Home Rule Law § 40, New York State Senate', url: 'https://www.nysenate.gov/legislation/laws/MHR/40' },
  news: { label: 'RiverheadLOCAL, “Post-election, Riverhead Town Board unanimously acts on all resolutions,” November 6, 2026', url: 'https://riverheadlocal.com/2026/11/06/post-election-riverhead-town-board-unanimously-acts-on-all-resolutions/' },
} as const

/** Town Law § 64-e(14), as the Senate publishes it. */
export const statute = {
  counsel:
    'The towns in the Peconic Bay region shall jointly establish, by intermunicipal agreement, the office of regional community preservation fund counsel to render legal opinions and interpretations to facilitate the efficient and consistent administration of the funds created pursuant to this section. All such opinions and interpretations rendered shall be published on each town’s official website and shall be available to the public as a public record under article six of the public officers law.',
  committee:
    'The committee shall consist of eleven (11) members. The members shall include each Town Supervisor or designee, a representative of village government to be jointly selected by the villages in the Peconic Bay region and five (5) members to be selected by the state legislative representatives representing the Peconic Bay region',
  deadline: 'The office and committee required to be established pursuant to this subdivision shall be implemented no later than ninety days after the effective date of this subdivision.',
}

export const bill = {
  number: 'S9065-A / A9943-A',
  senateSponsor: 'Senator Anthony H. Palumbo',
  assemblySponsor: 'Assemblyman Fred W. Thiele, Jr.',
  senateVote: { date: '2024-06-06', ayes: 60, nays: 1 },
  assemblyPassed: '2024-06-07',
  signed: '2024-12-21',
  chapter: 'Chapter 666 of the Laws of 2024',
  effective: 'immediately',
  memoFiscal: 'None',
}

/** Ninety days after the law took effect on signing. */
export const deadline = (() => {
  const d = new Date(`${bill.signed}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 90)
  return d.toISOString().slice(0, 10)
})()

/** Resolution 2025-964, adopted December 2, 2025, in its own words. */
export const ima = {
  number: '2025-964',
  date: '2025-12-02',
  result: 'Adopted, 5–0',
  ayes: ['Tim Hubbard', 'Kenneth Rothwell', 'Robert Kern', 'Denise Merrifield', 'Joann Waski'],
  quotes: {
    noHomeRule: 'sometime in 2024 and without requirement for Home Rule Message, Assemblyman Thiele proposed yet another amendment to Town Law-64e',
    noConsultation: 'his proposed amendments were signed into law again without consultation with or recommendation of the Town of Riverhead',
    compelled: 'notwithstanding stated objection to Town Law §64(e)14(a) and (b), the Town Board for the Town of Riverhead is compelled to approve an Intermunicipal Agreement',
    fair: 'notwithstanding the Town’s objection, the terms thereof are fair and reasonable under the circumstances articulated herein',
  },
  fiscalImpact: 'No',
}

/** Resolution 2026-980 and the retainer agreement attached to it. */
export const retainer = {
  number: '2026-980',
  date: '2026-11-05',
  result: 'Tabled, 5–0',
  counsel: 'Mary C. Wilson, Esq.',
  counselBase: 'Palm Beach Gardens, Florida',
  rate: 400,
  proposalDate: '2025-01-10',
  term: 'this Contract shall be effective for the 2026 calendar year',
  expenses: 'reimbursement for additional expenses for travel time, telecopies, photocopying and printing fees, as the same may be incurred from time to time',
  invoices: 'periodic invoices, quarterly, bi-annually or annually at the discretion of regional counsel',
  share: 'in proportion to each Member Town’s percentage allotment of total annual CPF revenues (last full year of realized revenue)',
  cap: 'No Member Town shall be responsible for payment of legal costs above their respective share as provided in the IMA.',
  paidFrom: 'Payments shall be paid from the appropriate capital budget account.',
  fiscalImpact: 'Yes, absorbed by existing resources; no account named',
  fisDate: '2026-10-23',
}

/** What was said on November 5, as RiverheadLOCAL reported it. */
export const meeting = {
  shares: { riverhead: 0.053, southampton: 0.51, eastHampton: 0.33, year: 2023, who: 'Town Attorney Erik Howard' },
  noInvoices: 'Howard said he had not received any invoices from Wilson. He also said the other towns had signed agreements retaining her.',
  merrifield: '“I was really offended that the state is requiring this of us,” Merrifield said. “We had no choice; we had to enter into this.”',
  rothwell: 'Rothwell also supported postponing action, citing questions about the regional committee’s authority and its potential involvement in future changes to Riverhead’s CPF program.',
  publicComment: [
    'why Riverhead should be required to contribute toward legal services concerning CPF matters in other towns, when Riverhead has used its comparatively limited CPF revenue mainly for farmland and open space',
    'why an attorney based in Florida was chosen, and whether travel between Florida and Long Island would be reimbursed',
  ],
}

type CpfYear = { year: number; transferTaxRevenue: number | null; sourceUrl?: string }
const cpfYears = (cpfHistoryJson as unknown as { years: CpfYear[] }).years
/** Riverhead's own CPF transfer-tax revenue in the year the Town Attorney cited, from its audited statement. */
export const riverheadCpf2023 = cpfYears.find((y) => y.year === 2023) ?? null
export const riverheadCpfLatest = cpfYears[cpfYears.length - 1]

/** Riverhead's share of a regional bill: illustrative, at the share the Town Attorney cited. No estimate of hours exists. */
export const illustrativeHours = [25, 100, 250]
export const shareOfBill = (hours: number) => ({ hours, region: hours * retainer.rate, riverhead: hours * retainer.rate * meeting.shares.riverhead })
