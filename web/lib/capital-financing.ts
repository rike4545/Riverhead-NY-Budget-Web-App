// BAN-then-bond vs. bond-now: the two ways a town typically finances a capital
// project. Rate inputs here are illustrative, user-adjustable assumptions —
// not a quoted Town borrowing rate. We don't have forward-looking market rate
// data for a hypothetical future issuance; only the effective rate baked into
// debt already on the books ([[debt-profile]]), which reflects when that debt
// happened to be sold, not what a new issue would cost today.
export type FinancingInputs = {
  projectCost: number
  banYears: number
  banRatePct: number
  bondYears: number
  bondRatePct: number
}

// Level-principal serial bond: equal principal payments each year, interest
// on the declining balance. Total interest reduces to rate × principal ×
// (years+1)/2 — the standard closed-form result municipalities use to
// estimate serial-bond interest cost.
export function serialBondTotalInterest(principal: number, ratePct: number, years: number): number {
  if (years <= 0) return 0
  return (ratePct / 100) * principal * ((years + 1) / 2)
}

export function serialBondSchedule(principal: number, ratePct: number, years: number): { year: number; principal: number; interest: number }[] {
  if (years <= 0) return []
  const annualPrincipal = principal / years
  return Array.from({ length: years }, (_, i) => {
    const outstandingBefore = principal - annualPrincipal * i
    return { year: i + 1, principal: annualPrincipal, interest: (ratePct / 100) * outstandingBefore }
  })
}

export type FinancingComparison = {
  bondNow: { totalInterest: number; totalCost: number; yearsToRetire: number }
  banThenBond: { banCarryingCost: number; bondInterest: number; totalInterest: number; totalCost: number; yearsToRetire: number }
  banPremium: number
}

export function compareFinancing(inputs: FinancingInputs): FinancingComparison {
  const { projectCost, banYears, banRatePct, bondYears, bondRatePct } = inputs

  const bondNowInterest = serialBondTotalInterest(projectCost, bondRatePct, bondYears)
  // A BAN is typically interest-only, renewed annually, on the full principal until converted.
  const banCarryingCost = banYears * (banRatePct / 100) * projectCost
  const bondAfterBanInterest = serialBondTotalInterest(projectCost, bondRatePct, bondYears)
  const banThenBondInterest = banCarryingCost + bondAfterBanInterest

  return {
    bondNow: {
      totalInterest: bondNowInterest,
      totalCost: projectCost + bondNowInterest,
      yearsToRetire: bondYears,
    },
    banThenBond: {
      banCarryingCost,
      bondInterest: bondAfterBanInterest,
      totalInterest: banThenBondInterest,
      totalCost: projectCost + banThenBondInterest,
      yearsToRetire: banYears + bondYears,
    },
    banPremium: banThenBondInterest - bondNowInterest,
  }
}
