#!/usr/bin/env python3
"""Parse the Town's own "Fiscal Impact Statement" for every resolution in each
Town Board agenda packet, and emit a per-meeting corrected read.

Riverhead attaches a standardized Fiscal Impact Statement form to every
resolution in the agenda packet (a large PDF on CivicClerk, separate from the
minutes). The form's key line — "D. Will the Proposed Legislation have a Fiscal
Impact: Yes/No" — is frequently "No" or "absorbed" even on items that plainly
commit money. This script transcribes the Town's own answer for each resolution
and pairs it with a plain-English "realistic" read keyed on the resolution's
category.

Amounts: the per-resolution dollar figures live in interleaved backup tables
that do not reliably tie to a single resolution in the extracted text, so this
script leaves `amount` null rather than guess (matching the documented method of
the hand-curated 2026-07-07 file). The Town's Yes/No/treatment answers, by
contrast, parse deterministically and are transcribed as-published.

Output: web/public/data/meetings/<date>-fiscal.json per meeting, plus a
fiscal-index.json listing the meetings that have a corrected read.

Idempotent and non-destructive: a date that already has a hand-curated fiscal
file (currently 2026-07-07) is left untouched unless --force is passed.
"""
from __future__ import annotations

import io
import json
import re
import ssl
import subprocess
import sys
import urllib.parse
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"
API = "https://riverheadny.api.civicclerk.com/v1"
SINCE = "2026-01-01T00:00:00Z"
# Hand-curated files with human-transcribed dollar amounts — never overwritten.
PROTECTED = {"2026-07-07"}

MONEY = re.compile(r"\$[\d,]+(?:\.\d{2})?")


def http_get(url: str) -> bytes:
    try:
        import requests
        r = requests.get(url, timeout=90)
        r.raise_for_status()
        return r.content
    except Exception as exc:
        if not isinstance(exc, (ssl.SSLError, OSError)) and "SSL" not in str(exc):
            raise
        return subprocess.run(["curl", "-sf", url], capture_output=True, check=True).stdout


def list_events() -> list[dict]:
    from datetime import datetime, timedelta, timezone
    until = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(
        f"categoryName eq 'Town Board' and startDateTime ge {SINCE} and startDateTime lt {until}"
    )
    url = f"{API}/Events?$filter={filt}&$orderby=startDateTime"
    events: list[dict] = []
    for _ in range(50):
        data = json.loads(http_get(url))
        events.extend(data["value"])
        url = data.get("@odata.nextLink")
        if not url:
            break
    return events


# ── Classification ────────────────────────────────────────────────────────
# Keyword rules → category. Order matters (first match wins).
CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("debt", ["bond anticipation", "serial bond", "refunding bond", "bond resolution", " ban ", "bonds"]),
    ("capital", ["capital project", "budget adjustment", "budget transfer", "transfer of funds", "capital"]),
    ("grant", ["grant"]),
    ("donation", ["donation", "donate", "gift of", "accept the gift"]),
    ("labor-contract", ["collective bargaining", "cba", "union", "pba", "csea", "soa", "memorandum of agreement"]),
    ("personnel-out", ["retirement", "resignation", "separation", "terminate", "termination"]),
    ("personnel", ["appoint", "hire", "salary", "salaries", "promote", "promotion", "provisional", "permanent appointment", "part-time", "full-time", "stipend"]),
    ("appointment-volunteer", ["board", "committee", "task force", "council on", "commission"]),
    ("fees", ["fee schedule", "set fees", "fees", "rate", "charge"]),
    ("permit", ["permit", "license", "special event", "road closure", "block party", "mass gathering"]),
    ("contract", ["contract", "agreement", "professional services", "award bid", "bid award", "renew", "extension"]),
    ("escrow-neutral", ["escrow", "performance bond", "letter of credit", "release of"]),
    ("legislative", ["local law", "introductory", "public hearing", "amend chapter", "zoning"]),
    ("warrant", ["warrant", "abstract", "audit of claims", "pay bills"]),
]

