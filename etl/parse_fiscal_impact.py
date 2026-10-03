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
# Meetings whose dollar amounts were transcribed by hand because the parser
# could not recover them from the packet.
#
# These used to be skipped outright, which froze them at whatever the parser
# could do on the day they were written -- and for 2026-07-07 that was nothing
# at all. It was the only meeting in the corpus with no funding section on any
# resolution, 0 of 53 against 100% everywhere else, so three fund-balance votes
# sat mis-attributed: the East Creek boat launch counted against the General
# Fund when the statement charges CM2, the Meals on Wheels truck netted whole
# against the unassigned cushion when $48,128.53 of it is Assigned, and the
# Town Square bond paydown carried a note saying the resolution "states no
# amount" when it states two.
#
# So they are parsed like any other meeting and the hand work is layered back
# on top: a hand-transcribed amount always wins over a parsed one, and a
# resolution the parser drops is kept. What the parse adds -- the account codes,
# which no hand file here carries -- comes through. Re-running is idempotent.
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
    # Donations sit ABOVE capital deliberately. "Accepts Donation from the
    # Pomeroy Foundation for Purchase of a Historic Marker" matched "purchase of"
    # and came out as a capital reserve draw, when it is $2,100 in and $2,100
    # straight back out. Where a resolution names its funding source in the
    # title, the source decides what it is — not the thing being bought.
    ("donation", ["donation", "donate", "gift of", "accept the gift"]),
    # "purchase", "change order" and the bid-award variants were all missing, so
    # resolutions like "Authorizes Purchase of Kenworth Tandem Axle Dump Truck",
    # "Approves Sewer District Request For Change Order No. 1" and "Awards Bid for
    # Rehabilitation of Plant No. 7" fell through every rule and landed in
    # "procedural", whose verdict is "No direct cost". The old rule listed
    # "award bid" but the Town writes "Awards Bid". Bare "capital" went the other
    # way — too loose. It fired on "capital improvements" inside the purpose text
    # of a resolution merely authorizing a GRANT APPLICATION, which commits
    # nothing, so the specific phrases carry the signal instead.
    ("capital", ["capital project", "capital improvement", "capital budget", "capital reserve",
                 "budget adjustment", "budget transfer", "transfer of funds",
                 "change order", "purchase of", "purchase and", "authorizes purchase",
                 "awards bid", "award bid", "bid award", "rehabilitation of"]),
    # Settlements and claims pay real money and had no rule at all.
    ("litigation", ["settlement of", "settle the claim", "authorizes settlement",
                    "stipulation of settlement", "notice of claim", "tax certiorari"]),
    ("grant", ["grant"]),
    ("labor-contract", ["collective bargaining", "cba", "union", "pba", "csea", "soa", "memorandum of agreement"]),
    ("personnel-out", ["retirement", "resignation", "separation", "terminate", "termination"]),
    ("personnel", ["appoint", "hire", "salary", "salaries", "promote", "promotion", "provisional",
                   "permanent appointment", "part-time", "full-time", "stipend",
                   "reclassif",  # a reclassification is a pay-grade change
                   ]),
    ("appointment-volunteer", ["board", "committee", "task force", "council on", "commission"]),
    ("fees", ["fee schedule", "set fees", "fees", "rate", "charge"]),
    ("permit", ["permit", "license", "special event", "road closure", "block party", "mass gathering"]),
    ("contract", ["contract", "agreement", "professional services", "award bid", "bid award", "renew", "extension"]),
    ("escrow-neutral", ["escrow", "performance bond", "letter of credit", "release of"]),
    ("legislative", ["local law", "introductory", "public hearing", "amend chapter", "zoning"]),
    # Attending a conference is not free: there is a registration fee and there
    # is mileage, and both are charged to a real appropriation line. Seventeen of
    # these came through as "procedural / no direct cost" — on several of which
    # the TOWN ITSELF answered "Yes, this has a fiscal impact". Reading them as
    # costless was this site under-reporting where the Town over-reported.
    ("training", ["training", "seminar", "conference", "workshop", "symposium",
                  "certification course", "annual meeting &", "attendance at"]),
    # "pay bills" never matched, because the Town writes "Pays Bills". Every one
    # of the eighteen warrants in the corpus fell through to "procedural".
    ("warrant", ["warrant", "abstract", "audit of claims", "pay bills", "pays bills",
                 "payment of bills", "approves claims"]),
]

# category → (fiscalImpact-aware) realistic verdict. Some categories flip on Yes/No.
# A bond resolution authorizes BORROWING. Nothing leaves fund balance when it
# passes — which is why calling it a reserve draw was wrong. What it creates is
# debt service on future levies, every year until the bond matures, and that is a
# larger fact for the 2027 budget than a one-time draw would be. The Ambulance
# Building Project bond (2026-833) is the live example: a future capital project
# whose cost lands on taxpayers through the levy, not through surplus.
BOND_AUTHORIZATION = re.compile(
    r"(bond resolution|authoriz\w*\s+the\s+issuance|serial bonds?|bond anticipation note"
    r"|\bBAN\b|authoriz\w*\s+.{0,30}\bborrow)",
    re.I,
)


