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

// Dark is a designed palette, not an inversion. Three rules hold it together:
//   • Surfaces step UP in clear increments as they stack (page #0d1015 < card
//     #181d24 < panel #1f252e < table header #272f39). A dark UI reads depth
//     from lightness, and a shadow is invisible on a dark ground, so the steps
//     have to be large enough to see — an earlier pass used a 4% step and the
//     whole page read as one flat field.
//   • The neutrals are near-grey with only a trace of blue. Tinting every
//     surface navy, as the first pass did, leaves the page a monochrome wash
//     with nowhere for the brand blue to register.
//   • Headings are near-white, not blue. That frees blue to mean "link" again
//     instead of being the colour of all text everywhere.
//   • A token used as a FILL behind white text (--rbl-fill-*) stays dark here,
//     while the same brand color used as TEXT (--rbl-title) goes light. That
//     split is why the migration had to be property-aware.
const DARK_TOKENS = `
  --rbl-bg:linear-gradient(180deg,#0d1015 0,#111519 46%,#0d1015 100%);
  --rbl-page:#0d1015;
  --rbl-surface:#181d24;
  --rbl-surface-2:#1f252e;
  --rbl-surface-3:#272f39;
  --rbl-border:#333d49;
  --rbl-border-subtle:#2a323d;
  --rbl-border-strong:#45515f;
  --rbl-track:#272f39;
  --rbl-track-strong:#45515f;
  --rbl-text:#eef2f6;
  --rbl-text-strong:#e2e8ef;
  --rbl-text-body:#c4ccd6;
  --rbl-text-sub:#b4bdc8;
  --rbl-text-muted:#98a2ae;
  --rbl-text-faint:#7d8794;
  --rbl-title:#e9eff6;
  --rbl-accent:#74b3e8;
  --rbl-accent-border:#3d5f80;
  --rbl-link:#82bbf2;
  --rbl-badge:#dcaa47;
  --rbl-gold:#e3b662;
  --rbl-gold-border:#7d6320;
  --rbl-header-a:#141a21;
  --rbl-header-b:#1e2836;
  --rbl-page-accent:#74b3e8;
  --rbl-shadow:rgba(0,0,0,.55);
  --rbl-fill-brand:#2f5175;
  --rbl-fill-accent:#3d6a94;
  --rbl-fill-gold:#b98d2a;
  --rbl-fill-danger:#a32626;
  --rbl-fill-success:#1d6b3c;
  --rbl-fill-warn:#9a5f16;
  --rbl-danger:#f79191;
  --rbl-danger-strong:#fcaeae;
  --rbl-danger-bg:#2a1618;
  --rbl-danger-border:#5b2b2e;
  --rbl-success:#74d99a;
  --rbl-success-strong:#a2e9bd;
  --rbl-success-bg:#132a1e;
  --rbl-success-border:#2d5c40;
  --rbl-warn:#eeba6b;
  --rbl-warn-strong:#f7d99f;
  --rbl-warn-bg:#2a2316;
  --rbl-warn-border:#5d4924;
  --rbl-info-text:#adcbe6;
  --rbl-info-bg:#16212c;
  --rbl-info-border:#2f4557;
  --rbl-sky-bg:#12212c;
  --rbl-sky-border:#2c4f65;
  --rbl-violet:#c3a8f2;
  --rbl-violet-strong:#d9c7fb;
  --rbl-violet-bg:#231d31;
  --rbl-violet-border:#453763;
  --rbl-teal:#63d2b8;
  --rbl-teal-strong:#96e6d3;
  --rbl-teal-bg:#112a27;
  --rbl-teal-border:#2a584f;
  --rbl-note-bg:#272115;
  --rbl-note-border:#6b5528;
  --rbl-note-text:#f2dda8;
  --rbl-note-sub:#cbae6d;
  --rbl-logo-bg:#f8f5ec;
  --rbl-logo-fg:#284a69;
  --rbl-on-gold:#241a06;
  --rbl-cta-bg:#7fc4ee;
  --rbl-cta-fg:#08263c;
  --rbl-on-series:#0d1015;
  --rbl-series-blue:#2E6FB7;
  --rbl-series-indigo:#8158CC;
  --rbl-series-gold:#B98416;
  --rbl-series-teal:#109184;
  --rbl-series-violet:#C2508F;
  --rbl-series-slate:#93a3b6;
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
