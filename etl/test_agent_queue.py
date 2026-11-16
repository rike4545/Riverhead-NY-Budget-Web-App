"""Tests for agent_queue.py: decided watched items with follow-ups and new
on-topic resolutions are queued once; history, off-topic items and anything
already handled are not.

Run:  python3 etl/test_agent_queue.py
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agent_queue as aq  # noqa: E402

TOPICS = {"since": "2026-11-17", "topics": [{"id": "epcal", "pages": ["/epcal/"], "phrases": ["epcal"]}]}


def watched(status, follow=("Do a thing",)):
    return {"items": [{"id": "w1", "status": status, "number": "2026-1", "meetingDate": "2026-11-17",
                       "title": "T", "pages": ["/payroll/"], "followUps": list(follow)}]}


class Queue(unittest.TestCase):
    def meetings(self, tmp, date, resolutions):
        Path(tmp, f"{date}-fiscal.json").write_text(json.dumps({"resolutions": resolutions}))

    def q(self, w=None, handled=None, files=()):
        with tempfile.TemporaryDirectory() as tmp:
            for date, res in files:
                self.meetings(tmp, date, res)
            return aq.build_queue(w or {"items": []}, TOPICS, handled or {"watched": [], "resolutions": []}, Path(tmp))

    def test_pending_watched_is_not_queued(self):
        self.assertEqual(self.q(watched("pending")), [])

    def test_decided_watched_with_followups_is_queued(self):
        out = self.q(watched("adopted"))
        self.assertEqual([(i["kind"], i["id"]) for i in out], [("watched", "w1")])

    def test_decided_watched_without_followups_is_not(self):
        self.assertEqual(self.q(watched("adopted", follow=())), [])

    def test_handled_watched_is_not_requeued(self):
        self.assertEqual(self.q(watched("adopted"), {"watched": ["w1"], "resolutions": []}), [])

    def test_new_on_topic_resolution_is_queued(self):
        out = self.q(files=[("2026-12-01", [{"number": "2026-1100", "title": "Runway license at EPCAL", "vote": {"adopted": True}}])])
        self.assertEqual([(i["number"], i["pages"]) for i in out], [("2026-1100", ["/epcal/"])])

    def test_history_and_off_topic_are_not(self):
        out = self.q(files=[("2026-11-05", [{"number": "2026-900", "title": "EPCAL bow hunting"}]),
                            ("2026-12-01", [{"number": "2026-1101", "title": "Pays Bills"}])])
        self.assertEqual(out, [])

    def test_handled_resolution_is_not_requeued(self):
        out = self.q(handled={"watched": [], "resolutions": ["2026-1100"]},
                     files=[("2026-12-01", [{"number": "2026-1100", "title": "EPCAL lease"}])])
        self.assertEqual(out, [])


class Files(unittest.TestCase):
    def test_topics_and_handled_files_parse(self):
        topics = json.loads(aq.TOPICS.read_text())
        self.assertRegex(topics["since"], r"^\d{4}-\d{2}-\d{2}$")
        for t in topics["topics"]:
            self.assertTrue(t["pages"] and t["phrases"], t["id"])
            self.assertTrue(all(p == p.lower() for p in t["phrases"]), f"{t['id']}: phrases must be lower case")
        handled = json.loads(aq.HANDLED.read_text())
        self.assertIsInstance(handled["watched"], list)
        self.assertIsInstance(handled["resolutions"], list)


if __name__ == "__main__":
    unittest.main()
