"""Build the data behind /election-map/: Riverhead's 22 election districts and
how each voted, from the Suffolk County Board of Elections' own sources.

  boundaries  Suffolk County GIS, VotingPrecinct layer (the Board of Elections'
              precincts), the 22 whose PRECINCTID starts with 90, in WGS84.
  results     The Board of Elections' public results site
              (app.enhancedvoting.com), each contest broken down by election
              district. A candidate on more than one party line is counted
              once, with each line kept beside the total.

  history     Every Supervisor race since 2013, town-wide, from the County's
              final results pages (apps2.suffolkcountyny.gov/boe/eleres),
              which do not give each district's count.

The 2024 results by district come from riverhead-2024.json, which
import_2024_results.py writes once by hand, and the 2013 to 2017 Supervisor
races from riverhead-supervisor-past.json, which import_past_supervisor.py
writes once by hand.

Writes web/public/data/elections/riverhead-districts.json and
web/public/data/elections/riverhead-map.json. If either source cannot be
reached, the file it feeds stays as it was and the run prints a warning instead
of stopping the job. The results site labels a count unofficial until the
Board certifies it, and the JSON carries that label through.
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web/public/data/elections"
GEOJSON = OUT_DIR / "riverhead-districts.json"
RESULTS = OUT_DIR / "riverhead-map.json"
RESULTS_2024 = OUT_DIR / "riverhead-2024.json"
RESULTS_PAST = OUT_DIR / "riverhead-supervisor-past.json"

GIS_LAYER = "https://gis.suffolkcountyny.gov/server/rest/services/LocalGovernmentSQLData/VotingPrecinct/FeatureServer/0"
RESULTS_SITE = "https://app.enhancedvoting.com/results/public/suffolk-county-ny/elections"
RESULTS_API = "https://app.enhancedvoting.com/results/public/api/elections/suffolk-county-ny"
USER_AGENT = "RiverheadBudgetLive/1.0 (community research; https://rike4545.github.io/Riverhead-NY-Budget-Web-App/)"
RETRY_WAITS = (5, 15)

# The contests the map offers, by election, in the order the page lists them.
# Each is matched by its exact name on the results site.
ELECTIONS = [
    {
        "id": "GE2026_20261028145605",
        "label": "2026 General Election",
        "contests": [
            ("supervisor-2026", "Supervisor, Town of Riverhead"),
            ("governor-2026", "Governor and Lieutenant Governor"),
            ("congress-2026", "Representative in Congress, 1st Congressional District"),
            ("senate-2026", "State Senator, 1st Senatorial District"),
            ("assembly-2026", "Member of Assembly, 2nd Assembly District"),
        ],
    },
    {
        "id": "GE25",
        "label": "2025 General Election",
        "contests": [
            ("supervisor-2025", "Supervisor, Town of Riverhead"),
            ("council-2025", "Council member, Town of Riverhead"),
            ("highway-2025", "Superintendent of Highways, Town of Riverhead"),
            ("assessor-2025", "Assessor, Town of Riverhead"),
            ("legislator-2025", "County Legislator, 1st Legislative District"),
        ],
    },
]


class SourceUnavailable(RuntimeError):
    """A source could not be reached after every try."""


class NotPosted(SourceUnavailable):
    """The page does not exist (HTTP 404): not posted yet, or no such election."""


def http_get(url: str, label: str, accept: str = "application/json") -> bytes:
    last: Exception | None = None
    for attempt, wait in enumerate((0, *RETRY_WAITS), start=1):
        if wait:
            time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                raise NotPosted(f"{label}: {url} is not posted") from exc
            last = exc
            print(f"  {label}: try {attempt} failed: {str(exc)[:200]}", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001 - every failure is retried, then reported
            last = exc
            print(f"  {label}: try {attempt} failed: {str(exc)[:200]}", file=sys.stderr)
    raise SourceUnavailable(f"{label} could not be reached after {1 + len(RETRY_WAITS)} tries ({str(last)[:200]}).")


FINAL_RESULTS = "https://apps2.suffolkcountyny.gov/boe/eleres"
# The County's final results pages for each year a Supervisor was elected.
SUPERVISOR_YEARS = (2013, 2015, 2017, 2019, 2021, 2023, 2025)


def _cell(text: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", text)).split())


def parse_final_page(page: str) -> list[dict]:
    """A page of the County's final results (apps2.suffolkcountyny.gov/boe/eleres/<yy>ge/<office>.htm) as contests:
    [{title, registered, votesCast, candidates: [{name, lines: {party: votes}, votes}]}].
    A contest's heading can omit the office (2013), so titles come from the page's own contents list, in order."""
    toc = [_cell(t) for t in re.findall(r'<a href="#\d+">(.*?)</a>', page, re.S)]
    chunks = re.split(r"<h2>", page)[1:]
    contests = []
    for i, chunk in enumerate(chunks):
        heading = _cell(chunk.split("</h2>")[0])
        title = toc[i] if i < len(toc) else heading
        cast = re.search(r"([\d,]+) Votes cast out of ([\d,]+)", _cell(chunk))
        candidates: list[dict] = []
        for row in re.findall(r"<tr[^>]*>(.*?)</tr>", chunk, re.S):
            cells = re.findall(r"<td([^>]*)>(.*?)</td>", row, re.S)
            if len(cells) not in (3, 4):
                continue
            texts = [_cell(c[1]) for c in cells]
            # Four cells open a candidate (name, party, votes, share); three add a party line or the total.
            if len(cells) == 4:
                candidates.append({"name": texts[0], "lines": {}, "votes": 0})
                texts = texts[1:]
            if len(texts) < 2 or not candidates or not re.fullmatch(r"[\d,]+", texts[1]):
                continue
            party, votes = texts[0], int(texts[1].replace(",", ""))
            if party == "Total":
                candidates[-1]["votes"] = votes
            else:
                candidates[-1]["lines"][party] = votes
        for c in candidates:
            line_sum = sum(c["lines"].values())
            if not c["votes"]:
                c["votes"] = line_sum
            if c["votes"] != line_sum:
                raise SourceUnavailable(f"{title}: {c['name']}'s party lines add to {line_sum}, not {c['votes']}")
        contests.append({
            "title": title, "heading": heading,
            "votesCast": int(cast.group(1).replace(",", "")) if cast else None,
            "registered": int(cast.group(2).replace(",", "")) if cast else None,
            "candidates": candidates,
        })
    return contests


def fetch_supervisor_history() -> list[dict]:
    """Every Supervisor race since 2013, town-wide, from the County's final results pages."""
    out = []
    for year in SUPERVISOR_YEARS:
        url = f"{FINAL_RESULTS}/{str(year)[2:]}ge/rvroff.htm"
        contests = parse_final_page(http_get(url, "Suffolk County final results", accept="text/html,*/*").decode("utf-8", "ignore"))
        race = next((c for c in contests if c["title"].startswith("Supervisor, Town of Riverhead")), None)
        if not race or not race["candidates"]:
            raise SourceUnavailable(f"{year}: no Supervisor race on {url}")
        if race["votesCast"] != sum(c["votes"] for c in race["candidates"]):
            raise SourceUnavailable(f"{year}: Supervisor votes add to {sum(c['votes'] for c in race['candidates'])}, not {race['votesCast']}")
        out.append({"year": year, "url": url, "status": "final", "registered": race["registered"], "votesCast": race["votesCast"],
                    "candidates": sorted(race["candidates"], key=lambda c: -c["votes"])})
    return out


