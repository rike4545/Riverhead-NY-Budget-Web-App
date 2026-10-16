#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

from pdf_limits import raise_town_document_limits

raise_town_document_limits()

INDEX_URL = 'https://www.townofriverheadny.gov/206/Financial-Reports'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'web' / 'public' / 'data' / 'financial-reports'
DOCS = OUT / 'documents'
CACHE = ROOT / '.cache' / 'financial-reports'
MONEY = re.compile(r'\$?\(?\d{1,3}(?:,\d{3})+(?:\.\d{2})?\)?')
# A four-digit year from 2000 on, not inside a longer number. Not \b: the Town
# posted the 2027 Budget Supplement as "_2027 Budget Supplement", and an
# underscore is a word character, so \b2027 never matched. The Supplement was
# filed with no year, where nothing that reads a year's Supplement looks.
YEAR = re.compile(r'(?<!\d)(20\d{2})(?!\d)')
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


def year_of(title: str) -> int | None:
    m = YEAR.search(title)
    return int(m.group(1)) if m else None


def slugify(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:120]


def category(title: str) -> str:
    """The document's place in the budget cycle, from the Town's own title.

    Town Law sections 106-109 make these three different documents, not three
    drafts of one: the Tentative is the budget officer's recommendation, the
    Preliminary is that plus whatever the Board changes and is what the public
    hearing is held on, and only the Adopted budget appropriates anything.

    Checked before the stages: a supplement is the line-item companion to a
    Tentative, and "Proposed Changes to Preliminary Budget" is a list of
    amendments rather than a budget. Both used to fall through to a stage or to
    "other", so the 2020 amendment list was counted as a Preliminary budget.

    The Tentative and Preliminary match on both words anywhere in the title.
    Every year on file is titled "2026 Tentative Budget (PDF)", but the
    release watcher sees a new budget only through this function, so a title
    worded otherwise ("2027 Tentative Operating Budget") must still count.
    """
    t = title.lower()
    if 'supplement' in t:
        return 'budget_supplement'
    if 'proposed changes' in t or 'amendments to' in t:
        return 'budget_changes'
    if 'adopted budget' in t or 'final budget' in t:
        return 'adopted_budget'
    if 'tentative' in t and 'budget' in t:
        return 'tentative_budget'
    if 'preliminary' in t and 'budget' in t:
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
            year = year_of(title)
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


# Seconds to wait before the second and third tries at a document. On October
# 14, 2026 three of the Town's PDFs timed out while the rest downloaded; one
# blip should not cost a document. A connection the Town's server has not
# accepted in 30 seconds is tried again rather than waited on for two minutes.
RETRY_WAITS = (5, 20)
TIMEOUT = (30, 120)


def transient(exc: Exception) -> bool:
    """A failure worth trying again: no connection, no answer, or a server error."""
    if isinstance(exc, (requests.ConnectionError, requests.Timeout)):
        return True
    response = getattr(exc, 'response', None)
    return isinstance(exc, requests.HTTPError) and response is not None and (response.status_code >= 500 or response.status_code == 429)


def download(link: Link) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f'{link.slug}.pdf'
    if path.exists() and path.stat().st_size:
        return path
    for attempt, wait in enumerate((*RETRY_WAITS, None), start=1):
        try:
            r = requests.get(link.url, timeout=TIMEOUT, headers=HEADERS)
            r.raise_for_status()
            break
        except requests.RequestException as exc:
            if wait is None or not transient(exc):
                raise
            print(f'  {link.title}: try {attempt} failed ({exc}); trying again in {wait} seconds')
            time.sleep(wait)
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


def page_records(doc: dict, texts: list[str], doc_hash: str, doc_ts: str):
    """A document's pages, search records, citations and line-item candidates,
    from the text of each page. A fresh parse and a kept one both come through
    here, so a kept document is written exactly as its last parse was."""
    slug, title, url, year, cat = doc['slug'], doc['title'], doc['url'], doc['year'], doc['category']
    pages, search, cites, lines = [], [], [], []
    money_count = 0
    for page_no, text in enumerate(texts, start=1):
        values = MONEY.findall(text)
        money_count += len(values)
        conf = confidence(text, values)
        pages.append({'page': page_no, 'text': text, 'money_values': values[:500], 'line_count': len(text.splitlines()), 'confidence': conf})
        snippet = ' '.join(text.split())[:500]
        search.append({'id': f'{slug}-p{page_no}', 'document': title, 'slug': slug, 'year': year, 'category': cat, 'page': page_no, 'url': url, 'text': text, 'snippet': snippet, 'money_values': values, 'confidence': conf, 'parsed_at': doc_ts})
        cites.append({'id': f'{slug}-p{page_no}', 'document': title, 'url': url, 'page': page_no, 'snippet': snippet, 'confidence': conf, 'sha256': doc_hash, 'parsed_at': doc_ts})
        for line_no, line in enumerate(text.splitlines(), start=1):
            vals = MONEY.findall(line)
            if not vals:
                continue
            code = ACCOUNT.search(line)
            lines.append({'id': f'{slug}-p{page_no}-l{line_no}', 'document': title, 'slug': slug, 'year': year, 'category': cat, 'page': page_no, 'line_number': line_no, 'raw_text': line, 'account_code_candidate': code.group(0) if code else None, 'amounts': vals, 'confidence': 'medium' if code else 'low', 'source_url': url, 'parsed_at': doc_ts})
    return pages, money_count, search, cites, lines


