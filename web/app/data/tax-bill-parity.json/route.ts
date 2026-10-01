import taxBill from '../../../public/data/tax-bill.json'
import { allOperatingFunds2026 } from '../../../lib/all-funds'

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

  return Response.json({
    schemaVersion: 1,
    ...taxBill,
    levyFunds,
    levyTotal,
  })
}
