---
name: riverhead-merge-workflow
description: "Use when the user says merge or merge all on a PR."
category: git-workflow
---
# Merging this repo's PRs

- Merge only when the user says "merge" or "merge all"; that covers the open PRs in play, app parity PRs included.
- Confirm CI first (pull_request_read get_check_runs). A Codex usage-limit comment is not a failure.
- A draft cannot merge (405): update_pull_request draft:false, then merge_pull_request with the full
  40-character expectedHeadSha from `git rev-parse HEAD`, merge_method merge.
- Afterwards: unsubscribe_pr_activity and delete the pending send_later check-in.
- Merge the website PR before its iOS/Android parity PRs: Android CI reads the website's main branch.
- Restart the session branch from main for the next change: `git fetch origin main`,
  `git checkout -B <branch> origin/main`. Before pushing, take the remote sha from
  `git ls-remote origin <branch>` (the local tracking ref can be stale and the push fails with
  "stale info"), check it is an ancestor of origin/main, then
  `git push --force-with-lease=<branch>:<sha>`. Plain --force is blocked by the guard hook.
