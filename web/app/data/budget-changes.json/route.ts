import { budgetChanges } from '../../../lib/budget-changes'

// The data behind /budget-changes/, emitted at build time as a real JSON file.
// The page re-reads it while open, whenever data/meta.json says the meeting
// data has moved, so a resident who leaves the dashboard open sees the next
// meeting's changes land without reloading.
export const dynamic = 'force-static'

export async function GET() {
  return Response.json(budgetChanges)
}
