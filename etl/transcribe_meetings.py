#!/usr/bin/env python3
"""Transcribe Town Board meetings from the Town's own video, and find the moment
each resolution was voted.

The Town publishes a recording of every Town Board meeting on its CivicClerk
portal and no transcript (its event records carry an empty closed-caption
field). riverheadtranscripts.org, a volunteer site, fills that gap with OpenAI
Whisper; this script does the same with Whisper's open-source weights, so the
site's vote links do not depend on a third party staying online.

Engine: faster-whisper (a CTranslate2 build of Whisper), model small.en,
8-bit, on CPU. The September 15, 2026 meeting -- 126 minutes -- took 14.7
minutes on 4 cores, so a nightly job can keep up with every meeting and work
back through older ones a few at a time.

Vote times: the Supervisor or Clerk reads each resolution out by number
("Resolution 843. Budget adoption for ...") before the roll call, so the time
the number is read is where a vote link starts. See vote_times for how a
number said more than once, misheard or spelled out is handled.

Everything here is unofficial machine output. Names and figures can be
misheard; the meeting record and the Town's own minutes remain the source.

Usage:
  python etl/transcribe_meetings.py [--max 2] [--date 2026-09-15 [--video FILE]] [--model small.en] [--force]

Output: web/public/data/transcripts/<date>.json
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"
OUT = ROOT / "web/public/data/transcripts"
DEFAULT_MODEL = "small.en"


def arg(name: str, default: str | None = None) -> str | None:
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def candidates(only_date: str | None, force: bool) -> list[tuple[str, dict]]:
    """Meetings on this site that have the Town's video, newest first."""
    media = json.loads((MEETINGS / "media.json").read_text(encoding="utf-8"))["meetings"]
    slugs = [m["slug"] for m in json.loads((MEETINGS / "index.json").read_text(encoding="utf-8"))["meetings"]]
    out = []
    for slug in sorted(slugs, reverse=True):
        entry = media.get(slug) or {}
        if only_date and slug != only_date:
            continue
        if not entry.get("video"):
            continue
        if (OUT / f"{slug}.json").exists() and not force:
            continue
        out.append((slug, entry))
    return out


def initial_prompt(meeting: dict) -> str:
    """Names Whisper should spell as the Town does, and how resolutions are read."""
    names = ", ".join(f"{r.get('title', '')} {r['name']}".strip() for r in meeting.get("roster", []) if r.get("name"))
    first = next((r["number"] for r in meeting.get("resolutions") or meeting.get("docket") or [] if r.get("number")), "")
    return f"Riverhead Town Board meeting. {names}. Resolution {first}.".replace("  ", " ")


SAMPLE_RATE = 16000
# faster-whisper builds the spectrogram of all the audio it is given at once:
# about 14 GB for the September 1, 2026 meeting, more than a 16 GB runner can
# spare. So a meeting goes through in passes of about 20 minutes, each cut at
# the quietest half second near its end, where no one is mid-word.
PASS_SECONDS = 20 * 60