# category → (fiscalImpact-aware) realistic verdict. Some categories flip on Yes/No.
def realistic_read(category: str, fiscal_impact: str) -> dict:
    yes = fiscal_impact == "Yes"
    if category in ("capital", "debt"):
        if yes:
            return {
                "verdict": "Understated — 'absorbed by existing budget'",
                "reason": "It commits capital or debt-service dollars, typically drawn from reserves, fund balance, or borrowing — not truly cost-free even if 'absorbed'.",
                "flag": "reserve-draw",
            }
        return {
            "verdict": "Understated — the form says 'no fiscal impact'",
            "reason": "A capital or debt item marked 'no fiscal impact' still moves money the Town must fund.",
            "flag": "understated",
        }
    if category in ("grant", "donation", "escrow-neutral"):
        return {
            "verdict": "Revenue in / offsetting",
            "reason": "Money flows, but from a grant, donation, or a developer's own escrow — not the tax levy.",
            "flag": "neutral",
        }
    if category == "personnel-out":
        return {
            "verdict": "Actually a saving",
            "reason": "A departure reduces payroll — the opposite of a cost.",
            "flag": "saving",
        }
    if category in ("personnel", "labor-contract", "fees", "contract"):
        if yes:
            return {
                "verdict": "Real, recurring cost",
                "reason": "A salary, raise, contract, or fee change that commits ongoing money.",
                "flag": "reserve-draw",
            }
        return {
            "verdict": "Understated — the form says 'no fiscal impact'",
            "reason": "A salary, contract, or fee item marked 'no fiscal impact' typically still moves money.",
            "flag": "understated",
        }
    if category == "appointment-volunteer":
        return {
            "verdict": "No direct cost",
            "reason": "Appointment to an unpaid advisory board, committee, or task force — no salary attached.",
            "flag": "fair",
        }
    # procedural, permit, legislative, warrant, admin, other
    return {
        "verdict": "No direct cost" if not yes else "Administrative / offsetting",
        "reason": "A procedural, permit, or administrative action with no direct levy cost identified.",
        "flag": "fair",
    }


def classify(title: str, purpose: str) -> str:
    hay = f" {title} {purpose} ".lower()
    for category, kws in CATEGORY_RULES:
        if any(kw in hay for kw in kws):
            return category
    return "procedural"


# ── Packet parsing ──────────────────────────────────────────────────────────
def parse_packet(text: str) -> list[dict]:
    blocks = re.split(r"FISCAL IMPACT STATEMENT", text)[1:]
    out = []
    for b in blocks:
        d = re.search(r"Will the Proposed Legislation have a Fiscal Impact:\s*(Yes|No)", b)
        if not d:
            continue
        tm = re.search(r"Title of Proposed Legislation:\s*(.+)", b)
        pm = re.search(r"Purpose of Proposed Legislation:\s*(.+)", b)
        title = (tm.group(1).strip() if tm else "").strip()
        purpose = (pm.group(1).strip() if pm else "").strip()
        if not title:
            continue
        fiscal_impact = d.group(1)
        # Treatment: (a) absorbed if initials follow the (a) line; else described.
        absorbed = bool(re.search(r"\(a\)\s*\nDetail/Initials:\s*[A-Za-z]", b))
        treatment = "absorbed" if absorbed else "described"
        out.append({
            "title": title,
            "purpose": purpose,
            "fiscalImpact": fiscal_impact,
            "treatment": treatment,
        })
    return out


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def match_resolution(title: str, meeting_resolutions: list[dict]) -> dict | None:
    nt = norm(title)
    for r in meeting_resolutions:
        if norm(r.get("title", "")) == nt:
            return r
    # loose contains match as a fallback
    for r in meeting_resolutions:
        rn = norm(r.get("title", ""))
        if rn and (rn in nt or nt in rn):
            return r
    return None


