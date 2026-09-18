export type AuthorityAuditMode = 'status' | 'sha256'

export type AuthorityAuditRecord = {
  id: string
  url: string
  checkedAt: string
  mode: AuthorityAuditMode
  expectedSha256?: string
  note: string
}

/**
 * External authority audit registry.
 *
 * `status` is used for dynamic portals whose HTML changes for reasons unrelated
 * to substantive guidance. `sha256` is used for stable publication files. The
 * SHA-256 values below were observed by the Quality Gate on September 7, 2026
 * and reviewed as the initial baselines for future change detection.
 *
 * A fingerprint is only moved after someone reads the new document and confirms
 * it still supports what the site says about it; `checkedAt` is that reading,
 * not the last time bytes were compared, and residents see it on the page. A
 * publisher re-saving a file changes the fingerprint without changing the
 * guidance, so the note records which of the two happened.
 */
export const authorityAudit: AuthorityAuditRecord[] = [
  {
    id: 'property-tax-cap',
    url: 'https://www.osc.ny.gov/local-government/property-tax-cap',
    checkedAt: '2026-09-07',
    mode: 'status',
    note: 'Dynamic OSC portal; availability is checked, while individual publications below use content fingerprints.',
  },
  {
    id: 'tax-cap-formula',
    url: 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/formula.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '7751fe2c8eddb8af2f96945e6615fe473c67ec81cdcc391da6d89f47df6f3081',
    note: 'OSC tax-cap formula publication cited directly by claim-level provenance on the tax-cap page.',
  },
  {
    id: 'osc-2027-growth-factor',
    url: 'https://www.osc.ny.gov/press/releases/2026/07/dinapoli-tax-cap-remains-2-percent-2027',
    checkedAt: '2026-09-07',
    mode: 'status',
    note: 'OSC 2027 allowable levy growth factor release cited by tax-cap and 2027 projection claims.',
  },
  {
    id: 'osc-override-trend',
    url: 'https://www.osc.ny.gov/press/releases/2026/08/dinapoli-growing-number-local-governments-reporting-plans-override-property-tax-cap',
    checkedAt: '2026-09-07',
    mode: 'status',
    note: 'OSC planned-override trend release cited by the 2027 projection page.',
  },
  {
    id: 'budget-process',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/understanding-the-budget-process.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '7baeb61ead7b8d5cc1e27e6d1d96925cb6a893afb46362225e1866341dd03198',
    note: 'OSC local-government management guide.',
  },
  {
    id: 'gasb-101',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/gasb101-compensated-absences-accounting-bulletin.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '4156aca75bc92c49e4de8a870be5bebff0d9b4698d3c0aaca7e0f490c2476f45',
    note: 'OSC accounting bulletin implementing GASB 101 guidance.',
  },
  {
    id: 'piggybacking',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/piggybacking-law.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '35330a2725f5206cefd78a89e2bbde76cc8e5cb440e7c989f57939fefaac3395',
    note: 'OSC procurement/legal guidance.',
  },
  {
    id: 'ambulance-billing',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/ambulance-and-ems-billing.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: 'f384ea36540f4e55eb6cb1d484719aefd41b05e9235b92db51cf80e3eea25a4f',
    note: 'OSC accounting bulletin for ambulance and EMS billing.',
  },
  {
    id: 'arm',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/arm.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '8d863fa7c7eecb07483c2b1b63e622ab1b63a36fee3b4797ed91e7155f995882',
    note: 'OSC Accounting and Reporting Manual for local governments.',
  },
  {
    id: 'cannabis-revenue',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/adult-use-cannabis-accounting-bulletin.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    expectedSha256: '8f527e16fbbebd904b6f9c881a11a6d41b96c6856b95af9c1ad48de484baf21a',
    note: 'OSC accounting bulletin for adult-use cannabis local-tax revenue.',
  },
  {
    id: 'gasb-87',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/accounting-and-financial-reporting-for-leases-required-by-gasb-87.pdf',
    checkedAt: '2026-09-18',
    mode: 'sha256',
    expectedSha256: 'be14fbe0ea96e862d067cc4b0719b721d966cb84e36d2c5acd2128001344e4d1',
    note: 'OSC accounting bulletin implementing GASB 87 lease guidance. Rebaselined 2026-09-18 after OSC re-saved the file on September 17, 2026: the bulletin is still the December 2022 update, and the lease-liability, present-value and remeasurement guidance the summary describes was re-read and is unchanged.',
  },
  {
    id: 'fasb-asc',
    url: 'https://asc.fasb.org/Home',
    checkedAt: '2026-09-07',
    mode: 'status',
    note: 'Dynamic nongovernmental GAAP reference; availability only. GASB/OSC remain the governmental authority tier for Riverhead.',
  },
]

export const authorityAuditById = Object.fromEntries(authorityAudit.map((item) => [item.id, item])) as Record<string, AuthorityAuditRecord>
