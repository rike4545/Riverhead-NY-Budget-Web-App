// Short money and percent formats shared by the budget infographics.
export const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
export const millions = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`
export const signedMoney = (n: number) => `${n < 0 ? '−' : '+'}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`
export const pct1 = (n: number) => `${n.toFixed(1)}%`
export const pct2 = (n: number) => `${n.toFixed(2)}%`
