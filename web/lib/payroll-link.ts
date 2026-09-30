// A link into the Payroll page that opens one view of it: which tab, what to
// search for, which year and department, how to sort, and which row to open.
// Search results use these so a click lands on the person or department the
// result is about, not the top of the page with an empty search box.
//
// etl/build_search_index.py writes these query strings, and
// scripts/verify-search.mjs checks that each one opens rows. No imports, so the
// check can run this file directly.

export const PAYROLL_TABS = ['actual', 'authorized', 'raises', 'overtime', 'separation', 'steps'] as const
export type PayrollTab = (typeof PAYROLL_TABS)[number]
const SORTS = ['year', 'gross', 'overtime', 'regular', 'name'] as const
const ONLY = ['all', 'raised', 'promotions'] as const

export type PayrollLink = {
  tab: PayrollTab
  /** What goes in the tab's search box. */
  q?: string
  year?: number | 'all'
  /** Employees & Pay: one department, exactly as the payroll names it. */
  dept?: string
  /** Employees & Pay: sort by this column, largest or newest first (names A–Z). */
  sort?: (typeof SORTS)[number]
  /** Employees & Pay: open the pay breakdown of the first row paid in this year. */
  open?: number
  /** Raises: which people to list. */
  only?: (typeof ONLY)[number]
}

const oneOf = <T extends string>(list: readonly T[], value: string | null): T | undefined =>
  value != null && (list as readonly string[]).includes(value) ? (value as T) : undefined
const yearOf = (value: string | null) => (value && /^\d{4}$/.test(value) ? Number(value) : undefined)

/** The view a Payroll page query string names, or null when it names none. */
export function readPayrollLink(search: string): PayrollLink | null {
  const p = new URLSearchParams(search)
  const tab = oneOf(PAYROLL_TABS, p.get('tab'))
  const link: PayrollLink = {
    tab: tab ?? 'actual',
    q: p.get('q')?.trim() || undefined,
    year: p.get('year') === 'all' ? 'all' : yearOf(p.get('year')),
    dept: p.get('dept')?.trim() || undefined,
    sort: oneOf(SORTS, p.get('sort')),
    open: yearOf(p.get('open')),
    only: oneOf(ONLY, p.get('only')),
  }
  const namesAView = tab !== undefined || Object.entries(link).some(([key, value]) => key !== 'tab' && value !== undefined)
  return namesAView ? link : null
}