def cut_points(audio, every: int = PASS_SECONDS, search: int = 60) -> list[int]:
    """Sample offsets splitting the audio into passes, each cut where it is quietest."""
    import numpy as np

    half = SAMPLE_RATE // 2
    cuts, n = [0], len(audio)
    while n - cuts[-1] > (every + search) * SAMPLE_RATE:
        lo = cuts[-1] + (every - search) * SAMPLE_RATE
        window = np.asarray(audio[lo:lo + 2 * search * SAMPLE_RATE], dtype=np.float32)
        frames = window[: len(window) // half * half].reshape(-1, half)
        quietest = int(np.argmin((frames ** 2).mean(axis=1)))
        cuts.append(lo + quietest * half + half // 2)
    cuts.append(n)
    return cuts


def transcribe(video: Path, prompt: str, model_name: str) -> tuple[list[list], float, float]:
    from faster_whisper import WhisperModel, decode_audio

    audio = decode_audio(str(video), sampling_rate=SAMPLE_RATE)
    duration = len(audio) / SAMPLE_RATE
    model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    started = time.time()
    rows: list[list] = []
    cuts = cut_points(audio)
    for a, b in zip(cuts, cuts[1:]):
        # condition_on_previous_text=False keeps one misheard passage from
        # repeating itself through the rest of a long meeting; the VAD filter
        # skips the silence before the gavel and during recesses.
        segments, _info = model.transcribe(
            audio[a:b], language="en", initial_prompt=prompt, vad_filter=True, beam_size=1,
            condition_on_previous_text=False,
        )
        offset = a / SAMPLE_RATE
        rows += [[round(s.start + offset, 1), round(s.end + offset, 1), s.text.strip()] for s in segments if s.text.strip()]
    return rows, duration, time.time() - started


STOPWORDS = frozenset("the and for from with this that its are was into upon".split())
# A window that sounds like a resolution being read out or voted on. Whisper
# sometimes hears "the resolution is adopted" as "the solution is adopted".
READ_OUT = re.compile(r"\b(?:re)?solutions?\b|\badopted\b", re.I)


def words(text: str) -> list[str]:
    return re.findall(r"[a-z]+", text.lower())


def title_words(title: str) -> list[str]:
    """The first eight words of a title worth listening for."""
    return [w for w in words(title) if len(w) > 2 and w not in STOPWORDS][:8]


def overlap(keys: list[str], text: str) -> float:
    """Share of a title's words heard in a stretch of transcript."""
    if not keys:
        return 0.0
    heard = set(words(text))
    return sum(k in heard for k in keys) / len(keys)


def number_pattern(number: str) -> re.Pattern:
    """'2026-843' read out as "Resolution 843", "resolution number 843",
    "Resolution 2026-843" or "our first resolution is number one which is 843"."""
    tail = number.split("-")[-1]
    return re.compile(rf"\bresolutions?\b(?:\W+[a-z]+){{0,5}}?\W+(?:\d{{4}}\s*[-–]?\s*)?{tail}\b", re.I)


def vote_times(segments: list[list], resolutions: list[dict]) -> dict[str, float]:
    """{resolution number: second it is read out}, in agenda order.

    1. Every place a number is read out is a candidate. The candidates kept
       are the largest set that runs in agenda order and, among sets as large,
       the one whose readings are followed by their titles. So a speaker who
       cites a resolution in the comment period, or a debate that names it
       again, does not move its vote.
    2. A resolution taken out of agenda order is kept if its number is read
       out in one place only.
    3. A number Whisper mishears ("resolution h64") or spells out ("eight
       forty two") is found by its title, between the votes on either side.
    """
    numbers = [r["number"] for r in resolutions if r.get("number")]
    keys = {r["number"]: title_words(r.get("title") or "") for r in resolutions if r.get("number")}
    text = [seg[2] for seg in segments]
    starts = [seg[0] for seg in segments]

    def readings(n: str) -> list[tuple[float, float]]:
        """(start of the segment the number is said in, share of the title heard after it)."""
        pat, out = number_pattern(n), {}
        for i in range(len(text)):
            # Each segment with the next, so "...adopted. Resolution" + "843.
            # Budget" reads as one mention.
            if pat.search(" ".join(text[i:i + 2])):
                k = i if pat.search(text[i]) else i + 1
                out[starts[k]] = overlap(keys[n], " ".join(text[k:k + 2]))
        return sorted(out.items())

    mentions = {n: readings(n) for n in numbers}

    # 1. Each state: (time, score, picks). A reading scores 1 plus up to 0.5
    # for its title, so more readings in order always win.
    states: list[tuple[float, float, dict]] = [(-1.0, 0.0, {})]
    for n in numbers:
        grown = []
        for t, title_heard in mentions[n]:
            best = max((st for st in states if st[0] <= t), key=lambda st: st[1])
            grown.append((t, best[1] + 1 + 0.5 * title_heard, {**best[2], n: t}))
        states = prune(states + grown)
    in_order = dict(max(states, key=lambda st: st[1])[2])
    found = dict(in_order)

    # 2. Out of order, but unambiguous.
    for n in numbers:
        times = [t for t, _ in mentions[n]]
        if n not in found and times and max(times) - min(times) < 30:
            found[n] = times[0]

    # 3. By title, between the neighbouring votes found in order.
    for i, n in enumerate(numbers):
        if n in found or not keys[n]:
            continue
        lo = max((in_order[m] for m in numbers[:i] if m in in_order), default=None)
        hi = min((in_order[m] for m in numbers[i + 1:] if m in in_order), default=None)
        if lo is None and hi is None:
            continue
        lo = hi - 300 if lo is None else lo
        hi = lo + 600 if hi is None else hi
        # The title's share heard from this segment on; ties go to the segment
        # the title starts in.
        scored = [(overlap(keys[n], " ".join(text[k:k + 2])), overlap(keys[n], text[k]), -starts[k])
                  for k in range(len(text)) if lo < starts[k] < hi and READ_OUT.search(" ".join(text[k:k + 2]))]
        if scored and max(scored)[0] >= 0.5:
            found[n] = in_order[n] = -max(scored)[2]
    return {n: found[n] for n in numbers if n in found}


def prune(states: list[tuple[float, float, dict]]) -> list[tuple[float, float, dict]]:
    """Keep only states no other state beats on both time (earlier) and score."""
    kept, best = [], float("-inf")
    for st in sorted(states, key=lambda st: (st[0], -st[1])):
        if st[1] > best:
            kept.append(st)
            best = st[1]
    return kept


def download(url: str, dest: Path) -> None:
    subprocess.run(["curl", "-sf", "--retry", "3", "--max-time", "3600", "-o", str(dest), url], check=True)


def main() -> int:
    only_date = arg("--date")
    local_video = arg("--video")
    model_name = arg("--model", DEFAULT_MODEL)
    limit = int(arg("--max", "2"))
    force = "--force" in sys.argv
    todo = candidates(only_date, force)[:limit]
    if not todo:
        print("Nothing to transcribe.")
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    import faster_whisper

    for slug, entry in todo:
        meeting = json.loads((MEETINGS / f"{slug}.json").read_text(encoding="utf-8"))
        resolutions = [r for r in (meeting.get("resolutions") or meeting.get("docket") or []) if r.get("number")]
        with tempfile.TemporaryDirectory() as tmp:
            video = Path(local_video) if local_video else Path(tmp) / "meeting.mp4"
            if not local_video:
                print(f"{slug}: downloading {entry['video']}", flush=True)
                download(entry["video"], video)
            print(f"{slug}: transcribing with {model_name}", flush=True)
            segments, duration, elapsed = transcribe(video, initial_prompt(meeting), model_name)
        votes = vote_times(segments, resolutions)
        payload = {
            "date": slug,
            "eventId": entry.get("eventId"),
            "video": entry["video"],
            "engine": f"faster-whisper {faster_whisper.__version__}",
            "model": model_name,
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "durationSec": round(duration),
            "votes": votes,
            "segments": segments,
        }
        (OUT / f"{slug}.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"{slug}: {len(segments)} segments, {duration / 60:.0f} min in {elapsed / 60:.1f} min "
              f"({duration / max(elapsed, 1):.1f}x), {len(votes)} of {len(resolutions)} votes located", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
