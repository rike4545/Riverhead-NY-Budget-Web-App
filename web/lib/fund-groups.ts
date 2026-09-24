// Groups of the Town's funds that its budget treats together. No imports, so
// the verify scripts can read it directly.

/** The Summary's "Total Town Wide" funds, levied on every parcel in town. */
export const TOWN_WIDE_FUNDS = ['A01', 'DA1', 'SL1'] as const

/**
 * Funds paid for entirely by transfers from the Town's other funds: debt
 * service, workers' compensation and risk retention. Each Tentative's revenue
 * pages list nothing for them but "Interfund Transfers", so a total that adds
 * them to the funds they are paid from counts the same dollars twice, and a
 * fall in debt payments reads as a spending cut. The Supervisor's 2027 letter
 * leaves these three out of its "town operating" total.
 */
export const TRANSFER_FUNDED = ['V01', 'MS1', 'MS2'] as const
