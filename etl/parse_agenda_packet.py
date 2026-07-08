#!/usr/bin/env python3
"""Extract a realistic, per-resolution fiscal-impact read from a Town Board
agenda packet, and CORRECT the Town's own 'Fiscal Impact Statement' where it
is incomplete or understated.

Every Riverhead resolution carries a standardized "FISCAL IMPACT STATEMENT OF
PROPOSED RIVERHEAD TOWN BOARD LEGISLATION" form:
  D. Will the Proposed Legislation have a fiscal impact?  -> Yes / No
  E. (a) can be absorbed by existing budget [initials]  or (b) described
  F. total Financial Cost of Funding over ___ Years from <source>
  G. Proposed Source of Funding / Appropriation Account

In practice the form is often marked "No" or "absorbed by existing budget" on
items that plainly move money (a $227,683 well-field closure, a $76,500 union
stipulation, new recurring salaries, fee changes with a revenue effect). This
script pulls each form's answer, attaches a verified dollar amount where we have
read it from the resolution's RESOLVED clause, classifies the item, and adds a
plain-English "realistic" assessment that flags where the Town's answer
understates the true budget effect.

Dev helper (needs the 51 MB packet PDF, not committed). Output committed as
web/public/data/meetings/<slug>-fiscal.json.

Usage: python etl/parse_agenda_packet.py /path/packet.pdf 2026-07-07
"""

import json
import re
import sys
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "web/public/data/meetings"
FIRST_RES_NUM = 633  # agenda item 1 == resolution 2026-633 (contiguous)

# Verified dollar amounts + notes, read from each resolution's RESOLVED clause.
# amount is the headline town-budget figure; None where the packet states it
# only in a backup table or as present-value savings. sign: +cost / -saving /
# 0 net-neutral-to-taxpayer (grant, donation, developer escrow).
CURATED = {
    "2026-633": (14368, "Water District capital project #82301 budget adjustment."),
    "2026-634": (227683, "Closure of the USGS test wells — a real capital cost, yet the form marks 'no fiscal impact.'"),
    "2026-635": (13990, "National Grid hydrant relocation, Mill Rd."),
    "2026-636": (7500, "Peconic River Hotel water capital project (developer-driven)."),
    "2026-637": (118919, "EWR 2025–26 highway capital project adjustment."),
    "2026-638": (257000, "New bucket truck for the Street Lighting Division (funded over 2 years)."),
    "2026-639": (60000, "East Creek boat-launch repairs."),
    "2026-640": (2275000, "Suffolk County Water Authority federal pass-through grant — offsetting outside revenue."),
    "2026-641": (2625000, "Uses fund balance to pay down the Town Square bond anticipation note."),
    "2026-642": (None, "Pays down the 2018 Series B refunding — booked as present-value debt-service savings."),
    "2026-643": (2000, "Gabrielsen family donation — revenue in."),
    "2026-644": (313, "PBA donation for the PAL bike rodeo — revenue in."),
    "2026-645": (80000, "Meals-on-Wheels truck for the Seniors Department."),
    "2026-646": (None, "Sets Showmobile usage fees — a revenue change, marked 'no fiscal impact.'"),
    "2026-647": (None, "Amends scavenger-waste fees — a revenue change, marked 'no fiscal impact.'"),
    "2026-648": (4000, "Student Intern II wage (Engineering)."),
    "2026-649": (4000, "Student Intern II wage (Engineering)."),
    "2026-654": (None, "Appoints a full-time Senior Justice Court Clerk — a recurring salary, marked 'no fiscal impact.'"),
    "2026-655": (56749, "Maintenance Mechanic II — recurring salary each, yet marked 'no fiscal impact.'"),
    "2026-677": (76500, "Addendum to the LVF landscape-architecture agreement — professional-services cost."),
    "2026-678": (76500, "CSEA stipulation — a labor settlement with real cost, yet marked 'no fiscal impact.'"),
    "2026-681": (283000, "Release of a developer's performance security — not Town money."),
    "2026-682": (501000, "Release of a developer's letter of credit — not Town money."),
}

# net-neutral-to-taxpayer resolutions (money flows, but not from the tax levy)
NEUTRAL = {"2026-640", "2026-643", "2026-644", "2026-681", "2026-682"}
SAVINGS = {"2026-661", "2026-662"}  # ratified resignations


