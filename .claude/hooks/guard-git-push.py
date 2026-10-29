#!/usr/bin/env python3
"""Refuse a git push that CLAUDE.md forbids, before Claude Code runs it.

CLAUDE.md: "Never merge and never push to `main`: the owner merges." This
hook makes that a check rather than something an agent has to remember. It
reads the Bash command Claude Code is about to run (as JSON on stdin) and
refuses, with exit code 2 and a reason on stderr, a git push that:

  - names main or master as the branch it updates (main, HEAD:main,
    refs/heads/main, :main to delete it),
  - forces (--force, -f, or a +refspec), or mirrors (--mirror), or
  - names no branch while the checked-out branch is main or master.

--force-with-lease stays allowed: it refuses to overwrite work it has not
seen, and the session instructions allow it to restart a branch whose pull
request was merged. Merging a pull request on GitHub is not a push, so the
owner's "merge" still works.
"""

import json
import re
import shlex
import subprocess
import sys

PROTECTED = {"main", "master"}


def push_segments(command: str):
    """The argument lists of every `git push` in a shell command line."""
    for part in re.split(r"&&|\|\||;|\||\n", command):
        try:
            words = shlex.split(part)
        except ValueError:
            words = part.split()
        # The command is the first word after any VAR=value assignments, so
        # `echo git push origin main` is text, not a push.
        i = 0
        while i < len(words) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[i]):
            i += 1
        if i >= len(words) or words[i] != "git":
            continue
        rest = words[i + 1:]
        # `git push ...`, or `git -C dir push ...` with options before the subcommand.
        j = 0
        while j < len(rest) and rest[j].startswith("-"):
            j += 2 if rest[j] in ("-C", "-c") else 1
        if j < len(rest) and rest[j] == "push":
            yield rest[j + 1:]


def current_branch() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=5).stdout.strip()
    except Exception:
        return ""


def refusal(args):
    options = [a for a in args if a.startswith("-")]
    if any(o in ("--force", "-f") or (o.startswith("-") and not o.startswith("--") and "f" in o[1:]) for o in options):
        return "it forces the push. Use --force-with-lease if a rewrite is really needed."
    if "--mirror" in options:
        return "it mirrors every branch, main included."
    positional = [a for a in args if not a.startswith("-")]
    refspecs = positional[1:]  # the first is the remote
    for spec in refspecs:
        if spec.startswith("+"):
            return f"the refspec {spec} forces the push."
        target = spec.split(":", 1)[-1]
        if target.removeprefix("refs/heads/") in PROTECTED:
            return f"it pushes to {target.removeprefix('refs/heads/')}. The owner merges into main; push the session branch and open a draft pull request."
    if not refspecs and current_branch() in PROTECTED:
        return f"the checked-out branch is {current_branch()}. Push the session branch instead."
    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    if payload.get("tool_name") != "Bash":
        return 0
    command = (payload.get("tool_input") or {}).get("command") or ""
    for args in push_segments(command):
        reason = refusal(args)
        if reason:
            print(f"Blocked by .claude/hooks/guard-git-push.py: {reason} (CLAUDE.md: never push to main.)", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
