#!/usr/bin/env python3
"""Tests for .github/scripts/push-data.sh, the push step of the data workflows.

On October 5, 2026 both of Parse Financial Reports' schedules fired for Monday
09:00 UTC and the two runs started 35 seconds apart. Each stamped
web/public/data/meta.json with its own time, so the second run's rebase stopped
on that file and the job failed with its data unpushed. These tests replay that
race, and the others the script must survive, in throwaway repositories: job A
pushes first, then the script runs as job B.

Run: python etl/test_push_data.py
"""
from __future__ import annotations

import calendar
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / ".github/scripts/push-data.sh"
WORKFLOWS = ROOT / ".github/workflows"

# A stand-in for the real rebuild: the freshness stamp fingerprints the data and
# carries the time it was made, so two runs never write the same stamp, and the
# search index lists every data file.
REBUILD_PY = """\
import hashlib, json, pathlib, time
data = {p.name: p.read_text() for p in sorted(pathlib.Path("data").glob("*.json"))}
fp = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:12]
pathlib.Path("web/public/data/meta.json").write_text(json.dumps({"generated": time.time_ns(), "fingerprint": fp}) + "\\n")
pathlib.Path("web/public/data/search/index.json").write_text("".join(f"{k}={v.strip()}\\n" for k, v in data.items()))
"""

ENV = {
    **os.environ,
    "GIT_AUTHOR_NAME": "test", "GIT_AUTHOR_EMAIL": "test@example.invalid",
    "GIT_COMMITTER_NAME": "test", "GIT_COMMITTER_EMAIL": "test@example.invalid",
    "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1",
    "DERIVED": r"^(web/public/data/meta\.json$|web/public/data/search/)",
    "REBUILD": "python3 rebuild.py",
}


def git(cwd: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=cwd, env=ENV, check=True, capture_output=True, text=True).stdout


class Race(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.origin = self.tmp / "origin.git"
        git(self.tmp, "init", "-q", "--bare", "-b", "main", str(self.origin))
        seed = self.tmp / "seed"
        git(self.tmp, "clone", "-q", str(self.origin), str(seed))
        (seed / "data").mkdir()
        (seed / "web/public/data/search").mkdir(parents=True)
        (seed / "rebuild.py").write_text(REBUILD_PY)
        for name in ("a.json", "b.json"):
            (seed / "data" / name).write_text('{"v": 1}\n')
        self.rebuild(seed)
        git(seed, "add", "-A")
        git(seed, "commit", "-qm", "seed")
        git(seed, "push", "-q", "origin", "main")
        for job in ("A", "B"):
            git(self.tmp, "clone", "-q", str(self.origin), str(self.tmp / job))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def rebuild(self, repo: Path):
        subprocess.run(["python3", "rebuild.py"], cwd=repo, env=ENV, check=True)

    def job(self, name: str, changes: dict[str, int], push: bool = False):
        """A data job: change some data files, rebuild the derived ones, commit."""
        repo = self.tmp / name
        for file, value in changes.items():
            (repo / "data" / file).write_text(json.dumps({"v": value}) + "\n")
        self.rebuild(repo)
        git(repo, "add", "-A")
        git(repo, "commit", "-qm", f"Auto-update parsed financial datasets ({name})")
        if push:
            git(repo, "push", "-q", "origin", "main")

    def push_b(self):
        return subprocess.run(["bash", str(SCRIPT), "data", "web/public/data"], cwd=self.tmp / "B", env=ENV,
                              capture_output=True, text=True)

    def published(self) -> Path:
        check = self.tmp / "check"
        shutil.rmtree(check, ignore_errors=True)
        git(self.tmp, "clone", "-q", str(self.origin), str(check))
        return check

    def assert_derived_match_data(self, repo: Path):
        stamp = (repo / "web/public/data/meta.json").read_text()
        index = (repo / "web/public/data/search/index.json").read_text()
        self.assertNotIn("<<<<<<<", stamp + index, "no conflict markers are pushed")
        data = {p.name: p.read_text() for p in sorted((repo / "data").glob("*.json"))}
        fingerprint = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:12]
        self.assertEqual(json.loads(stamp)["fingerprint"], fingerprint, "the stamp describes the data that was pushed")
        self.assertEqual(index, "".join(f"{k}={v.strip()}\n" for k, v in data.items()), "the index lists that data")

    def value(self, repo: Path, file: str) -> int:
        return json.loads((repo / "data" / file).read_text())["v"]

    def test_only_the_stamp_changed_and_another_run_pushed_first(self):
        # October 5, 2026: the second run's commit held nothing but meta.json.
        self.job("A", {"a.json": 2}, push=True)
        self.job("B", {})
        result = self.push_b()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Derived files conflicted", result.stdout)
        out = self.published()
        self.assertEqual(self.value(out, "a.json"), 2, "A's data is kept")
        self.assert_derived_match_data(out)

    def test_two_runs_changed_different_data(self):
        self.job("A", {"a.json": 2}, push=True)
        self.job("B", {"b.json": 3})
        result = self.push_b()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        out = self.published()
        self.assertEqual((self.value(out, "a.json"), self.value(out, "b.json")), (2, 3), "both runs' data is kept")
        self.assert_derived_match_data(out)
        self.assertEqual(git(out, "log", "-1", "--format=%s").strip(), "Auto-update parsed financial datasets (B)")

    def test_two_runs_changed_the_same_data(self):
        self.job("A", {"a.json": 2}, push=True)
        self.job("B", {"a.json": 9})
        result = self.push_b()
        self.assertEqual(result.returncode, 1)
        self.assertIn("::error::main changed the same source data as this run, so it was not pushed: data/a.json",
                      result.stdout)
        git_dir = self.tmp / "B/.git"
        self.assertFalse((git_dir / "rebase-merge").exists() or (git_dir / "rebase-apply").exists(),
                         "the rebase is abandoned, not left half done")
        self.assertEqual(self.value(self.published(), "a.json"), 2, "main keeps A's value")

    def test_main_had_not_moved(self):
        self.job("B", {"b.json": 4})
        stamp = (self.tmp / "B/web/public/data/meta.json").read_text()
        result = self.push_b()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual((self.published() / "web/public/data/meta.json").read_text(), stamp,
                         "pushed as committed, without rebuilding")

    def test_main_moves_again_before_the_push(self):
        self.job("A", {"a.json": 2}, push=True)
        self.job("B", {"b.json": 5})
        hook = self.origin / "hooks/pre-receive"
        hook.write_text('#!/bin/sh\n[ -e rejected-once ] && exit 0\ntouch rejected-once\necho "main moved"\nexit 1\n')
        hook.chmod(0o755)
        result = self.push_b()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Push attempt 2", result.stdout)
        out = self.published()
        self.assertEqual((self.value(out, "a.json"), self.value(out, "b.json")), (2, 5))
        self.assert_derived_match_data(out)