def categorize(title):
    t = title.lower()
    if "pays bills" in t:
        return "warrant"
    if "stipulation" in t:
        return "labor-contract"
    if any(w in t for w in ("performance security", "letter of credit")):
        return "escrow-neutral"
    if "grant" in t or "pass-through" in t:
        return "grant"
    if "donation" in t or "acceptance of donation" in t:
        return "donation"
    if "pay down" in t or "bond" in t or "ban" in t:
        return "debt"
    if any(w in t for w in ("capital project", "budget adjustment", "budget adoption", "truck", "purchase")):
        return "capital"
    if "resignation" in t:
        return "personnel-out"
    # Unpaid appointments to boards/committees/task forces — no salary cost.
    if any(w in t for w in ("committee", "task force", "advisory", "chairperson")):
        return "appointment-volunteer"
    # An AWARD of a contract/RFP commits money, unlike merely publishing a notice.
    if "award" in t and "publish" not in t:
        return "contract"
    # Publishing notices / posting RFPs is procedural even when the Town Clerk
    # does it, so this must sit BEFORE the personnel test (which keys on "clerk").
    if any(w in t for w in ("publish and post", "publish", "public notice", "notice to bidders",
                            "request for proposals", "post notice", "post request")):
        return "procedural"
    if "adopts local law" in t or "adopt local law" in t or "adopts a local law" in t:
        return "legislative"
    # Purely administrative execution with no dollar commitment.
    if any(w in t for w in ("certification", "point of contact", "information sheet")):
        return "admin"
    if any(w in t for w in ("appoint", "seasonal", "intern", "part-time", "part time",
                            "personnel", "mechanic", "court officers", "operator", "court clerk")):
        return "personnel"
    if "fee" in t:
        return "fees"
    if any(w in t for w in ("special event", "fireworks", "alcohol")):
        return "permit"
    if any(w in t for w in ("license agreement", "addendum", "proposal", "agreement", "execute")):
        return "contract"
    return "other"


def assess(number, category, town_fi, amount):
    """Return (verdict, reason, flag) where flag in {understated, fair, neutral, saving, positive}."""
    a = "${:,.0f}".format(amount) if amount else None
    if number in SAVINGS or category == "personnel-out":
        return ("Actually a saving", "A departure reduces payroll — the opposite of a cost.", "saving")
    if number in NEUTRAL or category in ("grant", "donation"):
        w = "Revenue in / offsetting" if category in ("grant", "donation") else "Net-neutral to taxpayers"
        return (w, "Money flows, but from a grant, donation, or a developer's own escrow — not the tax levy.", "neutral")
    if category == "escrow-neutral":
        return ("Net-neutral to taxpayers", "Releases a developer's security deposit — not Town funds.", "neutral")
    if category in ("procedural", "legislative"):
        return ("No direct cost", "Publishing a notice or advancing a local law has no immediate dollar cost (policy effects come later).", "fair")
    if category == "appointment-volunteer":
        return ("No direct cost", "Appointment to an unpaid advisory board, committee, or task force — no salary attached.", "fair")
    if category == "admin":
        return ("No direct cost", "A routine administrative signature or certification with no dollar commitment.", "fair")
    if category == "permit":
        return ("Minimal / applicant-borne", "Event insurance and costs are carried by the applicant, not the Town.", "fair")
    if category == "warrant":
        return ("This IS the spending", "'Pays Bills' authorizes the meeting's actual disbursement warrant — the single largest money item, marked 'no fiscal impact.'", "understated")
    # cost categories
    if category in ("capital", "debt", "personnel", "labor-contract", "contract", "fees"):
        if town_fi == "No":
            base = "Understated — the form says 'no fiscal impact'"
        else:
            base = "Understated — 'absorbed by existing budget'"
        detail = {
            "capital": "but it commits capital dollars" + (f" (~{a})" if a else "") + ", typically drawn from reserves, fund balance, or borrowing.",
            "debt": "but it spends fund balance" + (f" (~{a})" if a else "") + " to retire debt — a real use of reserves.",
            "personnel": "but it adds recurring or seasonal payroll" + (f" (~{a}/yr)" if a else "") + " that continues in future budgets.",
            "labor-contract": "but a union stipulation carries real, often recurring, labor cost" + (f" (~{a})" if a else "") + ".",
            "contract": ("but it obligates professional-services dollars (~" + a + ")." if a
                         else "but signing an agreement or license has a fiscal dimension — a cost or a revenue — that 'no impact' glosses over."),
            "fees": "but changing fees changes Town revenue — a fiscal effect either way.",
        }[category]
        flag = "understated" if town_fi == "No" else "reserve-draw"
        return (base, base.split("—")[0].strip() + " — " + detail, flag)
    return ("Not scored", "No clear budget effect identified.", "fair")


