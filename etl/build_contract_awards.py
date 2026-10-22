#!/usr/bin/env python3
"""Who the Town Board agreed to pay in 2026: bid awards, bid extensions,
purchases, change orders and service agreements, read from each meeting's
agenda packet on CivicClerk.

Each entry is one resolution. The vendor is the one the resolution itself
names: in its title ("Agreement with Smalley Engineering, P.C."), in a
RESOLVED clause ("awarded to ..."), or in the address block a bid award lists
below "the vendor indicated below". The amount is a figure a clause states,
quoted with it; most bid awards point to "prices on the attached pages", and
those amounts stay blank, with the reason, rather than being read from the
attachment. Contact lines (e-mail addresses and phone numbers) are dropped.

Kept out: notices to bidders and requests for proposals (no one is chosen
yet), rejected bids, licenses and leases of Town property, intermunicipal and
grant agreements, labor agreements, and agreements setting a Town employee's
terms of employment.

Output: web/public/data/meetings/contract-awards.json.

    python3 etl/build_contract_awards.py                    # downloads every packet
    python3 etl/build_contract_awards.py --packet-dir DIR   # preview from DIR/<date>.txt

Data built from --packet-dir is for previews only; commit only a fresh run.
"""
from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

import build_personnel_actions as pa
import parse_fiscal_impact as pf
from pdf_limits import raise_town_document_limits

raise_town_document_limits()

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"
OUT = MEETINGS / "contract-awards.json"

# (kind, title pattern). First match wins.
KINDS = [
    ("bid-award", re.compile(r"\baward(?:s|ing)?\b.{0,30}\b(?:re-?bid|bid|contract|proposals?|rfp)\b|\bawards? of (?:bid|contract)\b", re.I)),
    ("bid-extension", re.compile(r"\bextends? bids?\b", re.I)),
    ("change-order", re.compile(r"\bchange order\b", re.I)),
    ("purchase", re.compile(r"\b(?:authorizes|approves) (?:the )?purchase\b|\bpurchase (?:of|and upfit)\b", re.I)),
    ("services", re.compile(r"professional services?|consultant|retainer|retain special counsel|\baccepts .{0,60}\bproposal\b", re.I)),
    ("agreement", re.compile(r"\b(?:agreement|contract|addendum)\b", re.I)),
]

KIND_LABEL = {
    "bid-award": "Bid or proposal award",
    "bid-extension": "Bid extended",
    "change-order": "Change order",
    "purchase": "Purchase",
    "services": "Professional services",
    "agreement": "Agreement",
}

EXCLUDE_TITLE = re.compile(
    r"notice to bidders|publish and post|request for proposals? for|issuance of a request|\brejects?\b"
    r"|license|lease|intermunicipal|memorandum|accept funds|grant|polling place|runway use"
    r"|town employee|\bCSEA\b|\bPBA\b|\bAFSCME\b|application|\bapply\b|letter of intent|donation|budget adjustment"
    # Agreements with other governments, which as often bring money in as send it out.
    r"|county of suffolk|suffolk county|new york state|\bNYS\b|state of new york|U\.?S\.? department|town of brookhaven"
    r"|school district|board of elections|office for the aging|long island power authority|\bLIPA\b",
    re.I,
)
MOU = re.compile(r"RESOLVED[^;]{0,120}Memorandum of Understanding", re.I)
# A license of Town property, whoever it is with, brings money in.
LICENSE = re.compile(r"RESOLVED[^;]{0,200}\b(?:License|Lease) Agreement\b|shall (?:pay|reimburse) the Town|reimburse the Town for"
                     r"|utiliz\w+ of Town of Riverhead personnel", re.I)
EMPLOYMENT = re.compile(r"conditions of employment|employment of\b", re.I)
SKIP_CATEGORIES = {"labor-contract", "personnel", "personnel-out", "grant", "donation", "permit"}

