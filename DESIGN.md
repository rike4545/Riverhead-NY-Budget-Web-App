# Riverhead Budget Live: design brief

How the site looks and why. Written in October 2026, when the whole site was
reworked against two references:

- [impeccable](https://github.com/pbakaus/impeccable), a design skill whose
  "craft floor" lists what makes a page look built rather than assembled;
- the [Sprouty](https://zapador.net/sprouty/) case study, which designs from a
  short written brief, real-looking screens, and a list of things not to add.

This is that brief. Change it when the design changes, not after.

## Who reads this, and where

Riverhead residents, most of them on a phone, often in the evening or at a Town
Board meeting with the agenda open in another tab. Some check one figure on a
desktop before quoting it. They came to understand something and to check where
it came from. Most pages are documents (impeccable's "Read" mode); the payroll
explorer, search and the tax estimator are tools ("Operate" mode).

## Tone

Calm, plain and trustworthy. A public record set out for neighbours: civic, not
corporate, and never alarmed. The numbers and their sources carry the page; the
design gets out of their way.

## Type

- **One family: Source Sans 3**, self-hosted from `web/app/fonts/` (Latin subset,
  upright and italic, variable 200–900, SIL Open Font License). A humanist sans
  that reads well at length and has tabular figures by default, so columns of
  numbers line up.
- The face has a small x-height, so `site.css` sets `font-size-adjust: .52`:
  the page sizes keep the apparent size they were designed at.
- **Sentence case everywhere**, including labels and table headings. No
  uppercase, letter-spaced labels.
- Bold (700) for headings and key figures; 600 for labels and links; 400 for
  reading.
- Body text 15–17px. Prose stops at **72 characters** a line (`p` and
  `blockquote` have `max-width: 72ch`). Headings are balanced.

## Colour

The incumbent palette, kept: navy for titles and the masthead, steel blue for
accents, a little gold, and tinted panels for status (info, warning, success,
danger). Every colour is a `--rbl-*` token in `web/app/layout.tsx`. The focus
ring, text selection, scrollbars and caret take their colours from those tokens
too. Light only.

## Shapes and surfaces

- Cards are flat: white, a faint 1px border, 14–16px corners, no drop shadow.
  Shadows are for things that float, such as menus.
- **Status lives in the box, not on its edge.** A warning or a finding is a
  tinted panel with a 1px border of the same family. No thick coloured stripe
  down the side of a card, callout or list item. A quotation's left rule is the
  one exception, because that is how readers know a quote.
- Tables are tables: a caption saying what and where from, sentence-case
  headings, right-aligned figures, hairline rows. On a phone they stack
  (`.rbl-stack`), one labelled block per row.

## Structure

- A heading speaks for itself. **No kicker or eyebrow label above a heading**,
  and no section numbers unless the order itself matters.
- Data that belongs with a heading, such as a fund code, a meeting's status or
  a date, goes after it or in it, not above it.
- Long pages get an "On this page" list (see `/tax-cap-letter/`).
- Unofficial material stays labelled, in words: "Tentative", "forecast",
  "calculated", "machine transcript".

## Icons

From `lucide-react`, at 14–18px with a 2–2.25 stroke, beside words, never
instead of them. No emoji and no Unicode symbols as icons. Arrows in link text
(→, ↗) are typography and stay.

## Do not add

Anything the brief does not ask for: extra banners, badges, hero metrics,
promo cards, gradients, glass, confetti, photos or decorative illustrations.
When a page feels empty, the fix is a clearer sentence, not more chrome.

## How a change is checked

1. Build it with the real copy and the real figures, never placeholder text.
2. Look at it at 1280px and 390px wide (Playwright is installed), with the
   menus open and a keyboard focus showing.
3. Fix everything that pass shows, check once more, and stop.

`npm run verify` runs `web/scripts/verify-design.mjs`, which fails the build
on an emoji in the source, an uppercase label, a thick side stripe, or a built
page that no longer loads the typeface.
