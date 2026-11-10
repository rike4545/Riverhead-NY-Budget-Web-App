// Fiscal impact statements that contradict themselves, for /fiscal-impact/.
//
// The site's other reads of the statements are judgements (a hire marked
// "no fiscal impact" probably costs money). These are not: each is a
// statement whose own answers disagree with its own section G, or whose
// section G disagrees with the budget table the Board adopted. Only adopted
// resolutions count.
//
// - table-mismatch: section G names a smaller amount than the adopted budget
//   table moves (parse_fiscal_impact.py's statementBelowTable).
// - absorbed-fund-balance: E(a) is initialed, "the fiscal impact can be
//   absorbed by Town/Department existing resources set forth in approved Town
//   Annual Budget", yet section G appropriates fund balance, money that is not
//   in the approved budget.
// - no-impact-funded: D answers "No" fiscal impact, yet section G names an
//   account to charge, a revenue account, or fund balance.
//
// A statement can fall in more than one kind; the total counts it once.
// No imports, so scripts/verify-statement-contradictions.mjs runs the same
// function.

export type StatementRecord = {
  number: string | null
  title: string
  townFiscalImpact: string
  townTreatment: string
  statementBelowTable?: { statement: number; table: number } | null
  vote?: { adopted: boolean | null } | null
  funding?: { accounts?: { code: string }[] | null; drawsFundBalance?: boolean | null; amount?: number | null; sourceText?: string | null } | null
}
export type StatementMeeting = { meetingDate: string; resolutions: StatementRecord[] }

export type Kind = 'table-mismatch' | 'absorbed-fund-balance' | 'no-impact-funded'
export type Contradiction = { number: string; date: string; title: string; kinds: Kind[]; detail: string; noImpactKind?: 'charge' | 'revenue' | 'fund-balance' }

const isRevenueCode = (code: string) => !/^[A-Z]{1,3}\d{1,2}-\d-\d{4}-/.test(code)
const isFundBalance = (code: string) => /-9999-/.test(code)

export function statementContradictions(meetings: StatementMeeting[], year: number) {
  const inYear = meetings.filter((m) => m.meetingDate.startsWith(`${year}-`))
  const adopted = inYear.flatMap((m) => m.resolutions.filter((r) => r.vote?.adopted === true && r.number).map((r) => ({ r, date: m.meetingDate })))
  const out: Contradiction[] = []
  for (const { r, date } of adopted) {
    const f = r.funding ?? {}
    const accounts = (f.accounts ?? []).map((a) => a.code)
    const kinds: Kind[] = []
    const details: string[] = []
    let noImpactKind: Contradiction['noImpactKind']
    if (r.statementBelowTable) {
      kinds.push('table-mismatch')
      details.push(`Section G names $${r.statementBelowTable.statement.toLocaleString('en-US')}; the adopted budget table moves $${r.statementBelowTable.table.toLocaleString('en-US')}.`)
    }
    if (r.townTreatment === 'absorbed' && f.drawsFundBalance) {
      kinds.push('absorbed-fund-balance')
      details.push('E(a) is initialed as absorbed by the approved budget, yet section G draws on fund balance.')
    }
    const funded = accounts.length > 0 || f.drawsFundBalance || (f.amount ?? 0) > 0
    if (r.townFiscalImpact === 'No' && funded) {
      kinds.push('no-impact-funded')
      noImpactKind = f.drawsFundBalance || accounts.some(isFundBalance) ? 'fund-balance' : accounts.length > 0 && accounts.every(isRevenueCode) ? 'revenue' : 'charge'
      details.push(noImpactKind === 'fund-balance' ? 'D answers no fiscal impact, yet section G draws on fund balance.'
        : noImpactKind === 'revenue' ? 'D answers no fiscal impact, yet section G names a revenue account the money will come into.'
        : 'D answers no fiscal impact, yet section G names an account to be charged.')
    }
    if (kinds.length) out.push({ number: r.number as string, date, title: r.title, kinds, detail: details.join(' '), noImpactKind })
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number, 'en', { numeric: true }))
  const byKind = (k: Kind) => out.filter((c) => c.kinds.includes(k))
  return {
    adopted: adopted.length,
    meetings: new Set(adopted.map((a) => a.date)).size,
    first: adopted.map((a) => a.date).sort()[0] ?? null,
    last: adopted.map((a) => a.date).sort().slice(-1)[0] ?? null,
    all: out,
    tableMismatch: byKind('table-mismatch'),
    absorbedFundBalance: byKind('absorbed-fund-balance'),
    noImpactFunded: byKind('no-impact-funded'),
  }
}