CONTACT = re.compile(r"\S+@\S+|\(?\b\d{3}\)?[\s.-]\d{3}[.-]\d{4}\b")
ADDRESS = re.compile(r"^\d+[A-Za-z]?\s|^(?:P\.?\s?O\.?\s+)?Box\b|^Suite\b|\bFloor\b", re.I)
CODES = re.compile(r"^(?:[A-Za-z]{0,4}\s?\d+[A-Za-z]?[,\s]*)+$")
CITY = re.compile(r",\s*(?:NY|New York|NJ|CT|PA|MA)\.?(?:\s+\d{5}(?:-\d{4})?)?\s*$|\s(?:NY|NJ|CT|PA|MA)\.?\s+\d{5}(?:-\d{4})?\s*$", re.I)
PAGE = re.compile(r"^Page \d+ of \d+$")
BLOCK_START = re.compile(r"(?:indicated|listed|named)\s+below|vendors?\s+below|compan(?:y|ies)\s+below", re.I)
BLOCK_END = re.compile(r"BE IT FURTHER|^\s*RESOLVED|with a copy|THE VOTE|FISCAL IMPACT", re.I)
# What a block prints before a vendor's name: its rank, its contract, or its items.
RANK = re.compile(r"^(PRIMARY|SECONDARY|TERTIARY|TERCIARY)\s*:\s*", re.I)
CONTRACT_LINE = re.compile(r"^CONTRACT\s+[A-Z]\b\s*[–-].*$", re.I)
ITEMS = re.compile(r"^((?:Items?|Awards?)\s*#?[^:]*?)\s+to:?\s+", re.I)
# A line of its own naming what the next vendor won: "Award #53, 54, ... 65:".
ITEMS_LINE = re.compile(r"^(?:Items?|Awards?)\b[^@]*$", re.I)
SUFFIX = re.compile(r"\b(?:Inc|LLC|L\.L\.C|PLLC|P\.C|LLP|LP|Ltd|Corp|Co|D\.P\.C|DPC|Company|Corporation)\b\.?", re.I)

# The counterparty a title or clause names: "Agreement with X for ...",
# "Award of Contract to X", "retain the law firm X to ...". The name runs to
# the first word that starts the agreement's purpose.
COUNTERPARTY = re.compile(
    r"(?:\b(?:agreements?|addendum|contract|amendment|extension|retainer)\b[^.;]{0,60}?\bwith|\baward of contract to|"
    r"\bretain (?:the )?(?:law )?firm(?: of)?)\s+(?:the\s+)?(?P<name>[A-Z0-9].*?)"
    r"(?=\s+(?:for|to|in connection|on behalf|subject|regarding|related|nunc pro tunc|in substantially|in a form|"
    r"as|at|from|which|who|and authorizes)\b|\s*\((?!Galante)|\s*,\s*(?:nunc|for|to|in)\b|\s*[;]|\s*$)",
    re.I,
)
# The Town's consultant form: "WHEREAS, David Lessard, Contractor, is willing to provide".
WILLING = re.compile(r"WHEREAS,\s+(?P<name>[A-Z][^,;]{2,60}?),\s*(?:Contractor|Consultant),?\s+(?:is|are) willing to provide")
PROPOSAL = re.compile(r"\baccepts\s+(?P<name>.+?)\s+proposal\b", re.I)

AMOUNT = re.compile(
    r"(?P<lead>not to exceed(?: the (?:sum|amount) of)?|in the (?:total )?amount of|at a (?:total )?cost of|"
    r"for a (?:total )?(?:fee|price|sum|cost) of|total (?:bid |contract )?(?:price|amount|cost) of|for the sum of|"
    r"in an amount not to exceed|a fee of|increase of|decrease of)\s*(?P<amount>\$[\d,]+(?:\.\d{2})?)",
    re.I,
)
RECITAL = re.compile(r"Resolution\s*#|adopted (?:on )?[A-Z][a-z]+ \d|authorized the issuance|serial bonds?|\b(?:19[5-9]\d|200\d|201\d)\b")
NO_COST = re.compile(r"at no (?:additional )?cost to the Town|no cost/no time|\(no cost\)|a no cost", re.I)
ATTACHED_PRICES = re.compile(r"pric\w* (?:on|in) the attached|pricing attached|attached (?:pages|pricing|price)", re.I)


def flat(text: str) -> str:
    return re.sub(r"\s+([,;.])", r"\1", re.sub(r"\s+", " ", text)).strip()


def kind_of(title: str) -> str | None:
    if EXCLUDE_TITLE.search(title):
        return None
    for kind, pat in KINDS:
        if pat.search(title):
            return kind
    return None


STREET = re.compile(r"\s+\d+[-\w]*\s+(?:[A-Z][a-z]+\s+){1,3}(?:Ave|Avenue|Road|Rd|St|Street|Dr|Drive|Blvd|Lane|Ln|Hwy|Highway|Pkwy|Place|Pl|Court|Ct|Way|Turnpike|Tpke)\b.*$", re.I)
UPPER_KEEP = {"LLC", "PLLC", "LLP", "LP", "DPC", "PC", "NAPA", "USA", "AA", "II", "III", "HVAC", "H2M", "D&B", "J&J"}
UPPER_FIX = {"INC": "Inc", "CORP": "Corp", "LTD": "Ltd", "CO": "Co", "AND": "and", "OF": "of", "THE": "the"}


