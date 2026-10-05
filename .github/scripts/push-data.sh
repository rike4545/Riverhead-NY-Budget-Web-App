#!/usr/bin/env bash
# Push a workflow's data commit to main, rebuilding the files that are derived
# from the data on top of whatever main holds by then.
#
# Several scheduled jobs commit generated data to main, and two of them can run
# at once. On October 5, 2026 both of Parse Financial Reports' schedules matched
# Monday 09:00 UTC; GitHub started the two runs 35 seconds apart, and each
# stamped web/public/data/meta.json with its own time. The second run's rebase
# stopped on that file, and the job failed with its data unpushed.
#
# A derived file (any path matching DERIVED, an extended regular expression) is
# never merged line by line. If one conflicts, main's copy is taken for the
# moment; then, whenever main has moved, REBUILD regenerates every derived file
# from the combined data and the commit is updated. A conflict in any other file
# means two jobs changed the same source data: the rebase is abandoned and the
# job fails, naming the files, for a person to look at.
#
# Usage, after the job has made its one commit:
#   DERIVED='^web/public/data/meta\.json$' REBUILD='python etl/write_meta.py' \
#     bash .github/scripts/push-data.sh <paths to stage after rebuilding>...
set -euo pipefail

: "${DERIVED:?set DERIVED to a regular expression matching the derived paths}"
: "${REBUILD:?set REBUILD to the commands that regenerate the derived files}"
[ "$#" -gt 0 ] || { echo "::error::push-data.sh needs the paths to stage after rebuilding" >&2; exit 2; }
paths=("$@")
message=$(git log -1 --format=%B)

stage() {
  local p
  for p in "${paths[@]}"; do
    if [ -e "$p" ] || git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
      git add -A -- "$p"
    fi
  done
}

sync_with_main() {
  git fetch --quiet origin main
  local before
  before=$(git rev-parse HEAD)
  if ! git rebase --autostash origin/main; then
    local conflicted source f
    conflicted=$(git diff --name-only --diff-filter=U)
    if [ -z "$conflicted" ]; then
      echo "::error::git rebase onto origin/main failed with no conflict to resolve"
      git rebase --abort 2>/dev/null || true
      exit 1
    fi
    source=$(printf '%s\n' "$conflicted" | grep -vE "$DERIVED" || true)
    if [ -n "$source" ]; then
      echo "::error::main changed the same source data as this run, so it was not pushed: $(printf '%s ' $source)"
      git rebase --abort
      exit 1
    fi
    echo "Derived files conflicted and will be rebuilt on top of main: $(printf '%s ' $conflicted)"
    # During a rebase "ours" is main. Its copy only holds the place: the
    # rebuild below regenerates the file from the combined data.
    while IFS= read -r f; do
      git checkout --ours -- "$f"
      git add -- "$f"
    done <<< "$conflicted"
    if git diff --cached --quiet; then
      # Nothing but derived files was in the commit, and main's copies replaced them.
      git rebase --skip
    else
      GIT_EDITOR=true git rebase --continue
    fi
  fi
  if [ "$(git rev-parse HEAD)" = "$before" ]; then
    return 0  # main had not moved; the derived files already match this run's data
  fi
  eval "$REBUILD"
  stage
  if git diff --cached --quiet; then
    return 0
  fi
  if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
    git commit --quiet -m "$message"
  else
    git commit --quiet --amend --no-edit
  fi
}

for attempt in 1 2 3; do
  echo "Push attempt $attempt: syncing with origin/main..."
  sync_with_main
  if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
    echo "Nothing left to push: main already holds this run's data."
    exit 0
  fi
  if git push origin HEAD:main; then
    exit 0
  fi
  echo "main advanced again before the push; retrying."
  sleep $((attempt * 2))
done

echo "::error::Unable to push the data commit after 3 attempts."
exit 1