# Everything a kept document's records are built from (page_records), and what
# the index carries for it. A year may be blank; nothing else may be missing.
KEPT_FIELDS = ('title', 'url', 'category', 'slug', 'sha256', 'parsed_at')


def last_parse(url: str, previous: dict) -> tuple[dict, dict] | None:
    """The index entry and document file this address had after the last run,
    if both are still there, complete and in agreement, so a document that
    cannot be fetched now can be kept as it was rather than dropped."""
    entry = previous.get(url.split('?')[0])
    if not entry or 'year' not in entry or any(not entry.get(field) for field in KEPT_FIELDS):
        return None
    path = DOCS / f"{entry['slug']}.json"
    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None
    pages = payload.get('pages')
    if payload.get('sha256') != entry['sha256'] or not isinstance(pages, list) or not pages:
        return None
    return entry, payload


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    parsed_at = datetime.now(timezone.utc).isoformat()
    # Reuse a document's previous parsed_at when its content (sha256) is
    # unchanged, so an unchanged PDF yields byte-identical output. Otherwise the
    # wall-clock timestamp rewrote every document/record every run, and
    # concurrent ETL runs then collided on a rebase across all ~137 documents.
    prev_parsed_at: dict = {}
    # The same, by address. A document whose slug changes (a year read from its
    # title for the first time) keeps the time it was first found, and its file
    # under the old "unknown-" slug is removed rather than left beside the new one.
    prev_by_url: dict = {}
    prev_slug: dict = {}
    # Each address's whole entry, so a document that cannot be fetched this
    # run keeps its last parse (see last_parse).
    prev_entry: dict = {}
    prev_index_path = OUT / 'index.json'
    if prev_index_path.exists():
        try:
            prev_index = json.loads(prev_index_path.read_text(encoding='utf-8'))
            for d in prev_index.get('documents', []):
                slug, sha, ts, url = d.get('slug'), d.get('sha256'), d.get('parsed_at'), (d.get('url') or '').split('?')[0]
                if slug and sha and ts:
                    prev_parsed_at[(slug, sha)] = ts
                    if url:
                        prev_by_url[(url, sha)] = ts
                if slug and url:
                    prev_slug[url] = slug
                if url:
                    prev_entry[url] = d
        except Exception:
            pass
    doc_timestamps: list = []
    docs = []
    failures = []
    search_records = []
    citations = []
    line_candidates = []

    links = discover()
    print(f'discovered {len(links)} candidate financial-report PDFs')
    # With the index page unreachable only the built-in fallbacks are left.
    # Writing those over a full parse would drop every other document from the
    # site, and from everything built on it, and the deploy would commit that.
    # So keep the last good parse; run_ingestion_safe.py carries on without it.
    if len(links) <= len(DIRECT_PDFS) and len(prev_parsed_at) > len(DIRECT_PDFS):
        print(f'keeping the previous parse of {len(prev_parsed_at)} documents: the financial reports index could not be read')
        return 1
    seen_hashes: dict[str, tuple[str, str]] = {}

    for link in links:
        try:
            pdf = download(link)
            doc_hash = sha256(pdf)
            # The Town's page sometimes links one file twice under two titles
            # ("2026 Preliminary Budget" and "2026 Preliminary Budget (PDF)" are
            # byte-identical). Parsing both put every page in search twice.
            if doc_hash in seen_hashes:
                kept_title, kept_slug = seen_hashes[doc_hash]
                print(f'skipped {link.title}: same file as {kept_title}')
                # Only a file under a different name is stale. The Town also
                # links one document at two addresses under one title ("…/2835/
                # 2026-Preliminary-Budget" and "…-PDF"); both get the same slug,
                # and deleting "the duplicate's" file deleted the one just
                # written, so the index listed documents that were not there.
                if link.slug != kept_slug:
                    (DOCS / f'{link.slug}.json').unlink(missing_ok=True)
                continue
            seen_hashes[doc_hash] = (link.title, link.slug)
            reader = PdfReader(str(pdf))
            doc_ts = prev_parsed_at.get((link.slug, doc_hash)) or prev_by_url.get((link.url.split('?')[0], doc_hash), parsed_at)
            texts = []
            page_failures = []
            for page_no, page in enumerate(reader.pages, start=1):
                try:
                    text = page.extract_text() or ''
                except Exception as exc:
                    text = ''
                    page_failures.append({'title': link.title, 'url': link.url, 'page': page_no, 'error': f'page text extraction failed: {exc}'})
                texts.append('\n'.join(line.rstrip() for line in text.splitlines() if line.strip()))
            pages, money_count, doc_search, doc_cites, doc_lines = page_records(asdict(link), texts, doc_hash, doc_ts)
            payload = {**asdict(link), 'sha256': doc_hash, 'page_count': len(pages), 'money_value_count': money_count, 'pages': pages, 'parsed_at': doc_ts}
            (DOCS / f'{link.slug}.json').write_text(json.dumps(payload, indent=2), encoding='utf-8')
            # Only a document filed before with no year: when the index page is
            # unreachable the fallback links carry older slugs for documents
            # that are filed under dated ones, and those files must survive.
            renamed = prev_slug.get(link.url.split('?')[0])
            if renamed and renamed != link.slug and renamed.startswith('unknown-'):
                (DOCS / f'{renamed}.json').unlink(missing_ok=True)
            docs.append({'title': link.title, 'url': link.url, 'year': link.year, 'category': link.category, 'slug': link.slug, 'json': f'documents/{link.slug}.json', 'page_count': len(pages), 'money_value_count': money_count, 'sha256': doc_hash, 'parsed_at': doc_ts})
            # Only a document that got this far adds its records, so a failure
            # partway through leaves no stray pages in search.
            doc_timestamps.append(doc_ts)
            search_records.extend(doc_search)
            citations.extend(doc_cites)
            line_candidates.extend(doc_lines)
            failures.extend(page_failures)
            print(f'parsed {link.title} ({len(pages)} pages, {money_count} money values)')
        except Exception as exc:
            # Dropping the document would drop it from the index, search, the
            # citations, and every dataset built from them (the Community
            # Preservation Fund lost its 2022 year this way), and the job
            # would commit that. Keep its last parse instead, and say so.
            kept = last_parse(link.url, prev_entry)
            # Not if this run already parsed the same file under another name.
            twin = seen_hashes.get(kept[0]['sha256']) if kept else None
            if kept is None or (twin is not None and twin[1] != link.slug):
                failures.append({'title': link.title, 'url': link.url, 'error': str(exc)})
                print(f'failed {link.title}: {exc}')
                continue
            entry, stored = kept
            # This runs inside the handler, so nothing it raises is caught for
            # it: a last parse that cannot be rebuilt leaves the document out,
            # as before this fallback existed, rather than ending the run.
            try:
                _, _, doc_search, doc_cites, doc_lines = page_records(entry, [page.get('text', '') for page in stored['pages']], entry['sha256'], entry['parsed_at'])
            except Exception as rebuild:
                failures.append({'title': link.title, 'url': link.url, 'error': f'{exc}. Its last parse could not be reused: {rebuild}'})
                print(f'failed {link.title}: {exc}; its last parse could not be reused: {rebuild}')
                continue
            seen_hashes[entry['sha256']] = (entry['title'], entry['slug'])
            docs.append(entry)
            doc_timestamps.append(entry['parsed_at'])
            search_records.extend(doc_search)
            citations.extend(doc_cites)
            line_candidates.extend(doc_lines)
            since = str(entry['parsed_at'])[:10]
            failures.append({'title': link.title, 'url': link.url, 'error': f'{exc}. Its last parse, from {since}, is kept.'})
            print(f'::warning title=Financial report not refreshed::{link.title} could not be fetched or read ({exc}). Its last parse, from {since}, is kept; the next run tries again.')

    # Dataset-level timestamp = the newest per-document timestamp. It only
    # advances when at least one document actually changed, so a no-change run
    # leaves every output byte-identical (nothing to commit, nothing to conflict).
    dataset_ts = max(doc_timestamps) if doc_timestamps else parsed_at
    index = {'source_index': INDEX_URL, 'parsed_at': dataset_ts, 'document_count': len(docs), 'audit_document_count': sum(1 for d in docs if d['category'] == 'audit'), 'failure_count': len(failures), 'page_record_count': len(search_records), 'citation_count': len(citations), 'line_item_candidate_count': len(line_candidates), 'documents': docs, 'failures': failures}
    (OUT / 'index.json').write_text(json.dumps(index, indent=2), encoding='utf-8')
    (OUT / 'search-index.json').write_text(json.dumps({'parsed_at': dataset_ts, 'records': search_records}, indent=2), encoding='utf-8')
    (OUT / 'citations.json').write_text(json.dumps({'parsed_at': dataset_ts, 'records': citations}, indent=2), encoding='utf-8')
    (OUT / 'line-item-candidates.json').write_text(json.dumps({'parsed_at': dataset_ts, 'records': line_candidates}, indent=2), encoding='utf-8')
    (OUT / 'extraction-report.json').write_text(json.dumps(index, indent=2), encoding='utf-8')
    print(f'parsed documents: {len(docs)}; failures: {len(failures)}')
    return 0 if docs else 1

if __name__ == '__main__':
    raise SystemExit(main())
