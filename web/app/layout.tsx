import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://rike4545.github.io/Riverhead-NY-Budget-Web-App'),
  title: {
    default: 'Riverhead Budget Live — Town of Riverhead budget, payroll & votes explained',
    template: '%s — Riverhead Budget Live',
  },
  description:
    'An independent, plain-English explorer of Town of Riverhead (NY) finances: budgets down to every line item, employee payroll and overtime, Board-authorized salaries and raises, Town Board votes, and 20 years of fiscal history — all sourced from official documents.',
  openGraph: {
    title: 'Riverhead Budget Live',
    description:
      'Where Riverhead’s money comes from and where it goes — budgets, payroll, salaries, and Town Board votes in plain English.',
    type: 'website',
  },
}

// Semantic up/down colors as CSS variables so a reader can flip the convention.
// Default (accountant view): an increase is red, a decrease is green.
// "green-up" (plain view): an increase is green, a decrease is red.
const TREND_CSS = `:root{--inc:#b91c1c;--dec:#15803d}:root[data-tc="green-up"]{--inc:#15803d;--dec:#b91c1c}`
// Apply the saved choice before first paint so colors don't flash.
const TREND_INIT = `try{var t=localStorage.getItem('tc');if(t)document.documentElement.setAttribute('data-tc',t)}catch(e){}`

// Structural color tokens consumed by PageShell, DisclaimerBanner, and all page components.
const THEME_CSS = `
:root{
  --rbl-bg:linear-gradient(180deg,#eef3f8 0,#f7f8f5 42%,#ffffff 100%);
  --rbl-surface:#ffffff;
  --rbl-border:#d8e0e7;
  --rbl-border-subtle:#e2e8f0;
  --rbl-text:#1f2933;
  --rbl-text-muted:#64748b;
  --rbl-text-sub:#44576a;
  --rbl-title:#284a69;
  --rbl-badge:#9b6b12;
  --rbl-header-a:#284a69;
  --rbl-header-b:#4a7297;
  --rbl-page-accent:#4a7297;
  --rbl-gold:#c99a2e;
  --rbl-note-bg:#fff8e6;
  --rbl-note-border:#d8b45a;
  --rbl-note-text:#5f430d;
  --rbl-note-sub:#8a6a1f;
  --rbl-shadow:rgba(31,95,143,.10);
}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: TREND_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: TREND_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
