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

// Structural color tokens consumed by PageShell, DisclaimerBanner, and every
// page component. Components reference these names rather than hex literals,
// so a colour is changed in one place instead of across seventy files.
const LIGHT_TOKENS = `
  --rbl-bg:linear-gradient(180deg,#eef3f8 0,#f7f8f5 42%,#ffffff 100%);
  --rbl-page:#eef3f8;
  --rbl-surface:#ffffff;
  --rbl-surface-2:#f8fafc;
  --rbl-surface-3:#f1f5f9;
  --rbl-border:#d8e0e7;
  --rbl-border-subtle:#e2e8f0;
  --rbl-border-strong:#cbd5e1;
  --rbl-track:#e2e8f0;
  --rbl-track-strong:#cbd5e1;
  --rbl-text:#1f2933;
  --rbl-text-strong:#334155;
  --rbl-text-body:#475569;
  --rbl-text-sub:#44576a;
  --rbl-text-muted:#5f6e83;
  --rbl-text-faint:#687787;
  --rbl-title:#284a69;
  --rbl-accent:#4a7297;
  --rbl-accent-border:#4a7297;
  --rbl-link:#2563eb;
  --rbl-badge:#9b6b12;
  --rbl-gold:#c99a2e;
  --rbl-gold-border:#c99a2e;
  --rbl-header-a:#284a69;
  --rbl-header-b:#4a7297;
  --rbl-page-accent:#4a7297;
  --rbl-shadow:rgba(31,95,143,.10);
  --rbl-fill-brand:#284a69;
  --rbl-fill-accent:#4a7297;
  --rbl-fill-gold:#c99a2e;
  --rbl-fill-danger:#b91c1c;
  --rbl-fill-success:#15803d;
  --rbl-fill-warn:#b45309;
  --rbl-danger:#b91c1c;
  --rbl-danger-strong:#991b1b;
  --rbl-danger-bg:#fef2f2;
  --rbl-danger-border:#fecaca;
  --rbl-success:#15803d;
  --rbl-success-strong:#166534;
  --rbl-success-bg:#f0fdf4;
  --rbl-success-border:#bbf7d0;
  --rbl-warn:#b45309;
  --rbl-warn-strong:#78350f;
  --rbl-warn-bg:#fff8e6;
  --rbl-warn-border:#d8b45a;
  --rbl-info-text:#1f3a52;
  --rbl-info-bg:#eef6ff;
  --rbl-info-border:#bcd9f5;
  --rbl-sky-bg:#f0f9ff;
  --rbl-sky-border:#bae6fd;
  --rbl-violet:#7c3aed;
  --rbl-violet-strong:#5b21b6;
  --rbl-violet-bg:#f5f3ff;
  --rbl-violet-border:#ddd6fe;
  --rbl-teal:#0f766e;
  --rbl-teal-strong:#115e59;
  --rbl-teal-bg:#f0fdfa;
  --rbl-teal-border:#99f6e4;
  --rbl-note-bg:#fff8e6;
  --rbl-note-border:#d8b45a;
  --rbl-note-text:#5f430d;
  --rbl-note-sub:#8a6a1f;
  --rbl-series-blue:#2E6FB7;
  --rbl-series-indigo:#8158CC;
  --rbl-series-gold:#B98416;
  --rbl-series-teal:#109184;
  --rbl-series-violet:#C2508F;
  --rbl-series-slate:#64748b;
  --rbl-logo-bg:#f8f5ec;
  --rbl-logo-fg:#284a69;
  --rbl-on-gold:#3b2c05;
  --rbl-cta-bg:#38bdf8;
  --rbl-cta-fg:#08263c;
  --rbl-on-series:#ffffff;
  --tc-red:#b91c1c;
  --tc-green:#15803d;
  color-scheme:light;
`

const THEME_CSS = `
:root{${LIGHT_TOKENS}}
html,body{background:var(--rbl-page);color:var(--rbl-text)}
`

// Semantic up/down colors, so a reader can flip the convention: by default an
// increase is red (the accountant's reading), or green for "up = green".
const TREND_CSS = `
:root{--inc:var(--tc-red);--dec:var(--tc-green)}
:root[data-tc="green-up"]{--inc:var(--tc-green);--dec:var(--tc-red)}
`

// Apply the saved trend-colour choice before first paint so the up/down colours
// don't flash the wrong way round.
const PREFS_INIT = `try{var d=document.documentElement;var t=localStorage.getItem('tc');if(t)d.setAttribute('data-tc',t)}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: TREND_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: PREFS_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
