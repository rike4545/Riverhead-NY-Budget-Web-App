#!/usr/bin/env python3
"""Build the multi-year management salary history from the authorized schedules.

The authorized-<year>.json files are ~100KB each and are fetched in the browser
on demand. A page that only needs the two dozen management rows should not pull
400KB to get them, so this reduces the four schedules to one small file that can
be imported at build time.

TWO THINGS THIS FILE IS CAREFUL ABOUT.

First, who counts as management. The General Fund schedule prints a grade/step
for positions on the union grid and leaves it blank for positions the Board sets
individually -- department heads, deputies, appointed staff. That blank is the
Town's own distinction, not a judgement made here, which is why it is used
instead of a salary threshold or a title keyword list. It is only meaningful
WITHIN the General Fund schedule: the Police, Elected Officials and Boards
schedules print ranks or stipends and carry no grade either, and sweeping those
in would put every police officer's contractual step progression in a table
about management pay.

Second, what a percentage change means. Comparing the same person under a
DIFFERENT title measures a promotion, not a raise. Those rows are held out of
the like-for-like figures and reported separately.

Input:  web/public/data/salary/authorized-{2022,2023,2024,2025}.json
Output: web/public/data/salary/management-history.json
"""

import json
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAL = ROOT / "web/public/data/salary"
YEARS = (2022, 2023, 2024, 2025)

# The January 2023 round, read from the Town Board minutes of January 4, 2023.
#
# Hand-curated because it is fourteen resolutions read individually, and the
# thing that matters about them -- whether the Board moved someone along a
# published grid or granted an amount off the schedule -- is stated in prose in
# the RESOLVED clause and nowhere else. The dollar values are NOT hand-written:
# they are computed below against the adopted schedule, so a reparse of the
# schedule moves them.
#
# "mechanism" is the Town's own instrument:
#   grid   -- moved to a named grade and step on a published salary schedule
#   pct    -- a percentage of salary, granted on top of the schedule
#   flat   -- a fixed dollar amount, granted on top of the schedule
#   hourly -- an hourly rate change (part-time staff; no annual figure stated)
JANUARY_2023 = [
    ("2023-9",  "Kinghan, John",     "Network and Systems Specialist II",        "grid",   74238.34, "unanimous", None),
    ("2023-10", "Sclafani, Carol",   "Legislative Secretary",                    "flat",    7500.00, "4-1",       "Yvette Aguiar"),
    ("2023-11", None,                "Part-Time Office Assistant",               "hourly",     15.00, "unanimous", None),
    ("2023-12", "Bonne, David",      "Senior Wastewater Treatment Plant Op II",  "grid",   59948.14, "unanimous", None),
    ("2023-13", None,                "Part-Time Housing Inspector",              "hourly",     32.64, "unanimous", None),
    ("2023-14", "Murphree, Jefferson", "Town Building & Planning Administrator", "pct",        3.00, "unanimous", None),
    ("2023-15", "Coyne, Raymond",    "Superintendent of Recreation",             "pct",        4.00, "unanimous", None),
    ("2023-16", "Toth, Emily",       "Accountant",                               "grid",   80968.45, "unanimous", None),
    ("2023-17", "Vankurin, Rachel",  "Account Clerk",                            "grid",   49546.15, "unanimous", None),
    ("2023-18", "Magee, Penelope",   "Mini-Bus Driver",                          "grid",   45054.31, "unanimous", None),
    ("2023-19", "Sawaya, Joanna",    "Cook",                                     "grid",   40427.90, "unanimous", None),
    ("2023-20", "Testa, Kenneth",    "Assistant Town Engineer",                  "pct",        5.00, "4-1",       "Frank Beyrodt Jr."),
    ("2023-21", "Dillingham, Drew",  "Town Engineer",                            "flat",    7500.00, "unanimous", None),
    ("2023-22", "Uguil, Jessa Bhel", "Tax Cashier",                           "grid",   41012.54, "unanimous", None),
]