def build(pdf_path, slug):
    alltext = "\n".join((p.extract_text() or "") for p in pypdf.PdfReader(pdf_path).pages)
    alltext = re.sub(r"For more information visit our website[^\n]*", " ", alltext)
    alltext = re.sub(r"Page \d+ of \d+", " ", alltext)
    alltext = re.sub(r"\s+", " ", alltext)

    anchors = [m.start() for m in re.finditer(r"Fiscal Impact:\s*(Yes|No)", alltext)]
    resolutions = []
    for i, p in enumerate(anchors):
        number = "2026-%d" % (FIRST_RES_NUM + i)
        form = alltext[p: (anchors[i + 1] if i + 1 < len(anchors) else len(alltext))]
        head = alltext[max(0, p - 600): p]
        t = re.search(r"Title of Proposed Legislation:\s*(.*?)\s*C\.\s*Purpose", head, re.S)
        title = re.sub(r"\s+", " ", t.group(1)).strip() if t else "?"
        town_fi = re.search(r"Fiscal Impact:\s*(Yes|No)", form).group(1)
        ea = re.search(r"\(a\)\s*Detail/Initials:\s*([A-Za-z]{1,5})", form)
        treatment = "absorbed" if ea else "described"

        amount, note = CURATED.get(number, (None, None))
        category = categorize(title)
        verdict, reason, flag = assess(number, category, town_fi, amount)
        resolutions.append({
            "number": number, "seq": i + 1, "title": title, "category": category,
            "townFiscalImpact": town_fi, "townTreatment": treatment,
            "amount": amount, "note": note,
            "realistic": {"verdict": verdict, "reason": reason, "flag": flag},
        })

    # attach vote outcomes from the parsed minutes, matched by resolution number
    votes = {}
    vpath = OUTDIR / f"{slug}.json"
    if vpath.exists():
        vt = json.loads(vpath.read_text())
        for r in vt["resolutions"]:
            if r["number"]:
                votes[r["number"]] = {"adopted": r["adopted"], "tag": r["tag"],
                                      "ayes": r["ayesCount"], "nays": r["naysCount"]}
    for r in resolutions:
        r["vote"] = votes.get(r["number"])

    marked_no = [r for r in resolutions if r["townFiscalImpact"] == "No"]
    understated = [r for r in resolutions if r["realistic"]["flag"] in ("understated", "reserve-draw")]
    scored = [r["amount"] for r in resolutions if r["amount"] and r["number"] not in NEUTRAL]
    summary = {
        "total": len(resolutions),
        "markedNo": len(marked_no),
        "markedYes": len(resolutions) - len(marked_no),
        "understated": len(understated),
        "understatedMarkedNo": len([r for r in understated if r["townFiscalImpact"] == "No"]),
        "identifiedDollarsAtStake": round(sum(scored)),
        "largestUnderstatedMarkedNo": max(
            ((r["amount"], r["number"], r["title"]) for r in understated
             if r["townFiscalImpact"] == "No" and r["amount"]), default=None),
    }

    payload = {
        "slug": slug,
        "meetingDate": "July 7, 2026",
        "source": {"title": "Town of Riverhead Town Board Agenda Packet, July 7, 2026 (Fiscal Impact Statements)",
                   "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes"},
        "method": ("Each resolution's Town 'Fiscal Impact Statement' answer is shown as-published, alongside a "
                   "plain-English realistic read. Dollar figures are transcribed from each resolution's RESOLVED "
                   "clause; where the packet states an amount only in a backup table it is left blank rather than guessed."),
        "summary": summary,
        "resolutions": resolutions,
    }
    out = OUTDIR / f"{slug}-fiscal.json"
    out.write_text(json.dumps(payload, indent=1))
    print(f"{out.name}: {len(resolutions)} resolutions | Town marked {summary['markedNo']} 'No' | "
          f"{summary['understated']} understated ({summary['understatedMarkedNo']} of them marked 'No')")
    lu = summary["largestUnderstatedMarkedNo"]
    if lu:
        print(f"  largest 'No' that moves money: ${lu[0]:,.0f} — {lu[1]} {lu[2][:50]}")
    print(f"  identified dollars at stake (cost items): ${summary['identifiedDollarsAtStake']:,.0f}")


if __name__ == "__main__":
    pdf = sys.argv[1] if len(sys.argv) > 1 else "/private/tmp/claude-501/-Users-bryan-Desktop-App-Development-Riverhead-NY-Budget-App/71ffac95-64d6-4e25-8cba-c24510ab197b/scratchpad/packet_0707.pdf"
    slug = sys.argv[2] if len(sys.argv) > 2 else "2026-07-07"
    build(pdf, slug)