def clean_name(name: str) -> str:
    name = CONTACT.sub("", name)
    name = STREET.split(name)[0]
    name = re.sub(r"\s+([.,])", r"\1", re.sub(r"\s+", " ", name)).strip(" ,;:–-")
    # Address blocks are printed in capitals. Keep the packet's spelling but set
    # an all-capitals name in ordinary case so it reads like the rest of the page.
    lettered = [re.sub(r"[^A-Za-z]", "", w) for w in name.split()]
    lettered = [w for w in lettered if len(w) > 1]
    if lettered and sum(w.isupper() for w in lettered) * 4 >= len(lettered) * 3:
        words = []
        for i, w in enumerate(name.split()):
            core, tail = re.match(r"^(.*?)([.,]*)$", w).groups()
            if core.upper() in UPPER_KEEP or re.fullmatch(r"[A-Z](?:\.[A-Z])*\.?|[A-Z]&[A-Z]|[B-DF-HJ-NP-TV-XZ]{2}", core):
                words.append(core + tail)
            elif core.upper() in UPPER_FIX:
                fixed = UPPER_FIX[core.upper()]
                words.append((fixed.capitalize() if i == 0 else fixed) + tail)
            else:
                words.append(re.sub(r"[A-Za-z]+", lambda m: m.group(0).capitalize(), core) + tail)
        name = " ".join(words)
    return name


def short_label(label: str) -> str:
    """A long list of item numbers, which the packet's text often garbles, named
    rather than copied: the packet has the list."""
    head = label.split()[0].rstrip("#").capitalize()
    return f"{head} as listed in the packet" if len(label) > 40 else label


def vendor_block(body: str) -> list[dict]:
    """The vendors a bid award or extension lists in its address block."""
    m = BLOCK_START.search(body)
    if not m:
        return []
    out: list[dict] = []
    label = None
    name: list[str] = []
    rest = body[m.end():]
    # The sentence that introduces the block can run onto the next line
    # ("... for prices on the / attached pages;").
    rest = rest[rest.find("\n") + 1:] if not re.match(r"[^\n]*[;:]\s*\n", rest) else rest[re.match(r"[^\n]*[;:]\s*\n", rest).end():]
    lines = [l.strip() for l in rest.splitlines()]
    if lines and re.match(r"^(?:for )?(?:prices|items|attached|the attached)\b[^;:]*[;:]\s*$", lines[0], re.I):
        lines = lines[1:]
    for line in lines:
        if not line or PAGE.match(line):
            continue
        if re.search(r"attached pages?\s*;", line, re.I):
            line = line.split(";", 1)[1].strip()
            if not line:
                continue
        if BLOCK_END.search(line):
            break
        if re.fullmatch(r"\S+@\S+", line) or CONTACT.fullmatch(line):
            continue
        if CONTRACT_LINE.match(line) and not SUFFIX.search(line):
            label = re.sub(r"\b(And|Of|The|For)\b", lambda m: m.group(0).lower(), re.sub(r"\s+", " ", line).title().replace(" – ", ": ", 1)).rstrip(" :")
            continue
        if ITEMS_LINE.match(line) and not ITEMS.match(line) and not SUFFIX.search(line):
            label = re.sub(r"\s+to$", "", re.sub(r"\s+", " ", line).rstrip(" :"))[:80]
            continue
        if label and not name and ((line.count(",") >= 3 and not SUFFIX.search(line)) or CODES.match(line)):
            continue  # the list of items runs onto another line
        for pat in (RANK, ITEMS):
            lab = pat.match(line)
            if lab:
                label = re.sub(r"\s+", " ", lab.group(1)).capitalize().replace("Terciary", "Tertiary")
                line = line[lab.end():].strip()
        if ADDRESS.search(line) or CITY.search(line):
            if name:
                out.append({"name": clean_name(" ".join(name)), "role": short_label(label) if label else None})
                name = []
            continue
        name.append(line)
        if len(name) > 3:
            break
    return [v for v in out if v["name"] and len(v["name"]) < 90]


