"""Multi-year view of every Budget Supplement line, 2020-2026.

Each supplement prints the same five columns shifted one year: the actual from
two years back, the prior year's adopted budget and mid-year YTD, and the
current year's request and tentative. Stacking seven of them gives an actual
for 2018-2024 and an adopted for 2019-2025 on the same account.

That span is what makes three things visible that a single supplement cannot
show:

  • cyclical lines — equipment and vehicles that are bought every few years and
    sit at zero in between, so a one-year comparison reads them as either a
    shocking overrun or a dead line depending on which year you catch;
  • lines budgeted well below what they cost in the years they actually happen;
  • account renumberings, where a line stops and an identically-named sibling
    starts. Without detecting these, the old account looks abandoned and the new
    one looks like spending with no budget. Both readings are wrong.

Input:  etl/data/supplements/*.pdf  (committed, ~2MB total)
Output: web/public/data/budget-supplement/history.json
"""

from __future__ import annotations

import collections
import json
import re
import statistics
import unicodedata
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "etl/data/supplements"
OUT = ROOT / "web/public/data/budget-supplement/history.json"

YEARS = list(range(2020, 2027))
DASH = dict.fromkeys(map(ord, "‐‑‒–—"), "-")
ACC = re.compile(r"^[A-Z]{1,3}\d{2}-\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{5}$")
# some years print a bare dash for a zero line instead of 0.00
NUM = re.compile(r"^(?:\(?-?[\d,]+(?:\.\d+)?\)?|-)$")

# excluded from every flag below: their variance is obligation or timing rather
# than discretion, and interfund transfers are bookkeeping, not spending.
SKIP = re.compile(
    r"transfer|escrow|fiscal agent|serial bond|bond anticipation|interfund|"
    r"retirement|pension|social security|fica|workers comp|unemployment|debt service",
    re.I,
)


def norm(s: str) -> str:
    return unicodedata.normalize("NFKC", s).translate(DASH).replace("\xa0", " ").strip()


def num(s: str):
    s = s.strip()
    if s == "-":
        return 0.0
    neg = s.startswith("(") and s.endswith(")")
    s = s.strip("()").replace(",", "")
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def columns_for(year: int) -> list[str]:
    base = [f"actual{year - 2}", f"adopted{year - 1}", f"ytd{year - 1}",
            f"request{year}", f"tentative{year}"]
    # 2020 alone also prints a Preliminary column
    return base + [f"prelim{year}"] if year == 2020 else base


def read_supplement(year: int, panel: dict) -> int:
    path = SRC / f"{year}.pdf"
    if not path.exists():
        return 0
    doc = fitz.open(path)
    lines = [norm(l) for p in doc for l in p.get_text().split("\n")]
    cols = columns_for(year)
    found = i = 0
    while i < len(lines):
        if not ACC.match(lines[i]):
            i += 1
            continue
        acct, j, desc = lines[i], i + 1, ""
        while j < len(lines) and j < i + 4:
            if lines[j] and not NUM.match(lines[j]):
                desc = lines[j]
                j += 1
                break
            j += 1
        vals = []
        while j < len(lines) and len(vals) < len(cols):
            t = lines[j]
            if NUM.match(t):
                vals.append(num(t))
            elif t:
                break
            j += 1
        if len(vals) == len(cols):
            rec = panel.setdefault(acct, {"account": acct, "name": desc})
            if desc and not rec.get("name"):
                rec["name"] = desc
            rec.update(dict(zip(cols, vals)))
            found += 1
        i = j
    return found


def actuals(rec: dict) -> dict[int, float]:
    return {y: rec[f"actual{y}"] for y in range(2018, 2025)
            if rec.get(f"actual{y}") is not None}


def find_renumbered(panel: dict) -> list[dict]:
    """A line stops and an identically-named sibling starts."""
    def stem(a):
        p = a.split("-")
        return "-".join(p[:4] + [p[5]])

    def key(n):
        return re.sub(r"\s+", " ", n or "").strip().lower()

    groups = collections.defaultdict(list)
    for acct, rec in panel.items():
        groups[stem(acct)].append((acct, rec))

    out, seen = [], set()
    for members in groups.values():
        if len(members) < 2:
            continue
        for a1, r1 in members:
            for a2, r2 in members:
                if a1 >= a2 or key(r1.get("name")) != key(r2.get("name")):
                    continue
                s1, s2 = actuals(r1), actuals(r2)
                live1 = [y for y, v in s1.items() if v]
                live2 = [y for y, v in s2.items() if v]
                if not live1 or not live2:
                    continue
                (old_a, old_s), (new_a, new_s) = ((a1, s1), (a2, s2)) \
                    if max(live1) < max(live2) else ((a2, s2), (a1, s1))
                old_live = [y for y, v in old_s.items() if v]
                new_live = [y for y, v in new_s.items() if v]
                # a real renumbering does not overlap: one ends, the other begins
                if max(old_live) >= min(new_live):
                    continue
                peak = max(list(old_s.values()) + list(new_s.values()))
                if peak < 20_000 or (old_a, new_a) in seen:
                    continue
                seen.add((old_a, new_a))
                out.append({
                    "name": panel[old_a].get("name", ""),
                    "oldAccount": old_a, "lastYear": max(old_live),
                    "newAccount": new_a, "firstYear": min(new_live),
                    "peak": round(peak, 2),
                })
    return sorted(out, key=lambda r: -r["peak"])


