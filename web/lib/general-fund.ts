// Long-run General Fund history (adopted figures), 2005-2025.
// Built by etl/parse_general_fund.py.

import gfJson from '../public/data/history/general-fund.json'

export type GeneralFundRow = {
  year: number
  appropriations: number | null
  estimatedRevenues: number | null
  appropriatedFundBalance: number | null
  taxLevy: number | null
  source: string
  status: string
}

export type GeneralFundHistory = {
  source: { title: string; url: string }
  note: string
  growth: {
    firstYear: number
    lastYear: number
    appropriationsChangePct: number | null
    taxLevyChangePct: number | null
  }
  rows: GeneralFundRow[]
}

export const generalFund = gfJson as GeneralFundHistory
