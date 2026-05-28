#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'web' / 'public' / 'data' / 'financial-reports'
DOCS = DATA / 'documents'
INDEX_URL = 'https://www.townofriverheadny.gov/206/Financial-Reports'


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')


def ensure_outputs(error: str | None = None) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    parsed_at = datetime.now(timezone.utc).isoformat()

    index_path = DATA / 'index.json'
    if index_path.exists():
        try:
            existing = json.loads(index_path.read_text(encoding='utf-8'))
            if existing.get('documents'):
                return
        except Exception:
            pass

    audit_stub = {
        'title': 'Audit documents pending parsed ingestion',
        'url': INDEX_URL,
        'year': None,
        'category': 'audit',
        'slug': 'audit-documents-pending-ingestion',
        'json': None,
        'page_count': 0,
        'money_value_count': 0,
        'sha256': None,
        'parsed_at': parsed_at,
        'status': 'pending_parser_success',
    }
    index = {
        'source_index': INDEX_URL,
        'parsed_at': parsed_at,
        'document_count': 0,
        'audit_document_count': 0,
        'failure_count': 1 if error else 0,
        'page_record_count': 0,
        'citation_count': 0,
        'line_item_candidate_count': 0,
        'documents': [audit_stub],
        'failures': [{'title': 'Parser run', 'url': INDEX_URL, 'error': error}] if error else [],
        'warning': 'Parser did not produce full document outputs. The site can still build while ingestion diagnostics are preserved.',
    }
    write_json(DATA / 'index.json', index)
    write_json(DATA / 'search-index.json', {'parsed_at': parsed_at, 'records': []})
    write_json(DATA / 'citations.json', {'parsed_at': parsed_at, 'records': []})
    write_json(DATA / 'line-item-candidates.json', {'parsed_at': parsed_at, 'records': []})
    write_json(DATA / 'extraction-report.json', index)


def main() -> int:
    result = subprocess.run([sys.executable, 'etl/parse_all_pdfs.py'], cwd=ROOT, text=True)
    if result.returncode != 0:
        ensure_outputs(f'parse_all_pdfs.py exited with code {result.returncode}')
        print('Parser returned a non-zero exit code, but safe outputs were written so deploy can continue.')
        return 0
    ensure_outputs(None)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
