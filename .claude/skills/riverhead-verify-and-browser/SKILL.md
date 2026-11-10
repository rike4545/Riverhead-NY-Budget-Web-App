---
name: riverhead-verify-and-browser
description: "Use when running checks or viewing pages in a browser."
category: testing
---
# Checks before pushing

- `python3 etl/write_meta.py`, then `npx tsc --noEmit`, `npm run build`, `npm run verify:output`
  (over two minutes: run it in the background). Afterwards `git checkout -- web/public/data/meta.json`.
- ETL tests: `for t in etl/test_*.py; do python3 "$t" || break; done`.
- Look at pages through a local http server that strips the base path `/Riverhead-NY-Budget-Web-App`;
  `file://` loses the CSS.
- Accessibility: inject axe-core and run wcag2a, wcag2aa, wcag21aa and wcag22aa, in light and dark,
  at 390px and 1280px. Tap targets: `node web/scripts/audit-targets.mjs` (run from web/), and again with `--width 1280`.
- Playwright: pick inputs with getByLabel (the hidden mobile site-search input matches
  `input[type=search]` first); `[aria-live]` also matches Next's route announcer, so narrow it.
- Phone tables: `className="rbl-stack"` with data-label cells; `rbl-stack-prose` for long text.
