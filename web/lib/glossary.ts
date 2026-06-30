// Plain-English definitions of budget and payroll terms, written for someone
// who has never read a municipal budget. Keep these short and jargon-free.

export type GlossaryEntry = { term: string; plain: string }

export const glossary: Record<string, GlossaryEntry> = {
  appropriations: {
    term: 'Appropriations',
    plain: "The money the Town plans to spend. This is the spending side of the budget.",
  },
  'estimated-revenues': {
    term: 'Estimated Revenues',
    plain: 'Money the Town expects to take in from things other than property taxes — fees, permits, state aid, interest, and so on.',
  },
  'tax-levy': {
    term: 'Tax Levy',
    plain: 'The total amount the Town collects from property taxes to cover whatever the other revenues do not pay for.',
  },
  'fund-balance': {
    term: 'Fund Balance',
    plain: "The Town's savings — money left over from prior years that has not been spent.",
  },
  'appropriated-fund-balance': {
    term: 'Fund Balance Used',
    plain: 'Savings from past years that the Town is dipping into to help pay for this year. Using it once is fine; relying on it every year is a warning sign.',
  },
  fund: {
    term: 'Fund',
    plain: 'A separate pot of money set aside for a specific purpose — like Highway, Water, or Sewer. Each fund has its own budget.',
  },
  'general-fund': {
    term: 'General Fund',
    plain: 'The main pot of money that pays for most town-wide services, like police, the town clerk, and general administration.',
  },
  department: {
    term: 'Department',
    plain: 'A unit of town government within a fund — for example Police or Town Clerk inside the General Fund.',
  },
  'line-item': {
    term: 'Account / Line item',
    plain: 'The smallest level of budget detail — a single spending line, such as "Police – Overtime."',
  },
  'personal-services': {
    term: 'Personal Services',
    plain: 'Salaries and wages paid to Town employees.',
  },
  'employee-benefits': {
    term: 'Employee Benefits',
    plain: "Health insurance, retirement, and other non-salary costs of employing people.",
  },
  contractual: {
    term: 'Contractual',
    plain: 'Day-to-day operating costs paid to outside vendors — supplies, utilities, repairs, and professional services.',
  },
  'equipment-capital': {
    term: 'Equipment & Capital Outlay',
    plain: 'Bigger one-time purchases such as vehicles, machinery, and equipment.',
  },
  transfers: {
    term: 'Interfund / Transfers',
    plain: "Money moved from one of the Town's funds to another.",
  },
  'adopted-budget': {
    term: 'Adopted Budget',
    plain: 'The final budget approved by the Town Board. This is the official plan for the year.',
  },
  'tentative-budget': {
    term: 'Tentative / Preliminary Budget',
    plain: 'Earlier draft versions of the budget, before the Town Board approves the final (adopted) one.',
  },
  'debt-service': {
    term: 'Debt Service',
    plain: 'Payments on money the Town has borrowed — similar to making mortgage payments.',
  },
  ban: {
    term: 'BAN (Bond Anticipation Note)',
    plain: 'Short-term borrowing the Town later pays back or replaces with a long-term bond.',
  },
  overtime: {
    term: 'Overtime',
    plain: 'Extra pay for hours an employee works beyond their normal schedule.',
  },
  'gross-pay': {
    term: 'Gross Pay',
    plain: 'The total an employee was paid in a year before deductions — including base pay, overtime, and extras.',
  },
  'base-pay': {
    term: 'Regular / Base Pay',
    plain: "An employee's normal salary or wages, not counting overtime or extras.",
  },
  union: {
    term: 'Union / Bargaining Group',
    plain: 'The labor group an employee belongs to — for example PBA for police officers or CSEA for many town workers.',
  },
  reconciled: {
    term: 'Reconciled',
    plain: "Our totals add up exactly to the Town's official published numbers, so you can trust the detail behind them.",
  },
  'reserve-use': {
    term: 'Reserve Use',
    plain: 'Spending savings instead of recurring income. It can balance a single budget but is risky if repeated year after year.',
  },
}

export function lookup(key: string): GlossaryEntry | undefined {
  return glossary[key]
}

export const glossaryList: GlossaryEntry[] = Object.values(glossary).sort((a, b) => a.term.localeCompare(b.term))