def norm_title(t):
    return re.sub(r"\s+", " ", t or "").strip().lower()


def load():
    out = {}
    for y in YEARS:
        p = SAL / f"authorized-{y}.json"
        if not p.exists():
            raise SystemExit(f"missing {p}")
        out[y] = json.loads(p.read_text())
    return out


def general_fund(data, year):
    """Name -> record, for unambiguous General Fund rows in one year."""
    rows = {}
    for r in data[year]["records"]:
        if r["group"] != "General Fund" or r["isStipend"]:
            continue
        rows.setdefault(r["name"], []).append(r)
    # A name appearing twice in one schedule cannot be matched across years
    # without guessing which row is which, so it is dropped rather than picked.
    return {k: v[0] for k, v in rows.items() if len(v) == 1}


def build():
    data = load()
    gf = {y: general_fund(data, y) for y in YEARS}

    # ---- the management roster, year by year -------------------------------
    names = sorted({n for y in YEARS for n in gf[y] if not gf[y][n]["grade"]})
    positions = []
    for n in names:
        series = []
        for y in YEARS:
            r = gf[y].get(n)
            series.append(None if r is None else {"year": y, "title": r["title"], "annual": r["annual"]})
        seen = [s for s in series if s]
        # A row that is graded in one year and not in another is a move on or off
        # the grid, which is a different event from a raise; keep it out.
        if any(gf[y].get(n) and gf[y][n]["grade"] for y in YEARS):
            continue
        titles = {norm_title(s["title"]) for s in seen}
        first, last = seen[0], seen[-1]
        positions.append({
            "name": n,
            "title": last["title"],
            "series": series,
            "firstYear": first["year"],
            "lastYear": last["year"],
            "titleChanged": len(titles) > 1,
            # In the order the schedules print them, so a promotion reads
            # forwards. Sorting these alphabetically made Chief Accountant ->
            # Principal Accountant look like a demotion.
            "titles": list(dict.fromkeys(s["title"] for s in seen)) if len(titles) > 1 else None,
            "change": round(last["annual"] - first["annual"], 2),
            "pct": round((last["annual"] - first["annual"]) / first["annual"] * 100, 2) if first["annual"] else None,
        })
    positions.sort(key=lambda p: -(p["pct"] or 0))

    # ---- like-for-like: management vs the union grid ------------------------
    def spread(bucket):
        """Same person, same printed title, 2022 and 2025.

        Titles are compared as printed. No abbreviation-matching is attempted:
        an attempt merged nothing at all, because the drift that separates
        "Town Building/Planning Admin" from "Town Buildin g & Planning
        Adminstrat" is a truncation on top of a misspelling rather than a
        recognisable abbreviation, and a rule loose enough to join those two
        would also join titles that are genuinely different jobs.

        The cost of that strictness is reported rather than absorbed: every
        excluded pair is returned in "excluded", and "medianWithExcluded" says
        what the figure would be if all of them were counted as the same job.
        """
        pairs, excluded = [], []
        for n in set(gf[2022]) & set(gf[2025]):
            a, b = gf[2022][n], gf[2025][n]
            graded = bool(a["grade"]) and bool(b["grade"])
            ungraded = not a["grade"] and not b["grade"]
            if bucket == "graded" and not graded:
                continue
            if bucket == "management" and not ungraded:
                continue
            if a["annual"] < 5000:  # nominal stipend-like rows are not salaries
                continue
            row = {"name": n, "title": a["title"], "from": a["annual"], "to": b["annual"],
                   "pct": round((b["annual"] - a["annual"]) / a["annual"] * 100, 2)}
            if norm_title(a["title"]) != norm_title(b["title"]):
                excluded.append({**row, "titleTo": b["title"]})
            else:
                pairs.append(row)
        pairs.sort(key=lambda p: -p["pct"])
        excluded.sort(key=lambda p: -p["pct"])
        pcts = [p["pct"] for p in pairs]
        allp = pcts + [p["pct"] for p in excluded]
        return {
            "n": len(pairs),
            "median": round(statistics.median(pcts), 2) if pcts else None,
            "mean": round(statistics.mean(pcts), 2) if pcts else None,
            "min": min(pcts) if pcts else None,
            "max": max(pcts) if pcts else None,
            "rows": pairs,
            "excluded": excluded,
            "medianWithExcluded": round(statistics.median(allp), 2) if allp else None,
        }

    comparison = {"from": 2022, "to": 2025,
                  "management": spread("management"), "graded": spread("graded")}

    # ---- price the January 2023 round against the adopted schedule ---------
    sched23 = {}
    for r in data[2023]["records"]:
        if not r["isStipend"]:
            sched23.setdefault(r["name"], r)
    unmatched = [n for _, n, _, _, _, _, _ in JANUARY_2023
                 if n and n not in sched23]
    round23 = []
    for num, name, title, mech, value, vote, nay in JANUARY_2023:
        base = sched23.get(name, {}).get("annual") if name else None
        if mech == "pct":
            increase = round(base * value / 100, 2) if base else None
        elif mech == "flat":
            increase = value
        elif mech == "grid":
            increase = round(value - base, 2) if base else None
        else:
            increase = None
        round23.append({
            "resolution": num, "name": name, "title": title, "mechanism": mech,
            "value": value, "scheduleBase": base, "increase": increase,
            "newSalary": value if mech == "grid" else (round(base + increase, 2) if base and increase else None),
            "vote": vote, "nay": nay,
        })
    priced = [r for r in round23 if r["increase"] is not None]
    off = [r for r in round23 if r["mechanism"] in ("pct", "flat")]
    grid = [r for r in round23 if r["mechanism"] == "grid"]

    payload = {
        "years": list(YEARS),
        "source": {
            "title": "Town Board minutes, January organizational meetings 2022-2025",
            "detail": "Salary schedules adopted each January, plus the individual salary "
                      "resolutions adopted at the same meetings.",
            "url": "https://riverheadny.portal.civicclerk.com/",
        },
        "positions": positions,
        "comparison": comparison,
        "january2023": {
            "date": "2023-01-04",
            "count": len(round23),
            "offSchedule": {
                "count": len(off),
                "total": round(sum(r["increase"] for r in off if r["increase"] is not None), 2),
            },
            "grid": {
                "count": len(grid),
                "total": round(sum(r["increase"] for r in grid if r["increase"] is not None), 2),
            },
            "pricedCount": len(priced),
            "pricedTotal": round(sum(r["increase"] for r in priced), 2),
            "splitVotes": [r["resolution"] for r in round23 if r["vote"] != "unanimous"],
            # Named in a resolution but absent from the January schedule, so the
            # award cannot be priced. David Bonne was promoted on November 7,
            # 2022 and the resolution says that promotion "did not accurately
            # reflect the desired salary" -- the January schedule had not caught
            # up with him.
            "notInSchedule": unmatched,
            "resolutions": round23,
        },
    }
    (SAL / "management-history.json").write_text(json.dumps(payload, separators=(",", ":")))

    print(f"management positions tracked: {len(positions)}")
    c = comparison
    for k in ("management", "graded"):
        b = c[k]
        print(f"  {k:<11} n={b['n']:<4} median {b['median']}%  mean {b['mean']}%")
    j = payload["january2023"]
    print(f"January 2023: {j['count']} resolutions, "
          f"{j['offSchedule']['count']} off-schedule (${j['offSchedule']['total']:,.2f}), "
          f"{j['grid']['count']} grid (${j['grid']['total']:,.2f})")
    print(f"  priced {j['pricedCount']} of {j['count']} = ${j['pricedTotal']:,.2f}; "
          f"split votes: {', '.join(j['splitVotes']) or 'none'}")


if __name__ == "__main__":
    build()
