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
// page component. Light values are the site's original palette, unchanged —
// the dark set re-points the same names, so no component knows which theme is
// active.
//
// Three-state theming, in this order:
//   1. :root                          — light, the baseline every token is defined in
//   2. prefers-color-scheme: dark     — the OS default, but only when the reader
//                                       has not explicitly chosen light
//   3. :root[data-theme="dark"]       — an explicit choice, which must win over
//                                       an OS set to light
// Defining a token ONLY inside a media query would leave it undefined for
// readers whose OS says light, so every token gets its value on bare :root.
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
  --rbl-text-muted:#64748b;
  --rbl-text-faint:#94a3b8;
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
  --rbl-series-blue:#4a7297;
  --rbl-series-indigo:#2563eb;
  --rbl-series-gold:#c99a2e;
  --rbl-series-teal:#0f766e;
  --rbl-series-violet:#7c3aed;
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

// Dark is a designed palette, not an inversion. Three rules hold it together:
//   • Surfaces step UP in lightness as they stack (page < card < table header),
//     because a dark UI reads depth from lightness, not from shadows.
//   • Text tokens lose saturation rather than gaining brightness, so body copy
//     sits near #c3d0de instead of pure white — full-white text on dark vibrates.
//   • A token used as a FILL behind white text (--rbl-fill-*) stays dark here,
//     while the same brand color used as TEXT (--rbl-title) goes light. That
//     split is why the migration had to be property-aware.
const DARK_TOKENS = `
  --rbl-bg:linear-gradient(180deg,#0b1420 0,#0e1826 46%,#0b131d 100%);
  --rbl-page:#0b1420;
  --rbl-surface:#141f2d;
  --rbl-surface-2:#1a2634;
  --rbl-surface-3:#202e3e;
  --rbl-border:#2c3d52;
  --rbl-border-subtle:#243244;
  --rbl-border-strong:#3a4d64;
  --rbl-track:#243244;
  --rbl-track-strong:#3a4d64;
  --rbl-text:#e7eef7;
  --rbl-text-strong:#dae4f0;
  --rbl-text-body:#c3d0de;
  --rbl-text-sub:#b3c2d3;
  --rbl-text-muted:#93a3b6;
  --rbl-text-faint:#7c8ca0;
  --rbl-title:#9ec8ec;
  --rbl-accent:#7fb6e2;
  --rbl-accent-border:#3d6a94;
  --rbl-link:#8ab8f0;
  --rbl-badge:#d9a742;
  --rbl-gold:#e2b761;
  --rbl-gold-border:#8a6c2a;
  --rbl-header-a:#16263a;
  --rbl-header-b:#20364e;
  --rbl-page-accent:#7fb6e2;
  --rbl-shadow:rgba(0,0,0,.5);
  --rbl-fill-brand:#2b4b6b;
  --rbl-fill-accent:#3d6a94;
  --rbl-fill-gold:#b98d2a;
  --rbl-fill-danger:#a32626;
  --rbl-fill-success:#1d6b3c;
  --rbl-fill-warn:#9a5f16;
  --rbl-danger:#f78a8a;
  --rbl-danger-strong:#fca5a5;
  --rbl-danger-bg:#2c1517;
  --rbl-danger-border:#5c2a2e;
  --rbl-success:#6fd694;
  --rbl-success-strong:#9ce8b8;
  --rbl-success-bg:#12291d;
  --rbl-success-border:#2d5c3e;
  --rbl-warn:#eab766;
  --rbl-warn-strong:#f6d79b;
  --rbl-warn-bg:#2b2213;
  --rbl-warn-border:#5f4a22;
  --rbl-info-text:#a7c9e8;
  --rbl-info-bg:#152435;
  --rbl-info-border:#2f4d6d;
  --rbl-sky-bg:#0f2433;
  --rbl-sky-border:#2b5673;
  --rbl-violet:#c0a3f0;
  --rbl-violet-strong:#d6c2fa;
  --rbl-violet-bg:#221a35;
  --rbl-violet-border:#453268;
  --rbl-teal:#5fcdb4;
  --rbl-teal-strong:#93e3d0;
  --rbl-teal-bg:#0f2b28;
  --rbl-teal-border:#2a5c53;
  --rbl-note-bg:#2a2313;
  --rbl-note-border:#6a5423;
  --rbl-note-text:#f0d9a0;
  --rbl-note-sub:#c9ab6a;
  --rbl-series-blue:#7fb6e2;
  --rbl-series-indigo:#93b4f8;
  --rbl-series-gold:#e2b761;
  --rbl-series-teal:#5fcdb4;
  --rbl-series-violet:#c0a3f0;
  --rbl-series-slate:#93a3b6;
  --rbl-logo-bg:#f8f5ec;
  --rbl-logo-fg:#284a69;
  --rbl-on-gold:#241a06;
  --rbl-cta-bg:#7fc4ee;
  --rbl-cta-fg:#08263c;
  --rbl-on-series:#0b1420;
  --tc-red:#f87171;
  --tc-green:#4ade80;
  color-scheme:dark;
`

const THEME_CSS = `
:root{${LIGHT_TOKENS}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${DARK_TOKENS}}}
:root[data-theme="dark"]{${DARK_TOKENS}}
html,body{background:var(--rbl-page);color:var(--rbl-text)}
`

// Semantic up/down colors. The reader picks which direction reads as "red"
// (accountant view: an increase is red); the theme picks how bright that red
// has to be to survive its background.
const TREND_CSS = `
:root{--inc:var(--tc-red);--dec:var(--tc-green)}
:root[data-tc="green-up"]{--inc:var(--tc-green);--dec:var(--tc-red)}
`

// Apply saved choices before first paint so nothing flashes the wrong theme.
// `theme` is only ever "light" or "dark" — absent means "follow the OS", which
// the media query above already handles.
const PREFS_INIT = `try{var d=document.documentElement;var t=localStorage.getItem('tc');if(t)d.setAttribute('data-tc',t);var m=localStorage.getItem('theme');if(m==='light'||m==='dark')d.setAttribute('data-theme',m)}catch(e){}`

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
