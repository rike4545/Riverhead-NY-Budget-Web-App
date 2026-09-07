#!/usr/bin/env python3
"""Build a compact, sharded unified search index.

The browser gets a small structured-data index first. Document-page records live
in a separate shard and are loaded only when the user asks for document results
or AI retrieval needs them. Each shard carries a content fingerprint so the
browser can safely cache unchanged shards between deployments.
"""

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web/public/data"
OUT = DATA / "search"
BASE = ""
CORE_TYPES = ("line-item", "payroll", "salary", "resolution", "fund")


def clean(s, limit=None):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s[:limit] if limit else s


def load(path):
    p = DATA / path
    return json.loads(p.read_text()) if p.exists() else None


def build():
    entries = {t: [] for t in (*CORE_TYPES, "page")}
    sub_index = load("subaccounts/index.json")
    if sub_index:
        for f in sub_index["funds"]:
            fund = load(f"subaccounts/{f['code']}.json")
            if not fund:
                continue
            for dept in fund["departments"]:
                for it in dept["lineItems"]:
                    entries["line-item"].append({"t":"line-item","n":clean(it["name"],90),"x":f"{it['account']} · {dept['name']} · {fund['name']}","v":it.get("adopted2026"),"u":f"{BASE}/funds/{fund['code']}/"})
    payroll = load("payroll/records.json")
    if payroll:
        latest = {}
        for r in payroll["records"]:
            k = r["n"].lower()
            if k not in latest or r["y"] > latest[k]["y"]:
                latest[k] = r
        for r in latest.values():
            bits = [b for b in (r.get("t"), r.get("d")) if b]
            entries["payroll"].append({"t":"payroll","n":clean(r["n"],60),"x":f"{' · '.join(bits) or r.get('u') or 'Town employee'} · {r['y']} gross pay","v":r["g"],"u":f"{BASE}/payroll/"})
    sal = load("salary/authorized-2026.json")
    if sal:
        for r in sal["records"]:
            entries["salary"].append({"t":"salary","n":clean(r["name"],60),"x":f"{r['title']} · {r['group']} · 2026 authorized salary","v":r["annual"],"u":f"{BASE}/payroll/"})
    meetings_index = load("meetings/index.json")
    if meetings_index:
        for m in meetings_index["meetings"]:
            meeting = load(f"meetings/{m['slug']}.json")
            if not meeting:
                continue
            for r in meeting["resolutions"]:
                number = r.get("number") or ""
                entries["resolution"].append({"t":"resolution","n":clean(r["title"],120),"x":f"{number} · {r['result']} · {meeting['date']}","u":f"{BASE}/meetings/?meeting={m['slug']}&q={number}"})
    if sub_index:
        for f in sub_index["funds"]:
            entries["fund"].append({"t":"fund","n":f"{f['code']} — {f['name']}","x":f"{f['departmentCount']} departments · {f['lineItemCount']} line items · 2026 appropriations","v":f["expenditureTotal2026"],"u":f"{BASE}/funds/{f['code']}/"})
    raw = load("financial-reports/search-index.json")
    if raw:
        records = raw["records"] if isinstance(raw, dict) else raw
        for r in records:
            snippet = clean(r.get("snippet") or r.get("text"), 180)
            if not snippet:
                continue
            entries["page"].append({"t":"page","n":f"{clean(r.get('document'),70)} — p. {r.get('page')}","x":snippet,"u":r.get("url") or ""})
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"version":2,"shards":{},"total":sum(len(v) for v in entries.values())}
    for t, rows in entries.items():
        path = OUT / f"{t}.json"
        payload = json.dumps({"type":t,"entries":rows},separators=(",",":"))
        path.write_text(payload)
        raw_bytes = payload.encode()
        manifest["shards"][t] = {"url":path.name,"count":len(rows),"bytes":len(raw_bytes),"sha256":hashlib.sha256(raw_bytes).hexdigest()[:16]}
        print(f"{path.name}: {len(rows):,} entries, {len(raw_bytes)/1e6:.2f} MB")
    (OUT / "manifest.json").write_text(json.dumps(manifest,separators=(",",":")))
    legacy = OUT / "unified.json"
    if legacy.exists():
        legacy.unlink()
    print(f"manifest.json: {manifest['total']:,} total entries")

if __name__ == "__main__":
    build()