TURNOUT_FROM = 2013


def fetch_turnout_history(through: int) -> list[dict]:
    """Riverhead's turnout in each November election the County has a final Riverhead page for.

    Turnout is the votes cast in the Town-wide, one-seat race that drew the most votes, out of the Town's
    registered voters as the page gives them. Years with no Town race (2014, 2018, 2022) have no Riverhead
    page, and the current year's appears only once the Board certifies it."""
    out = []
    for year in range(TURNOUT_FROM, through + 1):
        url = f"{FINAL_RESULTS}/{str(year)[2:]}ge/rvroff.htm"
        try:
            contests = parse_final_page(http_get(url, "Suffolk County final results", accept="text/html,*/*").decode("utf-8", "ignore"))
        except NotPosted:
            continue
        town = [c for c in contests if c["registered"] and c["votesCast"]]
        if not town:
            continue
        registered = min(c["registered"] for c in town)
        top = max((c for c in town if c["registered"] == registered), key=lambda c: c["votesCast"])
        out.append({"year": year, "url": url, "race": re.sub(r" \(Elect \d+\)$", "", top["title"]), "votesCast": top["votesCast"], "registered": registered})
    return out


def district_code(text: str) -> str | None:
    """'Riverhead 007' (2026 results), 'Riverhead 7 ' (2025) or '9007' (GIS) to '007'; None for anything else."""
    m = re.fullmatch(r"Riverhead (\d{1,3})", text.strip())
    if m:
        return m.group(1).zfill(3)
    m = re.fullmatch(r"90(\d{2})", text.strip())
    return f"0{m.group(1)}" if m else None


