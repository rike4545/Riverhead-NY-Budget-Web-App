# Tax-bill native parity contract

`/data/tax-bill-parity.json` is a static-export contract for native clients.

It deliberately combines:

- the existing `public/data/tax-bill.json` rate/equalization source used by `/tax-bill/`; and
- the positive-tax-levy subset of `allOperatingFunds2026` used by the page's levy-allocation section.

The route contains no independent fiscal constants or tax calculations. Native clients should calculate the parcel estimate from the returned rates using the same formula as `lib/tax-bill.ts`.
