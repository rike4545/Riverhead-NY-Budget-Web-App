import { dollars } from './financial-data'

export type OperatingFund = {
  code: string
  name: string
  appropriations2026: number
  estimatedRevenues2026: number
  appropriatedFundBalance2026: number
  taxLevy2026: number
  unauditedFundBalance123124?: number
  applicationOfFundBalance2024?: number
  estimatedFundBalance123125?: number
  description: string
  source: string
}

export const allOperatingFunds2026: OperatingFund[] = [
  { code: 'A01', name: 'General Fund', appropriations2026: 69113159, estimatedRevenues2026: 14998550, appropriatedFundBalance2026: 1250000, taxLevy2026: 52864609, unauditedFundBalance123124: 28403924, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 28403924, description: 'Principal operating fund for town operations not required to be reported elsewhere.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'A04', name: 'Police Athletic League', appropriations2026: 81490, estimatedRevenues2026: 81490, appropriatedFundBalance2026: 0, taxLevy2026: 0, description: 'Separates donations supporting the town-wide PAL youth sports program.', source: '2026 Adopted Budget Summary p. 3' },
  { code: 'A06', name: 'Recreation Program Fund', appropriations2026: 504500, estimatedRevenues2026: 504500, appropriatedFundBalance2026: 0, taxLevy2026: 0, description: 'Recreation programs meant to be paid for by program fees rather than property taxes. The audits have found it in deficit at every year-end since 2023.', source: '2026 Adopted Budget Summary p. 3' },
  { code: 'CM1', name: 'Business Improvement District', appropriations2026: 144136, estimatedRevenues2026: 0, appropriatedFundBalance2026: 0, taxLevy2026: 144136, description: 'Downtown business community betterment district.', source: '2026 Adopted Budget Summary p. 3' },
  { code: 'CM2', name: 'East Creek Docking Facility', appropriations2026: 288100, estimatedRevenues2026: 288100, appropriatedFundBalance2026: 0, taxLevy2026: 0, description: 'Maintenance and upkeep of the East Creek docking facility.', source: '2026 Adopted Budget Summary p. 3' },
  { code: 'CM4', name: 'Community Preservation Fund', appropriations2026: 2979300, estimatedRevenues2026: 2979300, appropriatedFundBalance2026: 0, taxLevy2026: 0, unauditedFundBalance123124: 26200442, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 26200442, description: 'Land transfer tax fund for development rights and open space.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'DA1', name: 'Highway Fund', appropriations2026: 7919250, estimatedRevenues2026: 498700, appropriatedFundBalance2026: 0, taxLevy2026: 7420550, unauditedFundBalance123124: 5399935, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 5399935, description: 'Repair and maintenance of Town roads.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'ES1', name: 'Riverhead Sewer District', appropriations2026: 8142722, estimatedRevenues2026: 5426413, appropriatedFundBalance2026: 2150000, taxLevy2026: 566309, unauditedFundBalance123124: 24886851, applicationOfFundBalance2024: 2150000, estimatedFundBalance123125: 22086851, description: 'Public sewers in the Hamlet of Riverhead.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'ES3', name: 'Calverton Sewer District', appropriations2026: 1488357, estimatedRevenues2026: 840157, appropriatedFundBalance2026: 645000, taxLevy2026: 3200, unauditedFundBalance123124: 550000, description: 'Public sewers in a portion of Calverton.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'ES5', name: 'Riverhead Scavenger Waste', appropriations2026: 2231988, estimatedRevenues2026: 2131988, appropriatedFundBalance2026: 100000, taxLevy2026: 0, unauditedFundBalance123124: 100000, description: 'Scavenger waste plant serving property outside the two sewer districts.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'EW1', name: 'Water District', appropriations2026: 11008655, estimatedRevenues2026: 7616177, appropriatedFundBalance2026: 1850000, taxLevy2026: 1542478, unauditedFundBalance123124: 43511652, applicationOfFundBalance2024: 1850000, estimatedFundBalance123125: 41661652, description: 'Potable water operations within the Town.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'MS1', name: 'Workers Compensation Fund', appropriations2026: 1050000, estimatedRevenues2026: 1050000, appropriatedFundBalance2026: 0, taxLevy2026: 0, unauditedFundBalance123124: 350071, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 350071, description: 'Workers compensation self-insurance excess insurance and administration.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'MS2', name: 'Risk Retention Fund', appropriations2026: 450000, estimatedRevenues2026: 450000, appropriatedFundBalance2026: 0, taxLevy2026: 0, description: 'Liability self-insurance excess insurance and administration.', source: '2026 Adopted Budget Summary p. 3' },
  { code: 'SL1', name: 'Street Lighting District', appropriations2026: 926533, estimatedRevenues2026: 33400, appropriatedFundBalance2026: 0, taxLevy2026: 893133, unauditedFundBalance123124: 2431636, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 2431636, description: 'Traffic and street light repair and maintenance.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'SM1', name: 'Ambulance District', appropriations2026: 2388824, estimatedRevenues2026: 684600, appropriatedFundBalance2026: 0, taxLevy2026: 1704224, unauditedFundBalance123124: 874635, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 874635, description: 'Town ambulance service excluding the Wading River Fire District area.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'SR1', name: 'Refuse and Garbage District', appropriations2026: 5254540, estimatedRevenues2026: 5254540, appropriatedFundBalance2026: 0, taxLevy2026: 0, unauditedFundBalance123124: 1814366, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 1814366, description: 'Residential solid waste collection district.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'ST1', name: 'Public Parking District', appropriations2026: 207100, estimatedRevenues2026: 1800, appropriatedFundBalance2026: 0, taxLevy2026: 205300, unauditedFundBalance123124: 479798, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 479798, description: 'Downtown public parking fields.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'V01', name: 'Debt Service Fund', appropriations2026: 6888150, estimatedRevenues2026: 6888150, appropriatedFundBalance2026: 0, taxLevy2026: 0, description: 'Principal and interest payments on general obligation debt.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
  { code: 'Z14', name: 'Calverton Parks Community Development Agency', appropriations2026: 44100, estimatedRevenues2026: 44100, appropriatedFundBalance2026: 0, taxLevy2026: 0, unauditedFundBalance123124: 1050888, applicationOfFundBalance2024: 0, estimatedFundBalance123125: 1050888, description: 'Operations of C.D.A. property at the Calverton Enterprise Park.', source: '2026 Adopted Budget Summary p. 3; Fund Balances p. 4' },
]

export const fundBalanceUseSummary = {
  totalAppropriatedFundBalanceInSummary: allOperatingFunds2026.reduce((sum, fund) => sum + fund.appropriatedFundBalance2026, 0),
  totalApplicationShownOnFundBalanceSchedule: 4650000,
  note: 'The summary page lists appropriated fund balance used to finance the 2026 adopted budget. The fund-balance schedule separately shows application of fund balance and estimated ending balances. These should be treated as reserve-use indicators, not recurring revenue.',
  highestUseFunds: allOperatingFunds2026.filter((fund) => fund.appropriatedFundBalance2026 > 0).sort((a, b) => b.appropriatedFundBalance2026 - a.appropriatedFundBalance2026).map((fund) => `${fund.name}: ${dollars(fund.appropriatedFundBalance2026)}`),
}
