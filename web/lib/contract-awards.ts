// Types and wording for /contracts/, which lists the bid awards, purchases,
// change orders and service agreements the Town Board voted on in 2026
// (etl/build_contract_awards.py). No JSON import here, so the verify script can
// load it under Node's type stripping.

export type Vendor = { name: string; role: string | null }

export type ContractAward = {
  date: string
  resolution: string
  title: string
  kind: 'bid-award' | 'bid-extension' | 'change-order' | 'purchase' | 'services' | 'agreement'
  vendors: Vendor[]
  amount: number | null
  basis: 'stated' | 'cap' | 'change' | 'no-cost' | 'attached' | 'none'
  quote: string | null
  clause: string | null
  funds: string[]
  townFiscalImpact: string | null
  result: string | null
  adopted: boolean | null
  votes: Record<string, string>
  sourceUrl: string | null
}

export type ContractAwards = {
  about: string
  since: string
  kinds: Record<string, string>
  counts: { resolutions: number; withVendor: number; withAmount: number; meetings: number }
  awards: ContractAward[]
}

/** Why an amount is shown, or why it is blank. */
export const BASIS_TEXT: Record<ContractAward['basis'], string> = {
  stated: 'stated in the resolution',
  cap: 'a cap the resolution sets: “not to exceed”',
  change: 'the change the resolution states',
  'no-cost': 'the resolution says it is at no cost to the Town',
  attached: 'blank: the resolution points to prices on attached pages',
  none: 'blank: the resolution states no amount',
}

/** Vendors by how many resolutions name them, most first. */
export function vendorCounts(awards: ContractAward[]): { name: string; count: number; resolutions: string[] }[] {
  const by = new Map<string, { name: string; count: number; resolutions: string[] }>()
  for (const a of awards) {
    for (const v of a.vendors) {
      const key = v.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(inc|llc|pllc|llp|lp|ltd|corp|co|dpc|pc|the)\b/g, '').replace(/\s+/g, ' ').trim()
      const row = by.get(key) ?? { name: v.name, count: 0, resolutions: [] }
      if (!row.resolutions.includes(a.resolution)) {
        row.count += 1
        row.resolutions.push(a.resolution)
      }
      by.set(key, row)
    }
  }
  return Array.from(by.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