def text_of(names: list[dict]) -> str:
    return next((n["text"] for n in names if n.get("languageId") == "en"), names[0]["text"] if names else "")


def candidate_name(option: dict) -> str:
    """The ballot line's name without its party prefix: 'DEM Jerome Halpin' to 'Jerome Halpin'."""
    if option.get("isWriteIn"):
        return "Write-in"
    name = text_of(option["name"]).strip()
    abbr = ((option.get("party") or {}).get("abbreviation") or "").strip()
    if abbr and name.upper().startswith(abbr.upper() + " "):
        name = name[len(abbr) + 1:]
    return " ".join(name.split())


def main_party(lines: list[str]) -> str:
    """DEM or REP when the candidate ran on exactly one of them, BOTH on both, else the first line."""
    dem, rep = "DEM" in lines, "REP" in lines
    if dem and rep:
        return "BOTH"
    if dem:
        return "DEM"
    if rep:
        return "REP"
    return lines[0] if lines else ""


def combine(options: list[dict]) -> dict[str, dict]:
    """Ballot lines to candidates: {name: {votes, lines: {abbr: votes}}}, in ballot order."""
    out: dict[str, dict] = {}
    for opt in options:
        name = candidate_name(opt)
        abbr = "W/I" if opt.get("isWriteIn") else ((opt.get("party") or {}).get("abbreviation") or "").strip()
        entry = out.setdefault(name, {"votes": 0, "lines": {}})
        entry["votes"] += int(opt.get("voteCount") or 0)
        entry["lines"][abbr] = entry["lines"].get(abbr, 0) + int(opt.get("voteCount") or 0)
    return out


def contest_record(key: str, item: dict) -> dict:
    """One contest: its candidates town-wide and each Riverhead district's votes."""
    districts: dict[str, dict] = {}
    for row in item["breakdownResults"]:
        code = district_code(text_of(row["precinct"]["name"]))
        if not code:
            continue
        combined = combine(row["ballotOptions"])
        districts[code] = {
            "mapFeatureId": row["precinct"].get("mapFeatureId"),
            "total": int(row.get("voteTotal") or 0),
            "reporting": row["precinct"].get("reportingStatus"),
            "votes": {name: c["votes"] for name, c in combined.items()},
        }
    # Candidates in ballot order, with town-wide totals summed from the districts.
    names: list[str] = []
    for opt in item["summaryResults"]["ballotOptions"]:
        n = candidate_name(opt)
        if n not in names:
            names.append(n)
    line_totals: dict[str, dict[str, int]] = {n: {} for n in names}
    for row in item["breakdownResults"]:
        if not district_code(text_of(row["precinct"]["name"])):
            continue
        for name, c in combine(row["ballotOptions"]).items():
            for abbr, v in c["lines"].items():
                line_totals.setdefault(name, {})[abbr] = line_totals.setdefault(name, {}).get(abbr, 0) + v
    candidates = []
    for n in names:
        lines = line_totals.get(n, {})
        votes = sum(d["votes"].get(n, 0) for d in districts.values())
        candidates.append({"name": n, "party": "" if n == "Write-in" else main_party([a for a in lines if a != "W/I"]), "lines": lines, "votes": votes})
    return {
        "key": key,
        "name": text_of(item["name"]),
        "voteFor": int(re.search(r"\d+", text_of(item.get("voteFor") or [{"text": "1"}])).group()) if item.get("voteFor") else 1,
        "candidates": candidates,
        "total": sum(d["total"] for d in districts.values()),
        "districts": dict(sorted(districts.items())),
    }


