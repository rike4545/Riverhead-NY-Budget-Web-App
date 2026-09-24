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
from collections import Counter, defaultdict
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


# Document pages. Each record used to be searchable only by the first 180
# characters of its snippet, which for a budget book is the same running
# header on every page ("TOWN OF RIVERHEAD NEW YORK 2026 PRELIMINARY BUDGET
# EXPENDITURES Account Number..."). A search for "reserves" found none of the
# 12,500 pages. Two changes fix that:
#   - the snippet skips lines a document repeats on many of its pages, and
#     letter-spaced headings, so what is shown is what the page says;
#   - every page carries "k", the distinct words from its full text that are
#     neither common function words nor on nearly every page. It is matched
#     but never shown. Budget books repeat their vocabulary, so this costs
#     about 26 words a page.
WORD = re.compile(r"[a-z][a-z'’-]{2,29}")
STOPWORDS = set(
    "the and for with from that this are was were has have had not but its into per any all can may our their "
    "they them there these those which what when where who whom will would shall should been being also than "
    "then such other each more most some only own same very".split()
)
BOILERPLATE_SHARE = 0.3
SNIPPET_CHARS = 180


def page_lines(text):
    return [line.strip() for line in (text or "").splitlines() if line.strip()]


def line_key(line):
    # Page numbers and dates change on every page of a running header.
    return re.sub(r"\d+", "#", re.sub(r"\s+", " ", line.lower()))


def letter_spaced(line):
    parts = line.split()
    return len(parts) >= 5 and sum(len(p) == 1 for p in parts) / len(parts) > 0.7


def shorten(text, limit):
    text = clean(text)
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return f"{cut}…"


