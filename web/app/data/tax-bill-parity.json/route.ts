import taxBill from '../../../public/data/tax-bill.json'
import { allOperatingFunds2026 } from '../../../lib/all-funds'
import { stageDoc } from '../../../lib/budget-stages'

// Static-export contract for native clients.
//
// The calculator rates remain owned by public/data/tax-bill.json, while the levy
// breakdown comes from the same allOperatingFunds2026 collection used by the
// /tax-bill/ page. Native clients therefore do not need to duplicate either set
// of fiscal inputs in Swift/Kotlin.
export const dynamic = 'force-static'

export async function GET() {
  const levyFunds = allOperatingFunds2026
    .filter((fund) => fund.taxLevy2026 > 0)
    .sort((a, b) => b.taxLevy2026 - a.taxLevy2026)
    .map((fund) => ({
      code: fund.code,
      name: fund.name,
      description: fund.description,
      taxLevy2026: fund.taxLevy2026,
      source: fund.source,
    }))

  const levyTotal = levyFunds.reduce((sum, fund) => sum + fund.taxLevy2026, 0)

  // The latest 2027 proposal (Preliminary, else Tentative), from the same stage index
  // the /tax-bill/ page reads. Optional for clients: absent until a proposal exists.
  const proposal = stageDoc(2027, 'preliminary') ?? stageDoc(2027, 'tentative')
  const fr = proposal?.townWide?.fundRates
  const rates2027Proposal = proposal?.townWide && fr?.A01 && fr.DA1 && fr.SL1
    ? {
        label: stageDoc(2027, 'preliminary') ? '2027 Preliminary Budget' : '2027 Tentative Budget',
        source: proposal.source.title,
        generalFund: fr.A01.rate,
        highway: fr.DA1.rate,
        streetLighting: fr.SL1.rate,
        totalTownWide: proposal.townWide.rate,
      }
    : null

  return Response.json({
    schemaVersion: 1,
    ...taxBill,
    levyFunds,
    levyTotal,
    rates2027Proposal,
    starAppliesToTownTax: false,
  })
}