def fetch_boundaries() -> dict:
    params = {
        "where": "PRECINCTID LIKE '90%'",
        "outFields": "PRECINCTID,NAME,MUNICIPALITY,LASTUPDATE",
        "outSR": "4326",
        "geometryPrecision": "5",
        "f": "geojson",
    }
    data = json.loads(http_get(f"{GIS_LAYER}/query?{urllib.parse.urlencode(params)}", "Suffolk County GIS"))
    features = []
    for f in data.get("features", []):
        code = district_code(str(f["properties"]["PRECINCTID"]))
        if not code:
            continue
        updated = f["properties"].get("LASTUPDATE")
        features.append({
            "type": "Feature",
            "properties": {
                "ed": code,
                "name": f["properties"].get("NAME"),
                "area": f["properties"].get("MUNICIPALITY"),
                "updated": datetime.fromtimestamp(updated / 1000, timezone.utc).date().isoformat() if updated else None,
            },
            "geometry": f["geometry"],
        })
    features.sort(key=lambda f: f["properties"]["ed"])
    if len(features) != 22:
        raise SourceUnavailable(f"Suffolk County GIS returned {len(features)} Riverhead districts, not 22.")
    return {"type": "FeatureCollection", "source": f"{GIS_LAYER}", "features": features}


def fetch_election(spec: dict) -> dict:
    summary = json.loads(http_get(f"{RESULTS_API}/{spec['id']}/data", "Suffolk County results site"))
    election = summary["election"]
    by_name = {text_of(b["name"]): b["id"] for b in summary["ballotItems"]}
    contests = []
    for key, name in spec["contests"]:
        if name not in by_name:
            raise SourceUnavailable(f"{spec['label']}: no contest named {name!r} on the results site.")
        item = json.loads(http_get(f"{RESULTS_API}/{spec['id']}/data/ballot-item/{by_name[name]}", "Suffolk County results site"))
        record = contest_record(key, item["ballotItemWithBreakdown"])
        record["url"] = f"{RESULTS_SITE}/{spec['id']}/ballot-items/{by_name[name]}"
        if len(record["districts"]) != 22:
            raise SourceUnavailable(f"{name} ({spec['label']}) has {len(record['districts'])} Riverhead districts, not 22.")
        contests.append(record)
    return {
        "id": spec["id"],
        "label": spec["label"],
        "date": election.get("electionDate"),
        "official": bool(election.get("isOfficialResults")),
        "asOf": election.get("asOf"),
        "url": f"{RESULTS_SITE}/{spec['id']}",
        "contests": contests,
    }


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    try:
        geo = fetch_boundaries()
        GEOJSON.write_text(json.dumps(geo, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"  election map: {len(geo['features'])} district boundaries")
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The district boundaries were left as they were.", file=sys.stderr)

    previous = json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else None
    try:
        elections = [fetch_election(spec) for spec in ELECTIONS]
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The election map's results were left as they were.", file=sys.stderr)
        return 0
    # The 2024 results, imported once by import_2024_results.py: the County does not post them by district.
    if RESULTS_2024.exists():
        elections.append(json.loads(RESULTS_2024.read_text(encoding="utf-8")))
    # 2013 to 2017 Supervisor races, imported once by import_past_supervisor.py, newest first.
    if RESULTS_PAST.exists():
        elections.extend(sorted(json.loads(RESULTS_PAST.read_text(encoding="utf-8"))["elections"], key=lambda e: e["id"], reverse=True))
    try:
        history = fetch_supervisor_history()
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The Supervisor history was left as it was.", file=sys.stderr)
        history = (previous or {}).get("supervisorHistory", [])
    try:
        turnout = fetch_turnout_history(datetime.now(timezone.utc).year)
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The turnout history was left as it was.", file=sys.stderr)
        turnout = (previous or {}).get("turnoutHistory", [])

    out = {
        "source": {"title": "Suffolk County Board of Elections, public election results", "url": f"{RESULTS_SITE}"},
        "boundarySource": {"title": "Suffolk County GIS, Voting Precincts (Suffolk County Board of Elections)", "url": GIS_LAYER},
        "finalSource": {"title": "Suffolk County Board of Elections, final election results", "url": "https://suffolkcountyny.gov/Departments/BOE/Election-Results"},
        "elections": elections,
        "supervisorHistory": history,
        "turnoutHistory": turnout,
    }
    if previous and {k: v for k, v in previous.items() if k != "fetchedOn"} == out:
        print("  election map: results unchanged")
        return 0
    out["fetchedOn"] = datetime.now(timezone.utc).date().isoformat()
    RESULTS.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  election map: {sum(len(e['contests']) for e in elections)} contests in {len(elections)} elections")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
