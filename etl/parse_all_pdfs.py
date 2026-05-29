#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

INDEX_URL = 'https://www.townofriverheadny.gov/206/Financial-Reports'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'web' / 'public' / 'data' / 'financial-reports'
DOCS = OUT / 'documents'
CACHE = ROOT / '.cache' / 'financial-reports'
MONEY = re.compile(r'\$?\(?\d{1,3}(?:,\d{3})+(?:\.\d{2})?\)?')
YEAR = re.compile(r'\b(20\d{2})\b')
ACCOUNT = re.compile(r'\b[A-Z]{1,3}\d{0,3}(?:[.-]\d{1,5}){1,4}\b')
HEADERS = {
    'User-Agent': 'Mozilla/5.0 RiverheadBudgetLive/1.0 (+public budget transparency parser)',
    'Accept': 'text/html,application/pdf,*/*',
}

@dataclass
class Link:
    title: str
    url: str
    year: int | None
    category: str
    slug: str

DIRECT_PDFS: list[Link] = [
    Link('2025 Annual Financial Report', 'https://www.townofriverheadny.gov/DocumentCenter/View/3513/2025-Annual-Financial-Report', 2025, 'annual_financial_report', '2025-annual-financial-report'),
    Link('2024 Audited Basic Financial Statements', 'https://www.townofriverheadny.gov/DocumentCenter/View/2858/2024-Audited-Basic-Financial-Statements-PDF', 2024, 'audit', '2024-audited-basic-financial-statements'),
    Link('2026 Adopted Budget', 'https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget', 2026, 'adopted_budget', '2026-adopted-budget'),
]


def slugify(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:120]


def category(title: str) -> str:
    t = title.lower()
    if 'adopted budget' in t or 'final budget' in t:
        return 'adopted_budget'
    if 'tentative budget' in t:
        return 'tentative_budget'
    if 'preliminary budget' in t:
        return 'preliminary_budget'
    if 'annual financial report' in t:
        return 'annual_financial_report'
    if 'audited basic financial' in t or 'audited financial' in t or 'audit' in t:
        return 'audit'
    if 'justice court' in t:
        return 'justice_court'
    if 'community preservation' in t or 'peconic bay' in t:
        return 'community_preservation'
    return 'other'


def merge_links(found: list[Link]) -> list[Link]:
    merged: dict[str, Link] = {}
    for link in DIRECT_PDFS + found:
        merged[link.url.split('?')[0]] = link
    return sorted(merged.values(), key=lambda x: ((x.year or 0), x.title), reverse=True)


