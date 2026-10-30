#!/usr/bin/env python3
"""Build reproducible, curated ZIP research packets from canonical public data.

The packets are generated during CI/deploy rather than committed as binaries.
Each contains a checksum manifest, the site's source register and a short guide
that distinguishes official records from calculations and projections.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "web" / "public"
DATA = PUBLIC / "data"
DOWNLOADS = PUBLIC / "downloads"
OUT = DOWNLOADS / "research-packets"

COMMON = [
    ("data/meta.json", "release_metadata"),
    ("data/financial-reports/index.json", "official_source_register"),
]

PACKETS = [
    {
        "id": "2027-budget",
        "filename": "2027-budget-research-packet.zip",
        "title": "2027 Budget Season",
        "description": "The published budget-stage record, the independent 2027 line-item model, tax-cap inputs and the multi-year Supplement data.",
        "readme": (
            "2027 BUDGET SEASON RESEARCH PACKET\n"
            "This bundle keeps the Town's published budget-stage record separate from this site's independent 2027 projection. "
            "The budget-stage history is the official-stage reference; budget-2027-lines.json and budget-2027-prediction.json "
            "are model outputs, not an adopted Town budget or an official Town forecast.\n\n"
            "Use the source register and release metadata to check document titles, dates and dataset status. "
            "The Budget Supplement records show adopted/adjusted account context; they are not interchangeable with the 2027 projection.\n"
            "Riverhead Budget Live is an independent public-information project and is not affiliated with the Town of Riverhead. "
            "Verify consequential figures against the linked original Town records."
        ),
        "files": [
            ("data/history/budget-stages.json", "official_budget_stage_history"),
            ("data/history/budget-adoption.json", "adopted_budget_history"),
            ("data/budget-2027-lines.json", "independent_projection"),
            ("data/budget-2027-prediction.json", "independent_projection"),
            ("data/tax-cap.json", "tax_cap_inputs"),
            ("data/tax-bill.json", "tax_bill_inputs"),
            ("data/budget-supplement/current-lines.json", "supplement_account_lines"),
            ("data/budget-supplement/history.json", "supplement_history"),
            ("data/budget-supplement/current-outliers.json", "supplement_outliers"),
            ("downloads/budget_line_items_2020_2026.csv", "downloadable_account_history"),
            ("downloads/fund_appropriations_2020_2026.csv", "downloadable_fund_history"),
        ],
    },
    {
        "id": "financial-health",
        "filename": "financial-health-research-packet.zip",
        "title": "Financial Health & Reserves",
        "description": "Audited results, General Fund history, fund appropriations, revenue context, capital/workforce exposures and multi-year Supplement results.",
        "readme": (
            "FINANCIAL HEALTH & RESERVES RESEARCH PACKET\n"
            "The 2025 Annual Financial Report dataset contains year-end audited results for the published funds and years. "
            "The historical budget files describe adopted spending authority, not actual expenditures. "
            "Keep those series distinct when comparing budget to results.\n\n"
            "Fund-balance and debt measures have different scopes and dates; consult the source register and release metadata "
            "before combining them. Derived files are provided for reproducibility, not as audited statements.\n"
            "Riverhead Budget Live is an independent public-information project and is not affiliated with the Town of Riverhead."
        ),
        "files": [
            ("data/afr/2025.json", "annual_financial_report"),
            ("data/history/general-fund.json", "general_fund_history"),
            ("data/history/fund-appropriations.json", "adopted_fund_history"),
            ("data/history/budget-adoption.json", "adopted_budget_history"),
            ("data/tax-cap.json", "tax_cap_inputs"),
            ("data/tax-bill.json", "tax_bill_inputs"),
            ("data/road-spending.json", "road_spending"),
            ("data/community.json", "community_context"),
            ("data/retiree-health-comparison.json", "retiree_health_comparison"),
            ("data/buyout-analysis.json", "retirement_incentive_analysis"),
            ("data/officials-pensions.json", "official_pension_records"),
            ("data/budget-supplement/history.json", "supplement_history"),
            ("downloads/afr_actual_results_2023_2025.csv", "downloadable_actual_results"),
            ("downloads/general_fund_2005_2025.csv", "downloadable_general_fund_history"),
            ("downloads/fund_appropriations_2020_2026.csv", "downloadable_fund_history"),
        ],
    },
    {
        "id": "town-board-decisions",
        "filename": "town-board-decisions-research-packet.zip",
        "title": "Town Board Decisions & Votes",
        "description": "Meeting records, fiscal-impact companions, voting records, campaign-finance context and consent-calendar data.",
        "readme": (
            "TOWN BOARD DECISIONS & VOTES RESEARCH PACKET\n"
            "The meeting directory contains the published meeting records and available fiscal-impact companions. "
            "A meeting's resolution text, vote record and financial-impact statement are separate evidence types; "
            "do not infer an amount or vote from a title alone.\n\n"
            "Campaign-finance, consent-calendar and board-election datasets are separate collections and should not be "
            "treated as Town budget appropriations. The source register identifies the underlying official records.\n"
            "Riverhead Budget Live is an independent public-information project and is not affiliated with the Town of Riverhead."
        ),
        "files": [
            ("data/campaign-finance-2026-general.json", "campaign_finance"),
            ("data/campaign-finance.json", "campaign_finance_history"),
            ("data/consent-calendar.json", "consent_calendar"),
            ("data/town-history.json", "town_history"),
            ("data/board-elections.json", "board_elections"),
            ("downloads/town_board_votes.csv", "downloadable_vote_records"),
            ("downloads/board_member_voting_records.csv", "downloadable_member_vote_totals"),
        ],
        "globs": [("data/meetings", "meeting_records", "*.json")],
    },
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def build_packet(packet: dict, output_dir: Path = OUT) -> Path:
    entries: list[tuple[Path, str, str]] = []
    for archive_path, role in COMMON + packet["files"]:
        source = PUBLIC / archive_path
        if not source.is_file():
            raise FileNotFoundError(f"{packet['id']}: required packet input is missing: {source}")
        entries.append((source, archive_path, role))

    for folder, role, pattern in packet.get("globs", []):
        source_dir = DATA / folder.removeprefix("data/")
        matches = sorted(source_dir.glob(pattern))
        if not matches:
            raise FileNotFoundError(f"{packet['id']}: no {pattern} files found in {source_dir}")
        for source in matches:
            archive_path = f"data/{folder.removeprefix('data/')}/{source.name}"
            entries.append((source, archive_path, role))

    # One archive path per source prevents accidental overwrites in the ZIP.
    archive_paths = [item[1] for item in entries]
    if len(archive_paths) != len(set(archive_paths)):
        raise ValueError(f"{packet['id']}: duplicate archive paths")

    meta = json.loads((DATA / "meta.json").read_text(encoding="utf-8"))
    manifest = {
        "schemaVersion": 1,
        "packetId": packet["id"],
        "title": packet["title"],
        "generatedAt": meta.get("generatedAt"),
        "dataVersion": meta.get("dataVersion"),
        "sourceRegister": "data/financial-reports/index.json",
        "contents": [],
    }
    payloads: list[tuple[str, bytes]] = []
    for source, archive_path, role in entries:
        content = source.read_bytes()
        manifest["contents"].append({
            "path": archive_path,
            "role": role,
            "bytes": len(content),
            "sha256": sha256(content),
        })
        payloads.append((archive_path, content))

    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / packet["filename"]
    readme = (
        f"{packet['title'].upper()}\n\n{packet['readme']}\n\n"
        "PACKET CONTENTS\n"
        "See packet-manifest.json for every included path, role, byte count and SHA-256 checksum. "
        "data/meta.json records the build snapshot; data/financial-reports/index.json is the source-document register.\n"
    )
    with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr("README.txt", readme)
        for archive_path, content in payloads:
            archive.writestr(archive_path, content)
        archive.writestr("packet-manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")

    with ZipFile(target, "r") as archive:
        bad_member = archive.testzip()
        if bad_member:
            raise RuntimeError(f"{target.name}: ZIP integrity check failed at {bad_member}")
        names = set(archive.namelist())
        if not {"README.txt", "packet-manifest.json"}.issubset(names):
            raise RuntimeError(f"{target.name}: packet guide or manifest is missing")
        stored_manifest = json.loads(archive.read("packet-manifest.json"))
        for item in stored_manifest["contents"]:
            actual = archive.read(item["path"])
            if len(actual) != item["bytes"] or sha256(actual) != item["sha256"]:
                raise RuntimeError(f"{target.name}: checksum mismatch for {item['path']}")

    print(f"Research packet passed: {target.relative_to(ROOT)} ({len(payloads)} datasets, {target.stat().st_size:,} bytes)")
    return target


def main() -> None:
    meta_path = DATA / "meta.json"
    if not meta_path.is_file():
        raise FileNotFoundError(f"Run the ETL freshness build before packets: {meta_path} is missing")
    for packet in PACKETS:
        build_packet(packet)


if __name__ == "__main__":
    main()