def page_records(records):
    """Document pages as (record, snippet, keywords), with boilerplate removed."""
    by_doc = defaultdict(list)
    for r in records:
        by_doc[r.get("slug") or r.get("document")].append(r)
    document_frequency = Counter()
    for r in records:
        document_frequency.update(set(WORD.findall((r.get("text") or "").lower())))
    common = {w for w, n in document_frequency.items() if n > BOILERPLATE_SHARE * len(records)}
    out = []
    for pages in by_doc.values():
        repeated = Counter()
        for r in pages:
            repeated.update({line_key(line) for line in page_lines(r.get("text"))})
        threshold = max(3, 0.3 * len(pages))
        for r in pages:
            kept = [line for line in page_lines(r.get("text")) if repeated[line_key(line)] < threshold and not letter_spaced(line)]
            snippet = shorten(" ".join(kept), SNIPPET_CHARS) or clean(r.get("snippet") or r.get("text"), SNIPPET_CHARS)
            shown = set(WORD.findall(snippet.lower()))
            words = set(WORD.findall((r.get("text") or "").lower())) - common - STOPWORDS - shown
            out.append((r, snippet, " ".join(sorted(words))))
    order = {id(r): i for i, r in enumerate(records)}
    out.sort(key=lambda item: order[id(item[0])])
    return out


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
            # Overtime was absent from this index entirely -- zero of 16,921
            # entries contained the word -- while the Town paid $1.4M of it in
            # 2025 and the site's own example question asks about police
            # overtime. It is actual paid money, it is the single largest
            # discretionary swing in the payroll, and a resident could not find
            # any of it. Carried in the context so the figure is searchable and
            # visible, not just the gross.
            overtime = r.get("o") or 0
            ot_text = f" · ${overtime:,.0f} overtime" if overtime > 0 else ""
            entries["payroll"].append({"t":"payroll","n":clean(r["n"],60),"x":f"{' · '.join(bits) or r.get('u') or 'Town employee'} · {r['y']} gross pay{ot_text}","v":r["g"],"u":f"{BASE}/payroll/"})

        # Department overtime totals, as records in their own right.
        #
        # Per-person overtime alone does not answer "how much does the Town
        # spend on police overtime", because nothing in this index ranks or
        # sums. These aggregates do, and they are the reason the site's own
        # suggested question previously returned 24 police budget lines and not
        # one overtime figure. Latest year only, so the number is current.
        latest_year = max((r["y"] for r in payroll["records"]), default=None)
        if latest_year is not None:
            dept_ot, dept_n = {}, {}
            for r in payroll["records"]:
                if r["y"] != latest_year or not (r.get("o") or 0) > 0:
                    continue
                dept = (r.get("d") or "").strip() or "Unassigned department"
                dept_ot[dept] = dept_ot.get(dept, 0.0) + r["o"]
                dept_n[dept] = dept_n.get(dept, 0) + 1
            town_ot = sum(dept_ot.values())
            for dept, total in sorted(dept_ot.items(), key=lambda kv: -kv[1]):
                share = f"{100 * total / town_ot:.1f}% of Town overtime" if town_ot else "share unavailable"
                entries["payroll"].append({
                    "t": "payroll",
                    "n": clean(f"Overtime — {dept} ({latest_year})", 90),
                    "x": f"{dept_n[dept]} employees paid overtime · {share} · {latest_year} actual paid overtime",
                    "v": round(total, 2),
                    "u": f"{BASE}/payroll/",
                })
            if town_ot:
                entries["payroll"].append({
                    "t": "payroll",
                    "n": f"Overtime — all departments ({latest_year})",
                    "x": f"{sum(dept_n.values())} employees across {len(dept_ot)} departments · {latest_year} actual paid overtime, Town-wide",
                    "v": round(town_ot, 2),
                    "u": f"{BASE}/payroll/",
                })
    sal = load("salary/authorized-2026.json")
    # The 2025 to 2026 comparison, so a search for "raises" or "promoted"
    # finds the people it is about. It found only auditors' boilerplate.
    comparison = {r["name"]: r for r in (load("salary/comparison-2025-2026.json") or {}).get("records", [])}
    if sal:
        for r in sal["records"]:
            change = ""
            c = comparison.get(r["name"])
            if c and c.get("comparable") and c.get("raise"):
                amount = c["raise"]
                change = f" · ${abs(amount):,.0f} {'raise' if amount > 0 else 'cut'} from 2025 ({c.get('raisePct', 0):+.1f}%)"
                if c.get("promoted") and c.get("title2025"):
                    change += f" · promoted from {c['title2025']}"
            entries["salary"].append({"t":"salary","n":clean(r["name"],60),"x":f"{r['title']} · {r['group']} · 2026 authorized salary{change}","v":r["annual"],"u":f"{BASE}/payroll/"})
    meetings_index = load("meetings/index.json")
    if meetings_index:
        for m in meetings_index["meetings"]:
            meeting = load(f"meetings/{m['slug']}.json")
            if not meeting:
                continue
            names = {p["last"]: p["last"] for p in meeting.get("roster") or [] if p.get("last")}
            for r in meeting["resolutions"]:
                number = r.get("number") or ""
                # Who dissented is the part of a vote a resident searches for
                # ("Kern voted no"), and on 25 resolutions it is the whole story.
                votes = r.get("votes") or {}
                noes = [names.get(k, k) for k, v in votes.items() if v == "nay"]
                abstained = [names.get(k, k) for k, v in votes.items() if v == "abstain"]
                dissent = "".join(
                    f" · {label}: {', '.join(people)}" for label, people in (("voted no", noes), ("abstained", abstained)) if people
                )
                entries["resolution"].append({"t":"resolution","n":clean(r["title"],120),"x":f"{number} · {r['result']} · {meeting['date']}{dissent}","u":f"{BASE}/meetings/?meeting={m['slug']}&q={number}"})
            # A meeting whose votes are not parsed yet still has its agenda.
            # Leaving it out hid every decision from the latest meetings.
            if not meeting["resolutions"]:
                for r in meeting.get("docket") or []:
                    number = r.get("number") or ""
                    entries["resolution"].append({"t":"resolution","n":clean(r["title"],120),"x":f"{number} · outcome not yet on this site · {meeting['date']}","u":f"{BASE}/meetings/?meeting={m['slug']}&q={number}"})
    if sub_index:
        for f in sub_index["funds"]:
            entries["fund"].append({"t":"fund","n":f"{f['code']} — {f['name']}","x":f"{f['departmentCount']} departments · {f['lineItemCount']} line items · 2026 appropriations","v":f["expenditureTotal2026"],"u":f"{BASE}/funds/{f['code']}/"})
    # Pages are stored compactly: each document's name and URL once in "docs",
    # and each page as {"d": document, "p": page, "x": snippet, "k": keywords}.
    # The browser expands them into ordinary entries. Repeating the URL and
    # name on all 12,500 pages cost more than the keywords that make them
    # findable.
    docs, doc_index = [], {}
    raw = load("financial-reports/search-index.json")
    if raw:
        records = raw["records"] if isinstance(raw, dict) else raw
        for r, snippet, words in page_records(records):
            if not snippet:
                continue
            key = (clean(r.get("document"), 70), r.get("url") or "")
            if key not in doc_index:
                doc_index[key] = len(docs)
                docs.append({"n": key[0], "u": key[1]})
            row = {"d": doc_index[key], "p": r.get("page"), "x": snippet}
            if words:
                row["k"] = words
            entries["page"].append(row)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"version":2,"shards":{},"total":sum(len(v) for v in entries.values())}
    for t, rows in entries.items():
        path = OUT / f"{t}.json"
        body = {"type":t,"docs":docs,"entries":rows} if t == "page" else {"type":t,"entries":rows}
        payload = json.dumps(body,separators=(",",":"))
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