def realistic_read(category: str, fiscal_impact: str, title: str = "") -> dict:
    yes = fiscal_impact == "Yes"
    if category == "debt" and BOND_AUTHORIZATION.search(title):
        return {
            "verdict": "Creates debt service on future budgets",
            "reason": (
                "A bond resolution authorizes borrowing. Nothing comes out of fund balance when it "
                "passes — the cost arrives as debt service in every budget until the bond matures, "
                "paid out of the levy. For a future capital project that is the whole fiscal impact, "
                "and it is the part a single-year form is worst at showing."
            ),
            "flag": "future-debt",
        }
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
    if category == "litigation":
        return {
            "verdict": "Real cost — a payment the Town owes",
            "reason": "A settlement or claim is money leaving the Town, usually from the General Fund or an insurance reserve, whatever the form says about absorption.",
            "flag": "reserve-draw" if yes else "understated",
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
    if category == "warrant":
        return {
            "verdict": "Authorizes payment — the money leaves here",
            "reason": (
                "A warrant is the Board signing off on actual disbursement: checks written and funds "
                "transferred. The obligations were incurred earlier, so this is not new spending — but "
                "it is the moment the cash goes out, and the resolution that releases it is the one "
                "place the total is put in front of the Board."
            ),
            "flag": "disbursement",
        }
    if category == "training":
        if yes:
            return {
                "verdict": "Small real cost — and the Town says so",
                "reason": (
                    "Registration or tuition plus mileage and travel, charged to a conference or "
                    "training line. Individually minor; the Town answered honestly here."
                ),
                "flag": "small-cost",
            }
        return {
            "verdict": "Understated — the form says 'no fiscal impact'",
            "reason": (
                "Attending a training, seminar or conference carries a registration fee and mileage or "
                "travel reimbursement. Both are charged to a budget line. On other, near-identical "
                "attendance resolutions the Town answered \u201cYes\u201d."
            ),
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


# ── Capital-project closeouts ────────────────────────────────────────────────
# Closing a finished capital project commits no new money. The category read
# calls every capital item the Town marks "no fiscal impact" understated, and
# all 32 closeouts on June 16, 2026 (2026-566 to 2026-597) came out that way,
# though each returns its unspent balance to the fund or the developer that
# paid it in, had it moved by an earlier resolution, or has none left. The
# Board's own RESOLVED clause is the evidence: "authorizes the Finance
# Department to close Capital Project #12101". A closeout that covers an
# overrun, draws appropriated fund balance or moves its balance on to another
# project does commit money, so any of those keeps the category read.
CLOSES_PROJECT = re.compile(r"\bclose(?:-?out)?\s+(?:[A-Za-z]+\s+){0,3}Capital\s+Project\s*(?:#|No\.?)?\s*(\d+)", re.I)
PROJECT_NUMBER = re.compile(r"Capital\s+Project\s*(?:#|No\.?)?\s*(\d+)", re.I)
NEW_MONEY = re.compile(
    r"deficit|over-?runs?\b|shortfall|over-?expend|insufficient"
    # Not "Assigned Unappropriated Fund Balance", where 2026-569 RETURNS money.
    r"|(?<!un)appropriated\s+fund\s+balance|from\s+(?:the\s+)?(?:\w+\s+){0,3}fund\s+balance",
    re.I,
)


def closes_project(body: str) -> bool:
    """True when the Board resolves to close a capital project and nothing in
    the resolution puts money into it or moves its balance to another project."""
    start = body.find("RESOLVED")
    resolved = body[start:] if start >= 0 else ""
    closing = CLOSES_PROJECT.search(resolved)
    if not closing or NEW_MONEY.search(body):
        return False
    return set(PROJECT_NUMBER.findall(resolved)) <= {closing.group(1)}


def closeout_read(realistic: dict, fiscal_impact: str) -> dict:
    """The read for a resolution that closes a finished capital project.

    Only a "No" that the category read called understated is corrected. Where
    the Town answered "Yes", or section G's accounts decided the read, it stands.
    """
    if fiscal_impact != "No" or realistic.get("flag") != "understated" or realistic.get("evidence") != "category":
        return realistic
    return {
        "verdict": "No new cost — the project is closed",
        "reason": (
            "The Board closes a finished capital project. That commits no new money: whatever was "
            "left unspent is returned, or an earlier resolution already moved it. The Town's "
            "'no fiscal impact' is fair."
        ),
        "flag": "fair",
        "evidence": "resolution-text",
    }


# ── Section G: the Town's own statement of who pays ─────────────────────────
#
# Every Fiscal Impact Statement carries a "G. Proposed Source of Funding" block,
# and section E(b) a free-text explanation. Between them the Town names the
# funding source on 99% of statements, attaches a GL account code on about an
# eighth, and — crucially — states a dollar amount on about a quarter.
#
# This file used to say amounts "live in interleaved backup tables that don't
# reliably tie to a single resolution, so they are left blank rather than
# guessed". That is true of the backup tables and wrong about section G, which
# sits inside the statement for one resolution and names its own figure. Reading
# it takes priced resolutions from roughly 2% of the corpus to roughly 27%, and
# replaces title-keyword guesses about which fund is touched with the account
# prefix the Town wrote down.
#
# Account prefixes are the Town's own fund codes, taken from the adopted budget.
FUND_PREFIXES: dict[str, str] = {
    "A01": "General Fund", "DA1": "Highway Fund", "EW1": "Water District",
    "ES1": "Riverhead Sewer District", "ES5": "Riverhead Scavenger Waste",
    "SR1": "Refuse and Garbage District", "SM1": "Ambulance District",
    "SL1": "Street Lighting District", "CM4": "Community Preservation Fund",
    "SW1": "Calverton Sewer District", "CD1": "Community Development",
    "V01": "Debt Service Fund", "PK1": "Public Parking District",
    "BID": "Business Improvement District",
    # Observed in section G and absent from the operating-fund list: capital and
    # developer-fee funds. They matter because money moving through them is NOT
    # a draw on any operating fund's balance.
    "H01": "Capital Projects Fund",
    "EW3": "Water District — developer fees",
    "ES2": "Sewer — developer fees",
    "CM5": "Community Preservation — capital",
    # The rest of the adopted budget's funds. Without these a real draw reports
    # its fund as unknown: resolution 2026-275 charges Z14 fund balance $30,000
    # and came through with no fund name at all.
    # Two sewer funds that appear only in capital-project statements and are
    # absent from the adopted-budget extract. Their official titles are not
    # published anywhere this site can cite, so they are labeled by what the
    # Town's own account descriptions on the statement establish — sewer funds —
    # and nothing more is asserted. Capital project 82210 (Biosolids Facility)
    # moves money through both: ES7 holds the fund balance and transfers out to
    # ES2 and ES6.
    "ES6": "Sewer District (ES6)",
    "ES7": "Sewer District (ES7)",
    "Z14": "Calverton Parks Community Development Agency",
    "A04": "Police Athletic League", "A06": "Recreation Program Fund",
    "CM1": "Business Improvement District", "CM2": "East Creek Docking Facility",
    "ES3": "Calverton Sewer District", "MS1": "Workers Compensation Fund",
    "MS2": "Risk Retention Fund", "ST1": "Public Parking District",
}

# How the money is raised, in the Town's own words. Ordered: the first match
# wins, so the more specific sources are checked before the general ones.
FUNDING_RULES: list[tuple[str, list[str]]] = [
    ("fund-balance", ["fund balance", "unassigned", "retained earnings", "reserve"]),
    ("grant", ["grant", "pass-through", "pass through", "federal", "state aid", "nys "]),
    ("donation", ["donation", "donated", "gift"]),
    ("escrow", ["escrow", "letter of credit", "performance bond", "performance security"]),
    ("borrowing", ["bond anticipation", "serial bond", "bond proceeds", "ban proceeds", "borrowing"]),
    ("insurance", ["insurance", "indemnif", "recovery"]),
    ("fee-revenue", ["fee revenue", "fees collected", "user fee", "permit revenue"]),
    ("appropriation-transfer", ["appropriation transfer", "budget transfer", "transfer from"]),
    ("existing-appropriation", ["existing appropriation", "budgeted", "approved town annual budget",
                                "existing resources", "absorbed"]),
]

# A grant is not automatically costless to the Town, and the statement usually
# says so. Two conditions change what a grant means for the levy:
#
#   a MATCH   — the Town must put up its own money alongside the award, so a
#               "fully grant funded" project still costs the local share.
#   REIMBURSEMENT — the Town spends first and is paid back later, so it fronts
#               the cash even when the net cost is zero, and carries the risk
#               that the claim is reduced or denied.
#
# Both are read from what the preparer wrote, and "not stated" stays not stated.
MATCH_REQUIRED = re.compile(
    r"(required?\s+\d+\s*%\s*match|\d+\s*%\s*(?:local\s+)?match|match(?:ing)?\s+funds?"
    r"|matched\s+funding|local\s+share|cost[-\s]?shar|in[-\s]?kind\s+(?:match|contribution))",
    re.I,
)
MATCH_NOT_REQUIRED = re.compile(
    r"(does\s+not\s+require\s+(?:any\s+)?match|no\s+(?:local\s+)?match(?:\s+is)?\s+(?:required|needed)"
    r"|match\s*:\s*(?:none|n/?a|0)|without\s+a\s+match)",
    re.I,
)
MATCH_PERCENT = re.compile(r"(\d{1,3}(?:\.\d+)?)\s*%\s*(?:local\s+)?match", re.I)
REIMBURSEMENT = re.compile(
    r"(reimburs|paid\s+back|on\s+a\s+reimbursement\s+basis|funds?\s+are\s+recovered"
    r"|the\s+town\s+(?:will\s+)?front)",
    re.I,
)

MONEY_RE = re.compile(r"\$\s*([\d,]+(?:\.\d{2})?)")
# Fund codes run one to three letters then one or two digits: A01 (General
# Fund), H01 (capital projects), DA1 (Highway), EW3 (water developer fees). An
# earlier pattern required two letters and missed A01 entirely — the General
# Fund, which is the one that matters most here.
ACCOUNT_RE = re.compile(r"\b([A-Z]{1,3}\d{1,2})-[\d\-]{6,}")

# The whole sub-account, not just its fund prefix. Riverhead uses the NY chart
# of accounts in two shapes, and the shape alone says which side of the ledger
# a code sits on:
#
#   appropriation  FUND-F-DDDD-OOO-SSS-PPPPP   A01-1-1420-433-000-00000
#   revenue        FUND-RRRR-SSS-PPPPP-T       A01-9999-000-00000-0
#
# All 848 appropriation lines and all 161 revenue lines in the adopted-budget
# extract follow those two shapes exactly, so the second segment's width (1
# digit vs. 4) is a reliable discriminator — no keyword guessing needed.
# The separator tolerates whitespace because the PDF wraps long codes AFTER the
# hyphen: the packets carry "EW1-8-8320-402- 000-00000" and "ES5-8- 8189-426-
# 075-00000". Without this the first of those truncated to EW1-8-8320-402 and
# leaked its tail into the account NAME, and the second broke before the
# three-segment minimum and was dropped from the statement altogether. Captured
# whitespace is stripped, so the code is normalized back to its real form.
FULL_ACCOUNT_RE = re.compile(r"\b([A-Z]{1,3}\d{1,2}(?:-\s*[\dA-Z]+){3,5})")

# Revenue object 9999 is "Appropriated Fund Balance" — the Town's own journal
# entry for taking money out of a fund's accumulated surplus. When it appears in
# section G the draw is documented, not inferred from the resolution's title.
FUND_BALANCE_OBJECT = "9999"

# GASB Statement 54 splits a fund's balance into five classifications by how
# hard the money is to spend, and the Town sometimes names the classification in
# the account's own description: resolution 2026-361 charges "Assigned
# Unappropriated Fund Balance - CBF". That word is load-bearing. A reserve
# policy, and every headroom figure on this site, is measured against the
# UNASSIGNED tier, so netting an Assigned draw against it reports a cushion
# shrinking when the cushion has not moved. Where the Town states a tier it is
# carried through; where it says nothing the tier is left null rather than
# assumed, because the object code alone does not distinguish them.
FUND_BALANCE_CLASS = re.compile(
    r"\b(nonspendable|non-spendable|restricted|committed|assigned|unassigned)\b", re.I
)
FUND_BALANCE_CLASS_NAMES = {
    "nonspendable": "Nonspendable",
    "non-spendable": "Nonspendable",
    "restricted": "Restricted",
    "committed": "Committed",
    "assigned": "Assigned",
    "unassigned": "Unassigned",
}


def fund_balance_class(name: str | None) -> str | None:
    """The GASB 54 tier the Town named on this account, if it named one.

    "Unassigned" must be tested before "Assigned" would match inside it, which
    the alternation handles by word boundary rather than by order.
    """
    if not name:
        return None
    m = FUND_BALANCE_CLASS.search(name)
    return FUND_BALANCE_CLASS_NAMES[m.group(1).lower()] if m else None


# A capital-project resolution opens new sub-accounts under a project number it
# names in its own title — "Budget Adoption for Capital Project #12620" creates
# H01-1-1940-435-000-12620. Such a code is absent from the adopted budget
# because it did not exist when the budget was adopted. That is a different fact
# from "this site does not recognize the code", and the two must not be shown
# the same way.
PROJECT_NO = re.compile(r"(?:capital\s+)?project\s*#?\s*(\d{4,6})", re.I)
CREATES_ACCOUNT = re.compile(
    r"(budget\s+adoption|adopts?\s+.{0,40}capital\s+project|establish(?:es|ing)?"
    r"|creat(?:es|ing)|new\s+capital\s+project|opens?\s+.{0,20}account)",
    re.I,
)

# Funds that hold capital projects and developer-paid work. Money moving through
# them is not a draw on any operating fund's balance, so a capital resolution
# whose accounts all sit here is not competing with the 2027 options.
CAPITAL_FUNDS = {"H01", "EW3", "ES2", "CM5", "SW1"}


def _section(block_text: str, start_pat: str, end_pat: str) -> str:
    """Text between two lettered headings of the statement, or ''."""
    m = re.search(start_pat, block_text)
    if not m:
        return ""
    rest = block_text[m.end():]
    e = re.search(end_pat, rest)
    return (rest[: e.start()] if e else rest[:1200]).strip()


# The statement's own printed labels. They must be stripped before any keyword
# match: "Grant or other Revenue Source:" is pre-printed on every form, so
# matching it tagged 138 of 143 statements as grant-funded on the first pass.
# What matters is what the preparer WROTE, not what the form asks.
FORM_LABELS = re.compile(
    r"(Grant or other Revenue Source|Appropriation Account to be Charged"
    r"|Appropriation Transfer \(list account\(s\) and amount\)|Appropriation Transfer"
    r"|Proposed Source of Funding|The description/explanation of fiscal impact is set forth as follows"
    r"|total Financial Cost of Funding over|the current fiscal year)",
    re.I,
)

# Section G is not free text — it is three labeled fields, and every one of the
# 143 statements in the corpus prints all three in this order. Splitting on them
# is what lets an account be read as "charged", "funded by" or "transferred to"
# instead of being lumped into one undifferentiated list.
G_FIELDS: list[tuple[str, str]] = [
    ("charge", r"Appropriation Account to be Charged\s*:"),
    ("revenue", r"Grant or other Revenue Source\s*:"),
    ("transfer", r"Appropriation Transfer[^:\n]*:"),
]


def split_section_g(g: str) -> dict[str, str]:
    """Section G text split into its three pre-printed fields."""
    marks = []
    for role, pat in G_FIELDS:
        m = re.search(pat, g, re.I)
        if m:
            marks.append((m.start(), m.end(), role))
    marks.sort()
    out: dict[str, str] = {}
    for i, (_, end, role) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(g)
        out[role] = g[end:stop].strip()
    return out


def _accounts_in(field_text: str, role: str) -> list[dict]:
    """Every sub-account named in one field, with the name and amount beside it.

    The form writes each account followed by its own description and its own
    dollar figure, so the figures can be tied to a specific budget line rather
    than to the resolution as a whole. Both are optional — an appointment names
    an account with no amount at all.
    """
    hits = list(FULL_ACCOUNT_RE.finditer(field_text))
    out = []
    for i, m in enumerate(hits):
        tail = field_text[m.end(): hits[i + 1].start() if i + 1 < len(hits) else len(field_text)]
        money = MONEY_RE.search(tail)
        label = tail[: money.start()] if money else tail
        label = " ".join(FORM_LABELS.sub(" ", label).split()).strip(" -–—:")
        code = re.sub(r"\s+", "", m.group(1))
        parts = code.split("-")
        # An appropriation code that lost its trailing project segment to a PDF
        # line break: 5 segments where the second is a single function digit.
        if len(parts) == 5 and len(parts[1]) == 1:
            code += "-00000"
        kind = "revenue" if len(parts) > 1 and len(parts[1]) == 4 else "appropriation"
        out.append({
            "code": code,
            "role": role,
            "kind": kind,
            "fund": parts[0],
            "name": label[:80] or None,
            "amount": round(float(money.group(1).replace(",", "")), 2) if money else None,
        })
    return out


def funding_from_block(block_text: str, title: str = "", purpose: str = "") -> dict:
    """Read the Town's own funding statement: source, accounts, amount.

    Everything here is transcribed or directly derived from the statement. When
    the Town did not write a figure, the amount stays None — the point of reading
    section G is to stop guessing, not to guess more precisely.
    """
    g = _section(block_text, r"G\.\s*Proposed Source of Funding", r"\n\s*H\.")
    eb = _section(block_text, r"\(b\)\s*The description/explanation[^:]*:", r"\n\s*F\.")
    hay = FORM_LABELS.sub(" ", f"{g} {eb}").lower()

    # A statement can name more than one source — one real example funds a
    # project from bond proceeds AND state aid. Collect every match rather than
    # taking the first, and keep the first as the headline for display.
    sources = [name for name, kws in FUNDING_RULES if any(kw in hay for kw in kws)]
    source = sources[0] if sources else None

    fields = split_section_g(g)
    accounts: list[dict] = []
    # A code printed twice in the same field is a restatement and is dropped.
    # A code printed twice carrying DIFFERENT money is two lines, and dropping
    # the second loses real dollars: resolution 2026-361 charges
    # A01-9999-000-00000-0 twice, $5,000 for Nextera Community Health &
    # Wellness and $108,613 for Nextera Easement Phase 1. Keying on the code and
    # role alone kept only the $5,000 and reported that as the whole draw, when
    # the statement's own transfer line reads $113,613. The name and amount are
    # what make a line distinct, so they belong in the key.
    seen: set[tuple[str, str, str, float | None]] = set()
    for role in ("charge", "revenue", "transfer"):
        for a in _accounts_in(fields.get(role, ""), role):
            key = (a["code"], a["role"], a["name"] or "", a["amount"])
            if key in seen:
                continue
            seen.add(key)
            accounts.append(a)
    # Any code the field split missed — a statement whose labels did not print.
    if not accounts and g:
        accounts = _accounts_in(g, "unspecified")

    # Every fund gets carried, named or not. Dropping the unnamed ones let a
    # statement's fund list show the WRONG fund: resolution 2026-473 draws
    # $800,000 out of ES7 fund balance, and because ES7 had no name the display
    # attributed the draw to "Sewer — developer fees", which is ES2. An
    # unrecognized code appears as itself rather than vanishing.
    prefixes: list[str] = []
    funds: list[str] = []
    for a in accounts:
        if a["fund"] not in prefixes:
            prefixes.append(a["fund"])
        fund = FUND_PREFIXES.get(a["fund"], a["fund"])
        if fund not in funds:
            funds.append(fund)

    # The Town's own journal entry for a fund-balance draw, if it made one.
    fund_balance = [
        a for a in accounts
        if a["kind"] == "revenue" and a["code"].split("-")[1] == FUND_BALANCE_OBJECT
    ]
    for a in fund_balance:
        a["fundBalanceClass"] = fund_balance_class(a["name"])

    # The largest figure named in section G. Several rows can repeat the same
    # sum (revenue in, appropriation out); the maximum is the size of the action.
    amounts = [float(a.replace(",", "")) for a in MONEY_RE.findall(g)]
    amount = round(max(amounts), 2) if amounts else None

    # What the grant actually costs the Town. Searched over the full statement
    # text rather than the truncated display string, because the sentence that
    # names a match is usually the last one in the explanation.
    full = FORM_LABELS.sub(" ", f"{g} {eb}")
    if MATCH_NOT_REQUIRED.search(full):
        match_required = False
    elif MATCH_REQUIRED.search(full):
        match_required = True
    else:
        match_required = None
    pct = MATCH_PERCENT.search(full)

    # Accounts this resolution opens. A project number in the title that also
    # appears as a code's project segment means the code is being created here.
    projects = set(PROJECT_NO.findall(f"{title} {purpose}"))
    creating = bool(projects) and bool(CREATES_ACCOUNT.search(f"{title} {purpose}"))
    for a in accounts:
        seg = a["code"].split("-")[-1]
        a["createdHere"] = creating and (seg in projects or seg.lstrip("0") in projects)

    # One draw can fund many lines. Riverhead does this routinely — resolution
    # 2026-522 splits a single $72,400 fund-balance draw across nine
    # appropriation sub-accounts, payroll and FICA and equipment separately. The
    # split is the interesting part, so it is measured rather than flattened.
    spend_lines = [a for a in accounts if a["kind"] == "appropriation" and a["amount"]]

    return {
        "source": source,
        "sources": sources,
        "sourceText": " ".join(FORM_LABELS.sub(" ", eb or g).split())[:400] or None,
        "fundCodes": prefixes,
        "funds": funds,
        "amount": amount,
        # Full sub-accounts, each tied to the field the Town wrote it in. These
        # join to the adopted budget's line items in web/lib/account-lookup.ts.
        "accounts": accounts,
        "fundBalanceAccounts": [a["code"] for a in fund_balance],
        # The fund the draw actually comes out of. Taken from the 9999 account
        # itself, because a capital statement routinely touches several funds and
        # the first one named is not necessarily the one being drawn down.
        "fundBalanceFunds": [
            FUND_PREFIXES.get(a["fund"], a["fund"])
            for a in fund_balance
        ],
        "fundBalanceDraw": round(sum(a["amount"] for a in fund_balance if a["amount"]), 2)
        if any(a["amount"] for a in fund_balance) else None,
        # The GASB 54 tier each draw names, parallel to fundBalanceAccounts.
        # null where the Town named none — not a guess that it is Unassigned.
        "fundBalanceClasses": [a.get("fundBalanceClass") for a in fund_balance],
        # Documented by account code rather than inferred from the title.
        "drawsFundBalance": bool(fund_balance),
        # A grant with a match is not a free grant, and one paid on a
        # reimbursement basis is money the Town fronts. null means the statement
        # did not say, which is not the same as "no".
        "matchRequired": match_required,
        "matchPercent": float(pct.group(1)) if pct else None,
        "reimbursementBasis": bool(REIMBURSEMENT.search(full)),
        # How many budget lines one action charges, and whether any of them are
        # being opened by this resolution rather than carried in the budget.
        "splitAcross": len(spend_lines),
        "createsAccounts": [a["code"] for a in accounts if a.get("createdHere")],
    }


def apply_funding_evidence(realistic: dict, funding: dict, category: str) -> dict:
    """Let the Town's own account codes overrule a keyword guess.

    The category read is an inference from the resolution's title. Section G,
    when it names accounts, is the Town's accounting. Where the two disagree the
    accounting wins, and the read records which one it used.
    """
    accounts = funding.get("accounts") or []

    # A GRANT IS NOT AUTOMATICALLY FREE. The category read for a grant is
    # "Revenue in / offsetting — money flows, but from a grant, not the tax
    # levy". That is only true when the Town puts up nothing. Where the
    # statement says a match is required, the local share is levy money and the
    # page should say so; where it says the money is reimbursed, the Town spends
    # first and carries the risk that the claim is reduced. This runs before the
    # accounts check because a grant statement often names no account at all.
    if funding.get("matchRequired") or funding.get("reimbursementBasis"):
        if funding.get("matchRequired"):
            pct = funding.get("matchPercent")
            share = f"a {pct:g}% local match" if pct else "a local match"
            return {
                "verdict": "Grant with a local share — not cost-free",
                "reason": (
                    f"The statement says this award requires {share}. The grant covers most of the "
                    "cost, but the Town's share is its own money, and it comes from the levy or from "
                    "fund balance like any other spending."
                ),
                "flag": "understated" if realistic.get("flag") in ("fair", "neutral") else realistic["flag"],
                "evidence": "statement-text",
            }
        return {
            "verdict": "Reimbursed — the Town pays first",
            "reason": (
                "The statement describes money the Town spends and is paid back for. The net cost may "
                "well be nothing, but the cash goes out before it comes in, and a claim that is reduced "
                "or denied leaves the difference with the Town."
            ),
            "flag": "neutral",
            "evidence": "statement-text",
        }

    if not accounts:
        return {**realistic, "evidence": "category"}

    # The account code wins, including over the bond-title heuristic. Resolution
    # 2026-762 is the case that proves it: its title says "Pay Down of Town Square
    # ... BAN", so the heuristic calls it future debt — while its own section G
    # books $1,874,218 out of A01-9999 Appropriated Fund Balance. Both things are
    # true, and the one the Town wrote in its ledger is the one that governs. An
    # earlier guard here had the precedence backwards and suppressed the largest
    # documented draw in the corpus.
    if funding.get("drawsFundBalance"):
        drawn = funding.get("fundBalanceFunds") or funding.get("funds") or []
        where = " and ".join(drawn) if drawn else "a Town fund"
        draw = funding.get("fundBalanceDraw")
        sized = f"{draw:,.0f} " if draw else ""
        also_debt = realistic.get("flag") == "future-debt"
        return {
            "verdict": "Draws fund balance — stated on the Town's own form",
            "reason": (
                f"Section G charges ${sized}to Appropriated Fund Balance in the {where}. "
                "This is not an inference from the title: it is the account the Town wrote down, "
                "and every dollar of it is surplus that is no longer available for anything else."
                + (
                    " The title also refers to borrowing, and both are true: surplus is being spent "
                    "now to retire or service debt. The draw is what leaves the balance sheet today."
                    if also_debt else ""
                )
            ),
            "flag": "reserve-draw",
            "evidence": "account-code",
        }

    # A capital project run entirely through a capital or developer-fee fund does
    # not touch an operating fund's balance. Borrowing is excluded — bond
    # proceeds are not a draw today but they are debt service on a future levy.
    all_capital = all(a["fund"] in CAPITAL_FUNDS for a in accounts)
    offsetting = {"grant", "donation", "escrow", "fee-revenue"}
    if (
        category in ("capital", "debt")
        and all_capital
        and "borrowing" not in (funding.get("sources") or [])
        and (offsetting & set(funding.get("sources") or []) or funding.get("source") is None)
    ):
        funds = funding.get("funds") or []
        where = funds[0] if funds else "a capital fund"
        return {
            "verdict": "Capital fund — no draw on an operating balance",
            "reason": (
                f"Every account named in section G sits in the {where}. The money moves through a "
                "capital or developer-paid fund, so it does not reduce the General Fund surplus the "
                "Town would need for anything else."
            ),
            "flag": "neutral",
            "evidence": "account-code",
        }

    # A PAYROLL LINE IS NOT A RESERVE. The category read gives personnel,
    # contract, fees and labour-contract items the "reserve-draw" flag, whose
    # label reads "Draws reserves" — while its own verdict for them says "Real,
    # recurring cost". Both cannot be right, and the accounts settle it: an
    # appointment charged to DA1-5-5110-101-NON-00000, Repair - Personal
    # Services in the Highway Fund, is levy-funded payroll. It is a real and
    # recurring cost and it draws no reserve at all.
    #
    # So where the statement names only appropriation accounts and no 9999, a
    # recurring item is reported as what it is. Capital and debt are untouched:
    # those genuinely do reach for reserves, borrowing or fund balance.
    RECURRING = ("personnel", "labor-contract", "fees", "contract")
    charges_only = accounts and all(a["kind"] == "appropriation" for a in accounts)
    if (
        realistic.get("flag") == "reserve-draw"
        and category in RECURRING
        and charges_only
        and not funding.get("drawsFundBalance")
    ):
        lines = [a["name"] for a in accounts if a.get("name")]
        where = f" ({lines[0]})" if lines else ""
        return {
            "verdict": "Real, recurring cost — funded by the levy",
            "reason": (
                f"Section G charges this to an appropriation account{where} and names no fund-balance "
                "account. It is ongoing operating money the tax levy carries, not a draw on accumulated "
                "surplus — a distinction the form itself does not draw."
            ),
            "flag": "recurring",
            "evidence": "account-code",
        }

    # Money in and money straight back out, inside one fund, from a source that is
    # not the Town's own surplus: a donation received and spent, a grant passed
    # through, a developer's escrow drawn down. The two sides balancing is the
    # proof — it is what the preparer wrote in section G, not a reading of the
    # title.
    revenue_side = round(sum(a["amount"] or 0 for a in accounts if a["kind"] == "revenue"), 2)
    spend_side = round(sum(a["amount"] or 0 for a in accounts if a["kind"] == "appropriation"), 2)
    one_fund = len({a["fund"] for a in accounts}) == 1
    if (
        revenue_side > 0
        and revenue_side == spend_side
        and one_fund
        and "borrowing" not in (funding.get("sources") or [])
        and offsetting & set(funding.get("sources") or [])
    ):
        return {
            "verdict": "Offsetting — in and straight back out",
            "reason": (
                f"Section G books ${revenue_side:,.0f} in and the same ${spend_side:,.0f} out, "
                f"both in the {(funding.get('funds') or ['same fund'])[0]}. The money is real but it "
                "is not the Town's, and it leaves the fund's balance where it started."
            ),
            "flag": "neutral",
            "evidence": "account-code",
        }

    return {**realistic, "evidence": "category"}


def classify(title: str, purpose: str) -> str:
    hay = f" {title} {purpose} ".lower()
    for category, kws in CATEGORY_RULES:
        if any(kw in hay for kw in kws):
            return category
    return "procedural"


# ── Packet parsing ──────────────────────────────────────────────────────────
#
# The form's title and purpose are single labeled fields that WRAP. The Clerk
# writes titles longer than the line, and the PDF breaks them, so reading only
# the first line silently truncated every long one:
#
#   "Ratifies the Authorization for the Supervisor to Execute Stipulation with the"
#
# — which cuts off exactly the part that says which union. It also cost the
# classifier every keyword past the first line, since `purpose` feeds the
# category rules. A field runs until the next lettered heading.
NEXT_HEADING = re.compile(r"\n\s*[A-Z]\.\s")


# ── Amounts the resolution itself states ──────────────────────────────────
#
# The Fiscal Impact Statement is the Town's answer about money. The resolution
# printed just above it is what the Board votes on, and it often names the
# money outright: "a 2026 or newer VACTOR truck with an estimated/projected
# cost of $650,000.00" (2026-767) sits above a statement that answers "No"
# fiscal impact. In the 2026 packets, 268 statements carry no amount in
# section G while the resolution above them states a dollar figure, and the
# Town answered "No" on 160 of those.
#
# A dollar sign is not a cost, though. Every special-event approval states the
# $1,000,000 / $2,000,000 of insurance the applicant must carry, and the
# application fee the applicant paid the Town. So each figure is labelled by
# the words around it and quoted as printed, and only a figure that reads as
# the Town paying out counts toward the resolution's stated cost.

RES_HEADER = re.compile(r"TB Resolution\s+(\d{4}-\d{1,4})")
# Running heads and stamps a packet prints between pages of one resolution.
PACKET_NOISE = re.compile(
    r"^\s*(?:Page \d+ of \d+|\d{1,2}/\d{1,2}/\d{4}\s+[IVXL]+\.\s*\d+\.?"
    r"|ADOPTED|TABLED|DEFEATED|FAILED|WITHDRAWN|TOWN OF RIVERHEAD)\s*$",
    re.M,
)
# "$549K" and "$1.545M" are written that way in grant resolutions (2026-211);
# without the suffix the second read as one dollar.
STATED_MONEY = re.compile(r"\$\s*(\d[\d,]*(?:\.\d+)?)(?![\d,])\s*([KM]\b|million\b|thousand\b)?", re.I)
MONEY_SCALE = {"k": 1_000, "thousand": 1_000, "m": 1_000_000, "million": 1_000_000}
CLAUSE_WORD = re.compile(r"\b(WHEREAS|RESOLVED)\b")

# First match wins, tried against the words from the start of the figure's
# clause up to the figure and the few words after it. The order is the point:
# every label that says the money is NOT the Town paying out is tried before
# "cost", because a figure can carry cost words and still run the other way.
# "...to accept funds from Suffolk County Office for the Aging ... in an amount
# not to exceed $408,211.00" (2026-255) reads "not to exceed" and is money IN.
STATED_ROLES: list[tuple[str, re.Pattern]] = [
    # Coverage a third party must carry. Not money the Town pays or receives.
    ("insurance", re.compile(r"insur|polic(?:y|ies)\s+limit|per\s+occurrence|aggregate|additional\s+insured", re.I)),
    # A developer's security the Town holds or releases.
    ("security", re.compile(
        r"performance\s+(?:bond|security|guarantee)|letter\s+of\s+credit|maintenance\s+bond|escrow|surety"
        r"|security\s+deposit|cash\s+bond|restoration\s+bond", re.I)),
    # Money coming to the Town: a grant, aid, a reimbursement, funds accepted.
    ("revenue", re.compile(
        r"accept(?:s|ing)?\s+(?:the\s+)?(?:funds|monies|payment|grant|donation)|funds\s+from|reimburs"
        r"|\bgrants?\b|state\s+aid|federal\s+aid|apply\s+for|seeking\s+(?:to\s+apply|funding)"
        r"|funding\s+in\s+the\s+(?:estimated\s+)?amount|forfeiture|donat|\bgift|defray"
        # A check "payable to the Town" (2026-690); a cleanup cost "levied and
        # assessed" back onto the property it was spent on (2026-471).
        r"|payable\s+to\s+the\s+town|submit(?:ted)?\s+a\s+check|levied\s+and\s+assessed|assessed\s+against"
        r"|received\s+(?:a\s+)?check|private\s+match|state\s+funds|will\s+provide|made\s+available|allocation", re.I)),
    ("rate", re.compile(
        r"hourly|per\s+hour|an\s+hour|rate\s+of\s+pay|pay\s+rate|salary|salaries|per\s+annum|annual\s+rate"
        r"|stipend|wage|per\s+(?:unit|month|day|week|diem|linear|dwelling|notice|inspection|gallon|quarter)", re.I)),
    # A fee, rent or charge. Usually paid TO the Town (application, permit,
    # dockage, license, key-money fees); never counted as a Town cost.
    ("fee", re.compile(r"\bfees?\b|dockage|key\s+money|surcharge|\brent\b|license\s+agreement|consideration", re.I)),
    # Borrowing: real money, owed through future levies rather than paid now.
    ("debt", re.compile(
        r"\bbonds?\b|bond\s+anticipation|\bnotes?\b|borrow|maximum\s+estimated\s+cost|estimated\s+maximum\s+cost", re.I)),
    ("fund-balance", re.compile(r"fund\s+balance", re.I)),
    # A figure describing something already done -- a project "considered
    # complete at a cost of $127,646.68", money "unspent" and "returned", a
    # contract awarded "by Resolution 2025-...", an estimate for which "a budget
    # transfer was authorized" a year earlier (2026-471) -- is background, not
    # what this resolution commits.
    ("context", re.compile(
        r"\bcomplete[d]?\b|unspent|\breturned?\b|leaving|previously|(?:by|under|pursuant\s+to)\s+"
        r"(?:Town\s+Board\s+)?Resolution|adopted\s+on|decommission|appraisal\s+of|appraised\s+value"
        r"|transferred\s+back|subsequent\s+to|(?:was|were|had\s+been)\s+(?:previously\s+)?"
        r"(?:authorized|approved|awarded)"
        # Proceeds an earlier contract already earmarks (2026-641: "$660,000.00 is
        # contractually designated to various Town Square projects").
        r"|contractually\s+designated", re.I)),
    ("petty-cash", re.compile(r"petty\s+cash", re.I)),
    ("cost", re.compile(
        r"not\s+to\s+exceed|at\s+a\s+cost|total\s+cost|cost\s+of|purchase|payment\s+of|authorizes?\s+payment"
        r"|change\s+order|award(?:s|ed)?\s+(?:the\s+)?(?:bid|contract)|lowest\s+(?:responsible\s+)?bidder"
        r"|contract\s+(?:price|amount|sum)|in\s+the\s+amount\s+of|the\s+sum\s+of|lump\s+sum|compensation"
        r"|retainer|consult", re.I)),
]


def _quote(body: str, start: int, end: int) -> str:
    """The words around a figure, whitespace collapsed, cut at word boundaries."""
    a, b = max(0, start - 110), min(len(body), end + 40)
    snippet = " ".join(body[a:b].split())
    if a > 0 and " " in snippet:
        snippet = "…" + snippet.split(" ", 1)[1]
    if b < len(body) and " " in snippet:
        snippet = snippet.rsplit(" ", 1)[0] + "…"
    return snippet


def stated_amounts(body: str) -> list[dict]:
    """Every dollar figure a resolution's own text states, labelled and quoted.

    `clause` is where it sits: "whereas" (the recitals), "resolved" (what the
    Board orders) or "table" (a budget-adjustment line naming an account).
    """
    body = PACKET_NOISE.sub("", body)
    clauses = [(m.start(), m.group(1).lower()) for m in CLAUSE_WORD.finditer(body)]
    out: list[dict] = []
    seen: set[tuple[float, str]] = set()
    for m in STATED_MONEY.finditer(body):
        scale = MONEY_SCALE.get((m.group(2) or "").lower(), 1)
        amount = round(float(m.group(1).replace(",", "").rstrip(".")) * scale, 2)
        if amount < 1:
            continue
        prior = [c for c in clauses if c[0] < m.start()]
        clause_start, clause = prior[-1] if prior else (0, "heading")
        line_start = body.rfind("\n", 0, m.start()) + 1
        if FULL_ACCOUNT_RE.search(body[line_start:m.start()]):
            role, clause = "budget-line", "table"
        else:
            before = body[max(clause_start, m.start() - 240):m.start()]
            tail = body[m.end():m.end() + 80]
            stop = re.search(r";|\.\s", tail)
            window = f"{before} {tail[:stop.start()] if stop else tail}"
            role = next((name for name, pat in STATED_ROLES if pat.search(window)), "other")
        if role == "insurance" or (amount, role) in seen:
            continue
        seen.add((amount, role))
        out.append({"amount": amount, "role": role, "clause": clause, "quote": _quote(body, m.start(), m.end())})
    return out


# A resolution applying for a grant lists what the grant would pay for --
# "for the purchase of equipment in the amount of $1.545M" (2026-211) -- which
# is funding requested, not the Town spending.
GRANT_APPLICATION = re.compile(r"\bappl(?:y|ies|ication)\b.*\b(?:grant|funding|funds)\b|\b(?:grant|funding)\b.*\bapplication\b", re.I)


# How a recital describes a program on offer, as opposed to money the Town has.
PROGRAM_OFFER = re.compile(r"opportunit|offers?\s+funding|available\s+(?:through|statewide)", re.I)


def mark_program_totals(amounts: list[dict]) -> list[dict]:
    """A grant program's size, recited before what the Town applies for, is not
    money coming in: "a GTSC grant opportunity that would provide funding in
    the amount up to $54,000,000.00", then "apply for funding in the amount of
    $13,045.00" (2026-773). A recital figure that describes a program on offer
    and is larger than the money the Board resolves to seek is the program's.
    A donation is not a program, though the Board may place only part of it
    (2026-643: a $2,000 gift, $1,000 placed)."""
    sought = [a["amount"] for a in amounts if a["role"] == "revenue" and a["clause"] == "resolved"]
    if not sought:
        return amounts
    return [{**a, "role": "program"}
            if a["role"] == "revenue" and a["clause"] == "whereas" and a["amount"] > max(sought)
            and PROGRAM_OFFER.search(a["quote"]) else a
            for a in amounts]


def statement_below_table(funding: dict | None, amounts: list[dict]) -> dict | None:
    """Section G names less than the budget adjustment the resolution orders:
    2026-765's statement says $150,000, while its table moves $280,000 out of
    Appropriated Fund Balance. A section G figure larger than every table line
    is often their sum (two $1,000 donations, 2026-643), so only a smaller one
    that matches no line is flagged."""
    g = (funding or {}).get("amount")
    table = [a["amount"] for a in amounts if a["role"] == "budget-line"]
    if not g or not table or g >= max(table) or any(abs(g - t) < 0.5 for t in table):
        return None
    return {"statement": g, "table": max(table)}


def stated_cost(amounts: list[dict]) -> float | None:
    """The largest figure the resolution states as the Town paying out.

    What the Board orders (a RESOLVED clause) outranks the recitals: a recital
    can list every bid received, while the resolved clause names the one
    awarded.
    """
    costs = [a for a in amounts if a["role"] == "cost"]
    operative = [a["amount"] for a in costs if a["clause"] == "resolved"]
    pool = operative or [a["amount"] for a in costs]
    return max(pool) if pool else None


def _field(block_text: str, label_pat: str) -> str:
    m = re.search(label_pat, block_text)
    if not m:
        return ""
    rest = block_text[m.end():]
    end = NEXT_HEADING.search(rest)
    return " ".join((rest[: end.start()] if end else rest[:400]).split()).strip()


def parse_packet(text: str) -> list[dict]:
    marker = "FISCAL IMPACT STATEMENT"
    starts = [m.start() for m in re.finditer(marker, text)]
    headers = [(m.start(), m.end(), m.group(1)) for m in RES_HEADER.finditer(text)]
    out = []
    for i, start in enumerate(starts):
        b = text[start + len(marker): starts[i + 1] if i + 1 < len(starts) else len(text)]
        # The resolution a statement belongs to is the one printed just above it,
        # after the previous statement. Matching on title instead put two
        # back-to-back "Appoints a Call-In Park Attendant" statements on the
        # first of the pair (2026-229 for 2026-230) and found nothing at all for
        # one 2026-05-20 statement.
        floor = starts[i - 1] if i else 0
        header = next((h for h in reversed(headers) if floor <= h[0] < start), None)
        body = text[header[1]:start].split("THE VOTE")[0] if header else ""
        d = re.search(r"Will the Proposed Legislation have a Fiscal Impact:\s*(Yes|No)", b)
        if not d:
            continue
        title = _field(b, r"Title of Proposed Legislation:")
        purpose = _field(b, r"Purpose of Proposed Legislation:")
        if not title:
            continue
        fiscal_impact = d.group(1)
        # Treatment: (a) absorbed if initials follow the (a) line; else described.
        absorbed = bool(re.search(r"\(a\)\s*\nDetail/Initials:\s*[A-Za-z]", b))
        treatment = "absorbed" if absorbed else "described"
        amounts = stated_amounts(body)
        if GRANT_APPLICATION.search(title):
            amounts = [{**a, "role": "revenue"} if a["role"] == "cost" else a for a in amounts]
        amounts = mark_program_totals(amounts)
        out.append({
            "title": title,
            "purpose": purpose,
            "fiscalImpact": fiscal_impact,
            "treatment": treatment,
            "funding": funding_from_block(b, title, purpose),
            "printedNumber": header[2] if header else None,
            "statedAmounts": amounts,
            "statedCost": stated_cost(amounts),
            "closesProject": closes_project(body),
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


def count_summary(resolutions: list[dict]) -> dict:
    """The Town's Yes/No answers and this read's corrections, counted."""
    flag = [(r.get("realistic") or {}).get("flag") for r in resolutions]
    answer = [r.get("townFiscalImpact") for r in resolutions]
    return {
        "total": len(resolutions),
        "markedNo": answer.count("No"),
        "markedYes": answer.count("Yes"),
        "understated": sum(f in ("understated", "reserve-draw") for f in flag),
        "understatedMarkedNo": sum(a == "No" and f == "understated" for a, f in zip(answer, flag)),
    }


def largest_understated_marked_no(resolutions: list[dict]) -> list | None:
    """[amount, number, title] of the largest amount on a resolution the Town
    answered "no fiscal impact" and this read calls understated: the shape the
    hand-curated 2026-07-07 file uses and /fiscal-impact/ reads. A "No" on a
    developer's security release is not understated, however large."""
    best = max((r for r in resolutions if r.get("amount") and r.get("townFiscalImpact") == "No"
                and (r.get("realistic") or {}).get("flag") == "understated"),
               key=lambda r: r["amount"], default=None)
    return [best["amount"], best.get("number"), best.get("title")] if best else None


def derived_summary(resolutions: list[dict]) -> dict:
    """The summary figures read from each statement's section G and each
    resolution's own text, as opposed to its amounts and Yes/No reads.

    A hand-curated meeting keeps the counts and amounts a person computed, but
    these come from the parse attached to every merged resolution, so they are
    recomputed for it too; kept from the hand file, they would be missing."""
    funding = [r.get("funding") or {} for r in resolutions]
    stated_no = [r for r in resolutions if r.get("statedCost") and r.get("townFiscalImpact") == "No"]
    largest = max(stated_no, key=lambda r: r["statedCost"], default=None)
    return {
        # Sub-account coverage: how much of this meeting's read rests on the
        # Town's own accounting rather than on a keyword match against the
        # resolution title.
        "withAccounts": sum(1 for f in funding if f.get("accounts")),
        "accountEvidence": sum(1 for r in resolutions if (r.get("realistic") or {}).get("evidence") == "account-code"),
        "fundBalanceDraws": sum(1 for f in funding if f.get("drawsFundBalance")),
        "fundBalanceDrawTotal": round(sum(f.get("fundBalanceDraw") or 0 for f in funding), 2),
        # Resolutions whose own text states a cost, and those of them the Town
        # answered "No" fiscal impact on.
        "statedCostResolutions": sum(1 for r in resolutions if r.get("statedCost")),
        "statementBelowTable": sum(1 for r in resolutions if r.get("statementBelowTable")),
        "statedCostMarkedNo": len(stated_no),
        "largestStatedCostMarkedNo": {"number": largest.get("number"), "amount": largest["statedCost"]} if largest else None,
    }


def build_meeting(date: str, packet_text: str) -> dict | None:
    meeting_path = MEETINGS / f"{date}.json"
    meeting = json.loads(meeting_path.read_text()) if meeting_path.exists() else {"resolutions": []}
    # A preliminary meeting has no vote record yet, so "resolutions" is empty
    # and the resolution numbers live in "docket" instead. Without this fallback
    # every row for such a meeting came through with number: null, which is what
    # the Fiscal Impact table's empty "Res #" column was showing.
    meeting_res = meeting.get("resolutions") or meeting.get("docket") or []

    parsed = parse_packet(packet_text)
    if not parsed:
        return None

    by_number = {r.get("number"): r for r in meeting_res if r.get("number")}
    resolutions = []
    for seq, p in enumerate(parsed, start=1):
        printed = p.get("printedNumber")
        matched = by_number.get(printed) if printed else None
        number_source = "printed" if matched else None
        if matched is None:
            matched = match_resolution(p["title"], meeting_res)
            number_source = "title" if matched else None
        category = classify(p["title"], p["purpose"])
        funding = p.get("funding") or {}
        realistic = apply_funding_evidence(
            realistic_read(category, p["fiscalImpact"], p["title"]), funding, category
        )
        if p.get("closesProject"):
            realistic = closeout_read(realistic, p["fiscalImpact"])
        vote = None
        if matched:
            vote = {
                "adopted": matched.get("adopted"),
                "tag": matched.get("tag"),
                "ayes": matched.get("ayesCount"),
                "nays": matched.get("naysCount"),
            }
        number = matched.get("number") if matched else printed
        if number and number_source is None:
            number_source = "printed"
        resolutions.append({
            "number": number,
            "numberSource": number_source,
            "seq": seq,
            "title": p["title"],
            "category": category,
            "townFiscalImpact": p["fiscalImpact"],
            "townTreatment": p["treatment"],
            # Read from the statement's own section G rather than guessed. Still
            # None when the Town named no figure — most statements do not.
            "amount": funding.get("amount"),
            "funding": funding,
            # What the resolution's own text states, beside the Town's answer
            # on the statement. statedCost is null when no figure reads as the
            # Town paying out.
            "statedAmounts": p.get("statedAmounts") or [],
            "statedCost": p.get("statedCost"),
            # Section G naming less than the resolution's own budget table moves.
            "statementBelowTable": statement_below_table(funding, p.get("statedAmounts") or []),
            "realistic": realistic,
            "vote": vote,
        })

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
            "the resolution's category. The amount comes from section G of the statement, where the preparer "
            "wrote one. Separately, every dollar figure the resolution's own text states is listed and quoted, "
            "each labelled by its wording (a cost, a pay rate, a fee paid to the Town, a grant, a fund-balance "
            "transfer, a budget-adjustment line or background); insurance limits an applicant must carry are left "
            "out. The stated cost is the largest figure that reads as the Town paying out, taking what the Board "
            "resolves over the recitals. Where section G names less than the resolution's own budget table moves, "
            "both figures are shown."
        ),
        "summary": {
            **count_summary(resolutions),
            # Now that section G is read, these are real: the sum of every amount
            # the Town itself wrote on a statement at this meeting, and the
            # largest one it wrote while answering "no fiscal impact".
            "identifiedDollarsAtStake": round(sum(r["amount"] for r in resolutions if r["amount"]), 2),
            "pricedResolutions": sum(1 for r in resolutions if r["amount"] is not None),
            "largestUnderstatedMarkedNo": largest_understated_marked_no(resolutions),
            **derived_summary(resolutions),
        },
        "resolutions": resolutions,
    }


def agenda_packet_file_id(event: dict) -> int | None:
    for f in (event.get("publishedFiles") or []):
        if f.get("type") == "Agenda Packet":
            return f.get("fileId")
    return None



def merge_hand_curated(date: str, parsed: dict) -> dict:
    """Layer a hand-curated file's dollar amounts back onto a fresh parse.

    The hand work and the parse each know something the other does not. The
    hand file carries amounts a human read out of the packet -- 2026-641's
    $2,625,000 Town Square BAN paydown, among thirteen others the parser
    returns as None or reads differently. The parse carries the section G
    account codes, which say which FUND and which GASB tier the money comes
    from, and no hand file here has them at all.

    So neither replaces the other. A hand amount always wins; a parsed amount
    fills a hand blank; a resolution only the hand file has is kept; and the
    parsed funding section is attached either way. The summary is computed
    from the merged resolutions, with the hand file's own definition of
    dollars in play (see below).
    """
    path = MEETINGS / f"{date}-fiscal.json"
    if not path.exists():
        return parsed
    hand = json.loads(path.read_text(encoding="utf-8"))
    hand_by_num = {r["number"]: r for r in hand.get("resolutions", []) if r.get("number")}
    parsed_by_num = {r["number"]: r for r in parsed.get("resolutions", []) if r.get("number")}

    kept_amounts = 0
    filled_amounts = 0
    out = []
    for res in hand.get("resolutions", []):
        merged = dict(res)
        p = parsed_by_num.get(res.get("number"))
        if p is not None:
            if p.get("funding"):
                merged["funding"] = p["funding"]
            for key in ("numberSource", "statedAmounts", "statedCost", "statementBelowTable"):
                merged[key] = p.get(key)
            if merged.get("amount") is None and p.get("amount") is not None:
                merged["amount"] = p["amount"]
                filled_amounts += 1
            elif merged.get("amount") is not None and p.get("amount") != merged.get("amount"):
                kept_amounts += 1
        out.append(merged)

    dropped = [n for n in parsed_by_num if n not in hand_by_num]
    for number in dropped:
        out.append(parsed_by_num[number])

    result = dict(hand)
    result["resolutions"] = out
    # Every summary figure is recomputed from the merged list, so it cannot
    # drift from the hand amounts again: 2026-642's $7,212,941 was added to the
    # hand file in September and never reached its stored total. The hand
    # file's definition of dollars in play is kept -- the amounts on the
    # resolutions it reads as understated or drawing reserves -- which
    # reproduces the $3,622,209 it was built with.
    corrections = [r for r in out if r.get("amount")
                   and (r.get("realistic") or {}).get("flag") in ("understated", "reserve-draw")]
    result["summary"] = {
        **(hand.get("summary") or {}),
        **count_summary(out),
        "identifiedDollarsAtStake": round(sum(r["amount"] for r in corrections), 2),
        "pricedResolutions": sum(1 for r in out if r.get("amount") is not None),
        "largestUnderstatedMarkedNo": largest_understated_marked_no(out),
        **derived_summary(out),
    }
    with_funding = sum(1 for r in out if r.get("funding"))
    print(
        f"  {date}: hand-curated merge — {with_funding}/{len(out)} now carry funding, "
        f"{kept_amounts} hand amounts kept over a differing parse, {filled_amounts} blanks filled, "
        f"{len(dropped)} parsed-only added"
    )
    return result

def main() -> int:
    force = "--force" in sys.argv
    # --packet-dir DIR reads each packet's extracted text from DIR/<date>.txt
    # when it is there instead of downloading the PDF again, so the parse can be
    # re-run and checked without fetching every packet each time.
    packet_dir = Path(sys.argv[sys.argv.index("--packet-dir") + 1]) if "--packet-dir" in sys.argv else None
    events = list_events()
    print(f"Town Board events since {SINCE[:10]}: {len(events)}")
    generated: list[str] = []

    for e in events:
        date = e["startDateTime"][:10]
        fid = agenda_packet_file_id(e)
        if not fid:
            continue
        cached = packet_dir / f"{date}.txt" if packet_dir else None
        try:
            if cached and cached.exists():
                text = cached.read_text(encoding="utf-8")
            else:
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
        if date in PROTECTED:
            meeting = merge_hand_curated(date, meeting)
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