def cron_fields(expr: str) -> list[set[int]]:
    """Expand a five-field cron expression (numbers, *, ranges, lists, steps)."""
    bounds = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 6)]
    fields = []
    for field, (lo, hi) in zip(expr.split(), bounds):
        values: set[int] = set()
        for part in field.split(","):
            rng, _, step = part.partition("/")
            a, b = (lo, hi) if rng == "*" else map(int, (rng.split("-") * 2)[:2])
            values |= set(range(a, b + 1, int(step or 1)))
        fields.append(values)
    return fields


def cron_matches(expr: str, year: int, month: int, day: int, hour: int, minute: int) -> bool:
    mins, hours, doms, months, dows = cron_fields(expr)
    dom_all, dow_all = [f == "*" for f in expr.split()[2:5:2]]
    dow = (calendar.weekday(year, month, day) + 1) % 7  # cron counts from Sunday = 0
    day_ok = (day in doms or dow in dows) if not (dom_all or dow_all) else (day in doms and dow in dows)
    return minute in mins and hour in hours and month in months and day_ok


class Workflows(unittest.TestCase):
    def test_data_workflows_push_through_the_script(self):
        for name in ("parse-financial-reports.yml", "sync-meetings.yml"):
            text = (WORKFLOWS / name).read_text(encoding="utf-8")
            with self.subTest(name):
                self.assertIn("bash .github/scripts/push-data.sh", text)
                self.assertNotRegex(text, r"git (pull --rebase|rebase origin/main)",
                                    "a bare rebase stops on the first meta.json conflict")
                self.assertIn(r"web/public/data/meta\.json$", text, "meta.json is rebuilt, not merged")

    def test_parse_runs_one_at_a_time_and_its_schedules_never_coincide(self):
        text = (WORKFLOWS / "parse-financial-reports.yml").read_text(encoding="utf-8")
        self.assertRegex(text, r"(?m)^concurrency:\n  group: parse-financial-reports\n  cancel-in-progress: false$")
        crons = re.findall(r"- cron: '([^']+)'", text)
        self.assertEqual(len(crons), 2)
        minutes = set().union(*(cron_fields(c)[0] for c in crons))
        both = [(m, d, h, mi) for m in range(1, 13) for d in range(1, calendar.monthrange(2026, m)[1] + 1)
                for h in range(24) for mi in minutes if all(cron_matches(c, 2026, m, d, h, mi) for c in crons)]
        self.assertEqual(both, [], "two schedules firing for the same hour start two runs at once")

    def test_the_cron_reader(self):
        # Monday, October 5, 2026 at 09:00 matched both of the old schedules.
        self.assertTrue(cron_matches("0 9 * * 1", 2026, 10, 5, 9, 0))
        self.assertTrue(cron_matches("0 9,22 * 9-11 *", 2026, 10, 5, 9, 0))
        self.assertFalse(cron_matches("0 9 * 1-8,12 1", 2026, 10, 5, 9, 0))
        self.assertTrue(cron_matches("0 9 * 1-8,12 1", 2026, 12, 7, 9, 0))


if __name__ == "__main__":
    unittest.main()