def discover() -> list[Link]:
    links: list[Link] = []
    try:
        response = requests.get(INDEX_URL, timeout=45, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        seen = set()
        for a in soup.find_all('a'):
            title = ' '.join(a.get_text(' ', strip=True).split())
            href = a.get('href')
            if not title or not href:
                continue
            url = urljoin(INDEX_URL, href)
            if 'DocumentCenter' not in url and not url.lower().endswith('.pdf'):
                continue
            if not re.search(r'20\d{2}|financial|budget|audit|annual|report|justice|community|supplement|statement', title, re.I):
                continue
            key = url.split('?')[0]
            if key in seen:
                continue
            seen.add(key)
            m = YEAR.search(title)
            year = int(m.group(1)) if m else None
            links.append(Link(title, url, year, category(title), slugify(f'{year or "unknown"}-{title}')))
    except Exception as exc:
        print(f'financial reports index unavailable; using direct PDF fallbacks: {exc}')
    return merge_links(links)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def download(link: Link) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f'{link.slug}.pdf'
    if path.exists() and path.stat().st_size:
        return path
    r = requests.get(link.url, timeout=120, headers=HEADERS)
    r.raise_for_status()
    if not r.content.startswith(b'%PDF') and 'pdf' not in r.headers.get('content-type', '').lower():
        raise RuntimeError(f'not a PDF response: {r.headers.get("content-type", "unknown")}')
    path.write_bytes(r.content)
    return path


def confidence(text: str, values: list[str]) -> str:
    if len(text) < 40:
        return 'low'
    if values:
        return 'high'
    return 'medium'


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    parsed_at = datetime.now(timezone.utc).isoformat()
    docs = []
    failures = []
    search_records = []
    citations = []
    line_candidates = []

    links = discover()
    print(f'discovered {len(links)} candidate financial-report PDFs')

    for link in links:
        try:
            pdf = download(link)
            reader = PdfReader(str(pdf))
            doc_hash = sha256(pdf)
            pages = []
            money_count = 0
            for page_no, page in enumerate(reader.pages, start=1):
                try:
                    text = page.extract_text() or ''
                except Exception as exc:
                    text = ''
                    failures.append({'title': link.title, 'url': link.url, 'page': page_no, 'error': f'page text extraction failed: {exc}'})
                text = '\n'.join(line.rstrip() for line in text.splitlines() if line.strip())
                values = MONEY.findall(text)
                money_count += len(values)
                conf = confidence(text, values)
                pages.append({'page': page_no, 'text': text, 'money_values': values[:500], 'line_count': len(text.splitlines()), 'confidence': conf})
                snippet = ' '.join(text.split())[:500]
                search_records.append({'id': f'{link.slug}-p{page_no}', 'document': link.title, 'slug': link.slug, 'year': link.year, 'category': link.category, 'page': page_no, 'url': link.url, 'text': text, 'snippet': snippet, 'money_values': values, 'confidence': conf, 'parsed_at': parsed_at})
                citations.append({'id': f'{link.slug}-p{page_no}', 'document': link.title, 'url': link.url, 'page': page_no, 'snippet': snippet, 'confidence': conf, 'sha256': doc_hash, 'parsed_at': parsed_at})
                for line_no, line in enumerate(text.splitlines(), start=1):
                    vals = MONEY.findall(line)
                    if not vals:
                        continue
                    code = ACCOUNT.search(line)
                    line_candidates.append({'id': f'{link.slug}-p{page_no}-l{line_no}', 'document': link.title, 'slug': link.slug, 'year': link.year, 'category': link.category, 'page': page_no, 'line_number': line_no, 'raw_text': line, 'account_code_candidate': code.group(0) if code else None, 'amounts': vals, 'confidence': 'medium' if code else 'low', 'source_url': link.url, 'parsed_at': parsed_at})
            payload = {**asdict(link), 'sha256': doc_hash, 'page_count': len(pages), 'money_value_count': money_count, 'pages': pages, 'parsed_at': parsed_at}
            (DOCS / f'{link.slug}.json').write_text(json.dumps(payload, indent=2), encoding='utf-8')
            docs.append({'title': link.title, 'url': link.url, 'year': link.year, 'category': link.category, 'slug': link.slug, 'json': f'documents/{link.slug}.json', 'page_count': len(pages), 'money_value_count': money_count, 'sha256': doc_hash, 'parsed_at': parsed_at})
            print(f'parsed {link.title} ({len(pages)} pages, {money_count} money values)')
        except Exception as exc:
            failures.append({'title': link.title, 'url': link.url, 'error': str(exc)})
            print(f'failed {link.title}: {exc}')

    index = {'source_index': INDEX_URL, 'parsed_at': parsed_at, 'document_count': len(docs), 'audit_document_count': sum(1 for d in docs if d['category'] == 'audit'), 'failure_count': len(failures), 'page_record_count': len(search_records), 'citation_count': len(citations), 'line_item_candidate_count': len(line_candidates), 'documents': docs, 'failures': failures}
    (OUT / 'index.json').write_text(json.dumps(index, indent=2), encoding='utf-8')
    (OUT / 'search-index.json').write_text(json.dumps({'parsed_at': parsed_at, 'records': search_records}, indent=2), encoding='utf-8')
    (OUT / 'citations.json').write_text(json.dumps({'parsed_at': parsed_at, 'records': citations}, indent=2), encoding='utf-8')
    (OUT / 'line-item-candidates.json').write_text(json.dumps({'parsed_at': parsed_at, 'records': line_candidates}, indent=2), encoding='utf-8')
    (OUT / 'extraction-report.json').write_text(json.dumps(index, indent=2), encoding='utf-8')
    print(f'parsed documents: {len(docs)}; failures: {len(failures)}')
    return 0 if docs else 1

if __name__ == '__main__':
    raise SystemExit(main())
