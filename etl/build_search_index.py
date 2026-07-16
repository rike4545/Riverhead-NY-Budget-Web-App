#!/usr/bin/env python3
"""Build the compact unified search index for the site's client-side search.

Unlike the raw parser output (search-index.json, ~47MB with full page text),
this index is small enough to fetch in the browser and covers EVERY dataset on
the site, not just document pages:

  line-item   budget account lines (2026 adopted, all funds)
  payroll     employees' most recent actual pay
  salary      2026 Board-authorized salaries
  resolution  Town Board votes
  fund        operating funds
  page        document page snippets (trimmed)

Each entry: t=type, n=name/title, x=extra context, u=site-relative or external
URL, v=dollar value (optional). Output: web/public/data/search/unified.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web/public/data"
OUT = DATA / "search"

BASE = "/Riverhead-NY-Budget-Web-App"


def clean(s, limit=None):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s[:limit] if limit else s


def load(path):
    p = DATA / path
    return json.loads(p.read_text()) if p.exists() else None


def build():
    entries = []

    # Budget line items (all funds, 2026 adopted)
    sub_index = load("subaccounts/index.json")
    if sub_index:
        for f in sub_index["funds"]:
            fund = load(f"subaccounts/{f['code']}.json")
            if not fund:
                continue
            for dept in fund["departments"]:
                for it in dept["lineItems"]:
                    entries.append({
                        "t": "line-item",
                        "n": clean(it["name"], 90),
                        "x": f"{it['account']} · {dept['name']} · {fund['name']}",
                        "v": it.get("adopted2026"),
                        "u": f"{BASE}/funds/{fund['code']}/",
                    })

    # Payroll — one entry per employee, most recent year
    payroll = load("payroll/records.json")
    if payroll:
        latest = {}
        for r in payroll["records"]:
            k = r["n"].lower()
            if k not in latest or r["y"] > latest[k]["y"]:
                latest[k] = r
        for r in latest.values():
            bits = [b for b in (r.get("t"), r.get("d")) if b]
            entries.append({
                "t": "payroll",
                "n": clean(r["n"], 60),
                "x": f"{' · '.join(bits) or r.get('u') or 'Town employee'} · {r['y']} gross pay",
                "v": r["g"],
                "u": f"{BASE}/payroll/",
            })

    # 2026 authorized salaries
    sal = load("salary/authorized-2026.json")
    if sal:
        for r in sal["records"]:
            entries.append({
                "t": "salary",
                "n": clean(r["name"], 60),
                "x": f"{r['title']} · {r['group']} · 2026 authorized salary",
                "v": r["annual"],
                "u": f"{BASE}/payroll/",
            })

    # Town Board resolutions
    meetings_index = load("meetings/index.json")
    if meetings_index:
        for m in meetings_index["meetings"]:
            meeting = load(f"meetings/{m['slug']}.json")
            if not meeting:
                continue
            for r in meeting["resolutions"]:
                entries.append({
                    "t": "resolution",
                    "n": clean(r["title"], 120),
                    "x": f"{r['number'] or ''} · {r['result']} · {meeting['date']}",
                    "u": f"{BASE}/meetings/",
                })

    # Operating funds
    if sub_index:
        for f in sub_index["funds"]:
            entries.append({
                "t": "fund",
                "n": f"{f['code']} — {f['name']}",
                "x": f"{f['departmentCount']} departments · {f['lineItemCount']} line items · 2026 appropriations",
                "v": f["expenditureTotal2026"],
                "u": f"{BASE}/funds/{f['code']}/",
            })

    # Document page snippets (trimmed hard — the raw index carries full text)
    raw = load("financial-reports/search-index.json")
    if raw:
        records = raw["records"] if isinstance(raw, dict) else raw
        for r in records:
            snippet = clean(r.get("snippet") or r.get("text"), 180)
            if not snippet:
                continue
            entries.append({
                "t": "page",
                "n": f"{clean(r.get('document'), 70)} — p. {r.get('page')}",
                "x": snippet,
                "u": r.get("url") or "",
            })

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "note": "Compact unified search index across budget line items, payroll, salaries, "
                "Town Board votes, funds, and document pages.",
        "counts": {},
        "entries": entries,
    }
    for e in entries:
        payload["counts"][e["t"]] = payload["counts"].get(e["t"], 0) + 1
    out_path = OUT / "unified.json"
    out_path.write_text(json.dumps(payload, separators=(",", ":")))

    size_mb = out_path.stat().st_size / 1e6
    print(f"unified.json: {len(entries):,} entries, {size_mb:.1f} MB")
    for t, c in sorted(payload["counts"].items()):
        print(f"  {t:<12} {c:>6,}")


if __name__ == "__main__":
    build()
