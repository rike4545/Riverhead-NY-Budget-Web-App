// The meetings' fiscal companions, read at build time for lib/account-changes.ts.
// Done with require so the set grows with new meetings without editing this
// file, as lib/fund-balance-draws.ts does.
import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { accountChanges, type FiscalMeeting } from './account-changes'

export const CHANGES_YEAR = 2026

export const meetings: FiscalMeeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as FiscalMeeting,
)

export const changesByAccount = accountChanges(meetings, CHANGES_YEAR)

/** The last meeting the records cover, "2026-11-05". */
export const CHANGES_THROUGH = [...(fiscalIndex.meetings as string[])].sort().slice(-1)[0]