def trim_after_suffix(name: str) -> str:
    """"M&J Engineering, D.P.C. Engineering Assessment" -> "M&J Engineering, D.P.C."."""
    m = re.match(r"^(.*?\b(?:Inc|LLC|PLLC|LLP|Ltd|Corp|D\.P\.C|P\.C)\.?)\s+[A-Z][a-z]+", name)
    return m.group(1) if m else name


def proper(name: str) -> bool:
    """A name, not a run of ordinary words."""
    words = [w for w in re.findall(r"[A-Za-z][\w&.'’-]*", re.sub(r"\bd/b/a\b", " ", name, flags=re.I)) if w.lower() not in {"and", "of", "the", "for", "d/b/a"}]
    return bool(words) and sum(w[0].isupper() or w[0].isdigit() for w in words) / len(words) >= 0.7


def vendors(title: str, body: str, kind: str) -> list[dict]:
    """The vendors the resolution names."""
    if kind == "change-order":
        # A change order's WHEREAS clauses recite the engineer's earlier
        # agreement; the contractor is in the attachment, not the resolution.
        return []
    found = vendor_block(body)
    if found:
        return found
    if kind in ("bid-award", "bid-extension", "purchase"):
        text = flat(body.split("THE VOTE")[0])
        for pat in (r"awarded to (?P<name>[A-Z][^,;]{2,80}?)(?:,|;| for | in the amount| at )",
                    r"\bfrom (?P<name>[A-Z][^,;]{2,60}?)(?:,| under | through | pursuant | an approved | off of )"):
            m = re.search(pat, text)
            if m and proper(m.group("name")) and not re.match(r"(?:the )?(?:Town|County|State) of\b", m.group("name")):
                return [{"name": clean_name(m.group("name")), "role": None}]
    m = WILLING.search(flat(body))
    if m and proper(m.group("name")):
        return [{"name": clean_name(m.group("name")), "role": None}]
    resolved = " ".join(c for c in re.findall(r"RESOLVED[^;]*", flat(body)) if not pa.BOILERPLATE.search(c))
    for source in (title, resolved):
        m = PROPOSAL.search(source) or COUNTERPARTY.search(source)
        if m:
            name = trim_after_suffix(clean_name(m.group("name")))
            if re.match(r"(?:the )?(?:Town|County|State|Village) of\b|an?\b|said\b|this\b|such\b|same\b", name, re.I) or len(name) < 3 or not proper(name):
                continue
            return [{"name": name, "role": None}]
    return []


def amount_of(body: str) -> dict:
    """A dollar figure a clause states, with its words; or why there is none."""
    text = flat(body.split("THE VOTE")[0])
    resolved = text.find("RESOLVED")
    hits = list(AMOUNT.finditer(text))
    if hits:
        # A RESOLVED clause states what is approved; a WHEREAS clause may recite
        # an earlier contract's figure.
        best = next((h for h in hits if resolved != -1 and h.start() > resolved), None)
        if best is None:
            # A WHEREAS clause counts only when it is about this agreement, not a
            # recital of an earlier resolution, bond or project.
            for h in hits:
                at = text.rfind("WHEREAS", 0, h.start())
                if not RECITAL.search(text[max(at, 0):h.end()]):
                    best = h
                    break
    if hits and best is not None:
        start = max(text.rfind("RESOLVED", 0, best.start()), text.rfind("WHEREAS", 0, best.start()))
        sentence = re.search(r"\.\s+(?=[A-Z][a-z])", text[best.end():])
        stop = min([s for s in (text.find(";", best.end()), best.end() + sentence.start() if sentence else -1) if s != -1] or [best.end() + 160])
        lead = best.group("lead").lower()
        return {
            "amount": float(best.group("amount").replace("$", "").replace(",", "")),
            "basis": "cap" if "exceed" in lead else "change" if lead.startswith(("increase", "decrease")) else "stated",
            "quote": text[max(start, 0):stop].strip(" ,;"),
        }
    if NO_COST.search(text):
        hit = NO_COST.search(text)
        start = max(text.rfind("RESOLVED", 0, hit.start()), text.rfind("WHEREAS", 0, hit.start()), 0)
        stop = min([i for i in (text.find(";", hit.end()), text.find("; and", hit.end())) if i != -1] or [hit.end() + 80])
        return {"amount": 0.0, "basis": "no-cost", "quote": text[start:stop].strip(" ,;")}
    if ATTACHED_PRICES.search(text):
        return {"amount": None, "basis": "attached", "quote": None}
    return {"amount": None, "basis": "none", "quote": None}


