---
name: riverhead-adopt-external
description: "Use when adopting a skill, plugin or repo from GitHub."
category: tooling
---
# Adopting outside skills, plugins or code

- Read it before adopting: hooks, what it spawns, any network calls, the licence.
- Copy it unchanged at a recorded commit, keep its licence, and record the source and commit in CLAUDE.md.
- A Claude Code plugin is served from `.claude/plugins/` through a local marketplace
  (`extraKnownMarketplaces` with source `directory`), so only the reviewed copy runs.
- Turning on hooks or anything that skips permission prompts is the user's decision:
  set out what it does and ask. The auto-mode classifier blocks the settings edit otherwise.
- Run its own tests in a throwaway venv. Unset this repo's AUTOHARNESS_* env first, or its
  global-layer tests fail.
