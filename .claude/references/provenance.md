# Where this repo's skills, references and plugins come from

CLAUDE.md keeps only the rules for using these. This file records their sources
and licences. Read it when adding, updating or removing one of them.

## Skills

`.claude/skills/` holds 25 general engineering skills copied unchanged from
addyosmani/agent-skills at commit 1401c8b (MIT License, kept in
`.claude/skills/LICENSE-agent-skills`). They cover specs, planning,
incremental implementation, test-driven development, debugging, code review,
simplification, security, performance and documentation. The checklists they
link to are in `.claude/references/`, with two more from the Open Design Agent
Kit (feimacode/open-design-agent-kit at commit dd8c43f): `accessibility-baseline.md`
(Apache-2.0, from Open Design) and `ux-writing.md` (MIT). Their licences are in
`.claude/references/LICENSE-open-design.md`.

Four more are copied unchanged from other collections, for gaps the 25 leave:

- `verification-before-completion` (obra/superpowers at 22f0b46, MIT): run the
  check and read its output before saying anything passes or is done. This is
  the site's accuracy rule applied to the work itself.
- `receiving-code-review` (obra/superpowers at 22f0b46, MIT): verify a review
  comment, including a bot's, against the code before acting on it.
- `writing-for-agents` (mattpocock/skills at 4ae2317, MIT): use it when editing
  this file, a skill or an agent definition.
- `handoff` (mattpocock/skills at 4ae2317, MIT): run as `/handoff` to write a
  summary a fresh session can pick up.

`.claude/references/copy-tells.md` (leonxlnx/taste-skill at f6b7657, MIT) lists
what makes copy read as machine-written. Check resident-facing copy against it
alongside `ux-writing.md`. It names files from its own repo (`copy-lint.mjs`,
`copy-moves.md` and others) that were not copied. Licences are in
`.claude/skills/LICENSE-superpowers`, `.claude/skills/LICENSE-mattpocock-skills`
and `.claude/references/LICENSE-taste-skill`.

They are general practice. Where a skill conflicts with this file, this file
wins: never merge, auto-merge, push to `main` or deploy; open draft pull
requests; and keep every figure traced to an official record.

## Learned skills (autoharness)

`.claude/plugins/autoharness/` is tigerless-labs/autoharness copied unchanged
at commit 84f1840 (MIT License, in that folder), offered through the local
catalog in `.claude/plugins/.claude-plugin/` and turned on in
`.claude/settings.json`. Every 50 tool calls it starts a background
session that reads a redacted slice of the conversation and proposes skills;
it writes them to `.claude/skills/`, each marked `self-authored` in its
ledger, and retires the ones that go unused. `/learn` asks it to distill the
current session now. `AUTOHARNESS_DISABLE_GLOBAL=1` keeps it to this project,
and it reflects every 50 tool calls and consolidates every 250, its defaults.
It was set to 20 and 100 until November 11, 2026, when the background
sessions were made less frequent to save tokens. It was seeded on November 10, 2026 with five `riverhead-*`
skills distilled from that day's work (merging, adding a page, the
outdated-information review, checks, adopting outside tools); its ledger and
sidecar files beside each skill mark them as its own, so commit them too.

- A learned skill is a draft. Read it before committing it, and commit it only
  if it is right for this repo. Never commit `.claude/autoharness/` (its
  state, gitignored).
- A learned skill never overrides this file, the accuracy rules or the design
  brief. If one does, fix or delete it.
- To update autoharness, copy a newer commit over the folder unchanged and
  record the commit here; don't edit its code in place.