def awarded_clause(body: str) -> str | None:
    """The RESOLVED clause that makes the award, extension or approval."""
    text = flat(body.split("THE VOTE")[0])
    for m in re.finditer(r"RESOLVED.*?(?:;|\.\s+(?=[A-Z][a-z])|$)", text):
        clause = m.group(0).strip(" ;")
        if pa.BOILERPLATE.search(clause):
            continue
        return CONTACT.sub("", clause).strip()[:420]
    return None


def meeting_votes(date: str) -> dict[str, dict]:
    path = MEETINGS / f"{date}.json"
    if not path.exists():
        return {}
    return {r["number"]: r for r in json.loads(path.read_text())["resolutions"]}


def fiscal(date: str) -> dict[str, dict]:
    path = MEETINGS / f"{date}-fiscal.json"
    if not path.exists():
        return {}
    return {r["number"]: r for r in json.loads(path.read_text())["resolutions"]}


def entries(date: str, text: str, url: str | None) -> list[dict]:
    votes, statements = meeting_votes(date), fiscal(date)
    out, seen = [], set()
    for r in pa.resolutions(text):
        number, title = r["number"], r["title"]
        if number in seen or not number.startswith(date[:4]):
            continue
        statement = statements.get(number, {})
        kind = kind_of(title)
        if not kind or statement.get("category") in SKIP_CATEGORIES or EMPLOYMENT.search(r["body"]) or MOU.search(r["body"]) or LICENSE.search(flat(r["body"])):
            continue
        seen.add(number)
        vote = votes.get(number, {})
        named = vendors(vote.get("title") or title, r["body"], kind)
        funding = statement.get("funding") or {}
        out.append({
            "date": date,
            "resolution": number,
            "title": re.sub(r"\s+", " ", vote.get("title") or title.title()),
            "kind": kind,
            "vendors": named,
            **{k: v for k, v in amount_of(r["body"]).items()},
            "clause": awarded_clause(r["body"]),
            "funds": funding.get("funds") or [],
            "townFiscalImpact": statement.get("townFiscalImpact"),
            "result": vote.get("result") or r["result"],
            "adopted": vote.get("adopted"),
            "votes": vote.get("votes") or {},
            "sourceUrl": url,
        })
    return out


def build(packets: dict[str, tuple[str, str | None]]) -> dict:
    awards = []
    for date in sorted(packets):
        text, url = packets[date]
        awards.extend(entries(date, text, url))
    named = [a for a in awards if a["vendors"]]
    return {
        "about": (
            "Bid awards, bid extensions, purchases, change orders and service agreements the Riverhead Town Board "
            "voted on, read from each meeting's agenda packet. Vendors and amounts are the resolution's own words; "
            "an amount is blank where the resolution points to attached pricing or states none."
        ),
        "since": pf.SINCE[:10],
        "kinds": KIND_LABEL,
        "counts": {
            "resolutions": len(awards),
            "withVendor": len(named),
            "withAmount": sum(1 for a in awards if a["amount"]),
            "meetings": len({a["date"] for a in awards}),
        },
        "awards": awards,
    }


def load_packets(packet_dir: Path | None) -> dict[str, tuple[str, str | None]]:
    import pypdf

    packets: dict[str, tuple[str, str | None]] = {}
    for e in pf.list_events():
        date = e["startDateTime"][:10]
        fid = pf.agenda_packet_file_id(e)
        if not fid:
            continue
        url = f"{pf.API}/Meetings/GetMeetingFileStream(fileId={fid},plainText=false)"
        cached = packet_dir / f"{date}.txt" if packet_dir else None
        try:
            if cached and cached.exists():
                text = cached.read_text(encoding="utf-8")
            else:
                reader = pypdf.PdfReader(io.BytesIO(pf.http_get(url)))
                text = "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception as exc:
            print(f"::warning::{date}: packet fetch/parse failed ({exc}); skipped")
            continue
        packets[date] = (text, url)
    return packets


def main() -> int:
    packet_dir = Path(sys.argv[sys.argv.index("--packet-dir") + 1]) if "--packet-dir" in sys.argv else None
    packets = load_packets(packet_dir)
    if not packets:
        print("::error::no agenda packets could be read; contract-awards.json left as it was")
        return 1
    out = build(packets)
    if packet_dir:
        out["preview"] = "Built from cached packet text; do not commit."
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    c = out["counts"]
    print(f"{c['resolutions']} resolutions from {c['meetings']} meetings; {c['withVendor']} name a vendor, {c['withAmount']} state an amount")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
