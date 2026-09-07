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
 * CI source checker reports the observed hash when a baseline is not yet set;
 * once reviewed, that value can be promoted to expectedSha256 so later content
 * changes are visible rather than silent.
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
    id: 'budget-process',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/understanding-the-budget-process.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC local-government management guide.',
  },
  {
    id: 'gasb-101',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/gasb101-compensated-absences-accounting-bulletin.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC accounting bulletin implementing GASB 101 guidance.',
  },
  {
    id: 'piggybacking',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/piggybacking-law.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC procurement/legal guidance.',
  },
  {
    id: 'ambulance-billing',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/ambulance-and-ems-billing.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC accounting bulletin for ambulance and EMS billing.',
  },
  {
    id: 'arm',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/arm.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC Accounting and Reporting Manual for local governments.',
  },
  {
    id: 'cannabis-revenue',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/adult-use-cannabis-accounting-bulletin.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC accounting bulletin for adult-use cannabis local-tax revenue.',
  },
  {
    id: 'gasb-87',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/accounting-and-financial-reporting-for-leases-required-by-gasb-87.pdf',
    checkedAt: '2026-09-07',
    mode: 'sha256',
    note: 'OSC accounting bulletin implementing GASB 87 lease guidance.',
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
