// What New York law says about the personnel actions /payroll/ lists, for the
// table's notes. Each quotation is from the statute's text as the New York State
// Senate publishes it; verify-file-numbers.mjs checks the page carries them. This
// is context for residents, not legal advice, and the page says so.

export type Statute = { cite: string; url: string; quote: string; meaning: string }

export const PERSONNEL_LAW: Record<'public' | 'redact' | 'charges' | 'suspension' | 'police' | 'report', Statute> = {
  public: {
    cite: 'Public Officers Law § 87(3)(b)',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/87',
    quote: 'a record setting forth the name, public office address, title and salary of every officer or employee of the agency',
    meaning: 'Every agency must keep this record and make it available, so a Town employee’s name, title and pay are public.',
  },
  redact: {
    cite: 'Public Officers Law § 89(2-b)',
    url: 'https://www.nysenate.gov/legislation/laws/PBO/89',
    quote: 'a law enforcement agency shall redact the following information',
    meaning:
      'Before releasing police disciplinary records, an agency must remove medical history, home addresses, personal phone numbers and e-mail addresses, Social Security numbers, and use of employee assistance or counseling services. The same subdivision says it does not override the other laws that make “title, salary, and dates of employment” public. This table shows none of the redacted kinds of information.',
  },
  charges: {
    cite: 'Civil Service Law § 75(2)',
    url: 'https://www.nysenate.gov/legislation/laws/CVS/75',
    quote: 'The burden of proving incompetency or misconduct shall be upon the person alleging the same.',
    meaning: 'Charges are allegations. They are heard, and whoever brings them must prove them.',
  },
  suspension: {
    cite: 'Civil Service Law § 75(3)',
    url: 'https://www.nysenate.gov/legislation/laws/CVS/75',
    quote: 'may be suspended without pay for a period not exceeding thirty days',
    meaning: 'A suspension pending a hearing is not a penalty or a finding, and an unpaid one is limited to thirty days under this section.',
  },
  police: {
    cite: 'Town Law § 155',
    url: 'https://www.nysenate.gov/legislation/laws/TWN/155',
    quote: 'he shall be entitled to full pay from the date of suspension',
    meaning: 'A town police officer suspended on charges who is not convicted of them is paid in full for the suspension.',
  },
  report: {
    cite: 'Civil Rights Law § 74',
    url: 'https://www.nysenate.gov/legislation/laws/CVR/74',
    quote: 'This section does not apply to a libel contained in any other matter added by any person concerned in the publication',
    meaning:
      'The law protects a fair and true report of an official proceeding, such as the Town’s own resolution, but not material a publisher adds. The name beside a resolution is this site’s addition, which is why each one is reviewed before it is shown.',
  },
}

/** What each kind of action does and does not mean, shown with its row. */
export const KIND_CONTEXT: Record<string, string> = {
  discipline:
    'Charges are allegations until decided. Whoever brings them must prove them at a hearing, and a suspension while they are pending is not a finding. A town police officer who is not convicted is paid in full for the suspension.',
  suspension: 'A suspension pending a hearing is not a finding or a penalty.',
  termination:
    'The resolution gives no reason. A termination can follow a probationary period, an absence, a resignation in lieu of charges or a disciplinary finding, and this record does not say which.',
  separation: 'An agreement about leaving Town service. It states no reason and makes no finding.',
  stipulation: 'A settlement agreement. The resolution does not say what it concerns, and a stipulation is not an admission or a finding.',
  grievance: 'A grievance is a claim under a labor contract, not a finding.',
}

export const CORRECTION_URL =
  'https://github.com/rike4545/Riverhead-NY-Budget-Web-App/issues/new?title=' +
  encodeURIComponent('Personnel actions table: correction or review request') +
  '&body=' +
  encodeURIComponent('Resolution number:\n\nWhat is wrong or should be reviewed:\n\n(Please do not include personal details. This request is public.)')
