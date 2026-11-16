"""Tests for resolve_watched.py: each vote shape maps to the right status, and
an ambiguous or missing item stays pending with a reason.

Run:  python3 etl/test_resolve_watched.py
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import resolve_watched as rw  # noqa: E402

ITEM = {
    "id": "x", "meetingDate": "2026-11-17", "agendaItem": "IX.26",
    "match": "Stipulation with Riverhead Town Police Benevolent", "pages": ["/payroll/"], "followUps": [],
}


def write(tmp, resolutions):
    Path(tmp, "2026-11-17-fiscal.json").write_text(json.dumps({"resolutions": resolutions}))


class Statuses(unittest.TestCase):
    def run_with(self, resolutions):
        with tempfile.TemporaryDirectory() as tmp:
            if resolutions is not None:
                write(tmp, resolutions)
            return rw.resolve(ITEM, Path(tmp))

    def res(self, vote, title="Authorize Supervisor to Execute Stipulation with Riverhead Town Police Benevolent Association, Inc"):
        return {"number": "2026-1001", "title": title, "vote": vote}

    def test_no_record_yet(self):
        out = self.run_with(None)
        self.assertEqual(out["status"], "pending")
        self.assertIn("no parsed record", out["note"])

    def test_on_agenda_without_vote(self):
        self.assertEqual(self.run_with([self.res(None)])["status"], "pending")

    def test_adopted_unanimous(self):
        out = self.run_with([self.res({"adopted": True, "tag": "unanimous", "nays": 0})])
        self.assertEqual((out["status"], out["number"], out["voteTag"]), ("adopted", "2026-1001", "unanimous"))

    def test_adopted_split(self):
        out = self.run_with([self.res({"adopted": True, "tag": "split", "ayes": 3, "nays": 2})])
        self.assertEqual((out["status"], out["ayes"], out["nays"]), ("adopted", 3, 2))

    def test_tabled(self):
        self.assertEqual(self.run_with([self.res({"adopted": False, "tag": "tabled"})])["status"], "tabled")

    def test_failed(self):
        self.assertEqual(self.run_with([self.res({"adopted": False, "tag": "split", "ayes": 2, "nays": 3})])["status"], "failed")

    def test_not_on_record(self):
        out = self.run_with([self.res({"adopted": True, "tag": "unanimous"}, title="Pays Bills")])
        self.assertEqual(out["status"], "pending")
        self.assertIn("no resolution with this title", out["note"])

    def test_ambiguous_stays_pending(self):
        out = self.run_with([self.res({"adopted": True, "tag": "unanimous"}), self.res({"adopted": True, "tag": "unanimous"})])
        self.assertEqual(out["status"], "pending")
        self.assertIn("2 resolutions match", out["note"])


class Registry(unittest.TestCase):
    def test_registry_ids_are_unique_and_complete(self):
        items = json.loads(rw.REGISTRY.read_text())["items"]
        self.assertEqual(len({i["id"] for i in items}), len(items))
        for i in items:
            for k in ("id", "meetingDate", "agendaItem", "match", "pages", "followUps"):
                self.assertIn(k, i, f"{i.get('id')}: missing {k}")


class Overdue(unittest.TestCase):
    import datetime as _dt

    def test_pending_past_grace_is_overdue(self):
        d = self._dt.date(2026, 11, 17) + self._dt.timedelta(days=rw.OVERDUE_DAYS + 3)
        self.assertEqual(rw.days_overdue({**ITEM, "status": "pending"}, d), 3)

    def test_within_grace_or_decided_is_not(self):
        d = self._dt.date(2026, 11, 17) + self._dt.timedelta(days=rw.OVERDUE_DAYS)
        self.assertEqual(rw.days_overdue({**ITEM, "status": "pending"}, d), 0)
        self.assertEqual(rw.days_overdue({**ITEM, "status": "adopted"}, d + self._dt.timedelta(days=99)), 0)


if __name__ == "__main__":
    unittest.main()
