---
name: riverhead-new-page
description: "Use when adding a new page or view to the website."
category: site-pages
---
# Adding a page (and keeping the apps in step)

1. Hand-curated data in `web/public/data/<page>.json`, a typed loader in `web/lib/<page>.ts`,
   and `web/app/<page>/page.tsx` built from PageShell, PlainCallout and flat cards.
2. `web/scripts/verify-<page>.mjs`: quotes checked against `etl/data/meetings/*.txt`, link domains,
   no emails or tax-map numbers, and the built `out/<page>/index.html` shows the content.
   Add it to `verify:output` in package.json. Plant one error to prove it fails.
3. Menu: add to GROUPS in `web/components/SiteNav.tsx`; list it in `web/lib/site-pages.ts`
   (verify-search requires it); update the README page and search counts.
4. Apps, in PRs merged after the website PR:
   - Android: a WebParityRoute in WebParityScreen.kt; check with
     `node <android repo>/scripts/verify-web-parity.mjs <web repo>/web/components/SiteNav.tsx`.
   - iOS: an entry in BudgetLiveParityView.swift and the routeCount in BudgetLiveParityTests.swift.