def find_cyclical(panel: dict, retired: set[str]) -> list[dict]:
    """Spends real money, goes quiet, and does it on a regular interval."""
    out = []
    for acct, rec in panel.items():
        name = rec.get("name", "")
        if acct in retired or SKIP.search(name):
            continue
        s = actuals(rec)
        if len(s) < 6:
            continue
        ys = sorted(s)
        vals = [s[y] for y in ys]
        if max(vals) < 25_000:
            continue
        med = statistics.median(vals)
        spikes = [y for y in ys if s[y] >= max(2 * med, med + 25_000)]
        if len(spikes) < 2:
            continue
        gaps = [b - a for a, b in zip(spikes, spikes[1:])]
        # consecutive years are a rising line, not a cycle; uneven gaps are noise
        if min(gaps) < 2 or (len(set(gaps)) > 1 and statistics.pstdev(gaps) > 0.5):
            continue
        off = [s[y] for y in ys if y not in spikes]
        spike_avg = statistics.mean([s[y] for y in spikes])
        if off and statistics.mean(off) > 0.5 * spike_avg:
            continue
        period = gaps[0]
        out.append({
            "account": acct, "name": name,
            "series": {str(y): round(s[y], 2) for y in ys},
            "spikeYears": spikes, "periodYears": period,
            "nextDue": spikes[-1] + period,
            "spikeAverage": round(spike_avg, 2),
            "adopted2025": rec.get("adopted2025") or 0,
            "tentative2026": rec.get("tentative2026") or 0,
        })
    return sorted(out, key=lambda r: -r["spikeAverage"])


def find_underbudgeted(panel: dict, retired: set[str]) -> list[dict]:
    """Goes quiet some years, costs real money when it happens, budgeted far below that."""
    out = []
    for acct, rec in panel.items():
        name = rec.get("name", "")
        if acct in retired or SKIP.search(name):
            continue
        s = actuals(rec)
        if len(s) < 6:
            continue
        vals = [s[y] for y in sorted(s)]
        if max(vals) < 50_000 or sum(1 for v in vals if v <= 0) < 2:
            continue
        active = [v for v in vals if v > 0]
        if not active:
            continue
        avg_active = statistics.mean(active)
        t26 = rec.get("tentative2026") or 0
        if t26 >= 0.5 * avg_active:
            continue
        out.append({
            "account": acct, "name": name,
            "series": {str(y): round(s[y], 2) for y in sorted(s)},
            "quietYears": sum(1 for v in vals if v <= 0),
            "averageWhenActive": round(avg_active, 2),
            "peak": round(max(vals), 2),
            "adopted2025": rec.get("adopted2025") or 0,
            "tentative2026": t26,
            "shortfall": round(avg_active - t26, 2),
        })
    return sorted(out, key=lambda r: -r["averageWhenActive"])


def main():
    panel: dict = {}
    parsed = {}
    for y in YEARS:
        parsed[y] = read_supplement(y, panel)
        print(f"  {y}: {parsed[y]} account lines")

    renumbered = find_renumbered(panel)
    retired = {r["oldAccount"] for r in renumbered}
    cyclical = find_cyclical(panel, retired)
    underbudgeted = find_underbudgeted(panel, retired)
    due = [c for c in cyclical if c["nextDue"] == 2027]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "supplementYears": YEARS,
        "actualYears": list(range(2018, 2025)),
        "accountsTracked": len(panel),
        "linesParsed": parsed,
        "cyclical": cyclical,
        "dueIn2027": due,
        "underBudgeted": underbudgeted,
        "renumbered": renumbered,
        "note": (
            "Built from the Town's own Budget Supplements, 2020 through 2026. Each prints an "
            "actual from two years back, so together they give an unbroken actual for 2018-2024 "
            "on the same account. Mandated costs, debt service and interfund transfers are "
            "excluded — their swings are obligation or timing, not discretion."
        ),
    }, indent=1) + "\n")

    print(f"\n{len(panel)} accounts tracked across {len(YEARS)} supplements")
    print(f"  cyclical lines      : {len(cyclical)}  ({len(due)} due in 2027)")
    print(f"  under-budgeted lumpy: {len(underbudgeted)}")
    print(f"  renumbered accounts : {len(renumbered)}")
    print(f"-> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