def build_meeting(date: str, packet_text: str) -> dict | None:
    meeting_path = MEETINGS / f"{date}.json"
    meeting = json.loads(meeting_path.read_text()) if meeting_path.exists() else {"resolutions": []}
    meeting_res = meeting.get("resolutions", [])

    parsed = parse_packet(packet_text)
    if not parsed:
        return None

    resolutions = []
    for seq, p in enumerate(parsed, start=1):
        matched = match_resolution(p["title"], meeting_res)
        category = classify(p["title"], p["purpose"])
        realistic = realistic_read(category, p["fiscalImpact"])
        vote = None
        if matched:
            vote = {
                "adopted": matched.get("adopted"),
                "tag": matched.get("tag"),
                "ayes": matched.get("ayesCount"),
                "nays": matched.get("naysCount"),
            }
        resolutions.append({
            "number": matched.get("number") if matched else None,
            "seq": seq,
            "title": p["title"],
            "category": category,
            "townFiscalImpact": p["fiscalImpact"],
            "townTreatment": p["treatment"],
            "amount": None,  # not auto-extracted; see module docstring
            "realistic": realistic,
            "vote": vote,
        })

    marked_no = sum(1 for r in resolutions if r["townFiscalImpact"] == "No")
    marked_yes = sum(1 for r in resolutions if r["townFiscalImpact"] == "Yes")
    understated = sum(1 for r in resolutions if r["realistic"]["flag"] in ("understated", "reserve-draw"))
    understated_marked_no = sum(
        1 for r in resolutions if r["townFiscalImpact"] == "No" and r["realistic"]["flag"] == "understated"
    )
    return {
        "slug": date,
        "meetingDate": date,
        "source": {
            "title": f"Town of Riverhead Town Board Agenda Packet, {date} (Fiscal Impact Statements)",
            "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes",
        },
        "method": (
            "Each resolution's Town 'Fiscal Impact Statement' answer (Yes/No and absorbed vs. detailed) is "
            "transcribed as-published from the agenda packet, alongside a plain-English realistic read keyed on "
            "the resolution's category. Dollar amounts are not auto-extracted from this packet — they live in "
            "interleaved backup tables that don't reliably tie to a single resolution — so they are left blank "
            "rather than guessed."
        ),
        "summary": {
            "total": len(resolutions),
            "markedNo": marked_no,
            "markedYes": marked_yes,
            "understated": understated,
            "understatedMarkedNo": understated_marked_no,
            "identifiedDollarsAtStake": 0,
            "largestUnderstatedMarkedNo": None,
        },
        "resolutions": resolutions,
    }


def agenda_packet_file_id(event: dict) -> int | None:
    for f in (event.get("publishedFiles") or []):
        if f.get("type") == "Agenda Packet":
            return f.get("fileId")
    return None


def main() -> int:
    force = "--force" in sys.argv
    events = list_events()
    print(f"Town Board events since {SINCE[:10]}: {len(events)}")
    generated: list[str] = []

    for e in events:
        date = e["startDateTime"][:10]
        if date in PROTECTED and not force:
            print(f"  {date}: protected hand-curated file — skipped")
            if (MEETINGS / f"{date}-fiscal.json").exists():
                generated.append(date)
            continue
        fid = agenda_packet_file_id(e)
        if not fid:
            continue
        try:
            pdf = http_get(f"{API}/Meetings/GetMeetingFileStream(fileId={fid},plainText=false)")
            reader = pypdf.PdfReader(io.BytesIO(pdf))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception as exc:
            print(f"  {date}: packet fetch/parse failed ({exc}) — skipped")
            continue
        meeting = build_meeting(date, text)
        if not meeting:
            print(f"  {date}: no fiscal-impact statements found — skipped")
            continue
        (MEETINGS / f"{date}-fiscal.json").write_text(json.dumps(meeting, indent=1), encoding="utf-8")
        generated.append(date)
        s = meeting["summary"]
        print(f"  {date}: {s['total']} resolutions, {s['markedNo']} marked no, {s['understatedMarkedNo']} understated-marked-no")

    index = {"meetings": sorted(set(generated), reverse=True)}
    (MEETINGS / "fiscal-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8")
    print(f"Done: {len(index['meetings'])} meetings with a corrected fiscal read.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
