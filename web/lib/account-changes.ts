// The Board's budget changes that name an account, for the overtime table and
// the cost categories.
//
// The Budget Supplements print each year's ORIGINAL adopted budget. During the
// year the Board amends it by resolution: budget adjustments that add money
// (from a grant, a donation, savings) and transfers that move it between
// lines. In governmental accounting a budget-to-actual comparison is read
// against both the original and the final amended budget, so a line that
// looks over its original budget may have been covered by a vote, and one
// that looks under it may have given money away.
//
// This lists every adopted resolution whose fiscal impact statement names the
// account with an amount. It does not say which way the money moved: the
// parsed tables keep each account's amount but, for transfers, not whether it
// sat on the FROM or the TO side, so the page names the vote and leaves the
// direction to the resolution itself.
//
// No imports: lib/account-changes-data.ts feeds it the meetings, and
// scripts/verify-account-changes.mjs runs the same function.

export type FiscalAccount = { code: string; role: string; amount: number | null }
export type FiscalResolution = { number: string | null; title: string; vote?: { adopted: boolean | null } | null; funding?: { accounts?: FiscalAccount[] | null } | null }
export type FiscalMeeting = { meetingDate: string; slug?: string; resolutions: FiscalResolution[] }

export type AccountChange = { number: string; date: string; title: string; amount: number }

export function accountChanges(meetings: FiscalMeeting[], year: number): Record<string, AccountChange[]> {
  const out: Record<string, AccountChange[]> = {}
  for (const m of meetings) {
    if (!m.meetingDate.startsWith(`${year}-`)) continue
    for (const r of m.resolutions) {
      if (r.vote?.adopted !== true || !r.number) continue
      const seen = new Set<string>()
      for (const a of r.funding?.accounts ?? []) {
        if (a.amount === null || a.amount === undefined || seen.has(a.code)) continue
        seen.add(a.code)
        // One entry per resolution per account; a table that names the account twice is added up.
        const amount = (r.funding?.accounts ?? []).filter((x) => x.code === a.code && x.amount !== null).reduce((s, x) => s + (x.amount as number), 0)
        ;(out[a.code] ??= []).push({ number: r.number, date: m.meetingDate, title: r.title, amount })
      }
    }
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.date.localeCompare(b.date))
  return out
}

/**
 * What the records say about the one-off entries the cost categories set
 * aside, quoted from the resolution that explains each. Checked against the
 * fiscal impact statement by scripts/verify-account-changes.mjs.
 */
export const ONE_OFF_EXPLAINED: Record<string, { year: number; number: string; date: string; title: string; amount: number; quotes: string[]; note: string }> = {
  'EW1-8-8320-490-000-00000': {
    year: 2025,
    number: '2026-640',
    date: 'July 7, 2026',
    title: 'Suffolk County Water Authority Federal Pass-Through Grant 2025 Budget Adjustment',
    amount: 3_575_000,
    quotes: [
      'the Town was notified that it would receive approximately $3.5 Million dollars of pass-through grant',
      'congressionally mandated project, known as Extension 94, with final awards of $2,275,000 for 2022 and $1,300,000 for 2023',
    ],
    note: 'A federal grant for a water-main extension that passes through the Water District’s books. The Board amended the 2025 budget in July 2026, after the year had ended, moving $3,575,000 from Federal Aid to this line. The line’s 2025 spending, $3,580,426, is that amount plus about $5,400, close to its usual few thousand dollars a year.',
  },
}
